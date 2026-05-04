import { ScrollView, Text, View } from 'react-native'
import { CircleDot } from 'lucide-react-native'

import { NeonPill } from '../ui/NeonPill'

export type SportRailItem = {
  id: string
  label: string
  detail?: string
}

export function SportRail({
  sports,
  selectedSportId,
  accent = '#1D9E75',
  onSelect,
}: {
  sports: SportRailItem[]
  selectedSportId: string | null
  accent?: string
  onSelect: (sportId: string) => void
}) {
  if (!sports.length) {
    return (
      <View className="rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-4">
        <Text className="text-sm leading-6 text-white/55">
          Sport-specific dashboard context will appear after onboarding confirms a primary sport.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingRight: 24 }}
    >
      {sports.map((sport) => (
        <NeonPill
          key={sport.id}
          label={sport.label}
          detail={sport.detail}
          active={sport.id === selectedSportId}
          accent={accent}
          icon={<CircleDot color={sport.id === selectedSportId ? accent : 'rgba(255,255,255,0.35)'} size={13} />}
          onPress={() => onSelect(sport.id)}
        />
      ))}
    </ScrollView>
  )
}
