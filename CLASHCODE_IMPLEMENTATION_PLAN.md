# 🏆 ClashCode — Phase 2 Implementation Plan
### Room/Team Codes · Chat · Voice/Video · Per-Team Question Assignment · Live Judging Hardening · S3 Profile Images · Notifications · Copy Pass

> This document is a continuation of the existing `ClashCode` documentation. It assumes the current stack is already live: **Spring Boot 3 / Java 21 / PostgreSQL / AWS SQS / Docker** on the backend, **Next.js / Redux / STOMP-over-WebSocket / TailwindCSS** on the frontend, deployed on EC2 + RDS + Netlify, with the **Netro (Neo-Brutalism + Retro Arcade)** design system already applied.

---

## 0. Scope & Assumptions

| # | Feature Requested | Interpretation Used In This Plan |
|---|---|---|
| 1 | Auth + Room create/join with code | Room already has a `roomCode`; this phase makes it **first-class UI** — visible on the room page, shareable as a deep link, and used by joiners |
| 2 | Team create/join with code, same pattern | Same pattern as room, but scoped inside a room. Team code is visible **only to the team leader**, with copy/share actions |
| 3 | Chat: room-wide, team-only, 1:1 player | Three chat scopes on one reusable component, all riding the existing STOMP `/ws` connection |
| 4 | Mic + video chat | **WebRTC mesh** (peer-to-peer) signaled over the existing WebSocket, scoped to a team (2–5 people). STUN via Google public servers, TURN via a small self-hosted `coturn` on the same EC2 box |
| 5 | Each team gets different questions | **Team-level distinct problem sets.** Teammates share the same problems; no two teams in a room get the same problem set. Scoring is normalized by difficulty, not by raw problem count |
| 6 | Run/Submit → live leaderboard | Hardening the existing SQS + Docker sandbox pipeline: retries, timeouts, dead-letter handling, idempotency |
| 7 | Netro style continuation | New components (chat panel, call bar, code-share card, notification toasts) follow the exact same tokens already defined (borders, shadows, tilt, palette, fonts) |
| 8 | Profile image via AWS S3 | Presigned-URL direct upload from browser → S3, client-side resize, key stored in Postgres, served via CloudFront |
| 9 | Docker exec — proper alerts/notifications | A `Notification` domain + `/user/queue/notifications` channel + Netro-styled toast system + optional browser notifications + 8-bit sound cues |
| 10 | Proper text/quotes on every page | A full **Copy & Microcopy Deck** at the end of this document, page by page |

---

## 1. Updated Data Model

### 1.1 New / Modified Entities

```
User
├── id
├── username, email, passwordHash        (existing)
├── profileImageKey        [NEW]  — S3 object key, nullable
├── profileImageUrl        [NEW]  — derived CDN URL, computed at read time
└── lastSeenAt              [NEW]  — for presence indicators in chat

Room
├── id
├── roomCode                             (existing — now surfaced properly)
├── status: WAITING | LIVE | ENDED       (existing)
├── adminId                              (existing)
├── questionsPerTeam        [NEW]  — int, default e.g. 3
└── distinctPerTeam         [NEW]  — boolean, default true

Team
├── id, roomId
├── teamCode                             (existing — now surfaced to leader only)
├── leaderId                             (existing)
└── members[]                            (existing)

Problem (bank)                            [may already exist as "problem"]
├── id, title, description, difficulty (EASY|MEDIUM|HARD)
├── testCases[] (hidden + sample)
└── points          — base score weight per difficulty

TeamProblemAssignment            [NEW]
├── id
├── roomId, teamId, problemId
├── orderIndex        — display order within the team's problem list
└── assignedAt

ChatMessage                       [NEW]
├── id
├── scope: ROOM | TEAM | DM
├── roomId
├── teamId            (nullable — required if scope=TEAM)
├── senderId
├── recipientId        (nullable — required if scope=DM)
├── content
├── createdAt
└── clientMessageId    — for optimistic-UI de-duplication

CallSession                       [NEW]
├── id, roomId, teamId
├── status: RINGING | ACTIVE | ENDED
├── startedAt, endedAt
└── participants[] (userId, joinedAt, leftAt)

Notification                      [NEW]
├── id, userId
├── type: SUBMISSION_VERDICT | TEAM_JOIN | ROOM_STARTED | CHAT_MESSAGE | CALL_INCOMING | RANK_CHANGE
├── payload (JSON)
├── isRead
└── createdAt

Submission (existing, hardened)
├── ... existing fields ...
├── retryCount          [NEW]
├── sandboxError         [NEW]  — nullable, populated on infra failure vs. WA/TLE
└── idempotencyKey        [NEW]  — prevents double-judging on SQS redelivery
```

### 1.2 Migration Notes (Flyway)
- `V__add_profile_image_to_user.sql`
- `V__add_room_question_config.sql`
- `V__create_problem_bank_if_missing.sql` (skip if the problem table already exists)
- `V__create_team_problem_assignment.sql`
- `V__create_chat_message.sql` (index on `(roomId, scope, teamId, createdAt)` and `(recipientId, createdAt)`)
- `V__create_call_session.sql`
- `V__create_notification.sql` (index on `(userId, isRead, createdAt)`)
- `V__harden_submission.sql`

---

## 2. Feature: Room Join-by-Code + Shareable Link

### Flow
```
Admin creates room
   → POST /rooms  {name, questionsPerTeam, ...}
   → response includes roomCode (e.g. "K9F3XQ")
   → Room page shows a Netro "code card":
        [ K9F3XQ ]  [Copy Code]  [Copy Link]
   → "Copy Link" builds: https://clashcode-dsa-multiplayer.netlify.app/join?code=K9F3XQ

Joiner opens link (or types code manually on /rooms)
   → /join?code=K9F3XQ pre-fills the join modal
   → POST /rooms/join {code}
   → on success → redirect to /room/{id}/waiting
   → on invalid/expired code → Netro-styled inline error, no page reload
```

### API
| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/rooms` | admin only; returns `roomCode` |
| `GET` | `/rooms/{id}` | includes `roomCode` for all members (not sensitive — needed for the share card) |
| `POST` | `/rooms/join` | body `{code}`; returns room summary + membership |
| `GET` | `/rooms/resolve?code=` | lightweight lookup used by the `/join` landing page to preview room name before joining |

### Frontend
- New route: `frontend/src/app/join/page.jsx` — reads `?code=` from the URL, auto-opens the join modal with the code pre-filled, falls back to a manual entry field if no code is present.
- `RoomHeader.jsx` gets a new `<RoomCodeCard />` subcomponent (chunky border, `rotate-[-2deg]`, Retro Orange, monospace code in JetBrains Mono, copy-to-clipboard with a toast confirmation).
- Room code is visible to **all members** for transparency, but the **"Copy Link" CTA is only rendered for the admin**, per your original ask — regular members can see it but the share action is admin-owned.

---

## 3. Feature: Team Join-by-Code + Team Card

Same pattern, scoped to a room:

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/rooms/{roomId}/teams` | creates a team, current user becomes leader, returns `teamCode` |
| `POST` | `/rooms/{roomId}/teams/join` | body `{code}`; joins caller to the team |
| `GET` | `/teams/{id}` | `teamCode` field only populated in the response **if the caller is the leader** (backend strips it for members — matches your explicit ask that only the leader sees/shares it) |

### Frontend
- `waiting/TeamCard.jsx` gets:
  - If `currentUser.id === team.leaderId` → show `<TeamCodeCard />` (same visual language as the room code card, just Retro Blue instead of Retro Orange to visually distinguish "team" from "room") with Copy Code + Copy Link.
  - Else → show a locked-icon placeholder: *"Only the captain can see the squad code."*
- `modals/JoinTeamModal.jsx` — identical UX skeleton to the room join modal (code reuse: extract a shared `<CodeEntryModal mode="room|team" onSubmit={...} />`).

---

## 4. Feature: Multi-Scope Chat System

### Design
One reusable chat surface, three scopes, all riding the **existing** STOMP `/ws` connection — no new infrastructure needed, only new destinations.

```
Client → Server (send)
  /app/chat/room/{roomId}         → broadcast to room
  /app/chat/team/{teamId}         → broadcast to team
  /app/chat/dm/{recipientUserId}  → routed to one user

Server → Client (subscribe)
  /topic/room/{roomId}/chat       → everyone in the room
  /topic/team/{teamId}/chat       → only team members
  /user/queue/dm                  → Spring's per-user destination (sender also echoes to self for optimistic UI reconciliation)
```

### Backend
- `ChatController` (STOMP `@MessageMapping`) validates:
  - sender is actually a member of the room (`ROOM` scope) or team (`TEAM` scope)
  - `DM` scope: sender and recipient are in the same room (prevents cross-room DM spam)
- `ChatService.persist()` saves to `chat_message`, then re-uses the existing `common.WebSocketService.push(topic, payload)` helper — no new WebSocket plumbing pattern, just new topics.
- `GET /rooms/{roomId}/chat?scope=ROOM&before={cursor}` and equivalent for `TEAM` — paginated history load when a user opens a chat tab (chat isn't only real-time, it needs backfill on join).

### Frontend
- `components/chat/ChatPanel.jsx` — tabbed panel: **Room | Team | Direct**, reusing `useWebSocket` for each active tab's topic.
- `chatSlice.js` (new Redux slice) — `{ roomMessages: [], teamMessages: [], dmThreads: { [userId]: [] }, unreadCounts: {} }`.
- Lives as a collapsible drawer in `Battle Arena` and `Waiting Room` (chunky Netro tab bar, unread badge in Hot Pink).
- DM entry point: clicking any player avatar (in team roster, leaderboard, or room member list) opens a DM thread with them.

---

## 5. Feature: Voice & Video Chat

### Why mesh WebRTC (not a paid SFU)
Teams are small (typically 2–5 people), and your whole infra philosophy is "stay on AWS free tier." A P2P mesh call for a team-sized group is well within what browsers handle comfortably, and it needs **zero new paid services** — only a STUN server (free, Google's public ones) and a small `coturn` TURN relay for the minority of users behind restrictive NATs, which you can run on the *same* EC2 box behind a different port. If you ever want room-wide (not just team) calls with many participants, that's the point to introduce an SFU (e.g. self-hosted `mediasoup` or `LiveKit` OSS) — noted here as a future scaling path, not part of this phase.

### Signaling (reuses the existing WebSocket — no separate signaling server)
```
/app/call/team/{teamId}/offer      → SDP offer relay
/app/call/team/{teamId}/answer     → SDP answer relay
/app/call/team/{teamId}/ice        → ICE candidate relay
/topic/team/{teamId}/call          → presence: who's in the call, mic/cam state
```

### Backend
- `CallController` is a thin relay — it does **not** touch media, it only forwards SDP/ICE JSON blobs between team members over STOMP, plus writes `CallSession` rows for history/analytics ("Team X was on a call for 12 minutes").
- `Notification` fired on `CALL_INCOMING` so a teammate who isn't currently in the Battle Arena tab still gets a toast + optional browser push.

### Frontend
- `components/call/CallBar.jsx` — sticky Netro-styled bar (dark terminal background to match Battle Arena) with per-teammate video tiles, mic/cam toggle, "Join Call" / "Leave Call" chunky buttons.
- `lib/webrtc/useTeamCall.js` — hook wrapping `RTCPeerConnection`, one connection per teammate (mesh), using the STOMP signaling channel above.
- Call is **team-scoped only** in this phase (matches "mic and video chat" tied to the team battling together) — not room-wide, to keep bandwidth sane on a t2.micro-class EC2 relay.

---

## 6. Feature: Per-Team Distinct Question Assignment

### Algorithm
```
On "Start Battle" (admin action, room WAITING → LIVE):

1. Load room.questionsPerTeam (e.g. 3) and the active problem bank
2. needed = teams.count * questionsPerTeam
3. Shuffle the eligible problem pool (filtered by difficulty mix rules,
   e.g. 1 EASY + 1 MEDIUM + 1 HARD per team, if pool is large enough)
4. If distinctPerTeam == true:
      partition the shuffled pool into non-overlapping chunks of size
      questionsPerTeam, one chunk per team → zero problem overlap between teams
   else:
      each team gets a random (possibly overlapping) sample — fallback for
      small problem banks where true partitioning isn't possible
5. Persist TeamProblemAssignment rows
6. Push /topic/room/{roomId}/events → BATTLE_STARTED
7. Each client fetches its own team's problem list:
      GET /teams/{teamId}/problems
```

### Scoring Fairness
Because teams may face different-difficulty problems, score is **not** "1 point per solve" — it uses each `Problem.points` weight (e.g. EASY=100, MEDIUM=200, HARD=300), so a team that gets a harder set isn't structurally disadvantaged. This slots into the **existing** de-duplicated team-score recalculation step in the judging worker — only the point value looked up changes, not the pipeline shape.

### API
| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/rooms/{roomId}/start` | admin only; triggers assignment + sets room LIVE |
| `GET` | `/teams/{teamId}/problems` | returns this team's assigned set only — **not** other teams' problems (prevents peeking) |

### Frontend
- `ProblemPanel.jsx` now fetches from the team-scoped endpoint instead of a room-global list.
- Waiting Room gets a small pre-battle summary for the admin: *"3 teams · 3 problems each · fully distinct sets"* so they can sanity-check the config before hitting Start.

---

## 7. Feature: Code Execution & Live Leaderboard Hardening

The async pipeline (`SubmissionService → SQS → SubmissionJudgeWorker → Docker sandbox → WebSocket`) already works; this phase adds production-grade edges:

| Problem | Fix |
|---|---|
| SQS redelivers a message after a slow judge (visibility timeout) | `idempotencyKey` on `Submission`; worker checks status before re-judging, no-ops if already `ACCEPTED`/`WRONG_ANSWER` |
| Docker sandbox crashes / OOM / infra hiccup (not a code issue) | New `sandboxError` field, distinct from `WRONG_ANSWER`; verdict pushed as `JUDGE_ERROR` with a **"Retry"** button client-side rather than silently failing |
| A submission gets "stuck" in `PENDING` forever | Worker sets a hard timeout per run (e.g. 10s per test case, 30s total); anything exceeding it is marked `TIME_LIMIT_EXCEEDED` explicitly, not left hanging |
| SQS message repeatedly fails | Dead-letter queue (DLQ) after N retries; CloudWatch alarm on DLQ depth so failures aren't silent |
| Leaderboard flicker on rapid submissions | Debounce leaderboard recompute per room (e.g. coalesce recalculations within a 300ms window) instead of recalculating on every single accepted submission independently |

### Notifications tie-in
Every verdict (`ACCEPTED`, `WRONG_ANSWER`, `TLE`, `JUDGE_ERROR`) also fires a `Notification` (see §9) so a user who submitted and switched tabs still gets pinged when the result lands.

---

## 8. Feature: Profile Images via AWS S3

### Flow (direct-to-S3 upload, keeps binaries off your EC2 box entirely)
```
1. Frontend: user picks image → client-side resize/crop to e.g. 512x512 (canvas)
2. POST /users/me/profile-image/presign
     → backend generates a presigned S3 PUT URL (60s expiry) for a key like
       profile-images/{userId}/{uuid}.webp
3. Frontend PUTs the resized image directly to that presigned URL
4. On 200 OK from S3 → PATCH /users/me { profileImageKey }
5. Backend stores the key; profileImageUrl is derived at read time as
     https://{cloudfrontDomain}/{key}
```

### Infra
- New S3 bucket: `clashcode-profile-images` (private; **not** public-read — served only via CloudFront with Origin Access Control, so images can't be enumerated/scraped directly off S3).
- IAM: a scoped policy on the EC2 instance role — `s3:PutObject`/`s3:GetObject` limited to `arn:aws:s3:::clashcode-profile-images/profile-images/*`, nothing broader.
- CloudFront distribution in front of the bucket (also gives you HTTPS + caching + a clean CDN URL — cheap/free-tier-eligible at this traffic scale).
- Validation server-side before issuing the presign: content-type allow-list (`image/png`, `image/jpeg`, `image/webp`), max size 2MB, rate-limited (avoid presign abuse).

### Frontend
- `components/profile/AvatarUploader.jsx` — Netro-framed circular avatar with a chunky-bordered upload button, crop step via a lightweight canvas cropper before the S3 PUT.
- Avatar shows up everywhere identity already renders: team roster, leaderboard rows, chat messages, call tiles, waiting room player list.

---

## 9. Feature: Notifications & Alerts

### Backend
- `NotificationService.notify(userId, type, payload)` — persists a `Notification` row **and** pushes to `/user/queue/notifications` in the same call, mirroring the existing `WebSocketService.push` pattern used elsewhere in the codebase.
- Trigger points to wire in: submission verdicts, team-join events, room-started, unread chat (only when the relevant chat tab isn't currently focused client-side), incoming call, and rank-change on the leaderboard (e.g. "Your team dropped to #3").

### Frontend
- `components/notifications/NotificationToaster.jsx` — Netro toast: chunky border, hard drop shadow, slide-in from a corner, auto-dismiss with a manual close (✕), color keyed to type (Lime for ACCEPTED, Hot Pink for WA/TLE, Cyan for social events).
- A short 8-bit-style chime on `ACCEPTED` and `CALL_INCOMING` (small `.wav`/`.mp3`, muted by default with a settings toggle — don't force sound on).
- Optional: request the browser Notification API permission once (on first login), so verdicts land even if the tab isn't focused.
- `notificationSlice.js` — `{ items: [], unreadCount }`, badge shown on a bell icon in the shared header.

---

## 10. Frontend: Continuing the Netro Theme

All new surfaces (chat panel, call bar, code-share cards, notification toasts, avatar uploader) reuse your **existing tokens exactly** — no new design system, just new components built from the same primitives:

| Token | Value | Used for new components as... |
|---|---|---|
| Border | `border-[3px]` / `border-4` | Every new card, panel, and modal |
| Shadow | `shadow-[4px_4px_0px_rgba(15,23,42,1)]` | Chat bubbles from *other* users, toasts, code cards |
| Tilt | `rotate-[-2deg]` / `rotate-[2deg]` | Room code card, team code card, incoming-call banner |
| Background | `#FEFBEA` | Chat panel body |
| Ink | `#141413` | All new text/borders |
| Lime `#b2ff59` | ACCEPTED toast, "online" presence dot |
| Cyan `#00e5ff` | Call bar accents, DM badges |
| Hot Pink `#ff4081` | Unread badges, WA/TLE toast, destructive actions (leave call, delete message) |
| Retro Orange `#FF4D2D` | Room code card |
| Retro Blue `#4D7CFF` | Team code card |
| Fonts | Space Grotesk / JetBrains Mono / Bobby-Jones-Soft | Headings / codes & chat text / hero moments (e.g. "BATTLE STARTED!") |

New component additions to `src/components/`:
```
chat/          ChatPanel.jsx, ChatTab.jsx, MessageBubble.jsx, DmThreadList.jsx
call/          CallBar.jsx, CallTile.jsx, IncomingCallBanner.jsx
sharing/       RoomCodeCard.jsx, TeamCodeCard.jsx, CodeEntryModal.jsx
profile/       AvatarUploader.jsx
notifications/ NotificationToaster.jsx, NotificationBell.jsx
```

New Redux slices: `chatSlice.js`, `callSlice.js`, `notificationSlice.js`.

---

## 11. New/Updated REST API Reference

```
POST   /rooms                              create room
GET    /rooms/{id}                         room detail (incl. roomCode)
GET    /rooms/resolve?code=                preview room by code (for /join landing)
POST   /rooms/join                         join room by code
POST   /rooms/{roomId}/start               admin: assign questions + go LIVE

POST   /rooms/{roomId}/teams               create team (returns teamCode)
GET    /teams/{id}                         team detail (teamCode leader-only)
POST   /rooms/{roomId}/teams/join          join team by code
GET    /teams/{teamId}/problems            this team's assigned problem set

GET    /rooms/{roomId}/chat?scope=&before= paginated chat history backfill

POST   /users/me/profile-image/presign     get presigned S3 PUT URL
PATCH  /users/me                           save profileImageKey

GET    /notifications?unreadOnly=          list notifications
PATCH  /notifications/{id}/read            mark read
```

## 12. New/Updated WebSocket Topics

```
/topic/submission/{id}                     existing — verdict push
/topic/room/{roomId}/leaderboard           existing — live leaderboard
/topic/room/{roomId}/events                existing — room lifecycle events

/topic/room/{roomId}/chat            [NEW] room-wide chat broadcast
/topic/team/{teamId}/chat            [NEW] team chat broadcast
/user/queue/dm                       [NEW] direct messages
/user/queue/notifications            [NEW] personal notifications

/app/call/team/{teamId}/offer        [NEW] WebRTC SDP offer relay
/app/call/team/{teamId}/answer       [NEW] WebRTC SDP answer relay
/app/call/team/{teamId}/ice          [NEW] ICE candidate relay
/topic/team/{teamId}/call            [NEW] call presence/state
```

---

## 13. Infrastructure Changes

| Service | Change |
|---|---|
| **S3** | New bucket `clashcode-profile-images`, private, OAC-fronted by CloudFront |
| **CloudFront** | New distribution serving profile images with a clean CDN URL |
| **IAM** | New least-privilege policy for presigned uploads, attached to EC2 instance role |
| **EC2** | Add `coturn` (TURN relay) as a second service on the same box, separate port (e.g. 3478/UDP); update security group |
| **CloudWatch** | New alarm on SQS DLQ depth (judge pipeline failures) |
| **RDS** | No new instance — just the migrations in §1.2 |
| **Nginx** | No change needed for WebSocket (STOMP already proxied); TURN traffic is UDP and bypasses Nginx directly to `coturn` |

---

## 14. Suggested Implementation Roadmap

Ordered by dependency and risk, not by "cool factor" — get the foundational, low-risk pieces done first, save the WebRTC work for last since it's the most novel piece relative to your existing codebase.

1. **Room & Team codes + shareable links** — small, self-contained, no new infra. Ship first.
2. **Per-team distinct question assignment** — backend-heavy but no new external dependency; unlocks realistic multi-team testing for everything after it.
3. **Judging pipeline hardening** (idempotency, DLQ, timeouts) — do this before load-testing chat/calls on top of it.
4. **Notifications system** — needed as a dependency for chat unread badges and call-incoming alerts, so build it before chat.
5. **Chat system (room/team/DM)** — reuses existing WebSocket infra, moderate frontend work.
6. **S3 profile images** — independent track, can be parallelized with chat by another contributor if you have one.
7. **Voice & video calling** — highest complexity (WebRTC + TURN), do last so it lands on top of a stable chat/notification foundation.
8. **Copy & quotes pass** (§15) — do continuously alongside each feature, not as a separate sprint; bake it in as you build each page.

---

## 15. Content & Copy Deck (Netro Voice)

Tone: cocky, retro-arcade, all-caps for shouty moments, plain-case for supporting text. Think "insert coin" energy, not corporate SaaS copy.

### Login
- Headline: **"INSERT CREDENTIALS TO CONTINUE"**
- Sub: *"No continues. No extra lives. Just clean code and faster fingers."*
- Error state: *"Nice try, but that combo doesn't unlock anything."*

### Register
- Headline: **"CREATE YOUR PLAYER"**
- Sub: *"Every legend started as Player One."*
- Success toast: *"Character created. Let's clash."*

### Rooms Lobby
- Headline: **"BATTLE LOBBY"**
- Empty state: *"No arenas open right now. Be the one who starts the fight."*
- Create-room CTA: **"OPEN A NEW ARENA"**

### Room Code Card
- Label: *"ARENA CODE"*
- Helper: *"Share this. Let them walk in knowing what's coming."*

### Waiting Room
- Headline: **"SQUADS ASSEMBLING"**
- Team code label: *"SQUAD CODE — captain's eyes only"*
- Ready toggle: *"LOCK IN"* / *"STAND DOWN"*
- Admin start button: **"DROP THE FLAG"**

### Team Card (no team yet)
- *"No squad. No glory. Form one or crash someone else's."*

### Battle Arena
- Loading judge state: *"Compiling your fate..."*
- ACCEPTED toast: **"CLEAN CLEAR."**
- WRONG_ANSWER toast: *"Close. The judges disagree."*
- TIME_LIMIT_EXCEEDED toast: *"Too slow. The clock doesn't care about your algorithm's feelings."*
- JUDGE_ERROR toast: *"Our sandbox tripped, not your code. Hit retry."*

### Chat Panel
- Empty room chat: *"It's quiet in here. Say something. Talk trash. Talk strategy."*
- Empty team chat: *"Your squad's private line. Nobody else is reading this."*
- Empty DM: *"Start the conversation. Or the trash talk. Your call."*

### Call Bar
- Incoming call banner: **"YOUR SQUAD IS CALLING"**
- No one on call: *"Nobody's on comms yet. Jump in."*

### Leaderboard / Results
- Headline: **"HALL OF FAMERS"**
- Subtitle: *"Every clash has a winner. Tonight, it might be you."*
- Rank-up toast: *"YOU'RE CLIMBING."*
- Rank-down toast: *"Someone just took your spot."*
- Final results headline: **"THE DUST HAS SETTLED"**

### Notifications (generic)
- Team join: *"{name} joined your squad."*
- Room started: **"THE ARENA IS LIVE."**
- Rank change: *"Leaderboard shakeup — check your position."*

### Profile / Avatar
- Upload prompt: *"Show your face before you show your skills."*
- Upload success: *"Looking sharper already."*

---

## 16. Testing & Edge-Case Checklist

- [ ] Room code re-used after room ENDED — should not resolve to the old room
- [ ] Team join after room already went LIVE — block with a clear Netro error ("The arena's already live — no late entries.")
- [ ] Duplicate SQS delivery of the same judge message — verify idempotency key prevents double-scoring
- [ ] Team gets fewer problems than `questionsPerTeam` because the pool is too small — fallback to `distinctPerTeam=false` with a warning surfaced to the admin at Start time
- [ ] Chat message sent while WebSocket briefly reconnects — client-side queue + resend on reconnect, de-duped by `clientMessageId`
- [ ] WebRTC call across two users both behind symmetric NAT — confirm TURN relay actually kicks in (test with TURN forced by disabling STUN temporarily)
- [ ] Profile image upload with a spoofed content-type — confirm server-side validation on the presign call, not just the client
- [ ] Notification flood (e.g. rapid submissions) — confirm debounced leaderboard recompute prevents a notification per micro-update
- [ ] DM between two users not in the same room — must be rejected server-side, not just hidden client-side

---

*This plan is additive to the existing ClashCode architecture — no existing module (`auth`, `room`, `team`, `submission`, `common`, `config`) is replaced, only extended.*
