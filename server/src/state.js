function emptyScores() {
  return {
    round1: { insightAccuracy: 0, taglineCreativity: 0, audienceInsight: 0, bonusTokens: 0, judgeVotes: 0 },
    round2: { remainingTokens: 0, judgeVotes: 0 },
    round3: { creativity: 0, relevance: 0, performance: 0, clarity: 0, engagement: 0, judgeVotes: 0 },
    round4: { strategy: 0, creativity: 0, impact: 0, audienceVotes: 0 },
    round5: { insight: 0, strategy: 0, creativity: 0, feasibility: 0, delivery: 0, judgeVotes: 0 },
  };
}

function makeTeam(id, name, password, domain) {
  return { id, name, password, domain, eliminated: false, scores: emptyScores() };
}

const defaultTeams = [
  // Food & Beverages (4 teams)
  makeTeam('fb1', 'Team FB-1', 'Kx7mP2', 'Food & Beverages'),
  makeTeam('fb2', 'Team FB-2', 'Qr9fN3', 'Food & Beverages'),
  makeTeam('fb3', 'Team FB-3', 'Wz5gT8', 'Food & Beverages'),
  makeTeam('fb4', 'Team FB-4', 'Hb6jY4', 'Food & Beverages'),
  // Clothing & Apparels (4 teams)
  makeTeam('ca1', 'Team CA-1', 'Lp3nV7', 'Clothing & Apparels'),
  makeTeam('ca2', 'Team CA-2', 'Sd8kM1', 'Clothing & Apparels'),
  makeTeam('ca3', 'Team CA-3', 'Vf2rX9', 'Clothing & Apparels'),
  makeTeam('ca4', 'Team CA-4', 'Tc6yW5', 'Clothing & Apparels'),
  // Media & Entertainment (4 teams)
  makeTeam('me1', 'Team ME-1', 'Jn4bQ8', 'Media & Entertainment'),
  makeTeam('me2', 'Team ME-2', 'Xg7dH3', 'Media & Entertainment'),
  makeTeam('me3', 'Team ME-3', 'Mw9zS6', 'Media & Entertainment'),
  makeTeam('me4', 'Team ME-4', 'Fr1cK4', 'Media & Entertainment'),
];

const defaultPrimes = [
  { id: 'p1', name: 'Prime Member 1', password: 'Prime@01' },
  { id: 'p2', name: 'Prime Member 2', password: 'Prime@02' },
  { id: 'p3', name: 'Prime Member 3', password: 'Prime@03' },
  { id: 'p4', name: 'Prime Member 4', password: 'Prime@04' },
  { id: 'p5', name: 'Prime Member 5', password: 'Prime@05' },
];

const defaultJudges = [
  { id: 'j1', name: 'Judge 1', password: 'Judge@01' },
  { id: 'j2', name: 'Judge 2', password: 'Judge@02' },
  { id: 'j3', name: 'Judge 3', password: 'Judge@03' },
];

export function createInitialState() {
  return {
    currentRound: 1,
    warRound: 4,
    teams: defaultTeams.map(t => ({ ...t, scores: emptyScores() })),
    primes: defaultPrimes.map(p => ({ ...p })),
    judges: defaultJudges.map(j => ({ ...j })),
    timer: { endTime: null, running: false, label: '' },
    battles: [],
    activeBattleId: null,
    warVotes: {},
    judgeVotes: {},
  };
}

export const ADMIN_PASSWORD = 'mayhem@admin2026';
