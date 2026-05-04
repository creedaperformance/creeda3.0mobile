# Mobile Prototype API Gaps

This file documents prototype-backed mobile screens that are intentionally rendered with honest empty states until the web/backend contract exists. Backend implementation belongs in `Creeda-2.0-Web`.

| Endpoint | Request | Response | Supabase tables likely required | Frontend dependency | Blocks screen? |
|---|---|---|---|---|---|
| `GET /api/mobile/dashboard/sport/:sportId` | Auth bearer, `sportId` path param | Per-sport readiness, focus zone, load history, active drills | profiles, readiness_scores, daily_check_ins, training_sessions, health metrics, objective tests | Athlete sport rail/focus/load chart | No. Current dashboard shows primary sport and empty load history. |
| `GET /api/mobile/tracker/trends` | Auth bearer, optional range | Day-by-day HRV, sleep, resting HR, load, steps | health_metrics or equivalent daily summaries | `TrackerTrendSheet` | No. Sheet says trend history appears after several synced days. |
| `POST /api/mobile/lifestyle-baseline` | Auth bearer, sleep/stress/activity/sitting/diet answers | Saved baseline, calibration percent, next route | onboarding submissions, daily context, profile calibration | `app/lifestyle-baseline.tsx` | No. Screen captures answers locally and routes to existing FitStart/Phase 2 persistence. |
| `GET /api/mobile/body-map` | Auth bearer, optional role/view | Regions with side, coordinates, status, source, summary, next action | daily_check_ins, health summaries, movement/video reports, objective tests, onboarding orthopedic history | `BodyMapNative`, `app/individual-body.tsx`, `app/body-literacy-score.tsx` | No. Body map renders neutral with no inferred regions. |
| `GET /api/mobile/coach/squad` | Auth bearer, optional team/range | Athlete list with readiness, attendance, status light, plan completion, load trend | coach teams, squad memberships, readiness_scores, attendance/session logs, training plans | Coach squad hub and athlete drill-down | Partially. Hub uses existing coach dashboard priority/team summaries; full grid is blocked. |
| `GET /api/mobile/coach/squad/:athleteId` | Auth bearer, athlete id | Athlete hero, HRV/sleep/load/attendance, 7-day load, plan completion, supported actions | Same as coach squad plus athlete-specific health/session/report tables | `/squad/athlete/[athleteId]` | Partially. Drill-down shows priority queue context only. |
| `GET /api/mobile/coach/rts` | Auth bearer, optional team/range | Supported RTS records and review state | medically safe RTS/care tables, review events, permissions | `app/coach-care.tsx` RTS tab | Yes for RTS details. Screen remains empty to avoid fake medical status. |
| `GET /api/mobile/coach/sessions` | Auth bearer, optional team/date | Sessions, planned load, conflicts, send eligibility | training_sessions, plans, squad memberships, attendance | `app/coach-train.tsx` | Yes for session planning; summary uses dashboard readiness only. |
| `POST /api/mobile/coach/sessions/send` | Auth bearer, session id, athlete/team ids | Send result and delivery status | training_sessions, notification queue, audit log | Coach Train send-to-squad CTA | Yes. CTA is not shown as active. |
| `GET /api/mobile/learn/daily` | Auth bearer | Daily lesson, library, completed/locked state | lesson catalog, user lesson progress, streaks | `app/learn.tsx` | Yes for lessons. Learn screen shows coming-soon states. |
| `GET /api/mobile/community/challenges` | Auth bearer | Challenges, opt-in state, standings | challenges, challenge_members, scores | `app/community.tsx` | Yes. Challenges stay empty. |
| `GET /api/mobile/community/nearby` | Auth bearer, location consent and coordinates | Nearby coaches/athletes with privacy-safe fields | profiles, coach listings, privacy/location consent | `app/community.tsx` | Yes. Nearby stays empty until privacy/location exists. |

Notes:

- None of these contracts should expose raw medical claims or injury certainty.
- Coach care/RTS endpoints need explicit permission and wording gates before mobile enables actions.
- Community endpoints need opt-in privacy rules before any nearby or leaderboard UI becomes active.
