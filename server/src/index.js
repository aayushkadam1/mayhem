import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createInitialState, ADMIN_PASSWORD } from './state.js';
import { calcTotalScore, calcRoundTotal } from './types.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors());
app.use(express.json());

// ─── In-memory state ────────────────────────────────────────────────────────
let state = createInitialState();

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

function getPublicState() {
  return {
    currentRound: state.currentRound,
    teams: state.teams.map(getPublicTeam),
    timer: state.timer,
    battles: state.battles,
    activeBattleId: state.activeBattleId,
    voteCounts: getVoteCounts(),
  };
}

function getVoteCounts() {
  const counts = {};
  for (const votedFor of Object.values(state.votes)) {
    counts[votedFor] = (counts[votedFor] || 0) + 1;
  }
  return counts;
}

function broadcastState() {
  io.emit('state:update', getPublicState());
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
  const { insightAccuracy, taglineCreativity, audienceInsight, bonusTokens } = req.body;
  const ia = Math.min(5, Math.max(0, Number(insightAccuracy) || 0));
  const tc = Math.min(5, Math.max(0, Number(taglineCreativity) || 0));
  const ai = Math.min(10, Math.max(0, Number(audienceInsight) || 0));
  const bt = [0, 10, 20].includes(Number(bonusTokens)) ? Number(bonusTokens) : 0;
  team.scores.round1 = { insightAccuracy: ia, taglineCreativity: tc, audienceInsight: ai, bonusTokens: bt };
  broadcastState();
  res.json({ success: true, scores: team.scores.round1 });
});

app.put('/api/admin/scores/:teamId/round2', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const remainingTokens = Math.max(0, Number(req.body.remainingTokens) || 0);
  team.scores.round2 = { remainingTokens };
  broadcastState();
  res.json({ success: true, scores: team.scores.round2 });
});

app.put('/api/admin/scores/:teamId/round3', requireAdmin, (req, res) => {
  const team = state.teams.find(t => t.id === req.params.teamId);
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const { creativity, relevance, performance, clarity, engagement } = req.body;
  team.scores.round3 = {
    creativity: Math.min(5, Math.max(0, Number(creativity) || 0)),
    relevance: Math.min(5, Math.max(0, Number(relevance) || 0)),
    performance: Math.min(5, Math.max(0, Number(performance) || 0)),
    clarity: Math.min(5, Math.max(0, Number(clarity) || 0)),
    engagement: Math.min(5, Math.max(0, Number(engagement) || 0)),
  };
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
  const { insight, strategy, creativity, feasibility, delivery } = req.body;
  team.scores.round5 = {
    insight: Math.min(10, Math.max(0, Number(insight) || 0)),
    strategy: Math.min(10, Math.max(0, Number(strategy) || 0)),
    creativity: Math.min(10, Math.max(0, Number(creativity) || 0)),
    feasibility: Math.min(10, Math.max(0, Number(feasibility) || 0)),
    delivery: Math.min(10, Math.max(0, Number(delivery) || 0)),
  };
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
  const battle = state.battles.find(b => b.id === req.params.battleId);
  if (!battle) { res.status(404).json({ error: 'Battle not found' }); return; }
  for (const b of state.battles) {
    if (b.status === 'active') b.status = 'pending';
  }
  battle.status = 'active';
  state.activeBattleId = battle.id;
  state.votes = {};
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
  state.votes = {};
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
    state.votes = {};
  }
  state.battles.splice(idx, 1);
  broadcastState();
  res.json({ success: true });
});

// ─── Team: Voting ───────────────────────────────────────────────────────────

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
  if (!state.activeBattleId) {
    res.status(400).json({ error: 'No active battle' });
    return;
  }
  const battle = state.battles.find(b => b.id === state.activeBattleId);
  if (!battle) {
    res.status(400).json({ error: 'Active battle not found' });
    return;
  }
  if (teamId === battle.team1Id || teamId === battle.team2Id) {
    res.status(403).json({ error: 'Battling teams cannot vote' });
    return;
  }
  if (voteFor !== battle.team1Id && voteFor !== battle.team2Id) {
    res.status(400).json({ error: 'Can only vote for a battling team' });
    return;
  }
  state.votes[teamId] = voteFor;
  broadcastState();
  res.json({ success: true, votedFor: voteFor });
});

// ─── Admin: Reset state ─────────────────────────────────────────────────────

app.post('/api/admin/reset', requireAdmin, (_req, res) => {
  state = createInitialState();
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
