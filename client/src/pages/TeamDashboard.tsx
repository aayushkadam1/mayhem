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

  const handleVote = useCallback(async (voteFor: string) => {
    if (!teamAuth) return;
    setVoteLoading(true);
    setVoteError('');
    try {
      await api('/api/vote', {
        method: 'POST',
        body: JSON.stringify({ teamId: teamAuth.teamId, password: teamAuth.password, voteFor }),
      });
    } catch (err: unknown) {
      setVoteError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setVoteLoading(false);
    }
  }, [teamAuth]);

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
  const hasVoted = state.warVoterIds.includes(teamAuth.teamId);

  return (
    <div className="min-h-screen pb-12 text-white animate-fade-in">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--mm-bg)]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="mm-kicker">Team Portal</div>
            <h1 className="mt-1 text-xl md:text-2xl font-bold tracking-tight truncate">
              {myTeam?.name || teamAuth.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              {myTeam?.domain && <span className="mm-badge">{myTeam.domain}</span>}
              <span className="mm-badge">Round {state.currentRound}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
            {myTeam && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-center">
                <div className="mm-kicker">Total Score</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
                  {myTeam.totalScore}
                </div>
              </div>
            )}
            <Link to={ROUTES.landing} className="mm-btn-secondary text-xs">Back</Link>
            <button onClick={logoutTeam} className="mm-btn-primary text-xs">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {state.timer.running && (
          <div className="flex justify-center animate-fade-in-up">
            <div className="w-full max-w-md">
              <TimerDisplay endTime={state.timer.endTime} running={state.timer.running} label={state.timer.label} />
            </div>
          </div>
        )}

        {activeBattle && !amBattling && team1 && team2 && (
          <section className="mm-card p-6 md:p-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mm-kicker">Round {state.currentRound}</div>
                <h2 className="mt-2 text-xl font-bold tracking-tight">Brand Wars voting</h2>
                <p className="mt-1 text-sm text-white/40">Vote once for the active battle.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-white/30">Live</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ team: team1, other: team2 }, { team: team2, other: team1 }].map(({ team }) => (
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

            {(state.voteCounts[team1.id] || state.voteCounts[team2.id]) ? (
              <div className="mt-6">
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
                  {(() => {
                    const v1 = state.voteCounts[team1.id] || 0;
                    const v2 = state.voteCounts[team2.id] || 0;
                    const total = v1 + v2;
                    if (total === 0) return null;
                    return (
                      <>
                        <div className="bg-[var(--mm-accent)] transition-all duration-700" style={{ width: `${(v1 / total) * 100}%` }} />
                        <div className="bg-white/15 transition-all duration-700" style={{ width: `${(v2 / total) * 100}%` }} />
                      </>
                    );
                  })()}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/30">
                  <span className="truncate">{team1.name}</span>
                  <span className="truncate">{team2.name}</span>
                </div>
              </div>
            ) : null}

            {voteError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium animate-scale-in">
                {voteError}
              </div>
            )}
            {hasVoted && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-300 text-sm font-medium animate-scale-in">
                Your vote has been recorded for this battle.
              </div>
            )}
          </section>
        )}

        {activeBattle && amBattling && (
          <section className="mm-card p-6 md:p-8 text-center animate-fade-in-up">
            <div className="mm-kicker">Brand Wars</div>
            <p className="mt-2 text-xl md:text-2xl font-bold tracking-tight">You are currently battling</p>
            <p className="mt-2 text-sm text-white/40">Good luck — audience voting is open for everyone else.</p>
          </section>
        )}

        {!activeBattle && !amBattling && !isWarRound && (
          <section className="mm-card p-6 md:p-8 text-center animate-fade-in-up">
            <div className="mm-kicker">Voting</div>
            <p className="mt-2 text-xl md:text-2xl font-bold tracking-tight">War voting is closed</p>
            <p className="mt-2 text-sm text-white/40">Wait for the war round to vote.</p>
          </section>
        )}

        {myTeam && (
          <section className="mm-card p-6 md:p-8 animate-fade-in-up">
            <div>
              <div className="mm-kicker">Your Scores</div>
              <h2 className="mt-2 text-lg font-bold tracking-tight">Round summary</h2>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(r => {
                const key = `round${r}` as keyof typeof myTeam.roundScores;
                const isActive = r <= state.currentRound;

                return (
                  <div
                    key={r}
                    className={`rounded-xl border border-white/[0.06] p-4 text-center transition-opacity ${
                      isActive ? 'bg-white/[0.03]' : 'bg-white/[0.01] opacity-40'
                    }`}
                  >
                    <div className="mm-kicker">Round {r}</div>
                    <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-white">
                      {myTeam.roundScores[key]}
                    </div>
                  </div>
                );
              })}
            </div>
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
