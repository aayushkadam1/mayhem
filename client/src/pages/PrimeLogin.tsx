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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-[var(--mint-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-[var(--peach-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />

      <div className="w-full max-w-md scrapbook-card tape-effect relative z-10 -rotate-1 bg-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--orange-primary)] shadow-[4px_4px_0_var(--blue-primary)] flex items-center justify-center font-black text-3xl text-white mx-auto mb-6 transform rotate-6">
            ★
          </div>
          <h1 className="font-extrabold text-3xl text-[var(--text-main)] tracking-tight uppercase">Prime Login</h1>
          <p className="font-hand text-xl text-gray-500 mt-2"><span className="marker-highlight-mint">Marketing Mayhem</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="transform -rotate-1">
            <label className="block font-hand font-bold text-xl text-gray-700 mb-1">
              Select Prime Member
            </label>
            <select
              value={primeId}
              onChange={e => setPrimeId(e.target.value)}
              required
              className="w-full bg-[var(--paper-bg)] border-2 border-dashed border-gray-400 rounded-none px-4 py-3 text-[var(--text-main)] font-bold focus:outline-none focus:border-[var(--blue-primary)] transition-colors appearance-none shadow-sm"
            >
              <option value="" disabled>Choose your name...</option>
              {primes.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="transform rotate-1">
            <label className="block font-hand font-bold text-xl text-gray-700 mb-1">
              Passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter prime passcode"
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
            className="w-full bg-[var(--blue-primary)] border-2 border-[var(--blue-primary)] text-white font-black text-xl py-4 px-6 hover:bg-white hover:text-[var(--blue-primary)] transition-all disabled:opacity-50 tracking-wide shadow-[6px_6px_0_var(--orange-primary)] hover:shadow-[2px_2px_0_var(--orange-primary)] hover:translate-x-[4px] hover:translate-y-[4px] mt-4 transform rotate-1"
          >
            {loading ? 'Authenticating...' : 'ENTER PRIME PANEL'}
          </button>
        </form>
      </div>
    </div>
  );
}
