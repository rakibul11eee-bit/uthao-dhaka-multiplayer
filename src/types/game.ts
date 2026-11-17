export type GameState = 'TITLE_MENU' | 'PLAYING' | 'BARGAINING' | 'PAUSED' | 'GAME_OVER';

export type GameMode = 'COMPETITION' | 'FREE_STYLE';

export type RouteId = 'abdullahpur_gabtoli' | 'abdullahpur_jatrabari' | 'gabtoli_jatrabari';

export type RouteDirection = 'FORWARD' | 'RETURN';

export type StopId =
  | 'abdullahpur'
  | 'azampur'
  | 'bimanbandar'
  | 'kuril'
  | 'kalshi'
  | 'mirpur10'
  | 'mirpur1'
  | 'gabtoli'
  | 'banani'
  | 'mohakhali'
  | 'farmgate'
  | 'shahbagh'
  | 'paltan'
  | 'shapla_chattar'
  | 'sayedabad'
  | 'jatrabari'
  | 'shyamoli'
  | 'gulistan'
  | 'motijheel';

export interface DhakaLocation {
  id: StopId;
  nameBn: string;
  nameEn: string;
  taglineBn: string;
  x: number;
  y: number;
  accentColor: string;
  hasDepot: boolean;
}

export interface DhakaRoute {
  id: RouteId;
  numberBn: string;
  nameBn: string;
  corridorBn: string;
  startNameBn: string;
  endNameBn: string;
  color: string;
  stops: StopId[];
}

export type RoofStyle = 'terracotta' | 'cyan_glass' | 'bank_blue' | 'solar_modern' | 'coral' | 'cream';

export interface RooftopPad {
  padId: string;
  zoneId: StopId;
  zoneNameBn: string;
  labelBn: string;
  isHub: boolean;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number; // 3D building height in world z units
  wallColor: string;
  roofColor: string;
  style: RoofStyle;
  signText?: string;
  hasDepot: boolean;
}

export type PassengerPersona = 'office' | 'student' | 'uncle' | 'aunty' | 'expat' | 'merchant';

export interface Passenger {
  id: string;
  nameBn: string;
  persona: PassengerPersona;
  personaLabelBn: string;
  shirtColor: string;
  skinColor: string;
  originPadId: string;
  originZoneId: StopId;
  originLabelBn: string;
  destinationId: StopId;
  destinationNameBn: string;
  direction: RouteDirection;
  distanceKm: number;
  etaSec: number;
  baseFare: number;
  initialOffer: number;
  maxWilling: number;
  currentOffer: number;
  agreedFare: number;
  patience: number;
  mood: 'happy' | 'neutral' | 'annoyed';
  openingLineBn: string;
  calloutLineBn: string;
  sweetTalkUsed: boolean;
  waitingSince: number;
}

export interface WalkingPassengerAnim {
  id: string;
  kind: 'boarding' | 'deboarding';
  nameBn: string;
  shirtColor: string;
  skinColor: string;
  startX: number;
  startY: number;
  startZ: number;
  endX: number;
  endY: number;
  endZ: number;
  progress: number;
  fareText?: string;
}

export interface HelicopterState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  altitude: number; // 0..100 (% -> maps to world z height)
  targetAltitude: number;
  headingAngle: number;
  rotorAngle: number;
  landedPadId: string | null;
  fuel: number;
  hull: number;
  seats: (Passenger | null)[]; // 1 pilot + 3 seats
  helperCallingTimer: number;
  helperCallText: string;
  autoCruise: boolean;
  cruiseDir: { dx: number; dy: number };
}

export interface AIHelicopterState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  altitude: number;
  targetAltitude: number;
  headingAngle: number;
  rotorAngle: number;
  routeDir: RouteDirection;
  landedPadId: string | null;
  targetStopId: StopId;
  dwellTimer: number;
  seats: (Passenger | null)[];
  cash: number;
  tripsCompleted: number;
  statusTextBn: string;
}

export type TrafficVehicleType =
  | 'rickshaw'
  | 'cng'
  | 'bus'
  | 'truck'
  | 'lorry'
  | 'car'
  | 'bike';

export interface TrafficVehicle {
  id: number;
  type: TrafficVehicleType;
  roadAxis: 'H' | 'V';
  roadCoord: number;
  pos: number;
  dir: 1 | -1;
  laneIdx: number; // 0, 1, or 2 sub-lane
  speed: number;
  maxSpeed: number;
  color: string;
  secondaryColor: string;
  honkTimer: number;
  honkText: string;
}

export interface MetroTrain {
  progress: number;
  dir: 1 | -1;
}

export interface FloatingToast {
  id: number;
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  life: number;
}

export interface DialogueBannerItem {
  id: number;
  speakerRole: 'driver' | 'helper' | 'passenger';
  speakerName: string;
  text: string;
}

export interface ControlInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface GameStats {
  cash: number;
  tripsCompleted: number;
  perfectLandings: number;
  bargainBonusEarned: number;
  bestShiftCash: number;
  timeRemainingSec: number;
  aiCash: number;
  aiTripsCompleted: number;
}
