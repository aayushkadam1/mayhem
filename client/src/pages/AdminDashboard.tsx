import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameState, useAuth } from '../hooks/useGameState';
import { adminApi } from '../socket';
import Leaderboard from '../components/Leaderboard';
import TimerDisplay from '../components/Timer';
import { ROUND_NAMES } from '../types';
import type { PublicTeam } from '../types';
import { ROUTES } from '../navigation';

type Tab = 'overview' | 'scoring' | 'timer' | 'battles';

export default function AdminDashboard() {
  const state = useGameState();
  const { adminToken, logoutAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  if (!state || !adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[var(--mm-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="mm-kicker">Admin Panel</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight truncate">Control Room</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                Round {state.currentRound} — {ROUND_NAMES[state.currentRound]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to={ROUTES.landing} className="mm-btn-secondary">
              Back to Landing
            </Link>
            <button onClick={logoutAdmin} className="mm-btn-primary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {(['overview', 'scoring', 'timer', 'battles'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition-colors ${
                tab === t
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {t === 'overview' ? 'Overview' : t === 'scoring' ? 'Scoring' : t === 'timer' ? 'Timer' : 'Battles'}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'overview' && <OverviewTab state={state} adminToken={adminToken} />}
        {tab === 'scoring' && <ScoringTab state={state} adminToken={adminToken} />}
        {tab === 'timer' && <TimerTab state={state} adminToken={adminToken} />}
        {tab === 'battles' && <BattlesTab state={state} adminToken={adminToken} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ state, adminToken }: { state: NonNullable<ReturnType<typeof useGameState>>; adminToken: string }) {
  const [round, setRound] = useState(state.currentRound);
  const [newTeam, setNewTeam] = useState({ id: '', name: '', password: '', domain: '' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [judgeVotingError, setJudgeVotingError] = useState('');
  const [judgeVotingLoading, setJudgeVotingLoading] = useState(false);

  const isWarRound = state.currentRound === state.warRound;
  const isJudgeVotingOpen = !isWarRound && state.judgeVotingRound === state.currentRound;

  const changeRound = async () => {
    await adminApi('/api/admin/round', adminToken, {
      method: 'PUT',
      body: JSON.stringify({ round }),
    });
  };

  const openJudgeVoting = async () => {
    setJudgeVotingError('');
    setJudgeVotingLoading(true);
    try {
      await adminApi('/api/admin/judgeVoting/open', adminToken, { method: 'POST' });
    } catch (err: unknown) {
      setJudgeVotingError(err instanceof Error ? err.message : 'Failed to open judge voting');
    } finally {
      setJudgeVotingLoading(false);
    }
  };

  const closeJudgeVoting = async () => {
    setJudgeVotingError('');
    setJudgeVotingLoading(true);
    try {
      await adminApi('/api/admin/judgeVoting/close', adminToken, { method: 'POST' });
    } catch (err: unknown) {
      setJudgeVotingError(err instanceof Error ? err.message : 'Failed to close judge voting');
    } finally {
      setJudgeVotingLoading(false);
    }
  };

  const addTeam = async () => {
    setAddError('');
    setAdding(true);
    try {
      await adminApi('/api/admin/teams', adminToken, {
        method: 'POST',
        body: JSON.stringify(newTeam),
      });
      setNewTeam({ id: '', name: '', password: '', domain: '' });
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add team');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Round Control */}
      <div className="mm-card p-6 md:p-8">
        <div className="mm-kicker">Round Control</div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Current round</h2>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={round}
            onChange={e => setRound(Number(e.target.value))}
            className="mm-input sm:max-w-md"
          >
            {[1, 2, 3, 4, 5].map(r => (
              <option key={r} value={r}>
                Round {r} — {ROUND_NAMES[r]}
              </option>
            ))}
          </select>
          <button
            onClick={changeRound}
            className="mm-btn-primary"
          >
            Set Round
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="text-sm text-white/60">
            Judge voting:
            <span
              className={`ml-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${
                isWarRound
                  ? 'border-white/10 bg-white/5 text-white/50'
                  : isJudgeVotingOpen
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-white/50'
              }`}
            >
              {isWarRound ? 'Disabled (war round)' : isJudgeVotingOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          {!isWarRound && (
            isJudgeVotingOpen ? (
              <button
                onClick={closeJudgeVoting}
                disabled={judgeVotingLoading}
                className="mm-btn-secondary"
              >
                {judgeVotingLoading ? 'Closing…' : 'Close Voting'}
              </button>
            ) : (
              <button
                onClick={openJudgeVoting}
                disabled={judgeVotingLoading}
                className="mm-btn-primary"
              >
                {judgeVotingLoading ? 'Starting…' : 'Start Voting'}
              </button>
            )
          )}
        </div>

        {judgeVotingError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm font-semibold">
            {judgeVotingError}
          </div>
        )}
      </div>

      {/* Team List with passwords */}
      <div className="mm-card p-6 md:p-8">
        <div className="mm-kicker">Teams</div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Teams & passcodes</h2>
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={newTeam.id}
            onChange={e => setNewTeam(t => ({ ...t, id: e.target.value }))}
            placeholder="Team ID"
            className="mm-input px-3 py-2"
          />
          <input
            value={newTeam.name}
            onChange={e => setNewTeam(t => ({ ...t, name: e.target.value }))}
            placeholder="Team name"
            className="mm-input px-3 py-2"
          />
          <input
            value={newTeam.password}
            onChange={e => setNewTeam(t => ({ ...t, password: e.target.value }))}
            placeholder="Password"
            className="mm-input px-3 py-2"
          />
          <input
            value={newTeam.domain}
            onChange={e => setNewTeam(t => ({ ...t, domain: e.target.value }))}
            placeholder="Domain"
            className="mm-input px-3 py-2"
          />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={addTeam}
            disabled={adding || !newTeam.id || !newTeam.name || !newTeam.password}
            className="mm-btn-primary"
          >
            {adding ? 'Adding…' : 'Add Team'}
          </button>
          {addError && (
            <span className="text-sm font-semibold text-red-200">{addError}</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.teams.map(team => (
            <TeamCard key={team.id} team={team} adminToken={adminToken} />
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mm-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <div className="mm-kicker">Live</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Leaderboard</h2>
        </div>
        <div className="p-2 md:p-4">
          <Leaderboard teams={state.teams} currentRound={state.currentRound} />
        </div>
      </div>
    </div>
  );
}

function TeamCard({ team, adminToken }: { team: PublicTeam; adminToken: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);

  const saveName = async () => {
    await adminApi(`/api/admin/team/${team.id}/name`, adminToken, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    setEditing(false);
  };

  const toggleEliminate = async () => {
    await adminApi(`/api/admin/team/${team.id}/eliminate`, adminToken, {
      method: 'PUT',
      body: JSON.stringify({ eliminated: !team.eliminated }),
    });
  };

  const removeTeam = async () => {
    const confirmed = window.confirm(`Remove ${team.name}? This cannot be undone.`);
    if (!confirmed) return;
    await adminApi(`/api/admin/team/${team.id}`, adminToken, {
      method: 'DELETE',
    });
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${
        team.eliminated ? 'border-red-500/30 bg-red-500/5 opacity-60' : 'border-white/10 bg-black/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="mm-input px-3 py-2 text-sm"
            />
            <button onClick={saveName} className="mm-btn-primary px-3 py-2 text-xs">
              Save
            </button>
          </div>
        ) : (
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${team.eliminated ? 'text-white/50 line-through' : 'text-white'}`}>
              {team.name}
            </p>
            <p className="mt-0.5 text-[10px] font-mono text-white/40">{team.id}</p>
          </div>
        )}

        <button onClick={() => setEditing(!editing)} className="mm-btn-secondary px-3 py-2 text-xs">
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
          {team.domain}
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums text-white/80">{team.totalScore} pts</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          onClick={toggleEliminate}
          className={`mm-btn px-3 py-2 text-xs ${
            team.eliminated
              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15 focus:ring-emerald-500/30'
              : 'border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15 focus:ring-red-500/30'
          }`}
        >
          {team.eliminated ? 'Restore' : 'Eliminate'}
        </button>
        <button
          onClick={removeTeam}
          className="mm-btn border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15 focus:ring-red-500/30 px-3 py-2 text-xs"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ─── Scoring Tab ────────────────────────────────────────────────────────────

function ScoringTab({ state, adminToken }: { state: NonNullable<ReturnType<typeof useGameState>>; adminToken: string }) {
  const [selectedTeam, setSelectedTeam] = useState(state.teams[0]?.id || '');
  const [selectedRound, setSelectedRound] = useState(state.currentRound);
  const team = state.teams.find(t => t.id === selectedTeam);

  return (
    <div className="space-y-6">
      <div className="mm-card p-6 md:p-8">
        <div className="mm-kicker">Scoring</div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Edit scores</h2>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Team</label>
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="mm-input">
              {state.teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Round</label>
            <select value={selectedRound} onChange={e => setSelectedRound(Number(e.target.value))} className="mm-input">
              {[1, 2, 3, 4, 5].map(r => (
                <option key={r} value={r}>
                  Round {r} — {ROUND_NAMES[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {team && selectedRound === 1 && <Round1Form team={team} adminToken={adminToken} />}
      {team && selectedRound === 2 && <Round2Form team={team} adminToken={adminToken} />}
      {team && selectedRound === 3 && <Round3Form team={team} adminToken={adminToken} />}
      {team && selectedRound === 4 && <Round4Form team={team} adminToken={adminToken} />}
      {team && selectedRound === 5 && <Round5Form team={team} adminToken={adminToken} />}
    </div>
  );
}

function ScoreInput({ label, value, onChange, max, description }: { label: string; value: number; onChange: (v: number) => void; max: number; description?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/80 mb-2">
        {label} <span className="text-white/50">(max {max})</span>
      </label>
      {description && <p className="text-xs text-white/50 mb-2">{description}</p>}
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))}
        className="mm-input font-mono"
      />
    </div>
  );
}

function Round1Form({ team, adminToken }: { team: PublicTeam; adminToken: string }) {
  const [scores, setScores] = useState(team.scores.round1);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await adminApi(`/api/admin/scores/${team.id}/round1`, adminToken, {
      method: 'PUT',
      body: JSON.stringify(scores),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const total = scores.insightAccuracy + scores.taglineCreativity + scores.audienceInsight + scores.judgeVotes;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-sm text-gray-800">Round 1 — Marketing Relay <span className="text-gray-400 text-xs">(Max 20 pts)</span></h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreInput label="Insight Selection Accuracy" value={scores.insightAccuracy} onChange={v => setScores(s => ({ ...s, insightAccuracy: v }))} max={5} description="How closely the selected option aligns with the hidden problem statement" />
        <ScoreInput label="Tagline Relevance & Creativity" value={scores.taglineCreativity} onChange={v => setScores(s => ({ ...s, taglineCreativity: v }))} max={5} description="Brand tagline quality and connection to insight" />
        <ScoreInput label="Audience & Insight Deduction" value={scores.audienceInsight} onChange={v => setScores(s => ({ ...s, audienceInsight: v }))} max={10} description="Accuracy of target audience and consumer insight deduction" />
        <ScoreInput label="Judge Votes" value={scores.judgeVotes} onChange={v => setScores(s => ({ ...s, judgeVotes: v }))} max={100} description="Judge points (no multiplier)" />
        <div>
          <label className="block text-xs font-bold tracking-[0.15em] uppercase text-gray-600 mb-1">
            Bonus Tokens <span className="text-gray-400">(0, 10, or 20)</span>
          </label>
          <p className="text-[10px] text-gray-400 mb-1">Successful relay=20, Partial=10, Unsuccessful=0</p>
          <select
            value={scores.bonusTokens}
            onChange={e => setScores(s => ({ ...s, bonusTokens: Number(e.target.value) }))}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] font-mono text-sm focus:outline-none focus:border-orange-500/50"
          >
            <option value={0} className="bg-white">0 — Unsuccessful</option>
            <option value={10} className="bg-white">10 — Partial</option>
            <option value={20} className="bg-white">20 — Successful</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} className="bg-orange-500/20 text-orange-400 px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-500/30 transition-colors">
          Save Scores
        </button>
        {saved && <span className="text-emerald-400 text-sm">Saved!</span>}
        <span className="text-gray-400 text-xs ml-auto">Total: {total} pts</span>
      </div>
    </div>
  );
}

function Round2Form({ team, adminToken }: { team: PublicTeam; adminToken: string }) {
  const [remainingTokens, setRemainingTokens] = useState(team.scores.round2.remainingTokens);
  const [judgeVotes, setJudgeVotes] = useState(team.scores.round2.judgeVotes);
  const [saved, setSaved] = useState(false);

  const budget = 100 + team.scores.round1.bonusTokens + (
    (team.scores.round1.insightAccuracy + team.scores.round1.taglineCreativity + team.scores.round1.audienceInsight) >= 20 ? 300 :
    (team.scores.round1.insightAccuracy + team.scores.round1.taglineCreativity + team.scores.round1.audienceInsight) >= 10 ? 150 : 0
  );

  const save = async () => {
    await adminApi(`/api/admin/scores/${team.id}/round2`, adminToken, {
      method: 'PUT',
      body: JSON.stringify({ remainingTokens, judgeVotes }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-sm text-gray-800">Round 2 — Digital Marketing Strategy</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-500">Estimated Budget: <span className="text-orange-400 font-mono font-bold">{budget} tokens</span></p>
        <p className="text-[10px] text-gray-400 mt-1">100 base + {team.scores.round1.bonusTokens} relay bonus + score-based bonus</p>
      </div>
      <div>
        <label className="block text-xs font-bold tracking-[0.15em] uppercase text-gray-600 mb-1">
          Remaining Tokens After Spending
        </label>
        <p className="text-[10px] text-gray-400 mb-1">20 tokens = 1 point on leaderboard</p>
        <input
          type="number"
          min={0}
          value={remainingTokens}
          onChange={e => setRemainingTokens(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] font-mono text-sm focus:outline-none focus:border-orange-500/50"
        />
      </div>
      <div>
        <label className="block text-xs font-bold tracking-[0.15em] uppercase text-gray-600 mb-1">
          Judge Votes <span className="text-gray-400">(no multiplier)</span>
        </label>
        <input
          type="number"
          min={0}
          max={100}
          value={judgeVotes}
          onChange={e => setJudgeVotes(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] font-mono text-sm focus:outline-none focus:border-orange-500/50"
        />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} className="bg-orange-500/20 text-orange-400 px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-500/30 transition-colors">
          Save
        </button>
        {saved && <span className="text-emerald-400 text-sm">Saved!</span>}
        <span className="text-gray-400 text-xs ml-auto">Score: {Math.floor(remainingTokens / 20) + judgeVotes} pts</span>
      </div>
    </div>
  );
}

function Round3Form({ team, adminToken }: { team: PublicTeam; adminToken: string }) {
  const [scores, setScores] = useState(team.scores.round3);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await adminApi(`/api/admin/scores/${team.id}/round3`, adminToken, {
      method: 'PUT',
      body: JSON.stringify(scores),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const total = scores.creativity + scores.relevance + scores.performance + scores.clarity + scores.engagement + scores.judgeVotes;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-sm text-gray-800">Round 3 — Ad Improv <span className="text-gray-400 text-xs">(Max 25 pts)</span></h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreInput label="Creativity" value={scores.creativity} onChange={v => setScores(s => ({ ...s, creativity: v }))} max={5} description="Originality of concept" />
        <ScoreInput label="Relevance" value={scores.relevance} onChange={v => setScores(s => ({ ...s, relevance: v }))} max={5} description="Alignment with campaign" />
        <ScoreInput label="Performance" value={scores.performance} onChange={v => setScores(s => ({ ...s, performance: v }))} max={5} description="Acting, confidence, coordination" />
        <ScoreInput label="Clarity" value={scores.clarity} onChange={v => setScores(s => ({ ...s, clarity: v }))} max={5} description="Message communication" />
        <ScoreInput label="Engagement" value={scores.engagement} onChange={v => setScores(s => ({ ...s, engagement: v }))} max={5} description="Audience impact" />
        <ScoreInput label="Judge Votes" value={scores.judgeVotes} onChange={v => setScores(s => ({ ...s, judgeVotes: v }))} max={100} description="Judge points (no multiplier)" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} className="bg-orange-500/20 text-orange-400 px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-500/30 transition-colors">
          Save Scores
        </button>
        {saved && <span className="text-emerald-400 text-sm">Saved!</span>}
        <span className="text-gray-400 text-xs ml-auto">Total: {total}/25 pts</span>
      </div>
    </div>
  );
}

function Round4Form({ team, adminToken }: { team: PublicTeam; adminToken: string }) {
  const [scores, setScores] = useState({
    strategy: team.scores.round4.strategy,
    creativity: team.scores.round4.creativity,
    impact: team.scores.round4.impact,
  });
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await adminApi(`/api/admin/scores/${team.id}/round4`, adminToken, {
      method: 'PUT',
      body: JSON.stringify(scores),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const orgTotal = scores.strategy + scores.creativity + scores.impact;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-sm text-gray-800">Round 4 — Brand Wars <span className="text-gray-400 text-xs">(Organizer: 15 pts + Audience votes)</span></h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreInput label="Strategy" value={scores.strategy} onChange={v => setScores(s => ({ ...s, strategy: v }))} max={5} description="Attack & positioning" />
        <ScoreInput label="Creativity" value={scores.creativity} onChange={v => setScores(s => ({ ...s, creativity: v }))} max={5} description="Humor & originality" />
        <ScoreInput label="Impact" value={scores.impact} onChange={v => setScores(s => ({ ...s, impact: v }))} max={5} description="Persuasiveness" />
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500">Audience votes: <span className="text-orange-400 font-mono font-bold">{team.scores.round4.audienceVotes}</span> (auto-tallied from voting)</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} className="bg-orange-500/20 text-orange-400 px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-500/30 transition-colors">
          Save Organizer Scores
        </button>
        {saved && <span className="text-emerald-400 text-sm">Saved!</span>}
        <span className="text-gray-400 text-xs ml-auto">Organizer: {orgTotal}/15 + Audience: {team.scores.round4.audienceVotes}</span>
      </div>
    </div>
  );
}

function Round5Form({ team, adminToken }: { team: PublicTeam; adminToken: string }) {
  const [scores, setScores] = useState(team.scores.round5);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await adminApi(`/api/admin/scores/${team.id}/round5`, adminToken, {
      method: 'PUT',
      body: JSON.stringify(scores),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const total = scores.insight + scores.strategy + scores.creativity + scores.feasibility + scores.delivery + scores.judgeVotes;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-sm text-gray-800">Round 5 — Pitch Perfect <span className="text-gray-400 text-xs">(Max 50 pts)</span></h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreInput label="Consumer Insight" value={scores.insight} onChange={v => setScores(s => ({ ...s, insight: v }))} max={10} description="Consumer understanding depth" />
        <ScoreInput label="Strategy" value={scores.strategy} onChange={v => setScores(s => ({ ...s, strategy: v }))} max={10} description="Marketing execution plan" />
        <ScoreInput label="Creativity" value={scores.creativity} onChange={v => setScores(s => ({ ...s, creativity: v }))} max={10} description="Branding & uniqueness" />
        <ScoreInput label="Feasibility" value={scores.feasibility} onChange={v => setScores(s => ({ ...s, feasibility: v }))} max={10} description="Practicality of execution" />
        <ScoreInput label="Delivery" value={scores.delivery} onChange={v => setScores(s => ({ ...s, delivery: v }))} max={10} description="Pitch quality & persuasion" />
        <ScoreInput label="Judge Votes" value={scores.judgeVotes} onChange={v => setScores(s => ({ ...s, judgeVotes: v }))} max={100} description="Judge points (no multiplier)" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} className="bg-orange-500/20 text-orange-400 px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-500/30 transition-colors">
          Save Scores
        </button>
        {saved && <span className="text-emerald-400 text-sm">Saved!</span>}
        <span className="text-gray-400 text-xs ml-auto">Total: {total} pts</span>
      </div>
    </div>
  );
}

// ─── Timer Tab ──────────────────────────────────────────────────────────────

function TimerTab({ state, adminToken }: { state: NonNullable<ReturnType<typeof useGameState>>; adminToken: string }) {
  const [minutes, setMinutes] = useState(5);
  const [label, setLabel] = useState('');
  const [extendMin, setExtendMin] = useState(1);

  const startTimer = async () => {
    await adminApi('/api/admin/timer/start', adminToken, {
      method: 'POST',
      body: JSON.stringify({ minutes, label }),
    });
  };

  const extendTimer = async () => {
    await adminApi('/api/admin/timer/extend', adminToken, {
      method: 'POST',
      body: JSON.stringify({ minutes: extendMin }),
    });
  };

  const stopTimer = async () => {
    await adminApi('/api/admin/timer/stop', adminToken, {
      method: 'POST',
    });
  };

  return (
    <div className="space-y-6 max-w-xl">
      {/* Current Timer */}
      {state.timer.running && (
        <TimerDisplay
          endTime={state.timer.endTime}
          running={state.timer.running}
          label={state.timer.label}
          large
        />
      )}

      {/* Start New Timer */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500">Start New Timer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Minutes</label>
            <input
              type="number"
              min={1}
              value={minutes}
              onChange={e => setMinutes(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] font-mono text-sm focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Round 1 - Team Alpha"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] text-sm placeholder:text-gray-400 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>
        <button onClick={startTimer} className="w-full bg-emerald-500/20 text-emerald-400 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition-colors">
          Start Timer
        </button>
      </div>

      {/* Extend Timer */}
      {state.timer.running && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-6 space-y-4">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-amber-400/60">Extend Timer</h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={extendMin}
              onChange={e => setExtendMin(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] font-mono text-sm focus:outline-none"
            />
            <span className="text-gray-400 text-sm">minutes</span>
            <button onClick={extendTimer} className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-500/30 transition-colors">
              + Extend
            </button>
          </div>
        </div>
      )}

      {/* Stop Timer */}
      {state.timer.running && (
        <button onClick={stopTimer} className="w-full bg-red-500/20 text-red-400 py-3 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors">
          Stop Timer
        </button>
      )}
    </div>
  );
}

// ─── Battles Tab ────────────────────────────────────────────────────────────

function BattlesTab({ state, adminToken }: { state: NonNullable<ReturnType<typeof useGameState>>; adminToken: string }) {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');

  const createBattle = async () => {
    if (!team1 || !team2 || team1 === team2) return;
    await adminApi('/api/admin/battles', adminToken, {
      method: 'POST',
      body: JSON.stringify({ team1Id: team1, team2Id: team2 }),
    });
    setTeam1('');
    setTeam2('');
  };

  const activateBattle = async (battleId: string) => {
    await adminApi(`/api/admin/battles/${battleId}/activate`, adminToken, {
      method: 'PUT',
    });
  };

  const completeBattle = async (battleId: string) => {
    await adminApi(`/api/admin/battles/${battleId}/complete`, adminToken, {
      method: 'PUT',
    });
  };

  const deleteBattle = async (battleId: string) => {
    await adminApi(`/api/admin/battles/${battleId}`, adminToken, {
      method: 'DELETE',
    });
  };

  const activeTeams = state.teams.filter(t => !t.eliminated);

  return (
    <div className="space-y-6">
      {/* Create Battle */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500">Create Battle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Team 1</label>
            <select
              value={team1}
              onChange={e => setTeam1(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-orange-500/50"
            >
              <option value="" className="bg-white">Select...</option>
              {activeTeams.map(t => (
                <option key={t.id} value={t.id} className="bg-white">{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Team 2</label>
            <select
              value={team2}
              onChange={e => setTeam2(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-orange-500/50"
            >
              <option value="" className="bg-white">Select...</option>
              {activeTeams.map(t => (
                <option key={t.id} value={t.id} className="bg-white">{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={createBattle}
          disabled={!team1 || !team2 || team1 === team2}
          className="bg-red-500/20 text-red-400 px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors disabled:opacity-30"
        >
          Create Battle
        </button>
      </div>

      {/* Battle List */}
      <div className="space-y-3">
        {state.battles.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No battles created yet</p>
        )}
        {state.battles.map(battle => {
          const t1 = state.teams.find(t => t.id === battle.team1Id);
          const t2 = state.teams.find(t => t.id === battle.team2Id);
          const isActive = battle.status === 'active';
          const isCompleted = battle.status === 'completed';

          return (
            <div
              key={battle.id}
              className={`rounded-xl border p-5 ${
                isActive ? 'border-red-500/40 bg-red-50' :
                isCompleted ? 'border-emerald-500/20 bg-emerald-50 opacity-70' :
                'border-gray-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                    isActive ? 'bg-red-500/20 text-red-400' :
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-white/10 text-gray-400'
                  }`}>
                    {battle.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isCompleted && !isActive && (
                    <button onClick={() => activateBattle(battle.id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/30">
                      Go Live
                    </button>
                  )}
                  {isActive && (
                    <button onClick={() => completeBattle(battle.id)} className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-500/30">
                      End & Tally
                    </button>
                  )}
                  {!isActive && (
                    <button onClick={() => deleteBattle(battle.id)} className="text-xs bg-gray-50 text-gray-400 px-3 py-1 rounded hover:bg-white/10">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="font-bold">{t1?.name}</p>
                  {isActive && (
                    <p className="font-mono text-xl font-black text-orange-400 mt-1">{state.voteCounts[battle.team1Id] || 0} votes</p>
                  )}
                </div>
                <span className="text-red-500/50 font-black text-lg">VS</span>
                <div className="flex-1 text-center">
                  <p className="font-bold">{t2?.name}</p>
                  {isActive && (
                    <p className="font-mono text-xl font-black text-orange-400 mt-1">{state.voteCounts[battle.team2Id] || 0} votes</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
