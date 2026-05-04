import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Droplets, HeartPulse, Salad, ShieldAlert } from 'lucide-react-native'

import { BodyMapNative } from '../src/components/body-map/BodyMapNative'
import { NeonGlassCardNative } from '../src/components/neon/NeonGlassCardNative'
import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { SectionHeader } from '../src/components/ui/SectionHeader'
import { useMobileAuth } from '../src/lib/auth'
import { fetchMobileDashboard, type IndividualMobileDashboard } from '../src/lib/mobile-api'
import { creedaTokens } from '../src/theme/creedaTokens'

export default function IndividualBodyScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()
  const [dashboard, setDashboard] = useState<IndividualMobileDashboard | null>(null)
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
          setDashboard(response.dashboard.type === 'individual' ? response.dashboard : null)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load body screen.')
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

  if (user && user.profile.role !== 'individual') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-xl font-black tracking-tight text-white">
          Body is for FitStart accounts
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
        <ActivityIndicator color={creedaTokens.colors.individual} size="large" />
        <Text className="mt-4 text-center text-sm font-semibold text-white/70">
          Loading body context...
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          FitStart body
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          Body, recovery, nutrition.
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          Weak-link alerts only appear when supported by real check-ins, scans, or health data.
        </Text>

        {error ? <EmptyStateCard title="Body unavailable" body={error} accent={creedaTokens.colors.individual} /> : null}

        <NeonGlassCardNative>
          <SectionHeader
            title="Recovery map"
            detail="No body regions are inferred until the body-map API returns region-level evidence."
            icon={HeartPulse}
            accent={creedaTokens.colors.individual}
          />
          <View className="mt-5">
            <BodyMapNative regions={[]} accent={creedaTokens.colors.individual} />
          </View>
        </NeonGlassCardNative>

        {dashboard ? (
          <NeonGlassCardNative>
            <SectionHeader
              title={dashboard.nutrition.gateTitle}
              detail={dashboard.nutrition.summary}
              icon={Salad}
              accent={creedaTokens.colors.individual}
            />
            <Text className="mt-4 text-sm leading-6 text-white/70">{dashboard.nutrition.nextAction}</Text>
          </NeonGlassCardNative>
        ) : null}

        <EmptyStateCard
          title="Hydration tracker needs support"
          body="Hydration will appear only after a supported field or endpoint exists. The current individual dashboard does not return daily hydration history."
          accent={creedaTokens.colors.individual}
          icon={Droplets}
        />

        <EmptyStateCard
          title="No weak-link alerts yet"
          body="Creeda will not label weak links from blank data. Complete a daily ritual, individual log, health sync, or movement scan first."
          accent={creedaTokens.colors.individual}
          icon={ShieldAlert}
          actionLabel="Open Movement Scan"
          onAction={() => router.push('/individual-scan')}
        />
      </ScrollView>
    </View>
  )
}
