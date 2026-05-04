import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

export function NeonPill({
  label,
  detail,
  active = false,
  accent = '#1D9E75',
  icon,
  onPress,
}: {
  label: string
  detail?: string
  active?: boolean
  accent?: string
  icon?: ReactNode
  onPress?: () => void
}) {
  const Container = onPress ? Pressable : View

  return (
    <Container
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-full border px-4 py-3"
      style={{
        borderColor: active ? accent : 'rgba(255,255,255,0.07)',
        backgroundColor: active ? `${accent}22` : 'rgba(255,255,255,0.035)',
      }}
    >
      {icon}
      <View>
        <Text
          className="text-xs font-black uppercase tracking-[0.18em]"
          style={{ color: active ? accent : 'rgba(255,255,255,0.78)' }}
        >
          {label}
        </Text>
        {detail ? <Text className="mt-1 text-[10px] text-white/42">{detail}</Text> : null}
      </View>
    </Container>
  )
}
