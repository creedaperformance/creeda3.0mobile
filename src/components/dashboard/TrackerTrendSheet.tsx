import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { X } from 'lucide-react-native'

import { EmptyStateCard } from '../ui/EmptyStateCard'

export type TrackerTrendMetric = {
  key: string
  label: string
  unit?: string
  points: Array<{
    label: string
    value: number | null
  }>
}

export function TrackerTrendSheet({
  visible,
  trends,
  accent = '#1D9E75',
  onClose,
}: {
  visible: boolean
  trends: TrackerTrendMetric[]
  accent?: string
  onClose: () => void
}) {
  const hasTrends = trends.some((trend) => trend.points.some((point) => point.value !== null))

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="max-h-[78%] rounded-t-[32px] border border-white/10 bg-[#080C0A] px-5 pb-8 pt-5">
          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
                Tracker trends
              </Text>
              <Text className="mt-2 text-2xl font-black tracking-tight text-white">
                Synced history
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
            >
              <X color="rgba(255,255,255,0.7)" size={18} />
            </Pressable>
          </View>

          {!hasTrends ? (
            <EmptyStateCard
              title="Trend history will appear after several synced days"
              body="CREEDA is not showing a chart until the mobile API returns real day-by-day tracker values."
              accent={accent}
            />
          ) : (
            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
              {trends.map((trend) => {
                const maxValue = Math.max(1, ...trend.points.map((point) => point.value ?? 0))
                return (
                  <View key={trend.key} className="rounded-[24px] border border-white/5 bg-white/[0.035] p-4">
                    <Text className="text-base font-black tracking-tight text-white">
                      {trend.label}
                    </Text>
                    <View className="mt-5 flex-row items-end gap-2">
                      {trend.points.map((point) => (
                        <View key={point.label} className="flex-1 items-center gap-2">
                          <View className="h-24 w-full justify-end rounded-full bg-white/[0.04] px-2 py-2">
                            <View
                              className="w-full rounded-full"
                              style={{
                                height: `${Math.max(10, ((point.value ?? 0) / maxValue) * 100)}%`,
                                backgroundColor: accent,
                              }}
                            />
                          </View>
                          <Text className="text-[10px] text-white/35">{point.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}
