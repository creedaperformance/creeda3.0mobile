import { View } from 'react-native'

import { getStatusColor, type CreedaStatus } from '../../theme/creedaTokens'

export function StatusDot({
  status = 'neutral',
  color,
  size = 9,
}: {
  status?: CreedaStatus
  color?: string
  size?: number
}) {
  const dotColor = color ?? getStatusColor(status)

  return (
    <View
      className="rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: dotColor,
        shadowColor: dotColor,
        shadowOpacity: 0.45,
        shadowRadius: 8,
      }}
    />
  )
}
