import { ScrollView, Text, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { BookOpen, Brain, Target } from 'lucide-react-native'

import { BodyMapNative } from '../src/components/body-map/BodyMapNative'
import { GlowingButtonNative } from '../src/components/neon/GlowingButtonNative'
import { NeonGlassCardNative } from '../src/components/neon/NeonGlassCardNative'
import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { SectionHeader } from '../src/components/ui/SectionHeader'
import { useMobileAuth } from '../src/lib/auth'
import { getRoleAccent } from '../src/theme/creedaTokens'

export default function BodyLiteracyScoreScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()
  const accent = getRoleAccent(user?.profile.role)

  if (!session) return <Redirect href="/login" />

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          Body literacy
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          Learn what your signals mean.
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          This is performance awareness, not a diagnosis or medical condition label.
        </Text>

        <NeonGlassCardNative watermark="BL">
          <View className="items-center">
            <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
              Current score
            </Text>
            <Text className="mt-3 text-6xl font-black tracking-tight text-white">--</Text>
            <Text className="mt-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ backgroundColor: `${accent}18`, color: accent }}>
              Building baseline
            </Text>
            <Text className="mt-5 text-center text-sm leading-6 text-white/58">
              Creeda needs real check-ins, movement scans, objective tests, or health-sync history before showing a numeric body literacy score.
            </Text>
          </View>
        </NeonGlassCardNative>

        <NeonGlassCardNative>
          <SectionHeader
            title="First goal prompt"
            detail="Start by completing one daily ritual and one movement baseline. That gives Creeda enough signal to explain readiness understanding without pretending certainty."
            icon={Target}
            accent={accent}
          />
          <View className="mt-5 gap-3">
            <GlowingButtonNative
              title="Daily Ritual"
              variant="chakra"
              onPress={() => router.push('/daily-ritual')}
            />
            <GlowingButtonNative
              title="Movement Baseline"
              variant="saffron"
              onPress={() => router.push('/movement-baseline')}
            />
          </View>
        </NeonGlassCardNative>

        <NeonGlassCardNative>
          <SectionHeader
            title="How Creeda builds it"
            detail="The score should combine consistency, body-region awareness, recovery inputs, and measured movement context once those fields exist in the mobile body-map response."
            icon={Brain}
            accent={accent}
          />
        </NeonGlassCardNative>

        <BodyMapNative regions={[]} accent={accent} />

        <EmptyStateCard
          title="Missing mobile body-map API"
          body="Expected future endpoint: `GET /api/mobile/body-map`. Until then, this screen does not invent weak links, injury risk, or region readiness."
          accent={accent}
          icon={BookOpen}
        />
      </ScrollView>
    </View>
  )
}
