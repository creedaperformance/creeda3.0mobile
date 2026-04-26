/**
 * Geometry math for the overhead-squat baseline scan.
 * Mirrors the calculations in @creeda/engine/movement-quality.ts so mobile
 * and web produce comparable results from the same 33 MediaPipe landmarks.
 */

import type { Landmark } from 'react-native-mediapipe'

import { KnownPoseLandmarks } from 'react-native-mediapipe'

export type Point2 = { x: number; y: number; visibility?: number; presence?: number }

export type OverheadSquatGeometry = {
  knee_valgus_deg_left: number
  knee_valgus_deg_right: number
  ankle_dorsiflexion_deg_left: number
  ankle_dorsiflexion_deg_right: number
  thoracic_extension_deg: number
  hip_shoulder_asymmetry_deg: number
  squat_depth_ratio: number
}

export type WeakLink = {
  region: string
  finding: string
  severity: 'mild' | 'moderate' | 'severe'
  drill_id: string
}

export type GeometryQuality = {
  full_body_coverage_pct: number
  motion_evidence_score: number
  passed_quality_gate: boolean
  rejection_reason?: string
}

export type FrameLandmarks = Landmark[]

const VISIBILITY_THRESHOLD = 0.5

function pickLandmark(frame: FrameLandmarks, idx: number): Point2 | null {
  const lm = frame[idx]
  if (!lm) return null
  if ((lm.visibility ?? 0) < VISIBILITY_THRESHOLD) return null
  return { x: lm.x, y: lm.y, visibility: lm.visibility, presence: lm.presence }
}

function angleBetween(a: Point2, b: Point2, c: Point2): number {
  // Returns the angle ABC at vertex B, in degrees.
  const v1 = { x: a.x - b.x, y: a.y - b.y }
  const v2 = { x: c.x - b.x, y: c.y - b.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  if (m1 === 0 || m2 === 0) return 0
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)))
  return (Math.acos(cos) * 180) / Math.PI
}

function distance(a: Point2, b: Point2) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: Point2, b: Point2): Point2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function frameCoverage(frame: FrameLandmarks): number {
  if (!frame || frame.length === 0) return 0
  const visible = frame.filter((l) => (l.visibility ?? 0) >= VISIBILITY_THRESHOLD).length
  return Math.round((visible / 33) * 100)
}

function frameAnkleHipY(frame: FrameLandmarks): number | null {
  const lh = pickLandmark(frame, KnownPoseLandmarks.leftHip)
  const rh = pickLandmark(frame, KnownPoseLandmarks.rightHip)
  if (!lh || !rh) return null
  return (lh.y + rh.y) / 2
}

/**
 * Pick the deepest squat frame across all captured landmark frames.
 * "Deepest" = highest hip Y value (image origin is top-left, so larger Y = lower).
 */
export function findPeakFrame(frames: FrameLandmarks[]): FrameLandmarks | null {
  let best: FrameLandmarks | null = null
  let bestY = -Infinity
  for (const frame of frames) {
    const hipY = frameAnkleHipY(frame)
    if (hipY === null) continue
    if (hipY > bestY) {
      bestY = hipY
      best = frame
    }
  }
  return best
}

/** Quality gate: ensures we got a usable scan before computing geometry. */
export function evaluateScanQuality(frames: FrameLandmarks[]): GeometryQuality {
  if (!frames || frames.length < 8) {
    return {
      full_body_coverage_pct: 0,
      motion_evidence_score: 0,
      passed_quality_gate: false,
      rejection_reason: 'Scan too short — try again with the camera further back.',
    }
  }

  const coverages = frames.map(frameCoverage)
  const avgCoverage = coverages.reduce((s, v) => s + v, 0) / coverages.length

  // Motion evidence: total displacement of hip midpoint across frames.
  let displacement = 0
  let lastY: number | null = null
  for (const frame of frames) {
    const hipY = frameAnkleHipY(frame)
    if (hipY === null) continue
    if (lastY !== null) displacement += Math.abs(hipY - lastY)
    lastY = hipY
  }
  // Normalise to 0-100 scale based on expected squat depth motion (~0.25 in
  // normalised coords times number of reps).
  const motionScore = Math.min(100, Math.round((displacement / 0.5) * 100))

  if (avgCoverage < 70) {
    return {
      full_body_coverage_pct: Math.round(avgCoverage),
      motion_evidence_score: motionScore,
      passed_quality_gate: false,
      rejection_reason: 'Step back so your full body fits in the frame.',
    }
  }

  if (motionScore < 30) {
    return {
      full_body_coverage_pct: Math.round(avgCoverage),
      motion_evidence_score: motionScore,
      passed_quality_gate: false,
      rejection_reason: 'We did not see enough movement — make sure to squat through full depth.',
    }
  }

  return {
    full_body_coverage_pct: Math.round(avgCoverage),
    motion_evidence_score: motionScore,
    passed_quality_gate: true,
  }
}

export function computeOverheadSquatGeometry(
  peakFrame: FrameLandmarks
): OverheadSquatGeometry | null {
  const lhip = pickLandmark(peakFrame, KnownPoseLandmarks.leftHip)
  const rhip = pickLandmark(peakFrame, KnownPoseLandmarks.rightHip)
  const lknee = pickLandmark(peakFrame, KnownPoseLandmarks.leftKnee)
  const rknee = pickLandmark(peakFrame, KnownPoseLandmarks.rightKnee)
  const lankle = pickLandmark(peakFrame, KnownPoseLandmarks.leftAnkle)
  const rankle = pickLandmark(peakFrame, KnownPoseLandmarks.rightAnkle)
  const lshoulder = pickLandmark(peakFrame, KnownPoseLandmarks.leftShoulder)
  const rshoulder = pickLandmark(peakFrame, KnownPoseLandmarks.rightShoulder)
  const nose = pickLandmark(peakFrame, KnownPoseLandmarks.nose)
  const lheel = pickLandmark(peakFrame, KnownPoseLandmarks.leftHeel)
  const rheel = pickLandmark(peakFrame, KnownPoseLandmarks.rightHeel)
  const lfoot = pickLandmark(peakFrame, KnownPoseLandmarks.leftFootIndex)
  const rfoot = pickLandmark(peakFrame, KnownPoseLandmarks.rightFootIndex)

  if (
    !lhip ||
    !rhip ||
    !lknee ||
    !rknee ||
    !lankle ||
    !rankle ||
    !lshoulder ||
    !rshoulder
  ) {
    return null
  }

  // Knee valgus: deviation of the knee from the hip→ankle line in 2D image plane.
  // 0° = perfectly stacked. Positive = knee moves inward (toward midline).
  const valgus = (hip: Point2, knee: Point2, ankle: Point2, mirror = false) => {
    const lineMidX = (hip.x + ankle.x) / 2
    const dev = mirror ? lineMidX - knee.x : knee.x - lineMidX
    const stackHeight = Math.max(Math.abs(hip.y - ankle.y), 0.01)
    return Math.max(0, (Math.atan2(Math.abs(dev), stackHeight) * 180) / Math.PI)
  }

  const knee_valgus_deg_left = valgus(lhip, lknee, lankle, true)
  const knee_valgus_deg_right = valgus(rhip, rknee, rankle, false)

  // Ankle dorsiflexion: angle at the ankle between knee→ankle and ankle→foot.
  // Higher = more flexion. Default to 30° if foot landmarks are missing.
  let ankle_dorsiflexion_deg_left = 30
  let ankle_dorsiflexion_deg_right = 30
  if (lheel && lfoot) {
    ankle_dorsiflexion_deg_left = Math.min(90, angleBetween(lknee, lankle, lfoot))
  }
  if (rheel && rfoot) {
    ankle_dorsiflexion_deg_right = Math.min(90, angleBetween(rknee, rankle, rfoot))
  }

  // Thoracic extension: angle of the torso (shoulder midpoint → nose) from vertical.
  let thoracic_extension_deg = 30
  if (nose) {
    const shoulderMid = midpoint(lshoulder, rshoulder)
    const torsoAngle = Math.atan2(
      Math.abs(nose.x - shoulderMid.x),
      Math.abs(shoulderMid.y - nose.y) + 0.001
    )
    thoracic_extension_deg = Math.min(90, Math.max(0, 90 - (torsoAngle * 180) / Math.PI))
  }

  // Hip-shoulder asymmetry: difference in line angles vs horizontal.
  const hipLineAngle =
    (Math.atan2(rhip.y - lhip.y, rhip.x - lhip.x) * 180) / Math.PI
  const shoulderLineAngle =
    (Math.atan2(rshoulder.y - lshoulder.y, rshoulder.x - lshoulder.x) * 180) / Math.PI
  const hip_shoulder_asymmetry_deg = Math.min(60, Math.abs(hipLineAngle - shoulderLineAngle))

  // Squat depth ratio: hip drop relative to thigh length.
  const hipMid = midpoint(lhip, rhip)
  const ankleMid = midpoint(lankle, rankle)
  const kneeMid = midpoint(lknee, rknee)
  const thigh = Math.max(distance(hipMid, kneeMid), 0.01)
  const hipToAnkle = Math.max(distance(hipMid, ankleMid), 0.01)
  const squat_depth_ratio = Math.max(0, Math.min(1.5, 1.0 - (hipToAnkle - thigh) / thigh))

  return {
    knee_valgus_deg_left: round1(knee_valgus_deg_left),
    knee_valgus_deg_right: round1(knee_valgus_deg_right),
    ankle_dorsiflexion_deg_left: round1(ankle_dorsiflexion_deg_left),
    ankle_dorsiflexion_deg_right: round1(ankle_dorsiflexion_deg_right),
    thoracic_extension_deg: round1(thoracic_extension_deg),
    hip_shoulder_asymmetry_deg: round1(hip_shoulder_asymmetry_deg),
    squat_depth_ratio: round2(squat_depth_ratio),
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Score the overhead squat 0-100 + emit weak-link findings the AI/engine can
 * act on. Mirrors @creeda/engine/movement-quality.ts.
 */
export function scoreOverheadSquat(g: OverheadSquatGeometry): {
  score: number
  weakLinks: WeakLink[]
} {
  let score = 100
  const weakLinks: WeakLink[] = []

  const valgusMax = Math.max(g.knee_valgus_deg_left, g.knee_valgus_deg_right)
  if (valgusMax > 12) {
    score -= 25
    weakLinks.push({
      region: 'knee',
      finding: `Knee valgus ${valgusMax.toFixed(1)}° (severe)`,
      severity: 'severe',
      drill_id: 'banded_clamshell',
    })
  } else if (valgusMax > 6) {
    score -= 12
    weakLinks.push({
      region: 'knee',
      finding: `Knee valgus ${valgusMax.toFixed(1)}° (moderate)`,
      severity: 'moderate',
      drill_id: 'banded_clamshell',
    })
  }

  const dfMin = Math.min(g.ankle_dorsiflexion_deg_left, g.ankle_dorsiflexion_deg_right)
  if (dfMin < 25) {
    score -= 15
    weakLinks.push({
      region: 'ankle',
      finding: `Limited ankle dorsiflexion ${dfMin.toFixed(0)}°`,
      severity: 'moderate',
      drill_id: 'wall_ankle_mob',
    })
  }

  if (g.thoracic_extension_deg < 30) {
    score -= 12
    weakLinks.push({
      region: 'thoracic_spine',
      finding: 'Limited thoracic extension',
      severity: 'moderate',
      drill_id: 'foam_roll_t_spine',
    })
  }

  if (g.hip_shoulder_asymmetry_deg > 8) {
    score -= 15
    weakLinks.push({
      region: 'core',
      finding: `Hip-shoulder asymmetry ${g.hip_shoulder_asymmetry_deg.toFixed(1)}°`,
      severity: 'moderate',
      drill_id: 'pallof_press',
    })
  }

  if (g.squat_depth_ratio < 0.85) {
    score -= 10
    weakLinks.push({
      region: 'squat_pattern',
      finding: 'Cannot reach parallel depth',
      severity: 'mild',
      drill_id: 'goblet_squat_pattern',
    })
  }

  return { score: Math.max(0, score), weakLinks }
}
