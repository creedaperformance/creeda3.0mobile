import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { ArrowLeft, ArrowRight, BedDouble, Brain, Coffee, Dumbbell, TimerReset } from 'lucide-react-native'

import { GlowingButtonNative } from '../src/components/neon/GlowingButtonNative'
import { NeonGlassCardNative } from '../src/components/neon/NeonGlassCardNative'
import { EmptyStateCard } from '../src/components/ui/EmptyStateCard'
import { useMobileAuth } from '../src/lib/auth'
import { getRoleAccent } from '../src/theme/creedaTokens'

const questions = [
  {
    key: 'sleep',
    title: 'Sleep baseline',
    prompt: 'Most nights, how reliable is your sleep?',
    icon: BedDouble,
    options: ['Fragmented', 'Variable', 'Mostly steady', 'Strong'],
  },
  {
    key: 'stress',
    title: 'Stress load',
    prompt: 'What does life stress feel like in a normal week?',
    icon: Brain,
    options: ['Calm', 'Manageable', 'Heavy', 'Overloaded'],
  },
  {
    key: 'activity',
    title: 'Activity rhythm',
    prompt: 'Outside formal training, how active is your day?',
    icon: Dumbbell,
    options: ['Low', 'Light', 'Moderate', 'High'],
  },
  {
    key: 'sitting',
    title: 'Sitting exposure',
    prompt: 'How much sitting or desk time do you usually carry?',
    icon: TimerReset,
    options: ['Low', 'Some', 'Long blocks', 'Most of day'],
  },
  {
    key: 'diet',
    title: 'Food structure',
    prompt: 'How structured is your normal nutrition pattern?',
    icon: Coffee,
    options: ['Unstructured', 'Basic', 'Mostly planned', 'Very structured'],
  },
] as const

export default function LifestyleBaselineScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const accent = getRoleAccent(user?.profile.role)
  const activeQuestion = questions[step]
  const ActiveIcon = activeQuestion.icon
  const complete = Object.keys(answers).length === questions.length
  const progress = useMemo(() => Math.round(((step + 1) / questions.length) * 100), [step])

  if (!session) return <Redirect href="/login" />

  function chooseAnswer(value: string) {
    setAnswers((current) => ({ ...current, [activeQuestion.key]: value }))
    if (step < questions.length - 1) {
      setStep((current) => current + 1)
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} className="mb-8 flex-row items-center gap-3">
          <ArrowLeft color={accent} size={18} />
          <Text className="text-sm font-semibold text-white/60">Back</Text>
        </Pressable>

        <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          Lifestyle baseline
        </Text>
        <Text className="mt-3 text-4xl font-black tracking-tight text-white">
          Build the context around training.
        </Text>
        <Text className="mt-3 text-sm leading-6 text-white/58">
          Five fast inputs help explain readiness once the backend exposes the mobile baseline endpoint.
        </Text>

        <View className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
          <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accent }} />
        </View>
        <Text className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
          Step {step + 1} of {questions.length}
        </Text>

        <NeonGlassCardNative watermark="5Q">
          <View className="flex-row items-start gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18` }}
            >
              <ActiveIcon color={accent} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-black tracking-tight text-white">{activeQuestion.title}</Text>
              <Text className="mt-2 text-sm leading-6 text-white/58">{activeQuestion.prompt}</Text>
            </View>
          </View>

          <View className="mt-6 gap-3">
            {activeQuestion.options.map((option) => {
              const active = answers[activeQuestion.key] === option
              return (
                <Pressable
                  key={option}
                  onPress={() => chooseAnswer(option)}
                  className="rounded-2xl border px-4 py-4"
                  style={{
                    borderColor: active ? accent : 'rgba(255,255,255,0.07)',
                    backgroundColor: active ? `${accent}18` : 'rgba(255,255,255,0.035)',
                  }}
                >
                  <Text className="text-sm font-black tracking-tight text-white">{option}</Text>
                </Pressable>
              )
            })}
          </View>

          <View className="mt-6 flex-row justify-between">
            <Pressable
              disabled={step === 0}
              onPress={() => setStep((current) => Math.max(0, current - 1))}
              className="rounded-full border border-white/10 px-4 py-3"
              style={{ opacity: step === 0 ? 0.35 : 1 }}
            >
              <Text className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                Previous
              </Text>
            </Pressable>
            <Pressable
              disabled={step === questions.length - 1}
              onPress={() => setStep((current) => Math.min(questions.length - 1, current + 1))}
              className="flex-row items-center gap-2 rounded-full border border-white/10 px-4 py-3"
              style={{ opacity: step === questions.length - 1 ? 0.35 : 1 }}
            >
              <Text className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                Next
              </Text>
              <ArrowRight color="rgba(255,255,255,0.6)" size={14} />
            </Pressable>
          </View>
        </NeonGlassCardNative>

        {complete ? (
          <EmptyStateCard
            title="Baseline answers are captured on screen only"
            body="This app does not yet have a supported `POST /api/mobile/lifestyle-baseline` endpoint. To persist real baseline data today, continue through FitStart or onboarding Phase 2."
            accent={accent}
            actionLabel={user?.profile.role === 'individual' ? 'Open FitStart' : 'Open Phase 2'}
            onAction={() =>
              user?.profile.role === 'individual'
                ? router.push('/fitstart')
                : router.push('/onboarding-phase-2')
            }
          />
        ) : null}

        <View className="mt-4">
          <GlowingButtonNative
            title="Open Body Literacy"
            variant="chakra"
            onPress={() => router.push('/body-literacy-score')}
          />
        </View>
      </ScrollView>
    </View>
  )
}
