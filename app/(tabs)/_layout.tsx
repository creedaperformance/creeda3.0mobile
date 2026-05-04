import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useMobileAuth } from '../../src/lib/auth';
import { getRoleAccent } from '../../src/theme/creedaTokens';

export default function TabLayout() {
  const { loading, session, user } = useMobileAuth();
  const role = user?.profile.role ?? null;
  const accent = getRoleAccent(role);
  const fallbackTabs = !role;
  const athleteTabs = role === 'athlete';
  const coachTabs = role === 'coach';
  const individualTabs = role === 'individual';
  const hidden = { href: null };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ActivityIndicator color={accent} size="large" />
        <Text className="mt-4 text-center text-sm font-semibold tracking-wide text-white/70">
          Checking your CREEDA session...
        </Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0E',
          borderTopColor: 'rgba(255,255,255,0.04)',
          height: 90,
          paddingBottom: 30,
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: coachTabs ? 'Squad' : individualTabs ? 'Today' : 'Home',
          tabBarIcon: ({ color }) =>
            coachTabs ? <Users color={color} size={24} /> : <Activity color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          ...(athleteTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          ...(athleteTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: athleteTabs ? 'Recovery' : 'Health',
          ...((athleteTabs || fallbackTabs) ? {} : hidden),
          tabBarIcon: ({ color }) => <HeartPulse color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: individualTabs ? 'Me' : athleteTabs ? 'Profile' : 'Account',
          ...((athleteTabs || individualTabs || fallbackTabs) ? {} : hidden),
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          ...(coachTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <Dumbbell color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: 'Care',
          ...(coachTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: 'Academy',
          ...(coachTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <BookOpen color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          ...(coachTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <Brain color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          ...(individualTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <BookOpen color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="body"
        options={{
          title: 'Body',
          ...(individualTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <HeartPulse color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="tribe"
        options={{
          title: 'Tribe',
          ...(individualTabs ? {} : hidden),
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
