import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config({ path: '.env.server' });

type Player = { playerUid: string; displayName: string; photoURL: string | null; joinedAt: number };
type Match = { matchId: string; players: [Player, Player]; createdAt: number; startedAt?: number; endsAt?: number; states?: Map<string, any>; scores?: Map<string, number>; completed?: boolean; timer?: NodeJS.Timeout; disconnectTimers?: Map<string, NodeJS.Timeout>; readyPlayers?: Set<string> };
const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'https://uthao-dhaka.web.app',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
];
const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});
const queue = new Map<string, Player>();
const matches = new Map<string, Match>();
const playerMatches = new Map<string, string>();
const connectedByMatch = new Map<string, Set<string>>();
const QUEUE_TTL_MS = 2 * 60 * 1000;
const MATCH_DURATION_SEC = 10 * 60;
const DISCONNECT_GRACE_MS = 20_000;

function finishMatch(match: Match, winnerUid: string | null, reason: 'TIME_UP' | 'FORFEIT' | 'DISCONNECT') {
  if (match.completed) return;
  match.completed = true;
  if (match.timer) clearTimeout(match.timer);
  for (const timer of match.disconnectTimers?.values() ?? []) clearTimeout(timer);
  match.disconnectTimers?.clear();
  const scores = Object.fromEntries(match.scores ?? []);
  io.to(match.matchId).emit('match:result', {
    matchId: match.matchId,
    winnerUid,
    loserUid: winnerUid ? match.players.find((p) => p.playerUid !== winnerUid)?.playerUid ?? null : null,
    reason,
    scores,
    completedAt: Date.now(),
  });

  // Release both players for a NEW random match after the result has been broadcast.
  // Keep the completed match briefly so already-connected clients can finish receiving events.
  for (const player of match.players) {
    if (playerMatches.get(player.playerUid) === match.matchId) {
      playerMatches.delete(player.playerUid);
    }
    queue.delete(player.playerUid);
  }
  setTimeout(() => {
    matches.delete(match.matchId);
    connectedByMatch.delete(match.matchId);
  }, 60_000).unref?.();
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});
app.use(express.json({ limit: '16kb' }));

function cleanQueue() {
  const cutoff = Date.now() - QUEUE_TTL_MS;
  for (const [uid, player] of queue) if (player.joinedAt < cutoff) queue.delete(uid);
}
function publicPlayers(match: Match) {
  return match.players.map(({ playerUid, displayName, photoURL }) => ({ playerUid, displayName, photoURL }));
}
function emitRoomPresence(matchId: string) {
  const connected = [...(connectedByMatch.get(matchId) ?? new Set<string>())];
  io.to(matchId).emit('match:presence', { matchId, connectedPlayerUids: connected, connectedCount: connected.length });
}

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'uthao-dhaka-game-server', stage: '4B-4F-prototype' });
});

app.post('/matchmaking/join', (req, res) => {
  cleanQueue();
  const { playerUid, displayName, photoURL } = req.body ?? {};
  const authorization = req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) return res.status(401).json({ error: 'Firebase login token is required.' });
  if (typeof playerUid !== 'string' || playerUid.length < 5 || playerUid.length > 128) return res.status(400).json({ error: 'Invalid player UID.' });
  if (typeof displayName !== 'string' || displayName.length > 80) return res.status(400).json({ error: 'Invalid player name.' });

  const existingMatchId = playerMatches.get(playerUid);
  if (existingMatchId) {
    const existing = matches.get(existingMatchId);
    const opponent = existing?.players.find((p) => p.playerUid !== playerUid);
    if (existing && !existing.completed && opponent) {
      return res.json({ status: 'matched', matchId: existingMatchId, opponent: { displayName: opponent.displayName, photoURL: opponent.photoURL } });
    }
    // Never return a completed/stale room to a player requesting another match.
    playerMatches.delete(playerUid);
  }
  if (queue.has(playerUid)) return res.json({ status: 'searching' });
  const opponent = [...queue.values()].find((p) => p.playerUid !== playerUid);
  if (!opponent) {
    queue.set(playerUid, { playerUid, displayName: displayName.trim() || 'Dhaka Pilot', photoURL: typeof photoURL === 'string' ? photoURL.slice(0, 1000) : null, joinedAt: Date.now() });
    return res.json({ status: 'searching' });
  }
  queue.delete(opponent.playerUid);
  const current: Player = { playerUid, displayName: displayName.trim() || 'Dhaka Pilot', photoURL: typeof photoURL === 'string' ? photoURL.slice(0, 1000) : null, joinedAt: Date.now() };
  const match: Match = { matchId: randomUUID(), players: [opponent, current], createdAt: Date.now() };
  matches.set(match.matchId, match);
  playerMatches.set(opponent.playerUid, match.matchId);
  playerMatches.set(playerUid, match.matchId);
  connectedByMatch.set(match.matchId, new Set());
  return res.json({ status: 'matched', matchId: match.matchId, opponent: { displayName: opponent.displayName, photoURL: opponent.photoURL } });
});

app.get('/matchmaking/status/:playerUid', (req, res) => {
  cleanQueue();
  const uid = req.params.playerUid;
  const matchId = playerMatches.get(uid);
  if (matchId) {
    const match = matches.get(matchId);
    const opponent = match?.players.find((p) => p.playerUid !== uid);
    if (match && !match.completed && opponent) {
      return res.json({ status: 'matched', matchId, opponent: { displayName: opponent.displayName, photoURL: opponent.photoURL } });
    }
    playerMatches.delete(uid);
  }
  if (queue.has(uid)) return res.json({ status: 'searching' });
  return res.json({ status: 'idle' });
});

app.post('/matchmaking/leave', (req, res) => {
  const { playerUid } = req.body ?? {};
  if (typeof playerUid !== 'string') return res.status(400).json({ error: 'Invalid player UID.' });
  queue.delete(playerUid);
  res.json({ status: 'left' });
});

io.on('connection', (socket) => {
  socket.on('match:join', (payload: { matchId?: string; playerUid?: string }, acknowledge?: (result: unknown) => void) => {
    const matchId = payload?.matchId;
    const playerUid = payload?.playerUid;
    const match = typeof matchId === 'string' ? matches.get(matchId) : undefined;
    if (!match || typeof playerUid !== 'string' || !match.players.some((p) => p.playerUid === playerUid)) {
      acknowledge?.({ ok: false, error: 'This player is not a member of that match.' });
      return;
    }
    // A socket may join only the match that the in-memory matchmaking service assigned.
    if (playerMatches.get(playerUid) !== matchId) {
      acknowledge?.({ ok: false, error: 'Match membership could not be confirmed.' });
      return;
    }
    socket.data.matchId = matchId;
    socket.data.playerUid = playerUid;
    const pendingDisconnect = match.disconnectTimers?.get(playerUid);
    if (pendingDisconnect) {
      clearTimeout(pendingDisconnect);
      match.disconnectTimers?.delete(playerUid);
    }
    void socket.join(matchId);
    const connected = connectedByMatch.get(matchId) ?? new Set<string>();
    connected.add(playerUid);
    connectedByMatch.set(matchId, connected);
    if (!match.states) match.states = new Map();
    if (!match.scores) match.scores = new Map(match.players.map((p) => [p.playerUid, 0]));
    acknowledge?.({ ok: true, matchId, players: publicPlayers(match), connectedPlayerUids: [...connected] });
    emitRoomPresence(matchId);
    // Restore the opponent's last known position after a reconnect.
    for (const [uid, state] of match.states) if (uid !== playerUid) socket.emit('match:state', { playerUid: uid, ...state });
    if (match.endsAt) socket.emit('match:clock', { startedAt: match.startedAt, endsAt: match.endsAt, durationSec: MATCH_DURATION_SEC });
    socket.to(matchId).emit('match:player-joined', { matchId, playerUid });
  });

  socket.on('match:ready', () => {
    const matchId = socket.data.matchId as string | undefined;
    const playerUid = socket.data.playerUid as string | undefined;
    if (!matchId || !playerUid) return;
    const match = matches.get(matchId);
    if (!match || match.completed || !match.players.some((p) => p.playerUid === playerUid)) return;
    match.readyPlayers ??= new Set<string>();
    match.readyPlayers.add(playerUid);
    io.to(matchId).emit('match:ready-status', { readyCount: match.readyPlayers.size, required: 2 });
    if (match.readyPlayers.size === 2 && !match.startedAt) {
      match.startedAt = Date.now();
      match.endsAt = match.startedAt + MATCH_DURATION_SEC * 1000;
      io.to(matchId).emit('match:clock', { startedAt: match.startedAt, endsAt: match.endsAt, durationSec: MATCH_DURATION_SEC });
      match.timer = setTimeout(() => {
        const entries = Object.entries(Object.fromEntries(match.scores ?? [])) as Array<[string, number]>;
        const max = Math.max(0, ...entries.map(([, value]) => value));
        const winners = entries.filter(([, value]) => value === max);
        finishMatch(match, winners.length === 1 ? winners[0][0] : null, 'TIME_UP');
      }, MATCH_DURATION_SEC * 1000);
    }
  });

  socket.on('match:forfeit', () => {
    const matchId = socket.data.matchId as string | undefined;
    const playerUid = socket.data.playerUid as string | undefined;
    if (!matchId || !playerUid) return;
    const match = matches.get(matchId);
    if (!match || match.completed || !(match.startedAt || match.readyPlayers?.has(playerUid))) return;
    const winnerUid = match.players.find((p) => p.playerUid !== playerUid)?.playerUid ?? null;
    finishMatch(match, winnerUid, 'FORFEIT');
  });

  socket.on('match:state', (payload: { matchId?: string; playerUid?: string; heli?: any; score?: number }) => {
    const matchId = socket.data.matchId as string | undefined;
    const playerUid = socket.data.playerUid as string | undefined;
    if (!matchId || payload?.matchId !== matchId || payload?.playerUid !== playerUid) return;
    const match = matches.get(matchId);
    if (!match || match.completed || !match.startedAt || !payload.heli) return;
    const h = payload.heli;
    const numeric = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : 0;
    const safeHeli = { x:numeric(h.x), y:numeric(h.y), vx:numeric(h.vx), vy:numeric(h.vy), altitude:Math.max(0,Math.min(100,numeric(h.altitude))), targetAltitude:Math.max(0,Math.min(100,numeric(h.targetAltitude))), headingAngle:numeric(h.headingAngle), rotorAngle:numeric(h.rotorAngle), landedPadId:typeof h.landedPadId === 'string' ? h.landedPadId.slice(0,80) : null, autoCruise:Boolean(h.autoCruise), cruiseDir:{ dx:numeric(h.cruiseDir?.dx), dy:numeric(h.cruiseDir?.dy) } };
    const prior = match.scores?.get(playerUid) ?? 0;
    const proposed = numeric(payload.score);
    const score = Math.max(prior, Math.min(prior + 10000, proposed));
    match.states ??= new Map();
    match.scores ??= new Map();
    match.states.set(playerUid, { heli:safeHeli, score, updatedAt:Date.now() });
    match.scores.set(playerUid, score);
    socket.to(matchId).emit('match:state', { playerUid, heli:safeHeli, score, updatedAt:Date.now() });
  });

  socket.on('disconnect', () => {
    const matchId = socket.data.matchId as string | undefined;
    const playerUid = socket.data.playerUid as string | undefined;
    if (!matchId || !playerUid) return;
    // A player is considered connected while at least one of their sockets remains in the room.
    const remaining = [...(io.sockets.sockets.values())].some(
      (client) => client.id !== socket.id && client.data.matchId === matchId && client.data.playerUid === playerUid,
    );
    if (!remaining) {
      connectedByMatch.get(matchId)?.delete(playerUid);
      const match = matches.get(matchId);
      if (match && (match.startedAt || match.readyPlayers?.has(playerUid)) && !match.completed) {
        match.disconnectTimers ??= new Map();
        const oldTimer = match.disconnectTimers.get(playerUid);
        if (oldTimer) clearTimeout(oldTimer);
        const timer = setTimeout(() => {
          const isBack = connectedByMatch.get(matchId)?.has(playerUid);
          if (!isBack && !match.completed) {
            const winnerUid = match.players.find((p) => p.playerUid !== playerUid)?.playerUid ?? null;
            finishMatch(match, winnerUid, 'DISCONNECT');
          }
        }, DISCONNECT_GRACE_MS);
        match.disconnectTimers.set(playerUid, timer);
      }
    }
    emitRoomPresence(matchId);
    socket.to(matchId).emit('match:player-disconnected', { matchId, playerUid, graceSeconds: DISCONNECT_GRACE_MS / 1000 });
  });
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Uthao Dhaka Stage 4A server: http://localhost:${port}`);
});
