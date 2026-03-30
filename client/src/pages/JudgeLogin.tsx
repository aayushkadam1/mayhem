import { useEffect, useState } from 'react';
import { api } from '../socket';
import { useAuth } from '../hooks/useGameState';

interface JudgeLoginProps {
  onLogin: () => void;
}

interface JudgeEntry {
  id: string;
  name: string;
}

export default function JudgeLogin({ onLogin }: JudgeLoginProps) {
  const { loginJudge } = useAuth();
  const [judgeId, setJudgeId] = useState('');
  const [password, setPassword] = useState('');
  const [judges, setJudges] = useState<JudgeEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api<JudgeEntry[]>('/api/judge/list')
      .then(list => { if (active) setJudges(list); })
      .catch(() => { if (active) setJudges([]); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<{ judgeId: string; name: string }>('/api/judge/login', {
        method: 'POST',
        body: JSON.stringify({ judgeId, password }),
      });
      loginJudge(data.judgeId, password, data.name);
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
          <div className="mm-kicker">Judge Portal</div>
        </div>

        <div className="mm-card p-6 md:p-8">
          <div>
            <div className="mm-kicker">Judges</div>
            <h1 className="mt-2 text-xl font-bold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-white/40">Choose your name and enter the passcode.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mm-label">Judge</label>
              <select value={judgeId} onChange={e => setJudgeId(e.target.value)} required className="mm-input">
                <option value="" disabled>Choose your name…</option>
                {judges.map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
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
                placeholder="Enter judge passcode"
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
