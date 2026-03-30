import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameState, useAuth } from '../hooks/useGameState';
import { api } from '../socket';
import Leaderboard from '../components/Leaderboard';
import TimerDisplay from '../components/Timer';
import { ROUTES } from '../navigation';

export default function PrimeDashboard() {
  const state = useGameState();
  const { primeAuth, logoutPrime } = useAuth();
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState('');

  const handleVote = useCallback(async (voteFor: string) => {
    if (!primeAuth) return;
    setVoteLoading(true);
    setVoteError('');
    setVoteSuccess('');
    try {
      await api('/api/prime/vote', {
        method: 'POST',
        body: JSON.stringify({
          primeId: primeAuth.primeId,
          password: primeAuth.password,
          voteFor,
        }),
      });
      const team = state?.teams.find(t => t.id === voteFor);
      setVoteSuccess(`Vote cast for ${team?.name || voteFor}!`);
    } catch (err: unknown) {
      setVoteError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setVoteLoading(false);
    }
  }, [primeAuth, state]);

  if (!state || !primeAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[var(--mm-accent)] animate-spin" />
      </div>
    );
  }

  const activeBattle = state.battles.find(b => b.id === state.activeBattleId);
  const isWarRound = state.currentRound === state.warRound;
  const team1 = activeBattle ? state.teams.find(t => t.id === activeBattle.team1Id) : null;
  const team2 = activeBattle ? state.teams.find(t => t.id === activeBattle.team2Id) : null;

  return (
    <div className="min-h-screen pb-12 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mm-kicker">Prime Portal</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight truncate">{primeAuth.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                Prime voting (x5)
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                Round {state.currentRound}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to={ROUTES.landing} className="mm-btn-secondary">
              Back to Landing
            </Link>
            <button onClick={logoutPrime} className="mm-btn-primary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {state.timer.running && (
          <div className="flex justify-center">
            <TimerDisplay endTime={state.timer.endTime} running={state.timer.running} label={state.timer.label} />
          </div>
        )}

        {isWarRound && activeBattle && team1 && team2 && (
          <section className="mm-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mm-kicker">Round {state.currentRound}</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Prime vote (x5)</h2>
                <p className="mt-1 text-sm text-white/60">Your vote counts as five.</p>
              </div>
              <div className="text-xs text-white/45">Live totals update instantly.</div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleVote(team1.id)}
                disabled={voteLoading || !!voteSuccess}
                className="group rounded-2xl border border-white/10 bg-black/30 p-5 text-left transition-colors hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-white">{team1.name}</div>
                    <div className="mt-1 truncate text-sm text-white/55">{team1.domain}</div>
                  </div>
                  <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">Votes</div>
                    <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">
                      {state.voteCounts[team1.id] || 0}
                    </div>
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                  Vote for {team1.name}
                </div>
              </button>

              <button
                onClick={() => handleVote(team2.id)}
                disabled={voteLoading || !!voteSuccess}
                className="group rounded-2xl border border-white/10 bg-black/30 p-5 text-left transition-colors hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-white">{team2.name}</div>
                    <div className="mt-1 truncate text-sm text-white/55">{team2.domain}</div>
                  </div>
                  <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">Votes</div>
                    <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">
                      {state.voteCounts[team2.id] || 0}
                    </div>
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                  Vote for {team2.name}
                </div>
              </button>
            </div>

            {voteError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm font-semibold">
                {voteError}
              </div>
            )}
            {voteSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm font-semibold">
                {voteSuccess}
              </div>
            )}
          </section>
        )}

        {!isWarRound && (
          <section className="mm-card p-6 md:p-8 text-center">
            <div className="mm-kicker">Voting</div>
            <p className="mt-2 text-xl md:text-2xl font-semibold tracking-tight">Prime voting is closed</p>
            <p className="mt-2 text-sm md:text-base text-white/60">Wait for the war round to cast your vote.</p>
          </section>
        )}

        <section className="mm-card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-black/20">
            <div className="mm-kicker">Live</div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">Leaderboard</h2>
          </div>
          <div className="p-2 md:p-4">
            <Leaderboard teams={state.teams} currentRound={state.currentRound} compact />
          </div>
        </section>
      </main>
    </div>
  );
}
