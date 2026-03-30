import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameState, useAuth } from '../hooks/useGameState';
import { api } from '../socket';
import Leaderboard from '../components/Leaderboard';
import TimerDisplay from '../components/Timer';
import { ROUTES } from '../navigation';

export default function JudgeDashboard() {
  const state = useGameState();
  const { judgeAuth, logoutJudge } = useAuth();
  const [teamId, setTeamId] = useState('');
  const [points, setPoints] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!state || !judgeAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[var(--mm-accent)] animate-spin" />
      </div>
    );
  }

  const round = state.currentRound;
  const isWarRound = round === state.warRound;
  const votingOpen = !isWarRound && state.judgeVotingRound === round;

  const submitVote = async () => {
    if (!teamId || !votingOpen) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api('/api/judge/vote', {
        method: 'POST',
        body: JSON.stringify({
          judgeId: judgeAuth.judgeId,
          password: judgeAuth.password,
          teamId,
          round,
          points,
        }),
      });
      const team = state.teams.find(t => t.id === teamId);
      setSuccess(`Scored ${team?.name || teamId} with ${points} points for Round ${round}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mm-kicker">Judge Portal</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight truncate">{judgeAuth.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                Round {state.currentRound}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                {votingOpen ? 'Voting open' : 'Voting closed'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to={ROUTES.landing} className="mm-btn-secondary">
              Back to Landing
            </Link>
            <button onClick={logoutJudge} className="mm-btn-primary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {state.timer.running && (
          <TimerDisplay endTime={state.timer.endTime} running={state.timer.running} label={state.timer.label} large />
        )}

        <section className="mm-card p-6 md:p-8">
          <div>
            <div className="mm-kicker">Judge Voting</div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Submit scores for Round {round}</h2>
            <p className="mt-1 text-sm text-white/60">Scoring opens only when the admin starts voting.</p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Round</label>
              <input value={`Round ${round}`} readOnly className="mm-input opacity-80" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Team</label>
              <select value={teamId} onChange={e => setTeamId(e.target.value)} className="mm-input">
                <option value="">Select…</option>
                {state.teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Points</label>
              <input
                type="number"
                min={0}
                max={100}
                value={points}
                onChange={e => setPoints(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="mm-input font-mono"
              />
            </div>
          </div>

          {isWarRound && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm font-semibold">
              Judges cannot vote during the war round.
            </div>
          )}

          {!isWarRound && !votingOpen && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/70 text-sm font-semibold">
              Voting is closed. Waiting for admin to start voting for Round {round}.
            </div>
          )}

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button onClick={submitVote} disabled={!teamId || loading || !votingOpen} className="mm-btn-primary">
              {loading ? 'Submitting…' : 'Submit Score'}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm font-semibold">
              {success}
            </div>
          )}
        </section>

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
