import { useEffect, useState } from 'react';
import { api } from '../socket';
import { useAuth } from '../hooks/useGameState';

interface TeamLoginProps {
  onLogin: () => void;
}

interface TeamEntry {
  id: string;
  name: string;
}

export default function TeamLogin({ onLogin }: TeamLoginProps) {
  const { loginTeam } = useAuth();
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ teams: TeamEntry[] }>('/api/state')
      .then(data => { if (active) setTeams(data.teams); })
      .catch(() => { if (active) setTeams([]); });
    return () => { active = false; };
  }, []);

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
    <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-7 w-1 rounded-full bg-[var(--mm-accent)]" />
            <div className="text-[var(--mm-accent)] font-black text-2xl tracking-wider">MAYHEM</div>
          </div>
          <div className="mm-kicker">Team Portal</div>
        </div>

        <div className="mm-card p-6 md:p-8">
          <div>
            <div className="mm-kicker">Teams</div>
            <h1 className="mt-2 text-xl font-bold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-white/40">Choose your team and enter the passcode.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mm-label">Team</label>
              <select value={teamId} onChange={e => setTeamId(e.target.value)} required className="mm-input">
                <option value="" disabled>Choose your team…</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mm-label">Passcode</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter team passcode"
                className="mm-input"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium animate-scale-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="mm-btn-primary w-full">
              {loading ? 'Authenticating…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
