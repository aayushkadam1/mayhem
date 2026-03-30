export interface Round1Scores {
  insightAccuracy: number;
  taglineCreativity: number;
  audienceInsight: number;
  bonusTokens: number;
  judgeVotes: number;
}

export interface Round2Scores {
  remainingTokens: number;
  judgeVotes: number;
}

export interface Round3Scores {
  creativity: number;
  relevance: number;
  performance: number;
  clarity: number;
  engagement: number;
  judgeVotes: number;
}

export interface Round4Scores {
  strategy: number;
  creativity: number;
  impact: number;
  audienceVotes: number;
}

export interface Round5Scores {
  insight: number;
  strategy: number;
  creativity: number;
  feasibility: number;
  delivery: number;
  judgeVotes: number;
}

export interface TeamScores {
  round1: Round1Scores;
  round2: Round2Scores;
  round3: Round3Scores;
  round4: Round4Scores;
  round5: Round5Scores;
}

export interface PublicTeam {
  id: string;
  name: string;
  domain: string;
  eliminated: boolean;
  scores: TeamScores;
  totalScore: number;
  roundScores: {
    round1: number;
    round2: number;
    round3: number;
    round4: number;
    round5: number;
  };
}

export interface AdminTeam extends PublicTeam {
  password: string;
}

export interface PrimeMember {
  id: string;
  name: string;
}

export interface JudgeMember {
  id: string;
  name: string;
}

export interface Battle {
  id: string;
  team1Id: string;
  team2Id: string;
  status: 'pending' | 'active' | 'completed';
}

export interface TimerState {
  endTime: number | null;
  running: boolean;
  label: string;
}

export interface PublicState {
  currentRound: number;
  warRound: number;
  teams: PublicTeam[];
  timer: TimerState;
  battles: Battle[];
  activeBattleId: string | null;
  voteCounts: Record<string, number>;
}

export const ROUND_NAMES: Record<number, string> = {
  1: 'Marketing Relay',
  2: 'Digital Marketing Strategy',
  3: 'Ad Improv',
  4: 'Brand Wars',
  5: 'Pitch Perfect',
};
