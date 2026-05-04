import { ScrollView, Text, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { BookOpen, CheckCircle2, Lock, Target } from 'lucide-react-native'

import { GlowingButtonNative } from '../src/components/neon/GlowingButtonNative'
import { NeonGlassCardNative } from '../src/components/neon/NeonGlassCardNative'
import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { SectionHeader } from '../src/components/ui/SectionHeader'
import { useMobileAuth } from '../src/lib/auth'
import { creedaTokens } from '../src/theme/creedaTokens'

export default function LearnScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()

  if (!session) return <Redirect href="/login" />

  if (user && user.profile.role !== 'individual') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-xl font-black tracking-tight text-white">
          Learn is for FitStart accounts
        </Text>
        <Text className="mt-4 text-center text-sm leading-6 text-white/55">
          Your current mobile role is {user.profile.role}.
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          FitStart learn
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          Body literacy, one habit at a time.
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          Lessons stay empty until the mobile learn API returns real curriculum state.
        </Text>

        <EmptyStateCard
          title="Today's lesson is not available yet"
          body="Expected future endpoint: `GET /api/mobile/learn/daily`. Until then, Creeda will not show fake lessons or fake completion state."
          accent={creedaTokens.colors.individual}
          icon={BookOpen}
          actionLabel="Open Body Literacy"
          onAction={() => router.push('/body-literacy-score')}
        />

        <NeonGlassCardNative>
          <SectionHeader
            title="Library"
            detail="The library will list real lesson modules once the backend returns them."
            icon={Target}
            accent={creedaTokens.colors.individual}
          />
          <View className="mt-5 gap-3">
            <Text className="rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white/58">
              Readiness understanding - coming soon
            </Text>
            <Text className="rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white/58">
              Recovery signals - coming soon
            </Text>
            <Text className="rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white/58">
              Movement basics - coming soon
            </Text>
          </View>
        </NeonGlassCardNative>

        <View className="flex-row flex-wrap gap-3">
          <View className="flex-1 rounded-[22px] border border-white/5 bg-white/[0.035] p-4">
            <CheckCircle2 color={creedaTokens.colors.individual} size={18} />
            <Text className="mt-3 text-2xl font-black text-white">0</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Completed
            </Text>
          </View>
          <View className="flex-1 rounded-[22px] border border-white/5 bg-white/[0.035] p-4">
            <Lock color="rgba(255,255,255,0.5)" size={18} />
            <Text className="mt-3 text-2xl font-black text-white">--</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Gated
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <GlowingButtonNative
            title="Daily Ritual"
            variant="chakra"
            onPress={() => router.push('/daily-ritual')}
          />
        </View>
      </ScrollView>
    </View>
  )
}
