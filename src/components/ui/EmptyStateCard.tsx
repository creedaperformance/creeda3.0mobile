import type { ComponentType } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ArrowRight } from 'lucide-react-native'

import { NeonGlassCardNative } from '../neon/NeonGlassCardNative'
import { SectionHeader } from './SectionHeader'

type IconComponent = ComponentType<{ color?: string; size?: number }>

export function EmptyStateCard({
  title,
  body,
  accent = '#1D9E75',
  icon,
  actionLabel,
  onAction,
}: {
  title: string
  body: string
  accent?: string
  icon?: IconComponent
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <NeonGlassCardNative>
      <SectionHeader title={title} detail={body} accent={accent} icon={icon} />
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-5 flex-row items-center justify-between rounded-2xl border px-4 py-4"
          style={{
            borderColor: `${accent}44`,
            backgroundColor: `${accent}14`,
          }}
        >
          <Text className="text-xs font-black uppercase tracking-[0.18em] text-white">
            {actionLabel}
          </Text>
          <ArrowRight color={accent} size={16} />
        </Pressable>
      ) : null}
    </NeonGlassCardNative>
  )
}
