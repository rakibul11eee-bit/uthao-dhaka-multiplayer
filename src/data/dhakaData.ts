import {
  DhakaLocation,
  DhakaRoute,
  Passenger,
  PassengerPersona,
  RoofStyle,
  RooftopPad,
  RouteDirection,
  RouteId,
  StopId,
} from '../types/game';

// Realistic Geographic Dhaka Isometric City (13 x 13 blocks of 1260px)
export const MAP_WIDTH = 16380;
export const MAP_HEIGHT = 16380;
export const CRUISE_SPEED = 225; // px/s -> smooth flight across the 8-12 stop corridors
export const AI_CRUISE_SPEED = 195; // px/s -> competitive AI pilot speed
export const PIXELS_PER_KM = 1000;
export const SHIFT_DURATION_SEC = 600; // 10 minutes Competition Mode

export const DHAKA_LOCATIONS: DhakaLocation[] = [
  // --- North Airport Road Spine ---
  {
    id: 'abdullahpur',
    nameBn: 'আব্দুল্লাহপুর',
    nameEn: 'Abdullahpur',
    taglineBn: 'উত্তরা উত্তর গেট ও টঙ্গী ব্রিজ মোড়',
    x: 1890,
    y: 1890,
    accentColor: '#10B981',
    hasDepot: true,
  },
  {
    id: 'azampur',
    nameBn: 'আজমপুর',
    nameEn: 'Azampur',
    taglineBn: 'উত্তরা আজমপুর ও বিমানবন্দর মহাসড়ক',
    x: 3150,
    y: 3150,
    accentColor: '#2DD4BF',
    hasDepot: false,
  },
  {
    id: 'bimanbandar',
    nameBn: 'বিমানবন্দর',
    nameEn: 'Airport',
    taglineBn: 'হযরত শাহজালাল বিমানবন্দর চত্বর',
    x: 4410,
    y: 4410,
    accentColor: '#FBBF24',
    hasDepot: true,
  },
  {
    id: 'kuril',
    nameBn: 'কুড়িল বিশ্বরোড',
    nameEn: 'Kuril Bishwa Road',
    taglineBn: 'কুড়িল ফ্লাইওভার ও প্রগতি সরণি মোড়',
    x: 5670,
    y: 5670,
    accentColor: '#A78BFA',
    hasDepot: true,
  },

  // --- West Mirpur – Gabtoli Corridor ---
  {
    id: 'kalshi',
    nameBn: 'কালশী',
    nameEn: 'Kalshi',
    taglineBn: 'কালশী ফ্লাইওভার ও মিরপুর সংযোগ',
    x: 4410,
    y: 6930,
    accentColor: '#14B8A6',
    hasDepot: false,
  },
  {
    id: 'mirpur10',
    nameBn: 'মিরপুর-১০',
    nameEn: 'Mirpur 10',
    taglineBn: 'গোলচত্বর ও শের-ই-বাংলা স্টেডিয়াম',
    x: 3150,
    y: 8190,
    accentColor: '#2DD4BF',
    hasDepot: true,
  },
  {
    id: 'mirpur1',
    nameBn: 'মিরপুর-১',
    nameEn: 'Mirpur 1',
    taglineBn: 'সনি সিনেমা হল ও মাজার রোড',
    x: 1890,
    y: 9450,
    accentColor: '#38BDF8',
    hasDepot: false,
  },
  {
    id: 'gabtoli',
    nameBn: 'গাবতলী',
    nameEn: 'Gabtoli',
    taglineBn: 'পশ্চিম ঢাকা ও আমিনবাজার টার্মিনাল',
    x: 1890,
    y: 11970,
    accentColor: '#F59E0B',
    hasDepot: true,
  },

  // --- Mirpur Road Corridor (Gabtoli -> Farmgate) ---
  {
    id: 'shyamoli',
    nameBn: 'শ্যামলী',
    nameEn: 'Shyamoli',
    taglineBn: 'শ্যামলী স্কয়ার ও মিরপুর রোড মোড়',
    x: 4410,
    y: 10710,
    accentColor: '#EC4899',
    hasDepot: false,
  },

  // --- Banani – Mohakhali – Farmgate – Shahbagh – Paltan Spine ---
  {
    id: 'banani',
    nameBn: 'বনানী',
    nameEn: 'Banani',
    taglineBn: 'কামাল আতাতুর্ক এভিনিউ ও কর্পোরেট জোন',
    x: 6930,
    y: 6930,
    accentColor: '#A78BFA',
    hasDepot: false,
  },
  {
    id: 'mohakhali',
    nameBn: 'মহাখালী',
    nameEn: 'Mohakhali',
    taglineBn: 'মহাখালী ফ্লাইওভার ও বাস টার্মিনাল',
    x: 6930,
    y: 8190,
    accentColor: '#6366F1',
    hasDepot: true,
  },
  {
    id: 'farmgate',
    nameBn: 'ফার্মগেট',
    nameEn: 'Farmgate',
    taglineBn: 'ঢাকার প্রাণকেন্দ্র ও আনন্দ সিনেমা মোড়',
    x: 6930,
    y: 10710,
    accentColor: '#10B981',
    hasDepot: true,
  },
  {
    id: 'shahbagh',
    nameBn: 'শাহবাগ',
    nameEn: 'Shahbagh',
    taglineBn: 'ঢাকা বিশ্ববিদ্যালয় ও জাতীয় জাদুঘর',
    x: 8190,
    y: 11970,
    accentColor: '#FB7185',
    hasDepot: false,
  },
  {
    id: 'paltan',
    nameBn: 'পল্টন',
    nameEn: 'Paltan',
    taglineBn: 'পুরানা পল্টন ও জিরো পয়েন্ট সংযোগ',
    x: 9450,
    y: 11970,
    accentColor: '#3B82F6',
    hasDepot: true,
  },

  // --- Route 2 & Route 3 South-East Branches to Jatrabari ---
  {
    id: 'shapla_chattar',
    nameBn: 'শাপলা চত্বর',
    nameEn: 'Shapla Chattar',
    taglineBn: 'বাংলাদেশ ব্যাংক ও বাণিজ্যিক প্রাণকেন্দ্র',
    x: 10710,
    y: 11970,
    accentColor: '#2563EB',
    hasDepot: false,
  },
  {
    id: 'gulistan',
    nameBn: 'গুলিস্তান',
    nameEn: 'Gulistan',
    taglineBn: 'বঙ্গবন্ধু স্কয়ার ও জাতীয় স্টেডিয়াম',
    x: 9450,
    y: 13230,
    accentColor: '#E11D48',
    hasDepot: false,
  },
  {
    id: 'motijheel',
    nameBn: 'মতিঝিল',
    nameEn: 'Motijheel',
    taglineBn: 'ব্যাংক পাড়া ও দিলকুশা বাণিজ্যিক এলাকা',
    x: 10710,
    y: 13230,
    accentColor: '#1D4ED8',
    hasDepot: true,
  },
  {
    id: 'sayedabad',
    nameBn: 'সায়েদাবাদ',
    nameEn: 'Sayedabad',
    taglineBn: 'জনপথ মোড় ও আন্তঃজেলা বাস টার্মিনাল',
    x: 11970,
    y: 13230,
    accentColor: '#F97316',
    hasDepot: false,
  },
  {
    id: 'jatrabari',
    nameBn: 'যাত্রাবাড়ী',
    nameEn: 'Jatrabari',
    taglineBn: 'মেয়র হানিফ ফ্লাইওভার ও দক্ষিণ ঢাকা প্রবেশদ্বার',
    x: 13230,
    y: 14490,
    accentColor: '#EF4444',
    hasDepot: true,
  },
];

// Official 3 Dhaka Corridors matching the newly uploaded PDF verbatim
export const DHAKA_ROUTES: DhakaRoute[] = [
  {
    id: 'abdullahpur_gabtoli',
    numberBn: 'রুট ১',
    nameBn: 'আব্দুল্লাহপুর ↔ গাবতলী',
    corridorBn: 'প্রধান করিডর: মিরপুর হয়ে (৮টি স্টপেজ)',
    startNameBn: 'আব্দুল্লাহপুর',
    endNameBn: 'গাবতলী',
    color: '#2DD4BF',
    stops: [
      'abdullahpur',
      'azampur',
      'bimanbandar',
      'kuril',
      'kalshi',
      'mirpur10',
      'mirpur1',
      'gabtoli',
    ],
  },
  {
    id: 'abdullahpur_jatrabari',
    numberBn: 'রুট ২',
    nameBn: 'আব্দুল্লাহপুর ↔ যাত্রাবাড়ী',
    corridorBn: 'প্রধান করিডর: বিমানবন্দর–মহাখালী–গুলিস্তান হয়ে (১২টি স্টপেজ)',
    startNameBn: 'আব্দুল্লাহপুর',
    endNameBn: 'যাত্রাবাড়ী',
    color: '#F59E0B',
    stops: [
      'abdullahpur',
      'azampur',
      'bimanbandar',
      'kuril',
      'banani',
      'mohakhali',
      'farmgate',
      'shahbagh',
      'paltan',
      'shapla_chattar',
      'sayedabad',
      'jatrabari',
    ],
  },
  {
    id: 'gabtoli_jatrabari',
    numberBn: 'রুট ৩',
    nameBn: 'গাবতলী ↔ যাত্রাবাড়ী',
    corridorBn: 'প্রধান করিডর: মিরপুর রোড–ফার্মগেট–গুলিস্তান হয়ে (৯টি স্টপেজ)',
    startNameBn: 'গাবতলী',
    endNameBn: 'যাত্রাবাড়ী',
    color: '#38BDF8',
    stops: [
      'gabtoli',
      'shyamoli',
      'farmgate',
      'shahbagh',
      'paltan',
      'gulistan',
      'motijheel',
      'sayedabad',
      'jatrabari',
    ],
  },
];

export function getRouteById(id: RouteId): DhakaRoute {
  return DHAKA_ROUTES.find((r) => r.id === id) ?? DHAKA_ROUTES[0];
}

export function getStopById(id: StopId): DhakaLocation {
  return DHAKA_LOCATIONS.find((l) => l.id === id) ?? DHAKA_LOCATIONS[0];
}

const STOP_STYLE_CYCLE: { wall: string; roof: string; h: number; style: RoofStyle }[] = [
  { wall: '#E2E8F0', roof: '#059669', h: 152, style: 'solar_modern' },
  { wall: '#FEF3C7', roof: '#0D9488', h: 144, style: 'cyan_glass' },
  { wall: '#DBEAFE', roof: '#1D4ED8', h: 172, style: 'bank_blue' },
  { wall: '#FFEDD5', roof: '#C2410C', h: 138, style: 'terracotta' },
  { wall: '#E0E7FF', roof: '#4F46E5', h: 162, style: 'cyan_glass' },
  { wall: '#FEE2E2', roof: '#BE123C', h: 148, style: 'coral' },
];

export const ROOFTOP_PADS: RooftopPad[] = DHAKA_LOCATIONS.map((loc, idx) => {
  const st = STOP_STYLE_CYCLE[idx % STOP_STYLE_CYCLE.length];
  const isTerminal = loc.id === 'abdullahpur' || loc.id === 'gabtoli' || loc.id === 'jatrabari';
  return {
    padId: `${loc.id}_hub`,
    zoneId: loc.id,
    zoneNameBn: loc.nameBn,
    labelBn: isTerminal ? `${loc.nameBn} টার্মিনাল` : `${loc.nameBn} ছাদ`,
    isHub: true,
    x: loc.x,
    y: loc.y,
    width: isTerminal ? 245 : 225,
    depth: isTerminal ? 245 : 225,
    height: isTerminal ? 170 : st.h,
    wallColor: st.wall,
    roofColor: st.roof,
    style: st.style,
    signText: isTerminal ? `${loc.nameBn} টার্মিনাল` : loc.nameBn,
    hasDepot: loc.hasDepot,
  };
});

// Dense Dhaka Isometric Avenue Grid (every 1260px across 16380x16380 city!)
export const HORIZONTAL_ROADS = [
  1260, 2520, 3780, 5040, 6300, 7560, 8820, 10080, 11340, 12600, 13860, 15120,
];
export const VERTICAL_ROADS = [
  1260, 2520, 3780, 5040, 6300, 7560, 8820, 10080, 11340, 12600, 13860, 15120,
];

export const METRO_CORRIDOR_POINTS: { x: number; y: number }[] = [
  { x: 1890, y: 1890 },
  { x: 3150, y: 8190 },
  { x: 6930, y: 10710 },
  { x: 8190, y: 11970 },
  { x: 10710, y: 13230 },
];

export const HELPER_CALLOUTS_BN: string[] = [
  'এই ফার্মগেট! শাহবাগ! মতিঝিল! উঠেন উঠেন!',
  'যাত্রী! যাত্রী! সিট খালি আছে, ডাইরেক্ট ছাদে!',
  'নিচে জ্যাম ফাটানো রোদ! আকাশে আসেন মামা!',
  'এই মিরপুর-১০! মিরপুর-১! গাবতলী! পায়ে পায়ে উঠেন!',
  'আব্দুল্লাহপুর! বিমানবন্দর! বনানী! জ্যাম ছাড়া সোজা ছাদে!',
  'যাত্রাবাড়ী! সায়েদাবাদ! গুলিস্তান! হেলিকপ্টারে উঠুন!',
];

interface PersonaTemplate {
  persona: PassengerPersona;
  personaLabelBn: string;
  names: string[];
  shirtColors: string[];
  openingLines: ((dest: string, offer: number, km: string) => string)[];
  calloutLines: ((dest: string) => string)[];
  lowballFactor: number;
  maxFactor: number;
}

const PERSONA_TEMPLATES: PersonaTemplate[] = [
  {
    persona: 'office',
    personaLabelBn: 'অফিস যাত্রী',
    names: ['রাফি সাহেব', 'তানভীর ভাই', 'নাবিল আহমেদ', 'সাজিদ করিম'],
    shirtColors: ['#2563EB', '#0284C7', '#475569'],
    openingLines: [
      (dest, offer, km) => `ভাই, ${dest} (${km} কি.মি.) যাবো, মিটিং আছে! ${offer} টাকা দিমু!`,
      (dest, offer, km) => `বস, নিচে জ্যাম! ${dest} (${km} কি.মি.) নামায় দেন, ${offer} টাকা ফিক্সড।`,
    ],
    calloutLines: [
      (dest) => `এই হেলিকপ্টার! ${dest} যাবো!`,
      (dest) => `ভাই ছাদে নামেন, ${dest} নিবেন?`,
    ],
    lowballFactor: 0.72,
    maxFactor: 1.35,
  },
  {
    persona: 'student',
    personaLabelBn: 'ভার্সিটির শিক্ষার্থী',
    names: ['মাহি', 'জেরিন', 'অনিক', 'তিথি'],
    shirtColors: ['#DB2777', '#7C3AED', '#059669'],
    openingLines: [
      (dest, offer, km) => `মামা, স্টুডেন্ট মানুষ! ${dest} (${km} কি.মি.) যাবো, ${offer} টাকা রাখেন!`,
      (dest, offer) => `ভাইয়া ক্লাস মিস হয়ে যাবে! ${dest}-এর জন্য ${offer} টাকা নিবেন?`,
    ],
    calloutLines: [
      (dest) => `মামা ${dest} যাবো! উঠান!`,
      (dest) => `এই যে ভাই, ${dest} চলেন!`,
    ],
    lowballFactor: 0.58,
    maxFactor: 1.15,
  },
  {
    persona: 'uncle',
    personaLabelBn: 'ব্যবসায়ী চাচা',
    names: ['হাজি সাহেব', 'কামাল চাচা', 'সাত্তার মিয়া', 'মনির চাচা'],
    shirtColors: ['#D97706', '#B45309', '#92400E'],
    openingLines: [
      (dest, offer, km) => `ভাতিজা, ${dest} (${km} কি.মি.) যাবো। ${offer} টাকায় চলো!`,
      (dest, offer) => `আরে মিয়া, ছাদ থেকে তুলে নাও! ${dest} ${offer} টাকা দিমু!`,
    ],
    calloutLines: [
      (dest) => `ভাতিজা ছাদে আসো, ${dest} যাবো!`,
      (dest) => `ও ড্রাইভার, ${dest} কত নিবা?`,
    ],
    lowballFactor: 0.64,
    maxFactor: 1.3,
  },
  {
    persona: 'aunty',
    personaLabelBn: 'তাড়াহুড়ো আন্টি',
    names: ['রেহানা আন্টি', 'শিরিন আপা', 'নাজমা বেগম', 'সালমা ভাবি'],
    shirtColors: ['#E11D48', '#0D9488', '#9333EA'],
    openingLines: [
      (dest, offer) => `ভাই শোনেন, ${dest}-এ দাওয়াত আছে! ${offer} টাকায় নিয়ে চলেন তো!`,
      (dest, offer, km) => `ও পাইলট ভাই, ${km} কি.মি. পথ ${dest}, ${offer} টাকায় চলেন!`,
    ],
    calloutLines: [
      (dest) => `এই যে ভাই! ${dest} যাবো!`,
      (dest) => `শোনেন ভাই, ${dest} নিবেন তো?`,
    ],
    lowballFactor: 0.66,
    maxFactor: 1.32,
  },
  {
    persona: 'expat',
    personaLabelBn: 'বিদেশফেরত ভাই',
    names: ['শাকিল ব্রো', 'জনি ভাই', 'রোমান আহমেদ', 'আরমান'],
    shirtColors: ['#10B981', '#F59E0B', '#6366F1'],
    openingLines: [
      (dest, offer, km) => `ব্রো, ${dest} (${km} কি.মি.) যাবো! এই ছাদ-সার্ভিস দারুণ! ${offer} টাকা নাও!`,
      (dest, offer) => `ইয়ো পাইলট! ${dest} ড্রপ দিবা? ${offer} টাকা দিচ্ছি!`,
    ],
    calloutLines: [
      (dest) => `হ্যালো ব্রো! ${dest} যাবো!`,
      (dest) => `পাইলট! এই ছাদ থেকে পিক আপ দাও!`,
    ],
    lowballFactor: 0.78,
    maxFactor: 1.55,
  },
  {
    persona: 'merchant',
    personaLabelBn: 'দোকানদার ভাই',
    names: ['বশির ভাই', 'রফিকুল', 'আলমগীর', 'সোহাগ'],
    shirtColors: ['#0F766E', '#CA8A04', '#DC2626'],
    openingLines: [
      (dest, offer, km) => `ওস্তাদ, ${dest} (${km} কি.মি.) মাল ডেলিভারি আছে! ${offer} টাকা নগদ দিমু!`,
      (dest, offer) => `দাম বেশি চাইয়েন না মামা, ${dest} পর্যন্ত ${offer} টাকাই ন্যায্য!`,
    ],
    calloutLines: [
      (dest) => `ওস্তাদ ${dest} মাল যাবে!`,
      (dest) => `ভাই এই ছাদে নামেন, ${dest} যাবো!`,
    ],
    lowballFactor: 0.65,
    maxFactor: 1.25,
  },
];

const SKIN_TONES = ['#D99B72', '#C6865C', '#E5AE87', '#B4744C'];

export const DRIVER_COUNTER_LINES_BN: ((fare: number, km: string) => string)[] = [
  (fare, km) => `আরে মামা, ${km} কিলোমিটার আকাশপথ! ${fare} টাকা তো লাগবেই!`,
  (fare, km) => `ভাই তেলের দাম দেখেন, ${km} কি.মি. উড়তে হবে! ${fare} টাকা দেন!`,
  (fare) => `নিচে জ্যামে ২ ঘণ্টা লাগতো! আমি কয়েক মিনিটে নামাবো, ${fare} টাকা ফিক্সড!`,
];

export function computeDistanceKm(x1: number, y1: number, x2: number, y2: number): number {
  const distPx = Math.hypot(x2 - x1, y2 - y1);
  return Math.max(0.5, Number((distPx / PIXELS_PER_KM).toFixed(1)));
}

export function computeBaseFare(originPad: RooftopPad, destLoc: DhakaLocation): number {
  const dist = Math.hypot(originPad.x - destLoc.x, originPad.y - destLoc.y);
  const raw = 60 + Math.round((dist / 3200) * 95);
  return Math.round(raw / 10) * 10;
}

let passengerSeq = 1;

/**
 * Strictly creates a passenger heading ONLY in the active RouteDirection!
 * - FORWARD: destIndex > originIndex (along route.stops)
 * - RETURN: destIndex < originIndex (returning toward stops[0])
 * Returns null if origin is the final terminal of the current direction or not on the route.
 */
export function createDirectionalPassengerForPad(
  pad: RooftopPad,
  route: DhakaRoute,
  direction: RouteDirection
): Passenger | null {
  const idx = route.stops.indexOf(pad.zoneId);
  if (idx === -1) return null;

  const candidateStopIds: StopId[] =
    direction === 'FORWARD'
      ? route.stops.slice(idx + 1)
      : route.stops.slice(0, idx).reverse();

  if (candidateStopIds.length === 0) return null;

  let chosenDestId: StopId;
  if (candidateStopIds.length > 4 && Math.random() < 0.72) {
    const shortPool = candidateStopIds.slice(0, 4);
    chosenDestId = shortPool[Math.floor(Math.random() * shortPool.length)];
  } else {
    chosenDestId = candidateStopIds[Math.floor(Math.random() * candidateStopIds.length)];
  }

  const dest = getStopById(chosenDestId);
  const tpl = PERSONA_TEMPLATES[Math.floor(Math.random() * PERSONA_TEMPLATES.length)];

  const distanceKm = computeDistanceKm(pad.x, pad.y, dest.x, dest.y);
  const etaSec = Math.max(6, Math.round(Math.hypot(dest.x - pad.x, dest.y - pad.y) / CRUISE_SPEED));
  const baseFare = computeBaseFare(pad, dest);
  const initialOffer = Math.max(
    50,
    Math.round((baseFare * (tpl.lowballFactor + Math.random() * 0.12)) / 10) * 10
  );
  const maxWilling = Math.max(
    initialOffer + 30,
    Math.round((baseFare * (tpl.maxFactor + Math.random() * 0.1)) / 10) * 10
  );

  const name = tpl.names[Math.floor(Math.random() * tpl.names.length)];
  const shirtColor = tpl.shirtColors[Math.floor(Math.random() * tpl.shirtColors.length)];
  const skinColor = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  const lineFn = tpl.openingLines[Math.floor(Math.random() * tpl.openingLines.length)];
  const callFn = tpl.calloutLines[Math.floor(Math.random() * tpl.calloutLines.length)];

  return {
    id: `p_${passengerSeq++}_${Date.now()}`,
    nameBn: name,
    persona: tpl.persona,
    personaLabelBn: tpl.personaLabelBn,
    shirtColor,
    skinColor,
    originPadId: pad.padId,
    originZoneId: pad.zoneId,
    originLabelBn: pad.labelBn,
    destinationId: dest.id,
    destinationNameBn: dest.nameBn,
    direction,
    distanceKm,
    etaSec,
    baseFare,
    initialOffer,
    maxWilling,
    currentOffer: initialOffer,
    agreedFare: initialOffer,
    patience: 85 + Math.floor(Math.random() * 15),
    mood: 'happy',
    openingLineBn: lineFn(dest.nameBn, initialOffer, toBanglaDigits(distanceKm)),
    calloutLineBn: callFn(dest.nameBn),
    sweetTalkUsed: false,
    waitingSince: Date.now(),
  };
}

export function populateWaitingForRoute(
  route: DhakaRoute,
  direction: RouteDirection
): Record<string, Passenger[]> {
  const map: Record<string, Passenger[]> = {};
  for (const pad of ROOFTOP_PADS) {
    map[pad.padId] = [];
  }

  const orderedStops =
    direction === 'FORWARD' ? route.stops : [...route.stops].reverse();

  // Populate all stops along the active direction (except the final terminal which has 0 outbound passengers)
  for (let i = 0; i < orderedStops.length - 1; i++) {
    const stopId = orderedStops[i];
    const pad = ROOFTOP_PADS.find((p) => p.zoneId === stopId);
    if (!pad) continue;

    const count = i === 0 ? 3 : 2;
    const list: Passenger[] = [];
    for (let k = 0; k < count; k++) {
      const p = createDirectionalPassengerForPad(pad, route, direction);
      if (p) list.push(p);
    }
    map[pad.padId] = list;
  }

  return map;
}

export function toBanglaDigits(num: number | string): string {
  const map: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };
  return String(num).replace(/[0-9]/g, (d) => map[d] ?? d);
}
