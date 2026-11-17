import React from 'react';
import { DhakaRoute, GameMode, GameStats } from '../types/game';
import { toBanglaDigits } from '../data/dhakaData';
import { RotateCcw, Home, Trophy, Bot, Plane } from 'lucide-react';

interface GameOverModalProps {
  reason: 'TIME_UP' | 'OUT_OF_FUEL' | 'CRASHED' | 'SESSION_ENDED';
  mode: GameMode;
  activeRoute: DhakaRoute;
  stats: GameStats;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onlineResult?: {
    winnerUid: string | null;
    scores: Record<string, number>;
    reason: 'TIME_UP' | 'FORFEIT' | 'DISCONNECT';
    myUid: string;
  } | null;
  onlineOpponentScore?: number;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason,
  mode,
  activeRoute,
  stats,
  onPlayAgain,
  onBackToMenu,
  onlineResult = null,
  onlineOpponentScore = 0,
}) => {
  const playerWon = stats.cash >= stats.aiCash;
  const isCompetitionFinish = mode === 'COMPETITION' && reason === 'TIME_UP';

  if (onlineResult) {
    const myScore = Number(onlineResult.scores[onlineResult.myUid] ?? stats.cash);
    const opponentEntry = Object.entries(onlineResult.scores).find(([uid]) => uid !== onlineResult.myUid);
    const opponentScore = Number(opponentEntry?.[1] ?? onlineOpponentScore ?? 0);
    const won = onlineResult.winnerUid === onlineResult.myUid;
    const draw = onlineResult.winnerUid === null;
    const quitReason = onlineResult.reason === 'FORFEIT' || onlineResult.reason === 'DISCONNECT';
    const headline = won
      ? 'অভিনন্দন! আপনি বিজয়ী! 🎉'
      : draw
        ? 'ম্যাচ ড্র হয়েছে!'
        : 'আপনি এই ম্যাচে হেরে গেছেন';
    const subtext = won && quitReason
      ? (onlineResult.reason === 'FORFEIT'
          ? 'আপনার প্রতিপক্ষ ম্যাচ ছেড়ে দিয়েছে। তাই আপনি জয়ী হয়েছেন।'
          : 'আপনার প্রতিপক্ষ ২০ সেকেন্ডের মধ্যে পুনরায় সংযোগ করেনি। তাই আপনি জয়ী হয়েছেন।')
      : won
        ? '১০ মিনিটের অনলাইন প্রতিযোগিতায় আপনার স্কোর বেশি ছিল। দারুণ খেলেছেন!'
        : draw
          ? 'দুই খেলোয়াড়ের স্কোর সমান হয়েছে। আবার চেষ্টা করুন!'
          : quitReason
            ? (onlineResult.reason === 'FORFEIT'
                ? 'আপনি ম্যাচ ছেড়ে দিয়েছেন, তাই এই ম্যাচে আপনার পরাজয় হয়েছে।'
                : 'আপনার সংযোগ ফিরে না আসায় এই ম্যাচে আপনার পরাজয় হয়েছে।')
            : 'আপনার প্রতিপক্ষ বেশি স্কোর করেছে। পরের ম্যাচে আবার চেষ্টা করুন!';

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center ${won ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'}`}>
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{headline}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{subtext}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`rounded-xl p-4 border ${won ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-xs text-amber-300 font-semibold">আপনার স্কোর</div>
              <div className="text-2xl font-bold text-amber-400 font-mono-num mt-1">৳{toBanglaDigits(myScore)}</div>
            </div>
            <div className={`rounded-xl p-4 border ${!won && !draw ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-xs text-emerald-300 font-semibold">অনলাইন প্রতিপক্ষের স্কোর</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono-num mt-1">৳{toBanglaDigits(opponentScore)}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToMenu}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>ম্যাচ মেনুতে ফিরুন</span>
          </button>
        </div>
      </div>
    );
  }

  const headline = isCompetitionFinish
    ? playerWon
      ? 'Congratulations! তুমি বিজয়ী!'
      : 'কম্পিউটার বিজয়ী!'
    : reason === 'OUT_OF_FUEL'
      ? 'বিমানের তেল ফুরিয়ে গেছে!'
      : reason === 'CRASHED'
        ? 'বিমানটি বেশি ক্ষতিগ্রস্ত হয়েছে!'
        : playerWon
          ? 'Congratulations! তুমি বিজয়ী!'
          : 'ফ্লাইট সেশন সমাপ্ত!';

  const subtext = isCompetitionFinish
    ? playerWon
      ? `১০ মিনিটের প্রতিযোগিতায় ${activeRoute.nameBn} রুটে আপনি ৳${toBanglaDigits(
          stats.cash
        )} আয় করে কম্পিউটার (৳${toBanglaDigits(stats.aiCash)})-কে হারিয়ে দিয়েছেন!`
      : `কম্পিউটার পাইলট ৳${toBanglaDigits(stats.aiCash)} আয় করে এগিয়ে গেছে (আপনার আয় ৳${toBanglaDigits(
          stats.cash
        )})। আরেকবার চেষ্টা করুন!`
    : reason === 'OUT_OF_FUEL'
      ? 'মাঝ আকাশে জ্বালানি শেষ! ডিপো ছাদে নামলে সস্তায় তেল নিতে পারবেন।'
      : `${activeRoute.nameBn} রুটে আপনার মোট আয় ৳${toBanglaDigits(stats.cash)} (AI পাইলট: ৳${toBanglaDigits(
          stats.aiCash
        )})।`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center ${
              playerWon
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {playerWon ? <Trophy className="w-8 h-8" /> : reason === 'TIME_UP' ? <Bot className="w-8 h-8" /> : <Plane className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{headline}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{subtext}</p>
        </div>

        {/* Player vs AI Head-to-Head Scorecard */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div
            className={`rounded-xl p-4 border ${
              playerWon
                ? 'bg-amber-500/10 border-amber-500/50'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="text-xs text-amber-300 font-semibold">আপনি (লোকাল প্লেয়ার)</div>
            <div className="text-2xl font-bold text-amber-400 font-mono-num mt-1">
              ৳{toBanglaDigits(stats.cash)}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              যাত্রী পৌঁছে দিয়েছেন: {toBanglaDigits(stats.tripsCompleted)} জন
            </div>
          </div>

          <div
            className={`rounded-xl p-4 border ${
              !playerWon
                ? 'bg-emerald-500/10 border-emerald-500/50'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              <span>কম্পিউটার (AI পাইলট)</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono-num mt-1">
              ৳{toBanglaDigits(stats.aiCash)}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              যাত্রী পৌঁছে দিয়েছে: {toBanglaDigits(stats.aiTripsCompleted)} জন
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400">মসৃণ অবতরণ</span>
            <span className="font-bold text-teal-300 font-mono-num">
              {toBanglaDigits(stats.perfectLandings)} বার
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400">সর্বোচ্চ আয় রেকর্ড</span>
            <span className="font-bold text-slate-100 font-mono-num">
              ৳{toBanglaDigits(Math.max(stats.bestShiftCash, stats.cash))}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>আবার খেলুন</span>
          </button>
          <button
            type="button"
            onClick={onBackToMenu}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            <span>রুট ও মোড পরিবর্তন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
