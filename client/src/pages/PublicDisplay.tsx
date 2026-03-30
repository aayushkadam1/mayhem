import { useGameState, useTimerEnded } from '../hooks/useGameState';
import Leaderboard from '../components/Leaderboard';
import TimerDisplay from '../components/Timer';
import { ROUND_NAMES } from '../types';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../navigation';

export default function PublicDisplay() {
  const state = useGameState();
  const [flash, setFlash] = useState(false);

  useTimerEnded(useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 3000);
  }, []));

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="mm-card p-8 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[var(--mm-accent)] animate-spin" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[var(--mm-accent)]" />
              <div className="text-[var(--mm-accent)] font-black text-xl tracking-wider">MAYHEM</div>
            </div>
            <p className="mt-2 text-sm text-white/40">Connecting…</p>
          </div>
        </div>
      </div>
    );
  }

  const isWarRound = state.currentRound === state.warRound;
  const activeBattle = isWarRound ? state.battles.find(b => b.id === state.activeBattleId) : null;
  const team1 = activeBattle ? state.teams.find(t => t.id === activeBattle.team1Id) : null;
  const team2 = activeBattle ? state.teams.find(t => t.id === activeBattle.team2Id) : null;
  const votingLive = Boolean(activeBattle && team1 && team2);

  return (
    <div className={`min-h-screen text-white transition-colors duration-500 ${flash ? 'bg-red-500/[0.08]' : ''}`}>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--mm-bg)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="h-7 w-1 rounded-full bg-[var(--mm-accent)]" />
              <div className="text-[var(--mm-accent)] font-black text-xl tracking-wider">MAYHEM</div>
            </div>
            <div className="mt-1 mm-kicker">Public Display</div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
            <span className="mm-badge">
              Round {state.currentRound} — {ROUND_NAMES[state.currentRound]}
            </span>
            <Link to={ROUTES.landing} className="mm-btn-secondary text-xs">Back</Link>
          </div>
        </div>
      </header>

      <main
        className={`max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 gap-6 md:gap-8 ${
          votingLive ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-3'
        }`}
      >
        <section className={`${votingLive ? 'flex flex-col gap-6 md:gap-8' : 'lg:col-span-1 flex flex-col gap-6 md:gap-8'}`}>
          {state.timer.running && (
            <div className="animate-fade-in-up">
              <TimerDisplay endTime={state.timer.endTime} running={state.timer.running} label={state.timer.label} large />
            </div>
          )}

          {activeBattle && team1 && team2 && (
            <div className="mm-card p-6 md:p-8 animate-fade-in-up">
              <div>
                <div className="mm-kicker">Round {state.currentRound}</div>
                <h2 className="mt-2 text-xl font-bold tracking-tight">Brand Wars</h2>
                <p className="mt-1 text-sm text-white/40">Live audience + prime voting totals.</p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-4">
                <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                  <div className="flex items-center justify-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-[var(--mm-accent)]" />
                    <div className="truncate text-base font-bold text-white">{team1.name}</div>
                  </div>
                  <div className="mt-1 mm-kicker truncate">{team1.domain}</div>
                  <div className="mt-4 font-mono text-4xl sm:text-5xl md:text-6xl font-black tabular-nums text-white">
                    {state.voteCounts[team1.id] || 0}
                  </div>
                  <div className="mt-1 mm-kicker">Votes</div>
                </div>

                <div className="flex items-center justify-center text-xl sm:text-2xl font-mono font-bold text-white/20">VS</div>

                <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                  <div className="flex items-center justify-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-white/30" />
                    <div className="truncate text-base font-bold text-white">{team2.name}</div>
                  </div>
                  <div className="mt-1 mm-kicker truncate">{team2.domain}</div>
                  <div className="mt-4 font-mono text-4xl sm:text-5xl md:text-6xl font-black tabular-nums text-white">
                    {state.voteCounts[team2.id] || 0}
                  </div>
                  <div className="mt-1 mm-kicker">Votes</div>
                </div>
              </div>

              <div className="mt-6 h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
                {(() => {
                  const v1 = state.voteCounts[team1.id] || 0;
                  const v2 = state.voteCounts[team2.id] || 0;
                  const total = v1 + v2;
                  if (total === 0) return <div className="w-full bg-white/[0.06]" />;
                  return (
                    <>
                      <div className="bg-[var(--mm-accent)] transition-all duration-700" style={{ width: `${(v1 / total) * 100}%` }} />
                      <div className="bg-white/15 transition-all duration-700" style={{ width: `${(v2 / total) * 100}%` }} />
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 flex justify-center opacity-60">
            <div className="mm-badge backdrop-blur-md">
              Powered by <span className="text-white/70 font-semibold ml-1">BloomBox</span>
            </div>
          </div>
        </section>

        <section className={votingLive ? '' : 'lg:col-span-2'}>
          <div className="mm-card p-0 overflow-hidden animate-fade-in-up">
            <div className="mm-section-header flex items-center justify-between gap-4">
              <div>
                <div className="mm-kicker">Live</div>
                <h2 className="mt-2 text-lg md:text-xl font-bold tracking-tight">Leaderboard</h2>
              </div>
              <div className="mm-badge">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                Live updates
              </div>
            </div>
            <div className="p-2 md:p-4">
              <Leaderboard teams={state.teams} currentRound={state.currentRound} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
