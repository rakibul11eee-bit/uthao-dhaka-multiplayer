import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { AuthPanel } from './AuthPanel';
import { MatchmakingPanel } from '../features/multiplayer/matchmaking/MatchmakingPanel';
import { GameMode, RouteId } from '../types/game';
import { DHAKA_ROUTES, toBanglaDigits } from '../data/dhakaData';
import { Play, Volume2, VolumeX, Plane, Route, Trophy, Compass, Bot } from 'lucide-react';

interface TitleScreenProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  selectedRouteId: RouteId;
  onSelectRoute: (routeId: RouteId) => void;
  onStartGame: () => void;
  onStartOnlineGame?: () => void;
  onMatchReady?: (matchId: string) => void;
  bestScore: number;
  muted: boolean;
  onToggleMute: () => void;
  authUser: User | null;
  authLoading: boolean;
  authError: string | null;
  onGoogleLogin: () => void;
  onLogout: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedMode,
  onSelectMode,
  selectedRouteId,
  onSelectRoute,
  onStartGame,
  onStartOnlineGame,
  onMatchReady,
  bestScore,
  muted,
  onToggleMute,
  authUser,
  authLoading,
  authError,
  onGoogleLogin,
  onLogout,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <AuthPanel user={authUser} loading={authLoading} error={authError} onLogin={onGoogleLogin} onLogout={onLogout} />
      <MatchmakingPanel user={authUser} onMatchReady={onMatchReady} onStartGame={onStartOnlineGame ?? onStartGame} />
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Hero Visual (6 cols) */}
        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[280px] sm:min-h-[420px] flex flex-col justify-end">
          {!imgFailed ? (
            <img
              src="/assets/aistudio/Uthao_Dhaka_HD_City_711bd11c.png"
              alt="উঠাও ঢাকা — ঢাকার প্রধান তিন রুটে ৩ডি আইসোমেট্রিক হেলিকপ্টার সার্ভিস"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-slate-900 to-amber-900 flex items-center justify-center">
              <Plane className="w-24 h-24 text-amber-400/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent" />

          <div className="relative z-10 p-6 sm:p-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-300">
              <span>ঢাকার বাস্তব ম্যাপ ও ৩টি প্রধান রুট</span>
              <span aria-hidden="true">·</span>
              <span>যাওয়া ও ফেরার ট্রিপ</span>
              <span aria-hidden="true">·</span>
              <span>পাইলট বনাম AI প্রতিযোগিতা</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white text-balance">
              উঠাও ঢাকা
            </h1>
            <p className="text-slate-200 text-sm sm:text-base max-w-xl leading-relaxed">
              নিচে ঢাকার রাস্তায় রিকশা, সিএনজি আর বাসের জ্যাম—আর উপরে আপনার হেলিকপ্টার!
              ঢাকার প্রধান তিনটি রুটে প্রথমে সামনের দিকে ও টার্মিনালে পৌঁছে ফেরার দিকে যাত্রী নিয়ে উড়ুন, এবং AI হেলিকপ্টারের সাথে প্রতিযোগিতা করুন।
            </p>
          </div>
        </div>

        {/* Right Route, Mode & Launch Panel (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Route className="w-5 h-5 text-amber-400" />
                  <span>ঢাকার প্রধান ৩টি রুট (১টি বাছাই করুন)</span>
                </h2>
                {bestScore > 0 && (
                  <p className="text-xs text-amber-300 font-mono-num mt-0.5">
                    সর্বোচ্চ প্রতিযোগিতা আয়: ৳{toBanglaDigits(bestScore)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'শব্দ চালু করুন' : 'শব্দ বন্ধ করুন'}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* 3 Official Dhaka Routes Selector */}
            <div className="grid grid-cols-1 gap-2.5">
              {DHAKA_ROUTES.map((route) => {
                const isSelected = selectedRouteId === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => onSelectRoute(route.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/95 border-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: route.color }}
                        />
                        <span className="text-xs font-bold text-slate-400">{route.numberBn}</span>
                        <span className="text-base font-bold text-white">{route.nameBn}</span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {toBanglaDigits(route.stops.length)} স্টপেজ
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{route.corridorBn}</p>
                  </button>
                );
              })}
            </div>

            {/* Mode Selector: Competition (10 Min vs AI) vs Free Style */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5">খেলার মোড বাছাই করুন</div>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectMode('COMPETITION')}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedMode === 'COMPETITION'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span>প্রতিযোগিতা (১০ মি. vs AI)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectMode('FREE_STYLE')}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedMode === 'FREE_STYLE'
                      ? 'bg-teal-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>ফ্রি স্টাইল (আনলিমিটেড)</span>
                </button>
              </div>
            </div>

            {/* Concise Rules */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <Compass className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">একমুখী রুট নিয়ম:</strong> যাওয়ার পথে শুধু সামনের দিকের যাত্রী উঠবে। শেষ টার্মিনালে নামলে রুট ঘুরে{' '}
                  <strong className="text-amber-300">ফেরার ট্রিপ</strong> শুরু হবে!
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Bot className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">AI হেলিকপ্টার চ্যালেঞ্জ:</strong> প্রতিযোগিতা মোডে ১০ মিনিটে কম্পিউটার (AI) পাইলটের চেয়ে বেশি আয় করলেই আপনি বিজয়ী!
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartGame}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>উড়াল দিন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
