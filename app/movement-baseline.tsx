import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Camera, useCameraPermission } from 'react-native-vision-camera'
import {
  KnownPoseLandmarkConnections,
  KnownPoseLandmarks,
  MediapipeCamera,
  RunningMode,
  usePoseDetection,
  type PoseDetectionResultBundle,
} from 'react-native-mediapipe'
import { Canvas, Circle, Line, vec } from '@shopify/react-native-skia'

import { useMobileAuth } from '../src/lib/auth'
import { mobileEnv } from '../src/lib/env'
import {
  computeOverheadSquatGeometry,
  evaluateScanQuality,
  findPeakFrame,
  scoreOverheadSquat,
  type FrameLandmarks,
  type WeakLink,
} from '../src/vision/geometry'

type ScanState =
  | { kind: 'idle' }
  | { kind: 'permission_required' }
  | { kind: 'setup' }
  | { kind: 'countdown'; seconds: 3 | 2 | 1 }
  | { kind: 'scanning'; framesCaptured: number }
  | {
      kind: 'review'
      score: number
      weakLinks: WeakLink[]
      passed: boolean
      rejectionReason?: string
    }
  | { kind: 'submitting' }
  | { kind: 'submitted'; score: number; weakLinks: WeakLink[] }
  | { kind: 'error'; message: string }

const SCAN_DURATION_MS = 6000
const TARGET_FPS = 8 // 8 fps × 6 seconds = 48 captured pose frames — plenty

export default function MovementBaselineScreen() {
  const router = useRouter()
  const { session, user } = useMobileAuth()
  const { hasPermission, requestPermission } = useCameraPermission()
  const cameraRef = useRef<Camera | null>(null)
  const framesRef = useRef<FrameLandmarks[]>([])
  const [latestFrame, setLatestFrame] = useState<FrameLandmarks | null>(null)
  const [state, setState] = useState<ScanState>(
    hasPermission ? { kind: 'setup' } : { kind: 'permission_required' }
  )

  const handlePoseResult = useCallback(
    (result: PoseDetectionResultBundle) => {
      const firstResult = result.results[0]
      const firstPose = firstResult?.landmarks?.[0]
      if (!firstPose || firstPose.length === 0) return
      setLatestFrame(firstPose)
      setState((current) => {
        if (current.kind === 'scanning') {
          framesRef.current.push(firstPose)
          return { kind: 'scanning', framesCaptured: framesRef.current.length }
        }
        return current
      })
    },
    []
  )

  const handlePoseError = useCallback((error: unknown) => {
    console.warn('[movement-baseline] pose error', error)
  }, [])

  const solution = usePoseDetection(
    {
      onResults: handlePoseResult,
      onError: handlePoseError,
    },
    RunningMode.LIVE_STREAM,
    'pose_landmarker_full.task',
    { numPoses: 1, minPoseDetectionConfidence: 0.4, minTrackingConfidence: 0.4 }
  )

  const persona = useMemo<'athlete' | 'individual'>(() => {
    const role = user?.profile.role
    return role === 'individual' ? 'individual' : 'athlete'
  }, [user])

  const handleAskPermission = async () => {
    const ok = await requestPermission()
    if (ok) setState({ kind: 'setup' })
  }

  const startScan = async () => {
    framesRef.current = []
    setLatestFrame(null)
    setState({ kind: 'countdown', seconds: 3 })

    await wait(1000)
    setState({ kind: 'countdown', seconds: 2 })
    await wait(1000)
    setState({ kind: 'countdown', seconds: 1 })
    await wait(1000)

    setState({ kind: 'scanning', framesCaptured: 0 })
    await wait(SCAN_DURATION_MS)

    const collectedFrames = framesRef.current.slice()
    const quality = evaluateScanQuality(collectedFrames)
    if (!quality.passed_quality_gate) {
      setState({
        kind: 'review',
        score: 0,
        weakLinks: [],
        passed: false,
        rejectionReason: quality.rejection_reason,
      })
      return
    }

    const peak = findPeakFrame(collectedFrames)
    if (!peak) {
      setState({
        kind: 'review',
        score: 0,
        weakLinks: [],
        passed: false,
        rejectionReason: 'Could not find a clear squat depth in the video — please retry.',
      })
      return
    }

    const geometry = computeOverheadSquatGeometry(peak)
    if (!geometry) {
      setState({
        kind: 'review',
        score: 0,
        weakLinks: [],
        passed: false,
        rejectionReason: 'Some landmarks were missing — make sure your full body is in the frame.',
      })
      return
    }

    const { score, weakLinks } = scoreOverheadSquat(geometry)
    setState({ kind: 'review', score, weakLinks, passed: true })

    // Auto-submit on success
    if (session?.access_token) {
      void submitResult({
        accessToken: session.access_token,
        persona,
        geometry,
        score,
        weakLinks,
        quality,
      })
        .then(() => setState({ kind: 'submitted', score, weakLinks }))
        .catch((err: Error) =>
          setState({ kind: 'error', message: err.message ?? 'Submission failed.' })
        )
      setState({ kind: 'submitting' })
    }
  }

  return (
    <View className="flex-1 bg-[#04070A]">
      <View className="absolute inset-0">
        {hasPermission && state.kind !== 'idle' && state.kind !== 'permission_required' ? (
          <MediapipeCamera
            ref={cameraRef}
            style={{ flex: 1 }}
            solution={solution}
            activeCamera="front"
            resizeMode="cover"
          />
        ) : null}
      </View>

      {/* ── Skeleton overlay during live preview + scanning ── */}
      {(state.kind === 'setup' ||
        state.kind === 'countdown' ||
        state.kind === 'scanning') &&
      latestFrame ? (
        <View pointerEvents="none" className="absolute inset-0">
          <PoseSkeleton frame={latestFrame} />
        </View>
      ) : null}

      {/* ── State-driven foreground UI ── */}
      <View className="absolute inset-x-0 top-0 px-5 pt-12">
        <Pressable onPress={() => router.back()}>
          <Text className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
            ← Back
          </Text>
        </Pressable>
      </View>

      {state.kind === 'permission_required' ? (
        <FullScreenCard title="Camera permission needed" body="To scan your overhead squat, Creeda needs camera access. Footage stays on your device — only the 33-point landmark JSON is sent up.">
          <PrimaryButton label="Grant camera access" onPress={handleAskPermission} />
        </FullScreenCard>
      ) : null}

      {state.kind === 'setup' ? (
        <FullScreenCard
          title="Overhead squat baseline"
          body="Prop your phone vertically about 2 metres back. Keep your full body in frame. We capture 6 seconds — perform 2–3 full-depth squats with arms held overhead."
        >
          <PrimaryButton label="I'm ready · start countdown" onPress={startScan} />
        </FullScreenCard>
      ) : null}

      {state.kind === 'countdown' ? (
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-[160px] font-black leading-none text-white drop-shadow-lg">
            {state.seconds}
          </Text>
        </View>
      ) : null}

      {state.kind === 'scanning' ? (
        <View className="absolute inset-x-0 bottom-12 items-center">
          <View className="rounded-2xl bg-rose-500/85 px-4 py-2">
            <Text className="text-[12px] font-bold uppercase tracking-[0.22em] text-white">
              Recording · {state.framesCaptured} frames captured
            </Text>
          </View>
        </View>
      ) : null}

      {state.kind === 'review' && !state.passed ? (
        <FullScreenCard title="Scan didn't pass quality" body={state.rejectionReason ?? 'Please try again.'}>
          <PrimaryButton label="Try again" onPress={startScan} />
        </FullScreenCard>
      ) : null}

      {state.kind === 'submitting' ? (
        <FullScreenCard title="Analysing your squat…" body="Computing geometry and weak links.">
          <ActivityIndicator color="#6EE7B7" size="large" />
        </FullScreenCard>
      ) : null}

      {state.kind === 'submitted' ? (
        <FullScreenCard
          title={`Movement quality: ${state.score}/100`}
          body={
            state.weakLinks.length > 0
              ? `We found ${state.weakLinks.length} thing${state.weakLinks.length === 1 ? '' : 's'} to watch.`
              : 'No red flags detected. Creeda will retest in 4 weeks.'
          }
        >
          <ScrollView className="max-h-72 w-full self-stretch">
            {state.weakLinks.map((link, idx) => (
              <View key={idx} className="mb-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <Text
                  className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                    link.severity === 'severe'
                      ? 'text-rose-300'
                      : link.severity === 'moderate'
                        ? 'text-amber-300'
                        : 'text-white/55'
                  }`}
                >
                  {link.severity}
                </Text>
                <Text className="mt-1 text-sm font-bold text-white">{link.finding}</Text>
                <Text className="mt-0.5 text-[11px] text-white/55">{link.region.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </ScrollView>
          <PrimaryButton label="Open dashboard" onPress={() => router.replace('/(tabs)')} />
        </FullScreenCard>
      ) : null}

      {state.kind === 'error' ? (
        <FullScreenCard title="Something went wrong" body={state.message}>
          <PrimaryButton label="Try again" onPress={startScan} />
        </FullScreenCard>
      ) : null}
    </View>
  )
}

function FullScreenCard({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children?: React.ReactNode
}) {
  return (
    <View className="absolute inset-x-4 bottom-8 rounded-3xl bg-black/65 p-5 backdrop-blur">
      <Text className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6EE7B7]">
        Movement baseline
      </Text>
      <Text className="mt-2 text-2xl font-black tracking-tight text-white">{title}</Text>
      <Text className="mt-2 text-sm leading-5 text-white/70">{body}</Text>
      {children ? <View className="mt-4">{children}</View> : null}
    </View>
  )
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl bg-[#6EE7B7] px-5 py-3"
    >
      <Text className="text-center text-[13px] font-black uppercase tracking-[0.18em] text-slate-950">
        {label}
      </Text>
    </Pressable>
  )
}

function PoseSkeleton({ frame }: { frame: FrameLandmarks }) {
  // Render landmarks proportionally inside the camera viewport.
  return (
    <Canvas style={{ flex: 1 }}>
      {KnownPoseLandmarkConnections.map(([fromIdx, toIdx], i) => {
        const from = frame[fromIdx]
        const to = frame[toIdx]
        if (!from || !to) return null
        if ((from.visibility ?? 0) < 0.4 || (to.visibility ?? 0) < 0.4) return null
        return (
          <Line
            key={`line-${i}`}
            p1={vec(from.x * 100 + '%' as unknown as number, from.y * 100 + '%' as unknown as number)}
            p2={vec(to.x * 100 + '%' as unknown as number, to.y * 100 + '%' as unknown as number)}
            color="rgba(110,231,183,0.7)"
            strokeWidth={3}
          />
        )
      })}
      {Object.values(KnownPoseLandmarks).map((idx) => {
        const lm = frame[idx]
        if (!lm) return null
        if ((lm.visibility ?? 0) < 0.4) return null
        return (
          <Circle
            key={`dot-${idx}`}
            cx={lm.x * 100 + '%' as unknown as number}
            cy={lm.y * 100 + '%' as unknown as number}
            r={3.5}
            color="#6EE7B7"
          />
        )
      })}
    </Canvas>
  )
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function submitResult(args: {
  accessToken: string
  persona: 'athlete' | 'individual'
  geometry: ReturnType<typeof computeOverheadSquatGeometry>
  score: number
  weakLinks: WeakLink[]
  quality: ReturnType<typeof evaluateScanQuality>
}) {
  if (!args.geometry) throw new Error('No geometry to submit.')
  const res = await fetch(`${mobileEnv.apiBaseUrl}/api/mobile/onboarding/v2/movement-baseline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.accessToken}`,
    },
    body: JSON.stringify({
      persona: args.persona,
      source: 'mobile',
      report_id: `mobile-${Date.now()}`,
      sport_id: 'general',
      scan_type: 'overhead_squat_baseline',
      geometry: args.geometry,
      movement_quality_score: args.score,
      weak_links: args.weakLinks,
      full_body_coverage_pct: args.quality.full_body_coverage_pct,
      motion_evidence_score: args.quality.motion_evidence_score,
      passed_quality_gate: args.quality.passed_quality_gate,
      rejection_reason: args.quality.rejection_reason,
      device_meta: { platform: 'android', detector: 'mediapipe-pose-landmarker' },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Submission failed (${res.status}): ${text.slice(0, 120)}`)
  }
}
