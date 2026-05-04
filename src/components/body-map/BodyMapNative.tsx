import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg'

import { getStatusColor, type CreedaStatus } from '../../theme/creedaTokens'
import { NeonPill } from '../ui/NeonPill'
import { StatusDot } from '../ui/StatusDot'

export type BodyMapSide = 'front' | 'back'
export type BodyMapRegion = {
  id: string
  label: string
  side: BodyMapSide
  x: number
  y: number
  status: CreedaStatus
  source: 'check_in' | 'health_sync' | 'movement_scan' | 'onboarding' | 'tracker' | 'manual'
  summary: string
  nextAction?: string
}

type BodyType = 'neutral' | 'compact' | 'tall'

const bodyTypeLabels: Array<{ id: BodyType; label: string }> = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'compact', label: 'Compact' },
  { id: 'tall', label: 'Tall' },
]

function sourceLabel(source: BodyMapRegion['source']) {
  return source.replace(/_/g, ' ')
}

export function BodyMapNative({
  regions = [],
  accent = '#1D9E75',
  scanLine = true,
}: {
  regions?: BodyMapRegion[]
  accent?: string
  scanLine?: boolean
}) {
  const { width } = useWindowDimensions()
  const [side, setSide] = useState<BodyMapSide>('front')
  const [bodyType, setBodyType] = useState<BodyType>('neutral')
  const visibleRegions = useMemo(
    () => regions.filter((region) => region.side === side),
    [regions, side]
  )
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const selectedRegion =
    visibleRegions.find((region) => region.id === selectedRegionId) ?? visibleRegions[0] ?? null
  const scanProgress = useSharedValue(0)
  const mapWidth = Math.min(width - 48, 320)
  const heightScale = bodyType === 'compact' ? 0.94 : bodyType === 'tall' ? 1.06 : 1

  useEffect(() => {
    if (!scanLine) return
    scanProgress.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [scanLine])

  useEffect(() => {
    setSelectedRegionId(null)
  }, [side])

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanProgress.value * 330 }],
  }))

  return (
    <View className="gap-5">
      <View className="flex-row flex-wrap gap-2">
        <NeonPill
          label="Front"
          active={side === 'front'}
          accent={accent}
          onPress={() => setSide('front')}
        />
        <NeonPill
          label="Back"
          active={side === 'back'}
          accent={accent}
          onPress={() => setSide('back')}
        />
      </View>

      <View className="flex-row flex-wrap gap-2">
        {bodyTypeLabels.map((item) => (
          <NeonPill
            key={item.id}
            label={item.label}
            active={bodyType === item.id}
            accent={accent}
            onPress={() => setBodyType(item.id)}
          />
        ))}
      </View>

      <View className="items-center overflow-hidden rounded-[30px] border border-white/5 bg-white/[0.03] px-4 py-6">
        <View style={{ width: mapWidth, height: 420 }} className="overflow-hidden">
          {scanLine ? (
            <Animated.View
              pointerEvents="none"
              className="absolute left-0 right-0 z-10 h-[2px]"
              style={[
                scanStyle,
                {
                  backgroundColor: accent,
                  shadowColor: accent,
                  shadowOpacity: 0.8,
                  shadowRadius: 14,
                },
              ]}
            />
          ) : null}
          <Svg width="100%" height="100%" viewBox="0 0 220 420">
            <Ellipse cx="110" cy="38" rx="28" ry="30" fill="rgba(255,255,255,0.10)" />
            <Rect
              x={bodyType === 'compact' ? 78 : 72}
              y="75"
              width={bodyType === 'compact' ? 64 : 76}
              height={132 * heightScale}
              rx="34"
              fill="rgba(255,255,255,0.09)"
            />
            <Line x1="74" y1="97" x2="36" y2="188" stroke="rgba(255,255,255,0.10)" strokeWidth="18" strokeLinecap="round" />
            <Line x1="146" y1="97" x2="184" y2="188" stroke="rgba(255,255,255,0.10)" strokeWidth="18" strokeLinecap="round" />
            <Line x1="91" y1="205" x2="82" y2="352" stroke="rgba(255,255,255,0.10)" strokeWidth="21" strokeLinecap="round" />
            <Line x1="129" y1="205" x2="138" y2="352" stroke="rgba(255,255,255,0.10)" strokeWidth="21" strokeLinecap="round" />
            <Path
              d={side === 'front' ? 'M82 112 C98 128 122 128 138 112' : 'M82 118 C100 104 120 104 138 118'}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {visibleRegions.map((region) => {
              const color = getStatusColor(region.status)
              const selected = selectedRegion?.id === region.id
              return (
                <Circle
                  key={region.id}
                  cx={region.x}
                  cy={region.y}
                  r={selected ? 10 : 8}
                  fill={color}
                  stroke={selected ? '#FFFFFF' : 'rgba(255,255,255,0.55)'}
                  strokeWidth={selected ? 3 : 1.5}
                  opacity={0.92}
                  onPress={() => setSelectedRegionId(region.id)}
                />
              )
            })}
          </Svg>
        </View>
      </View>

      {!regions.length ? (
        <View className="rounded-[24px] border border-white/5 bg-white/[0.035] p-5">
          <Text className="text-base font-black tracking-tight text-white">No body insights yet</Text>
          <Text className="mt-3 text-sm leading-6 text-white/58">
            Complete check-in, health sync, or movement scan to build body-map regions. Creeda will not infer injuries from blank data.
          </Text>
        </View>
      ) : selectedRegion ? (
        <View className="rounded-[24px] border border-white/5 bg-white/[0.035] p-5">
          <View className="flex-row items-center gap-2">
            <StatusDot status={selectedRegion.status} />
            <Text className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
              {sourceLabel(selectedRegion.source)}
            </Text>
          </View>
          <Text className="mt-3 text-xl font-black tracking-tight text-white">
            {selectedRegion.label}
          </Text>
          <Text className="mt-3 text-sm leading-6 text-white/60">{selectedRegion.summary}</Text>
          {selectedRegion.nextAction ? (
            <Text className="mt-3 text-sm leading-6 text-white/70">
              {selectedRegion.nextAction}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
