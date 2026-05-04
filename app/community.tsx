import { ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { MapPin, Share2, Trophy, Users } from 'lucide-react-native'

import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { useMobileAuth } from '../src/lib/auth'
import { creedaTokens } from '../src/theme/creedaTokens'

export default function CommunityScreen() {
  const { session, user } = useMobileAuth()

  if (!session) return <Redirect href="/login" />

  if (user && user.profile.role !== 'individual') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-xl font-black tracking-tight text-white">
          Tribe is for FitStart accounts
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
          FitStart tribe
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          Community without fake leaderboards.
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          This structure is ready, but community data needs backend, privacy, and location support.
        </Text>

        <EmptyStateCard
          title="Challenges"
          body="Expected future endpoint: `GET /api/mobile/community/challenges`. No fake challenges are shown."
          accent={creedaTokens.colors.individual}
          icon={Trophy}
        />
        <EmptyStateCard
          title="Nearby coaches and athletes"
          body="Expected future endpoint: `GET /api/mobile/community/nearby`. Location and privacy rules must be implemented before this appears."
          accent={creedaTokens.colors.individual}
          icon={MapPin}
        />
        <EmptyStateCard
          title="Share"
          body="Sharing needs a supported public card or deep-link contract before enabling user-facing posts."
          accent={creedaTokens.colors.individual}
          icon={Share2}
        />
        <EmptyStateCard
          title="Leaderboard"
          body="Leaderboards remain empty until real opt-in challenge scores exist."
          accent={creedaTokens.colors.individual}
          icon={Users}
        />
      </ScrollView>
    </View>
  )
}
