import React from 'react';
import {
  CRUISE_SPEED,
  DHAKA_LOCATIONS,
  DHAKA_ROUTES,
  PIXELS_PER_KM,
  ROOFTOP_PADS,
  getStopById,
  toBanglaDigits,
} from '../data/dhakaData';
import {
  AIHelicopterState,
  DhakaRoute,
  HelicopterState,
  Passenger,
  RouteDirection,
  StopId,
} from '../types/game';
import { ISO_COS, ISO_SIN } from '../utils/dhakaRenderer';

interface DhakaMiniMapProps {
  heli: HelicopterState;
  aiHeli: AIHelicopterState | null;
  activeRoute: DhakaRoute;
  routeDirection: RouteDirection;
  waitingByPad: Record<string, Passenger[]>;
  highlightedDestId: StopId | null;
  onSelectDest: (destId: StopId | null) => void;
  compact?: boolean;
}

const KEY_LANDMARK_IDS = new Set<StopId>([
  'abdullahpur',
  'bimanbandar',
  'kuril',
  'mirpur10',
  'gabtoli',
  'banani',
  'farmgate',
  'shahbagh',
  'motijheel',
  'jatrabari',
]);

export const DhakaMiniMap: React.FC<DhakaMiniMapProps> = ({
  heli,
  aiHeli,
  activeRoute,
  routeDirection,
  waitingByPad,
  highlightedDestId,
  onSelectDest,
  compact = false,
}) => {
  const seatedPassengers = heli.seats.filter((s): s is Passenger => s !== null);
  const seatedDestIds = new Set(seatedPassengers.map((s) => s.destinationId));

  // Default target if no seated passengers: active terminal ahead!
  const endTerminalId =
    routeDirection === 'FORWARD'
      ? activeRoute.stops[activeRoute.stops.length - 1]
      : activeRoute.stops[0];

  const targetId = highlightedDestId ?? seatedPassengers[0]?.destinationId ?? endTerminalId;
  const targetLoc = targetId ? getStopById(targetId) : null;

  let distKmStr = '';
  let etaSec = 0;
  if (targetLoc) {
    const distPx = Math.hypot(targetLoc.x - heli.x, targetLoc.y - heli.y);
    distKmStr = toBanglaDigits((distPx / PIXELS_PER_KM).toFixed(1));
    etaSec = Math.max(0, Math.round(distPx / CRUISE_SPEED));
  }

  // Isometric projection onto 210x250 mini-map matching actual Dhaka geographic layout!
  // wx-wy spans [-10080..0] -> padded [-11000..+1200] (span 12200)
  // wx+wy spans [3780..27720] -> padded [2400..29200] (span 26800)
  const toMapX = (wx: number, wy: number) => ((wx - wy + 11000) / 12200) * 180 + 15;
  const toMapY = (wx: number, wy: number) => ((wx + wy - 2400) / 26800) * 212 + 19;

  const hx = toMapX(heli.x, heli.y);
  const hy = toMapY(heli.x, heli.y);

  const isoVx = (Math.cos(heli.headingAngle) - Math.sin(heli.headingAngle)) * ISO_COS;
  const isoVy = (Math.cos(heli.headingAngle) + Math.sin(heli.headingAngle)) * ISO_SIN;
  const screenHeadingDeg = (Math.atan2(isoVy, isoVx) * 180) / Math.PI;

  let aiX = 0;
  let aiY = 0;
  let aiDeg = 0;
  if (aiHeli) {
    aiX = toMapX(aiHeli.x, aiHeli.y);
    aiY = toMapY(aiHeli.x, aiHeli.y);
    const aVx = (Math.cos(aiHeli.headingAngle) - Math.sin(aiHeli.headingAngle)) * ISO_COS;
    const aVy = (Math.cos(aiHeli.headingAngle) + Math.sin(aiHeli.headingAngle)) * ISO_SIN;
    aiDeg = (Math.atan2(aVy, aVx) * 180) / Math.PI;
  }

  const activeRouteSet = new Set(activeRoute.stops);

  const waitingCountByStop: Record<string, number> = {};
  for (const pad of ROOFTOP_PADS) {
    waitingCountByStop[pad.zoneId] = (waitingByPad[pad.padId] ?? []).length;
  }

  return (
    <div className={`bg-slate-900/92 border border-slate-700/90 rounded-2xl shadow-xl backdrop-blur-sm ${compact ? "w-[176px] p-2" : "w-[224px] sm:w-[252px] p-2.5"}`}>
      <div className="flex items-center justify-between text-[11px] px-1 mb-1">
        <span className="font-bold text-slate-100">ঢাকা রুট ম্যাপ</span>
        <span className="text-amber-300 font-semibold">
          {routeDirection === 'FORWARD' ? 'যাওয়া →' : '← ফেরা'}
        </span>
      </div>

      <svg
        viewBox="0 0 210 250"
        className={`w-full ${compact ? "h-[124px]" : "h-[192px] sm:h-[220px]"} rounded-xl bg-slate-950 border border-slate-800 block`}
      >
        {/* Background Faint All-3 Dhaka Corridors */}
        {DHAKA_ROUTES.map((r) => {
          if (r.id === activeRoute.id) return null;
          const pts = r.stops
            .map((id) => {
              const s = getStopById(id);
              return `${toMapX(s.x, s.y)},${toMapY(s.x, s.y)}`;
            })
            .join(' ');
          return (
            <polyline
              key={r.id}
              points={pts}
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
              opacity="0.55"
            />
          );
        })}

        {/* Active Selected Route Polyline */}
        <polyline
          points={activeRoute.stops
            .map((id) => {
              const s = getStopById(id);
              return `${toMapX(s.x, s.y)},${toMapY(s.x, s.y)}`;
            })
            .join(' ')}
          fill="none"
          stroke={activeRoute.color}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.92"
        />

        {/* Direction Lines to Seated Destinations */}
        {Array.from(seatedDestIds).map((destId) => {
          const loc = getStopById(destId);
          const isPrimary = targetId === destId;
          return (
            <line
              key={destId}
              x1={hx}
              y1={hy}
              x2={toMapX(loc.x, loc.y)}
              y2={toMapY(loc.x, loc.y)}
              stroke={isPrimary ? '#34D399' : '#FBBF24'}
              strokeWidth={isPrimary ? '1.8' : '1.2'}
              strokeDasharray="4 3"
            />
          );
        })}

        {/* Stops on Map */}
        {DHAKA_LOCATIONS.map((loc) => {
          const onRoute = activeRouteSet.has(loc.id);
          const lx = toMapX(loc.x, loc.y);
          const ly = toMapY(loc.x, loc.y);
          const isDropoff = seatedDestIds.has(loc.id);
          const isTarget = targetId === loc.id;
          const waitCount = waitingCountByStop[loc.id] ?? 0;
          const showLabel = onRoute || isDropoff || isTarget || KEY_LANDMARK_IDS.has(loc.id);

          return (
            <g
              key={loc.id}
              onClick={() => onSelectDest(isTarget ? null : loc.id)}
              className="cursor-pointer"
            >
              {isDropoff && (
                <circle
                  cx={lx}
                  cy={ly}
                  r={7.5}
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="1.5"
                />
              )}
              <circle
                cx={lx}
                cy={ly}
                r={isDropoff ? 4.4 : onRoute ? (waitCount > 0 ? 3.6 : 3.0) : 1.9}
                fill={
                  isDropoff
                    ? '#10B981'
                    : onRoute
                      ? waitCount > 0
                        ? '#FBBF24'
                        : '#F8FAFC'
                      : '#475569'
                }
                stroke="#0F172A"
                strokeWidth="0.9"
              />
              {showLabel && (
                <text
                  x={lx}
                  y={ly - 6}
                  textAnchor="middle"
                  stroke="#020617"
                  strokeWidth="2.4"
                  paintOrder="stroke"
                  fill={
                    isDropoff
                      ? '#6EE7B7'
                      : isTarget
                        ? '#FDE047'
                        : onRoute
                          ? '#FFFFFF'
                          : '#94A3B8'
                  }
                  fontSize={isDropoff || isTarget ? '9.5' : onRoute ? '8.8' : '7.5'}
                  fontWeight={onRoute || isDropoff || isTarget ? '700' : '600'}
                  fontFamily="Hind Siliguri, sans-serif"
                >
                  {loc.nameBn}
                </text>
              )}
            </g>
          );
        })}

        {/* AI Helicopter Marker (Emerald) */}
        {aiHeli && (
          <g transform={`translate(${aiX}, ${aiY}) rotate(${aiDeg})`}>
            <polygon
              points="6,0 -3.5,-4 -1.5,0 -3.5,4"
              fill="#10B981"
              stroke="#ECFDF5"
              strokeWidth="1"
            />
          </g>
        )}

        {/* Player Helicopter Marker (Amber-Cyan) */}
        <g transform={`translate(${hx}, ${hy}) rotate(${screenHeadingDeg})`}>
          <polygon
            points="7.5,0 -4.5,-4.8 -2,0 -4.5,4.8"
            fill="#FACC15"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
        </g>
      </svg>

      <div className="mt-1.5 px-1 text-[11px] flex items-center justify-between gap-1">
        {targetLoc ? (
          <>
            <span className="text-emerald-300 font-semibold truncate">
              {seatedDestIds.has(targetLoc.id) ? 'নামবে' : 'লক্ষ্য'}: {targetLoc.nameBn}
            </span>
            <span className="text-slate-200 font-mono-num shrink-0">
              {distKmStr} কি.মি. · ~{toBanglaDigits(etaSec)} সে.
            </span>
          </>
        ) : (
          <span className="text-slate-400">স্টপেজ ক্লিক করে দিক দেখুন</span>
        )}
      </div>
    </div>
  );
};
