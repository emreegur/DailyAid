import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userId: string | null;
  fullName: string | null;
  role: string | null;
  setAuth: (token: string, userId: string, fullName: string, role: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  userId: null,
  fullName: null,
  role: null,
  setAuth: (token, userId, fullName, role) => {
    try { 
      window.localStorage.setItem('token', token); 
      window.localStorage.setItem('dailyaid-auth', JSON.stringify({ state: { token, userId, fullName, role } }));
    } catch {}
    set({ token, userId, fullName, role });
  },
  logout: () => {
    try { 
      window.localStorage.removeItem('token'); 
      window.localStorage.removeItem('dailyaid-auth');
    } catch {}
    set({ token: null, userId: null, fullName: null, role: null });
  },
  isAuthenticated: () => !!get().token,
  // Call this in a useEffect after mount to restore session
  hydrate: () => {
    try {
      const stored = window.localStorage.getItem('dailyaid-auth');
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.token) set(state);
      }
    } catch {}
  },
}));
