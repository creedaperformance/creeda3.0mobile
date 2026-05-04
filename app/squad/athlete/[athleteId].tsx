import { ScrollView, Text, View } from 'react-native'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { MessageCircle, ShieldAlert, ClipboardList } from 'lucide-react-native'

import { LoadChart } from '../../../src/components/dashboard/LoadChart'
import { GlowingButtonNative } from '../../../src/components/neon/GlowingButtonNative'
import { NeonGlassCardNative } from '../../../src/components/neon/NeonGlassCardNative'
import { EmptyStateCard } from '../../../src/components/ui/EmptyStateCard'
import { MetricChip } from '../../../src/components/ui/MetricChip'
import { SectionHeader } from '../../../src/components/ui/SectionHeader'
import { useMobileAuth } from '../../../src/lib/auth'
import { creedaTokens } from '../../../src/theme/creedaTokens'

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default function CoachAthleteDrilldownScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()
  const params = useLocalSearchParams<{
    athleteId?: string | string[]
    name?: string | string[]
    team?: string | string[]
    priority?: string | string[]
    recommendation?: string | string[]
    reasons?: string | string[]
  }>()
  const athleteId = firstParam(params.athleteId) || ''
  const name = firstParam(params.name) || 'Athlete'
  const team = firstParam(params.team) || 'Squad'
  const priority = firstParam(params.priority) || 'Needs review'
  const recommendation = firstParam(params.recommendation) || ''
  const reasons = (firstParam(params.reasons) || '').split('|').filter(Boolean)

  if (!session) return <Redirect href="/login" />

  if (user && user.profile.role !== 'coach') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-xl font-black tracking-tight text-white">
          Athlete drill-down is coach-only
        </Text>
        <Text className="mt-4 text-center text-sm leading-6 text-white/55">
          Your current mobile role is {user.profile.role}.
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          Athlete drill-down
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">{name}</Text>
        <Text className="mt-2 text-sm leading-6 text-white/58">{team}</Text>

        <NeonGlassCardNative watermark="ATH">
          <SectionHeader
            title={priority}
            detail={recommendation || 'Open this from the live coach priority queue to view returned context.'}
            icon={ShieldAlert}
            accent={creedaTokens.colors.coach}
          />
          {reasons.length ? (
            <View className="mt-5 gap-2">
              {reasons.map((reason) => (
                <Text key={reason} className="rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white/65">
                  {reason}
                </Text>
              ))}
            </View>
          ) : null}
        </NeonGlassCardNative>

        <View className="flex-row flex-wrap gap-3">
          <MetricChip label="Readiness" value="N/A" detail="Needs athlete endpoint" accent={creedaTokens.colors.coach} />
          <MetricChip label="HRV" value="N/A" detail="Needs athlete endpoint" accent={creedaTokens.colors.coach} />
          <MetricChip label="Sleep" value="N/A" detail="Needs athlete endpoint" accent={creedaTokens.colors.coach} />
          <MetricChip label="Attendance" value="N/A" detail="Needs attendance data" accent={creedaTokens.colors.coach} />
        </View>

        <LoadChart points={[]} accent={creedaTokens.colors.coach} />

        <NeonGlassCardNative>
          <SectionHeader
            title="Plan completion"
            detail="Completion will render once `GET /api/mobile/coach/squad/:athleteId` returns plan adherence and seven-day load history."
            icon={ClipboardList}
            accent={creedaTokens.colors.coach}
          />
        </NeonGlassCardNative>

        <NeonGlassCardNative>
          <SectionHeader
            title="Actions"
            detail="Medical or RTS actions stay disabled until backend support exists."
            icon={MessageCircle}
            accent={creedaTokens.colors.coach}
          />
          <View className="mt-5 gap-3">
            <GlowingButtonNative
              title="Review Report"
              variant="chakra"
              onPress={() => router.push('/coach-reports')}
            />
            <GlowingButtonNative
              title="Back To Squad"
              variant="saffron"
              onPress={() => router.push('/coach-squad')}
            />
          </View>
        </NeonGlassCardNative>

        <EmptyStateCard
          title="Detailed athlete API missing"
          body={`Expected future endpoint: GET /api/mobile/coach/squad/${athleteId || ':athleteId'}. Until then, this screen only shows priority-queue context already returned by the dashboard.`}
          accent={creedaTokens.colors.coach}
        />
      </ScrollView>
    </View>
  )
}
