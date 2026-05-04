import { Text, View } from 'react-native'
import { Brain, Target } from 'lucide-react-native'

import { NeonGlassCardNative } from '../neon/NeonGlassCardNative'
import { SectionHeader } from '../ui/SectionHeader'

export function SportFocusZone({
  sportLabel,
  decision,
  primaryReason,
  actionInstruction,
  objectiveHeadline,
  objectiveSummary,
  contextSummary,
  accent = '#1D9E75',
}: {
  sportLabel: string
  decision: string
  primaryReason: string
  actionInstruction: string
  objectiveHeadline?: string | null
  objectiveSummary?: string | null
  contextSummary?: string | null
  accent?: string
}) {
  return (
    <NeonGlassCardNative watermark="ATH">
      <SectionHeader
        eyebrow={sportLabel}
        title={decision}
        detail={primaryReason}
        icon={Target}
        accent={accent}
      />
      <Text className="mt-5 text-sm leading-6 text-white/70">{actionInstruction}</Text>
      <View className="mt-5 gap-3">
        <View className="rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-4">
          <SectionHeader
            title={objectiveHeadline || 'Objective signal building'}
            detail={objectiveSummary || 'Complete check-ins, objective tests, or scans so CREEDA can attach stronger sport-specific evidence.'}
            icon={Brain}
            accent={accent}
          />
        </View>
        {contextSummary ? (
          <View className="rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-4">
            <Text className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
              Context load
            </Text>
            <Text className="mt-2 text-sm leading-6 text-white/65">{contextSummary}</Text>
          </View>
        ) : null}
      </View>
    </NeonGlassCardNative>
  )
}
