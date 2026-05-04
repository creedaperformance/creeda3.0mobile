import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Dumbbell, CalendarDays, ClipboardList, ShieldAlert } from 'lucide-react-native'

import { LoadChart } from '../src/components/dashboard/LoadChart'
import { NeonGlassCardNative } from '../src/components/neon/NeonGlassCardNative'
import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { MetricChip } from '../src/components/ui/MetricChip'
import { SectionHeader } from '../src/components/ui/SectionHeader'
import { useMobileAuth } from '../src/lib/auth'
import { fetchMobileDashboard, type CoachMobileDashboard } from '../src/lib/mobile-api'
import { creedaTokens } from '../src/theme/creedaTokens'

type TrainTab = 'sessions' | 'plans' | 'matches'

export default function CoachTrainScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()
  const [activeTab, setActiveTab] = useState<TrainTab>('sessions')
  const [dashboard, setDashboard] = useState<CoachMobileDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!session?.access_token) return
      setLoading(true)
      try {
        const response = await fetchMobileDashboard(session.access_token)
        if (!cancelled) {
          setDashboard(response.dashboard.type === 'coach' ? response.dashboard : null)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load coach train.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [session?.access_token])

  if (!session) return <Redirect href="/login" />

  if (user && user.profile.role !== 'coach') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-xl font-black tracking-tight text-white">
          Coach train is coach-only
        </Text>
        <Text className="mt-4 text-center text-sm leading-6 text-white/55">
          Your current mobile role is {user.profile.role}.
        </Text>
      </View>
    )
  }

  if (loading && !dashboard) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ActivityIndicator color={creedaTokens.colors.coach} size="large" />
        <Text className="mt-4 text-center text-sm font-semibold text-white/70">
          Loading training command...
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          Coach train
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          Sessions, plans, matches
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          Training operations stay source-backed until squad planning endpoints exist.
        </Text>

        <View className="mt-6 flex-row gap-2">
          {(['sessions', 'plans', 'matches'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 rounded-full border px-3 py-3"
              style={{
                borderColor: activeTab === tab ? creedaTokens.colors.coach : 'rgba(255,255,255,0.07)',
                backgroundColor: activeTab === tab ? creedaTokens.colors.coachSoft : 'rgba(255,255,255,0.035)',
              }}
            >
              <Text className="text-center text-[10px] font-black uppercase tracking-[0.16em] text-white">
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <EmptyStateCard title="Train unavailable" body={error} accent={creedaTokens.colors.coach} /> : null}

        {dashboard ? (
          <>
            <View className="mt-6 flex-row flex-wrap gap-3">
              <MetricChip label="Squad" value={`${dashboard.athleteCount}`} detail="Athletes returned" accent={creedaTokens.colors.coach} />
              <MetricChip label="Readiness" value={`${dashboard.averageReadiness}`} detail="Average readiness" accent={creedaTokens.colors.coach} />
              <MetricChip label="Compliance" value={`${dashboard.squadCompliancePct}%`} detail="Current squad signal" accent={creedaTokens.colors.coach} />
            </View>

            {activeTab === 'sessions' ? (
              <NeonGlassCardNative>
                <SectionHeader
                  title="Squad readiness before training"
                  detail={dashboard.nextWeekFocus}
                  icon={Dumbbell}
                  accent={creedaTokens.colors.coach}
                />
                <View className="mt-5">
                  <EmptyStateCard
                    title="No planned sessions endpoint yet"
                    body="Expected future endpoint: `GET /api/mobile/coach/squad` or `GET /api/mobile/coach/sessions` with planned load, attendance, and conflict alerts."
                    accent={creedaTokens.colors.coach}
                    icon={ShieldAlert}
                  />
                </View>
              </NeonGlassCardNative>
            ) : null}

            {activeTab === 'plans' ? (
              <>
                <LoadChart points={[]} accent={creedaTokens.colors.coach} />
                <EmptyStateCard
                  title="Send-to-squad is disabled"
                  body="The app will show a send CTA only after a backend route exists for creating and assigning squad sessions."
                  accent={creedaTokens.colors.coach}
                  icon={ClipboardList}
                />
              </>
            ) : null}

            {activeTab === 'matches' ? (
              <EmptyStateCard
                title="Match prep needs schedule data"
                body="Matches will render after a coach schedule API returns real fixtures, travel, and readiness constraints."
                accent={creedaTokens.colors.coach}
                icon={CalendarDays}
              />
            ) : null}
          </>
        ) : !error ? (
          <EmptyStateCard
            title="No coach train data"
            body="The dashboard payload did not return coach data for this account."
            accent={creedaTokens.colors.coach}
          />
        ) : null}
      </ScrollView>
    </View>
  )
}
