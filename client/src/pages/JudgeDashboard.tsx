import { useMemo, useState } from 'react';
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
  const [round, setRound] = useState(1);
  const [points, setPoints] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const rounds = useMemo(() => [1, 2, 3, 5], []);

  if (!state || !judgeAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isWarRound = state.currentRound === state.warRound;
  const selectableRounds = rounds.filter(r => r !== state.warRound);

  const submitVote = async () => {
    if (!teamId) return;
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
      setSuccess(`Scored ${team?.name || teamId} with ${points} points.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper-bg)] text-[var(--text-main)]">
      <header className="border-b bg-white border-b-4 border-red-600 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg flex items-center justify-center text-sm">⚖️</div>
            <div>
              <h1 className="font-black text-lg tracking-tight">JUDGE PANEL</h1>
              <p className="text-[10px] tracking-[0.2em] uppercase text-red-400/60">Marketing Mayhem</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Round {state.currentRound}</span>
            <Link
              to={ROUTES.landing}
              className="text-xs text-gray-400 hover:text-[var(--text-main)]/60 px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              Landing
            </Link>
            <button onClick={logoutJudge} className="text-xs text-gray-400 hover:text-[var(--text-main)]/60 px-3 py-1.5 border border-gray-200 rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {state.timer.running && (
          <TimerDisplay
            endTime={state.timer.endTime}
            running={state.timer.running}
            label={state.timer.label}
            large
          />
        )}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500">Judge Voting</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] uppercase text-gray-600 mb-1">Round</label>
              <select
                value={round}
                onChange={e => setRound(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-orange-500/50"
              >
                {selectableRounds.map(r => (
                  <option key={r} value={r} className="bg-white">Round {r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] uppercase text-gray-600 mb-1">Team</label>
              <select
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-orange-500/50"
              >
                <option value="" className="bg-white">Select...</option>
                {state.teams.map(t => (
                  <option key={t.id} value={t.id} className="bg-white">{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] uppercase text-gray-600 mb-1">Points</label>
              <input
                type="number"
                min={0}
                max={100}
                value={points}
                onChange={e => setPoints(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-[var(--text-main)] font-mono text-sm focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          {isWarRound && (
            <div className="text-xs text-red-500 font-bold">Judges cannot vote during the war round.</div>
          )}

          <button
            onClick={submitVote}
            disabled={!teamId || loading || round === state.warRound}
            className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-500/30 transition-colors disabled:opacity-40"
          >
            {loading ? 'Submitting...' : 'Submit Score'}
          </button>

          {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
          {success && <p className="text-emerald-600 text-sm font-bold">{success}</p>}
        </div>

        <div className="rounded-xl border border-orange-500/10 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-orange-500/10">
            <h2 className="font-black text-sm tracking-[0.2em] uppercase text-gray-800">Leaderboard</h2>
          </div>
          <Leaderboard teams={state.teams} currentRound={state.currentRound} compact />
        </div>
      </div>
    </div>
  );
}
