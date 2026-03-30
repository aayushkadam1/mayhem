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

  const handleVote = useCallback(async (voteFor: string) => {
    if (!primeAuth) return;
    setVoteLoading(true);
    setVoteError('');
    try {
      await api('/api/prime/vote', {
        method: 'POST',
        body: JSON.stringify({ primeId: primeAuth.primeId, password: primeAuth.password, voteFor }),
      });
    } catch (err: unknown) {
      setVoteError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setVoteLoading(false);
    }
  }, [primeAuth]);

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
  const hasVoted = state.warVoterIds.includes(primeAuth.primeId);

  return (
    <div className="min-h-screen pb-12 text-white animate-fade-in">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--mm-bg)]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mm-kicker">Prime Portal</div>
            <h1 className="mt-1 text-xl md:text-2xl font-bold tracking-tight truncate">{primeAuth.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="mm-badge border-amber-400/20 bg-amber-400/[0.06] text-amber-300">Prime voting (x5)</span>
              <span className="mm-badge">Round {state.currentRound}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to={ROUTES.landing} className="mm-btn-secondary text-xs">Back</Link>
            <button onClick={logoutPrime} className="mm-btn-primary text-xs">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {state.timer.running && (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <TimerDisplay endTime={state.timer.endTime} running={state.timer.running} label={state.timer.label} />
            </div>
          </div>
        )}

        {isWarRound && activeBattle && team1 && team2 && (
          <section className="mm-card p-6 md:p-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mm-kicker">Round {state.currentRound}</div>
                <h2 className="mt-2 text-xl font-bold tracking-tight">Prime vote (x5)</h2>
                <p className="mt-1 text-sm text-white/40">Your vote counts as five.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-white/30">Live</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[team1, team2].map(team => (
                <button
                  key={team.id}
                  onClick={() => handleVote(team.id)}
                  disabled={voteLoading || hasVoted}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-left transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-white">{team.name}</div>
                      <div className="mt-1 truncate text-sm text-white/35">{team.domain}</div>
                    </div>
                    <div className="shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-right">
                      <div className="mm-kicker">Votes</div>
                      <div className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
                        {state.voteCounts[team.id] || 0}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 mm-badge group-hover:border-[var(--mm-accent)]/20 group-hover:text-[var(--mm-accent)] transition-colors">
                    {hasVoted ? 'Vote cast' : `Vote for ${team.name}`}
                  </div>
                </button>
              ))}
            </div>

            {voteError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium animate-scale-in">
                {voteError}
              </div>
            )}
            {hasVoted && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-300 text-sm font-medium animate-scale-in">
                Your vote (x5) has been recorded for this battle.
              </div>
            )}
          </section>
        )}

        {!isWarRound && (
          <section className="mm-card p-6 md:p-8 text-center animate-fade-in-up">
            <div className="mm-kicker">Voting</div>
            <p className="mt-2 text-xl md:text-2xl font-bold tracking-tight">Prime voting is closed</p>
            <p className="mt-2 text-sm text-white/40">Wait for the war round to cast your vote.</p>
          </section>
        )}

        <section className="mm-card p-0 overflow-hidden animate-fade-in-up">
          <div className="mm-section-header">
            <div className="mm-kicker">Live</div>
            <h2 className="mt-2 text-lg font-bold tracking-tight">Leaderboard</h2>
          </div>
          <div className="p-2 md:p-4">
            <Leaderboard teams={state.teams} currentRound={state.currentRound} compact />
          </div>
        </section>
      </main>
    </div>
  );
}
