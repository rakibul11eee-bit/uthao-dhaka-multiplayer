import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { User } from 'firebase/auth';

type MatchmakingState =
  | { status: 'idle' | 'searching' | 'matched' | 'error'; matchId?: string; opponentName?: string; message?: string };

const API_BASE = (import.meta.env.VITE_MATCHMAKING_SERVER_URL || 'http://localhost:4000').replace(/\/$/, '');

interface Props { user: User | null; onMatchReady?: (matchId: string) => void; onStartGame?: () => void; }

export const MatchmakingPanel: React.FC<Props> = ({ user, onMatchReady, onStartGame }) => {
  const [state, setState] = useState<MatchmakingState>({ status: 'idle' });
  const [busy, setBusy] = useState(false);
  const [socketStatus, setSocketStatus] = useState<'offline' | 'connecting' | 'connected' | 'reconnecting'>('offline');
  const [connectedCount, setConnectedCount] = useState(0);
  const [roomPlayers, setRoomPlayers] = useState<Array<{ playerUid: string; displayName: string }>>([]);
  const pollRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const disconnectRoom = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocketStatus('offline');
    setConnectedCount(0);
    setRoomPlayers([]);
  }, []);

  const leaveQueue = useCallback(async () => {
    if (!user) return;
    stopPolling();
    disconnectRoom();
    try {
      await fetch(`${API_BASE}/matchmaking/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerUid: user.uid }),
      });
    } catch { /* The queue may already have expired or server may be restarting. */ }
    setState({ status: 'idle' });
  }, [user, stopPolling, disconnectRoom]);

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/matchmaking/status/${encodeURIComponent(user.uid)}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = await response.json();
      if (result.status === 'matched') {
        stopPolling();
        setState({ status: 'matched', matchId: result.matchId, opponentName: result.opponent?.displayName || 'Another pilot' });
        onMatchReady?.(result.matchId);
      } else if (result.status === 'searching') {
        setState({ status: 'searching' });
      } else {
        setState({ status: 'idle' });
        stopPolling();
      }
    } catch (error) {
      stopPolling();
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Could not reach matchmaking server.' });
    }
  }, [user, stopPolling, onMatchReady]);

  const findPlayer = useCallback(async () => {
    if (!user || busy) return;
    setBusy(true);
    setState({ status: 'searching' });
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/matchmaking/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ playerUid: user.uid, displayName: user.displayName || 'Dhaka Pilot', photoURL: user.photoURL || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server returned ${response.status}`);
      if (result.status === 'matched') {
        setState({ status: 'matched', matchId: result.matchId, opponentName: result.opponent?.displayName || 'Another pilot' });
        onMatchReady?.(result.matchId);
        return;
      }
      setState({ status: 'searching' });
      stopPolling();
      pollRef.current = window.setInterval(checkStatus, 1500);
      void checkStatus();
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Could not start matchmaking.' });
    } finally {
      setBusy(false);
    }
  }, [user, busy, checkStatus, stopPolling, onMatchReady]);

  // Once paired, both clients connect to the same Socket.IO room.
  useEffect(() => {
    if (state.status !== 'matched' || !state.matchId || !user) return;
    setSocketStatus('connecting');
    const socket = io(API_BASE, { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 8 });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus('connected');
      socket.emit('match:join', { matchId: state.matchId, playerUid: user.uid }, (result: {
        ok: boolean;
        error?: string;
        players?: Array<{ playerUid: string; displayName: string }>;
        connectedPlayerUids?: string[];
      }) => {
        if (!result?.ok) {
          setSocketStatus('offline');
          setState((current) => ({ ...current, status: 'error', message: result?.error || 'Could not join match room.' }));
          return;
        }
        setRoomPlayers(result.players || []);
        setConnectedCount(result.connectedPlayerUids?.length || 0);
      });
    });
    socket.on('disconnect', () => setSocketStatus('reconnecting'));
    socket.io.on('reconnect_attempt', () => setSocketStatus('reconnecting'));
    socket.on('connect_error', () => setSocketStatus('reconnecting'));
    socket.on('match:presence', (payload: { connectedCount: number; connectedPlayerUids: string[] }) => {
      setConnectedCount(payload.connectedCount || 0);
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setSocketStatus('offline');
    };
  }, [state.status, state.matchId, user]);

  useEffect(() => () => {
    stopPolling();
    socketRef.current?.disconnect();
  }, [stopPolling]);

  return (
    <section className="w-full max-w-6xl mb-5 rounded-2xl border border-cyan-700/50 bg-slate-900 p-4 sm:p-5 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-300 text-lg">🌐</span>
            <h2 className="font-bold text-lg">অনলাইন মাল্টিপ্লেয়ার — Random Match</h2>
          </div>
          <p className="text-sm text-slate-300 mt-1">অন্য একজন পাইলটের সঙ্গে স্বয়ংক্রিয়ভাবে ম্যাচ খুঁজুন।</p>
        </div>
        {!user ? (
          <p className="text-sm text-amber-300">প্রথমে Google দিয়ে Login করুন।</p>
        ) : state.status === 'searching' ? (
          <button onClick={leaveQueue} className="rounded-lg bg-rose-600 hover:bg-rose-500 px-5 py-2.5 font-semibold">খোঁজা বাতিল করুন</button>
        ) : state.status === 'matched' ? (
          <button onClick={() => { disconnectRoom(); setState({ status: 'idle' }); }} className="rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 font-bold">ম্যাচ থেকে বের হন</button>
        ) : (
          <button onClick={findPlayer} disabled={busy} className="rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 px-5 py-2.5 font-bold">
            {busy ? 'অপেক্ষা করুন…' : 'Find Random Player'}
          </button>
        )}
      </div>
      {state.status === 'searching' && <p className="mt-3 text-sm text-cyan-200 animate-pulse">অন্য পাইলট খোঁজা হচ্ছে… এই পেজ খোলা রাখুন।</p>}
      {state.status === 'matched' && (
        <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3">
          <p className="font-bold text-emerald-300">প্রতিপক্ষ পাওয়া গেছে!</p>
          <p className="text-sm mt-1">প্রতিপক্ষ: {state.opponentName}</p>
          <p className="text-xs text-slate-400 mt-1">Match ID: {state.matchId}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${socketStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>রুম সংযোগ: {socketStatus === 'connected' ? 'Connected' : socketStatus === 'reconnecting' ? 'Reconnecting…' : socketStatus === 'connecting' ? 'Connecting…' : 'Offline'}</span>
            <span className="text-slate-400">· {connectedCount}/2 players connected</span>
          </div>
          {roomPlayers.length > 0 && (
            <div className="mt-2 text-xs text-slate-300">
              {roomPlayers.map((player) => <div key={player.playerUid}>{player.displayName}{player.playerUid === user.uid ? ' (You)' : ' (Opponent)'}</div>)}
            </div>
          )}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={onStartGame}
              disabled={connectedCount < 2 || socketStatus !== 'connected'}
              className="rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed px-6 py-3 font-extrabold text-slate-950 shadow-lg shadow-emerald-900/20"
            >
              🚁 Start Game / খেলা শুরু করুন
            </button>
            <p className="text-xs text-amber-200">
              {connectedCount >= 2 && socketStatus === 'connected'
                ? 'দুইজন পাইলটই সংযুক্ত। Start Game চাপুন।'
                : 'Start Game চালু করতে দুইজন খেলোয়াড়ের সংযোগের জন্য অপেক্ষা করুন।'}
            </p>
          </div>
        </div>
      )}
      {state.status === 'error' && <p role="alert" className="mt-3 text-sm text-rose-300">সংযোগ সমস্যা: {state.message}. Backend server চালু আছে কি না দেখুন।</p>}
    </section>
  );
};
