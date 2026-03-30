import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGameState, useAuth } from '../hooks/useGameState';
import { api } from '../socket';
import Leaderboard from '../components/Leaderboard';
import TimerDisplay from '../components/Timer';
import { ROUTES } from '../navigation';

export default function TeamDashboard() {
  const state = useGameState();
  const { teamAuth, logoutTeam } = useAuth();
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState('');

  const handleVote = useCallback(async (voteFor: string) => {
    if (!teamAuth) return;
    setVoteLoading(true);
    setVoteError('');
    setVoteSuccess('');
    try {
      await api('/api/vote', {
        method: 'POST',
        body: JSON.stringify({
          teamId: teamAuth.teamId,
          password: teamAuth.password,
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
  }, [teamAuth, state]);

  if (!state || !teamAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[var(--mm-accent)] animate-spin" />
      </div>
    );
  }

  const myTeam = state.teams.find(t => t.id === teamAuth.teamId);
  const isWarRound = state.currentRound === state.warRound;
  const activeBattle = isWarRound ? state.battles.find(b => b.id === state.activeBattleId) : null;
  const amBattling = activeBattle && (activeBattle.team1Id === teamAuth.teamId || activeBattle.team2Id === teamAuth.teamId);
  const team1 = activeBattle ? state.teams.find(t => t.id === activeBattle.team1Id) : null;
  const team2 = activeBattle ? state.teams.find(t => t.id === activeBattle.team2Id) : null;

  return (
    <div className="min-h-screen pb-12 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="mm-kicker">Team Portal</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight truncate">
              {myTeam?.name || teamAuth.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {myTeam?.domain ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                  {myTeam.domain}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                Round {state.currentRound}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap md:justify-end">
            {myTeam && (
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
                  Total Score
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">
                  {myTeam.totalScore}
                </div>
              </div>
            )}
            <Link to={ROUTES.landing} className="mm-btn-secondary">
              Back to Landing
            </Link>
            <button onClick={logoutTeam} className="mm-btn-primary">
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

        {activeBattle && !amBattling && team1 && team2 && (
          <section className="mm-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mm-kicker">Round {state.currentRound}</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Brand Wars voting</h2>
                <p className="mt-1 text-sm text-white/60">Vote once for the active battle.</p>
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

            {(state.voteCounts[team1.id] || state.voteCounts[team2.id]) ? (
              <div className="mt-6">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                  {(() => {
                    const v1 = state.voteCounts[team1.id] || 0;
                    const v2 = state.voteCounts[team2.id] || 0;
                    const total = v1 + v2;
                    if (total === 0) return null;
                    return (
                      <>
                        <div className="bg-[var(--mm-accent)] transition-all duration-700" style={{ width: `${(v1 / total) * 100}%` }} />
                        <div className="bg-white/25 transition-all duration-700" style={{ width: `${(v2 / total) * 100}%` }} />
                      </>
                    );
                  })()}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                  <span className="truncate">{team1.name}</span>
                  <span className="truncate">{team2.name}</span>
                </div>
              </div>
            ) : null}

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

        {activeBattle && amBattling && (
          <section className="mm-card p-6 md:p-8 text-center">
            <div className="mm-kicker">Brand Wars</div>
            <p className="mt-2 text-xl md:text-2xl font-semibold tracking-tight">You are currently battling</p>
            <p className="mt-2 text-sm md:text-base text-white/60">Good luck — audience voting is open for everyone else.</p>
          </section>
        )}

        {!activeBattle && !amBattling && !isWarRound && (
          <section className="mm-card p-6 md:p-8 text-center">
            <div className="mm-kicker">Voting</div>
            <p className="mt-2 text-xl md:text-2xl font-semibold tracking-tight">War voting is closed</p>
            <p className="mt-2 text-sm md:text-base text-white/60">Wait for the war round to vote.</p>
          </section>
        )}

        {myTeam && (
          <section className="mm-card p-6 md:p-8">
            <div>
              <div className="mm-kicker">Your Scores</div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Round summary</h2>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(r => {
                const key = `round${r}` as keyof typeof myTeam.roundScores;
                const isActive = r <= state.currentRound;

                return (
                  <div
                    key={r}
                    className={`rounded-2xl border border-white/10 p-4 text-center ${
                      isActive ? 'bg-black/30' : 'bg-black/10 opacity-50'
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
                      Round {r}
                    </div>
                    <div className="mt-2 font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-white">
                      {myTeam.roundScores[key]}
                    </div>
                  </div>
                );
              })}
            </div>
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
