import React, { useState, useEffect } from 'react';
import { Passenger, RooftopPad } from '../types/game';
import { DRIVER_COUNTER_LINES_BN, toBanglaDigits } from '../data/dhakaData';
import { soundEngine } from '../utils/soundEngine';
import { X, MessageCircle, Check, TrendingUp, HeartHandshake, ArrowRight, Ban, MapPin } from 'lucide-react';

interface BargainModalProps {
  pad: RooftopPad;
  waitingPassengers: Passenger[];
  freeSeatsCount: number;
  onAcceptPassenger: (passenger: Passenger, finalFare: number) => void;
  onRejectPassenger: (passengerId: string) => void;
  onDialogueSpeak: (role: 'driver' | 'helper' | 'passenger', speakerName: string, text: string) => void;
  onClose: () => void;
}

export const BargainModal: React.FC<BargainModalProps> = ({
  pad,
  waitingPassengers,
  freeSeatsCount,
  onAcceptPassenger,
  onRejectPassenger,
  onDialogueSpeak,
  onClose,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activePassenger = waitingPassengers[selectedIdx] ?? waitingPassengers[0] ?? null;

  const [patience, setPatience] = useState(activePassenger?.patience ?? 85);
  const [passengerOffer, setPassengerOffer] = useState(activePassenger?.currentOffer ?? 60);
  const [maxWilling, setMaxWilling] = useState(activePassenger?.maxWilling ?? 100);
  const [sweetTalkUsed, setSweetTalkUsed] = useState(activePassenger?.sweetTalkUsed ?? false);
  const [driverLine, setDriverLine] = useState('');
  const [passengerLine, setPassengerLine] = useState(activePassenger?.openingLineBn ?? '');
  const [walkedAway, setWalkedAway] = useState(false);

  useEffect(() => {
    if (!activePassenger) return;
    setPatience(activePassenger.patience);
    setPassengerOffer(activePassenger.currentOffer);
    setMaxWilling(activePassenger.maxWilling);
    setSweetTalkUsed(activePassenger.sweetTalkUsed);
    setDriverLine('');
    setPassengerLine(activePassenger.openingLineBn);
    setWalkedAway(false);
    onDialogueSpeak('passenger', activePassenger.nameBn, activePassenger.openingLineBn);
  }, [activePassenger?.id]);

  useEffect(() => {
    if (selectedIdx >= waitingPassengers.length && waitingPassengers.length > 0) {
      setSelectedIdx(0);
    }
  }, [waitingPassengers.length, selectedIdx]);

  if (!activePassenger) {
    return (
      <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center space-y-4">
          <h3 className="text-xl font-bold text-white">{pad.labelBn}-এ আর যাত্রী নেই</h3>
          <p className="text-sm text-slate-300">পাশের বাড়ির ছাদে বা অন্য স্টপেজে উড়ে যান।</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
          >
            ছাদ থেকে উড়ুন
          </button>
        </div>
      </div>
    );
  }

  const moodLabel =
    patience >= 65 ? 'খুশি' : patience >= 35 ? 'ভাবছে' : 'রেগে যাচ্ছে';
  const moodColor =
    patience >= 65
      ? 'text-emerald-400'
      : patience >= 35
        ? 'text-amber-400'
        : 'text-rose-400';
  const moodBarBg =
    patience >= 65
      ? 'bg-emerald-500'
      : patience >= 35
        ? 'bg-amber-500'
        : 'bg-rose-500';

  const kmText = toBanglaDigits(activePassenger.distanceKm);

  const handleCounterOffer = (askedFare: number) => {
    if (walkedAway || freeSeatsCount <= 0) return;

    const lineGen = DRIVER_COUNTER_LINES_BN[Math.floor(Math.random() * DRIVER_COUNTER_LINES_BN.length)];
    const dLine = lineGen(askedFare, kmText);
    setDriverLine(dLine);
    onDialogueSpeak('driver', 'ড্রাইভার', dLine);

    if (askedFare <= passengerOffer) {
      const pReply = `আচ্ছা ঠিক আছে ভাই, ${toBanglaDigits(askedFare)} টাকায় চলেন! উঠলাম!`;
      setPassengerLine(pReply);
      soundEngine.playBargainAccept();
      onAcceptPassenger(activePassenger, askedFare);
      return;
    }

    if (askedFare <= maxWilling) {
      const ratio = (askedFare - passengerOffer) / Math.max(10, maxWilling - passengerOffer);
      if (ratio <= 0.72 || Math.random() > 0.36) {
        const pReply = `আচ্ছা ${toBanglaDigits(askedFare)} টাকাই দিলাম ভাই, তাড়াতাড়ি উড়ান!`;
        setPassengerLine(pReply);
        soundEngine.playBargainAccept();
        window.setTimeout(() => {
          onDialogueSpeak('passenger', activePassenger.nameBn, pReply);
        }, 450);
        onAcceptPassenger(activePassenger, askedFare);
        return;
      } else {
        const bumped = Math.min(
          askedFare,
          Math.round(((passengerOffer + askedFare) / 2) / 10) * 10
        );
        const nextOffer = Math.max(passengerOffer + 10, bumped);
        const nextPatience = Math.max(15, patience - 18);
        setPassengerOffer(nextOffer);
        setPatience(nextPatience);
        const pReply = `উফ ভাই! ${toBanglaDigits(askedFare)} টাকা বেশি হয়। আমি ${toBanglaDigits(
          nextOffer
        )} টাকা পর্যন্ত দিতে পারবো!`;
        setPassengerLine(pReply);
        soundEngine.playClick();
        window.setTimeout(() => {
          onDialogueSpeak('passenger', activePassenger.nameBn, pReply);
        }, 650);
        return;
      }
    }

    // Over maxWilling
    const overAmount = askedFare - maxWilling;
    const patienceLoss = overAmount >= 50 ? 48 : 30;
    const nextPatience = patience - patienceLoss;

    if (nextPatience <= 0) {
      setPatience(0);
      setWalkedAway(true);
      soundEngine.playBargainReject();
      const pReply = 'ধুর ভাই! এতো ভাড়ায় আমি মেট্রোরেলেই চলে যাবো! থাক!';
      setPassengerLine(pReply);
      window.setTimeout(() => {
        onDialogueSpeak('passenger', activePassenger.nameBn, pReply);
      }, 650);
    } else {
      const slightBump = Math.min(maxWilling, passengerOffer + 10);
      setPassengerOffer(slightBump);
      setPatience(nextPatience);
      soundEngine.playClick();
      const pReply = `এতো টাকা?! তেল কি সোনা দিয়ে কেনেন? শেষ কথা ${toBanglaDigits(slightBump)} টাকা!`;
      setPassengerLine(pReply);
      window.setTimeout(() => {
        onDialogueSpeak('passenger', activePassenger.nameBn, pReply);
      }, 650);
    }
  };

  const handleSweetTalk = () => {
    if (sweetTalkUsed || walkedAway) return;
    const dLine = `মামা, ${kmText} কিলোমিটার জ্যাম ছাড়া ৫ মিনিটে নামায় দিমু!`;
    setDriverLine(dLine);
    onDialogueSpeak('driver', 'ড্রাইভার', dLine);

    soundEngine.playClick();
    setSweetTalkUsed(true);
    setPatience((p) => Math.min(100, p + 16));
    setMaxWilling((m) => m + 20);
    setPassengerOffer((o) => o + 10);
    const pReply = `হুমম, দ্রুত পৌঁছে দিলে ${toBanglaDigits(passengerOffer + 10)} টাকা দিতে পারি।`;
    setPassengerLine(pReply);
    window.setTimeout(() => {
      onDialogueSpeak('passenger', activePassenger.nameBn, pReply);
    }, 650);
  };

  const handleCancelPassenger = () => {
    const dLine = `সরি ভাই, ${activePassenger.destinationNameBn} (${kmText} কি.মি.) এখন যাওয়া হবে না!`;
    onDialogueSpeak('driver', 'ড্রাইভার', dLine);
    soundEngine.playClick();
    onRejectPassenger(activePassenger.id);
  };

  const counterOptions = [
    passengerOffer + 20,
    Math.max(passengerOffer + 30, activePassenger.baseFare),
    Math.max(passengerOffer + 50, activePassenger.baseFare + 30),
  ];
  const uniqueCounters = Array.from(new Set(counterOptions)).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/70 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <span>{pad.labelBn}</span>
              <span aria-hidden="true">·</span>
              <span>খালি আসন: {toBanglaDigits(freeSeatsCount)}/৩</span>
            </div>
            <h3 className="text-lg font-bold text-white">যাত্রীর রুট ও ভাড়া দর কষাকষি</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Waiting Passenger Tabs */}
        {waitingPassengers.length > 1 && (
          <div className="px-6 pt-4 flex items-center gap-2 overflow-x-auto">
            {waitingPassengers.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  idx === selectedIdx
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.nameBn} → {p.destinationNameBn} ({toBanglaDigits(p.distanceKm)} কি.মি.)
              </button>
            ))}
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-4">
          {/* Passenger Info + Distance Highlight */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border border-slate-700 shrink-0"
                style={{ backgroundColor: activePassenger.shirtColor }}
              >
                <div
                  className="w-6 h-6 rounded-full border border-slate-900/30"
                  style={{ backgroundColor: activePassenger.skinColor }}
                />
              </div>
              <div>
                <div className="text-base font-bold text-white">
                  {activePassenger.nameBn}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({activePassenger.personaLabelBn})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-teal-300 font-semibold mt-0.5">
                  <span>{pad.zoneNameBn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{activePassenger.destinationNameBn}</span>
                </div>
              </div>
            </div>

            <div className="min-w-[130px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">যাত্রীর ধৈর্য</span>
                <span className={`font-semibold ${moodColor}`}>{moodLabel}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${moodBarBg}`}
                  style={{ width: `${Math.max(0, Math.min(100, patience))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Route Distance & Market Rate Strip */}
          <div className="grid grid-cols-3 gap-2.5 text-sm">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-400" />
                গন্তব্যের দূরত্ব
              </div>
              <div className="text-lg font-bold text-teal-300 font-mono-num mt-0.5">
                {kmText} কি.মি.
              </div>
              <div className="text-[11px] text-slate-400 font-mono-num">
                সময় ~{toBanglaDigits(activePassenger.etaSec)} সে.
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">ন্যায্য বাজার ভাড়া</div>
              <div className="text-lg font-bold text-slate-200 font-mono-num mt-0.5">
                ~৳{toBanglaDigits(activePassenger.baseFare)}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">যাত্রীর প্রস্তাব</div>
              <div className="text-lg font-bold text-amber-400 font-mono-num mt-0.5">
                ৳{toBanglaDigits(passengerOffer)}
              </div>
            </div>
          </div>

          {/* Live Driver & Passenger Dialogue Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            {driverLine && (
              <div className="flex items-start gap-2 text-xs sm:text-sm text-teal-300">
                <span className="font-bold shrink-0">ড্রাইভার:</span>
                <span>“{driverLine}”</span>
              </div>
            )}
            <div className="flex items-start gap-2.5 text-sm sm:text-base text-slate-100">
              <MessageCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-300 mr-1.5">
                  {activePassenger.nameBn}:
                </span>
                <span>“{passengerLine}”</span>
              </div>
            </div>
          </div>

          {/* Bargaining Actions */}
          {freeSeatsCount <= 0 ? (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm text-center">
              ৩টি আসনই পূর্ণ! আগে কোনো যাত্রীকে গন্তব্যে নামিয়ে আসুন।
            </div>
          ) : walkedAway ? (
            <button
              type="button"
              onClick={() => onRejectPassenger(activePassenger.id)}
              className="w-full py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold cursor-pointer"
            >
              যাত্রী চলে গেছেন — পরের জন দেখুন
            </button>
          ) : (
            <div className="space-y-2.5">
              {/* Accept */}
              <button
                type="button"
                onClick={() => {
                  const acceptLine = `উঠেন ভাই, ${toBanglaDigits(passengerOffer)} টাকায় চলেন!`;
                  onDialogueSpeak('driver', 'ড্রাইভার', acceptLine);
                  soundEngine.playBargainAccept();
                  onAcceptPassenger(activePassenger, passengerOffer);
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>৳{toBanglaDigits(passengerOffer)}-তে যাত্রী নিন</span>
              </button>

              {/* Counter Offer Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {uniqueCounters.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleCounterOffer(amt)}
                    className="py-2.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span className="font-mono-num">৳{toBanglaDigits(amt)} চান</span>
                  </button>
                ))}
              </div>

              {/* Sweet Talk & Cancel */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={sweetTalkUsed}
                  onClick={handleSweetTalk}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    sweetTalkUsed
                      ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                      : 'bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 cursor-pointer'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 shrink-0" />
                  <span>{sweetTalkUsed ? 'অনুরোধ করা হয়েছে' : '“জ্যাম ছাড়া ৫ মিনিটে!”'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelPassenger}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4 shrink-0" />
                  <span>যাত্রী বাতিল করুন</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            ছাদ থেকে উড়ে যান
          </button>
        </div>
      </div>
    </div>
  );
};
