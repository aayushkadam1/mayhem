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
  // Food & Beverages
  makeTeam('fb1', 'Casekings', 'Kx7mP2', 'Food & Beverages'),
  makeTeam('fb2', 'Team diamond', 'Qr9fN3', 'Food & Beverages'),
  makeTeam('fb3', 'Reasoned Judgement', 'Wz5gT8', 'Food & Beverages'),
  makeTeam('fb4', 'Mavericks', 'Hb6jY4', 'Food & Beverages'),
  // Clothing & Apparels
  makeTeam('ca1', 'Men in sales', 'Lp3nV7', 'Clothing & Apparels'),
  makeTeam('ca2', '3 brain cells', 'Sd8kM1', 'Clothing & Apparels'),
  // Media & Entertainment
  makeTeam('me1', 'Paneer Biryani', 'Jn4bQ8', 'Media & Entertainment'),
  makeTeam('me2', 'Impact 3', 'Xg7dH3', 'Media & Entertainment'),
  makeTeam('me3', 'Team esctasy', 'Mw9zS6', 'Media & Entertainment'),
  makeTeam('me4', 'fantastic3', 'Fr1cK4', 'Media & Entertainment'),
];

const defaultPrimes = [
  { id: 'p1', name: 'Prime Member 1', password: 'Prm1#2026' },
  { id: 'p2', name: 'Prime Member 2', password: 'Prm2#2026' },
  { id: 'p3', name: 'Prime Member 3', password: 'Prm3#2026' },
  { id: 'p4', name: 'Prime Member 4', password: 'Prm4#2026' },
  { id: 'p5', name: 'Prime Member 5', password: 'Prm5#2026' },
];

const defaultJudges = [
  { id: 'j1', name: 'Judge 1', password: 'Jdg1$Mayhem' },
  { id: 'j2', name: 'Judge 2', password: 'Jdg2$Mayhem' },
  { id: 'j3', name: 'Judge 3', password: 'Jdg3$Mayhem' },
  { id: 'j4', name: 'Judge 4', password: 'Jdg4$Mayhem' },
  { id: 'j5', name: 'Judge 5', password: 'Jdg5$Mayhem' },
];

export function createInitialState() {
  return {
    currentRound: 1,
    warRound: 4,
    judgeVotingRound: null,
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
