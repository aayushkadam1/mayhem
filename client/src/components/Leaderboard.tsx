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

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-xs sm:text-sm">
          <thead>
            <tr className="bg-black/40">
              <th className="px-3 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Rank</th>
              <th className="px-3 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Team</th>
              {!compact && (
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                  Domain
                </th>
              )}
              {!compact &&
                roundsToShow.map(r => (
                  <th
                    key={r}
                    className="hidden lg:table-cell px-2 py-3 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/40"
                  >
                    R{r}
                  </th>
                ))}
              <th className="px-3 sm:px-4 py-3 text-right text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => {
              const isTop = !team.eliminated && idx === 0;
              const rank = team.eliminated ? '—' : `#${idx + 1}`;

              return (
                <tr
                  key={team.id}
                  className={`border-b border-white/10 ${team.eliminated ? 'opacity-50' : 'hover:bg-white/5'}`}
                >
                  <td className="px-3 sm:px-4 py-3">
                    <span
                      className={
                        `inline-flex min-w-[3.5rem] items-center justify-center rounded-lg border px-2 py-1 font-mono text-xs tabular-nums ${
                          team.eliminated
                            ? 'border-white/10 bg-black/30 text-white/50'
                            : isTop
                              ? 'border-[var(--mm-accent)]/40 bg-[var(--mm-accent)]/15 text-white'
                              : 'border-white/10 bg-black/30 text-white/70'
                        }`
                      }
                    >
                      {rank}
                    </span>
                  </td>

                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={
                          `h-2 w-2 rounded-full ${
                            team.eliminated
                              ? 'bg-white/20'
                              : isTop
                                ? 'bg-[var(--mm-accent)]'
                                : 'bg-white/40'
                          }`
                        }
                      />
                      <div className="min-w-0">
                        <div className={`truncate font-semibold ${team.eliminated ? 'line-through text-white/40' : 'text-white'}`}>
                          {team.name}
                        </div>
                        {team.eliminated && (
                          <div className="mt-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-red-300/80">
                            Eliminated
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {!compact && (
                    <td className="hidden md:table-cell px-3 sm:px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                        {team.domain}
                      </span>
                    </td>
                  )}

                  {!compact &&
                    roundsToShow.map(r => {
                      const key = `round${r}` as keyof typeof team.roundScores;
                      return (
                        <td key={r} className="hidden lg:table-cell px-2 py-3 text-center">
                          <span className="font-mono text-sm tabular-nums text-white/70">
                            {team.roundScores[key]}
                          </span>
                        </td>
                      );
                    })}

                  <td className="px-3 sm:px-4 py-3 text-right">
                    <span
                      className={
                        `font-mono text-base font-semibold tabular-nums ${
                          team.eliminated ? 'text-white/50' : isTop ? 'text-white' : 'text-white/80'
                        }`
                      }
                    >
                      {team.totalScore}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--mm-accent)]" />
            <span className="font-semibold text-white/80">Round {currentRound}</span>
            <span className="text-white/50">— {ROUND_NAMES[currentRound]}</span>
          </div>
          <div>{teams.filter(t => !t.eliminated).length} active teams</div>
        </div>
      )}
    </div>
  );
}
