import type { PublicTeam } from '../types';
import { ROUND_NAMES } from '../types';

interface LeaderboardProps {
  teams: PublicTeam[];
  currentRound: number;
  compact?: boolean;
}

export default function Leaderboard({ teams, currentRound, compact }: LeaderboardProps) {
  const sorted = [...teams].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    return b.totalScore - a.totalScore;
  });

  const roundsToShow = compact
    ? []
    : Array.from({ length: Math.min(currentRound, 5) }, (_, i) => i + 1);

  const maxScore = Math.max(...sorted.filter(t => !t.eliminated).map(t => t.totalScore), 1);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-xs sm:text-sm">
          <thead>
            <tr>
              <th className="px-3 sm:px-4 py-3 text-left mm-kicker">Rank</th>
              <th className="px-3 sm:px-4 py-3 text-left mm-kicker">Team</th>
              {!compact && (
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left mm-kicker">Domain</th>
              )}
              {!compact &&
                roundsToShow.map(r => (
                  <th key={r} className="hidden lg:table-cell px-2 py-3 text-center mm-kicker">R{r}</th>
                ))}
              <th className="px-3 sm:px-4 py-3 text-right mm-kicker">Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => {
              const isTop = !team.eliminated && idx === 0;
              const isSecond = !team.eliminated && idx === 1;
              const isThird = !team.eliminated && idx === 2;
              const rank = team.eliminated ? '—' : `#${idx + 1}`;
              const scorePercent = team.eliminated ? 0 : (team.totalScore / maxScore) * 100;

              return (
                <tr
                  key={team.id}
                  className={`border-b border-white/[0.04] transition-colors ${
                    team.eliminated ? 'opacity-40' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <td className="px-3 sm:px-4 py-3">
                    <span
                      className={`inline-flex min-w-[3rem] items-center justify-center rounded-lg border px-2 py-1 font-mono text-xs tabular-nums font-bold ${
                        team.eliminated
                          ? 'border-white/[0.06] bg-white/[0.02] text-white/30'
                          : isTop
                            ? 'border-[var(--mm-accent)]/30 bg-[var(--mm-accent)]/10 text-[var(--mm-accent)]'
                            : isSecond
                              ? 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300'
                              : isThird
                                ? 'border-orange-400/20 bg-orange-400/[0.06] text-orange-300'
                                : 'border-white/[0.06] bg-white/[0.02] text-white/50'
                      }`}
                    >
                      {rank}
                    </span>
                  </td>

                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          team.eliminated
                            ? 'bg-white/10'
                            : isTop
                              ? 'bg-[var(--mm-accent)]'
                              : isSecond
                                ? 'bg-amber-400'
                                : isThird
                                  ? 'bg-orange-400'
                                  : 'bg-white/25'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className={`truncate font-semibold ${team.eliminated ? 'line-through text-white/30' : 'text-white'}`}>
                          {team.name}
                        </div>
                        {team.eliminated && (
                          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/60">
                            Eliminated
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {!compact && (
                    <td className="hidden md:table-cell px-3 sm:px-4 py-3">
                      <span className="mm-badge">{team.domain}</span>
                    </td>
                  )}

                  {!compact &&
                    roundsToShow.map(r => {
                      const key = `round${r}` as keyof typeof team.roundScores;
                      return (
                        <td key={r} className="hidden lg:table-cell px-2 py-3 text-center">
                          <span className="font-mono text-sm tabular-nums text-white/50">
                            {team.roundScores[key]}
                          </span>
                        </td>
                      );
                    })}

                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {!compact && !team.eliminated && (
                        <div className="hidden sm:block w-20 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isTop ? 'bg-[var(--mm-accent)]/60' : 'bg-white/20'
                            }`}
                            style={{ width: `${scorePercent}%` }}
                          />
                        </div>
                      )}
                      <span
                        className={`font-mono text-base font-bold tabular-nums ${
                          team.eliminated ? 'text-white/30' : isTop ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        {team.totalScore}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--mm-accent)]" />
            <span className="font-semibold text-white/60">Round {currentRound}</span>
            <span className="text-white/30">— {ROUND_NAMES[currentRound]}</span>
          </div>
          <div>{teams.filter(t => !t.eliminated).length} active teams</div>
        </div>
      )}
    </div>
  );
}
