import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import {
  AIHelicopterState,
  ControlInput,
  DhakaRoute,
  DialogueBannerItem,
  FloatingToast,
  GameMode,
  GameState,
  GameStats,
  HelicopterState,
  MetroTrain,
  Passenger,
  RouteDirection,
  RouteId,
  StopId,
  TrafficVehicle,
  TrafficVehicleType,
  WalkingPassengerAnim,
} from './types/game';
import {
  AI_CRUISE_SPEED,
  CRUISE_SPEED,
  DHAKA_ROUTES,
  HELPER_CALLOUTS_BN,
  HORIZONTAL_ROADS,
  MAP_HEIGHT,
  MAP_WIDTH,
  ROOFTOP_PADS,
  SHIFT_DURATION_SEC,
  VERTICAL_ROADS,
  createDirectionalPassengerForPad,
  getRouteById,
  getStopById,
  populateWaitingForRoute,
  toBanglaDigits,
} from './data/dhakaData';
import { renderDhakaIsoScene } from './utils/dhakaRenderer';
import { soundEngine } from './utils/soundEngine';
import { TitleScreen } from './components/TitleScreen';
import { HudBar } from './components/HudBar';
import { DhakaMiniMap } from './components/DhakaMiniMap';
import { CabinInteriorView } from './components/CabinInteriorView';
import { NavigationControls } from './components/NavigationControls';
import { LiveDialogueBanner } from './components/LiveDialogueBanner';
import { BargainModal } from './components/BargainModal';
import { GameOverModal } from './components/GameOverModal';
import { Play, RotateCcw, Home, Flag } from 'lucide-react';

const BEST_SCORE_KEY = 'uthao_dhaka_best_cash_v4';

function createInitialTraffic(): TrafficVehicle[] {
  const vehicles: TrafficVehicle[] = [];
  // Heavy concentration of Bus, Rickshaw, Truck, and Lorry (+ CNG, Car, Bike)
  const types: TrafficVehicleType[] = [
    'bus',
    'rickshaw',
    'truck',
    'lorry',
    'rickshaw',
    'bus',
    'truck',
    'cng',
    'lorry',
    'rickshaw',
    'car',
    'bike',
  ];
  const busColors = ['#DC2626', '#16A34A', '#2563EB', '#EAB308', '#0284C7'];
  const truckColors = ['#EA580C', '#D97706', '#DC2626', '#16A34A', '#2563EB'];
  const truckTarpColors = ['#1D4ED8', '#F59E0B', '#0284C7', '#15803D'];
  const lorryCabColors = ['#0284C7', '#DC2626', '#EAB308', '#4F46E5', '#0D9488'];
  const lorryBoxColors = ['#F8FAFC', '#E2E8F0', '#DBEAFE', '#FEF3C7'];
  const rickshawColors = ['#E11D48', '#D97706', '#7C3AED', '#0D9488', '#2563EB'];
  const carColors = ['#FACC15', '#F8FAFC', '#334155', '#1D4ED8', '#EF4444'];
  const initialHonkLines = [
    'জ্যাম রে ভাই!',
    'এই রিকশা সাইড দে!',
    'ট্রাক আটকে গেছে!',
    'লরি সরাও!',
    'বাস সামনে জ্যাম!',
    'পোঁ পোঁ!',
    'ক্রিং ক্রিং!',
  ];

  let seq = 1;
  const allRoads: { axis: 'H' | 'V'; coord: number }[] = [
    ...HORIZONTAL_ROADS.map((coord) => ({ axis: 'H' as const, coord })),
    ...VERTICAL_ROADS.map((coord) => ({ axis: 'V' as const, coord })),
  ];

  // 72 vehicles per road (36 per direction across 3 packed sub-lanes) = 1,728 vehicles forming continuous traffic jams everywhere!
  for (const road of allRoads) {
    const maxPos = road.axis === 'H' ? MAP_WIDTH : MAP_HEIGHT;

    for (const dir of [1, -1] as const) {
      for (let laneIdx = 0; laneIdx < 3; laneIdx++) {
        const vehiclesPerSubLane = 12;
        const spacing = (maxPos - 400) / vehiclesPerSubLane;

        for (let k = 0; k < vehiclesPerSubLane; k++) {
          const idx = seq;
          const type = types[(k + laneIdx * 3 + Math.floor(road.coord / 1260)) % types.length];
          const maxSpeed =
            type === 'rickshaw'
              ? 18 + Math.random() * 10
              : type === 'lorry'
                ? 28 + Math.random() * 10
                : type === 'truck'
                  ? 32 + Math.random() * 12
                  : type === 'bus'
                    ? 36 + Math.random() * 14
                    : type === 'cng'
                      ? 44 + Math.random() * 14
                      : type === 'bike'
                        ? 58 + Math.random() * 16
                        : 48 + Math.random() * 14;

          const color =
            type === 'rickshaw'
              ? rickshawColors[idx % rickshawColors.length]
              : type === 'bus'
                ? busColors[idx % busColors.length]
                : type === 'truck'
                  ? truckColors[idx % truckColors.length]
                  : type === 'lorry'
                    ? lorryCabColors[idx % lorryCabColors.length]
                    : type === 'cng'
                      ? '#15803D'
                      : carColors[idx % carColors.length];

          const secondaryColor =
            type === 'truck'
              ? truckTarpColors[idx % truckTarpColors.length]
              : type === 'lorry'
                ? lorryBoxColors[idx % lorryBoxColors.length]
                : '#F8FAFC';

          const pos = Math.max(
            140,
            Math.min(maxPos - 140, 220 + k * spacing + (laneIdx - 1) * 28 + (idx % 5) * 9)
          );

          vehicles.push({
            id: seq++,
            type,
            roadAxis: road.axis,
            roadCoord: road.coord,
            pos,
            dir,
            laneIdx,
            speed: maxSpeed * 0.15,
            maxSpeed,
            color,
            secondaryColor,
            honkTimer: k % 4 === 0 ? 1.5 + (idx % 3) * 0.5 : 0,
            honkText: initialHonkLines[idx % initialHonkLines.length],
          });
        }
      }
    }
  }
  return vehicles;
}

function createInitialHeliForRoute(route: DhakaRoute): HelicopterState {
  const startStop = getStopById(route.stops[0]);
  const nextStop = getStopById(route.stops[1] ?? route.stops[0]);
  const angle = Math.atan2(nextStop.y - startStop.y, nextStop.x - startStop.x);
  return {
    x: startStop.x,
    y: startStop.y,
    vx: 0,
    vy: 0,
    altitude: 0,
    targetAltitude: 0,
    headingAngle: angle,
    rotorAngle: 0,
    landedPadId: `${startStop.id}_hub`,
    fuel: 100,
    hull: 100,
    seats: [null, null, null],
    helperCallingTimer: 0,
    helperCallText: '',
    autoCruise: false,
    cruiseDir: { dx: Math.cos(angle), dy: Math.sin(angle) },
  };
}

function createInitialAiHeliForRoute(route: DhakaRoute): AIHelicopterState {
  const startStop = getStopById(route.stops[0]);
  const nextStop = getStopById(route.stops[1] ?? route.stops[0]);
  const angle = Math.atan2(nextStop.y - startStop.y, nextStop.x - startStop.x);
  return {
    x: startStop.x - 160,
    y: startStop.y + 110,
    vx: 0,
    vy: 0,
    altitude: 0,
    targetAltitude: 0,
    headingAngle: angle,
    rotorAngle: 0,
    routeDir: 'FORWARD',
    landedPadId: `${startStop.id}_hub`,
    targetStopId: startStop.id,
    dwellTimer: 1.2,
    seats: [null, null, null],
    cash: 0,
    tripsCompleted: 0,
    statusTextBn: 'প্রস্তুত হচ্ছে',
  };
}

function pickNextAITarget(
  ai: AIHelicopterState,
  route: DhakaRoute,
  waitingMap: Record<string, Passenger[]>
): StopId {
  const ordered = ai.routeDir === 'FORWARD' ? route.stops : [...route.stops].reverse();
  const currentPosIdx = ordered.reduce((bestIdx, stopId, i) => {
    const curBest = getStopById(ordered[bestIdx]);
    const cand = getStopById(stopId);
    return Math.hypot(cand.x - ai.x, cand.y - ai.y) <
      Math.hypot(curBest.x - ai.x, curBest.y - ai.y)
      ? i
      : bestIdx;
  }, 0);

  const seatedDests = new Set(
    ai.seats.filter((s): s is Passenger => s !== null).map((s) => s.destinationId)
  );
  const freeSeats = ai.seats.filter((s) => s === null).length;

  // Earliest destination ahead for seated passengers
  let earliestDropIdx = Infinity;
  for (let i = currentPosIdx + 1; i < ordered.length; i++) {
    if (seatedDests.has(ordered[i])) {
      earliestDropIdx = i;
      break;
    }
  }

  // If seats available, check if there's an intermediate stop with waiting passengers before earliestDropIdx
  if (freeSeats > 0) {
    const searchLimit = Math.min(ordered.length - 1, earliestDropIdx);
    for (let i = currentPosIdx + 1; i < searchLimit; i++) {
      const w = waitingMap[`${ordered[i]}_hub`] ?? [];
      if (w.some((p) => p.direction === ai.routeDir)) {
        return ordered[i];
      }
    }
  }

  if (earliestDropIdx < ordered.length) {
    return ordered[earliestDropIdx];
  }

  // Otherwise head toward the end terminal to flip direction!
  return ordered[ordered.length - 1];
}

// Convert screen direction (sx, sy) to isometric world unit vector
function screenDirToWorld(sx: number, sy: number) {
  const wx = sx + sy;
  const wy = sy - sx;
  const len = Math.hypot(wx, wy) || 1;
  return { dx: wx / len, dy: wy / len };
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthError(null);
    });
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [onlineMatchId, setOnlineMatchId] = useState<string | null>(null);
  const [onlineRemoteHeli, setOnlineRemoteHeli] = useState<HelicopterState | null>(null);
  const [onlineSecondsLeft, setOnlineSecondsLeft] = useState<number | null>(null);
  const [onlineOpponentScore, setOnlineOpponentScore] = useState(0);
  const [onlineMatchResult, setOnlineMatchResult] = useState<{ winnerUid: string | null; scores: Record<string, number>; reason: 'TIME_UP' | 'FORFEIT' | 'DISCONNECT' } | null>(null);
  const onlineSocketRef = useRef<Socket | null>(null);
  const onlineLastSendRef = useRef(0);
  const [mode, setMode] = useState<GameMode>('COMPETITION');
  const [selectedRouteId, setSelectedRouteId] = useState<RouteId>('abdullahpur_gabtoli');
  const [routeDirection, setRouteDirection] = useState<RouteDirection>('FORWARD');
  const [muted, setMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [highlightedDestId, setHighlightedDestId] = useState<StopId | null>(null);
  const [gameOverReason, setGameOverReason] = useState<
    'TIME_UP' | 'OUT_OF_FUEL' | 'CRASHED' | 'SESSION_ENDED'
  >('TIME_UP');
  const [liveDialogue, setLiveDialogue] = useState<DialogueBannerItem | null>(null);

  // Keep the match socket owned by the game shell so it survives the title screen.
  useEffect(() => {
    if (!onlineMatchId || !authUser) return;
    const base = (import.meta.env.VITE_MATCHMAKING_SERVER_URL || 'http://localhost:4000').replace(/\/$/, '');
    const socket = io(base, { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: Infinity });
    onlineSocketRef.current = socket;
    socket.on('connect', () => socket.emit('match:join', { matchId: onlineMatchId, playerUid: authUser.uid }));
    socket.on('match:state', (payload: { playerUid: string; heli: any; score: number }) => {
      if (payload.playerUid === authUser.uid || !payload.heli) return;
      setOnlineOpponentScore(Number(payload.score) || 0);
      const h = payload.heli;
      setOnlineRemoteHeli({ x: Number(h.x)||0, y: Number(h.y)||0, vx: Number(h.vx)||0, vy: Number(h.vy)||0, altitude: Number(h.altitude)||0, targetAltitude: Number(h.targetAltitude)||0, headingAngle: Number(h.headingAngle)||0, rotorAngle: Number(h.rotorAngle)||0, landedPadId: typeof h.landedPadId === 'string' ? h.landedPadId : null, fuel: 100, hull: 100, seats: [null,null,null,null], helperCallingTimer: 0, helperCallText: '', autoCruise: Boolean(h.autoCruise), cruiseDir: { dx: Number(h.cruiseDir?.dx)||0, dy: Number(h.cruiseDir?.dy)||0 } });
    });
    socket.on('match:clock', (payload: { endsAt: number }) => { const tick = () => setOnlineSecondsLeft(Math.max(0, Math.ceil((payload.endsAt-Date.now())/1000))); tick(); const timer = window.setInterval(tick, 500); socket.once('match:result', () => window.clearInterval(timer)); socket.once('disconnect', () => window.clearInterval(timer)); });
    socket.on('match:result', (payload: { winnerUid: string|null; scores: Record<string,number>; reason?: 'TIME_UP' | 'FORFEIT' | 'DISCONNECT' }) => {
      setOnlineSecondsLeft(0);
      const my = payload.scores?.[authUser.uid] ?? 0;
      const other = Object.entries(payload.scores || {}).find(([uid]) => uid !== authUser.uid)?.[1] ?? 0;
      setOnlineMatchResult({
        winnerUid: payload.winnerUid,
        scores: payload.scores || {},
        reason: payload.reason || 'TIME_UP',
      });
      setHudStats((old) => ({ ...old, cash: my, aiCash: other, timeRemainingSec: 0 }));
      setGameOverReason('TIME_UP');
      setGameState('GAME_OVER');
    });
    socket.on('disconnect', () => setOnlineRemoteHeli(null));
    return () => { socket.disconnect(); if (onlineSocketRef.current === socket) onlineSocketRef.current = null; };
  }, [onlineMatchId, authUser]);

  const handleMatchReady = useCallback((matchId: string) => {
    setOnlineMatchResult(null);
    setOnlineRemoteHeli(null);
    setOnlineSecondsLeft(null);
    setOnlineOpponentScore(0);
    setOnlineMatchId(matchId);
  }, []);

  const [bestShiftCash, setBestShiftCash] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(BEST_SCORE_KEY);
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const activeRoute = getRouteById(selectedRouteId);

  const [hudHeli, setHudHeli] = useState<HelicopterState>(() =>
    createInitialHeliForRoute(DHAKA_ROUTES[0])
  );
  const [hudAiHeli, setHudAiHeli] = useState<AIHelicopterState>(() =>
    createInitialAiHeliForRoute(DHAKA_ROUTES[0])
  );
  const [hudStats, setHudStats] = useState<GameStats>({
    cash: 0,
    tripsCompleted: 0,
    perfectLandings: 0,
    bargainBonusEarned: 0,
    bestShiftCash,
    timeRemainingSec: SHIFT_DURATION_SEC,
    aiCash: 0,
    aiTripsCompleted: 0,
  });
  const [waitingByPad, setWaitingByPad] = useState<Record<string, Passenger[]>>(() =>
    populateWaitingForRoute(DHAKA_ROUTES[0], 'FORWARD')
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef({ width: 1280, height: 680 });

  const routeDirectionRef = useRef<RouteDirection>('FORWARD');
  const heliRef = useRef<HelicopterState>(createInitialHeliForRoute(DHAKA_ROUTES[0]));
  const aiHeliRef = useRef<AIHelicopterState>(createInitialAiHeliForRoute(DHAKA_ROUTES[0]));
  const waitingRef = useRef<Record<string, Passenger[]>>(waitingByPad);
  const statsRef = useRef<GameStats>(hudStats);
  const vehiclesRef = useRef<TrafficVehicle[]>(createInitialTraffic());
  const metroRef = useRef<MetroTrain[]>([
    { progress: 0.12, dir: 1 },
    { progress: 0.78, dir: -1 },
  ]);
  const walkingAnimsRef = useRef<WalkingPassengerAnim[]>([]);
  const toastsRef = useRef<FloatingToast[]>([]);
  const seqRef = useRef(1);
  const controlsRef = useRef<ControlInput>({ up: false, down: false, left: false, right: false });
  const cameraRef = useRef({ x: heliRef.current.x, y: heliRef.current.y });
  const simTimeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const nearbyCalloutTimerRef = useRef(0);
  const lastHudSyncRef = useRef(0);
  const dialogueTimeoutRef = useRef<number | null>(null);
  const autoOpenBargainTimerRef = useRef<number | null>(null);

  const pushDialogue = useCallback(
    (role: 'driver' | 'helper' | 'passenger', speakerName: string, text: string) => {
      if (dialogueTimeoutRef.current) {
        window.clearTimeout(dialogueTimeoutRef.current);
      }
      setLiveDialogue({
        id: seqRef.current++,
        speakerRole: role,
        speakerName,
        text,
      });
      soundEngine.speakBangla(text, role);
      dialogueTimeoutRef.current = window.setTimeout(() => {
        setLiveDialogue(null);
      }, 4200);
    },
    []
  );

  const addToast = useCallback((x: number, y: number, z: number, text: string, color = '#FDE047') => {
    toastsRef.current.push({
      id: seqRef.current++,
      x,
      y,
      z,
      text,
      color,
      life: 1.7,
    });
  }, []);

  const syncHudNow = useCallback(() => {
    setHudHeli({
      ...heliRef.current,
      seats: [...heliRef.current.seats],
      cruiseDir: { ...heliRef.current.cruiseDir },
    });
    setHudAiHeli({
      ...aiHeliRef.current,
      seats: [...aiHeliRef.current.seats],
    });
    setHudStats({
      ...statsRef.current,
      aiCash: aiHeliRef.current.cash,
      aiTripsCompleted: aiHeliRef.current.tripsCompleted,
    });
    setWaitingByPad({ ...waitingRef.current });
  }, []);

  const triggerGameOver = useCallback(
    (reason: 'TIME_UP' | 'OUT_OF_FUEL' | 'CRASHED' | 'SESSION_ENDED') => {
      soundEngine.stopSpeech();
      soundEngine.updateHeliEngine('OFF');
      setGameOverReason(reason);
      statsRef.current.aiCash = aiHeliRef.current.cash;
      statsRef.current.aiTripsCompleted = aiHeliRef.current.tripsCompleted;
      const earned = statsRef.current.cash;
      if (earned > statsRef.current.bestShiftCash) {
        statsRef.current.bestShiftCash = earned;
        setBestShiftCash(earned);
        try {
          localStorage.setItem(BEST_SCORE_KEY, String(earned));
        } catch {
          // ignore
        }
      }
      syncHudNow();
      setGameState('GAME_OVER');
    },
    [syncHudNow]
  );

  const startNewGame = useCallback(() => {
    if (autoOpenBargainTimerRef.current) {
      window.clearTimeout(autoOpenBargainTimerRef.current);
      autoOpenBargainTimerRef.current = null;
    }
    const route = getRouteById(selectedRouteId);
    const freshHeli = createInitialHeliForRoute(route);
    const freshAi = createInitialAiHeliForRoute(route);
    const freshWaiting = populateWaitingForRoute(route, 'FORWARD');
    const freshStats: GameStats = {
      cash: 0,
      tripsCompleted: 0,
      perfectLandings: 0,
      bargainBonusEarned: 0,
      bestShiftCash,
      timeRemainingSec: SHIFT_DURATION_SEC,
      aiCash: 0,
      aiTripsCompleted: 0,
    };

    routeDirectionRef.current = 'FORWARD';
    setRouteDirection('FORWARD');
    heliRef.current = freshHeli;
    aiHeliRef.current = freshAi;
    waitingRef.current = freshWaiting;
    statsRef.current = freshStats;
    vehiclesRef.current = createInitialTraffic();
    walkingAnimsRef.current = [];
    toastsRef.current = [];
    controlsRef.current = { up: false, down: false, left: false, right: false };
    cameraRef.current = { x: freshHeli.x, y: freshHeli.y };
    simTimeRef.current = 0;
    setHighlightedDestId(null);
    setHudHeli(freshHeli);
    setHudAiHeli(freshAi);
    setWaitingByPad(freshWaiting);
    setHudStats(freshStats);
    soundEngine.playClick();
    pushDialogue(
      'helper',
      'হেল্পার',
      `উঠেন উঠেন! ${route.startNameBn} থেকে ${route.endNameBn} রুটে হেলিকপ্টার ছাড়ছে!`
    );
    setGameState('PLAYING');
  }, [selectedRouteId, bestShiftCash, pushDialogue]);

  const handleOnlineStartGame = useCallback(() => {
    startNewGame();
    onlineSocketRef.current?.emit('match:ready');
  }, [startNewGame]);

  const handleFinishSession = useCallback(() => {
    if (onlineMatchId && onlineSocketRef.current?.connected) {
      onlineSocketRef.current.emit('match:forfeit');
      setGameOverReason('SESSION_ENDED');
      setGameState('GAME_OVER');
      return;
    }
    triggerGameOver('SESSION_ENDED');
  }, [onlineMatchId, triggerGameOver]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.muted = next;
      if (next) {
        soundEngine.stopSpeech();
        soundEngine.updateHeliEngine('OFF');
      }
      return next;
    });
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      soundEngine.voiceEnabled = next;
      if (!next) soundEngine.stopSpeech();
      return next;
    });
  }, []);

  // Sticky Navigation Handlers
  const handleStartFly = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const h = heliRef.current;
    const wasLanded = Boolean(h.landedPadId);
    h.landedPadId = null;
    h.targetAltitude = 100;
    h.autoCruise = true;
    if (wasLanded) {
      soundEngine.playHeliLiftOff();
    } else {
      soundEngine.playClick();
    }
    if (h.cruiseDir.dx === 0 && h.cruiseDir.dy === 0) {
      h.cruiseDir = screenDirToWorld(0, -1);
    }
    syncHudNow();
  }, [gameState, syncHudNow]);

  const handleSelectScreenDirection = useCallback(
    (sx: number, sy: number) => {
      if (gameState !== 'PLAYING') return;
      const h = heliRef.current;
      const wasLanded = Boolean(h.landedPadId);
      h.cruiseDir = screenDirToWorld(sx, sy);
      h.landedPadId = null;
      h.targetAltitude = 100;
      h.autoCruise = true;
      if (wasLanded) {
        soundEngine.playHeliLiftOff();
      } else {
        soundEngine.playClick();
      }
      syncHudNow();
    },
    [gameState, syncHudNow]
  );

  const handleHoverStop = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const h = heliRef.current;
    if (h.landedPadId) return;
    const wasMoving = h.autoCruise || h.targetAltitude === 0;
    h.autoCruise = false;
    h.targetAltitude = 100;
    if (wasMoving) {
      soundEngine.playHeliStop();
    } else {
      soundEngine.playClick();
    }
    syncHudNow();
  }, [gameState, syncHudNow]);

  const handleLand = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const h = heliRef.current;
    if (h.landedPadId) return;
    h.autoCruise = false;
    h.vx = 0;
    h.vy = 0;
    h.targetAltitude = 0;
    soundEngine.playHeliStop();
    syncHudNow();
  }, [gameState, syncHudNow]);

  const triggerHelperCallout = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const h = heliRef.current;
    const line = HELPER_CALLOUTS_BN[Math.floor(Math.random() * HELPER_CALLOUTS_BN.length)];
    h.helperCallingTimer = 3.0;
    h.helperCallText = line;
    soundEngine.playHelperHorn();
    pushDialogue('helper', 'হেল্পার', line);

    const route = getRouteById(selectedRouteId);
    const dir = routeDirectionRef.current;
    let nearestPad = null;
    let minD = Infinity;
    for (const stopId of route.stops) {
      const pad = ROOFTOP_PADS.find((p) => p.zoneId === stopId);
      if (!pad) continue;
      const d = Math.hypot(pad.x - h.x, pad.y - h.y);
      if (d < minD) {
        minD = d;
        nearestPad = pad;
      }
    }
    if (nearestPad && minD < 1800) {
      const list = waitingRef.current[nearestPad.padId] ?? [];
      if (list.length < 3) {
        const extraP = createDirectionalPassengerForPad(nearestPad, route, dir);
        if (extraP) {
          waitingRef.current = {
            ...waitingRef.current,
            [nearestPad.padId]: [...list, extraP],
          };
          setWaitingByPad({ ...waitingRef.current });
          addToast(
            nearestPad.x,
            nearestPad.y,
            nearestPad.height + 55,
            `${nearestPad.zoneNameBn}-এ নতুন যাত্রী ডাকে!`,
            '#FBBF24'
          );
        }
      }
    }
  }, [gameState, selectedRouteId, addToast, pushDialogue]);

  const openBargainIfReady = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const h = heliRef.current;
    if (!h.landedPadId) return;
    const waiting = waitingRef.current[h.landedPadId] ?? [];
    const freeSeats = h.seats.filter((s) => s === null).length;
    if (waiting.length > 0 && freeSeats > 0) {
      controlsRef.current = { up: false, down: false, left: false, right: false };
      setGameState('BARGAINING');
    } else if (freeSeats === 0) {
      addToast(h.x, h.y, 180, '৩টি আসনই পূর্ণ! যাত্রী নামিয়ে আসুন!', '#FCA5A5');
    } else {
      addToast(h.x, h.y, 180, 'এই ছাদে এখন এই দিকের যাত্রী নেই! সামনের স্টপেজে যান', '#FDE68A');
    }
  }, [gameState, addToast]);

  const handleRefuelRepair = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const h = heliRef.current;
    if (!h.landedPadId) return;
    const pad = ROOFTOP_PADS.find((p) => p.padId === h.landedPadId);
    if (!pad) return;

    const needsFuel = h.fuel < 98;
    const needsHull = h.hull < 98;
    if (!needsFuel && !needsHull) {
      addToast(h.x, h.y, pad.height + 50, 'হেলিকপ্টার ও তেল একদম ঠিক আছে!', '#34D399');
      return;
    }

    const cost = pad.hasDepot ? 30 : 50;
    if (statsRef.current.cash < cost && h.fuel > 20) {
      addToast(h.x, h.y, pad.height + 50, `খরচ ৳${toBanglaDigits(cost)} লাগবে!`, '#FCA5A5');
      return;
    }

    statsRef.current.cash = Math.max(0, statsRef.current.cash - cost);
    h.fuel = 100;
    h.hull = 100;
    soundEngine.playBargainAccept();
    addToast(
      h.x,
      h.y,
      pad.height + 55,
      pad.hasDepot ? 'ডিপো সার্ভিস: ফুল ট্যাংক ও মেরামত!' : 'জরুরি তেল ও মেরামত সম্পন্ন!',
      '#34D399'
    );
    syncHudNow();
  }, [gameState, addToast, syncHudNow]);

  const handleAcceptPassenger = useCallback(
    (passenger: Passenger, finalFare: number) => {
      const h = heliRef.current;
      const emptyIdx = h.seats.findIndex((s) => s === null);
      if (emptyIdx === -1) return;

      const boarded: Passenger = {
        ...passenger,
        agreedFare: finalFare,
      };
      h.seats[emptyIdx] = boarded;

      const padList = waitingRef.current[passenger.originPadId] ?? [];
      const remaining = padList.filter((item) => item.id !== passenger.id);
      waitingRef.current = {
        ...waitingRef.current,
        [passenger.originPadId]: remaining,
      };

      const pad = ROOFTOP_PADS.find((p) => p.padId === passenger.originPadId);
      if (pad) {
        walkingAnimsRef.current.push({
          id: `walk_in_${seqRef.current++}`,
          kind: 'boarding',
          nameBn: passenger.nameBn,
          shirtColor: passenger.shirtColor,
          skinColor: passenger.skinColor,
          startX: pad.x + 48,
          startY: pad.y + 32,
          startZ: pad.height + 2,
          endX: h.x,
          endY: h.y,
          endZ: pad.height + 6,
          progress: 0,
        });
      }

      const extraGain = Math.max(0, finalFare - passenger.initialOffer);
      statsRef.current.bargainBonusEarned += extraGain;

      addToast(
        h.x,
        h.y,
        (pad?.height ?? 120) + 60,
        `${passenger.nameBn} উঠছেন → ${passenger.destinationNameBn} (৳${toBanglaDigits(finalFare)})`,
        '#34D399'
      );

      syncHudNow();

      const stillFree = h.seats.some((s) => s === null);
      if (!stillFree || remaining.length === 0) {
        setGameState('PLAYING');
      }
    },
    [addToast, syncHudNow]
  );

  const handleRejectPassenger = useCallback(
    (passengerId: string) => {
      const padId = heliRef.current.landedPadId;
      if (!padId) return;
      const list = waitingRef.current[padId] ?? [];
      const remaining = list.filter((item) => item.id !== passengerId);
      waitingRef.current = {
        ...waitingRef.current,
        [padId]: remaining,
      };
      syncHudNow();
      if (remaining.length === 0) {
        setGameState('PLAYING');
      }
    },
    [syncHudNow]
  );

  // Keyboard Listeners (WASD / Arrows mapped to screen axes)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'PLAYING') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW') controlsRef.current.up = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') controlsRef.current.down = true;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') controlsRef.current.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') controlsRef.current.right = true;
        if (e.code === 'Space') triggerHelperCallout();
        if (e.code === 'KeyE' || e.code === 'KeyB') openBargainIfReady();
        if (e.code === 'KeyF') handleRefuelRepair();
        if (e.code === 'KeyL') handleLand();
        if (e.code === 'KeyH') handleHoverStop();
        if (e.code === 'Escape' || e.code === 'KeyP') {
          controlsRef.current = { up: false, down: false, left: false, right: false };
          setGameState('PAUSED');
        }
      } else if (gameState === 'PAUSED' && (e.code === 'Escape' || e.code === 'KeyP')) {
        setGameState('PLAYING');
      } else if (gameState === 'BARGAINING' && e.code === 'Escape') {
        setGameState('PLAYING');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') controlsRef.current.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') controlsRef.current.down = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') controlsRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') controlsRef.current.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameState, triggerHelperCallout, openBargainIfReady, handleRefuelRepair, handleLand, handleHoverStop]);

  // Canvas ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(280, Math.floor(rect.height));
      viewportRef.current = { width: w, height: h };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [gameState]);

  // Main 60FPS Simulation Loop
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'BARGAINING' && gameState !== 'PAUSED') {
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const route = getRouteById(selectedRouteId);
      const isSimActive = gameState === 'PLAYING';
      if (isSimActive) {
        simTimeRef.current += dt;
      }

      const timeSec = simTimeRef.current;
      const signalGreen = Math.floor(timeSec % 22) < 9;

      if (isSimActive) {
        if (mode === 'COMPETITION' && !onlineMatchId) {
          statsRef.current.timeRemainingSec = Math.max(0, statsRef.current.timeRemainingSec - dt);
          if (statsRef.current.timeRemainingSec <= 0) {
            triggerGameOver('TIME_UP');
            return;
          }
        }

        const h = heliRef.current;
        const ctrl = controlsRef.current;

        if (h.helperCallingTimer > 0) {
          h.helperCallingTimer = Math.max(0, h.helperCallingTimer - dt);
        }

        // Convert keyboard WASD / Arrow screen inputs into isometric world direction
        const keySX = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
        const keySY = (ctrl.down ? 1 : 0) - (ctrl.up ? 1 : 0);
        if (keySX !== 0 || keySY !== 0) {
          const wasLanded = Boolean(h.landedPadId);
          h.cruiseDir = screenDirToWorld(keySX, keySY);
          h.landedPadId = null;
          h.targetAltitude = 100;
          h.autoCruise = true;
          if (wasLanded) {
            soundEngine.playHeliLiftOff();
          }
        }

        if (!h.landedPadId) {
          const altDiff = h.targetAltitude - h.altitude;
          const altRate = h.targetAltitude > h.altitude ? 75 : 65;
          if (Math.abs(altDiff) <= altRate * dt) {
            h.altitude = h.targetAltitude;
          } else {
            h.altitude += Math.sign(altDiff) * altRate * dt;
          }

          h.rotorAngle += dt * (h.fuel > 0 ? 26 : 10);

          // Check Rooftop Touchdown across any Dhaka Stop Pad
          if (h.targetAltitude === 0 && h.altitude <= 1) {
            const pad = ROOFTOP_PADS.find(
              (p) =>
                Math.abs(p.x - h.x) <= p.width * 0.65 &&
                Math.abs(p.y - h.y) <= p.depth * 0.65
            );

            if (pad) {
              h.altitude = 0;
              h.vx = 0;
              h.vy = 0;
              h.x = pad.x;
              h.y = pad.y;
              h.landedPadId = pad.padId;
              h.autoCruise = false;
              soundEngine.playTouchdown(true);
              soundEngine.playHeliLandedShutoff();

              // Drop off seated passengers whose destination matches this stop
              let droppedCount = 0;
              let earnedHere = 0;
              h.seats = h.seats.map((seat) => {
                if (seat && seat.destinationId === pad.zoneId) {
                  droppedCount++;
                  const tip = 20;
                  earnedHere += seat.agreedFare + tip;

                  walkingAnimsRef.current.push({
                    id: `walk_out_${seqRef.current++}`,
                    kind: 'deboarding',
                    nameBn: seat.nameBn,
                    shirtColor: seat.shirtColor,
                    skinColor: seat.skinColor,
                    startX: pad.x,
                    startY: pad.y,
                    startZ: pad.height + 2,
                    endX: pad.x + pad.width * 0.35,
                    endY: pad.y + pad.depth * 0.35,
                    endZ: pad.height + 2,
                    progress: 0,
                    fareText: `৳${toBanglaDigits(seat.agreedFare + tip)}`,
                  });
                  return null;
                }
                return seat;
              });

              if (droppedCount > 0) {
                statsRef.current.cash += earnedHere;
                statsRef.current.tripsCompleted += droppedCount;
                statsRef.current.perfectLandings += 1;
                soundEngine.playCashRegister();
                const thankMsg = `ধন্যবাদ ওস্তাদ! ${toBanglaDigits(earnedHere)} টাকা দিলাম!`;
                pushDialogue('passenger', 'যাত্রী', thankMsg);
                addToast(
                  h.x,
                  h.y,
                  pad.height + 70,
                  `+${toBanglaDigits(earnedHere)}৳ (${toBanglaDigits(droppedCount)} জন নামলেন!)`,
                  '#34D399'
                );
              } else {
                addToast(h.x, h.y, pad.height + 55, `${pad.labelBn}-এ অবতরণ সফল ✓`, '#34D399');
              }

              // Check if player landed on the Final Terminal of the active direction!
              const curDir = routeDirectionRef.current;
              const endTerminalStopId =
                curDir === 'FORWARD' ? route.stops[route.stops.length - 1] : route.stops[0];

              if (pad.zoneId === endTerminalStopId) {
                const newDir: RouteDirection = curDir === 'FORWARD' ? 'RETURN' : 'FORWARD';
                routeDirectionRef.current = newDir;
                setRouteDirection(newDir);
                waitingRef.current = populateWaitingForRoute(route, newDir);
                const turnMsg =
                  newDir === 'RETURN'
                    ? `${pad.zoneNameBn} টার্মিনালে পৌঁছেছেন! এবার ফেরার ট্রিপ: ${route.endNameBn} → ${route.startNameBn}`
                    : `${pad.zoneNameBn} টার্মিনালে পৌঁছেছেন! আবার যাওয়ার ট্রিপ: ${route.startNameBn} → ${route.endNameBn}`;
                soundEngine.playBargainAccept();
                pushDialogue('helper', 'রুট ঘোষণা', turnMsg);
                addToast(h.x, h.y, pad.height + 100, 'রুট ঘুরে গেছে — ফিরতি যাত্রী উঠবে!', '#FDE047');
              }

              if (h.fuel <= 5 && !pad.hasDepot && statsRef.current.cash < 50) {
                h.fuel = 40;
                addToast(h.x, h.y, pad.height + 85, 'জরুরি রিজার্ভ তেল পাওয়া গেছে!', '#FDE047');
              }

              syncHudNow();

              const waitingHere = waitingRef.current[pad.padId] ?? [];
              const freeSeats = h.seats.filter((s) => s === null).length;
              if (waitingHere.length > 0 && freeSeats > 0) {
                if (autoOpenBargainTimerRef.current) {
                  window.clearTimeout(autoOpenBargainTimerRef.current);
                }
                autoOpenBargainTimerRef.current = window.setTimeout(() => {
                  if (heliRef.current.landedPadId === pad.padId) {
                    controlsRef.current = { up: false, down: false, left: false, right: false };
                    setGameState('BARGAINING');
                  }
                }, 420);
              }
            } else {
              h.targetAltitude = 55;
              h.altitude = 35;
              soundEngine.playTouchdown(false);
              addToast(h.x, h.y, 120, 'নিচে নামার ছাদ নেই! কাছের স্টপেজের ছাদে নামুন', '#FBBF24');
            }
          }

          // Hover-Stable 2D Cruise Movement
          const canMove = h.fuel > 0 && h.altitude > 18 && h.autoCruise;
          const targetVx = canMove ? h.cruiseDir.dx * CRUISE_SPEED : 0;
          const targetVy = canMove ? h.cruiseDir.dy * CRUISE_SPEED : 0;

          h.vx += (targetVx - h.vx) * Math.min(1, dt * 5);
          h.vy += (targetVy - h.vy) * Math.min(1, dt * 5);
          h.x += h.vx * dt;
          h.y += h.vy * dt;

          h.x = Math.max(400, Math.min(MAP_WIDTH - 400, h.x));
          h.y = Math.max(400, Math.min(MAP_HEIGHT - 1150, h.y));

          if (Math.hypot(h.vx, h.vy) > 8) {
            const targetAngle = Math.atan2(h.vy, h.vx);
            let diff = targetAngle - h.headingAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            h.headingAngle += diff * Math.min(1, dt * 8);
          }

          const burnRate = h.autoCruise ? 0.14 : 0.05;
          h.fuel = Math.max(0, h.fuel - dt * burnRate);
          if (h.fuel <= 0) {
            triggerGameOver('OUT_OF_FUEL');
            return;
          }
        } else {
          h.vx = 0;
          h.vy = 0;
          h.rotorAngle += dt * 7;
        }

        // --- Autonomous AI Competitor Helicopter Tick ---
        const ai = aiHeliRef.current;
        ai.rotorAngle += dt * (ai.landedPadId ? 9 : 25);

        if (ai.landedPadId) {
          ai.dwellTimer -= dt;
          if (ai.dwellTimer <= 0) {
            // Board passengers at AI's current stop before lifting off
            const pad = ROOFTOP_PADS.find((p) => p.padId === ai.landedPadId);
            if (pad) {
              let freeIdx = ai.seats.findIndex((s) => s === null);
              const stopWaiting = waitingRef.current[pad.padId] ?? [];
              // Board matching directional passengers from rooftop (or spawn 1 if empty & not terminal)
              let taken = 0;
              const keptWaiting: Passenger[] = [];
              for (const wp of stopWaiting) {
                if (
                  freeIdx !== -1 &&
                  wp.direction === ai.routeDir &&
                  taken < 2 &&
                  (stopWaiting.length > 1 || pad.padId !== h.landedPadId)
                ) {
                  ai.seats[freeIdx] = {
                    ...wp,
                    agreedFare: Math.round((wp.baseFare * 0.95) / 10) * 10,
                  };
                  taken++;
                  freeIdx = ai.seats.findIndex((s) => s === null);
                } else {
                  keptWaiting.push(wp);
                }
              }
              if (taken > 0) {
                waitingRef.current = {
                  ...waitingRef.current,
                  [pad.padId]: keptWaiting,
                };
              } else if (freeIdx !== -1 && taken === 0) {
                const synth = createDirectionalPassengerForPad(pad, route, ai.routeDir);
                if (synth) {
                  ai.seats[freeIdx] = {
                    ...synth,
                    agreedFare: Math.round((synth.baseFare * 0.9) / 10) * 10,
                  };
                }
              }
            }

            ai.landedPadId = null;
            ai.targetAltitude = 100;
            ai.targetStopId = pickNextAITarget(ai, route, waitingRef.current);
            const tStop = getStopById(ai.targetStopId);
            ai.statusTextBn = `গন্তব্য ${tStop.nameBn}`;
          }
        } else {
          // Climb or descend smoothly
          const altDiff = ai.targetAltitude - ai.altitude;
          const altRate = ai.targetAltitude > ai.altitude ? 75 : 70;
          if (Math.abs(altDiff) <= altRate * dt) ai.altitude = ai.targetAltitude;
          else ai.altitude += Math.sign(altDiff) * altRate * dt;

          const targetLoc = getStopById(ai.targetStopId);
          const dx = targetLoc.x - ai.x;
          const dy = targetLoc.y - ai.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 110) {
            ai.targetAltitude = 0;
            ai.vx *= 0.85;
            ai.vy *= 0.85;
            ai.x += dx * Math.min(1, dt * 4);
            ai.y += dy * Math.min(1, dt * 4);

            if (ai.altitude <= 2) {
              ai.altitude = 0;
              ai.x = targetLoc.x + 48;
              ai.y = targetLoc.y - 38;
              ai.vx = 0;
              ai.vy = 0;
              ai.landedPadId = `${targetLoc.id}_hub`;
              ai.dwellTimer = 2.1;

              // Drop off AI passengers
              let aiDropped = 0;
              let aiEarned = 0;
              ai.seats = ai.seats.map((seat) => {
                if (seat && seat.destinationId === targetLoc.id) {
                  aiDropped++;
                  aiEarned += seat.agreedFare + 15;
                  return null;
                }
                return seat;
              });

              if (aiDropped > 0) {
                ai.cash += aiEarned;
                ai.tripsCompleted += aiDropped;
                statsRef.current.aiCash = ai.cash;
                statsRef.current.aiTripsCompleted = ai.tripsCompleted;
                ai.statusTextBn = `+৳${toBanglaDigits(aiEarned)} আয়!`;
                addToast(
                  ai.x,
                  ai.y,
                  190,
                  `AI পাইলট +৳${toBanglaDigits(aiEarned)} (${targetLoc.nameBn})`,
                  '#6EE7B7'
                );
              } else {
                ai.statusTextBn = `${targetLoc.nameBn}-এ নামল`;
              }

              // Flip AI direction when reaching end terminal
              const aiEndTerminal =
                ai.routeDir === 'FORWARD'
                  ? route.stops[route.stops.length - 1]
                  : route.stops[0];
              if (targetLoc.id === aiEndTerminal) {
                ai.routeDir = ai.routeDir === 'FORWARD' ? 'RETURN' : 'FORWARD';
                ai.statusTextBn = ai.routeDir === 'RETURN' ? 'ফেরার ট্রিপ শুরু' : 'যাওয়ার ট্রিপ শুরু';
              }
            }
          } else {
            ai.targetAltitude = 100;
            const ux = dx / dist;
            const uy = dy / dist;
            const spd = ai.altitude > 18 ? AI_CRUISE_SPEED : AI_CRUISE_SPEED * 0.4;
            ai.vx += (ux * spd - ai.vx) * Math.min(1, dt * 4.5);
            ai.vy += (uy * spd - ai.vy) * Math.min(1, dt * 4.5);
            ai.x += ai.vx * dt;
            ai.y += ai.vy * dt;

            const desiredAngle = Math.atan2(uy, ux);
            let adiff = desiredAngle - ai.headingAngle;
            while (adiff > Math.PI) adiff -= Math.PI * 2;
            while (adiff < -Math.PI) adiff += Math.PI * 2;
            ai.headingAngle += adiff * Math.min(1, dt * 6);
          }
        }

        // Nearby Passenger Roof Callouts on Active Route
        nearbyCalloutTimerRef.current += dt;
        if (nearbyCalloutTimerRef.current > 9.5) {
          nearbyCalloutTimerRef.current = 0;
          for (const stopId of route.stops) {
            const pad = ROOFTOP_PADS.find((p) => p.zoneId === stopId);
            if (!pad) continue;
            const w = waitingRef.current[pad.padId] ?? [];
            if (w.length > 0 && Math.hypot(pad.x - h.x, pad.y - h.y) < 1100) {
              pushDialogue('passenger', `${w[0].nameBn} (${pad.zoneNameBn})`, w[0].calloutLineBn);
              break;
            }
          }
        }

        // Walking Boarding/Deboarding Animations
        walkingAnimsRef.current = walkingAnimsRef.current
          .map((a) => ({ ...a, progress: a.progress + dt * 0.9 }))
          .filter((a) => a.progress < 1.05);

        // Continuous helicopter engine audio
        if (h.landedPadId) {
          soundEngine.updateHeliEngine('OFF');
        } else if (h.targetAltitude === 0) {
          soundEngine.updateHeliEngine('DESCENDING');
        } else if (h.autoCruise) {
          soundEngine.updateHeliEngine('FLYING');
        } else {
          soundEngine.updateHeliEngine('HOVER');
        }

        // Fast O(N) 3-Sublane Traffic Jam Simulation (Always jammed with Bus, Rickshaw, Truck & Lorry!)
        const vehicles = vehiclesRef.current;
        const laneBuckets = new Map<string, TrafficVehicle[]>();
        for (let i = 0; i < vehicles.length; i++) {
          const v = vehicles[i];
          const key = `${v.roadAxis}_${v.roadCoord}_${v.dir}_${v.laneIdx}`;
          let arr = laneBuckets.get(key);
          if (!arr) {
            arr = [];
            laneBuckets.set(key, arr);
          }
          arr.push(v);
        }

        const honkLines = [
          'জ্যাম রে ভাই!',
          'এই রিকশা সাইড দে!',
          'ট্রাক আটকে গেছে!',
          'লরি সরাও!',
          'বাস সামনে জ্যাম!',
          'পিঁপ পিঁপ!',
          'পোঁ পোঁ!',
          'ক্রিং ক্রিং!',
        ];

        for (const lane of laneBuckets.values()) {
          lane.sort((a, b) => (a.pos - b.pos) * a.dir);
          const count = lane.length;
          const isH = lane[0].roadAxis === 'H';
          const maxPos = isH ? MAP_WIDTH : MAP_HEIGHT;
          const crossList = isH ? VERTICAL_ROADS : HORIZONTAL_ROADS;

          for (let i = 0; i < count; i++) {
            const v = lane[i];
            let blocked = false;

            // Intersections stay gridlocked most of the time (staggered per intersection so jams are everywhere!)
            for (let c = 0; c < crossList.length; c++) {
              const crossCoord = crossList[c];
              const localCycle = Math.floor(timeSec + (crossCoord + v.roadCoord) * 0.005) % 18;
              const intersectionJammed = !signalGreen || localCycle < 14;
              if (intersectionJammed) {
                const distToStop = (crossCoord - v.pos) * v.dir;
                if (distToStop > 42 && distToStop < 210) {
                  blocked = true;
                  break;
                }
              }
            }

            if (!blocked && count > 1) {
              const ahead = lane[(i + 1) % count];
              let gap = (ahead.pos - v.pos) * v.dir;
              if (gap < 0) gap += maxPos + 200;
              const minSafeGap =
                v.type === 'lorry'
                  ? 76
                  : v.type === 'bus'
                    ? 68
                    : v.type === 'truck'
                      ? 62
                      : v.type === 'car'
                        ? 46
                        : 36;
              if (gap > 0 && gap < minSafeGap) {
                blocked = true;
              }
            }

            const targetSpd = blocked ? 0 : v.maxSpeed;
            v.speed += (targetSpd - v.speed) * Math.min(1, dt * 6);
            v.pos += v.dir * v.speed * dt;
            if (v.pos > maxPos + 100) v.pos = -90;
            if (v.pos < -100) v.pos = maxPos + 90;

            if (v.honkTimer > 0) {
              v.honkTimer = Math.max(0, v.honkTimer - dt);
            } else if (blocked && Math.random() < dt * 0.45) {
              v.honkTimer = 1.8;
              v.honkText = honkLines[Math.floor(Math.random() * honkLines.length)];
            }
          }
        }

        // Metro Rail
        for (const m of metroRef.current) {
          m.progress += m.dir * dt * 0.022;
          if (m.progress >= 1) {
            m.progress = 1;
            m.dir = -1;
          } else if (m.progress <= 0) {
            m.progress = 0;
            m.dir = 1;
          }
        }

        toastsRef.current = toastsRef.current
          .map((t) => ({ ...t, z: t.z + 24 * dt, life: t.life - dt }))
          .filter((t) => t.life > 0);

        // Respawn directional passengers on empty stops along the active route
        spawnTimerRef.current += dt;
        if (spawnTimerRef.current > 5.0) {
          spawnTimerRef.current = 0;
          const curDir = routeDirectionRef.current;
          const orderedStops = curDir === 'FORWARD' ? route.stops : [...route.stops].reverse();
          const candidatePads = orderedStops
            .slice(0, orderedStops.length - 1)
            .map((id) => ROOFTOP_PADS.find((p) => p.zoneId === id))
            .filter(
              (p): p is NonNullable<typeof p> =>
                Boolean(p) &&
                (waitingRef.current[p!.padId]?.length ?? 0) === 0 &&
                p!.padId !== heliRef.current.landedPadId
            );
          if (candidatePads.length > 0) {
            const pick = candidatePads[Math.floor(Math.random() * candidatePads.length)];
            const newP = createDirectionalPassengerForPad(pick, route, curDir);
            if (newP) {
              waitingRef.current = {
                ...waitingRef.current,
                [pick.padId]: [newP],
              };
            }
          }
        }

        if (now - lastHudSyncRef.current > 120) {
          lastHudSyncRef.current = now;
          syncHudNow();
        }
      } else {
        soundEngine.updateHeliEngine('OFF');
      }

      // Camera tracks Player Helicopter smoothly
      cameraRef.current.x += (heliRef.current.x - cameraRef.current.x) * Math.min(1, dt * 6 + 0.14);
      cameraRef.current.y += (heliRef.current.y - cameraRef.current.y) * Math.min(1, dt * 6 + 0.14);

      if (onlineMatchId && onlineSocketRef.current?.connected && now - onlineLastSendRef.current > 50 && gameState === 'PLAYING') {
        onlineLastSendRef.current = now;
        const h = heliRef.current;
        onlineSocketRef.current.emit('match:state', { matchId: onlineMatchId, playerUid: authUser?.uid, heli: { x:h.x, y:h.y, vx:h.vx, vy:h.vy, altitude:h.altitude, targetAltitude:h.targetAltitude, headingAngle:h.headingAngle, rotorAngle:h.rotorAngle, landedPadId:h.landedPadId, autoCruise:h.autoCruise, cruiseDir:h.cruiseDir }, score: statsRef.current.cash });
      }
      if (onlineMatchId && onlineSecondsLeft !== null && onlineSecondsLeft <= 0 && gameState === 'PLAYING') triggerGameOver('TIME_UP');

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        renderDhakaIsoScene({
          ctx,
          viewWidth: viewportRef.current.width,
          viewHeight: viewportRef.current.height,
          cameraX: cameraRef.current.x,
          cameraY: cameraRef.current.y,
          timeSec,
          signalGreen,
          heli: heliRef.current,
          aiHeli: onlineMatchId ? null : aiHeliRef.current,
          remoteHeli: onlineMatchId ? onlineRemoteHeli : null,
          activeRoute: route,
          routeDirection: routeDirectionRef.current,
          waitingByPad: waitingRef.current,
          walkingAnims: walkingAnimsRef.current,
          vehicles: vehiclesRef.current,
          metroTrains: metroRef.current,
          toasts: toastsRef.current,
          highlightedDestId,
        });
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      soundEngine.updateHeliEngine('OFF');
    };
  }, [gameState, mode, selectedRouteId, highlightedDestId, addToast, pushDialogue, syncHudNow, triggerGameOver, onlineMatchId, onlineRemoteHeli, onlineSecondsLeft, authUser]);

  if (gameState === 'TITLE_MENU') {
    return (
      <TitleScreen
        selectedMode={mode}
        onSelectMode={setMode}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        onStartGame={startNewGame}
        onStartOnlineGame={handleOnlineStartGame}
        onMatchReady={handleMatchReady}
        bestScore={bestShiftCash}
        muted={muted}
        onToggleMute={handleToggleMute}
        authUser={authUser}
        authLoading={authLoading}
        authError={authError}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
      />
    );
  }

  const landedPad = hudHeli.landedPadId
    ? ROOFTOP_PADS.find((p) => p.padId === hudHeli.landedPadId) ?? null
    : null;
  const landedWaiting = landedPad ? waitingByPad[landedPad.padId] ?? [] : [];
  const freeSeatsCount = hudHeli.seats.filter((s) => s === null).length;
  const canBargainHere = Boolean(landedPad && landedWaiting.length > 0 && freeSeatsCount > 0);
  const canRefuelHere = Boolean(landedPad && (hudHeli.fuel < 96 || hudHeli.hull < 96));

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 select-none">
      {/* Top Compact HUD */}
      <HudBar
        mode={mode}
        isOnline={Boolean(onlineMatchId)}
        activeRoute={activeRoute}
        routeDirection={routeDirection}
        stats={hudStats}
        heli={hudHeli}
        paused={gameState === 'PAUSED'}
        muted={muted}
        voiceEnabled={voiceEnabled}
        highlightedDestId={highlightedDestId}
        onTogglePause={() =>
          setGameState((prev) => (prev === 'PAUSED' ? 'PLAYING' : 'PAUSED'))
        }
        onToggleMute={handleToggleMute}
        onToggleVoice={handleToggleVoice}
        onFinishSession={handleFinishSession}
        onSelectSeatHighlight={setHighlightedDestId}
      />

      {/* Live Spoken & Written Dialogue Banner */}
      {gameState === 'PLAYING' && <LiveDialogueBanner dialogue={liveDialogue} />}

      {/* Main 3D Isometric Dhaka City Viewport */}
      <div ref={containerRef} className="relative flex-1 w-full overflow-hidden">
        <canvas ref={canvasRef} className="block w-full h-full touch-none-select" />
        {onlineMatchId && (
          <aside
            aria-label="Online match scores"
            className="absolute top-[286px] right-3 z-30 w-36 sm:w-40 rounded-lg bg-slate-950/95 border border-cyan-400/50 p-1.5 shadow-xl text-cyan-50"
          >
            <div className="flex items-center justify-between gap-1 border-b border-cyan-900/70 pb-1 mb-1">
              <span className="text-[10px] font-bold tracking-wide text-cyan-300">ONLINE MATCH</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">
                {onlineSecondsLeft === null ? '--:--' : `${Math.floor(onlineSecondsLeft / 60)}:${String(onlineSecondsLeft % 60).padStart(2, '0')}`}
              </span>
            </div>
            <div className="space-y-1">
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1">
                <div className="text-[9px] text-amber-200">Your score</div>
                <div className="text-sm font-bold font-mono-num text-amber-300">৳{hudStats.cash}</div>
              </div>
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-1">
                <div className="text-[9px] text-emerald-200">Online opponent score</div>
                <div className="text-sm font-bold font-mono-num text-emerald-300">৳{onlineOpponentScore}</div>
              </div>
            </div>
          </aside>
        )}

        {/* Top-Left Overlay: Helicopter Cabin Interior View */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 z-20">
            <CabinInteriorView heli={hudHeli} />
          </div>
        )}

        {/* Top-Right Overlay: Isometric-Aligned Dhaka Route Mini-Map */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-3 right-3 z-20">
            <DhakaMiniMap
              heli={hudHeli}
              aiHeli={onlineMatchId ? null : hudAiHeli}
              activeRoute={activeRoute}
              routeDirection={routeDirection}
              waitingByPad={waitingByPad}
              highlightedDestId={highlightedDestId}
              onSelectDest={setHighlightedDestId}
            />
          </div>
        )}

        {/* Bottom Sticky On-Screen Navigation Buttons */}
        {gameState === 'PLAYING' && (
          <NavigationControls
            heli={hudHeli}
            canBargain={canBargainHere}
            canRefuel={canRefuelHere}
            depotHere={Boolean(landedPad?.hasDepot)}
            onStartFly={handleStartFly}
            onHoverStop={handleHoverStop}
            onLand={handleLand}
            onSelectScreenDirection={handleSelectScreenDirection}
            onCallPassengers={triggerHelperCallout}
            onOpenBargain={openBargainIfReady}
            onRefuelRepair={handleRefuelRepair}
          />
        )}

        {/* Bargaining Modal */}
        {gameState === 'BARGAINING' && landedPad && (
          <BargainModal
            pad={landedPad}
            waitingPassengers={landedWaiting}
            freeSeatsCount={freeSeatsCount}
            onAcceptPassenger={handleAcceptPassenger}
            onRejectPassenger={handleRejectPassenger}
            onDialogueSpeak={pushDialogue}
            onClose={() => setGameState('PLAYING')}
          />
        )}

        {/* Pause Overlay */}
        {gameState === 'PAUSED' && (
          <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5 text-center shadow-2xl">
              <h2 className="text-2xl font-bold text-white">খেলা বিরতিতে আছে</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                বর্তমান রুট: <strong className="text-amber-300">{activeRoute.nameBn}</strong> (
                {routeDirection === 'FORWARD' ? 'যাওয়ার দিক' : 'ফেরার দিক'})
              </p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setGameState('PLAYING')}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>খেলা চালিয়ে যান</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinishSession}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                  <span>ফলাফল দেখুন (সেশন শেষ)</span>
                </button>
                <button
                  type="button"
                  onClick={onlineMatchId ? handleFinishSession : startNewGame}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{onlineMatchId ? 'ম্যাচ ছেড়ে দিন' : 'নতুন করে শুরু করুন'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onlineMatchId ? handleFinishSession() : setGameState('TITLE_MENU')}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>রুট ও মোড মেনু</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === 'GAME_OVER' && (
          <GameOverModal
            reason={gameOverReason}
            mode={mode}
            activeRoute={activeRoute}
            stats={hudStats}
            onlineResult={onlineMatchResult ? {
              ...onlineMatchResult,
              myUid: authUser?.uid ?? '',
            } : null}
            onlineOpponentScore={onlineOpponentScore}
            onPlayAgain={onlineMatchResult ? () => setGameState('TITLE_MENU') : startNewGame}
            onBackToMenu={() => {
              if (onlineMatchId) {
                setOnlineMatchId(null);
                setOnlineMatchResult(null);
                setOnlineSecondsLeft(null);
                setOnlineRemoteHeli(null);
                setOnlineOpponentScore(0);
              }
              setGameState('TITLE_MENU');
            }}
          />
        )}
      </div>
    </div>
  );
}
