export function calcRound1Total(s) {
  return s.insightAccuracy + s.taglineCreativity + s.audienceInsight;
}

export function calcRound2Total(s) {
  return Math.floor(s.remainingTokens / 20);
}

export function calcRound3Total(s) {
  return s.creativity + s.relevance + s.performance + s.clarity + s.engagement;
}

export function calcRound4Total(s) {
  return s.strategy + s.creativity + s.impact + s.audienceVotes;
}

export function calcRound5Total(s) {
  return s.insight + s.strategy + s.creativity + s.feasibility + s.delivery;
}

export function calcTotalScore(s) {
  return (
    calcRound1Total(s.round1) +
    calcRound2Total(s.round2) +
    calcRound3Total(s.round3) +
    calcRound4Total(s.round4) +
    calcRound5Total(s.round5)
  );
}

export function calcRoundTotal(s, round) {
  switch (round) {
    case 1: return calcRound1Total(s.round1);
    case 2: return calcRound2Total(s.round2);
    case 3: return calcRound3Total(s.round3);
    case 4: return calcRound4Total(s.round4);
    case 5: return calcRound5Total(s.round5);
    default: return 0;
  }
}
