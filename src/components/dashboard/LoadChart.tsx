import { Text, View } from 'react-native'
import { BarChart3 } from 'lucide-react-native'

import { EmptyStateCard } from '../ui/EmptyStateCard'
import { SectionHeader } from '../ui/SectionHeader'

export type LoadChartPoint = {
  label: string
  planned: number | null
  actual: number | null
}

export function LoadChart({
  points,
  accent = '#1D9E75',
}: {
  points: LoadChartPoint[]
  accent?: string
}) {
  const hasRealPoints = points.some((point) => point.planned !== null || point.actual !== null)
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [point.planned ?? 0, point.actual ?? 0])
  )

  if (!hasRealPoints) {
    return (
      <EmptyStateCard
        title="Load history is not ready yet"
        body="Planned versus actual load will appear after CREEDA receives enough logged sessions or training-plan data."
        accent={accent}
        icon={BarChart3}
      />
    )
  }

  return (
    <View className="rounded-[28px] border border-white/5 bg-background-glass p-6">
      <SectionHeader
        title="Planned vs actual load"
        detail="Rendered only from returned load history."
        icon={BarChart3}
        accent={accent}
      />
      <View className="mt-6 flex-row items-end gap-3">
        {points.map((point) => (
          <View key={point.label} className="flex-1 items-center gap-2">
            <View className="h-28 w-full flex-row items-end justify-center gap-1 rounded-2xl bg-white/[0.035] px-2 py-2">
              <View
                className="w-3 rounded-full bg-white/20"
                style={{ height: `${Math.max(8, ((point.planned ?? 0) / maxValue) * 100)}%` }}
              />
              <View
                className="w-3 rounded-full"
                style={{
                  height: `${Math.max(8, ((point.actual ?? 0) / maxValue) * 100)}%`,
                  backgroundColor: accent,
                }}
              />
            </View>
            <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {point.label}
            </Text>
          </View>
        ))}
      </View>
      <Text className="mt-5 text-xs leading-5 text-white/45">
        White bars are planned load. Accent bars are completed load.
      </Text>
    </View>
  )
}
