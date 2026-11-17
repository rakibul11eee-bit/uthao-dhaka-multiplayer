import React from 'react';
import { DialogueBannerItem } from '../types/game';
import { Volume2 } from 'lucide-react';

interface LiveDialogueBannerProps {
  dialogue: DialogueBannerItem | null;
}

export const LiveDialogueBanner: React.FC<LiveDialogueBannerProps> = ({ dialogue }) => {
  if (!dialogue) return null;

  const badgeStyles =
    dialogue.speakerRole === 'driver'
      ? 'bg-teal-500 text-slate-950'
      : dialogue.speakerRole === 'helper'
        ? 'bg-amber-400 text-slate-950'
        : 'bg-emerald-400 text-slate-950';

  return (
    <div className="pointer-events-none fixed top-[70px] left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
      <div className="bg-slate-950/90 border border-slate-700 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-sm flex items-center gap-3">
        <span
          className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${badgeStyles}`}
        >
          {dialogue.speakerName}
        </span>
        <p className="text-sm sm:text-base font-medium text-white truncate flex-1">
          “{dialogue.text}”
        </p>
        <Volume2 className="w-4 h-4 text-amber-300 shrink-0" />
      </div>
    </div>
  );
};
