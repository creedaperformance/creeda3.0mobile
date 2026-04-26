import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'

import { useMobileAuth } from '../src/lib/auth'
import { sendAiChat } from '../src/lib/mobile-api'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type Topic =
  | 'general'
  | 'training'
  | 'nutrition'
  | 'recovery'
  | 'injury'
  | 'sleep'
  | 'mental'
  | 'sport_specific'
  | 'medical_report'
  | 'wearable'

const TOPICS: Array<{ id: Topic; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'training', label: 'Training' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'injury', label: 'Injury' },
  { id: 'sport_specific', label: 'My sport' },
  { id: 'medical_report', label: 'Medical' },
]

const STARTERS: Record<Topic, string[]> = {
  general: [
    'What is my readiness score actually measuring?',
    'How does Creeda decide today’s recommendation?',
  ],
  training: [
    'Explain progressive overload for someone new to lifting.',
    'How do I know if I am training too hard?',
  ],
  recovery: [
    'What does HRV tell me that resting heart rate does not?',
    'How should I structure a deload week?',
  ],
  nutrition: [
    'How much protein do I need for my sport?',
    'I am vegetarian — what should I be careful about?',
  ],
  sleep: [
    'I sleep 7 hours but wake up tired. What could be off?',
    'Does sleep timing matter as much as duration?',
  ],
  injury: [
    'My right knee tracks inward when I squat — what does that mean?',
    'When should I see a physio vs ride it out?',
  ],
  mental: [
    'How do I tell training hard from mental burnout?',
    'What does APSQ-10 actually measure?',
  ],
  sport_specific: [
    'How should a centre-back train differently from a striker?',
    'What is special about pace bowler conditioning?',
  ],
  medical_report: [
    'Explain the ferritin marker on my last blood test.',
    'What should I follow up on first?',
  ],
  wearable: [
    'How accurate is my Garmin recovery score?',
    'Why does my HRV drop on travel days?',
  ],
}

export default function AiCoachScreen() {
  const router = useRouter()
  const { session } = useMobileAuth()
  const [topic, setTopic] = useState<Topic>('general')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  async function send(promptOverride?: string) {
    if (!session?.access_token) {
      setError('You need to sign in to use the AI coach.')
      return
    }
    const userMessage = (promptOverride ?? input).trim()
    if (!userMessage || isLoading) return

    setError(null)
    setInput('')
    setIsLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await sendAiChat(session.access_token, {
        conversation_id: conversationId ?? undefined,
        topic,
        user_message: userMessage,
      })
      setConversationId(response.conversation.id)
      setMessages((prev) => [...prev, { role: 'assistant', content: response.message.content }])
    } catch (err) {
      setError((err as Error).message ?? 'AI coach is unavailable right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const starters = STARTERS[topic] ?? []

  return (
    <View className="flex-1 bg-[#04070A]">
      <View className="border-b border-white/10 px-5 pb-3 pt-12">
        <Pressable onPress={() => router.back()}>
          <Text className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
            ← Back
          </Text>
        </Pressable>
        <Text className="mt-3 text-2xl font-black tracking-tight text-white">
          AI Sports Scientist
        </Text>
        <Text className="mt-1 text-[12px] leading-5 text-white/50">
          Ask anything about training, recovery, nutrition, sleep, your sport, or any medical
          report. Educational — not a substitute for a doctor.
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingRight: 12 }}
        >
          {TOPICS.map((chip) => {
            const active = chip.id === topic
            return (
              <Pressable
                key={chip.id}
                onPress={() => setTopic(chip.id)}
                className={`mr-2 rounded-full border px-3 py-1.5 ${
                  active
                    ? 'border-[#6EE7B7]/70 bg-[#6EE7B7]/15'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
                    active ? 'text-[#A7F3D0]' : 'text-white/55'
                  }`}
                >
                  {chip.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={88}
      >
        <ScrollView
          ref={(ref) => {
            scrollRef.current = ref
          }}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
        >
          {messages.length === 0 ? (
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                Suggested starters · {topic.replace(/_/g, ' ')}
              </Text>
              <View className="mt-3">
                {starters.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => send(prompt)}
                    className="mb-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                  >
                    <Text className="text-sm leading-5 text-white/72">{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((message, idx) => (
              <View
                key={idx}
                className={`mb-3 max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                  message.role === 'user'
                    ? 'self-end rounded-br-sm bg-[#6EE7B7]'
                    : 'self-start rounded-bl-sm bg-white/[0.05]'
                }`}
              >
                <Text
                  className={`text-sm leading-5 ${
                    message.role === 'user' ? 'text-slate-950' : 'text-white/85'
                  }`}
                >
                  {message.content}
                </Text>
              </View>
            ))
          )}
          {isLoading ? (
            <View className="self-start mt-1 rounded-2xl bg-white/[0.05] px-3 py-2">
              <ActivityIndicator color="#6EE7B7" />
            </View>
          ) : null}
          {error ? (
            <Text className="mt-2 text-[11px] font-bold text-rose-300">{error}</Text>
          ) : null}
        </ScrollView>

        <View className="border-t border-white/10 bg-[#070b13] px-4 py-3">
          <View className="flex-row items-end gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask the AI sports scientist…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              className="flex-1 min-h-[44px] max-h-32 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white"
            />
            <Pressable
              onPress={() => send()}
              disabled={isLoading || !input.trim()}
              className={`h-11 w-11 items-center justify-center rounded-2xl ${
                isLoading || !input.trim() ? 'bg-white/[0.05]' : 'bg-[#6EE7B7]'
              }`}
            >
              <Text className="text-base font-black text-slate-950">↑</Text>
            </Pressable>
          </View>
          <Text className="mt-2 text-[10px] leading-4 text-white/35">
            Educational only — never a substitute for a clinician, coach, or dietitian.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
