import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameState, useAuth } from '../hooks/useGameState';
import { adminApi } from '../socket';
import Leaderboard from '../components/Leaderboard';
import TimerDisplay from '../components/Timer';
import { ROUND_NAMES } from '../types';
import type { PublicTeam } from '../types';
import { ROUTES } from '../navigation';

function downloadScoreSheet(teams: PublicTeam[], round: number | 'all') {
  const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  const title = round === 'all'
    ? 'Full Leaderboard — All Rounds'
    : `Round ${round}: ${ROUND_NAMES[round]}`;

  type Row = string[];
  let headers: Row;
  let rows: Row[];

  const sorted = [...teams].sort((a, b) => {
    if (round === 'all') return b.totalScore - a.totalScore;
    return b.roundScores[`round${round}` as keyof typeof b.roundScores] -
           a.roundScores[`round${round}` as keyof typeof a.roundScores];
  });

  if (round === 'all') {
    headers = ['Rank', 'Team', 'Domain', 'Eliminated', 'R1 Score', 'R2 Score', 'R3 Score', 'R4 (War) Score', 'R5 Score', 'TOTAL'];
    rows = sorted.map((t, i) => [
      String(i + 1), t.name, t.domain, t.eliminated ? 'Yes' : 'No',
      String(t.roundScores.round1), String(t.roundScores.round2), String(t.roundScores.round3),
      String(t.roundScores.round4), String(t.roundScores.round5), String(t.totalScore),
    ]);
  } else if (round === 1) {
    headers = ['Rank', 'Team', 'Domain', 'Insight Accuracy (/5)', 'Tagline Creativity (/5)', 'Audience Insight (/10)', 'Bonus Tokens', 'Judge Votes', 'Round 1 Total'];
    rows = sorted.map((t, i) => [
      String(i + 1), t.name, t.domain,
      String(t.scores.round1.insightAccuracy), String(t.scores.round1.taglineCreativity),
      String(t.scores.round1.audienceInsight), String(t.scores.round1.bonusTokens),
      String(t.scores.round1.judgeVotes), String(t.roundScores.round1),
    ]);
  } else if (round === 2) {
    headers = ['Rank', 'Team', 'Domain', 'Remaining Tokens', 'Judge Votes', 'Round 2 Total'];
    rows = sorted.map((t, i) => [
      String(i + 1), t.name, t.domain,
      String(t.scores.round2.remainingTokens), String(t.scores.round2.judgeVotes),
      String(t.roundScores.round2),
    ]);
  } else if (round === 3) {
    headers = ['Rank', 'Team', 'Domain', 'Creativity (/5)', 'Relevance (/5)', 'Performance (/5)', 'Clarity (/5)', 'Engagement (/5)', 'Judge Votes', 'Round 3 Total'];
    rows = sorted.map((t, i) => [
      String(i + 1), t.name, t.domain,
      String(t.scores.round3.creativity), String(t.scores.round3.relevance),
      String(t.scores.round3.performance), String(t.scores.round3.clarity),
      String(t.scores.round3.engagement), String(t.scores.round3.judgeVotes),
      String(t.roundScores.round3),
    ]);
  } else if (round === 4) {
    headers = ['Rank', 'Team', 'Domain', 'Strategy (/5)', 'Creativity (/5)', 'Impact (/5)', 'Audience Votes', 'Round 4 Total'];
    rows = sorted.map((t, i) => [
      String(i + 1), t.name, t.domain,
      String(t.scores.round4.strategy), String(t.scores.round4.creativity),
      String(t.scores.round4.impact), String(t.scores.round4.audienceVotes),
      String(t.roundScores.round4),
    ]);
  } else {
    headers = ['Rank', 'Team', 'Domain', 'Consumer Insight (/10)', 'Strategy (/10)', 'Creativity (/10)', 'Feasibility (/10)', 'Delivery (/10)', 'Judge Votes', 'Round 5 Total'];
    rows = sorted.map((t, i) => [
      String(i + 1), t.name, t.domain,
      String(t.scores.round5.insight), String(t.scores.round5.strategy),
      String(t.scores.round5.creativity), String(t.scores.round5.feasibility),
      String(t.scores.round5.delivery), String(t.scores.round5.judgeVotes),
      String(t.roundScores.round5),
    ]);
  }

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    `"Marketing Mayhem — ${title}"`,
    `"Generated: ${timestamp}"`,
    '',
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mayhem-${round === 'all' ? 'all-rounds' : `round${round}`}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type Tab = 'overview' | 'scoring' | 'timer' | 'battles';

const TAB_META: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'scoring', label: 'Scoring', icon: '✏️' },
  { key: 'timer', label: 'Timer', icon: '⏱️' },
  { key: 'battles', label: 'Battles', icon: '⚔️' },
];

export default function AdminDashboard() {
  const state = useGameState();
  const { adminToken, logoutAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 5000);
      return;
    }
    setResetting(true);
    try {
      await adminApi('/api/admin/reset', adminToken!, { method: 'POST' });
    } finally {
      setResetting(false);
      setResetConfirm(false);
    }
  };

  if (!state || !adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[var(--mm-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white animate-fade-in">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--mm-bg)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="mm-kicker">Admin Panel</div>
            <h1 className="mt-1 text-xl md:text-2xl font-bold tracking-tight truncate">Control Room</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="mm-badge">
                Round {state.currentRound} — {ROUND_NAMES[state.currentRound]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to={ROUTES.landing} className="mm-btn-secondary text-xs">
              Back
            </Link>
            <button
              onClick={handleReset}
              disabled={resetting}
              className={`text-xs transition-all duration-200 mm-btn ${
                resetConfirm
                  ? 'border-red-500/60 bg-red-500/20 text-red-300 hover:bg-red-500/30 animate-pulse'
                  : 'border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 focus:ring-red-500/20'
              }`}
            >
              {resetting ? 'Resetting…' : resetConfirm ? 'Tap again to confirm reset' : 'Reset Event'}
            </button>
            <button onClick={logoutAdmin} className="mm-btn-primary text-xs">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex gap-1.5 overflow-x-auto">
          {TAB_META.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                tab === t.key
                  ? 'bg-[var(--mm-accent)]/15 text-[var(--mm-accent)] border border-[var(--mm-accent)]/20'
                  : 'border border-transparent text-white/50 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 animate-fade-in-up">
        {tab === 'overview' && <OverviewTab state={state} adminToken={adminToken} />}
        {tab === 'scoring' && <ScoringTab state={state} adminToken={adminToken} />}
        {tab === 'timer' && <TimerTab state={state} adminToken={adminToken} />}
        {tab === 'battles' && <BattlesTab state={state} adminToken={adminToken} />}
      </div>
    </div>
  );
}

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
      <div className="mm-card p-6 md:p-8">
        <div className="mm-kicker">Round Control</div>
        <h2 className="mt-2 text-lg font-bold tracking-tight">Current round</h2>

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
          <button onClick={changeRound} className="mm-btn-primary">
            Set Round
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="text-sm text-white/50">
            Judge voting:
            <span
              className={`ml-2 mm-badge ${
                isWarRound
                  ? ''
                  : isJudgeVotingOpen
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : ''
              }`}
            >
              {isWarRound ? 'Disabled (war round)' : isJudgeVotingOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          {!isWarRound && (
            isJudgeVotingOpen ? (
              <button onClick={closeJudgeVoting} disabled={judgeVotingLoading} className="mm-btn-secondary text-xs">
                {judgeVotingLoading ? 'Closing…' : 'Close Voting'}
              </button>
            ) : (
              <button onClick={openJudgeVoting} disabled={judgeVotingLoading} className="mm-btn-primary text-xs">
                {judgeVotingLoading ? 'Starting…' : 'Start Voting'}
              </button>
            )
          )}
        </div>

        {judgeVotingError && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium">
            {judgeVotingError}
          </div>
        )}
      </div>

      <div className="mm-card p-6 md:p-8">
        <div className="mm-kicker">Teams</div>
        <h2 className="mt-2 text-lg font-bold tracking-tight mb-5">Teams & passcodes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <input value={newTeam.id} onChange={e => setNewTeam(t => ({ ...t, id: e.target.value }))} placeholder="Team ID" className="mm-input" />
          <input value={newTeam.name} onChange={e => setNewTeam(t => ({ ...t, name: e.target.value }))} placeholder="Team name" className="mm-input" />
          <input value={newTeam.password} onChange={e => setNewTeam(t => ({ ...t, password: e.target.value }))} placeholder="Password" className="mm-input" />
          <input value={newTeam.domain} onChange={e => setNewTeam(t => ({ ...t, domain: e.target.value }))} placeholder="Domain" className="mm-input" />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={addTeam} disabled={adding || !newTeam.id || !newTeam.name || !newTeam.password} className="mm-btn-primary text-xs">
            {adding ? 'Adding…' : 'Add Team'}
          </button>
          {addError && <span className="text-sm font-medium text-red-300">{addError}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.teams.map(team => (
            <TeamCard key={team.id} team={team} adminToken={adminToken} />
          ))}
        </div>
      </div>

      <div className="mm-card p-0 overflow-hidden">
        <div className="mm-section-header">
          <div className="mm-kicker">Live</div>
          <h2 className="mt-2 text-lg font-bold tracking-tight">Leaderboard</h2>
        </div>
        <div className="p-2 md:p-4">
          <Leaderboard teams={state.teams} currentRound={state.currentRound} />
        </div>
      </div>

      <div className="mm-card p-6 md:p-8">
        <div className="mm-kicker">Export</div>
        <h2 className="mt-2 text-lg font-bold tracking-tight">Download Score Sheets</h2>
        <p className="mt-1 text-sm text-white/40">Download a CSV of scores ranked by any round, or a full summary across all rounds.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {([1, 2, 3, 4, 5] as const).map(r => (
            <button
              key={r}
              onClick={() => downloadScoreSheet(state.teams, r)}
              className="mm-btn-secondary text-xs flex items-center gap-2"
            >
              <span>↓</span>
              Round {r} — {ROUND_NAMES[r]}
            </button>
          ))}
          <button
            onClick={() => downloadScoreSheet(state.teams, 'all')}
            className="mm-btn-primary text-xs flex items-center gap-2"
          >
            <span>↓</span>
            All Rounds (Full Summary)
          </button>
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
    await adminApi(`/api/admin/team/${team.id}`, adminToken, { method: 'DELETE' });
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        team.eliminated ? 'border-red-500/20 bg-red-500/[0.04] opacity-60' : 'border-white/[0.08] bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input value={name} onChange={e => setName(e.target.value)} className="mm-input text-sm" />
            <button onClick={saveName} className="mm-btn-primary px-3 py-2 text-xs">Save</button>
          </div>
        ) : (
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${team.eliminated ? 'text-white/40 line-through' : 'text-white'}`}>
              {team.name}
            </p>
            <p className="mt-0.5 text-[10px] font-mono text-white/30">{team.id}</p>
          </div>
        )}
        <button onClick={() => setEditing(!editing)} className="mm-btn-secondary px-3 py-2 text-xs">
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="mm-badge">{team.domain}</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-white/70">{team.totalScore} pts</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          onClick={toggleEliminate}
          className={`mm-btn px-3 py-2 text-xs ${
            team.eliminated
              ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 focus:ring-emerald-500/20'
              : 'border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15 focus:ring-red-500/20'
          }`}
        >
          {team.eliminated ? 'Restore' : 'Eliminate'}
        </button>
        <button
          onClick={removeTeam}
          className="mm-btn border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15 focus:ring-red-500/20 px-3 py-2 text-xs"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function ScoringTab({ state, adminToken }: { state: NonNullable<ReturnType<typeof useGameState>>; adminToken: string }) {
  const [selectedTeam, setSelectedTeam] = useState(state.teams[0]?.id || '');
  const [selectedRound, setSelectedRound] = useState(state.currentRound);
  const team = state.teams.find(t => t.id === selectedTeam);

  return (
    <div className="space-y-6">
      <div className="mm-card p-6 md:p-8">
        <div className="mm-kicker">Scoring</div>
        <h2 className="mt-2 text-lg font-bold tracking-tight">Edit scores</h2>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mm-label">Team</label>
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="mm-input">
              {state.teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mm-label">Round</label>
            <select value={selectedRound} onChange={e => setSelectedRound(Number(e.target.value))} className="mm-input">
              {[1, 2, 3, 4, 5].map(r => (
                <option key={r} value={r}>Round {r} — {ROUND_NAMES[r]}</option>
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
      <label className="mm-label">
        {label} <span className="text-white/30">(max {max})</span>
      </label>
      {description && <p className="text-xs text-white/30 mb-2">{description}</p>}
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

function SaveButton({ onClick, saved, total, maxLabel }: { onClick: () => void; saved: boolean; total?: number; maxLabel?: string }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button onClick={onClick} className="mm-btn-primary text-xs">
        Save Scores
      </button>
      {saved && (
        <span className="text-emerald-400 text-sm font-medium animate-fade-in">Saved!</span>
      )}
      {total !== undefined && (
        <span className="text-white/30 text-xs ml-auto font-mono">
          Total: {total}{maxLabel ? ` ${maxLabel}` : ' pts'}
        </span>
      )}
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
    <div className="mm-card p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Round 1 — Marketing Relay</h3>
        <span className="mm-badge">Max 20 pts</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreInput label="Insight Selection Accuracy" value={scores.insightAccuracy} onChange={v => setScores(s => ({ ...s, insightAccuracy: v }))} max={5} description="How closely the selected option aligns with the hidden problem statement" />
        <ScoreInput label="Tagline Relevance & Creativity" value={scores.taglineCreativity} onChange={v => setScores(s => ({ ...s, taglineCreativity: v }))} max={5} description="Brand tagline quality and connection to insight" />
        <ScoreInput label="Audience & Insight Deduction" value={scores.audienceInsight} onChange={v => setScores(s => ({ ...s, audienceInsight: v }))} max={10} description="Accuracy of target audience and consumer insight deduction" />
        <ScoreInput label="Judge Votes" value={scores.judgeVotes} onChange={v => setScores(s => ({ ...s, judgeVotes: v }))} max={100} description="Judge points (no multiplier)" />
        <div>
          <label className="mm-label">
            Bonus Tokens <span className="text-white/30">(0, 10, or 20)</span>
          </label>
          <p className="text-xs text-white/30 mb-2">Successful relay=20, Partial=10, Unsuccessful=0</p>
          <select
            value={scores.bonusTokens}
            onChange={e => setScores(s => ({ ...s, bonusTokens: Number(e.target.value) }))}
            className="mm-input"
          >
            <option value={0}>0 — Unsuccessful</option>
            <option value={10}>10 — Partial</option>
            <option value={20}>20 — Successful</option>
          </select>
        </div>
      </div>
      <SaveButton onClick={save} saved={saved} total={total} />
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
    <div className="mm-card p-6 md:p-8 space-y-5">
      <h3 className="text-sm font-bold text-white">Round 2 — Digital Marketing Strategy</h3>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <p className="text-xs text-white/50">Estimated Budget: <span className="text-[var(--mm-accent)] font-mono font-bold">{budget} tokens</span></p>
        <p className="text-[10px] text-white/30 mt-1">100 base + {team.scores.round1.bonusTokens} relay bonus + score-based bonus</p>
      </div>
      <div>
        <label className="mm-label">Remaining Tokens After Spending</label>
        <p className="text-xs text-white/30 mb-2">20 tokens = 1 point on leaderboard</p>
        <input type="number" min={0} value={remainingTokens} onChange={e => setRemainingTokens(Math.max(0, Number(e.target.value) || 0))} className="mm-input font-mono" />
      </div>
      <div>
        <label className="mm-label">Judge Votes <span className="text-white/30">(no multiplier)</span></label>
        <input type="number" min={0} max={100} value={judgeVotes} onChange={e => setJudgeVotes(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="mm-input font-mono" />
      </div>
      <SaveButton onClick={save} saved={saved} total={Math.floor(remainingTokens / 20) + judgeVotes} />
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
    <div className="mm-card p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Round 3 — Ad Improv</h3>
        <span className="mm-badge">Max 25 pts</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreInput label="Creativity" value={scores.creativity} onChange={v => setScores(s => ({ ...s, creativity: v }))} max={5} description="Originality of concept" />
        <ScoreInput label="Relevance" value={scores.relevance} onChange={v => setScores(s => ({ ...s, relevance: v }))} max={5} description="Alignment with campaign" />
        <ScoreInput label="Performance" value={scores.performance} onChange={v => setScores(s => ({ ...s, performance: v }))} max={5} description="Acting, confidence, coordination" />
        <ScoreInput label="Clarity" value={scores.clarity} onChange={v => setScores(s => ({ ...s, clarity: v }))} max={5} description="Message communication" />
        <ScoreInput label="Engagement" value={scores.engagement} onChange={v => setScores(s => ({ ...s, engagement: v }))} max={5} description="Audience impact" />
        <ScoreInput label="Judge Votes" value={scores.judgeVotes} onChange={v => setScores(s => ({ ...s, judgeVotes: v }))} max={100} description="Judge points (no multiplier)" />
      </div>
      <SaveButton onClick={save} saved={saved} total={total} maxLabel="/25 pts" />
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
    <div className="mm-card p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Round 4 — Brand Wars</h3>
        <span className="mm-badge">15 pts + Audience</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreInput label="Strategy" value={scores.strategy} onChange={v => setScores(s => ({ ...s, strategy: v }))} max={5} description="Attack & positioning" />
        <ScoreInput label="Creativity" value={scores.creativity} onChange={v => setScores(s => ({ ...s, creativity: v }))} max={5} description="Humor & originality" />
        <ScoreInput label="Impact" value={scores.impact} onChange={v => setScores(s => ({ ...s, impact: v }))} max={5} description="Persuasiveness" />
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <p className="text-xs text-white/50">Audience votes: <span className="text-[var(--mm-accent)] font-mono font-bold">{team.scores.round4.audienceVotes}</span> (auto-tallied from voting)</p>
      </div>
      <SaveButton onClick={save} saved={saved} total={orgTotal} maxLabel={`/15 + Audience: ${team.scores.round4.audienceVotes}`} />
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
    <div className="mm-card p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Round 5 — Pitch Perfect</h3>
        <span className="mm-badge">Max 50 pts</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreInput label="Consumer Insight" value={scores.insight} onChange={v => setScores(s => ({ ...s, insight: v }))} max={10} description="Consumer understanding depth" />
        <ScoreInput label="Strategy" value={scores.strategy} onChange={v => setScores(s => ({ ...s, strategy: v }))} max={10} description="Marketing execution plan" />
        <ScoreInput label="Creativity" value={scores.creativity} onChange={v => setScores(s => ({ ...s, creativity: v }))} max={10} description="Branding & uniqueness" />
        <ScoreInput label="Feasibility" value={scores.feasibility} onChange={v => setScores(s => ({ ...s, feasibility: v }))} max={10} description="Practicality of execution" />
        <ScoreInput label="Delivery" value={scores.delivery} onChange={v => setScores(s => ({ ...s, delivery: v }))} max={10} description="Pitch quality & persuasion" />
        <ScoreInput label="Judge Votes" value={scores.judgeVotes} onChange={v => setScores(s => ({ ...s, judgeVotes: v }))} max={100} description="Judge points (no multiplier)" />
      </div>
      <SaveButton onClick={save} saved={saved} total={total} />
    </div>
  );
}

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
    await adminApi('/api/admin/timer/stop', adminToken, { method: 'POST' });
  };

  return (
    <div className="space-y-6 max-w-xl">
      {state.timer.running && (
        <TimerDisplay endTime={state.timer.endTime} running={state.timer.running} label={state.timer.label} large />
      )}

      <div className="mm-card p-6 md:p-8 space-y-5">
        <h3 className="mm-kicker">Start New Timer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mm-label">Minutes</label>
            <input type="number" min={1} value={minutes} onChange={e => setMinutes(Math.max(1, Number(e.target.value) || 1))} className="mm-input font-mono" />
          </div>
          <div>
            <label className="mm-label">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Round 1 - Team Alpha" className="mm-input" />
          </div>
        </div>
        <button onClick={startTimer} className="w-full mm-btn border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 focus:ring-emerald-500/20">
          Start Timer
        </button>
      </div>

      {state.timer.running && (
        <div className="mm-card border-amber-500/15 p-6 space-y-4">
          <h3 className="mm-kicker text-amber-400/60">Extend Timer</h3>
          <div className="flex items-center gap-3">
            <input type="number" min={1} value={extendMin} onChange={e => setExtendMin(Math.max(1, Number(e.target.value) || 1))} className="mm-input w-24 font-mono" />
            <span className="text-white/40 text-sm">minutes</span>
            <button onClick={extendTimer} className="mm-btn border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15 focus:ring-amber-500/20 text-xs">
              + Extend
            </button>
          </div>
        </div>
      )}

      {state.timer.running && (
        <button onClick={stopTimer} className="w-full mm-btn border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15 focus:ring-red-500/20">
          Stop Timer
        </button>
      )}
    </div>
  );
}

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
    await adminApi(`/api/admin/battles/${battleId}/activate`, adminToken, { method: 'PUT' });
  };

  const completeBattle = async (battleId: string) => {
    await adminApi(`/api/admin/battles/${battleId}/complete`, adminToken, { method: 'PUT' });
  };

  const deleteBattle = async (battleId: string) => {
    await adminApi(`/api/admin/battles/${battleId}`, adminToken, { method: 'DELETE' });
  };

  const activeTeams = state.teams.filter(t => !t.eliminated);

  return (
    <div className="space-y-6">
      <div className="mm-card p-6 md:p-8 space-y-5">
        <h3 className="mm-kicker">Create Battle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mm-label">Team 1</label>
            <select value={team1} onChange={e => setTeam1(e.target.value)} className="mm-input">
              <option value="">Select...</option>
              {activeTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mm-label">Team 2</label>
            <select value={team2} onChange={e => setTeam2(e.target.value)} className="mm-input">
              <option value="">Select...</option>
              {activeTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={createBattle}
          disabled={!team1 || !team2 || team1 === team2}
          className="mm-btn-primary text-xs"
        >
          Create Battle
        </button>
      </div>

      <div className="space-y-3">
        {state.battles.length === 0 && (
          <div className="mm-card p-8 text-center">
            <p className="text-white/30 text-sm">No battles created yet</p>
          </div>
        )}
        {state.battles.map(battle => {
          const t1 = state.teams.find(t => t.id === battle.team1Id);
          const t2 = state.teams.find(t => t.id === battle.team2Id);
          const isActive = battle.status === 'active';
          const isCompleted = battle.status === 'completed';

          return (
            <div
              key={battle.id}
              className={`mm-card p-5 ${
                isActive ? 'border-[var(--mm-accent)]/30 animate-glow-pulse' :
                isCompleted ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <span className={`mm-badge text-[10px] uppercase tracking-widest ${
                  isActive ? 'border-[var(--mm-accent)]/30 bg-[var(--mm-accent)]/10 text-[var(--mm-accent)]' :
                  isCompleted ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : ''
                }`}>
                  {battle.status}
                </span>
                <div className="flex flex-wrap gap-2">
                  {!isCompleted && !isActive && (
                    <button onClick={() => activateBattle(battle.id)} className="mm-btn-primary px-3 py-1.5 text-xs">
                      Go Live
                    </button>
                  )}
                  {isActive && (
                    <button onClick={() => completeBattle(battle.id)} className="mm-btn border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 px-3 py-1.5 text-xs">
                      End & Tally
                    </button>
                  )}
                  {!isActive && (
                    <button onClick={() => deleteBattle(battle.id)} className="mm-btn-secondary px-3 py-1.5 text-xs">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="font-bold text-white">{t1?.name}</p>
                  {isActive && (
                    <p className="font-mono text-xl font-black text-[var(--mm-accent)] mt-1">{state.voteCounts[battle.team1Id] || 0} votes</p>
                  )}
                </div>
                <span className="text-[var(--mm-accent)]/40 font-black text-lg text-center">VS</span>
                <div className="flex-1 text-center">
                  <p className="font-bold text-white">{t2?.name}</p>
                  {isActive && (
                    <p className="font-mono text-xl font-black text-[var(--mm-accent)] mt-1">{state.voteCounts[battle.team2Id] || 0} votes</p>
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
