import type { ComponentType } from 'react'
import { Text, View } from 'react-native'

type IconComponent = ComponentType<{ color?: string; size?: number }>

export function MetricChip({
  label,
  value,
  unit,
  detail,
  accent = '#1D9E75',
  icon: Icon,
}: {
  label: string
  value: string
  unit?: string
  detail?: string
  accent?: string
  icon?: IconComponent
}) {
  return (
    <View className="min-w-[118px] flex-1 rounded-[22px] border border-white/5 bg-white/[0.035] px-4 py-4">
      <View className="flex-row items-center gap-2">
        {Icon ? <Icon color={accent} size={14} /> : null}
        <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
          {label}
        </Text>
      </View>
      <Text className="mt-3 text-2xl font-black tracking-tight text-white">
        {value}
        {unit ? <Text className="text-sm text-white/45"> {unit}</Text> : null}
      </Text>
      {detail ? <Text className="mt-2 text-xs leading-5 text-white/45">{detail}</Text> : null}
    </View>
  )
}
