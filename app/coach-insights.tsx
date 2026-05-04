import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { BarChart3, Brain, FileText, Video } from 'lucide-react-native'

import { NeonGlassCardNative } from '../src/components/neon/NeonGlassCardNative'
import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { MetricChip } from '../src/components/ui/MetricChip'
import { SectionHeader } from '../src/components/ui/SectionHeader'
import { useMobileAuth } from '../src/lib/auth'
import {
  fetchCoachAnalytics,
  fetchCoachReports,
  type CoachVideoReportSummary,
  type CoachWeeklyReview,
} from '../src/lib/mobile-api'
import { creedaTokens } from '../src/theme/creedaTokens'

export default function CoachInsightsScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()
  const [analytics, setAnalytics] = useState<CoachWeeklyReview | null>(null)
  const [reports, setReports] = useState<CoachVideoReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!session?.access_token) return
      setLoading(true)
      try {
        const [analyticsResponse, reportsResponse] = await Promise.all([
          fetchCoachAnalytics(session.access_token),
          fetchCoachReports(session.access_token),
        ])
        if (!cancelled) {
          setAnalytics(analyticsResponse.analytics)
          setReports(reportsResponse.reports)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load coach insights.')
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
          Coach insights are coach-only
        </Text>
        <Text className="mt-4 text-center text-sm leading-6 text-white/55">
          Your current mobile role is {user.profile.role}.
        </Text>
      </View>
    )
  }

  if (loading && !analytics) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ActivityIndicator color={creedaTokens.colors.coach} size="large" />
        <Text className="mt-4 text-center text-sm font-semibold text-white/70">
          Loading insights...
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          Coach insights
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          Analytics and reports
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          Research and analytics stay empty until source-backed data exists.
        </Text>

        {error ? <EmptyStateCard title="Insights unavailable" body={error} accent={creedaTokens.colors.coach} /> : null}

        {analytics ? (
          <>
            <View className="mt-6 flex-row flex-wrap gap-3">
              <MetricChip label="Readiness" value={`${analytics.averageReadiness}`} detail="Average squad readiness" accent={creedaTokens.colors.coach} />
              <MetricChip label="Coverage" value={`${analytics.objectiveCoveragePct}%`} detail="Objective coverage" accent={creedaTokens.colors.coach} />
              <MetricChip label="Reports" value={`${reports.length}`} detail="Movement reports returned" accent={creedaTokens.colors.coach} />
            </View>

            <NeonGlassCardNative>
              <SectionHeader
                title="Analytics"
                detail={analytics.bottleneck}
                icon={BarChart3}
                accent={creedaTokens.colors.coach}
              />
            </NeonGlassCardNative>

            <NeonGlassCardNative>
              <SectionHeader
                title="Reports"
                detail={
                  reports.length
                    ? 'Recent movement reports are available from the existing coach reports endpoint.'
                    : 'No coach movement reports returned yet.'
                }
                icon={Video}
                accent={creedaTokens.colors.coach}
              />
              {reports.slice(0, 3).map((report) => (
                <Text key={report.id} className="mt-4 rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white/65">
                  {report.athleteName} • {report.sportLabel} • {report.summary.headline}
                </Text>
              ))}
            </NeonGlassCardNative>

            <EmptyStateCard
              title="Research module pending"
              body="A coach research feed needs an approved backend contract. This screen will not show fake studies, fake AI citations, or unsupported insights."
              accent={creedaTokens.colors.coach}
              icon={Brain}
              actionLabel="Open Analytics"
              onAction={() => router.push('/coach-analytics')}
            />
          </>
        ) : !error ? (
          <EmptyStateCard
            title="No insights yet"
            body="Invite athletes and let check-ins/scans accumulate before analytics can be useful."
            accent={creedaTokens.colors.coach}
            icon={FileText}
          />
        ) : null}
      </ScrollView>
    </View>
  )
}
