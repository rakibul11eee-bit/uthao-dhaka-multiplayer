import React, { useEffect, useState } from 'react';
import { HelicopterState } from '../types/game';
import { toBanglaDigits } from '../data/dhakaData';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CabinInteriorViewProps {
  heli: HelicopterState;
}

export const CabinInteriorView: React.FC<CabinInteriorViewProps> = ({ heli }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [tick, setTick] = useState(0);

  // Smooth live animation loop for driver & passengers inside the cabin
  useEffect(() => {
    if (collapsed) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setTick((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [collapsed]);

  const seatedCount = heli.seats.filter((s) => s !== null).length;
  const isFlying = heli.altitude > 5;
  const isCruising = isFlying && heli.autoCruise;
  const isCalling = heli.helperCallingTimer > 0;

  // Live animated offsets for driver & passengers
  const cabinBob = isFlying ? Math.sin(tick * 7.5) * 1.4 : 0;
  const stickSway = isCruising ? Math.sin(tick * 4.2) * 5 : Math.sin(tick * 1.5) * 1.5;
  const pilotHeadTurn = isCruising ? Math.sin(tick * 2.1) * 2.2 : Math.sin(tick * 1.2) * 1;
  const pilotArmY = isCruising ? Math.sin(tick * 4.2) * 2 : 0;
  const cloudShift = isCruising ? (tick * 34) % 88 : (tick * 8) % 88;

  return (
    <div className="bg-slate-900/92 border border-slate-700/90 rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden w-[245px] sm:w-[280px]">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-slate-100 bg-slate-950/60 hover:bg-slate-950/90 transition-colors cursor-pointer"
      >
        <span>কেবিনের ভেতরের দৃশ্য ({toBanglaDigits(seatedCount)}/৩ যাত্রী)</span>
        {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {!collapsed && (
        <div className="p-2.5 space-y-2">
          <svg
            viewBox="0 0 260 132"
            className="w-full h-[118px] rounded-xl bg-slate-950 border border-slate-800 block"
          >
            <defs>
              <linearGradient id="windshieldSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isFlying ? '#0284C7' : '#38BDF8'} />
                <stop offset="100%" stopColor={isFlying ? '#FDE68A' : '#CBD5E1'} />
              </linearGradient>
              <clipPath id="cabinWindowsClip">
                <path d="M 14 14 L 96 14 L 96 58 L 14 58 Z" />
              </clipPath>
            </defs>

            {/* Cabin Interior Wall (Yellow/White/Black Air Taxi trim) */}
            <rect x="0" y="0" width="260" height="132" fill="#0F172A" />
            <rect x="0" y="0" width="260" height="7" fill="#FACC15" />

            {/* Panoramic Cockpit & Side Windows */}
            <path d="M 14 14 L 96 14 L 96 58 L 14 58 Z" fill="url(#windshieldSky)" />
            <rect x="104" y="16" width="44" height="36" rx="5" fill="url(#windshieldSky)" />
            <rect x="154" y="16" width="44" height="36" rx="5" fill="url(#windshieldSky)" />
            <rect x="204" y="16" width="44" height="36" rx="5" fill="url(#windshieldSky)" />

            {/* Moving Clouds & Passing Dhaka Skyline in Windshield */}
            <g clipPath="url(#cabinWindowsClip)">
              <ellipse cx={100 - cloudShift} cy="25" rx="14" ry="5" fill="#FFFFFF" opacity="0.8" />
              <ellipse cx={145 - cloudShift} cy="32" rx="10" ry="4" fill="#FFFFFF" opacity="0.65" />
              <rect
                x="14"
                y={isFlying ? 46 : 38}
                width="82"
                height={isFlying ? 12 : 20}
                fill="#334155"
                opacity="0.7"
              />
            </g>

            {/* Moving City Dots in Passenger Side Windows */}
            {[104, 154, 204].map((wx, wi) => (
              <g key={wi}>
                <rect
                  x={wx + 4}
                  y={isFlying ? 42 : 36}
                  width="36"
                  height={isFlying ? 10 : 16}
                  fill="#475569"
                  opacity="0.55"
                />
                <circle
                  cx={wx + 40 - ((cloudShift * 0.5 + wi * 12) % 36)}
                  cy="26"
                  r="3.5"
                  fill="#FFFFFF"
                  opacity="0.7"
                />
              </g>
            ))}

            {/* Cockpit Dashboard & Moving Cyclic Stick */}
            <rect x="12" y="65" width="78" height="54" rx="6" fill="#1E293B" stroke="#334155" />
            <circle
              cx="28"
              cy="77"
              r="5"
              fill={Math.sin(tick * 5) > 0 ? '#10B981' : '#059669'}
            />
            <circle
              cx="43"
              cy="77"
              r="5"
              fill={isCruising ? '#FACC15' : '#D97706'}
            />
            {/* Cyclic Stick moving with pilot's hand */}
            <line
              x1="65"
              y1="95"
              x2={66 + stickSway}
              y2="65"
              stroke="#94A3B8"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx={66 + stickSway} cy="64" r="4.2" fill="#DC2626" />

            {/* Animated Cartoon Pilot sitting in Cockpit */}
            <g transform={`translate(0, ${cabinBob * 0.6})`}>
              {/* Pilot Torso & White Uniform Shirt with Collar + Yellow Epaulettes */}
              <rect x="16" y="45" width="24" height="27" rx="7" fill="#0F172A" stroke="#334155" strokeWidth="1" />
              <path d="M 22 45 L 28 53 L 34 45 Z" fill="#F8FAFC" />
              <rect x="17" y="45" width="6" height="2.5" rx="1" fill="#FACC15" />
              <rect x="33" y="45" width="6" height="2.5" rx="1" fill="#FACC15" />

              {/* Pilot Arm & Cartoon Hand gripping cyclic stick */}
              <line
                x1="37"
                y1="54"
                x2={64 + stickSway}
                y2={64 + pilotArmY}
                stroke="#D99B72"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              <circle cx={65 + stickSway} cy={64 + pilotArmY} r="3" fill="#D99B72" stroke="#0F172A" strokeWidth="0.8" />

              {/* Cartoon Pilot Head + Ears + Hair + Aviator Glasses + Smile + Headset */}
              <g transform={`translate(${pilotHeadTurn}, 0)`}>
                <rect x="25.5" y="41" width="5" height="5" rx="2" fill="#D99B72" />
                <circle cx="18.5" cy="34" r="2.2" fill="#D99B72" />
                <circle cx="37.5" cy="34" r="2.2" fill="#D99B72" />
                <circle cx="28" cy="33.5" r="10" fill="#D99B72" stroke="#0F172A" strokeWidth="1" />
                {/* Cartoon Pilot Hair & Headset Band */}
                <path d="M 18 31 Q 22 20 29 22 Q 36 21 38 31 Q 33 27 28 27.5 Q 23 27 18 31 Z" fill="#0F172A" />
                <path d="M 18 33 A 10.5 10.5 0 0 1 38 33" fill="none" stroke="#FACC15" strokeWidth="1.6" />
                {/* Aviator Sunglasses */}
                <rect x="20.5" y="30.5" width="6.2" height="4.2" rx="1.5" fill="#09090B" stroke="#94A3B8" strokeWidth="0.6" />
                <rect x="28.8" y="30.5" width="6.2" height="4.2" rx="1.5" fill="#09090B" stroke="#94A3B8" strokeWidth="0.6" />
                <line x1="26.7" y1="32" x2="28.8" y2="32" stroke="#94A3B8" strokeWidth="0.8" />
                {/* Smile & Headset Mic */}
                <path d="M 25 38 Q 28 40.2 31 38" fill="none" stroke="#7F1D1D" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="19" y1="35" x2="26" y2="39" stroke="#FACC15" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="26.5" cy="39" r="1.4" fill="#0F172A" />
              </g>
            </g>
            <text
              x="28"
              y="112"
              textAnchor="middle"
              fill="#FACC15"
              fontSize="8.5"
              fontWeight="700"
              fontFamily="Hind Siliguri, sans-serif"
            >
              চালক
            </text>

            {/* Cabin Divider */}
            <line x1="98" y1="10" x2="98" y2="122" stroke="#FACC15" strokeWidth="2" />

            {/* 3 Tan Leather Passenger Seats with Expressive Cartoon Passengers */}
            {[0, 1, 2].map((idx) => {
              const sx = 104 + idx * 50;
              const p = heli.seats[idx];
              const pBob = isFlying ? Math.sin(tick * 6 + idx * 1.8) * 1.6 : Math.sin(tick * 2 + idx) * 0.6;
              const pHeadNod = Math.sin(tick * 2.4 + idx * 2.1) * 1.8;
              const pArmWave = Math.sin(tick * 4.5 + idx * 1.5) * 4;
              const isFemale = p?.persona === 'aunty' || p?.persona === 'student';
              const isUncle = p?.persona === 'uncle' || p?.persona === 'merchant';

              return (
                <g key={idx}>
                  {/* Tan Leather Seat Backrest & Cushion */}
                  <rect x={sx + 4} y="56" width="36" height="44" rx="6" fill="#C6976E" stroke="#9A6F49" />
                  <rect x={sx + 2} y="92" width="40" height="12" rx="4" fill="#B5835A" />

                  {p ? (
                    <g transform={`translate(0, ${pBob})`}>
                      {/* Cartoon Torso + Collar/Dupatta */}
                      <rect
                        x={sx + 9}
                        y="60"
                        width="26"
                        height="32"
                        rx="7"
                        fill={p.shirtColor}
                        stroke="#0F172A"
                        strokeWidth="1"
                      />
                      <path
                        d={`M ${sx + 17} 60 L ${sx + 22} 66 L ${sx + 27} 60 Z`}
                        fill={isFemale ? '#FEF08A' : '#F8FAFC'}
                      />
                      {/* Seatbelt */}
                      <line x1={sx + 12} y1="62" x2={sx + 30} y2="90" stroke="#FBBF24" strokeWidth="2.5" />
                      {/* Animated Cartoon Arm & Hand gesturing */}
                      <line
                        x1={sx + 33}
                        y1="66"
                        x2={sx + 40}
                        y2={57 + pArmWave}
                        stroke={p.skinColor}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <circle
                        cx={sx + 40}
                        cy={57 + pArmWave}
                        r="2.4"
                        fill={p.skinColor}
                        stroke="#0F172A"
                        strokeWidth="0.7"
                      />
                      {/* Expressive Cartoon Head turning & nodding */}
                      <g transform={`translate(${pHeadNod}, 0)`}>
                        <rect x={sx + 19.5} y="56" width="5" height="5" rx="2" fill={p.skinColor} />
                        <circle cx={sx + 12} cy="48" r="2.2" fill={p.skinColor} />
                        <circle cx={sx + 32} cy="48" r="2.2" fill={p.skinColor} />
                        <circle
                          cx={sx + 22}
                          cy="47.5"
                          r="10"
                          fill={p.skinColor}
                          stroke="#0F172A"
                          strokeWidth="1"
                        />
                        {/* Hair / Bun / Cap */}
                        {isFemale ? (
                          <>
                            <path
                              d={`M ${sx + 12} 45 Q ${sx + 22} 34 ${sx + 32} 45 Q ${sx + 26} 41 ${sx + 22} 41.5 Q ${sx + 17} 41 ${sx + 12} 45 Z`}
                              fill="#0F172A"
                            />
                            <circle cx={sx + 30} cy="41" r="3.4" fill={p.shirtColor} stroke="#0F172A" strokeWidth="0.7" />
                          </>
                        ) : (
                          <path
                            d={`M ${sx + 12} 45 Q ${sx + 17} 35 ${sx + 24} 36 Q ${sx + 31} 36 ${sx + 32} 45 Q ${sx + 27} 40.5 ${sx + 22} 41 Q ${sx + 17} 40.5 ${sx + 12} 45 Z`}
                            fill={isUncle ? '#64748B' : '#0F172A'}
                          />
                        )}
                        {/* Big Cartoon Eyes */}
                        <circle cx={sx + 18.5} cy="47" r="2.1" fill="#FFFFFF" />
                        <circle cx={sx + 25.5} cy="47" r="2.1" fill="#FFFFFF" />
                        <circle cx={sx + 19} cy="47" r="1.15" fill="#0F172A" />
                        <circle cx={sx + 26} cy="47" r="1.15" fill="#0F172A" />
                        {/* Rosy cheeks */}
                        <circle cx={sx + 15.5} cy="50" r="1.4" fill="#FB7185" opacity="0.45" />
                        <circle cx={sx + 28.5} cy="50" r="1.4" fill="#FB7185" opacity="0.45" />
                        {/* Mustache for uncle */}
                        {isUncle && (
                          <path
                            d={`M ${sx + 18} 51 Q ${sx + 22} 49.5 ${sx + 26} 51`}
                            fill="none"
                            stroke="#475569"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        )}
                        {/* Cartoon Smile */}
                        <path
                          d={`M ${sx + 19} 52.5 Q ${sx + 22} 55 ${sx + 25} 52.5`}
                          fill="none"
                          stroke="#7F1D1D"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </g>
                    </g>
                  ) : (
                    <text
                      x={sx + 22}
                      y="82"
                      textAnchor="middle"
                      fill="#78350F"
                      fontSize="8"
                      fontWeight="600"
                      fontFamily="Hind Siliguri, sans-serif"
                    >
                      খালি
                    </text>
                  )}

                  {p && (
                    <text
                      x={sx + 22}
                      y="119"
                      textAnchor="middle"
                      fill="#FDE68A"
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="Hind Siliguri, sans-serif"
                    >
                      {p.destinationNameBn}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Helper leaning & waving when calling */}
            {isCalling && (
              <g>
                <rect x="102" y="4" width="152" height="18" rx="4" fill="#FEF08A" stroke="#B45309" />
                <text
                  x="178"
                  y="16"
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="Hind Siliguri, sans-serif"
                >
                  হেল্পার: “যাত্রী! উঠেন উঠেন!”
                </text>
              </g>
            )}
          </svg>

          {/* Cabin Status Quote */}
          <div className="text-[11px] text-slate-300 px-1 truncate">
            {seatedCount > 0 ? (
              <span>
                {heli.seats.find((s) => s !== null)?.nameBn}:{' '}
                {isFlying ? '“জ্যাম নাই, উড়তেই থাকুন ওস্তাদ!”' : '“আমরা কি পৌঁছে গেছি?”'}
              </span>
            ) : (
              <span>কেবিন ফাঁকা — ছাদে নেমে হাঁক ছাড়ুন!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
