import { useState } from 'react';
import { api } from '../socket';
import { useAuth } from '../hooks/useGameState';

interface TeamLoginProps {
  onLogin: () => void;
}

const TEAMS = [
  { id: 'fb1', label: 'Team FB-1' },
  { id: 'fb2', label: 'Team FB-2' },
  { id: 'fb3', label: 'Team FB-3' },
  { id: 'fb4', label: 'Team FB-4' },
  { id: 'ca1', label: 'Team CA-1' },
  { id: 'ca2', label: 'Team CA-2' },
  { id: 'ca3', label: 'Team CA-3' },
  { id: 'ca4', label: 'Team CA-4' },
  { id: 'me1', label: 'Team ME-1' },
  { id: 'me2', label: 'Team ME-2' },
  { id: 'me3', label: 'Team ME-3' },
  { id: 'me4', label: 'Team ME-4' },
];

export default function TeamLogin({ onLogin }: TeamLoginProps) {
  const { loginTeam } = useAuth();
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<{ teamId: string; name: string }>('/api/team/login', {
        method: 'POST',
        body: JSON.stringify({ teamId, password }),
      });
      loginTeam(data.teamId, password, data.name);
      onLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-[var(--blue-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-[var(--peach-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      
      <div className="w-full max-w-md scrapbook-card tape-effect relative z-10 rotate-1 bg-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--orange-primary)] shadow-[4px_4px_0_var(--blue-primary)] flex items-center justify-center font-black text-3xl text-white mx-auto mb-6 transform -rotate-6">
            M
          </div>
          <h1 className="font-extrabold text-3xl text-[var(--text-main)] tracking-tight uppercase">Agency Login</h1>
          <p className="font-hand text-xl text-gray-500 mt-2"><span className="marker-highlight-mint">Marketing Mayhem</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="transform -rotate-1">
            <label className="block font-hand font-bold text-xl text-gray-700 mb-1">
              Select Your Agency
            </label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              required
              className="w-full bg-[var(--paper-bg)] border-2 border-dashed border-gray-400 rounded-none px-4 py-3 text-[var(--text-main)] font-bold focus:outline-none focus:border-[var(--blue-primary)] transition-colors appearance-none shadow-sm"
            >
              <option value="" disabled>Choose your team...</option>
              {TEAMS.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="transform rotate-1">
            <label className="block font-hand font-bold text-xl text-gray-700 mb-1">
              Secret Passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter team password"
              className="w-full bg-white border-b-2 border-gray-300 px-4 py-3 text-[var(--text-main)] font-bold placeholder:font-hand placeholder:text-gray-400 placeholder:text-lg focus:outline-none focus:border-[var(--orange-primary)] transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-500 px-4 py-3 text-red-600 font-bold text-center transform -rotate-1 shadow-[4px_4px_0_#DC2626]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--blue-primary)] border-2 border-[var(--blue-primary)] text-white font-black text-xl py-4 px-6 hover:bg-white hover:text-[var(--blue-primary)] transition-all disabled:opacity-50 tracking-wide shadow-[6px_6px_0_var(--orange-primary)] hover:shadow-[2px_2px_0_var(--orange-primary)] hover:translate-x-[4px] hover:translate-y-[4px] mt-4 transform -rotate-2"
          >
            {loading ? 'Authenticating...' : 'ENTER ARENA'}
          </button>
        </form>
      </div>
    </div>
  );
}
