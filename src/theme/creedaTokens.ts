export type CreedaRole = 'athlete' | 'coach' | 'individual'
export type CreedaStatus = 'ready' | 'caution' | 'risk' | 'tracker' | 'neutral'

export const creedaTokens = {
  colors: {
    background: '#080C0A',
    elevated: '#0A0F0D',
    glass: 'rgba(255,255,255,0.035)',
    border: 'rgba(255,255,255,0.075)',
    text: '#FFFFFF',
    mutedText: 'rgba(255,255,255,0.58)',
    athlete: '#1D9E75',
    athleteSoft: 'rgba(29,158,117,0.16)',
    coach: '#7F77DD',
    coachGreen: '#1D9E75',
    coachSoft: 'rgba(127,119,221,0.16)',
    individual: '#EF9F27',
    individualSoft: 'rgba(239,159,39,0.16)',
    risk: '#E24B4A',
    riskSoft: 'rgba(226,75,74,0.16)',
    tracker: '#7F77DD',
    trackerSoft: 'rgba(127,119,221,0.16)',
    ready: '#1D9E75',
    caution: '#EF9F27',
  },
  radius: {
    card: 22,
    chip: 999,
  },
} as const

export function getRoleAccent(role: CreedaRole | null | undefined) {
  if (role === 'coach') return creedaTokens.colors.coach
  if (role === 'individual') return creedaTokens.colors.individual
  return creedaTokens.colors.athlete
}

export function getRoleSoftAccent(role: CreedaRole | null | undefined) {
  if (role === 'coach') return creedaTokens.colors.coachSoft
  if (role === 'individual') return creedaTokens.colors.individualSoft
  return creedaTokens.colors.athleteSoft
}

export function getStatusColor(status: CreedaStatus) {
  switch (status) {
    case 'ready':
      return creedaTokens.colors.ready
    case 'caution':
      return creedaTokens.colors.caution
    case 'risk':
      return creedaTokens.colors.risk
    case 'tracker':
      return creedaTokens.colors.tracker
    default:
      return 'rgba(255,255,255,0.42)'
  }
}
