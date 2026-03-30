import { useState, useCallback } from 'react';
import { useGameState, useAuth } from '../hooks/useGameState';
import { api } from '../socket';
import Leaderboard from '../components/Leaderboard';
import TimerDisplay from '../components/Timer';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--blue-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myTeam = state.teams.find(t => t.id === teamAuth.teamId);
  const activeBattle = state.battles.find(b => b.id === state.activeBattleId);
  const amBattling = activeBattle && (activeBattle.team1Id === teamAuth.teamId || activeBattle.team2Id === teamAuth.teamId);
  const team1 = activeBattle ? state.teams.find(t => t.id === activeBattle.team1Id) : null;
  const team2 = activeBattle ? state.teams.find(t => t.id === activeBattle.team2Id) : null;

  return (
    <div className="min-h-screen text-[var(--text-main)] pb-12">
      {/* Header */}
      <header className="bg-white border-b-4 border-[var(--orange-primary)] shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl tracking-tight text-[var(--blue-primary)] uppercase">{myTeam?.name || teamAuth.name}</h1>
            <p className="font-hand text-lg text-gray-500 -mt-1">
              <span className="marker-highlight-mint px-1">{myTeam?.domain}</span> • <span className="marker-highlight-peach px-1">Round {state.currentRound}</span>
            </p>
          </div>
          <div className="flex items-center gap-6">
            {myTeam && (
              <div className="text-right scrapbook-card rotate-3 !p-2 !px-4">
                <p className="font-hand font-bold text-gray-600 mb-[-4px]">Current Score</p>
                <p className="font-black text-2xl text-[var(--orange-primary)]">{myTeam.totalScore}</p>
              </div>
            )}
            <button
              onClick={logoutTeam}
              className="font-bold text-sm text-[var(--blue-primary)] hover:text-white hover:bg-[var(--blue-primary)] border-2 border-[var(--blue-primary)] transition-colors px-4 py-2 rounded-lg translate-y-[2px] shadow-[2px_2px_0_var(--blue-primary)] hover:shadow-[0_0_0_var(--blue-primary)] hover:translate-y-[4px]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Timer */}
        {state.timer.running && (
          <div className="flex justify-center my-4">
            <TimerDisplay
              endTime={state.timer.endTime}
              running={state.timer.running}
              label={state.timer.label}
            />
          </div>
        )}

        {/* Voting Section (Round 4) */}
        {activeBattle && !amBattling && team1 && team2 && (
          <div className="scrapbook-card tape-effect rotate-[-1deg] bg-[var(--peach-light)]">
            <h3 className="text-center font-hand text-3xl font-bold text-red-600 mb-6 transform -rotate-2 underline decoration-wavy">
              ⚔️ Cast Your Vote! ⚔️
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleVote(team1.id)}
                disabled={voteLoading || !!voteSuccess}
                className="group p-6 bg-white border-4 border-dashed border-[var(--orange-primary)] hover:bg-[var(--orange-primary)] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform -rotate-1 relative"
              >
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[var(--orange-primary)] text-white font-bold flex items-center justify-center rotate-12 group-hover:bg-white group-hover:text-[var(--orange-primary)] group-hover:scale-110 transition-transform">VOTE</div>
                <p className="font-bold text-2xl truncate">{team1.name}</p>
                <p className="font-hand text-xl mt-1 opacity-80">{team1.domain}</p>
                <p className="mt-4 font-black text-4xl">
                  {state.voteCounts[team1.id] || 0}
                </p>
              </button>
              <button
                onClick={() => handleVote(team2.id)}
                disabled={voteLoading || !!voteSuccess}
                className="group p-6 bg-white border-4 border-dashed border-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform rotate-2 relative"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-red-500 text-white font-bold flex items-center justify-center -rotate-12 group-hover:bg-white group-hover:text-red-500 group-hover:scale-110 transition-transform">VOTE</div>
                <p className="font-bold text-2xl truncate">{team2.name}</p>
                <p className="font-hand text-xl mt-1 opacity-80">{team2.domain}</p>
                <p className="mt-4 font-black text-4xl">
                  {state.voteCounts[team2.id] || 0}
                </p>
              </button>
            </div>

            {/* Vote bar */}
            {(state.voteCounts[team1.id] || state.voteCounts[team2.id]) ? (
              <div className="mt-6 h-4 rounded-full bg-white border-2 border-gray-800 overflow-hidden flex shadow-inner">
                {(() => {
                  const v1 = state.voteCounts[team1.id] || 0;
                  const v2 = state.voteCounts[team2.id] || 0;
                  const total = v1 + v2;
                  if (total === 0) return null;
                  return (
                    <>
                      <div className="bg-[var(--orange-primary)] transition-all duration-700 border-r-2 border-gray-800" style={{ width: `${(v1 / total) * 100}%` }} />
                      <div className="bg-red-500 transition-all duration-700" style={{ width: `${(v2 / total) * 100}%` }} />
                    </>
                  );
                })()}
              </div>
            ) : null}

            {voteError && (
              <p className="text-red-600 font-bold bg-white px-4 py-2 mt-4 text-center border-2 border-red-600 shadow-[4px_4px_0_#DC2626] transform rotate-1">{voteError}</p>
            )}
            {voteSuccess && (
              <p className="text-emerald-700 font-bold bg-emerald-100 px-4 py-2 mt-4 text-center border-2 border-emerald-600 shadow-[4px_4px_0_#059669] transform -rotate-1">{voteSuccess}</p>
            )}
          </div>
        )}

        {activeBattle && amBattling && (
          <div className="scrapbook-card tape-effect rotate-1 bg-[var(--blue-light)] text-center p-8">
            <p className="text-[var(--blue-primary)] font-black text-3xl uppercase tracking-wider mb-2">You are currently battling! 💥</p>
            <p className="text-gray-700 font-hand text-2xl">Show them what you've got in Brand Wars!</p>
          </div>
        )}

        {/* My Scores */}
        {myTeam && (
          <div className="scrapbook-card tape-effect p-6">
            <h3 className="font-hand text-xl font-bold tracking-wider text-gray-500 mb-4 uppercase underline decoration-gray-300">Your Round Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(r => {
                const key = `round${r}` as keyof typeof myTeam.roundScores;
                return (
                  <div key={r} className={`p-4 text-center border-2 border-[var(--text-main)] shadow-[2px_2px_0_var(--text-main)] transition-transform hover:-translate-y-1 ${r <= state.currentRound ? 'bg-[var(--mint-light)]' : 'bg-white opacity-50'}`}>
                    <p className="font-bold uppercase text-[var(--text-main)] text-sm mb-1">Round {r}</p>
                    <p className="font-hand font-black text-3xl text-[var(--orange-primary)]">{myTeam.roundScores[key]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="scrapbook-card !p-0 overflow-hidden relative border-t-[12px] border-t-[var(--blue-primary)] border-x-2 border-b-2">
          <div className="px-6 py-4 border-b-2 border-dashed border-gray-200 bg-[var(--paper-bg)]">
            <h2 className="font-extrabold text-xl tracking-tight uppercase text-[var(--text-main)]">Agency Leaderboard</h2>
          </div>
          <div className="bg-white p-2">
            <Leaderboard teams={state.teams} currentRound={state.currentRound} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
