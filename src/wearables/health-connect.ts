import { Platform } from 'react-native'
import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect'

import { mobileEnv } from '../lib/env'

/**
 * Google Health Connect wrapper. Reads sleep, HRV, RHR, steps, workouts,
 * and weight from the user's phone, transforms them into the rows the
 * /api/wearables/manual-import endpoint expects, and posts them up.
 *
 * On-device permissions only — no API key, no OAuth.
 */

export type HealthConnectStatus =
  | 'unavailable_platform'
  | 'unavailable_provider'
  | 'provider_update_required'
  | 'permissions_missing'
  | 'ready'

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

const PERMISSIONS = [
  { accessType: 'read' as const, recordType: 'Steps' as const },
  { accessType: 'read' as const, recordType: 'SleepSession' as const },
  { accessType: 'read' as const, recordType: 'HeartRate' as const },
  { accessType: 'read' as const, recordType: 'RestingHeartRate' as const },
  { accessType: 'read' as const, recordType: 'HeartRateVariabilityRmssd' as const },
  { accessType: 'read' as const, recordType: 'ExerciseSession' as const },
  { accessType: 'read' as const, recordType: 'TotalCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'Weight' as const },
]

const PROVIDER_PACKAGE = 'com.google.android.apps.healthdata'

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  if (Platform.OS !== 'android') return 'unavailable_platform'

  try {
    const status = await getSdkStatus(PROVIDER_PACKAGE)
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) return 'unavailable_provider'
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return 'provider_update_required'
    }
    const granted = await getGrantedPermissions()
    const grantedSet = new Set<string>()
    for (const p of granted) {
      const record = p as { recordType?: string }
      if (record.recordType) grantedSet.add(record.recordType)
    }
    const requiredCovered = PERMISSIONS.every((p) => grantedSet.has(p.recordType))
    return requiredCovered ? 'ready' : 'permissions_missing'
  } catch (error) {
    console.warn('[health-connect] status check failed', error)
    return 'unavailable_provider'
  }
}

export async function ensureInitialized() {
  if (Platform.OS !== 'android') return false
  return initialize(PROVIDER_PACKAGE)
}

export async function requestHealthConnectPermissions() {
  if (Platform.OS !== 'android') return [] as never[]
  await ensureInitialized()
  return requestPermission(PERMISSIONS)
}

export function openSettings() {
  if (Platform.OS !== 'android') return
  openHealthConnectSettings()
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function dayWindow(daysAgo: number) {
  const end = new Date()
  end.setUTCHours(0, 0, 0, 0)
  end.setUTCDate(end.getUTCDate() - daysAgo + 1)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 1)
  return { startTime: start.toISOString(), endTime: end.toISOString(), date: isoDate(start) }
}

export async function readLastDays(days = 7): Promise<ImportRow[]> {
  if (Platform.OS !== 'android') return []
  await ensureInitialized()

  const rows: Record<string, ImportRow> = {}
  const ensureDay = (date: string): ImportRow => {
    if (!rows[date]) rows[date] = { date }
    return rows[date]
  }

  for (let i = 0; i < days; i++) {
    const { startTime, endTime, date } = dayWindow(i)
    const range = { operator: 'between' as const, startTime, endTime }

    const tasks = [
      // Steps
      readRecords('Steps', { timeRangeFilter: range }).then((res) => {
        let total = 0
        for (const r of res.records) total += Number((r as { count?: number }).count ?? 0)
        if (total > 0) ensureDay(date).steps = Math.round(total)
      }),
      // Sleep
      readRecords('SleepSession', { timeRangeFilter: range }).then((res) => {
        let totalMs = 0
        for (const r of res.records) {
          const start = new Date((r as { startTime: string }).startTime).valueOf()
          const end = new Date((r as { endTime: string }).endTime).valueOf()
          if (Number.isFinite(start) && Number.isFinite(end) && end > start) totalMs += end - start
        }
        if (totalMs > 0) ensureDay(date).sleep_hours = Math.round((totalMs / 3_600_000) * 10) / 10
      }),
      // Resting HR
      readRecords('RestingHeartRate', { timeRangeFilter: range }).then((res) => {
        const beats: number[] = []
        for (const r of res.records) beats.push(Number((r as { beatsPerMinute?: number }).beatsPerMinute ?? 0))
        if (beats.length > 0) ensureDay(date).resting_hr = Math.round(avg(beats))
      }),
      // HRV (RMSSD)
      readRecords('HeartRateVariabilityRmssd', { timeRangeFilter: range }).then((res) => {
        const ms: number[] = []
        for (const r of res.records)
          ms.push(Number((r as { heartRateVariabilityMillis?: number }).heartRateVariabilityMillis ?? 0))
        if (ms.length > 0) ensureDay(date).hrv_ms = Math.round(avg(ms))
      }),
      // Active calories
      readRecords('ActiveCaloriesBurned', { timeRangeFilter: range }).then((res) => {
        let total = 0
        for (const r of res.records)
          total += Number((r as { energy?: { inKilocalories?: number } }).energy?.inKilocalories ?? 0)
        if (total > 0) ensureDay(date).active_energy_kcal = Math.round(total)
      }),
      // Workouts
      readRecords('ExerciseSession', { timeRangeFilter: range }).then((res) => {
        let totalMinutes = 0
        for (const r of res.records) {
          const start = new Date((r as { startTime: string }).startTime).valueOf()
          const end = new Date((r as { endTime: string }).endTime).valueOf()
          if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
            totalMinutes += (end - start) / 60_000
          }
        }
        if (totalMinutes > 0) {
          const minutes = Math.round(totalMinutes)
          ensureDay(date).workout_minutes = minutes
          ensureDay(date).workout_load_au = Math.round(minutes * 6) // assume RPE 6 default
        }
      }),
    ]

    try {
      await Promise.all(tasks)
    } catch (error) {
      console.warn('[health-connect] read failed for', date, error)
    }
  }

  return Object.values(rows).sort((a, b) => a.date.localeCompare(b.date))
}

export async function syncHealthConnectToCreeda(args: {
  accessToken: string
  daysToSync?: number
}): Promise<{ ok: boolean; rows_imported: number; reason?: string }> {
  const days = args.daysToSync ?? 7
  const rows = await readLastDays(days)
  if (rows.length === 0) return { ok: false, reason: 'no_data', rows_imported: 0 }

  const res = await fetch(`${mobileEnv.apiBaseUrl}/api/wearables/manual-import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.accessToken}`,
    },
    body: JSON.stringify({ provider: 'health_connect', rows }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, reason: body.slice(0, 200) || `http_${res.status}`, rows_imported: 0 }
  }
  const data = (await res.json()) as { rows_imported?: number }
  return { ok: true, rows_imported: data.rows_imported ?? rows.length }
}

function avg(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}
