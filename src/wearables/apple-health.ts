import { Platform } from 'react-native'
import HealthKit, {
  isHealthDataAvailable,
  queryQuantitySamples,
  queryCategorySamples,
  queryStatisticsForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit'

import { mobileEnv } from '../lib/env'

/**
 * Apple HealthKit wrapper. Mirrors the Health Connect helper shape so Phase 1
 * onboarding + the daily ritual can pull HRV, RHR, sleep, steps, workouts,
 * and weight on iOS.
 *
 * On-device permissions only — Apple Developer account required for the
 * production HealthKit entitlement, but no API keys / OAuth.
 */

const READ_QUANTITY_TYPES = [
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBodyMass',
] as const

const READ_CATEGORY_TYPES = ['HKCategoryTypeIdentifierSleepAnalysis'] as const

export type AppleHealthStatus = 'unavailable_platform' | 'unavailable_device' | 'permissions_unknown' | 'ready'

export type ImportRow = {
  date: string
  resting_hr?: number
  hrv_ms?: number
  sleep_hours?: number
  steps?: number
  active_energy_kcal?: number
  workout_minutes?: number
  workout_load_au?: number
}

export async function getAppleHealthStatus(): Promise<AppleHealthStatus> {
  if (Platform.OS !== 'ios') return 'unavailable_platform'
  try {
    const available = isHealthDataAvailable()
    if (!available) return 'unavailable_device'
    return 'permissions_unknown' // iOS doesn't expose permission state per type for read; trigger request flow.
  } catch {
    return 'unavailable_device'
  }
}

export async function requestAppleHealthPermissions() {
  if (Platform.OS !== 'ios') return false
  return requestAuthorization({
    toRead: [...READ_QUANTITY_TYPES, ...READ_CATEGORY_TYPES] as never,
    toShare: [] as never,
  })
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function dayWindow(daysAgo: number) {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  end.setDate(end.getDate() - daysAgo)
  const start = new Date(end)
  start.setHours(0, 0, 0, 0)
  return { start, end, date: isoDate(start) }
}

export async function readLastDays(days = 7): Promise<ImportRow[]> {
  if (Platform.OS !== 'ios') return []

  const rows: Record<string, ImportRow> = {}
  const ensureDay = (date: string): ImportRow => {
    if (!rows[date]) rows[date] = { date }
    return rows[date]
  }

  for (let i = 0; i < days; i++) {
    const { start, end, date } = dayWindow(i)
    const filter = { date: { startDate: start, endDate: end } } as never

    try {
      const stepsRes = await queryStatisticsForQuantity(
        'HKQuantityTypeIdentifierStepCount',
        ['cumulativeSum' as never],
        { filter, unit: 'count' } as never
      )
      const stepsTotal = (stepsRes as { sumQuantity?: { quantity?: number } })?.sumQuantity?.quantity
      if (typeof stepsTotal === 'number' && stepsTotal > 0) {
        ensureDay(date).steps = Math.round(stepsTotal)
      }
    } catch (err) {
      console.warn('[apple-health] steps query failed', err)
    }

    try {
      const energyRes = await queryStatisticsForQuantity(
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        ['cumulativeSum' as never],
        { filter, unit: 'kcal' } as never
      )
      const kcal = (energyRes as { sumQuantity?: { quantity?: number } })?.sumQuantity?.quantity
      if (typeof kcal === 'number' && kcal > 0) {
        ensureDay(date).active_energy_kcal = Math.round(kcal)
      }
    } catch (err) {
      console.warn('[apple-health] active calories query failed', err)
    }

    try {
      const rhrSamples = await queryQuantitySamples('HKQuantityTypeIdentifierRestingHeartRate', {
        filter,
        unit: 'count/min',
        limit: 24,
      } as never)
      if (Array.isArray(rhrSamples) && rhrSamples.length > 0) {
        const avg =
          rhrSamples.reduce((s, sample) => s + Number((sample as { quantity?: number }).quantity ?? 0), 0) /
          rhrSamples.length
        if (avg > 0) ensureDay(date).resting_hr = Math.round(avg)
      }
    } catch (err) {
      console.warn('[apple-health] resting HR query failed', err)
    }

    try {
      const hrvSamples = await queryQuantitySamples(
        'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        { filter, unit: 'ms', limit: 24 } as never
      )
      if (Array.isArray(hrvSamples) && hrvSamples.length > 0) {
        const avg =
          hrvSamples.reduce(
            (s, sample) => s + Number((sample as { quantity?: number }).quantity ?? 0),
            0
          ) / hrvSamples.length
        if (avg > 0) ensureDay(date).hrv_ms = Math.round(avg)
      }
    } catch (err) {
      console.warn('[apple-health] HRV query failed', err)
    }

    try {
      const sleepSamples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
        filter,
        ascending: true,
        limit: 60,
      } as never)
      let totalMs = 0
      if (Array.isArray(sleepSamples)) {
        for (const sample of sleepSamples) {
          const sampleStart = (sample as { startDate?: Date }).startDate
          const sampleEnd = (sample as { endDate?: Date }).endDate
          const startTs = sampleStart instanceof Date ? sampleStart.valueOf() : Number(sampleStart)
          const endTs = sampleEnd instanceof Date ? sampleEnd.valueOf() : Number(sampleEnd)
          if (Number.isFinite(startTs) && Number.isFinite(endTs) && endTs > startTs) {
            totalMs += endTs - startTs
          }
        }
      }
      if (totalMs > 0) ensureDay(date).sleep_hours = Math.round((totalMs / 3_600_000) * 10) / 10
    } catch (err) {
      console.warn('[apple-health] sleep query failed', err)
    }
  }

  return Object.values(rows).sort((a, b) => a.date.localeCompare(b.date))
}

export async function syncAppleHealthToCreeda(args: {
  accessToken: string
  daysToSync?: number
}): Promise<{ ok: boolean; rows_imported: number; reason?: string }> {
  if (Platform.OS !== 'ios') return { ok: false, reason: 'not_ios', rows_imported: 0 }

  const days = args.daysToSync ?? 7
  const rows = await readLastDays(days)
  if (rows.length === 0) return { ok: false, reason: 'no_data', rows_imported: 0 }

  const res = await fetch(`${mobileEnv.apiBaseUrl}/api/wearables/manual-import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.accessToken}`,
    },
    body: JSON.stringify({ provider: 'apple_health', rows }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, reason: body.slice(0, 200) || `http_${res.status}`, rows_imported: 0 }
  }
  const data = (await res.json()) as { rows_imported?: number }
  return { ok: true, rows_imported: data.rows_imported ?? rows.length }
}

// Re-export for callers that prefer the default HealthKit module
export default HealthKit
