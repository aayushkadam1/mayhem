import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createInitialState, ADMIN_PASSWORD } from './state.js';
import { calcTotalScore, calcRoundTotal } from './types.js';
import { initPersistence, loadState, saveState } from './persistence.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors());
app.use(express.json());

// ─── In-memory state ────────────────────────────────────────────────────────
const persistence = await initPersistence();
let state = await loadState(createInitialState, persistence);
if (!state.warRound) state.warRound = 4;
if (!state.warVotes) state.warVotes = {};
if (!state.judgeVotes) state.judgeVotes = {};
if (!state.primes) state.primes = [];
if (!state.judges) state.judges = [];
syncAllJudgeVotes();

// ─── Helpers ────────────────────────────────────────────────────────────────
function getPublicTeam(t) {
  return {
    id: t.id,
    name: t.name,
    domain: t.domain,
    eliminated: t.eliminated,
    scores: t.scores,
    totalScore: calcTotalScore(t.scores),
    roundScores: {
      round1: calcRoundTotal(t.scores, 1),
      round2: calcRoundTotal(t.scores, 2),
      round3: calcRoundTotal(t.scores, 3),
      round4: calcRoundTotal(t.scores, 4),
      round5: calcRoundTotal(t.scores, 5),
    },
  };
}

function makeEmptyScores() {
  return {
    round1: { insightAccuracy: 0, taglineCreativity: 0, audienceInsight: 0, bonusTokens: 0, judgeVotes: 0 },
    round2: { remainingTokens: 0, judgeVotes: 0 },
    round3: { creativity: 0, relevance: 0, performance: 0, clarity: 0, engagement: 0, judgeVotes: 0 },
    round4: { strategy: 0, creativity: 0, impact: 0, audienceVotes: 0 },
    round5: { insight: 0, strategy: 0, creativity: 0, feasibility: 0, delivery: 0, judgeVotes: 0 },
  };
}

function getJudgeVoteTotal(round, teamId) {
  const roundVotes = state.judgeVotes?.[round] || {};
  const teamVotes = roundVotes[teamId] || {};
  return Object.values(teamVotes).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function syncJudgeVoteTotal(round, teamId) {
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return;
  const total = getJudgeVoteTotal(round, teamId);
  if (round === 1) team.scores.round1.judgeVotes = total;
  if (round === 2) team.scores.round2.judgeVotes = total;
  if (round === 3) team.scores.round3.judgeVotes = total;
  if (round === 5) team.scores.round5.judgeVotes = total;
}

function setJudgeVote(round, teamId, judgeId, points) {
  if (!state.judgeVotes[round]) state.judgeVotes[round] = {};
  if (!state.judgeVotes[round][teamId]) state.judgeVotes[round][teamId] = {};
  state.judgeVotes[round][teamId][judgeId] = points;
  syncJudgeVoteTotal(round, teamId);
}

function syncAllJudgeVotes() {
  for (const team of state.teams) {
    [1, 2, 3, 5].forEach(round => syncJudgeVoteTotal(round, team.id));
  }
}

function getPublicState() {
  return {
    currentRound: state.currentRound,
    warRound: state.warRound,
    teams: state.teams.map(getPublicTeam),
    timer: state.timer,
    battles: state.battles,
    activeBattleId: state.activeBattleId,
    voteCounts: getVoteCounts(),
  };
}

function getVoteCounts() {
  const counts = {};
  for (const entry of Object.values(state.warVotes)) {
    if (!entry || !entry.voteFor) continue;
    const weight = Number(entry.weight) || 0;
    if (weight <= 0) continue;
    counts[entry.voteFor] = (counts[entry.voteFor] || 0) + weight;
  }
  return counts;
}

function broadcastState() {
  io.emit('state:update', getPublicState());
  void saveState(state, persistence).catch(err => {
    console.error('Failed to persist state:', err);
  });
}

// Admin auth middleware
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ─── Public routes ──────────────────────────────────────────────────────────

app.get('/api/state', (_req, res) => {
  res.json(getPublicState());
});

// ─── Team auth ──────────────────────────────────────────────────────────────

app.post('/api/team/login', (req, res) => {
  const { teamId, password } = req.body;
  if (!teamId || !password) {
    res.status(400).json({ error: 'teamId and password required' });
    return;
  }
  const team = state.teams.find(t => t.id === teamId);
  if (!team || team.password !== password) {
    res.status(401).json({ error: 'Invalid team or password' });
    return;
  }
  res.json({ teamId: team.id, name: team.name, domain: team.domain });
});

// ─── Prime auth ─────────────────────────────────────────────────────────────

app.get('/api/prime/list', (_req, res) => {
  res.json(state.primes.map(p => ({ id: p.id, name: p.name })));
});

app.post('/api/prime/login', (req, res) => {
  const { primeId, password } = req.body;
  if (!primeId || !password) {
    res.status(400).json({ error: 'primeId and password required' });
    return;
  }
  const prime = state.primes.find(p => p.id === primeId);
  if (!prime || prime.password !== password) {
    res.status(401).json({ error: 'Invalid prime credentials' });
    return;
  }
  res.json({ primeId: prime.id, name: prime.name });
});

// ─── Judge auth ─────────────────────────────────────────────────────────────

app.get('/api/judge/list', (_req, res) => {
  res.json(state.judges.map(j => ({ id: j.id, name: j.name })));
});

app.post('/api/judge/login', (req, res) => {
  const { judgeId, password } = req.body;
  if (!judgeId || !password) {
    res.status(400).json({ error: 'judgeId and password required' });
    return;
  }
  const judge = state.judges.find(j => j.id === judgeId);
  if (!judge || judge.password !== password) {
    res.status(401).json({ error: 'Invalid judge credentials' });
    return;
  }
  res.json({ judgeId: judge.id, name: judge.name });
});

// ─── Admin auth ─────────────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid admin password' });
    return;
  }
  res.json({ success: true, token: ADMIN_PASSWORD });
});

// ─── Admin: Team management ────────────────────────────────────────────────

app.get('/api/admin/teams', requireAdmin, (_req, res) => {
  res.json(
    state.teams.map(t => ({
      ...getPublicTeam(t),
      password: t.password,
    }))
  );
});

app.post('/api/admin/teams', requireAdmin, (req, res) => {
  const { id, name, password, domain } = req.body;
  if (!id || !name || !password) {
    res.status(400).json({ error: 'id, name, and password required' });
    return;
  }
  if (state.teams.some(t => t.id === id)) {
    res.status(409).json({ error: 'Team id already exists' });
    return;
  }
  const team = {
    id: String(id).slice(0, 20),
    name: String(name).slice(0, 50),
    password: String(password).slice(0, 50),
    domain: typeof domain === 'string' && domain.trim() ? domain.slice(0, 50) : 'General',
    eliminated: false,
    scores: makeEmptyScores(),
  };
  state.teams.push(team);
  broadcastState();
  res.json({ success: true, team: getPublicTeam(team) });
});

app.delete('/api/admin/team/:teamId', requireAdmin, (req, res) => {
  const idx = state.teams.findIndex(t => t.id === req.params.teamId);
  if (idx === -1) { res.status(404).json({ error: 'Team not found' }); return; }
  const teamId = state.teams[idx].id;
  state.battles = state.battles.filter(b => b.team1Id !== teamId && b.team2Id !== teamId);
  if (state.activeBattleId) {
    const active = state.battles.find(b => b.id === state.activeBattleId);
    if (!active) state.activeBattleId = null;
  }
  delete state.warVotes[teamId];
  for (const entry of Object.values(state.warVotes)) {
    if (entry && entry.voteFor === teamId) entry.voteFor = null;
  }
  for (const roundVotes of Object.values(state.judgeVotes)) {
    if (roundVotes && roundVotes[teamId]) delete roundVotes[teamId];
  }
  state.teams.splice(idx, 1);
  broadcastState();
  res.json({ success: true });
});

app.put('/api/admin/team/:teamId/name', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name required' });
    return;
  }
  team.name = name.slice(0, 50);
  broadcastState();
  res.json({ success: true });
});

app.put('/api/admin/team/:teamId/eliminate', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  team.eliminated = req.body.eliminated === true;
  broadcastState();
  res.json({ success: true });
});

// ─── Admin: Scoring ─────────────────────────────────────────────────────────

app.put('/api/admin/scores/:teamId/round1', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const { insightAccuracy, taglineCreativity, audienceInsight, bonusTokens, judgeVotes } = req.body;
  const ia = Math.min(5, Math.max(0, Number(insightAccuracy) || 0));
  const tc = Math.min(5, Math.max(0, Number(taglineCreativity) || 0));
  const ai = Math.min(10, Math.max(0, Number(audienceInsight) || 0));
  const bt = [0, 10, 20].includes(Number(bonusTokens)) ? Number(bonusTokens) : 0;
  team.scores.round1 = {
    insightAccuracy: ia,
    taglineCreativity: tc,
    audienceInsight: ai,
    bonusTokens: bt,
    judgeVotes: team.scores.round1.judgeVotes,
  };
  if (judgeVotes !== undefined) {
    const points = Math.min(100, Math.max(0, Number(judgeVotes) || 0));
    setJudgeVote(1, team.id, 'admin', points);
  }
  broadcastState();
  res.json({ success: true, scores: team.scores.round1 });
});

app.put('/api/admin/scores/:teamId/round2', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const remainingTokens = Math.max(0, Number(req.body.remainingTokens) || 0);
  const judgeVotes = req.body.judgeVotes;
  team.scores.round2 = { remainingTokens, judgeVotes: team.scores.round2.judgeVotes };
  if (judgeVotes !== undefined) {
    const points = Math.min(100, Math.max(0, Number(judgeVotes) || 0));
    setJudgeVote(2, team.id, 'admin', points);
  }
  broadcastState();
  res.json({ success: true, scores: team.scores.round2 });
});

app.put('/api/admin/scores/:teamId/round3', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const { creativity, relevance, performance, clarity, engagement, judgeVotes } = req.body;
  team.scores.round3 = {
    creativity: Math.min(5, Math.max(0, Number(creativity) || 0)),
    relevance: Math.min(5, Math.max(0, Number(relevance) || 0)),
    performance: Math.min(5, Math.max(0, Number(performance) || 0)),
    clarity: Math.min(5, Math.max(0, Number(clarity) || 0)),
    engagement: Math.min(5, Math.max(0, Number(engagement) || 0)),
    judgeVotes: team.scores.round3.judgeVotes,
  };
  if (judgeVotes !== undefined) {
    const points = Math.min(100, Math.max(0, Number(judgeVotes) || 0));
    setJudgeVote(3, team.id, 'admin', points);
  }
  broadcastState();
  res.json({ success: true, scores: team.scores.round3 });
});

app.put('/api/admin/scores/:teamId/round4', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const { strategy, creativity, impact } = req.body;
  team.scores.round4 = {
    ...team.scores.round4,
    strategy: Math.min(5, Math.max(0, Number(strategy) || 0)),
    creativity: Math.min(5, Math.max(0, Number(creativity) || 0)),
    impact: Math.min(5, Math.max(0, Number(impact) || 0)),
  };
  broadcastState();
  res.json({ success: true, scores: team.scores.round4 });
});

app.put('/api/admin/scores/:teamId/round5', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const { insight, strategy, creativity, feasibility, delivery, judgeVotes } = req.body;
  team.scores.round5 = {
    insight: Math.min(10, Math.max(0, Number(insight) || 0)),
    strategy: Math.min(10, Math.max(0, Number(strategy) || 0)),
    creativity: Math.min(10, Math.max(0, Number(creativity) || 0)),
    feasibility: Math.min(10, Math.max(0, Number(feasibility) || 0)),
    delivery: Math.min(10, Math.max(0, Number(delivery) || 0)),
    judgeVotes: team.scores.round5.judgeVotes,
  };
  if (judgeVotes !== undefined) {
    const points = Math.min(100, Math.max(0, Number(judgeVotes) || 0));
    setJudgeVote(5, team.id, 'admin', points);
  }
  broadcastState();
  res.json({ success: true, scores: team.scores.round5 });
});

// ─── Admin: Round management ────────────────────────────────────────────────

app.put('/api/admin/round', requireAdmin, (req, res) => {
  const round = Number(req.body.round);
  if (round < 1 || round > 5) {
    res.status(400).json({ error: 'Round must be 1-5' });
    return;
  }
  state.currentRound = round;
  broadcastState();
  res.json({ success: true, currentRound: round });
});

// ─── Admin: Timer ───────────────────────────────────────────────────────────

app.post('/api/admin/timer/start', requireAdmin, (req, res) => {
  const minutes = Number(req.body.minutes);
  const label = typeof req.body.label === 'string' ? req.body.label.slice(0, 100) : '';
  if (!minutes || minutes <= 0) {
    res.status(400).json({ error: 'minutes must be positive' });
    return;
  }
  state.timer = {
    endTime: Date.now() + minutes * 60 * 1000,
    running: true,
    label,
  };
  broadcastState();
  res.json({ success: true, timer: state.timer });
});

app.post('/api/admin/timer/extend', requireAdmin, (req, res) => {
  const minutes = Number(req.body.minutes);
  if (!minutes || minutes <= 0) {
    res.status(400).json({ error: 'minutes must be positive' });
    return;
  }
  if (state.timer.endTime && state.timer.running) {
    state.timer.endTime += minutes * 60 * 1000;
  } else {
    state.timer = {
      endTime: Date.now() + minutes * 60 * 1000,
      running: true,
      label: state.timer.label,
    };
  }
  broadcastState();
  res.json({ success: true, timer: state.timer });
});

app.post('/api/admin/timer/stop', requireAdmin, (_req, res) => {
  state.timer = { endTime: null, running: false, label: '' };
  broadcastState();
  res.json({ success: true });
});

// ─── Admin: Battles (Round 4) ──────────────────────────────────────────────

app.post('/api/admin/battles', requireAdmin, (req, res) => {
  const { team1Id, team2Id } = req.body;
  const t1 = state.teams.find(t => t.id === team1Id);
  const t2 = state.teams.find(t => t.id === team2Id);
  if (!t1 || !t2) { res.status(404).json({ error: 'Team not found' }); return; }
  if (team1Id === team2Id) { res.status(400).json({ error: 'Cannot battle same team' }); return; }
  const battle = {
    id: `battle_${Date.now()}`,
    team1Id,
    team2Id,
    status: 'pending',
  };
  state.battles.push(battle);
  broadcastState();
  res.json({ success: true, battle });
});

app.put('/api/admin/battles/:battleId/activate', requireAdmin, (req, res) => {
  if (state.currentRound !== state.warRound) {
    res.status(400).json({ error: 'Battles can only go live during the war round' });
    return;
  }
  const battle = state.battles.find(b => b.id === req.params.battleId);
  if (!battle) { res.status(404).json({ error: 'Battle not found' }); return; }
  for (const b of state.battles) {
    if (b.status === 'active') b.status = 'pending';
  }
  battle.status = 'active';
  state.activeBattleId = battle.id;
  state.warVotes = {};
  broadcastState();
  res.json({ success: true });
});

app.put('/api/admin/battles/:battleId/complete', requireAdmin, (req, res) => {
  const battle = state.battles.find(b => b.id === req.params.battleId);
  if (!battle) { res.status(404).json({ error: 'Battle not found' }); return; }

  const counts = getVoteCounts();
  const t1 = state.teams.find(t => t.id === battle.team1Id);
  const t2 = state.teams.find(t => t.id === battle.team2Id);
  if (t1) t1.scores.round4.audienceVotes = counts[battle.team1Id] || 0;
  if (t2) t2.scores.round4.audienceVotes = counts[battle.team2Id] || 0;

  battle.status = 'completed';
  state.activeBattleId = null;
  state.warVotes = {};
  broadcastState();
  res.json({
    success: true,
    team1Votes: counts[battle.team1Id] || 0,
    team2Votes: counts[battle.team2Id] || 0,
  });
});

app.delete('/api/admin/battles/:battleId', requireAdmin, (req, res) => {
  const idx = state.battles.findIndex(b => b.id === req.params.battleId);
  if (idx === -1) { res.status(404).json({ error: 'Battle not found' }); return; }
  if (state.activeBattleId === state.battles[idx].id) {
    state.activeBattleId = null;
    state.warVotes = {};
  }
  state.battles.splice(idx, 1);
  broadcastState();
  res.json({ success: true });
});

// ─── Team/Prime: War voting ─────────────────────────────────────────────────

function ensureActiveWarBattle(res) {
  if (state.currentRound !== state.warRound) {
    res.status(400).json({ error: 'War voting only allowed during war round' });
    return null;
  }
  if (!state.activeBattleId) {
    res.status(400).json({ error: 'No active battle' });
    return null;
  }
  const battle = state.battles.find(b => b.id === state.activeBattleId);
  if (!battle) {
    res.status(400).json({ error: 'Active battle not found' });
    return null;
  }
  return battle;
}

app.post('/api/vote', (req, res) => {
  const { teamId, password, voteFor } = req.body;
  if (!teamId || !password || !voteFor) {
    res.status(400).json({ error: 'teamId, password, and voteFor required' });
    return;
  }
  const team = state.teams.find(t => t.id === teamId);
  if (!team || team.password !== password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const battle = ensureActiveWarBattle(res);
  if (!battle) return;
  if (teamId === battle.team1Id || teamId === battle.team2Id) {
    res.status(403).json({ error: 'Battling teams cannot vote' });
    return;
  }
  if (voteFor !== battle.team1Id && voteFor !== battle.team2Id) {
    res.status(400).json({ error: 'Can only vote for a battling team' });
    return;
  }
  state.warVotes[teamId] = { voteFor, weight: 1 };
  broadcastState();
  res.json({ success: true, votedFor: voteFor });
});

app.post('/api/prime/vote', (req, res) => {
  const { primeId, password, voteFor } = req.body;
  if (!primeId || !password || !voteFor) {
    res.status(400).json({ error: 'primeId, password, and voteFor required' });
    return;
  }
  const prime = state.primes.find(p => p.id === primeId);
  if (!prime || prime.password !== password) {
    res.status(401).json({ error: 'Invalid prime credentials' });
    return;
  }
  const battle = ensureActiveWarBattle(res);
  if (!battle) return;
  if (voteFor !== battle.team1Id && voteFor !== battle.team2Id) {
    res.status(400).json({ error: 'Can only vote for a battling team' });
    return;
  }
  state.warVotes[primeId] = { voteFor, weight: 5 };
  broadcastState();
  res.json({ success: true, votedFor: voteFor });
});

// ─── Judge: Round voting ───────────────────────────────────────────────────

app.post('/api/judge/vote', (req, res) => {
  const { judgeId, password, teamId, round, points } = req.body;
  if (!judgeId || !password || !teamId || !round) {
    res.status(400).json({ error: 'judgeId, password, teamId, and round required' });
    return;
  }
  const judge = state.judges.find(j => j.id === judgeId);
  if (!judge || judge.password !== password) {
    res.status(401).json({ error: 'Invalid judge credentials' });
    return;
  }
  const team = state.teams.find(t => t.id === teamId);
  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  const roundNum = Number(round);
  if (roundNum < 1 || roundNum > 5 || roundNum === state.warRound) {
    res.status(400).json({ error: 'Judges cannot vote during war round' });
    return;
  }
  const score = Math.min(100, Math.max(0, Number(points) || 0));
  setJudgeVote(roundNum, teamId, judgeId, score);
  broadcastState();
  res.json({ success: true, teamId, round: roundNum, points: score });
});

// ─── Admin: Reset state ─────────────────────────────────────────────────────

app.post('/api/admin/reset', requireAdmin, (_req, res) => {
  state = createInitialState();
  syncAllJudgeVotes();
  broadcastState();
  res.json({ success: true });
});

// ─── Socket.IO ──────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  socket.emit('state:update', getPublicState());

  socket.on('disconnect', () => {
    // cleanup if needed
  });
});

// Timer check — auto-stop when time runs out
setInterval(() => {
  if (state.timer.running && state.timer.endTime && Date.now() >= state.timer.endTime) {
    state.timer.running = false;
    io.emit('timer:ended', { label: state.timer.label });
    broadcastState();
  }
}, 500);

// ─── Start server ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
  console.log(`Teams:`);
  for (const t of state.teams) {
    console.log(`  ${t.id} | ${t.name} | password: ${t.password} | ${t.domain}`);
  }
});
