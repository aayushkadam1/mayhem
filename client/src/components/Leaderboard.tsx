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

  return (
    <div className="w-full font-sans">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-[3px] border-black">
              <th className="py-4 px-4 text-left font-black tracking-widest uppercase text-black">Rank</th>
              <th className="py-4 px-4 text-left font-black tracking-widest uppercase text-black">Agency</th>
              {!compact && (
                <th className="py-4 px-4 text-left font-black tracking-widest uppercase text-black">Domain</th>
              )}
              {!compact && Array.from({ length: Math.min(currentRound, 5) }, (_, i) => i + 1).map(r => (
                <th key={r} className="py-4 px-2 text-center font-bold tracking-widest uppercase text-gray-500 text-sm">
                  R{r}
                </th>
              ))}
              <th className="py-4 px-4 text-right font-black tracking-widest uppercase text-black">Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => (
              <tr
                key={team.id}
                className={`
                  border-b border-gray-200 transition-all duration-300
                  ${team.eliminated
                    ? 'opacity-50 bg-gray-50 grayscale'
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <td className="py-4 px-4">
                  <span className={`
                    font-hand text-3xl font-bold
                    ${!team.eliminated && idx === 0 ? 'text-[#FFD700]' : !team.eliminated && idx === 1 ? 'text-[#C0C0C0]' : !team.eliminated && idx === 2 ? 'text-[#CD7F32]' : 'text-gray-400'}
                  `}>
                    {team.eliminated ? '—' : `#${idx + 1}`}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${team.eliminated ? 'line-through text-gray-400' : 'text-[var(--blue-primary)]'} ${!team.eliminated && idx < 3 ? 'marker-highlight' : ''}`}>
                      {team.name}
                    </span>
                    {team.eliminated && (
                      <span className="font-hand text-xl text-red-600 border-2 border-red-600 px-2 py-0.5 transform -rotate-6 shadow-sm inline-block ml-2">
                        ELIMINATED
                      </span>
                    )}
                  </div>
                </td>
                {!compact && (
                  <td className="py-4 px-4">
                    <span className={`text-xs font-bold px-3 py-1 border-[1.5px] border-black shadow-[2px_2px_0_#000] rotate-1 inline-block bg-white ${
                      team.domain === 'Food & Beverages'
                        ? 'text-[var(--orange-primary)]'
                        : team.domain === 'Clothing & Apparels'
                          ? 'text-[#E1306C]'
                          : 'text-[var(--blue-primary)]'
                    }`}>
                      {team.domain === 'Food & Beverages' ? '🍔 F&B' : team.domain === 'Clothing & Apparels' ? '👕 C&A' : '🎬 M&E'}
                    </span>
                  </td>
                )}
                {!compact && Array.from({ length: Math.min(currentRound, 5) }, (_, i) => i + 1).map(r => {
                  const key = `round${r}` as keyof typeof team.roundScores;
                  return (
                    <td key={r} className="py-4 px-2 text-center">
                      <span className="font-hand text-2xl text-gray-600 font-bold">
                        {team.roundScores[key]}
                      </span>
                    </td>
                  );
                })}
                <td className="py-4 px-4 text-right">
                  <span className={`
                    font-hand text-3xl font-black
                    ${!team.eliminated && idx === 0 ? 'text-[var(--orange-primary)] marker-highlight-blue' : 'text-gray-800'}
                  `}>
                    {team.totalScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && (
        <div className="mt-6 px-4 py-3 bg-[var(--blue-light)] border border-[var(--blue-primary)] flex items-center justify-between font-bold text-sm text-[var(--blue-primary)] -rotate-1 shadow-sm mx-2">
          <span>Current Round: {currentRound} — {ROUND_NAMES[currentRound]}</span>
          <span>{teams.filter(t => !t.eliminated).length} Agents Active</span>
        </div>
      )}
    </div>
  );
}
