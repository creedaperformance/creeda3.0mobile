import { Pressable, Text, View } from 'react-native'
import { ArrowRight, ShieldAlert, Users } from 'lucide-react-native'

import type { CoachMobileDashboard } from '../../lib/mobile-api'
import { creedaTokens } from '../../theme/creedaTokens'
import { EmptyStateCard } from '../ui/EmptyStateCard'
import { SectionHeader } from '../ui/SectionHeader'
import { StatusDot } from '../ui/StatusDot'

function priorityStatus(priority: string) {
  const normalized = priority.toLowerCase()
  if (normalized.includes('critical')) return 'risk' as const
  if (normalized.includes('warning')) return 'caution' as const
  return 'tracker' as const
}

export function CoachSquadHub({
  dashboard,
  onOpenAthlete,
  onOpenReview,
}: {
  dashboard: CoachMobileDashboard
  onOpenAthlete: (athlete: CoachMobileDashboard['topPriorityAthletes'][number]) => void
  onOpenReview?: () => void
}) {
  const riskCount = dashboard.teamSummaries.reduce((sum, team) => sum + team.highRiskCount, 0)
  const cautionCount = dashboard.teamSummaries.reduce(
    (sum, team) => sum + team.interventionCount + team.lowDataCount,
    0
  )
  const readyCount = Math.max(0, dashboard.athleteCount - riskCount - cautionCount)
  const hasSquadGrid = dashboard.topPriorityAthletes.length > 0

  return (
    <View className="gap-4">
      <View className="rounded-[28px] border border-white/5 bg-background-glass p-6">
        <SectionHeader
          title="Squad command"
          detail={`${dashboard.periodLabel}. ${dashboard.nextWeekFocus}`}
          icon={Users}
          accent={creedaTokens.colors.coach}
        />
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-white/5 bg-white/[0.035] p-4">
            <StatusDot status="ready" />
            <Text className="mt-3 text-3xl font-black tracking-tight text-white">{readyCount}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Ready
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-white/5 bg-white/[0.035] p-4">
            <StatusDot status="caution" />
            <Text className="mt-3 text-3xl font-black tracking-tight text-white">{cautionCount}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Caution
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-white/5 bg-white/[0.035] p-4">
            <StatusDot status="risk" />
            <Text className="mt-3 text-3xl font-black tracking-tight text-white">{riskCount}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Risk
            </Text>
          </View>
        </View>
      </View>

      <View className="rounded-[28px] border border-white/5 bg-background-glass p-6">
        <SectionHeader
          title="Flag alerts"
          detail={
            dashboard.topPriorityAthletes.length
              ? `${dashboard.topPriorityAthletes.length} athletes are in the live coach priority queue.`
              : 'No live escalations returned by the coach dashboard API.'
          }
          icon={ShieldAlert}
          accent={creedaTokens.colors.coach}
        />
        {dashboard.highestRiskCluster ? (
          <Text className="mt-4 text-sm leading-6 text-white/65">
            Highest risk cluster: {dashboard.highestRiskCluster}
          </Text>
        ) : null}
      </View>

      <View className="rounded-[28px] border border-white/5 bg-background-glass p-6">
        <SectionHeader
          title="Athlete grid"
          detail="This grid uses the live priority queue only. Full squad membership needs a dedicated coach squad endpoint."
          icon={Users}
          accent={creedaTokens.colors.coach}
        />
        {hasSquadGrid ? (
          <View className="mt-5 flex-row flex-wrap gap-3">
            {dashboard.topPriorityAthletes.map((athlete) => {
              const status = priorityStatus(athlete.priority)
              return (
                <Pressable
                  key={`${athlete.athleteId}-${athlete.queueType}`}
                  onPress={() => onOpenAthlete(athlete)}
                  className="w-[30%] min-w-[96px] flex-1 rounded-[22px] border border-white/5 bg-white/[0.035] p-3"
                >
                  <View className="flex-row items-center justify-between">
                    <StatusDot status={status} />
                    <ArrowRight color="rgba(255,255,255,0.35)" size={13} />
                  </View>
                  <Text className="mt-3 text-sm font-black tracking-tight text-white" numberOfLines={2}>
                    {athlete.athleteName}
                  </Text>
                  <Text className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35" numberOfLines={2}>
                    {athlete.teamName}
                  </Text>
                  <Text className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {athlete.priority}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : (
          <View className="mt-5">
            <EmptyStateCard
              title="No athlete grid yet"
              body="Invite athletes and let the daily loop run. A full 3-column squad grid needs `GET /api/mobile/coach/squad` with athlete-level readiness, attendance, and status lights."
              accent={creedaTokens.colors.coach}
              icon={Users}
              actionLabel={onOpenReview ? 'Open Review' : undefined}
              onAction={onOpenReview}
            />
          </View>
        )}
      </View>

      {dashboard.teamSummaries.length ? (
        <View className="rounded-[28px] border border-white/5 bg-background-glass p-6">
          <SectionHeader
            title="Teams"
            detail="Team summaries are from the existing dashboard payload."
            icon={Users}
            accent={creedaTokens.colors.coach}
          />
          <View className="mt-5 gap-3">
            {dashboard.teamSummaries.map((team) => (
              <View key={team.teamId} className="rounded-2xl border border-white/5 bg-white/[0.035] p-4">
                <Text className="text-base font-black tracking-tight text-white">{team.teamName}</Text>
                <Text className="mt-2 text-sm leading-6 text-white/55">
                  {team.athleteCount} athletes • readiness {team.averageReadiness} • compliance {team.compliancePct}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}
