import type { ComponentType } from 'react'
import { Text, View } from 'react-native'

type IconComponent = ComponentType<{ color?: string; size?: number }>

export function SectionHeader({
  title,
  detail,
  eyebrow,
  accent = '#1D9E75',
  icon: Icon,
}: {
  title: string
  detail?: string
  eyebrow?: string
  accent?: string
  icon?: IconComponent
}) {
  return (
    <View className="flex-row items-start gap-3">
      {Icon ? (
        <View className="mt-1 rounded-2xl border border-white/5 bg-white/[0.04] p-2">
          <Icon color={accent} size={16} />
        </View>
      ) : null}
      <View className="flex-1">
        {eyebrow ? (
          <Text className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
            {eyebrow}
          </Text>
        ) : null}
        <Text className="text-lg font-black tracking-tight text-white">{title}</Text>
        {detail ? <Text className="mt-2 text-sm leading-6 text-white/55">{detail}</Text> : null}
      </View>
    </View>
  )
}
