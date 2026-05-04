import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  BarChart3,
  Brain,
  Building2,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Footprints,
  HeartPulse,
  MapPin,
  Moon,
  RefreshCw,
  ShieldCheck,
  Video,
  Target,
  Timer,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react-native';

import { GlowingButtonNative } from '../../src/components/neon/GlowingButtonNative';
import { NeonGlassCardNative } from '../../src/components/neon/NeonGlassCardNative';
import { ReadinessOrbNative } from '../../src/components/neon/ReadinessOrbNative';
import { ProfileAvatarNative } from '../../src/components/profile/ProfileAvatarNative';
import { BioStrip } from '../../src/components/dashboard/BioStrip';
import { LoadChart } from '../../src/components/dashboard/LoadChart';
import { SessionDrillCard } from '../../src/components/dashboard/SessionDrillCard';
import { SportFocusZone } from '../../src/components/dashboard/SportFocusZone';
import { SportRail, type SportRailItem } from '../../src/components/dashboard/SportRail';
import { TrackerTrendSheet, type TrackerTrendMetric } from '../../src/components/dashboard/TrackerTrendSheet';
import { CoachSquadHub } from '../../src/components/coach/CoachSquadHub';
import { EmptyStateCard } from '../../src/components/ui/EmptyStateCard';
import { useMobileAuth } from '../../src/lib/auth';
import { fetchMobileDashboard, type MobileDashboard } from '../../src/lib/mobile-api';
import { getRoleAccent } from '../../src/theme/creedaTokens';

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <Text className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">{label}</Text>
      <Text className="mt-2 text-base font-black tracking-tight text-white">{value}</Text>
    </View>
  );
}

function SectionTitle({
  title,
  detail,
  icon: Icon,
}: {
  title: string;
  detail: string;
  icon: typeof Activity;
}) {
  return (
    <View className="mb-3 flex-row items-start gap-3">
      <View className="mt-1 rounded-2xl border border-white/5 bg-white/[0.04] p-2">
        <Icon color="#FF5F1F" size={16} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-black tracking-tight text-white">{title}</Text>
        <Text className="mt-1 text-sm leading-6 text-white/55">{detail}</Text>
      </View>
    </View>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <NeonGlassCardNative>
      <Text className="text-lg font-bold text-white">{title}</Text>
      <Text className="mt-3 text-sm leading-6 text-white/55">{body}</Text>
    </NeonGlassCardNative>
  );
}

function StreakGrid({ hasHistory }: { hasHistory: boolean }) {
  return (
    <View className="flex-row gap-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <View
          key={index}
          className="h-11 flex-1 items-center justify-center rounded-2xl border"
          style={{
            borderColor: hasHistory ? 'rgba(239,159,39,0.45)' : 'rgba(255,255,255,0.07)',
            backgroundColor: hasHistory ? 'rgba(239,159,39,0.16)' : 'rgba(255,255,255,0.035)',
          }}
        >
          <Text className="text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
            D{index + 1}
          </Text>
        </View>
      ))}
    </View>
  );
}

function QuickActionCard({
  title,
  detail,
  icon: Icon,
  onPress,
}: {
  title: string;
  detail: string;
  icon: typeof Activity;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4"
    >
      <View className="flex-row items-start gap-3">
        <View className="mt-1 rounded-2xl border border-white/5 bg-white/[0.04] p-2">
          <Icon color="#00E5FF" size={16} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-black tracking-tight text-white">{title}</Text>
          <Text className="mt-2 text-sm leading-6 text-white/55">{detail}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { session, user, error: authError } = useMobileAuth();
  const [dashboard, setDashboard] = useState<MobileDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSportId, setSelectedSportId] = useState('primary');
  const [trackerSheetVisible, setTrackerSheetVisible] = useState(false);

  async function loadDashboard(showRefreshState = false) {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchMobileDashboard(session.access_token);
      setDashboard(response.dashboard);
      setError(null);
    } catch (dashboardError) {
      setError(
        dashboardError instanceof Error
          ? dashboardError.message
          : 'Failed to load your CREEDA dashboard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [session?.access_token]);

  const displayName =
    user?.profile.fullName ||
    (typeof session?.user.user_metadata?.full_name === 'string'
      ? session.user.user_metadata.full_name
      : 'CREEDA Athlete');
  const accent = getRoleAccent(user?.profile.role);
  const athleteDashboard = dashboard?.type === 'athlete' ? dashboard : null;
  const athleteSportLabel = user?.profile.primarySport || 'General readiness';
  const athleteSports = useMemo<SportRailItem[]>(
    () =>
      athleteDashboard
        ? [
            {
              id: 'primary',
              label: athleteSportLabel,
              detail: user?.profile.position || 'Primary focus',
            },
          ]
        : [],
    [athleteDashboard, athleteSportLabel, user?.profile.position]
  );
  const athleteLoadPoints = useMemo(() => [], []);
  const athleteTrendMetrics = useMemo<TrackerTrendMetric[]>(() => [], []);

  if (loading && !dashboard) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ActivityIndicator color="#FF5F1F" size="large" />
        <Text className="mt-4 text-center text-sm font-semibold tracking-wide text-white/70">
          Pulling your latest CREEDA dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background pt-16">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadDashboard(true);
            }}
            tintColor="#FF5F1F"
          />
        }
      >
        <View className="mb-8 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
              CREEDA Mobile
            </Text>
            <Text className="mt-3 text-4xl font-black tracking-tight text-white">
              {displayName}
            </Text>
            <Text className="mt-3 text-sm leading-6 text-white/55">
              Your mobile app is now reading live CREEDA role data from the server, not the old Expo scaffold.
            </Text>
          </View>

          <View className="items-end gap-3">
            <Pressable
              onPress={() => router.push('/(tabs)/account')}
              className="items-center gap-2"
            >
              <ProfileAvatarNative
                uri={user?.profile.avatarUrl}
                name={displayName}
                size={64}
              />
              <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                Account
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void loadDashboard(true);
              }}
              className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3"
            >
              <RefreshCw color="#00E5FF" size={18} />
            </Pressable>
          </View>
        </View>

        {!user?.profile.onboardingCompleted ? (
          <NeonGlassCardNative watermark="V1">
            <Text className="text-lg font-bold text-white">Finish onboarding to unlock the full mobile flow</Text>
            <Text className="mt-3 text-sm leading-6 text-white/55">
              Your account is authenticated, but CREEDA still marks onboarding as incomplete. The mobile dashboard will stay limited until the profile setup is finished.
            </Text>
            {user?.profile.role === 'individual' ? (
              <View className="mt-5">
                <GlowingButtonNative
                  title="Start FitStart"
                  variant="chakra"
                  onPress={() => router.push('/fitstart')}
                />
              </View>
            ) : user?.profile.role === 'coach' ? (
              <View className="mt-5">
                <GlowingButtonNative
                  title="Complete Coach Setup"
                  variant="chakra"
                  onPress={() => router.push('/coach-onboarding')}
                />
              </View>
            ) : user?.profile.role === 'athlete' ? (
              <View className="mt-5">
                <GlowingButtonNative
                  title="Complete Athlete Intake"
                  variant="chakra"
                  onPress={() => router.push('/athlete-onboarding')}
                />
              </View>
            ) : null}
          </NeonGlassCardNative>
        ) : null}

        {authError ? (
          <NeonGlassCardNative>
            <SectionTitle
              title="Profile bootstrap warning"
              detail={authError}
              icon={TriangleAlert}
            />
          </NeonGlassCardNative>
        ) : null}

        {error ? (
          <NeonGlassCardNative>
            <SectionTitle
              title="Dashboard load failed"
              detail={error}
              icon={TriangleAlert}
            />
            <View className="mt-4">
              <GlowingButtonNative
                title="Retry Dashboard"
                variant="chakra"
                onPress={() => {
                  void loadDashboard(true);
                }}
              />
            </View>
          </NeonGlassCardNative>
        ) : null}

        {!dashboard ? (
          <EmptyState
            title="No mobile dashboard yet"
            body="Your session is live, but the server has not returned a dashboard summary yet. Pull to refresh after your next CREEDA update."
          />
        ) : null}

        {dashboard?.type === 'athlete' ? (
          <>
            <NeonGlassCardNative watermark="READY">
              <View className="items-center">
                <ReadinessOrbNative score={dashboard.readinessScore ?? 0} size={184} />
                <Text className="mt-6 text-center text-4xl font-black tracking-tight text-white">
                  {dashboard.decision || 'Awaiting Check-In'}
                </Text>
                <Text
                  className="mt-3 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em]"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  Readiness {dashboard.readinessScore ?? '--'} • Risk {dashboard.riskScore ?? '--'}
                </Text>
                <Text className="mt-4 text-center text-sm leading-6 text-white/58">
                  {dashboard.primaryReason}
                </Text>
              </View>
              <View className="mt-6 flex-row gap-3">
                <View className="flex-1">
                  <GlowingButtonNative
                    title="Daily Ritual"
                    variant="chakra"
                    onPress={() => router.push('/daily-ritual')}
                  />
                </View>
                <View className="flex-1">
                  <GlowingButtonNative
                    title="Trends"
                    variant="saffron"
                    onPress={() => setTrackerSheetVisible(true)}
                  />
                </View>
              </View>
            </NeonGlassCardNative>

            <View className="mb-4 mt-2">
              <Text className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
                Sport focus
              </Text>
              <SportRail
                sports={athleteSports}
                selectedSportId={selectedSportId}
                accent={accent}
                onSelect={setSelectedSportId}
              />
            </View>

            <View className="mb-4 flex-row flex-wrap gap-3">
              <BioStrip health={dashboard.health} accent={accent} />
            </View>

            <SportFocusZone
              sportLabel={athleteSportLabel}
              decision={dashboard.decision || 'Awaiting Check-In'}
              primaryReason={dashboard.primaryReason}
              actionInstruction={dashboard.actionInstruction}
              objectiveHeadline={dashboard.objective.headline}
              objectiveSummary={dashboard.objective.summary}
              contextSummary={dashboard.context?.summary}
              accent={accent}
            />

            <LoadChart points={athleteLoadPoints} accent={accent} />

            <NeonGlassCardNative>
              <SectionTitle
                title="Session cards"
                detail="These cards route into existing CREEDA workflows. They do not invent workout scores or drill completion."
                icon={ClipboardList}
              />
              <View className="mt-4 gap-3">
                <SessionDrillCard
                  eyebrow="Daily loop"
                  title="Update readiness"
                  detail="Use the daily ritual before training so CREEDA can refresh today’s decision with real inputs."
                  icon={HeartPulse}
                  accent={accent}
                  actionLabel="Open ritual"
                  onPress={() => router.push('/daily-ritual')}
                />
                <SessionDrillCard
                  eyebrow="Plan"
                  title={dashboard.objective.headline || 'Build the next training block'}
                  detail={dashboard.objective.summary}
                  icon={Dumbbell}
                  accent={accent}
                  actionLabel="Open plans"
                  onPress={() => router.push('/athlete-plans')}
                />
                <SessionDrillCard
                  eyebrow="Technique"
                  title={dashboard.latestVideoReport ? 'Review latest movement scan' : 'Create a movement scan'}
                  detail={
                    dashboard.latestVideoReport
                      ? 'A movement report is available. Open the scan hub to review it from the native flow.'
                      : 'No movement report was returned in the dashboard payload yet. Run a scan to create one.'
                  }
                  icon={Video}
                  accent={accent}
                  actionLabel="Open scan"
                  onPress={() => router.push('/athlete-scan')}
                />
              </View>
            </NeonGlassCardNative>

            <NeonGlassCardNative>
              <SectionTitle
                title="Quick actions"
                detail="The older working routes stay available while the dashboard becomes more sport-aware."
                icon={ClipboardList}
              />
              <View className="gap-3">
                <QuickActionCard
                  title="Full Check-In"
                  detail="Open the detailed athlete check-in when yesterday's session context matters."
                  icon={HeartPulse}
                  onPress={() => router.push('/check-in')}
                />
                <QuickActionCard
                  title="Weekly Review"
                  detail="Open the full athlete weekly review with trend, trust, and identity metrics."
                  icon={TrendingUp}
                  onPress={() => router.push('/athlete-review')}
                />
                <QuickActionCard
                  title="Monthly Report"
                  detail="Open the 28-day athlete performance report with load, readiness, and warning signals."
                  icon={CalendarDays}
                  onPress={() => router.push('/athlete-report')}
                />
                <GlowingButtonNative
                  title="Tracker Trends"
                  variant="chakra"
                  onPress={() => setTrackerSheetVisible(true)}
                />
              </View>
            </NeonGlassCardNative>

            {!dashboard.health.connected ? (
              <EmptyStateCard
                title="Health sync is not connected"
                body="Connect Apple Health or Health Connect from the Recovery tab to feed sleep, HRV, heart rate, and steps into the readiness engine."
                accent={accent}
                icon={HeartPulse}
                actionLabel="Open Recovery"
                onAction={() => router.push('/(tabs)/health')}
              />
            ) : null}

            <NeonGlassCardNative>
              <SectionTitle
                title={dashboard.nutrition.gateTitle}
                detail={dashboard.nutrition.summary}
                icon={ShieldCheck}
              />
              <Text className="text-sm leading-6 text-white/70">{dashboard.nutrition.nextAction}</Text>
            </NeonGlassCardNative>

            <TrackerTrendSheet
              visible={trackerSheetVisible}
              trends={athleteTrendMetrics}
              accent={accent}
              onClose={() => setTrackerSheetVisible(false)}
            />
          </>
        ) : null}

        {dashboard?.type === 'coach' ? (
          <CoachSquadHub
            dashboard={dashboard}
            onOpenReview={() => router.push('/coach-review')}
            onOpenAthlete={(athlete) => {
              const params = new URLSearchParams({
                name: athlete.athleteName,
                team: athlete.teamName,
                priority: athlete.priority,
                recommendation: athlete.recommendation,
                reasons: athlete.reasons.join('|'),
              });
              router.push(`/squad/athlete/${encodeURIComponent(athlete.athleteId)}?${params.toString()}`);
            }}
          />
        ) : null}

        {dashboard?.type === 'individual' ? (
          <>
            <NeonGlassCardNative watermark="TODAY">
              <View className="items-center">
                <ReadinessOrbNative score={dashboard.readinessScore || 0} size={178} />
                <Text className="mt-6 text-center text-4xl font-black tracking-tight text-white">
                {dashboard.directionLabel}
                </Text>
                <Text
                  className="mt-3 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em]"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  {dashboard.sport} • {dashboard.primaryGoal || 'General Fitness'}
                </Text>
                <Text className="mt-4 text-center text-sm leading-6 text-white/58">
                  {dashboard.directionSummary}
                </Text>
              </View>
            </NeonGlassCardNative>

            <NeonGlassCardNative watermark="IND">
              <SectionTitle
                title="Today’s direction"
                detail={dashboard.directionSummary}
                icon={Target}
              />
              <Text className="text-sm leading-6 text-white/70">{dashboard.explanation}</Text>
              <View className="mt-5">
                <GlowingButtonNative
                  title="Daily Ritual"
                  variant="chakra"
                  onPress={() => router.push('/daily-ritual')}
                />
              </View>
            </NeonGlassCardNative>

            <NeonGlassCardNative>
              <SectionTitle
                title="Mood, sleep, soreness"
                detail="Use the individual log or daily ritual to save real check-in state. This card does not display made-up mood or soreness values."
                icon={HeartPulse}
              />
              <View className="mt-4 gap-3">
                <SessionDrillCard
                  eyebrow="Check-in"
                  title="Log how you feel"
                  detail="Sleep, energy, stress, soreness, hydration, and context save through the existing individual daily log endpoint."
                  icon={Moon}
                  accent={accent}
                  actionLabel="Open log"
                  onPress={() => router.push('/individual-log')}
                />
                <SessionDrillCard
                  eyebrow="Tip"
                  title={dashboard.today?.todayFocus || 'Build today from your next check-in'}
                  detail={dashboard.today?.adaptationNote || dashboard.explanation}
                  icon={Brain}
                  accent={accent}
                />
              </View>
            </NeonGlassCardNative>

            <NeonGlassCardNative>
              <SectionTitle
                title="7-day streak"
                detail="The dashboard payload does not include day-by-day streak history yet, so the grid stays neutral."
                icon={Footprints}
              />
              <View className="mt-5">
                <StreakGrid hasHistory={false} />
              </View>
            </NeonGlassCardNative>

            <NeonGlassCardNative>
              <SectionTitle
                title="Quick actions"
                detail="The weekly individual review is now available in mobile alongside your daily direction."
                icon={ClipboardList}
              />
              <View className="gap-3">
                <QuickActionCard
                  title="Full Daily Log"
                  detail="Open the detailed individual log when training, steps, and hydration need a full entry."
                  icon={HeartPulse}
                  onPress={() => router.push('/individual-log')}
                />
                <QuickActionCard
                  title="Weekly Review"
                  detail="Open the full individual weekly review built from FitStart, logs, and device context."
                  icon={TrendingUp}
                  onPress={() => router.push('/individual-review')}
                />
                <QuickActionCard
                  title="Movement Scan"
                  detail="Open the movement scan hub and native report history for your selected sport."
                  icon={Video}
                  onPress={() => router.push('/individual-scan')}
                />
                <QuickActionCard
                  title="Objective Tests"
                  detail="Open the individual objective test lab with live protocol cadence and reaction tap."
                  icon={Timer}
                  onPress={() => router.push('/individual-tests')}
                />
              </View>
            </NeonGlassCardNative>

            {dashboard.today ? (
              <NeonGlassCardNative>
                <SectionTitle
                  title={dashboard.today.todayFocus}
                  detail={`${dashboard.today.intensity.toUpperCase()} intensity • ${dashboard.today.sessionDurationMinutes} minutes`}
                  icon={Activity}
                />
                <View className="gap-3">
                  {dashboard.today.whatToDo.map((item) => (
                    <View key={item} className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                      <Text className="text-sm leading-6 text-white/75">{item}</Text>
                    </View>
                  ))}
                </View>
                {dashboard.today.recoveryActions.length ? (
                  <View className="mt-4">
                    <Text className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                      Recovery actions
                    </Text>
                    <Text className="mt-3 text-sm leading-6 text-white/65">
                      {dashboard.today.recoveryActions.join(' • ')}
                    </Text>
                  </View>
                ) : null}
              </NeonGlassCardNative>
            ) : null}

            <NeonGlassCardNative>
              <SectionTitle
                title="Health blend"
                detail={
                  dashboard.health.usedInDecision
                    ? `Device data is influencing ${dashboard.health.influencePct}% of this direction.`
                    : 'This direction is still running from FitStart and manual check-ins.'
                }
                icon={HeartPulse}
              />
              <View className="flex-row flex-wrap gap-3">
                <StatPill label="Sync state" value={dashboard.health.summary.connected ? 'Connected' : 'Manual'} />
                <StatPill label="Metric days" value={`${dashboard.health.connectedMetricDays}`} />
                <StatPill label="Steps" value={dashboard.health.summary.latestSteps ? `${dashboard.health.summary.latestSteps}` : 'N/A'} />
                <StatPill label="Sleep" value={dashboard.health.summary.avgSleepHours ? `${dashboard.health.summary.avgSleepHours} h` : 'N/A'} />
              </View>
            </NeonGlassCardNative>

            {dashboard.pathway ? (
              <NeonGlassCardNative>
                <SectionTitle
                  title={dashboard.pathway.title}
                  detail={dashboard.pathway.rationale}
                  icon={Footprints}
                />
              </NeonGlassCardNative>
            ) : null}

            <NeonGlassCardNative>
              <SectionTitle
                title={dashboard.nutrition.gateTitle}
                detail={dashboard.nutrition.summary}
                icon={Moon}
              />
              <Text className="text-sm leading-6 text-white/70">{dashboard.nutrition.nextAction}</Text>
            </NeonGlassCardNative>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
