export type HeliAudioMode = 'OFF' | 'HOVER' | 'FLYING' | 'DESCENDING';

/**
 * Converts Bengali Unicode text into clean phonetic Romanized Bangla (Banglish)
 * as a last-resort offline fallback when a PC has neither internet nor a Bengali OS voice pack,
 * preventing Windows/Chrome from reading raw UTF-8 codepoints in an unknown language.
 */
function banglaToPhonetic(text: string): string {
  const wordMap: Record<string, string> = {
    'উঠেন': 'uthen',
    'যাত্রী': 'jatri',
    'সিট': 'seat',
    'খালি': 'khali',
    'আছে': 'ache',
    'ডাইরেক্ট': 'direct',
    'ছাদে': 'chhade',
    'নিচে': 'niche',
    'জ্যাম': 'jam',
    'ফাটানো': 'fatano',
    'রোদ': 'rod',
    'আকাশে': 'akashe',
    'আসেন': 'ashen',
    'মামা': 'mama',
    'পায়ে': 'paye',
    'উঠুন': 'uthun',
    'হেলিকপ্টার': 'helicopter',
    'হেলিকপ্টারে': 'helicopter-e',
    'ভাই': 'bhai',
    'যাবো': 'jabo',
    'মিটিং': 'meeting',
    'টাকা': 'taka',
    'দিমু': 'dimu',
    'বস': 'boss',
    'নামায়': 'namay',
    'দেন': 'den',
    'ফিক্সড': 'fixed',
    'নিবেন': 'niben',
    'স্টুডেন্ট': 'student',
    'মানুষ': 'manush',
    'রাখেন': 'rakhen',
    'ভাইয়া': 'bhaiya',
    'ক্লাস': 'class',
    'মিস': 'miss',
    'হয়ে': 'hoye',
    'যাবে': 'jabe',
    'উঠান': 'uthan',
    'চলেন': 'cholen',
    'ভাতিজা': 'bhatija',
    'চলো': 'cholo',
    'আরে': 'arey',
    'মিয়া': 'miya',
    'ছাদ': 'chhad',
    'থেকে': 'theke',
    'তুলে': 'tule',
    'নাও': 'nao',
    'আসো': 'asho',
    'ও': 'o',
    'ড্রাইভার': 'driver',
    'কত': 'koto',
    'নিবা': 'niba',
    'শোনেন': 'shonen',
    'দাওয়াত': 'dawat',
    'নিয়ে': 'niye',
    'পাইলট': 'pilot',
    'পথ': 'poth',
    'ব্রো': 'bro',
    'সার্ভিস': 'service',
    'দারুণ': 'darun',
    'ইয়ো': 'yo',
    'ড্রপ': 'drop',
    'দিবা': 'diba',
    'দিচ্ছি': 'dicchi',
    'হ্যালো': 'hello',
    'পিক': 'pick',
    'আপ': 'up',
    'দাও': 'dao',
    'ওস্তাদ': 'ostad',
    'মাল': 'maal',
    'ডেলিভারি': 'delivery',
    'নগদ': 'nogod',
    'দাম': 'dam',
    'বেশি': 'beshi',
    'চাইয়েন': 'chaiyen',
    'না': 'na',
    'পর্যন্ত': 'porjonto',
    'টাকাই': 'takai',
    'ন্যায্য': 'najjo',
    'নামেন': 'namen',
    'কিলোমিটার': 'kilometer',
    'আকাশপথ': 'akashpoth',
    'লাগবেই': 'lagbei',
    'তেলের': 'teler',
    'দেখেন': 'dekhen',
    'উড়তে': 'urte',
    'হবে': 'hobe',
    'জ্যামে': 'jam-e',
    'ঘণ্টা': 'ghonta',
    'লাগতো': 'lagto',
    'আমি': 'ami',
    'কয়েক': 'koyek',
    'মিনিটে': 'minute-e',
    'নামাবো': 'namabo',
    'আচ্ছা': 'accha',
    'ঠিক': 'thik',
    'উঠলাম': 'uthlam',
    'দিলাম': 'dilam',
    'তাড়াতাড়ি': 'taratari',
    'উড়ান': 'uran',
    'উফ': 'uff',
    'হয়': 'hoy',
    'দিতে': 'dite',
    'পারবো': 'parbo',
    'ধুর': 'dhur',
    'এতো': 'eto',
    'ভাড়ায়': 'bharay',
    'মেট্রোরেলেই': 'metrorail-ei',
    'চলে': 'chole',
    'থাক': 'thak',
    'তেল': 'tel',
    'কি': 'ki',
    'সোনা': 'shona',
    'দিয়ে': 'diye',
    'কেনেন': 'kenen',
    'শেষ': 'shesh',
    'কথা': 'kotha',
    'হুমম': 'humm',
    'দ্রুত': 'druto',
    'পৌঁছে': 'pouche',
    'দিলে': 'dile',
    'পারি': 'pari',
    'সরি': 'sorry',
    'এখন': 'ekhon',
    'যাওয়া': 'jawa',
    'ধন্যবাদ': 'dhonnobad',
    'টার্মিনালে': 'terminal-e',
    'পৌঁছেছেন': 'pouchechen',
    'এবার': 'ebar',
    'ফেরার': 'ferar',
    'ট্রিপ': 'trip',
    'আবার': 'abar',
    'যাওয়ার': 'jawar',
    'রুটে': 'route-e',
    'ছাড়ছে': 'charche',
    'আব্দুল্লাহপুর': 'Abdullahpur',
    'আজমপুর': 'Azampur',
    'বিমানবন্দর': 'Bimanbandar',
    'কুড়িল': 'Kuril',
    'বিশ্বরোড': 'Bishwa Road',
    'কালশী': 'Kalshi',
    'মিরপুর-১০': 'Mirpur 10',
    'মিরপুর-১': 'Mirpur 1',
    'গাবতলী': 'Gabtoli',
    'বনানী': 'Banani',
    'মহাখালী': 'Mohakhali',
    'ফার্মগেট': 'Farmgate',
    'শাহবাগ': 'Shahbagh',
    'পল্টন': 'Paltan',
    'শাপলা': 'Shapla',
    'চত্বর': 'Chattar',
    'সায়েদাবাদ': 'Sayedabad',
    'যাত্রাবাড়ী': 'Jatrabari',
    'শ্যামলী': 'Shyamoli',
    'গুলিস্তান': 'Gulistan',
    'মতিঝিল': 'Motijheel',
    'কি.মি.': 'kilometer',
  };

  const digitMap: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };

  let out = text.replace(/[০-৯]/g, (d) => digitMap[d] ?? d);
  for (const [bn, en] of Object.entries(wordMap)) {
    out = out.split(bn).join(en);
  }
  // Transliterate any remaining Bengali characters so no raw Bengali UTF-8 goes to an English voice
  const charMap: Record<string, string> = {
    'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'ee', 'উ': 'u', 'ঊ': 'oo', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n', '়': '',
    'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্': '',
  };
  return out
    .split('')
    .map((c) => charMap[c] ?? c)
    .join('');
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;
  public voiceEnabled = true;

  // Active HTML5 Audio element for genuine Google Bangla TTS stream
  private activeTtsAudio: HTMLAudioElement | null = null;

  // Continuous helicopter engine nodes
  private heliInitialized = false;
  private heliMasterGain: GainNode | null = null;
  private heliFilter: BiquadFilterNode | null = null;
  private heliLfo: OscillatorNode | null = null;
  private heliLfoGain: GainNode | null = null;
  private heliSubOsc: OscillatorNode | null = null;
  private heliTurbineOsc: OscillatorNode | null = null;
  private heliTurbineGain: GainNode | null = null;
  private lastHeliMode: HeliAudioMode = 'OFF';

  constructor() {
    // Pre-warm speechSynthesis voices list in browsers where getVoices() loads asynchronously
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      } catch {
        // ignore
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private ensureHeliNodes(ctx: AudioContext) {
    if (this.heliInitialized) return;
    this.heliInitialized = true;

    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 1.5);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.08 * white) / 1.08;
      data[i] = lastOut * 2.4;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    noiseSrc.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;
    filter.Q.value = 1.6;

    const chopGain = ctx.createGain();
    chopGain.gain.value = 0.25;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 8.5;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.22;

    const lfoFreqGain = ctx.createGain();
    lfoFreqGain.gain.value = 160;

    lfo.connect(lfoGain);
    lfoGain.connect(chopGain.gain);
    lfo.connect(lfoFreqGain);
    lfoFreqGain.connect(filter.frequency);

    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 46;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.16;

    const turbineOsc = ctx.createOscillator();
    turbineOsc.type = 'triangle';
    turbineOsc.frequency.value = 185;
    const turbineFilter = ctx.createBiquadFilter();
    turbineFilter.type = 'lowpass';
    turbineFilter.frequency.value = 420;
    const turbineGain = ctx.createGain();
    turbineGain.gain.value = 0.035;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;

    noiseSrc.connect(filter);
    filter.connect(chopGain);
    chopGain.connect(masterGain);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    turbineOsc.connect(turbineFilter);
    turbineFilter.connect(turbineGain);
    turbineGain.connect(masterGain);

    masterGain.connect(ctx.destination);

    noiseSrc.start();
    lfo.start();
    subOsc.start();
    turbineOsc.start();

    this.heliMasterGain = masterGain;
    this.heliFilter = filter;
    this.heliLfo = lfo;
    this.heliLfoGain = lfoGain;
    this.heliSubOsc = subOsc;
    this.heliTurbineOsc = turbineOsc;
    this.heliTurbineGain = turbineGain;
  }

  public updateHeliEngine(mode: HeliAudioMode) {
    if (this.muted || mode === 'OFF') {
      if (this.ctx && this.heliMasterGain && this.lastHeliMode !== 'OFF') {
        this.heliMasterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
      }
      this.lastHeliMode = 'OFF';
      return;
    }

    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') {
      return;
    }
    this.ensureHeliNodes(ctx);

    const now = ctx.currentTime;
    const targetGain = mode === 'FLYING' ? 0.15 : mode === 'DESCENDING' ? 0.11 : 0.105;
    const targetLfoHz = mode === 'FLYING' ? 11.8 : mode === 'DESCENDING' ? 7.6 : 8.8;
    const targetCutoff = mode === 'FLYING' ? 520 : mode === 'DESCENDING' ? 300 : 370;
    const targetSubHz = mode === 'FLYING' ? 54 : mode === 'DESCENDING' ? 40 : 45;
    const targetTurbineHz = mode === 'FLYING' ? 228 : mode === 'DESCENDING' ? 158 : 185;
    const targetTurbineGain = mode === 'FLYING' ? 0.042 : 0.025;

    this.heliMasterGain?.gain.setTargetAtTime(targetGain, now, 0.16);
    this.heliLfo?.frequency.setTargetAtTime(targetLfoHz, now, 0.18);
    this.heliLfoGain?.gain.setTargetAtTime(mode === 'FLYING' ? 0.24 : 0.18, now, 0.16);
    this.heliFilter?.frequency.setTargetAtTime(targetCutoff, now, 0.18);
    this.heliSubOsc?.frequency.setTargetAtTime(targetSubHz, now, 0.18);
    this.heliTurbineOsc?.frequency.setTargetAtTime(targetTurbineHz, now, 0.2);
    this.heliTurbineGain?.gain.setTargetAtTime(targetTurbineGain, now, 0.18);
    this.lastHeliMode = mode;
  }

  public playHeliLiftOff() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.ensureHeliNodes(ctx);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(105, now);
    osc.frequency.exponentialRampToValueAtTime(245, now + 0.55);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.085, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playHeliStop() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.34);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playHeliLandedShutoff() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(195, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.48);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  /**
   * Speaks Bengali callouts and bargaining dialogue in real, clear Bangla on any PC:
   * 1. Primary: Streams native Google Bangla TTS audio (`tl=bn`), which works on all PCs
   *    even when Windows/Linux has no Bengali TTS language pack installed.
   * 2. Secondary Fallback: Uses a native `bn-BD`/`bn-IN` browser SpeechSynthesis voice if installed.
   * 3. Offline Fallback: Transliterates to phonetic Banglish so an English/Indian voice
   *    never reads raw Bengali UTF-8 codepoints in an unknown language.
   */
  public speakBangla(text: string, role: 'driver' | 'helper' | 'passenger') {
    if (this.muted || !this.voiceEnabled) return;
    if (typeof window === 'undefined') return;

    this.stopSpeech();

    const cleanText = text.replace(/[“”"']/g, '').trim();
    const ttsUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=bn&q=${encodeURIComponent(
      cleanText
    )}`;

    try {
      const audio = new Audio(ttsUrl);
      audio.volume = 0.95;
      audio.playbackRate = role === 'helper' ? 1.14 : role === 'driver' ? 1.02 : 1.08;
      this.activeTtsAudio = audio;

      audio.play().catch(() => {
        if (this.activeTtsAudio === audio) {
          this.activeTtsAudio = null;
        }
        this.speakFallbackWebSpeech(cleanText, role);
      });
    } catch {
      this.speakFallbackWebSpeech(cleanText, role);
    }
  }

  private speakFallbackWebSpeech(text: string, role: 'driver' | 'helper' | 'passenger') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      const bnVoice =
        voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('bn')) ||
        voices.find(
          (v) =>
            v.name.toLowerCase().includes('bengali') || v.name.toLowerCase().includes('bangla')
        );

      let utter: SpeechSynthesisUtterance;
      if (bnVoice) {
        utter = new SpeechSynthesisUtterance(text);
        utter.voice = bnVoice;
        utter.lang = bnVoice.lang;
      } else {
        // PC has no Bengali voice pack installed — use phonetic Banglish with an Indian/English voice
        const phonetic = banglaToPhonetic(text);
        utter = new SpeechSynthesisUtterance(phonetic);
        const enVoice =
          voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('en-in')) ||
          voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('hi')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        if (enVoice) {
          utter.voice = enVoice;
          utter.lang = enVoice.lang;
        } else {
          utter.lang = 'en-US';
        }
      }

      if (role === 'helper') {
        utter.pitch = 1.2;
        utter.rate = 1.1;
      } else if (role === 'driver') {
        utter.pitch = 0.92;
        utter.rate = 1.02;
      } else {
        utter.pitch = 1.1;
        utter.rate = 1.04;
      }
      utter.volume = 0.95;
      synth.speak(utter);
    } catch {
      // ignore
    }
  }

  public stopSpeech() {
    if (this.activeTtsAudio) {
      try {
        this.activeTtsAudio.pause();
        this.activeTtsAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.activeTtsAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public playHelperHorn() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [
      { freq: 440, start: 0, dur: 0.11 },
      { freq: 554.37, start: 0, dur: 0.11 },
      { freq: 440, start: 0.15, dur: 0.2 },
      { freq: 587.33, start: 0.15, dur: 0.2 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.start);
      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(0.08, now + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.02);
    });
  }

  public playTouchdown(smooth: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = smooth ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(smooth ? 220 : 120, now);
    osc.frequency.exponentialRampToValueAtTime(smooth ? 330 : 55, now + 0.18);
    gain.gain.setValueAtTime(smooth ? 0.09 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playCashRegister() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playBargainAccept() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [493.88, 659.25].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.08;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  public playBargainReject() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.22);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const soundEngine = new SoundEngine();
