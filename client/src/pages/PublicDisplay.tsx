import { useGameState, useTimerEnded } from '../hooks/useGameState';
import Leaderboard from '../components/Leaderboard';
import TimerDisplay from '../components/Timer';
import { ROUND_NAMES } from '../types';
import { useCallback, useState } from 'react';

export default function PublicDisplay() {
  const state = useGameState();
  const [flash, setFlash] = useState(false);

  useTimerEnded(useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 3000);
  }, []));

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 scrapbook-card tape-effect">
          <div className="w-8 h-8 border-4 border-[var(--orange-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="font-hand text-2xl text-[var(--blue-primary)] font-bold">Connecting to Mayhem...</p>
        </div>
      </div>
    );
  }

  const activeBattle = state.battles.find(b => b.id === state.activeBattleId);
  const team1 = activeBattle ? state.teams.find(t => t.id === activeBattle.team1Id) : null;
  const team2 = activeBattle ? state.teams.find(t => t.id === activeBattle.team2Id) : null;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${flash ? 'bg-red-500/20' : ''}`}>
      {/* Header */}
      <header className="bg-white border-b-4 border-[var(--blue-primary)] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--orange-primary)] text-white shadow-[2px_2px_0_var(--blue-primary)] flex items-center justify-center font-black text-2xl rotate-3">
              M
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tight uppercase text-[var(--blue-primary)]">MARKETING MAYHEM</h1>
              <p className="font-hand text-xl text-gray-600 -mt-1"><span className="marker-highlight">Decode. Decide. Dominate.</span></p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right scrapbook-card rotate-[-2deg] !p-2 !px-4">
              <p className="font-hand text-lg text-gray-500 mb-[-4px]">Current Event Stage</p>
              <p className="font-bold text-[var(--orange-primary)] uppercase tracking-wide">
                Round {state.currentRound} — {ROUND_NAMES[state.currentRound]}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* Timer */}
          {state.timer.running && (
            <div className="origin-center rotate-[-1deg]">
              <TimerDisplay
                endTime={state.timer.endTime}
                running={state.timer.running}
                label={state.timer.label}
                large
              />
            </div>
          )}

          {/* Active Battle (Round 4) */}
          {activeBattle && team1 && team2 && (
            <div className="scrapbook-card tape-effect rotate-1 bg-[var(--peach-light)]">
              <h3 className="text-center font-hand text-2xl font-bold text-red-600 mb-4 transform -rotate-2">
                ⚔️ BRAND WARS ⚔️
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center bg-white p-3 rounded shadow-sm border border-gray-200">
                  <p className="font-bold text-lg text-[var(--text-main)] truncate">{team1.name}</p>
                  <span className="text-xs bg-[var(--mint-light)] text-[var(--text-main)] px-2 py-0.5 rounded-full inline-block mt-1">{team1.domain}</span>
                  <p className="mt-3 font-hand text-5xl font-black text-[var(--orange-primary)]">
                    {state.voteCounts[team1.id] || 0}
                  </p>
                  <p className="text-xs uppercase text-gray-400 font-bold tracking-widest">Votes</p>
                </div>
                <div className="text-3xl font-black text-[var(--blue-primary)] italic">VS</div>
                <div className="flex-1 text-center bg-white p-3 rounded shadow-sm border border-gray-200">
                  <p className="font-bold text-lg text-[var(--text-main)] truncate">{team2.name}</p>
                  <span className="text-xs bg-[var(--blue-light)] text-[var(--text-main)] px-2 py-0.5 rounded-full inline-block mt-1">{team2.domain}</span>
                  <p className="mt-3 font-hand text-5xl font-black text-red-500">
                    {state.voteCounts[team2.id] || 0}
                  </p>
                  <p className="text-xs uppercase text-gray-400 font-bold tracking-widest">Votes</p>
                </div>
              </div>
              
              <div className="mt-6 h-4 rounded-full bg-white border border-gray-300 overflow-hidden flex shadow-inner">
                {(() => {
                  const v1 = state.voteCounts[team1.id] || 0;
                  const v2 = state.voteCounts[team2.id] || 0;
                  const total = v1 + v2;
                  if (total === 0) return <div className="w-full bg-gray-100" />;
                  return (
                    <>
                      <div className="bg-[var(--orange-primary)] transition-all duration-700" style={{ width: `${(v1 / total) * 100}%` }} />
                      <div className="bg-red-500 transition-all duration-700" style={{ width: `${(v2 / total) * 100}%` }} />
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* BloomBox branding */}
          <div className="mt-auto pt-8 flex justify-center opacity-70">
            <div className="bg-[var(--blue-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm transform -rotate-3 shadow-[4px_4px_0_var(--orange-primary)]">
              Powered by BloomBox
            </div>
          </div>
        </div>

        {/* Leaderboard (right 2 cols) */}
        <div className="lg:col-span-2">
          <div className="scrapbook-card !p-0 overflow-hidden relative border-t-[12px] border-t-[var(--orange-primary)] border-x-2 border-b-2">
            {/* Folder tab effect visually */}
            <div className="px-6 py-5 border-b-2 border-dashed border-gray-200 flex items-center justify-between bg-[var(--paper-bg)]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <h2 className="font-extrabold text-2xl tracking-tight uppercase text-[var(--text-main)]">Agency Leaderboard</h2>
              </div>
              <span className="font-hand text-xl font-bold px-3 py-1 bg-[var(--mint-light)] rounded-lg text-emerald-800 flex items-center gap-2 transform rotate-1">
                Live Status
                <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </span>
            </div>
            <div className="p-4 bg-white min-h-[500px]">
              <Leaderboard teams={state.teams} currentRound={state.currentRound} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
