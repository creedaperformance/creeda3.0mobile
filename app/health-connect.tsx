import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'

import { useMobileAuth } from '../src/lib/auth'
import {
  getHealthConnectStatus,
  openSettings,
  requestHealthConnectPermissions,
  syncHealthConnectToCreeda,
  type HealthConnectStatus,
} from '../src/wearables/health-connect'

const PROVIDER_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'

export default function HealthConnectScreen() {
  const router = useRouter()
  const { session } = useMobileAuth()
  const [status, setStatus] = useState<HealthConnectStatus | 'checking'>('checking')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<{
    rowsImported: number
    timestamp: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (Platform.OS !== 'android') {
      setStatus('unavailable_platform')
      return
    }
    getHealthConnectStatus()
      .then((s) => {
        if (!cancelled) setStatus(s)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setStatus('unavailable_provider')
          setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleConnect() {
    setError(null)
    try {
      await requestHealthConnectPermissions()
      const next = await getHealthConnectStatus()
      setStatus(next)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleSync() {
    if (!session?.access_token) return
    setIsSyncing(true)
    setError(null)
    try {
      const result = await syncHealthConnectToCreeda({
        accessToken: session.access_token,
        daysToSync: 7,
      })
      if (!result.ok) {
        throw new Error(result.reason ?? 'Sync failed.')
      }
      setLastSync({
        rowsImported: result.rows_imported,
        timestamp: new Date().toLocaleString(),
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#04070A]" contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Pressable onPress={() => router.back()}>
        <Text className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
          ← Back
        </Text>
      </Pressable>

      <Text className="mt-5 text-[11px] font-black uppercase tracking-[0.28em] text-[#6EE7B7]">
        Wearables · Google Health Connect
      </Text>
      <Text className="mt-2 text-3xl font-black tracking-tight text-white">
        Sync sleep, HRV, steps, and workouts in one tap.
      </Text>
      <Text className="mt-3 text-sm leading-6 text-white/55">
        Health Connect is the system-wide health hub on Android. Whatever your Garmin, Fitbit,
        Samsung Watch, Whoop, or Oura already pushes to Health Connect, Creeda can read with one
        permission grant. No API keys, no waiting. All data stays on your phone — only the daily
        summaries you grant Creeda are sent up.
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
            <Text className="text-sm font-bold text-white">iOS uses Apple Health.</Text>
            <Text className="mt-1 text-[12px] text-white/55">
              On iOS, head to Settings → Wearables → Apple Health.
            </Text>
          </Card>
        ) : null}

        {status === 'unavailable_provider' || status === 'provider_update_required' ? (
          <Card>
            <Text className="text-sm font-bold text-white">
              Health Connect needs to be installed.
            </Text>
            <Text className="mt-1 text-[12px] text-white/55">
              Health Connect is a free Google app that ships with Android 14+. On older Androids,
              install it from the Play Store.
            </Text>
            <Pressable
              onPress={() => Linking.openURL(PROVIDER_PLAY_STORE_URL)}
              className="mt-4 min-h-12 items-center justify-center rounded-2xl bg-[#6EE7B7] px-5"
            >
              <Text className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-950">
                Get Health Connect
              </Text>
            </Pressable>
          </Card>
        ) : null}

        {status === 'permissions_missing' ? (
          <Card>
            <Text className="text-sm font-bold text-white">Tap to grant permissions.</Text>
            <Text className="mt-1 text-[12px] leading-5 text-white/55">
              Health Connect will ask which data types you want to share with Creeda. We request:
              Steps, Sleep, Heart Rate, Resting HR, HRV (RMSSD), Workouts, Active Calories, Weight.
            </Text>
            <Pressable
              onPress={handleConnect}
              className="mt-4 min-h-12 items-center justify-center rounded-2xl bg-[#6EE7B7] px-5"
            >
              <Text className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-950">
                Grant access
              </Text>
            </Pressable>
            <Pressable
              onPress={openSettings}
              className="mt-3 min-h-11 items-center justify-center rounded-2xl border border-white/10 px-5"
            >
              <Text className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/65">
                Open Health Connect settings
              </Text>
            </Pressable>
          </Card>
        ) : null}

        {status === 'ready' ? (
          <Card>
            <Text className="text-sm font-bold text-white">Connected.</Text>
            <Text className="mt-1 text-[12px] leading-5 text-white/55">
              Tap below to pull the last 7 days of data into Creeda. We'll re-sync automatically
              when you open the app from now on.
            </Text>
            <Pressable
              onPress={handleSync}
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

      <View className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <Text className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
          Privacy
        </Text>
        <Text className="mt-2 text-[12px] leading-5 text-white/65">
          Your raw heart-rate or sleep traces never leave your phone. We send daily summaries
          (resting HR, HRV mean, sleep total, steps, workout minutes) to Creeda's database where
          they feed the readiness engine. You can revoke access any time from
          Settings → Health Connect.
        </Text>
      </View>
    </ScrollView>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">{children}</View>
}
