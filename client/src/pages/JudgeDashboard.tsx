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
  
  // Round 1 states
  const [r1Insight, setR1Insight] = useState(0);
  const [r1Tagline, setR1Tagline] = useState(0);
  const [r1Audience, setR1Audience] = useState(0);

  // Round 3 states
  const [r3Creativity, setR3Creativity] = useState(0);
  const [r3Relevance, setR3Relevance] = useState(0);
  const [r3Performance, setR3Performance] = useState(0);
  const [r3Clarity, setR3Clarity] = useState(0);
  const [r3Engagement, setR3Engagement] = useState(0);

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
      let finalPoints = points;
      if (round === 1) {
        finalPoints = r1Insight + r1Tagline + r1Audience;
      } else if (round === 3) {
        finalPoints = r3Creativity + r3Relevance + r3Performance + r3Clarity + r3Engagement;
      }

      await api('/api/judge/vote', {
        method: 'POST',
        body: JSON.stringify({ judgeId: judgeAuth.judgeId, password: judgeAuth.password, teamId, round, points: finalPoints }),
      });
      const team = state.teams.find(t => t.id === teamId);
      setSuccess(`Scored ${team?.name || teamId} with ${finalPoints} ${round === 2 ? 'tokens' : 'points'} for Round ${round}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 text-white animate-fade-in">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--mm-bg)]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mm-kicker">Judge Portal</div>
            <h1 className="mt-1 text-xl md:text-2xl font-bold tracking-tight truncate">{judgeAuth.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="mm-badge">Round {state.currentRound}</span>
              <span className={`mm-badge ${votingOpen ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300' : ''}`}>
                {votingOpen ? 'Voting open' : 'Voting closed'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to={ROUTES.landing} className="mm-btn-secondary text-xs">Back</Link>
            <button onClick={logoutJudge} className="mm-btn-primary text-xs">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {state.timer.running && (
          <div className="max-w-md mx-auto">
            <TimerDisplay endTime={state.timer.endTime} running={state.timer.running} label={state.timer.label} large />
          </div>
        )}

        <section className="mm-card p-6 md:p-8 animate-fade-in-up">
          <div>
            <div className="mm-kicker">Judge Voting</div>
            <h2 className="mt-2 text-lg font-bold tracking-tight">Submit scores for Round {round}</h2>
            <p className="mt-1 text-sm text-white/40">Scoring opens only when the admin starts voting.</p>
          </div>

          <div className="mt-6">
            {round === 2 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mm-label">Round</label>
                    <input value={`Round ${round}`} readOnly className="mm-input opacity-60" />
                  </div>
                  <div>
                    <label className="mm-label">Team</label>
                    <select value={teamId} onChange={e => setTeamId(e.target.value)} className="mm-input">
                      <option value="">Select…</option>
                      {state.teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 max-w-sm">
                  <label className="mm-label">Tokens</label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={points}
                    onChange={e => setPoints(Math.max(0, Number(e.target.value) || 0))}
                    className="mm-input font-mono"
                    placeholder="Enter tokens..."
                  />
                  <p className="mt-2 text-xs text-white/40">Tokens are shown on the leaderboard but not added to the total points.</p>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mm-label">Round</label>
                    <input value={`Round ${round}`} readOnly className="mm-input opacity-60" />
                  </div>
                  <div>
                    <label className="mm-label">Team</label>
                    <select value={teamId} onChange={e => setTeamId(e.target.value)} className="mm-input">
                      <option value="">Select…</option>
                      {state.teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {round === 3 ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mm-label">Creativity (0-5) (Originality of concept)</label>
                        <input type="number" min={0} max={5} value={r3Creativity} onChange={e => setR3Creativity(Math.min(5, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
                      </div>
                      <div>
                        <label className="mm-label">Relevance (0-5) (Alignment with campaign)</label>
                        <input type="number" min={0} max={5} value={r3Relevance} onChange={e => setR3Relevance(Math.min(5, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
                      </div>
                      <div>
                        <label className="mm-label">Performance (0-5) (Acting, confidence, coordination)</label>
                        <input type="number" min={0} max={5} value={r3Performance} onChange={e => setR3Performance(Math.min(5, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
                      </div>
                      <div>
                        <label className="mm-label">Clarity (0-5) (Message communication)</label>
                        <input type="number" min={0} max={5} value={r3Clarity} onChange={e => setR3Clarity(Math.min(5, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
                      </div>
                      <div>
                        <label className="mm-label">Engagement (0-5) (Audience impact)</label>
                        <input type="number" min={0} max={5} value={r3Engagement} onChange={e => setR3Engagement(Math.min(5, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
                      </div>
                    </div>
                    <div className="text-right text-sm font-bold text-white/80">
                      Total Points: {r3Creativity + r3Relevance + r3Performance + r3Clarity + r3Engagement} / 25
                    </div>
                  </div>
                ) : round === 1 ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mm-label">Insight selection (0-5)</label>
                        <input type="number" min={0} max={5} value={r1Insight} onChange={e => setR1Insight(Math.min(5, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
                      </div>
                      <div>
                        <label className="mm-label">Tagline creation (0-5)</label>
                        <input type="number" min={0} max={5} value={r1Tagline} onChange={e => setR1Tagline(Math.min(5, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <label className="mm-label">Audience & insight deduction (0-10)</label>
                        <input type="number" min={0} max={10} value={r1Audience} onChange={e => setR1Audience(Math.min(10, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
                      </div>
                    </div>
                    <div className="text-right text-sm font-bold text-white/80">
                      Total Points: {r1Insight + r1Tagline + r1Audience} / 20
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 max-w-sm">
                    <label className="mm-label">Points</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={points}
                      onChange={e => setPoints(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="mm-input font-mono"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {isWarRound && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-300 text-sm font-medium">
              Judges cannot vote during the war round.
            </div>
          )}

          {!isWarRound && !votingOpen && (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-white/50 text-sm font-medium">
              Voting is closed. Waiting for admin to start voting for Round {round}.
            </div>
          )}

          <div className="mt-5">
            <button onClick={submitVote} disabled={!teamId || loading || !votingOpen} className="mm-btn-primary">
              {loading ? 'Submitting…' : ([1, 3, 5].includes(round) ? 'Lock Final Vote' : (round === 2 ? 'Submit Tokens' : 'Submit Score'))}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium animate-scale-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-300 text-sm font-medium animate-scale-in">
              {success}
            </div>
          )}
        </section>

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
