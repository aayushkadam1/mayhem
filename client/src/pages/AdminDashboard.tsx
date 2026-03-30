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
      <div className="min-h-screen bg-[var(--paper-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper-bg)] text-[var(--text-main)]">
      {/* Header */}
      <header className="border-b bg-white border-b-4 border-red-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg flex items-center justify-center text-sm">🔒</div>
            <div>
              <h1 className="font-black text-lg tracking-tight">ADMIN PANEL</h1>
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
            <button onClick={logoutAdmin} className="text-xs text-gray-400 hover:text-[var(--text-main)]/60 px-3 py-1.5 border border-gray-200 rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {(['overview', 'scoring', 'timer', 'battles'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs font-bold tracking-[0.15em] uppercase transition-colors border-b-2 ${
                tab === t ? 'text-orange-400 border-orange-500' : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {t === 'overview' ? '📊 Overview' : t === 'scoring' ? '📝 Scoring' : t === 'timer' ? '⏱️ Timer' : '⚔️ Battles'}
            </button>
          ))}
        </div>
      </div>

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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">Round Control</h3>
        <div className="flex items-center gap-3">
          <select
            value={round}
            onChange={e => setRound(Number(e.target.value))}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-orange-500/50"
          >
            {[1, 2, 3, 4, 5].map(r => (
              <option key={r} value={r} className="bg-white">
                Round {r} — {ROUND_NAMES[r]}
              </option>
            ))}
          </select>
          <button
            onClick={changeRound}
            className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-500/30 transition-colors"
          >
            Set Round
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="text-xs text-gray-500">
            Judge voting:{' '}
            <span className={
              isWarRound
                ? 'text-gray-400 font-bold'
                : isJudgeVotingOpen
                  ? 'text-emerald-500 font-bold'
                  : 'text-gray-400 font-bold'
            }>
              {isWarRound ? 'DISABLED (WAR ROUND)' : isJudgeVotingOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>

          {!isWarRound && (
            isJudgeVotingOpen ? (
              <button
                onClick={closeJudgeVoting}
                disabled={judgeVotingLoading}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                {judgeVotingLoading ? 'Closing...' : 'Close Voting'}
              </button>
            ) : (
              <button
                onClick={openJudgeVoting}
                disabled={judgeVotingLoading}
                className="bg-emerald-500/20 text-emerald-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
              >
                {judgeVotingLoading ? 'Starting...' : 'Start Voting'}
              </button>
            )
          )}

          {judgeVotingError && <span className="text-red-500 text-xs font-bold">{judgeVotingError}</span>}
        </div>
      </div>

      {/* Team List with passwords */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">Teams & Passwords</h3>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={newTeam.id}
            onChange={e => setNewTeam(t => ({ ...t, id: e.target.value }))}
            placeholder="Team ID"
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
          />
          <input
            value={newTeam.name}
            onChange={e => setNewTeam(t => ({ ...t, name: e.target.value }))}
            placeholder="Team name"
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
          />
          <input
            value={newTeam.password}
            onChange={e => setNewTeam(t => ({ ...t, password: e.target.value }))}
            placeholder="Password"
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
          />
          <input
            value={newTeam.domain}
            onChange={e => setNewTeam(t => ({ ...t, domain: e.target.value }))}
            placeholder="Domain"
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={addTeam}
            disabled={adding || !newTeam.id || !newTeam.name || !newTeam.password}
            className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
          >
            {adding ? 'Adding...' : 'Add Team'}
          </button>
          {addError && <span className="text-red-500 text-xs font-bold">{addError}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.teams.map(team => (
            <TeamCard key={team.id} team={team} adminToken={adminToken} />
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border border-orange-500/10 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-500/10">
          <h2 className="font-black text-sm tracking-[0.2em] uppercase text-gray-800">Leaderboard</h2>
        </div>
        <Leaderboard teams={state.teams} currentRound={state.currentRound} />
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
    <div className={`p-4 rounded-lg border ${team.eliminated ? 'border-red-200 bg-red-50 opacity-60' : 'border-gray-200 bg-white shadow-sm'}`}>
      <div className="flex items-start justify-between">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 bg-gray-50 border border-white/20 rounded px-2 py-1 text-sm text-[var(--text-main)] focus:outline-none"
            />
            <button onClick={saveName} className="text-emerald-400 text-xs font-bold">Save</button>
          </div>
        ) : (
          <div>
            <p className="font-bold text-sm">{team.name}</p>
            <p className="text-[10px] text-gray-400">{team.id}</p>
          </div>
        )}
        <button onClick={() => setEditing(!editing)} className="text-gray-400 hover:text-gray-600 text-xs ml-2">
          {editing ? '✕' : '✏️'}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          team.domain === 'Food & Beverages' ? 'bg-emerald-500/10 text-emerald-400' :
          team.domain === 'Clothing & Apparels' ? 'bg-purple-500/10 text-purple-400' :
          'bg-cyan-500/10 text-cyan-400'
        }`}>{team.domain}</span>
        <span className="font-mono text-sm font-bold text-orange-400">{team.totalScore} pts</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={toggleEliminate}
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
            team.eliminated ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {team.eliminated ? 'Restore' : 'Eliminate'}
        </button>
        <button
          onClick={removeTeam}
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"
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
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">Team</label>
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-orange-500/50"
          >
            {state.teams.map(t => (
              <option key={t.id} value={t.id} className="bg-white">{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">Round</label>
          <select
            value={selectedRound}
            onChange={e => setSelectedRound(Number(e.target.value))}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-orange-500/50"
          >
            {[1, 2, 3, 4, 5].map(r => (
              <option key={r} value={r} className="bg-white">Round {r} — {ROUND_NAMES[r]}</option>
            ))}
          </select>
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
      <label className="block text-xs font-bold tracking-[0.15em] uppercase text-gray-600 mb-1">
        {label} <span className="text-gray-400">(max {max})</span>
      </label>
      {description && <p className="text-[10px] text-gray-400 mb-1">{description}</p>}
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[var(--text-main)] font-mono text-sm focus:outline-none focus:border-orange-500/50"
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
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                    isActive ? 'bg-red-500/20 text-red-400' :
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-white/10 text-gray-400'
                  }`}>
                    {battle.status}
                  </span>
                </div>
                <div className="flex gap-2">
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

              <div className="flex items-center gap-4">
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
