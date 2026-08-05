/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MOCK API — Toggle MOCK_MODE to switch between real backend and fake data
 *
 * Usage:
 *   In src/lib/axios.js set:  export const MOCK_MODE = true;
 *   To re-enable real API:    export const MOCK_MODE = false;
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Fake data ─────────────────────────────────────────────────────────────────

const MOCK_USER = {
  _id: 'user_001',
  id: 'user_001',
  username: 'TestCoder',
  email: 'test@clashcode.io',
  profilePictureKey: null,
  activeRoomId: null,
  rating: 1450,
  wins: 12,
  losses: 5,
};

const MOCK_ROOMS = [
  {
    _id: 'room_001', id: 'room_001',
    name: 'Alpha Strike Battle',
    code: 'ALPH01',
    status: 'WAITING',
    difficulty: 'MEDIUM',
    timeLimitMinutes: 30,
    questionsPerUser: 2,
    maxTeamSize: 4,
    teams: [{ _id: 't1' }, { _id: 't2' }],
    settings: { privacy: 'public' },
    hasPassword: false,
  },
  {
    _id: 'room_002', id: 'room_002',
    name: 'Dragon Coders',
    code: 'DRAG02',
    status: 'PLAYING',
    difficulty: 'HARD',
    timeLimitMinutes: 45,
    questionsPerUser: 3,
    maxTeamSize: 2,
    teams: [{ _id: 't3' }, { _id: 't4' }],
    settings: { privacy: 'public' },
    hasPassword: false,
  },
  {
    _id: 'room_003', id: 'room_003',
    name: 'Secret Ops (Private)',
    code: 'SECR03',
    status: 'WAITING',
    difficulty: 'EASY',
    timeLimitMinutes: 20,
    questionsPerUser: 1,
    maxTeamSize: 3,
    teams: [{ _id: 't5' }],
    settings: { privacy: 'private' },
    hasPassword: true,
  },
  {
    _id: 'room_004', id: 'room_004',
    name: 'Finisher Squad',
    code: 'FINI04',
    status: 'ENDED',
    difficulty: 'MIXED',
    timeLimitMinutes: 60,
    questionsPerUser: 4,
    maxTeamSize: 4,
    teams: [{ _id: 't6' }, { _id: 't7' }, { _id: 't8' }],
    settings: { privacy: 'public' },
    hasPassword: false,
  },
];

const MOCK_ROOM_DETAIL = {
  _id: 'room_001', id: 'room_001',
  name: 'Alpha Strike Battle',
  code: 'ALPH01',
  status: 'WAITING',
  difficulty: 'MEDIUM',
  timeLimitMinutes: 30,
  questionsPerUser: 2,
  maxTeamSize: 4,
  adminId: 'user_001',
  teams: [
    {
      _id: 't1', id: 't1',
      name: 'Team Alpha',
      members: [
        { userId: { _id: 'user_001', id: 'user_001', username: 'TestCoder' }, isLeader: true, isReady: false },
      ],
    },
    {
      _id: 't2', id: 't2',
      name: 'Team Beta',
      members: [
        { userId: { _id: 'user_002', id: 'user_002', username: 'ByteWizard' }, isLeader: true, isReady: true },
        { userId: { _id: 'user_003', id: 'user_003', username: 'NullPointer' }, isLeader: false, isReady: false },
      ],
    },
  ],
  settings: { privacy: 'public' },
};

let mockTeams = [...MOCK_ROOM_DETAIL.teams];

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ── Route handlers ────────────────────────────────────────────────────────────

const handlers = {

  // Auth
  'POST /auth/login': async () => {
    await delay();
    return {
      success: true,
      data: {
        accessToken: 'mock_access_token_12345',
        refreshToken: 'mock_refresh_token_67890',
        user: MOCK_USER,
      },
    };
  },

  'POST /auth/register': async () => {
    await delay(400);
    return { success: true, message: 'Verification code sent to your email.' };
  },

  'POST /auth/verify': async () => {
    await delay(300);
    return { success: true, message: 'Email verified successfully.' };
  },

  'POST /auth/resend-verification': async () => {
    await delay(200);
    return { success: true, message: 'Verification code resent.' };
  },

  'POST /auth/refresh': async () => {
    await delay(100);
    return {
      success: true,
      data: { accessToken: 'mock_access_token_refreshed' },
    };
  },

  'GET /auth/me': async () => {
    await delay(200);
    return { success: true, data: { ...MOCK_USER, activeRoomId: null } };
  },

  // Forgot password
  'POST /auth/forgot-password': async () => {
    await delay(300);
    return { success: true, message: 'Password reset email sent.' };
  },

  'POST /auth/reset-password': async () => {
    await delay(300);
    return { success: true, message: 'Password reset successfully.' };
  },

  // Rooms
  'GET /rooms': async () => {
    await delay(400);
    return { success: true, data: MOCK_ROOMS };
  },

  'POST /rooms': async (body) => {
    await delay(500);
    const newRoom = {
      _id: 'room_new_001', id: 'room_new_001',
      name: body?.name || 'New Room',
      code: 'NEW001',
      status: 'WAITING',
      difficulty: body?.difficulty || 'MIXED',
      timeLimitMinutes: body?.timeLimitMinutes || 30,
      questionsPerUser: body?.questionsPerUser || 1,
      maxTeamSize: body?.maxTeamSize || 4,
      teams: [],
      settings: { privacy: 'public' },
      adminId: 'user_001',
    };
    return { success: true, data: newRoom };
  },

  'POST /rooms/join': async (body) => {
    await delay(400);
    const code = body?.code || 'ALPH01';
    const found = MOCK_ROOMS.find(r => r.code === code) || MOCK_ROOMS[0];
    return { success: true, data: { ...MOCK_ROOM_DETAIL, ...found } };
  },

  'GET /rooms/:id': async () => {
    await delay(300);
    return { success: true, data: MOCK_ROOM_DETAIL };
  },

  // Teams
  'GET /teams/room/:id': async () => {
    await delay(300);
    return { success: true, data: mockTeams };
  },

  'POST /teams': async (body) => {
    await delay(400);
    const newTeam = {
      _id: `team_new_${Date.now()}`,
      id: `team_new_${Date.now()}`,
      name: body?.name || 'My New Team',
      code: `CODE${Math.floor(Math.random() * 1000)}`,
      roomId: body?.roomId,
      members: [{ userId: MOCK_USER, isLeader: true, isReady: false }],
      visibility: 'PRIVATE',
      maxSize: 4
    };
    mockTeams.push(newTeam);
    return {
      success: true,
      data: newTeam,
    };
  },

  'POST /teams/join': async (body) => {
    await delay(300);
    let targetTeam = null;
    
    if (body?.code) {
      targetTeam = mockTeams.find(t => t.code === body.code);
    } else if (body?.teamId) {
      targetTeam = mockTeams.find(t => t.id === body.teamId || t._id === body.teamId);
    }

    if (!targetTeam) {
      // If code doesn't match, just join the first team or create a dummy match for demo purposes
      targetTeam = mockTeams[0];
    }
    
    // Add user to team if not already there
    const alreadyIn = targetTeam.members.some(m => m.userId.id === MOCK_USER.id);
    if (!alreadyIn) {
      targetTeam.members.push({ userId: MOCK_USER, isLeader: false, isReady: false });
    }

    return { success: true, data: targetTeam };
  },

  'PATCH /teams/:teamId/ready': async () => {
    await delay(200);
    // Find the user's team and toggle their ready state
    const team = mockTeams.find(t => t.members.some(m => m.userId.id === MOCK_USER.id));
    if (team) {
      const member = team.members.find(m => m.userId.id === MOCK_USER.id);
      if (member) member.isReady = !member.isReady;
      return { success: true, data: team };
    }
    return { success: true };
  },

  'POST /rooms/:id/start': async () => {
    await delay(500);
    return { success: true, data: { ...MOCK_ROOM_DETAIL, status: 'PLAYING' } };
  },

  'GET /rooms/:id/results': async () => {
    await delay(300);
    return {
      success: true,
      data: {
        winner: MOCK_ROOM_DETAIL.teams[0],
        teams: MOCK_ROOM_DETAIL.teams,
        scores: { t1: 120, t2: 85 },
      },
    };
  },

  // User profile
  'PATCH /auth/me': async (body) => {
    await delay(300);
    return { success: true, data: { ...MOCK_USER, ...body } };
  },
};

// ── Mock dispatcher ───────────────────────────────────────────────────────────

function matchHandler(method, url) {
  // Try exact match first
  const exact = `${method} ${url}`;
  if (handlers[exact]) return handlers[exact];

  // Try wildcard match (replace path segments with :param)
  for (const key of Object.keys(handlers)) {
    const [hMethod, hPath] = key.split(' ');
    if (hMethod !== method) continue;

    const hParts = hPath.split('/');
    const uParts = url.split('/');
    if (hParts.length !== uParts.length) continue;

    const match = hParts.every((p, i) => p.startsWith(':') || p === uParts[i]);
    if (match) return handlers[key];
  }
  return null;
}

export async function mockRequest(method, url, body) {
  const handler = matchHandler(method.toUpperCase(), url);

  if (handler) {
    const result = await handler(body);
    return { data: result, status: 200 };
  }

  // Unknown route — return a generic success to avoid crashes
  console.warn(`[MOCK API] No handler for ${method.toUpperCase()} ${url} — returning empty success`);
  return { data: { success: true, data: null }, status: 200 };
}
