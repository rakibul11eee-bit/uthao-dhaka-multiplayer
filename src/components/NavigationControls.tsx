import React from 'react';
import { HelicopterState } from '../types/game';
import { toBanglaDigits } from '../data/dhakaData';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  PlaneTakeoff,
  PlaneLanding,
  PauseCircle,
  Megaphone,
  HandCoins,
  Wrench,
} from 'lucide-react';

interface NavigationControlsProps {
  heli: HelicopterState;
  canBargain: boolean;
  canRefuel: boolean;
  depotHere: boolean;
  onStartFly: () => void;
  onHoverStop: () => void;
  onLand: () => void;
  onSelectScreenDirection: (sx: number, sy: number) => void;
  onCallPassengers: () => void;
  onOpenBargain: () => void;
  onRefuelRepair: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  heli,
  canBargain,
  canRefuel,
  depotHere,
  onStartFly,
  onHoverStop,
  onLand,
  onSelectScreenDirection,
  onCallPassengers,
  onOpenBargain,
  onRefuelRepair,
}) => {
  const isLanded = Boolean(heli.landedPadId);
  const isCruising = heli.autoCruise && !isLanded;
  const isDescending = heli.targetAltitude === 0 && !isLanded;

  // Project world cruiseDir back to screen axes for active button state
  const screenDx = heli.cruiseDir.dx - heli.cruiseDir.dy;
  const screenDy = heli.cruiseDir.dx + heli.cruiseDir.dy;

  const isDir = (sx: number, sy: number) => {
    if (!isCruising) return false;
    const len = Math.hypot(screenDx, screenDy) || 1;
    const nx = screenDx / len;
    const ny = screenDy / len;
    return nx * sx + ny * sy > 0.7;
  };

  return (
    <div className="fixed bottom-3 inset-x-3 z-30 flex flex-wrap items-end justify-between gap-3 pointer-events-none touch-none-select">
      {/* Unified Flight & Landing Control Block (দিক বাছাই + উড়ুন + নামুন একই ব্লকে) */}
      <div className="pointer-events-auto bg-slate-900/92 border border-slate-700/90 rounded-2xl p-2.5 shadow-xl backdrop-blur-sm flex items-stretch gap-2.5">
        {/* Directional Pad */}
        <div>
          <div className="text-[10px] text-slate-400 text-center mb-1">
            দিক বাছাই (চলমান থাকবে)
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div />
            <button
              type="button"
              onClick={() => onSelectScreenDirection(0, -1)}
              aria-label="সামনে চলুন"
              className={`min-w-[52px] min-h-[42px] px-2 py-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDir(0, -1)
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              <span>সামনে</span>
            </button>
            <div />

            <button
              type="button"
              onClick={() => onSelectScreenDirection(-1, 0)}
              aria-label="বামে চলুন"
              className={`min-w-[52px] min-h-[42px] px-2 py-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDir(-1, 0)
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>বামে</span>
            </button>

            <button
              type="button"
              onClick={onHoverStop}
              aria-label="থামুন বা হোভার করুন"
              className={`min-w-[52px] min-h-[42px] px-2 py-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                !isLanded && !isCruising && !isDescending
                  ? 'bg-teal-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <PauseCircle className="w-4 h-4" />
              <span>থামুন</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectScreenDirection(1, 0)}
              aria-label="ডানে চলুন"
              className={`min-w-[52px] min-h-[42px] px-2 py-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDir(1, 0)
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>ডানে</span>
            </button>

            <div />
            <button
              type="button"
              onClick={() => onSelectScreenDirection(0, 1)}
              aria-label="পিছনে চলুন"
              className={`min-w-[52px] min-h-[42px] px-2 py-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDir(0, 1)
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
              <span>পিছনে</span>
            </button>
            <div />
          </div>
        </div>

        <div className="w-px bg-slate-700/80 my-1" />

        {/* Coupled "উড়ুন" & "নামুন" Control Column inside the Same Block */}
        <div className="flex flex-col justify-between min-w-[116px] sm:min-w-[132px]">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[10px] text-slate-400">উচ্চতা</span>
            <span className="text-xs font-mono-num font-bold text-teal-300">
              {toBanglaDigits(Math.round(heli.altitude))}%
            </span>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={onStartFly}
              className={`flex-1 min-h-[48px] px-3 py-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border-b border-slate-700 ${
                isCruising
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
              }`}
            >
              <PlaneTakeoff className="w-4 h-4 shrink-0" />
              <span>{isCruising ? 'উড়ছে' : 'উড়ুন'}</span>
            </button>

            <button
              type="button"
              onClick={onLand}
              disabled={isLanded}
              className={`flex-1 min-h-[48px] px-3 py-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                isLanded
                  ? 'bg-slate-800 text-slate-500 cursor-default'
                  : isDescending
                    ? 'bg-amber-500 text-slate-950 cursor-pointer'
                    : 'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer'
              }`}
            >
              <PlaneLanding className="w-4 h-4 shrink-0" />
              <span>{isLanded ? 'ছাদে থেমে' : isDescending ? 'নামছে...' : 'নামুন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Passenger Callout, Bargain & Refuel Actions */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        {canRefuel && (
          <button
            type="button"
            onClick={onRefuelRepair}
            className="min-h-[46px] px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer whitespace-nowrap"
          >
            <Wrench className="w-4 h-4" />
            <span>{depotHere ? 'তেল/মেরামত (৳৩০)' : 'জরুরি তেল (৳৫০)'}</span>
          </button>
        )}
        {canBargain && (
          <button
            type="button"
            onClick={onOpenBargain}
            className="min-h-[46px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer whitespace-nowrap"
          >
            <HandCoins className="w-4 h-4" />
            <span>যাত্রী দেখুন / দর কষাকষি (E)</span>
          </button>
        )}
        <button
          type="button"
          onClick={onCallPassengers}
          className="min-h-[46px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer whitespace-nowrap"
        >
          <Megaphone className="w-4 h-4" />
          <span>হাঁক ছাড়ো (Space)</span>
        </button>
      </div>
    </div>
  );
};
