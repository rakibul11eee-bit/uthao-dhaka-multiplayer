import React from 'react';
import {
  DhakaRoute,
  GameMode,
  GameStats,
  HelicopterState,
  RouteDirection,
  StopId,
} from '../types/game';
import { ROOFTOP_PADS, toBanglaDigits } from '../data/dhakaData';
import { Volume2, VolumeX, Pause, Play, Fuel, Mic, MicOff, Bot, ArrowRight, ArrowLeft, Flag } from 'lucide-react';

interface HudBarProps {
  mode: GameMode;
  isOnline?: boolean;
  activeRoute: DhakaRoute;
  routeDirection: RouteDirection;
  stats: GameStats;
  heli: HelicopterState;
  paused: boolean;
  muted: boolean;
  voiceEnabled: boolean;
  highlightedDestId: StopId | null;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onToggleVoice: () => void;
  onFinishSession: () => void;
  onSelectSeatHighlight: (destId: StopId | null) => void;
}

export const HudBar: React.FC<HudBarProps> = ({
  mode,
  isOnline = false,
  activeRoute,
  routeDirection,
  stats,
  heli,
  paused,
  muted,
  voiceEnabled,
  highlightedDestId,
  onTogglePause,
  onToggleMute,
  onToggleVoice,
  onFinishSession,
  onSelectSeatHighlight,
}) => {
  const mins = Math.floor(stats.timeRemainingSec / 60);
  const secs = Math.floor(stats.timeRemainingSec % 60);
  const timeFormatted = `${toBanglaDigits(mins)}:${toBanglaDigits(secs < 10 ? `0${secs}` : secs)}`;

  const landedPad = heli.landedPadId
    ? ROOFTOP_PADS.find((p) => p.padId === heli.landedPadId)
    : null;

  const fuelPct = Math.max(0, Math.round(heli.fuel));
  const dirLabel =
    routeDirection === 'FORWARD'
      ? `${activeRoute.startNameBn} → ${activeRoute.endNameBn}`
      : `${activeRoute.endNameBn} → ${activeRoute.startNameBn}`;

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 z-20">
      {/* Zone 1: Brand + Active Route Direction & Timer */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg sm:text-xl font-bold tracking-tight text-amber-400 whitespace-nowrap shrink-0">
          উঠাও ঢাকা
        </span>
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-200 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 whitespace-nowrap">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: activeRoute.color }}
          />
          <span className="font-semibold">{dirLabel}</span>
          <span className="text-amber-300 flex items-center gap-0.5">
            {routeDirection === 'FORWARD' ? (
              <>
                <span>(যাওয়া</span>
                <ArrowRight className="w-3 h-3" />
                <span>)</span>
              </>
            ) : (
              <>
                <span>(ফেরা</span>
                <ArrowLeft className="w-3 h-3" />
                <span>)</span>
              </>
            )}
          </span>
          {landedPad && (
            <>
              <span aria-hidden="true" className="text-slate-600">|</span>
              <span className="text-teal-300">ছাদ: {landedPad.zoneNameBn}</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Cabin Seats (1 Pilot + 3 Passengers) */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-sm bg-teal-400 shrink-0" />
          <span className="text-slate-200 font-semibold">চালক</span>
        </div>

        {heli.seats.map((seat, idx) => {
          const isHighlighted = seat && highlightedDestId === seat.destinationId;
          return (
            <button
              key={idx}
              type="button"
              disabled={!seat}
              onClick={() =>
                seat &&
                onSelectSeatHighlight(isHighlighted ? null : seat.destinationId)
              }
              title={seat ? `${seat.nameBn} → ${seat.destinationNameBn}` : 'খালি আসন'}
              className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                seat
                  ? isHighlighted
                    ? 'bg-emerald-500 text-slate-950 font-bold cursor-pointer'
                    : 'bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-slate-100 cursor-pointer'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-500 cursor-default'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: seat ? seat.shirtColor : '#334155' }}
              />
              {seat ? (
                <span>
                  {seat.destinationNameBn}{' '}
                  <span className="font-mono-num opacity-80">৳{toBanglaDigits(seat.agreedFare)}</span>
                </span>
              ) : (
                <span>আসন {toBanglaDigits(idx + 1)}: খালি</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Zone 3: Player vs AI Cash, Timer, Fuel & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 ml-auto lg:ml-0">
        {mode === 'COMPETITION' ? (
          <div className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono-num whitespace-nowrap">
            সময় {timeFormatted}
          </div>
        ) : (
          <div className="hidden sm:block px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/40 text-teal-300 text-xs font-semibold whitespace-nowrap">
            ফ্রি স্টাইল
          </div>
        )}

        <div className="text-right whitespace-nowrap">
          <div className="text-[10px] text-slate-400 leading-none">আপনার আয়</div>
          <div className="text-sm sm:text-base font-bold text-amber-400 font-mono-num">
            ৳{toBanglaDigits(stats.cash)}
          </div>
        </div>

        {!isOnline && (
          <div className="text-right whitespace-nowrap pl-2 border-l border-slate-800">
            <div className="text-[10px] text-emerald-300 leading-none flex items-center justify-end gap-1">
              <Bot className="w-3 h-3" />
              <span>AI পাইলট</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono-num">
              ৳{toBanglaDigits(stats.aiCash)}
            </div>
          </div>
        )}

        <div className="hidden xl:flex flex-col gap-1 w-16">
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span className="flex items-center gap-0.5">
              <Fuel className="w-3 h-3 text-amber-400" />
              তেল
            </span>
            <span className={`font-mono-num ${fuelPct < 25 ? 'text-rose-400 font-bold' : ''}`}>
              {toBanglaDigits(fuelPct)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${fuelPct < 25 ? 'bg-rose-500' : 'bg-amber-400'}`}
              style={{ width: `${fuelPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleVoice}
            title={voiceEnabled ? 'ভয়েস সংলাপ চালু' : 'ভয়েস সংলাপ বন্ধ'}
            aria-label={voiceEnabled ? 'ভয়েস সংলাপ বন্ধ করুন' : 'ভয়েস সংলাপ চালু করুন'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              voiceEnabled
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'শব্দ চালু করুন' : 'শব্দ বন্ধ করুন'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={paused ? 'খেলা চালু করুন' : 'বিরতি নিন'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          {mode === 'FREE_STYLE' && (
            <button
              type="button"
              onClick={onFinishSession}
              title="খেলা শেষ করে ফলাফল দেখুন"
              className="px-2 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">শেষ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
