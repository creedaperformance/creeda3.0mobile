import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'

import { CoachSquadHub } from '../src/components/coach/CoachSquadHub'
import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { useMobileAuth } from '../src/lib/auth'
import { fetchMobileDashboard, type CoachMobileDashboard } from '../src/lib/mobile-api'
import { creedaTokens } from '../src/theme/creedaTokens'

export default function CoachSquadScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()
  const [dashboard, setDashboard] = useState<CoachMobileDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadSquad() {
      if (!session?.access_token) return
      setLoading(true)
      try {
        const response = await fetchMobileDashboard(session.access_token)
        if (!cancelled) {
          setDashboard(response.dashboard.type === 'coach' ? response.dashboard : null)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load coach squad.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadSquad()
    return () => {
      cancelled = true
    }
  }, [session?.access_token])

  if (!session) return <Redirect href="/login" />

  if (user && user.profile.role !== 'coach') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-xl font-black tracking-tight text-white">
          Coach squad is coach-only
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
          Loading squad command...
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          Coach squad
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          Squad command centre
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          Built from the existing coach dashboard payload until the full squad endpoint exists.
        </Text>

        {error ? (
          <EmptyStateCard
            title="Squad unavailable"
            body={error}
            accent={creedaTokens.colors.coach}
          />
        ) : null}

        {dashboard ? (
          <View className="mt-6">
            <CoachSquadHub
              dashboard={dashboard}
              onOpenReview={() => router.push('/coach-review')}
              onOpenAthlete={(athlete) => {
                const params = new URLSearchParams({
                  name: athlete.athleteName,
                  team: athlete.teamName,
                  priority: athlete.priority,
                  recommendation: athlete.recommendation,
                  reasons: athlete.reasons.join('|'),
                })
                router.push(`/squad/athlete/${encodeURIComponent(athlete.athleteId)}?${params.toString()}`)
              }}
            />
          </View>
        ) : !error ? (
          <EmptyStateCard
            title="No squad payload yet"
            body="The mobile dashboard did not return coach data for this account."
            accent={creedaTokens.colors.coach}
          />
        ) : null}
      </ScrollView>
    </View>
  )
}
