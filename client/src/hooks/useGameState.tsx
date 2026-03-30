import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { getSocket } from '../socket';
import type { PublicState } from '../types';

export function useGameState(): PublicState | null {
  const [state, setState] = useState<PublicState | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    const socket = getSocket();

    const handler = (data: PublicState) => {
      stateRef.current = data;
      setState(data);
    };

    socket.on('state:update', handler);

    return () => {
      socket.off('state:update', handler);
    };
  }, []);

  return state;
}

export function useTimer(endTime: number | null, running: boolean) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!running || !endTime) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const diff = endTime - Date.now();
      setRemaining(Math.max(0, diff));
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [endTime, running]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return { remaining, minutes, seconds, isRunning: running && remaining > 0 };
}

export function useTimerEnded(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const socket = getSocket();
    const handler = () => callbackRef.current();
    socket.on('timer:ended', handler);
    return () => { socket.off('timer:ended', handler); };
  }, []);
}

// ─── Auth Context ───────────────────────────────────────────────────────────

interface AuthState {
  teamAuth: { teamId: string; password: string; name: string } | null;
  adminToken: string | null;
  loginTeam: (teamId: string, password: string, name: string) => void;
  logoutTeam: () => void;
  loginAdmin: (token: string) => void;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function useAuthInternal() {
  const [teamAuth, setTeamAuth] = useState<{ teamId: string; password: string; name: string } | null>(() => {
    try {
      const saved = localStorage.getItem('mm_team_auth');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('mm_admin_token');
  });

  const loginTeam = useCallback((teamId: string, password: string, name: string) => {
    const auth = { teamId, password, name };
    setTeamAuth(auth);
    localStorage.setItem('mm_team_auth', JSON.stringify(auth));
  }, []);

  const logoutTeam = useCallback(() => {
    setTeamAuth(null);
    localStorage.removeItem('mm_team_auth');
  }, []);

  const loginAdmin = useCallback((token: string) => {
    setAdminToken(token);
    localStorage.setItem('mm_admin_token', token);
  }, []);

  const logoutAdmin = useCallback(() => {
    setAdminToken(null);
    localStorage.removeItem('mm_admin_token');
  }, []);

  return { teamAuth, adminToken, loginTeam, logoutTeam, loginAdmin, logoutAdmin };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthInternal();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
