import { useState } from 'react';
import { api } from '../socket';
import { useAuth } from '../hooks/useGameState';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const { loginAdmin } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      loginAdmin(data.token);
      onLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[var(--paper-bg)]">
      {/* Background decoration */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      
      <div className="w-full max-w-md scrapbook-card tape-effect relative z-10 -rotate-1 bg-white border-t-8 border-t-red-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 shadow-[4px_4px_0_var(--text-main)] flex items-center justify-center text-3xl mx-auto mb-6 transform rotate-6">
            🔒
          </div>
          <h1 className="font-extrabold text-3xl text-[var(--text-main)] tracking-tight uppercase">ADMIN ACCESS</h1>
          <p className="font-hand text-xl text-gray-500 mt-2"><span className="marker-highlight-peach">Marketing Mayhem Control Panel</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="transform rotate-1">
            <label className="block font-hand font-bold text-xl text-gray-700 mb-1">
              Master Passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter admin password"
              className="w-full bg-white border-b-2 border-red-300 px-4 py-3 text-[var(--text-main)] font-bold placeholder:font-hand placeholder:text-gray-400 placeholder:text-lg focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-500 px-4 py-3 text-red-600 font-bold text-center transform rotate-1 shadow-[4px_4px_0_#DC2626]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 border-2 border-red-600 text-white font-black text-xl py-4 px-6 hover:bg-white hover:text-red-600 transition-all disabled:opacity-50 tracking-wide shadow-[6px_6px_0_var(--text-main)] hover:shadow-[2px_2px_0_var(--text-main)] hover:translate-x-[4px] hover:translate-y-[4px] mt-4 transform rotate-1"
          >
            {loading ? 'Authenticating...' : 'ACCESS DASHBOARD'}
          </button>
        </form>
      </div>
    </div>
  );
}
