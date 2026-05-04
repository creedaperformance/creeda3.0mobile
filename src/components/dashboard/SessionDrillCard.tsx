import type { ComponentType } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ArrowRight } from 'lucide-react-native'

type IconComponent = ComponentType<{ color?: string; size?: number }>

export function SessionDrillCard({
  title,
  detail,
  eyebrow,
  accent = '#1D9E75',
  icon: Icon,
  actionLabel,
  onPress,
}: {
  title: string
  detail: string
  eyebrow?: string
  accent?: string
  icon?: IconComponent
  actionLabel?: string
  onPress?: () => void
}) {
  const Container = onPress ? Pressable : View

  return (
    <Container
      onPress={onPress}
      className="rounded-[24px] border border-white/5 bg-white/[0.035] px-4 py-4"
    >
      <View className="flex-row items-start gap-3">
        {Icon ? (
          <View
            className="mt-1 h-10 w-10 items-center justify-center rounded-2xl border"
            style={{ borderColor: `${accent}44`, backgroundColor: `${accent}14` }}
          >
            <Icon color={accent} size={18} />
          </View>
        ) : null}
        <View className="flex-1">
          {eyebrow ? (
            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
              {eyebrow}
            </Text>
          ) : null}
          <Text className="mt-1 text-base font-black tracking-tight text-white">{title}</Text>
          <Text className="mt-2 text-sm leading-6 text-white/58">{detail}</Text>
          {actionLabel ? (
            <View className="mt-4 flex-row items-center gap-2">
              <Text className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accent }}>
                {actionLabel}
              </Text>
              <ArrowRight color={accent} size={14} />
            </View>
          ) : null}
        </View>
      </View>
    </Container>
  )
}
