import React from 'react';
import { LogIn, LogOut, UserCircle2 } from 'lucide-react';
import type { User } from 'firebase/auth';

interface AuthPanelProps {
  user: User | null;
  loading: boolean;
  error: string | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ user, loading, error, onLogin, onLogout }) => (
  <div className="w-full max-w-6xl mb-4 rounded-xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 text-slate-100">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="h-10 w-10 rounded-full border border-slate-700" referrerPolicy="no-referrer" />
        ) : (
          <UserCircle2 className="h-10 w-10 text-slate-400" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold">{user ? (user.displayName || 'Player') : 'Online Player Account'}</p>
          <p className="max-w-[70vw] truncate text-xs text-slate-400">{user ? user.email : 'Sign in with Google to access online multiplayer'}</p>
        </div>
      </div>
      {user ? (
        <button type="button" onClick={onLogout} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-60">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      ) : (
        <button type="button" onClick={onLogin} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-60">
          <LogIn className="h-4 w-4" /> {loading ? 'Connecting...' : 'Continue with Google'}
        </button>
      )}
    </div>
    {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
  </div>
);
