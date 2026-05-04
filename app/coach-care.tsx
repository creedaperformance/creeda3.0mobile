import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { ClipboardCheck, ShieldAlert, Stethoscope } from 'lucide-react-native'

import { NeonGlassCardNative } from '../src/components/neon/NeonGlassCardNative'
import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { SectionHeader } from '../src/components/ui/SectionHeader'
import { StatusDot } from '../src/components/ui/StatusDot'
import { useMobileAuth } from '../src/lib/auth'
import { fetchCoachWeeklyReview, type CoachWeeklyReview } from '../src/lib/mobile-api'
import { creedaTokens } from '../src/theme/creedaTokens'

type CareTab = 'rts' | 'reviews'

export default function CoachCareScreen() {
  const { session, user } = useMobileAuth()
  const [activeTab, setActiveTab] = useState<CareTab>('rts')
  const [review, setReview] = useState<CoachWeeklyReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!session?.access_token) return
      setLoading(true)
      try {
        const response = await fetchCoachWeeklyReview(session.access_token)
        if (!cancelled) {
          setReview(response.review)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load coach care.')
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
          Coach care is coach-only
        </Text>
        <Text className="mt-4 text-center text-sm leading-6 text-white/55">
          Your current mobile role is {user.profile.role}.
        </Text>
      </View>
    )
  }

  if (loading && !review) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ActivityIndicator color={creedaTokens.colors.coach} size="large" />
        <Text className="mt-4 text-center text-sm font-semibold text-white/70">
          Loading care queue...
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          Coach care
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          RTS and reviews
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          Care modules stay non-medical and only show backend-supported states.
        </Text>

        <View className="mt-6 flex-row gap-2">
          {(['rts', 'reviews'] as const).map((tab) => (
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
                {tab === 'rts' ? 'RTS' : 'Reviews'}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <EmptyStateCard title="Care unavailable" body={error} accent={creedaTokens.colors.coach} /> : null}

        {activeTab === 'rts' ? (
          <EmptyStateCard
            title="RTS tracking needs backend support"
            body="Expected future endpoint: `GET /api/mobile/coach/rts`. Until it exists, this app will not create injury stages or medical return-to-sport statuses."
            accent={creedaTokens.colors.coach}
            icon={Stethoscope}
          />
        ) : null}

        {activeTab === 'reviews' ? (
          <NeonGlassCardNative>
            <SectionHeader
              title="Weekly review cards"
              detail={
                review?.topPriorityAthletes.length
                  ? 'These cards come from the existing coach weekly review endpoint.'
                  : 'No weekly athlete priorities returned yet.'
              }
              icon={ClipboardCheck}
              accent={creedaTokens.colors.coach}
            />
            {review?.topPriorityAthletes.length ? (
              <View className="mt-5 gap-3">
                {review.topPriorityAthletes.map((athlete) => (
                  <View key={`${athlete.athleteId}-${athlete.queueType}`} className="rounded-2xl border border-white/5 bg-white/[0.035] p-4">
                    <View className="flex-row items-center gap-2">
                      <StatusDot status={athlete.priority === 'Critical' ? 'risk' : athlete.priority === 'Warning' ? 'caution' : 'tracker'} />
                      <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                        {athlete.priority}
                      </Text>
                    </View>
                    <Text className="mt-3 text-base font-black tracking-tight text-white">
                      {athlete.athleteName}
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-white/60">
                      {athlete.recommendation}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="mt-5">
                <EmptyStateCard
                  title="AI summary not ready"
                  body="AI summary will appear after enough check-ins/scans and only when the backend generates it."
                  accent={creedaTokens.colors.coach}
                  icon={ShieldAlert}
                />
              </View>
            )}
          </NeonGlassCardNative>
        ) : null}
      </ScrollView>
    </View>
  )
}
