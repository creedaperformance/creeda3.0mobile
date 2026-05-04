import { Activity, Footprints, HeartPulse, Moon, Waves } from 'lucide-react-native'

import type { AthleteMobileDashboard } from '../../lib/mobile-api'
import { MetricChip } from '../ui/MetricChip'

export function BioStrip({
  health,
  accent = '#1D9E75',
}: {
  health: AthleteMobileDashboard['health']
  accent?: string
}) {
  return (
    <>
      <MetricChip
        label="Steps"
        value={health.latestSteps ? `${health.latestSteps}` : 'N/A'}
        detail={health.connected ? 'Latest synced day' : 'Connect Health for steps'}
        accent={accent}
        icon={Footprints}
      />
      <MetricChip
        label="Sleep"
        value={health.avgSleepHours ? `${health.avgSleepHours}` : 'N/A'}
        unit={health.avgSleepHours ? 'h' : undefined}
        detail={health.sampleDays ? `${health.sampleDays} synced days` : 'No sleep history yet'}
        accent={accent}
        icon={Moon}
      />
      <MetricChip
        label="HR"
        value={health.avgHeartRate ? `${health.avgHeartRate}` : 'N/A'}
        detail={health.avgHeartRate ? 'Avg heart rate' : 'Awaiting device data'}
        accent={accent}
        icon={HeartPulse}
      />
      <MetricChip
        label="HRV"
        value={health.avgHrv ? `${health.avgHrv}` : 'N/A'}
        detail={health.avgHrv ? 'Avg HRV signal' : 'Awaiting HRV sync'}
        accent={accent}
        icon={Waves}
      />
      <MetricChip
        label="Source"
        value={health.connected ? health.source.toUpperCase() : 'Manual'}
        detail={health.latestMetricDate || 'No latest metric date'}
        accent={accent}
        icon={Activity}
      />
    </>
  )
}
