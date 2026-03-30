import { useEffect, useState } from 'react';
import { api } from '../socket';
import { useAuth } from '../hooks/useGameState';

interface PrimeLoginProps {
  onLogin: () => void;
}

interface PrimeEntry {
  id: string;
  name: string;
}

export default function PrimeLogin({ onLogin }: PrimeLoginProps) {
  const { loginPrime } = useAuth();
  const [primeId, setPrimeId] = useState('');
  const [password, setPassword] = useState('');
  const [primes, setPrimes] = useState<PrimeEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api<PrimeEntry[]>('/api/prime/list')
      .then(list => { if (active) setPrimes(list); })
      .catch(() => { if (active) setPrimes([]); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<{ primeId: string; name: string }>('/api/prime/login', {
        method: 'POST',
        body: JSON.stringify({ primeId, password }),
      });
      loginPrime(data.primeId, password, data.name);
      onLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-[var(--mm-accent)] font-black text-3xl tracking-wide">MAYHEM</div>
          <div className="mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Prime Portal</div>
        </div>

        <div className="mm-card p-6 md:p-8">
          <div>
            <div className="mm-kicker">Prime Members</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-white/60">Choose your name and enter the passcode.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Prime Member</label>
              <select
                value={primeId}
                onChange={e => setPrimeId(e.target.value)}
                required
                className="mm-input"
              >
                <option value="" disabled>
                  Choose your name…
                </option>
                {primes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Passcode</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter prime passcode"
                className="mm-input"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm font-semibold">
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
