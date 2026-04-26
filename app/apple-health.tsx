import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'

import { useMobileAuth } from '../src/lib/auth'
import {
  getAppleHealthStatus,
  requestAppleHealthPermissions,
  syncAppleHealthToCreeda,
  type AppleHealthStatus,
} from '../src/wearables/apple-health'

export default function AppleHealthScreen() {
  const router = useRouter()
  const { session } = useMobileAuth()
  const [status, setStatus] = useState<AppleHealthStatus | 'checking'>('checking')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<{ rowsImported: number; timestamp: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAppleHealthStatus()
      .then((s) => {
        if (!cancelled) setStatus(s)
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable_device')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function connect() {
    setError(null)
    try {
      const ok = await requestAppleHealthPermissions()
      if (!ok) {
        setError('Apple Health permission was declined.')
        return
      }
      setStatus('ready')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function sync() {
    if (!session?.access_token) return
    setIsSyncing(true)
    setError(null)
    try {
      const result = await syncAppleHealthToCreeda({ accessToken: session.access_token })
      if (!result.ok) throw new Error(result.reason ?? 'Sync failed.')
      setLastSync({ rowsImported: result.rows_imported, timestamp: new Date().toLocaleString() })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#04070A]" contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Pressable onPress={() => router.back()}>
        <Text className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">← Back</Text>
      </Pressable>

      <Text className="mt-5 text-[11px] font-black uppercase tracking-[0.28em] text-[#6EE7B7]">
        Wearables · Apple Health
      </Text>
      <Text className="mt-2 text-3xl font-black tracking-tight text-white">
        Sync HRV, sleep, RHR, steps and workouts.
      </Text>
      <Text className="mt-3 text-sm leading-6 text-white/55">
        Apple Health is the system hub on iOS. Whatever your Apple Watch, Garmin, Oura, Whoop or
        Strava already pushes into Apple Health, Creeda can read with a single permission grant.
        Raw heart-rate traces never leave your phone — only daily summaries reach Creeda.
      </Text>

      <View className="mt-6">
        {status === 'checking' ? (
          <Card>
            <ActivityIndicator color="#6EE7B7" />
            <Text className="mt-3 text-[12px] text-white/55">Checking availability…</Text>
          </Card>
        ) : null}

        {status === 'unavailable_platform' ? (
          <Card>
            <Text className="text-sm font-bold text-white">Open Creeda on iPhone.</Text>
            <Text className="mt-1 text-[12px] text-white/55">
              Apple Health only exists on iOS. On Android use Health Connect.
            </Text>
          </Card>
        ) : null}

        {status === 'unavailable_device' ? (
          <Card>
            <Text className="text-sm font-bold text-white">Apple Health is not available.</Text>
            <Text className="mt-1 text-[12px] text-white/55">
              Make sure you're on a real iPhone running iOS 13+ — the iOS Simulator does not have
              Apple Health.
            </Text>
          </Card>
        ) : null}

        {status === 'permissions_unknown' ? (
          <Card>
            <Text className="text-sm font-bold text-white">Tap to grant Apple Health access.</Text>
            <Text className="mt-1 text-[12px] leading-5 text-white/55">
              iOS will show its permission sheet listing every data type. We request: Heart Rate,
              Resting HR, HRV (SDNN), Step Count, Active Calories, Body Mass, Sleep Analysis.
            </Text>
            <Pressable
              onPress={connect}
              className="mt-4 min-h-12 items-center justify-center rounded-2xl bg-[#6EE7B7] px-5"
            >
              <Text className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-950">
                Grant access
              </Text>
            </Pressable>
          </Card>
        ) : null}

        {status === 'ready' ? (
          <Card>
            <Text className="text-sm font-bold text-white">Ready to sync.</Text>
            <Text className="mt-1 text-[12px] leading-5 text-white/55">
              Tap below to pull the last 7 days into Creeda. We'll also re-sync automatically when
              you open the app from now on.
            </Text>
            <Pressable
              onPress={sync}
              disabled={isSyncing}
              className={`mt-4 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 ${
                isSyncing ? 'bg-white/[0.05]' : 'bg-[#6EE7B7]'
              }`}
            >
              {isSyncing ? <ActivityIndicator color="#020617" /> : null}
              <Text
                className={`text-[13px] font-black uppercase tracking-[0.18em] ${
                  isSyncing ? 'text-white/55' : 'text-slate-950'
                }`}
              >
                {isSyncing ? 'Syncing…' : 'Sync last 7 days'}
              </Text>
            </Pressable>
            {lastSync ? (
              <Text className="mt-3 text-[11px] leading-5 text-emerald-300">
                ✓ {lastSync.rowsImported} day(s) synced · {lastSync.timestamp}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {error ? (
          <View className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/[0.08] p-3">
            <Text className="text-[12px] font-bold text-rose-200">{error}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">{children}</View>
}
