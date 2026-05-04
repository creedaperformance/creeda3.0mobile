import type { ComponentType } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { ArrowRight } from 'lucide-react-native'

import { creedaTokens } from '../../theme/creedaTokens'

type IconComponent = ComponentType<{ color?: string; size?: number }>

export function PlaceholderScreen({
  title,
  body,
  eyebrow = 'Creeda mobile',
  accent = creedaTokens.colors.athlete,
  icon: Icon,
  actionLabel,
  onAction,
}: {
  title: string
  body: string
  eyebrow?: string
  accent?: string
  icon?: IconComponent
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 72 }}>
        <View className="rounded-[28px] border border-white/5 bg-background-glass p-6">
          <View className="flex-row items-center gap-3">
            {Icon ? (
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl border"
                style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18` }}
              >
                <Icon color={accent} size={22} />
              </View>
            ) : null}
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
                {eyebrow}
              </Text>
              <Text className="mt-2 text-3xl font-black tracking-tight text-white">
                {title}
              </Text>
            </View>
          </View>
          <Text className="mt-5 text-sm leading-6 text-white/60">{body}</Text>

          {actionLabel && onAction ? (
            <Pressable
              onPress={onAction}
              className="mt-6 flex-row items-center justify-between rounded-2xl border px-4 py-4"
              style={{ borderColor: `${accent}44`, backgroundColor: `${accent}14` }}
            >
              <Text className="text-xs font-black uppercase tracking-[0.18em] text-white">
                {actionLabel}
              </Text>
              <ArrowRight color={accent} size={16} />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  )
}
