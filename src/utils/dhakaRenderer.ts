import {
  DHAKA_LOCATIONS,
  HORIZONTAL_ROADS,
  METRO_CORRIDOR_POINTS,
  PIXELS_PER_KM,
  ROOFTOP_PADS,
  VERTICAL_ROADS,
  getStopById,
  toBanglaDigits,
} from '../data/dhakaData';
import {
  AIHelicopterState,
  DhakaRoute,
  FloatingToast,
  HelicopterState,
  MetroTrain,
  Passenger,
  RoofStyle,
  RooftopPad,
  RouteDirection,
  StopId,
  TrafficVehicle,
  WalkingPassengerAnim,
} from '../types/game';

export const ISO_COS = 0.88;
export const ISO_SIN = 0.44;

export function worldToIso(wx: number, wy: number, wz = 0) {
  return {
    x: (wx - wy) * ISO_COS,
    y: (wx + wy) * ISO_SIN - wz,
  };
}

export interface RenderDhakaIsoParams {
  ctx: CanvasRenderingContext2D;
  viewWidth: number;
  viewHeight: number;
  cameraX: number;
  cameraY: number;
  timeSec: number;
  signalGreen: boolean;
  heli: HelicopterState;
  aiHeli: AIHelicopterState | null;
  remoteHeli?: HelicopterState | null;
  activeRoute: DhakaRoute;
  routeDirection: RouteDirection;
  waitingByPad: Record<string, Passenger[]>;
  walkingAnims: WalkingPassengerAnim[];
  vehicles: TrafficVehicle[];
  metroTrains: MetroTrain[];
  toasts: FloatingToast[];
  highlightedDestId: StopId | null;
}

interface DrawableItem {
  depth: number;
  draw: () => void;
}


function drawWorldLabel(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  x: number, y: number, z: number, text: string, color = '#F8FAFC'
) {
  const p = toScreen(x, y, z);
  ctx.save();
  ctx.font = '700 17px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(15,23,42,.9)';
  ctx.strokeText(text, p.x, p.y);
  ctx.fillStyle = color;
  ctx.fillText(text, p.x, p.y);
  ctx.restore();
}

function drawDhakaLandmark(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  id: StopId,
  x: number,
  y: number,
  timeSec: number
) {
  // Purpose-built landmark clusters make each stop visually identifiable from the air.
  if (id === 'bimanbandar') {
    // Shahjalal Airport: runway, terminal, apron, aircraft, helicopters and rail station.
    drawIsoBox(ctx, toScreen, x + 390, y - 80, 0, 690, 105, 3, '#475569', '#334155', '#1E293B');
    for (let i = -4; i <= 4; i++) {
      const a = toScreen(x + 390 + i * 62, y - 80, 4);
      const b = toScreen(x + 390 + i * 62 + 28, y - 80, 4);
      ctx.strokeStyle = '#F8FAFC'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    drawIsoBox(ctx, toScreen, x + 120, y - 270, 0, 330, 150, 48, '#CBD5E1', '#E2E8F0', '#64748B');
    drawIsoBox(ctx, toScreen, x + 120, y - 270, 48, 290, 132, 8, '#38BDF8', '#0EA5E9', '#0369A1');
    drawIsoBox(ctx, toScreen, x - 310, y + 300, 0, 310, 92, 24, '#F8FAFC', '#CBD5E1', '#64748B');
    drawWorldLabel(ctx, toScreen, x + 120, y - 270, 76, 'HAZRAT SHAHJALAL AIRPORT', '#FDE68A');

    // Airliner silhouettes on the apron.
    for (const [ox, oy, scale] of [[-65, -20, 1], [250, 115, .78]] as number[][]) {
      const p = toScreen(x + ox, y + oy, 18);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-0.25); ctx.scale(scale, scale);
      ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, 31, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-18, -18); ctx.lineTo(4, -4); ctx.lineTo(20, -2); ctx.lineTo(4, 4); ctx.lineTo(-18, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // Two small rotorcraft with visible rotors.
    for (const [ox, oy] of [[-210, -150], [310, -170]]) {
      const p = toScreen(x + ox, y + oy, 62 + Math.sin(timeSec * 2 + ox) * 3);
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = '#F59E0B'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-23, -7); ctx.lineTo(23, -7); ctx.moveTo(0, -7); ctx.lineTo(0, 8); ctx.stroke();
      ctx.restore();
    }
    // Airport railway station and tracks.
    drawIsoBox(ctx, toScreen, x - 330, y + 470, 0, 290, 92, 34, '#FDE68A', '#FEF3C7', '#D97706');
    drawWorldLabel(ctx, toScreen, x - 330, y + 470, 46, 'AIRPORT RAILWAY STATION', '#FDE68A');
    for (let i = 0; i < 2; i++) {
      const a = toScreen(x - 520, y + 545 + i * 26, 2);
      const b = toScreen(x - 145, y + 545 + i * 26, 2);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    return;
  }

  const presets: Partial<Record<StopId, { label: string; color: string; w: number; d: number; h: number; extra?: string }>> = {
    abdullahpur: { label: 'ABDULLAHPUR BUS TERMINAL', color: '#0F766E', w: 260, d: 170, h: 52 },
    azampur: { label: 'AZAMPUR', color: '#0D9488', w: 190, d: 130, h: 42 },
    kuril: { label: 'KURIL FLYOVER', color: '#64748B', w: 360, d: 90, h: 24 },
    kalshi: { label: 'KALSHI FLYOVER', color: '#64748B', w: 300, d: 85, h: 24 },
    mirpur10: { label: 'MIRPUR-10 ROUNDABOUT', color: '#0F766E', w: 230, d: 230, h: 18 },
    mirpur1: { label: 'SONY CINEMA / MIRPUR-1', color: '#7C3AED', w: 190, d: 130, h: 65 },
    gabtoli: { label: 'GABTOLI BUS TERMINAL', color: '#B45309', w: 330, d: 210, h: 55 },
    shyamoli: { label: 'SHYAMOLI SQUARE', color: '#DB2777', w: 190, d: 140, h: 58 },
    banani: { label: 'BANANI COMMERCIAL AREA', color: '#2563EB', w: 210, d: 150, h: 90 },
    mohakhali: { label: 'MOHAKHALI BUS TERMINAL', color: '#1D4ED8', w: 280, d: 180, h: 45 },
    farmgate: { label: 'FARMGATE FLYOVER', color: '#64748B', w: 340, d: 85, h: 26 },
    shahbagh: { label: 'NATIONAL MUSEUM • SHAHBAGH', color: '#A16207', w: 240, d: 160, h: 54 },
    paltan: { label: 'PURANA PALTAN', color: '#475569', w: 190, d: 140, h: 62 },
    shapla_chattar: { label: 'SHAPLA CHATTAR', color: '#2563EB', w: 160, d: 160, h: 30 },
    gulistan: { label: 'GULISTAN • STADIUM AREA', color: '#BE123C', w: 220, d: 150, h: 55 },
    motijheel: { label: 'BANGLADESH BANK • MOTIJHEEL', color: '#1D4ED8', w: 230, d: 160, h: 105 },
    sayedabad: { label: 'SAYEDABAD BUS TERMINAL', color: '#C2410C', w: 290, d: 180, h: 45 },
    jatrabari: { label: 'MAYOR HANIF FLYOVER', color: '#475569', w: 370, d: 90, h: 28 },
  };
  const item = presets[id];
  if (!item) return;
  const lx = x + 270;
  const ly = y - 230;
  if (id === 'mirpur10' || id === 'shapla_chattar') {
    const c = toScreen(lx, ly, item.h + 3);
    ctx.strokeStyle = item.color; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 55, 29, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#FDE68A'; ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
  } else {
    drawIsoBox(ctx, toScreen, lx, ly, 0, item.w, item.d, item.h, item.color, '#E2E8F0', '#64748B');
    if (['kuril', 'kalshi', 'farmgate', 'jatrabari'].includes(id)) {
      drawIsoBox(ctx, toScreen, lx + 70, ly + 35, item.h, item.w * .8, 26, 10, '#94A3B8', '#CBD5E1', '#475569');
    }
  }
  if (id === 'shahbagh') {
    drawIsoBox(ctx, toScreen, lx + 150, ly + 115, 0, 120, 100, 38, '#B45309', '#FDE68A', '#92400E');
    drawWorldLabel(ctx, toScreen, lx + 150, ly + 115, 58, 'NATIONAL MUSEUM', '#FDE68A');
  }
  if (id === 'motijheel') {
    drawIsoBox(ctx, toScreen, lx + 145, ly + 80, 0, 62, 62, 155, '#1D4ED8', '#DBEAFE', '#1E40AF');
    drawWorldLabel(ctx, toScreen, lx + 145, ly + 80, 178, 'BANK TOWER', '#BFDBFE');
  }
  if (id === 'gabtoli' || id === 'sayedabad' || id === 'mohakhali' || id === 'abdullahpur') {
    for (let i = 0; i < 3; i++) drawIsoBox(ctx, toScreen, lx - 100 + i * 95, ly + 145, 0, 68, 28, 22, '#DC2626', '#F8FAFC', '#1E293B');
  }
  drawWorldLabel(ctx, toScreen, lx, ly, item.h + 22, item.label, '#FDE68A');
}

export function renderDhakaIsoScene({
  ctx,
  viewWidth,
  viewHeight,
  cameraX,
  cameraY,
  timeSec,
  signalGreen,
  heli,
  aiHeli,
  activeRoute,
  routeDirection,
  waitingByPad,
  walkingAnims,
  vehicles,
  metroTrains,
  toasts,
  highlightedDestId,
  remoteHeli = null,
}: RenderDhakaIsoParams) {
  ctx.save();

  // Warm sunlit urban base ground
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  const landedPad = heli.landedPadId
    ? ROOFTOP_PADS.find((p) => p.padId === heli.landedPadId) ?? null
    : null;
  const heliWorldZ = landedPad
    ? landedPad.height + 6
    : 130 + (heli.altitude / 100) * 110;
  const cameraZ = heliWorldZ * 0.72;
  const anchorY = viewHeight * 0.5;

  const camIso = worldToIso(cameraX, cameraY, cameraZ);
  const toScreen = (wx: number, wy: number, wz = 0) => {
    const iso = worldToIso(wx, wy, wz);
    return {
      x: viewWidth / 2 + (iso.x - camIso.x),
      y: anchorY + (iso.y - camIso.y),
    };
  };

  // Compute visible world bounding box from screen corners (+ padding for tall 3D towers)
  const invertScreen = (sx: number, sy: number) => {
    const dx = sx - viewWidth / 2;
    const dy = sy - anchorY - cameraZ;
    const a = dx / ISO_COS;
    const b = dy / ISO_SIN;
    return {
      wx: cameraX + (a + b) / 2,
      wy: cameraY + (b - a) / 2,
    };
  };
  const c0 = invertScreen(-240, -240);
  const c1 = invertScreen(viewWidth + 240, -240);
  const c2 = invertScreen(-240, viewHeight + 360);
  const c3 = invertScreen(viewWidth + 240, viewHeight + 360);
  const minWX = Math.min(c0.wx, c1.wx, c2.wx, c3.wx);
  const maxWX = Math.max(c0.wx, c1.wx, c2.wx, c3.wx);
  const minWY = Math.min(c0.wy, c1.wy, c2.wy, c3.wy);
  const maxWY = Math.max(c0.wy, c1.wy, c2.wy, c3.wy);

  // 1. Ground layer: Parks, Buriganga/Turag Rivers, Hatirjheel Lake, Asphalt Roads & Active Route Corridor
  drawGroundAndParks(ctx, toScreen, minWX, maxWX, minWY, maxWY, timeSec);
  drawIsoRoadsAndCrossings(ctx, toScreen, minWX, maxWX, minWY, maxWY, signalGreen);
  drawActiveRouteCorridor(ctx, toScreen, activeRoute, routeDirection, timeSec);
  drawIsoMetroTrack(ctx, toScreen, metroTrains);

  // 2. Collect all 3D objects for exact isometric painter's depth sorting
  const drawList: DrawableItem[] = [];

  // 2a. Procedural Neighborhood Buildings & Roadside Trees (outside road corridors & pad footprints)
  const cell = 420;
  const startCol = Math.floor(minWX / cell) - 1;
  const endCol = Math.ceil(maxWX / cell) + 1;
  const startRow = Math.floor(minWY / cell) - 1;
  const endRow = Math.ceil(maxWY / cell) + 1;

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const bx = c * cell + cell / 2;
      const by = r * cell + cell / 2;

      const inRiver = by > 15260;
      const inTurag = by - bx > 10550;
      const inHatirjheel = bx > 8250 && bx < 10600 && by > 7650 && by < 10000;
      if (inRiver || inTurag || inHatirjheel) continue;

      const onRoad =
        HORIZONTAL_ROADS.some((ry) => Math.abs(by - ry) < 175) ||
        VERTICAL_ROADS.some((rx) => Math.abs(bx - rx) < 175);
      if (onRoad) continue;

      const nearPad = ROOFTOP_PADS.some(
        (p) => Math.abs(bx - p.x) < p.width * 0.95 && Math.abs(by - p.y) < p.depth * 0.95
      );
      if (nearPad) continue;

      const hash = Math.abs(Math.sin(c * 127.1 + r * 311.7) * 43758.5453);
      const frac = hash - Math.floor(hash);

      if (frac < 0.16) {
        // Lush City Park Block with gazebo & fountain!
        drawList.push({
          depth: bx + by - 80,
          draw: () => drawIsoParkBlock(ctx, toScreen, bx, by, cell - 95),
        });
        continue;
      }

      // 2-3 vibrant buildings + roadside trees per block (positive modulo safe for negative c/r!)
      const posMod = (n: number, m: number) => ((n % m) + m) % m;
      const bStyles: RoofStyle[] = ['terracotta', 'cyan_glass', 'bank_blue', 'solar_modern', 'coral', 'cream'];
      const subBuildings = [
        { ox: -78, oy: -68, w: 125, d: 115, h: 65 + posMod(c * 19 + r * 7, 65), st: bStyles[posMod(c + r, 6)] },
        { ox: 75, oy: 65, w: 120, d: 125, h: 55 + posMod(c * 13 + r * 23, 75), st: bStyles[posMod(c * 2 + r + 3, 6)] },
      ];

      for (const sb of subBuildings) {
        const wx = bx + sb.ox;
        const wy = by + sb.oy;
        drawList.push({
          depth: wx + wy,
          draw: () => drawIsoStyledBuilding(ctx, toScreen, wx, wy, sb.w, sb.d, sb.h, sb.st),
        });
      }

      // Roadside trees around block corners
      const treeSpots = [
        { tx: bx - 150, ty: by + 130 },
        { tx: bx + 145, ty: by - 140 },
      ];
      for (const ts of treeSpots) {
        drawList.push({
          depth: ts.tx + ts.ty,
          draw: () => drawIsoTree(ctx, toScreen, ts.tx, ts.ty),
        });
      }
    }
  }

  // 2a. Recognizable location landmarks, rendered only when near the camera.
  for (const loc of DHAKA_LOCATIONS) {
    if (loc.x < minWX - 950 || loc.x > maxWX + 950 || loc.y < minWY - 950 || loc.y > maxWY + 950) continue;
    drawList.push({
      depth: loc.x + loc.y - 12,
      draw: () => drawDhakaLandmark(ctx, toScreen, loc.id, loc.x, loc.y, timeSec),
    });
  }

  // 2b. 19 Official Dhaka Route Rooftop Pads
  const seatedDestIds = new Set(
    heli.seats.filter((s): s is Passenger => s !== null).map((s) => s.destinationId)
  );

  for (const pad of ROOFTOP_PADS) {
    if (pad.x < minWX - 320 || pad.x > maxWX + 320 || pad.y < minWY - 320 || pad.y > maxWY + 320) {
      continue;
    }
    const routeIdx = activeRoute.stops.indexOf(pad.zoneId);
    const onActiveRoute = routeIdx !== -1;
    const stopOrderNum = onActiveRoute
      ? routeDirection === 'FORWARD'
        ? routeIdx + 1
        : activeRoute.stops.length - routeIdx
      : null;

    const waiting = waitingByPad[pad.padId] ?? [];
    const isDropoff = seatedDestIds.has(pad.zoneId);
    const isHighlighted = highlightedDestId === pad.zoneId;

    drawList.push({
      depth: pad.x + pad.y,
      draw: () =>
        drawLandablePad3D(
          ctx,
          toScreen,
          pad,
          waiting,
          isDropoff,
          isHighlighted,
          onActiveRoute,
          stopOrderNum,
          activeRoute.color,
          timeSec,
          heli
        ),
    });
  }

  // 2c. 3D Isometric Vehicles on Diagonal Roads (3 packed sub-lanes per direction = 6 lanes of jam!)
  for (const v of vehicles) {
    const laneOffset = v.laneIdx === 0 ? 15 : v.laneIdx === 1 ? 36 : 56;
    const vx = v.roadAxis === 'H' ? v.pos : v.roadCoord + (v.dir === 1 ? -laneOffset : laneOffset);
    const vy = v.roadAxis === 'H' ? v.roadCoord + (v.dir === 1 ? laneOffset : -laneOffset) : v.pos;
    if (vx < minWX - 140 || vx > maxWX + 140 || vy < minWY - 140 || vy > maxWY + 140) continue;

    drawList.push({
      depth: vx + vy,
      draw: () => drawIsoVehicle3D(ctx, toScreen, v, vx, vy, timeSec),
    });
  }

  // 2c-extra. Perpetual Intersection Gridlock Knot (Bus, Truck, Lorry & Rickshaws jammed inside every visible intersection!)
  for (const rx of VERTICAL_ROADS) {
    if (rx < minWX - 160 || rx > maxWX + 160) continue;
    for (const ry of HORIZONTAL_ROADS) {
      if (ry < minWY - 160 || ry > maxWY + 160) continue;
      const knotSeed = Math.round((rx + ry) / 1260);
      const creep = Math.sin(timeSec * 1.4 + knotSeed) * 6;
      const knotVehicles: { v: TrafficVehicle; vx: number; vy: number }[] = [
        {
          vx: rx - 28 + creep,
          vy: ry - 18,
          v: {
            id: 90000 + knotSeed * 10 + 1,
            type: 'bus',
            roadAxis: 'H',
            roadCoord: ry,
            pos: rx - 28,
            dir: 1,
            laneIdx: 0,
            speed: 0,
            maxSpeed: 40,
            color: knotSeed % 2 === 0 ? '#DC2626' : '#16A34A',
            secondaryColor: '#F8FAFC',
            honkTimer: (Math.floor(timeSec + knotSeed) % 5) === 0 ? 1 : 0,
            honkText: 'বাস জ্যামে আটকা!',
          },
        },
        {
          vx: rx + 26,
          vy: ry + 24 - creep,
          v: {
            id: 90000 + knotSeed * 10 + 2,
            type: 'truck',
            roadAxis: 'V',
            roadCoord: rx,
            pos: ry + 24,
            dir: -1,
            laneIdx: 1,
            speed: 0,
            maxSpeed: 35,
            color: '#EA580C',
            secondaryColor: '#1D4ED8',
            honkTimer: (Math.floor(timeSec + knotSeed + 2) % 6) === 0 ? 1 : 0,
            honkText: 'ট্রাক সাইড দেন!',
          },
        },
        {
          vx: rx + 18 - creep * 0.6,
          vy: ry - 32,
          v: {
            id: 90000 + knotSeed * 10 + 3,
            type: 'lorry',
            roadAxis: 'H',
            roadCoord: ry,
            pos: rx + 18,
            dir: -1,
            laneIdx: 1,
            speed: 0,
            maxSpeed: 32,
            color: '#0284C7',
            secondaryColor: '#E2E8F0',
            honkTimer: 0,
            honkText: '',
          },
        },
        {
          vx: rx - 10,
          vy: ry + 14 + creep * 0.5,
          v: {
            id: 90000 + knotSeed * 10 + 4,
            type: 'rickshaw',
            roadAxis: 'V',
            roadCoord: rx,
            pos: ry + 14,
            dir: 1,
            laneIdx: 0,
            speed: 0,
            maxSpeed: 22,
            color: '#E11D48',
            secondaryColor: '#FACC15',
            honkTimer: (Math.floor(timeSec + knotSeed + 1) % 4) === 0 ? 1 : 0,
            honkText: 'ক্রিং ক্রিং! জ্যাম!',
          },
        },
        {
          vx: rx + 4,
          vy: ry + 2,
          v: {
            id: 90000 + knotSeed * 10 + 5,
            type: 'rickshaw',
            roadAxis: 'H',
            roadCoord: ry,
            pos: rx + 4,
            dir: 1,
            laneIdx: 2,
            speed: 0,
            maxSpeed: 22,
            color: '#7C3AED',
            secondaryColor: '#FACC15',
            honkTimer: 0,
            honkText: '',
          },
        },
      ];

      for (const kv of knotVehicles) {
        drawList.push({
          depth: kv.vx + kv.vy,
          draw: () => drawIsoVehicle3D(ctx, toScreen, kv.v, kv.vx, kv.vy, timeSec),
        });
      }
    }
  }

  // 2d. Visible Boarding & Deboarding Walking Passengers on Rooftops
  for (const anim of walkingAnims) {
    const t = Math.max(0, Math.min(1, anim.progress));
    const px = anim.startX + (anim.endX - anim.startX) * t;
    const py = anim.startY + (anim.endY - anim.startY) * t;
    const pz = anim.startZ + (anim.endZ - anim.startZ) * t;
    drawList.push({
      depth: px + py + 45,
      draw: () => drawIsoWalkingPerson(ctx, toScreen, px, py, pz, anim, timeSec),
    });
  }

  // 2e. AI Competitor Helicopter (if within reasonable view range)
  if (
    aiHeli &&
    aiHeli.x >= minWX - 320 &&
    aiHeli.x <= maxWX + 320 &&
    aiHeli.y >= minWY - 320 &&
    aiHeli.y <= maxWY + 320
  ) {
    const aiLandedPad = aiHeli.landedPadId
      ? ROOFTOP_PADS.find((p) => p.padId === aiHeli.landedPadId) ?? null
      : null;
    const aiWorldZ = aiLandedPad
      ? aiLandedPad.height + 6
      : 124 + (aiHeli.altitude / 100) * 105;
    const aiDepth = aiHeli.altitude > 20 ? aiHeli.x + aiHeli.y + 890 : aiHeli.x + aiHeli.y + 38;
    const aiAsHeli: HelicopterState = {
      x: aiHeli.x,
      y: aiHeli.y,
      vx: aiHeli.vx,
      vy: aiHeli.vy,
      altitude: aiHeli.altitude,
      targetAltitude: aiHeli.targetAltitude,
      headingAngle: aiHeli.headingAngle,
      rotorAngle: aiHeli.rotorAngle,
      landedPadId: aiHeli.landedPadId,
      fuel: 100,
      hull: 100,
      seats: aiHeli.seats,
      helperCallingTimer: 0,
      helperCallText: '',
      autoCruise: !aiLandedPad,
      cruiseDir: { dx: 0, dy: 0 },
    };
    drawList.push({
      depth: aiDepth,
      draw: () =>
        drawIsoHelicopter3D(
          ctx,
          toScreen,
          aiAsHeli,
          aiWorldZ,
          aiLandedPad,
          timeSec,
          'AI',
          `AI: ${aiHeli.statusTextBn}`
        ),
    });
  }

  // Online opponent helicopter (separate from the local AI helicopter).
  if (remoteHeli) {
    const remotePad = remoteHeli.landedPadId ? ROOFTOP_PADS.find((p) => p.padId === remoteHeli.landedPadId) ?? null : null;
    const remoteZ = remotePad ? remotePad.height + 6 : 124 + (remoteHeli.altitude / 100) * 105;
    drawList.push({
      depth: remoteHeli.altitude > 20 ? remoteHeli.x + remoteHeli.y + 895 : remoteHeli.x + remoteHeli.y + 39,
      draw: () => drawIsoHelicopter3D(ctx, toScreen, remoteHeli, remoteZ, remotePad, timeSec, 'AI', 'ONLINE OPPONENT'),
    });
  }

  // 2f. Player 3D Isometric Helicopter
  const heliDepth =
    heli.altitude > 20 ? heli.x + heli.y + 900 : heli.x + heli.y + 40;

  drawList.push({
    depth: heliDepth,
    draw: () =>
      drawIsoHelicopter3D(ctx, toScreen, heli, heliWorldZ, landedPad, timeSec, 'PLAYER'),
  });

  // Sort back-to-front and render!
  drawList.sort((a, b) => a.depth - b.depth);
  for (const item of drawList) {
    item.draw();
  }

  // 3. Directional Compass Pointers around Helicopter + Floating Toasts
  drawIsoDestinationPointers(ctx, toScreen, heli, heliWorldZ, highlightedDestId);
  drawIsoToasts(ctx, toScreen, toasts);

  ctx.restore();
}

function drawGroundAndParks(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  minWX: number,
  maxWX: number,
  minWY: number,
  maxWY: number,
  timeSec: number
) {
  // Sidewalk concrete grid tiles
  ctx.fillStyle = '#CBD5E1';
  const p0 = toScreen(minWX, minWY, 0);
  const p1 = toScreen(maxWX, minWY, 0);
  const p2 = toScreen(maxWX, maxWY, 0);
  const p3 = toScreen(minWX, maxWY, 0);
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fill();

  // Buriganga River in South (wy >= 15320, cleanly south of Sayedabad & Jatrabari)
  if (maxWY > 15250) {
    const e0 = toScreen(minWX, 15280, 0);
    const e1 = toScreen(maxWX, 15280, 0);
    const e2 = toScreen(maxWX, 15330, 0);
    const e3 = toScreen(minWX, 15330, 0);
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(e0.x, e0.y);
    ctx.lineTo(e1.x, e1.y);
    ctx.lineTo(e2.x, e2.y);
    ctx.lineTo(e3.x, e3.y);
    ctx.closePath();
    ctx.fill();

    const r0 = toScreen(minWX, 15330, 0);
    const r1 = toScreen(maxWX, 15330, 0);
    const r2 = toScreen(maxWX, 17800, 0);
    const r3 = toScreen(minWX, 17800, 0);
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.moveTo(r0.x, r0.y);
    ctx.lineTo(r1.x, r1.y);
    ctx.lineTo(r2.x, r2.y);
    ctx.lineTo(r3.x, r3.y);
    ctx.closePath();
    ctx.fill();

    // River passenger launches
    for (let b = 0; b < 6; b++) {
      const bx = ((b * 2600 + timeSec * 45) % 15500) + 500;
      const by = 15600 + (b % 2) * 200;
      if (bx > minWX - 200 && bx < maxWX + 200) {
        drawIsoBox(ctx, toScreen, bx, by, 0, 128, 46, 22, '#F8FAFC', '#DC2626', '#991B1B');
      }
    }
  }

  // Turag River along the Western Gabtoli edge (wy - wx > 10550)
  if (maxWY - minWX > 10400) {
    const t0 = toScreen(600, 11200, 0);
    const t1 = toScreen(5200, 15800, 0);
    const t2 = toScreen(3800, 17200, 0);
    const t3 = toScreen(-800, 12600, 0);
    ctx.fillStyle = '#0EA5E9';
    ctx.beginPath();
    ctx.moveTo(t0.x, t0.y);
    ctx.lineTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.lineTo(t3.x, t3.y);
    ctx.closePath();
    ctx.fill();
  }

  // Hatirjheel Lake (east of Mohakhali–Farmgate spine)
  if (maxWX > 8200 && minWX < 10700 && maxWY > 7600 && minWY < 10100) {
    const h0 = toScreen(8300, 7700, 0);
    const h1 = toScreen(10500, 7800, 0);
    const h2 = toScreen(10550, 9950, 0);
    const h3 = toScreen(8350, 9900, 0);
    ctx.fillStyle = '#0EA5E9';
    ctx.beginPath();
    ctx.moveTo(h0.x, h0.y);
    ctx.lineTo(h1.x, h1.y);
    ctx.lineTo(h2.x, h2.y);
    ctx.lineTo(h3.x, h3.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawActiveRouteCorridor(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  activeRoute: DhakaRoute,
  routeDirection: RouteDirection,
  timeSec: number
) {
  const ordered =
    routeDirection === 'FORWARD' ? activeRoute.stops : [...activeRoute.stops].reverse();
  if (ordered.length < 2) return;

  ctx.save();
  ctx.strokeStyle = activeRoute.color;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash([22, 16]);
  ctx.lineDashOffset = -(timeSec * 38);
  ctx.beginPath();
  ordered.forEach((stopId, idx) => {
    const loc = getStopById(stopId);
    const p = toScreen(loc.x, loc.y, 12);
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawIsoRoadsAndCrossings(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  minWX: number,
  maxWX: number,
  minWY: number,
  maxWY: number,
  signalGreen: boolean
) {
  const halfRoad = 72;

  const drawRoadQuad = (x1: number, y1: number, x2: number, y2: number, color: string) => {
    const a = toScreen(x1, y1, 0);
    const b = toScreen(x2, y1, 0);
    const c = toScreen(x2, y2, 0);
    const d = toScreen(x1, y2, 0);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.fill();
  };

  // Horizontal Roads (along wx)
  for (const ry of HORIZONTAL_ROADS) {
    if (ry < minWY - 160 || ry > maxWY + 160) continue;
    drawRoadQuad(minWX, ry - halfRoad, maxWX, ry + halfRoad, '#334155');
    // Double yellow median divider + lane lines
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.2;
    const s = toScreen(minWX, ry, 0);
    const e = toScreen(maxWX, ry, 0);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([16, 14]);
    for (const laneOff of [-36, 36]) {
      const ls = toScreen(minWX, ry + laneOff, 0);
      const le = toScreen(maxWX, ry + laneOff, 0);
      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.lineTo(le.x, le.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Vertical Roads (along wy)
  for (const rx of VERTICAL_ROADS) {
    if (rx < minWX - 160 || rx > maxWX + 160) continue;
    drawRoadQuad(rx - halfRoad, minWY, rx + halfRoad, maxWY, '#334155');
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.2;
    const s = toScreen(rx, minWY, 0);
    const e = toScreen(rx, maxWY, 0);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([16, 14]);
    for (const laneOff of [-36, 36]) {
      const ls = toScreen(rx + laneOff, minWY, 0);
      const le = toScreen(rx + laneOff, maxWY, 0);
      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.lineTo(le.x, le.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Crisp White Zebra Crosswalks at every Isometric Intersection!
  for (const rx of VERTICAL_ROADS) {
    for (const ry of HORIZONTAL_ROADS) {
      if (rx < minWX - 160 || rx > maxWX + 160 || ry < minWY - 160 || ry > maxWY + 160) continue;

      drawRoadQuad(rx - halfRoad, ry - halfRoad, rx + halfRoad, ry + halfRoad, '#1E293B');

      // 4 Zebra stripes sets around intersection
      for (let i = -3; i <= 3; i += 2) {
        const off = i * 14;
        drawRoadQuad(rx - halfRoad - 28, ry + off - 4, rx - halfRoad - 6, ry + off + 4, '#FFFFFF');
        drawRoadQuad(rx + halfRoad + 6, ry + off - 4, rx + halfRoad + 28, ry + off + 4, '#FFFFFF');
        drawRoadQuad(rx + off - 4, ry - halfRoad - 28, rx + off + 4, ry - halfRoad - 6, '#FFFFFF');
        drawRoadQuad(rx + off - 4, ry + halfRoad + 6, rx + off + 4, ry + halfRoad + 28, '#FFFFFF');
      }

      // Traffic signal light
      const sigPos = toScreen(rx + halfRoad + 14, ry - halfRoad - 14, 24);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(sigPos.x, sigPos.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = signalGreen ? '#22C55E' : '#EF4444';
      ctx.beginPath();
      ctx.arc(sigPos.x, sigPos.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawIsoMetroTrack(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  metroTrains: MetroTrain[]
) {
  ctx.save();
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  METRO_CORRIDOR_POINTS.forEach((pt, idx) => {
    const s = toScreen(pt.x, pt.y, 52);
    if (idx === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.stroke();

  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Trains
  for (const tr of metroTrains) {
    const segCount = METRO_CORRIDOR_POINTS.length - 1;
    const clamped = Math.max(0, Math.min(0.9999, tr.progress));
    const scaled = clamped * segCount;
    const idx = Math.floor(scaled);
    const lt = scaled - idx;
    const a = METRO_CORRIDOR_POINTS[idx];
    const b = METRO_CORRIDOR_POINTS[idx + 1];
    const tx = a.x + (b.x - a.x) * lt;
    const ty = a.y + (b.y - a.y) * lt;
    drawIsoBox(ctx, toScreen, tx, ty, 52, 85, 24, 18, '#F8FAFC', '#059669', '#047857');
  }
  ctx.restore();
}

function drawIsoParkBlock(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  cx: number,
  cy: number,
  size: number
) {
  const half = size / 2;
  const p0 = toScreen(cx - half, cy - half, 0);
  const p1 = toScreen(cx + half, cy - half, 0);
  const p2 = toScreen(cx + half, cy + half, 0);
  const p3 = toScreen(cx - half, cy + half, 0);

  // Lush lime-green grass lawn
  ctx.fillStyle = '#65A30D';
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#A3E635';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Blue circular park fountain in center
  const f = toScreen(cx, cy, 2);
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.ellipse(f.x, f.y, 24, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.ellipse(f.x, f.y, 18, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Small red park gazebo & corner trees
  drawIsoBox(ctx, toScreen, cx + 48, cy - 42, 0, 36, 36, 26, '#DC2626', '#991B1B', '#7F1D1D');
  drawIsoTree(ctx, toScreen, cx - 65, cy + 55);
  drawIsoTree(ctx, toScreen, cx + 65, cy + 60);
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  cx: number,
  cy: number,
  z0: number,
  w: number,
  d: number,
  h: number,
  topCol: string,
  leftCol: string,
  rightCol: string
) {
  const hw = w / 2;
  const hd = d / 2;

  const bFL = toScreen(cx - hw, cy + hd, z0);
  const bFR = toScreen(cx + hw, cy + hd, z0);
  const bBR = toScreen(cx + hw, cy - hd, z0);

  const tBL = toScreen(cx - hw, cy - hd, z0 + h);
  const tBR = toScreen(cx + hw, cy - hd, z0 + h);
  const tFR = toScreen(cx + hw, cy + hd, z0 + h);
  const tFL = toScreen(cx - hw, cy + hd, z0 + h);

  // Left Wall (facing South-West: y = cy + hd)
  ctx.fillStyle = leftCol;
  ctx.beginPath();
  ctx.moveTo(tFL.x, tFL.y);
  ctx.lineTo(tFR.x, tFR.y);
  ctx.lineTo(bFR.x, bFR.y);
  ctx.lineTo(bFL.x, bFL.y);
  ctx.closePath();
  ctx.fill();

  // Right Wall (facing South-East: x = cx + hw)
  ctx.fillStyle = rightCol;
  ctx.beginPath();
  ctx.moveTo(tFR.x, tFR.y);
  ctx.lineTo(tBR.x, tBR.y);
  ctx.lineTo(bBR.x, bBR.y);
  ctx.lineTo(bFR.x, bFR.y);
  ctx.closePath();
  ctx.fill();

  // Top Face
  ctx.fillStyle = topCol;
  ctx.beginPath();
  ctx.moveTo(tBL.x, tBL.y);
  ctx.lineTo(tBR.x, tBR.y);
  ctx.lineTo(tFR.x, tFR.y);
  ctx.lineTo(tFL.x, tFL.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawIsoWallWindows(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  cx: number,
  cy: number,
  w: number,
  d: number,
  h: number,
  glassColor: string
) {
  const hw = w / 2;
  const hd = d / 2;
  const rows = Math.max(2, Math.floor(h / 26));

  ctx.fillStyle = glassColor;
  // Left wall windows (along X at y = cy + hd)
  for (let r = 0; r < rows; r++) {
    const wz = 18 + r * 24;
    if (wz + 12 > h) break;
    for (let x = cx - hw + 18; x < cx + hw - 24; x += 26) {
      const p0 = toScreen(x, cy + hd + 0.5, wz);
      const p1 = toScreen(x + 14, cy + hd + 0.5, wz);
      const p2 = toScreen(x + 14, cy + hd + 0.5, wz + 12);
      const p3 = toScreen(x, cy + hd + 0.5, wz + 12);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Right wall windows (along Y at x = cx + hw)
  for (let r = 0; r < rows; r++) {
    const wz = 18 + r * 24;
    if (wz + 12 > h) break;
    for (let y = cy - hd + 18; y < cy + hd - 24; y += 26) {
      const p0 = toScreen(cx + hw + 0.5, y, wz);
      const p1 = toScreen(cx + hw + 0.5, y + 14, wz);
      const p2 = toScreen(cx + hw + 0.5, y + 14, wz + 12);
      const p3 = toScreen(cx + hw + 0.5, y, wz + 12);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawIsoStyledBuilding(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  cx: number,
  cy: number,
  w: number,
  d: number,
  h: number,
  style: RoofStyle
) {
  const palette: Record<RoofStyle, { top: string; left: string; right: string; win: string }> = {
    terracotta: { top: '#EA580C', left: '#FDE68A', right: '#D97706', win: '#1E293B' },
    cyan_glass: { top: '#06B6D4', left: '#E0F2FE', right: '#7DD3FC', win: '#0284C7' },
    bank_blue: { top: '#94A3B8', left: '#E2E8F0', right: '#93C5FD', win: '#1D4ED8' },
    solar_modern: { top: '#CBD5E1', left: '#F8FAFC', right: '#CBD5E1', win: '#0F172A' },
    coral: { top: '#F43F5E', left: '#FFE4E6', right: '#FDA4AF', win: '#334155' },
    cream: { top: '#94A3B8', left: '#FEF3C7', right: '#FDE68A', win: '#1E293B' },
  };
  const pal = palette[style] ?? palette.cream;

  drawIsoBox(ctx, toScreen, cx, cy, 0, w, d, h, pal.top, pal.left, pal.right);
  drawIsoWallWindows(ctx, toScreen, cx, cy, w, d, h, pal.win);

  // Rooftop Solar Panels / Water Tanks
  if (style === 'solar_modern' || style === 'bank_blue') {
    drawIsoBox(ctx, toScreen, cx - 18, cy, h, 42, 34, 6, '#1D4ED8', '#1E3A8A', '#172554');
    drawIsoBox(ctx, toScreen, cx + 24, cy + 12, h, 20, 20, 14, '#0284C7', '#0369A1', '#075985');
  } else {
    drawIsoBox(ctx, toScreen, cx - 20, cy - 18, h, 22, 22, 14, '#0EA5E9', '#0284C7', '#0369A1');
  }
}

function drawIsoTree(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  wx: number,
  wy: number
) {
  const base = toScreen(wx, wy, 0);
  const top = toScreen(wx, wy, 28);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.beginPath();
  ctx.ellipse(base.x + 6, base.y + 3, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#78350F';
  ctx.fillRect(base.x - 2.5, top.y + 8, 5, base.y - top.y - 6);

  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.arc(top.x, top.y + 4, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#65A30D';
  ctx.beginPath();
  ctx.arc(top.x - 3, top.y - 1, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawLandablePad3D(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  pad: RooftopPad,
  waiting: Passenger[],
  isDropoff: boolean,
  isHighlighted: boolean,
  onActiveRoute: boolean,
  stopOrderNum: number | null,
  routeColor: string,
  timeSec: number,
  heli: HelicopterState
) {
  // 1. 3D Building Box
  const leftCol = pad.wallColor;
  const rightCol = onActiveRoute ? '#94A3B8' : '#CBD5E1';
  drawIsoBox(
    ctx,
    toScreen,
    pad.x,
    pad.y,
    0,
    pad.width,
    pad.depth,
    pad.height,
    onActiveRoute ? '#334155' : '#475569',
    leftCol,
    rightCol
  );
  drawIsoWallWindows(ctx, toScreen, pad.x, pad.y, pad.width, pad.depth, pad.height, '#1E293B');

  // 2. Rooftop Helipad Markings on Top Face
  const center = toScreen(pad.x, pad.y, pad.height + 1);
  const pulse = 0.55 + 0.45 * Math.sin(timeSec * 5);

  ctx.save();
  ctx.strokeStyle = isDropoff || isHighlighted
    ? `rgba(16, 185, 129, ${0.55 + pulse * 0.45})`
    : waiting.length > 0
      ? `rgba(245, 158, 11, ${0.55 + pulse * 0.45})`
      : onActiveRoute
        ? routeColor
        : '#64748B';
  ctx.lineWidth = isDropoff || waiting.length > 0 ? 4.5 : onActiveRoute ? 3.5 : 2;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, onActiveRoute ? 48 : 36, onActiveRoute ? 24 : 18, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isDropoff ? '#34D399' : waiting.length > 0 ? '#FBBF24' : onActiveRoute ? '#F8FAFC' : '#94A3B8';
  ctx.font = `700 ${onActiveRoute ? 22 : 17}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', center.x, center.y);
  ctx.restore();

  // 3. Depot Pump Kiosk on Hub Roofs with Depot
  if (pad.hasDepot) {
    drawIsoBox(ctx, toScreen, pad.x - 58, pad.y - 52, pad.height, 36, 30, 22, '#DC2626', '#F8FAFC', '#CBD5E1');
    const dp = toScreen(pad.x - 58, pad.y - 52, pad.height + 28);
    ctx.font = '700 11px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FEF08A';
    ctx.fillText('তেল ডিপো', dp.x, dp.y);
  }

  // 4. LARGE, HIGH-CONTRAST ROOFTOP BILLBOARD FOR ALL STOPPAGES (Always visible!)
  ctx.save();
  const roofEdge = toScreen(pad.x, pad.y - pad.depth / 2 + 10, pad.height + 4);
  const signPos = toScreen(pad.x, pad.y - pad.depth / 2 + 10, pad.height + 48);

  // Twin steel billboard support pillars from roof to signboard
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(roofEdge.x - 38, roofEdge.y);
  ctx.lineTo(signPos.x - 38, signPos.y);
  ctx.moveTo(roofEdge.x + 38, roofEdge.y);
  ctx.lineTo(signPos.x + 38, signPos.y);
  ctx.stroke();

  const numPrefix = stopOrderNum !== null ? `${toBanglaDigits(stopOrderNum)}. ` : '';
  const mainStopTitle = `${numPrefix}${pad.zoneNameBn}`;
  const subTag = isDropoff
    ? '▼ এখানে যাত্রী নামবে ▼'
    : waiting.length > 0
      ? `যাত্রী অপেক্ষমাণ (${toBanglaDigits(waiting.length)} জন)`
      : onActiveRoute
        ? 'রুট স্টপেজ হেলিপ্যাড'
        : 'ঢাকা হেলিপ্যাড';

  ctx.font = `700 ${onActiveRoute || isDropoff ? 20 : 17}px "Hind Siliguri", sans-serif`;
  const titleW = ctx.measureText(mainStopTitle).width;
  ctx.font = '700 11px "Hind Siliguri", sans-serif';
  const subW = ctx.measureText(subTag).width;

  const boxW = Math.max(titleW, subW) + 32;
  const boxH = 44;
  const boxX = signPos.x - boxW / 2;
  const boxY = signPos.y - boxH;

  // Drop shadow behind billboard
  ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
  ctx.beginPath();
  ctx.roundRect(boxX + 3, boxY + 4, boxW, boxH, 9);
  ctx.fill();

  // High-contrast billboard panel
  ctx.fillStyle = isDropoff
    ? '#064E3B'
    : onActiveRoute
      ? '#0F172A'
      : 'rgba(15, 23, 42, 0.94)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 9);
  ctx.fill();

  ctx.strokeStyle = isDropoff
    ? '#34D399'
    : waiting.length > 0
      ? '#FACC15'
      : onActiveRoute
        ? routeColor
        : '#94A3B8';
  ctx.lineWidth = isDropoff || onActiveRoute ? 2.8 : 1.8;
  ctx.stroke();

  // Large Stoppage Name in Bengali
  ctx.font = `700 ${onActiveRoute || isDropoff ? 20 : 17}px "Hind Siliguri", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isDropoff ? '#A7F3D0' : '#FEF08A';
  ctx.fillText(mainStopTitle, signPos.x, boxY + 17);

  // Subtitle status line
  ctx.font = '700 11px "Hind Siliguri", sans-serif';
  ctx.fillStyle = isDropoff ? '#34D399' : waiting.length > 0 ? '#FDE047' : '#E2E8F0';
  ctx.fillText(subTag, signPos.x, boxY + 34);

  // Also paint the stoppage name directly on the front parapet wall below the helipad
  const frontWallPos = toScreen(pad.x, pad.y + pad.depth / 2 + 1, pad.height - 14);
  ctx.font = '700 13px "Hind Siliguri", sans-serif';
  const fwW = ctx.measureText(pad.zoneNameBn).width + 16;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(frontWallPos.x - fwW / 2, frontWallPos.y - 10, fwW, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(pad.zoneNameBn, frontWallPos.x, frontWallPos.y + 1);
  ctx.restore();

  // 5. Waiting Cartoon Passengers Standing on Rooftop Calling Out!
  const nearHeli = Math.hypot(heli.x - pad.x, heli.y - pad.y) < 1600;
  const helperActive = heli.helperCallingTimer > 0 && nearHeli;

  waiting.forEach((p, idx) => {
    const px = pad.x + 38 + idx * 30;
    const py = pad.y + 28;
    const sp = toScreen(px, py, pad.height + 1);
    const wave = Math.sin(timeSec * (helperActive || nearHeli ? 13 : 5.5) + idx * 1.4);

    drawCartoonPerson(ctx, sp.x, sp.y, {
      shirtColor: p.shirtColor,
      skinColor: p.skinColor,
      persona: p.persona,
      wavePhase: wave,
      isWaving: true,
      stridePhase: 0,
      isCalling: helperActive || nearHeli,
    });

    if (idx === 0) {
      const callText = nearHeli
        ? p.calloutLineBn
        : `→ ${p.destinationNameBn} (${toBanglaDigits(p.distanceKm)} কি.মি.)`;
      ctx.font = '700 12px "Hind Siliguri", sans-serif';
      const w = ctx.measureText(callText).width + 16;
      ctx.fillStyle = helperActive || nearHeli ? '#FEF08A' : 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.roundRect(sp.x - w / 2, sp.y - 60, w, 22, 5);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = helperActive || nearHeli ? '#0F172A' : '#FDE68A';
      ctx.textAlign = 'center';
      ctx.fillText(callText, sp.x, sp.y - 45);
    }
  });
}

function drawCartoonPerson(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  opts: {
    shirtColor: string;
    skinColor: string;
    persona?: string;
    wavePhase: number;
    isWaving: boolean;
    stridePhase: number;
    isCalling: boolean;
  }
) {
  const { shirtColor, skinColor, persona, wavePhase, isWaving, stridePhase, isCalling } = opts;
  const isFemale = persona === 'aunty' || persona === 'student';
  const isUncle = persona === 'uncle' || persona === 'merchant';

  ctx.save();
  // Ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 8.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = Math.sin(stridePhase) * 3.5;

  // Cartoon Legs & Shoes
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx - 2.6, sy - 7);
  ctx.lineTo(sx - 3.2 - legSwing, sy);
  ctx.moveTo(sx + 2.6, sy - 7);
  ctx.lineTo(sx + 3.2 + legSwing, sy);
  ctx.stroke();

  // Shoes
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.ellipse(sx - 3.5 - legSwing, sy + 0.5, 2.5, 1.4, 0, 0, Math.PI * 2);
  ctx.ellipse(sx + 3.5 + legSwing, sy + 0.5, 2.5, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cartoon Outfit Torso (Rounded Jacket/Shirt or Saree/Kurti)
  ctx.fillStyle = shirtColor;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  if (isFemale) {
    // Flared kurti/saree silhouette
    ctx.moveTo(sx - 5.5, sy - 18);
    ctx.lineTo(sx + 5.5, sy - 18);
    ctx.lineTo(sx + 7, sy - 6);
    ctx.lineTo(sx - 7, sy - 6);
    ctx.closePath();
  } else {
    ctx.roundRect(sx - 6, sy - 19, 12, 13, 4);
  }
  ctx.fill();
  ctx.stroke();

  // Shirt Collar / Saree Pallu / Waistcoat Accent
  if (isFemale) {
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy - 17);
    ctx.lineTo(sx + 5, sy - 8);
    ctx.stroke();
  } else if (persona === 'office') {
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(sx - 2.5, sy - 19);
    ctx.lineTo(sx + 2.5, sy - 19);
    ctx.lineTo(sx, sy - 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(sx - 0.8, sy - 17, 1.6, 5);
  } else if (isUncle) {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(sx - 4.5, sy - 18, 2.5, 9);
    ctx.fillRect(sx + 2, sy - 18, 2.5, 9);
  }

  // Right Arm (holding briefcase/bag or swinging)
  const rightArmY = sy - 10 - legSwing * 0.5;
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx + 5.5, sy - 17);
  ctx.lineTo(sx + 8.5, rightArmY);
  ctx.stroke();
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(sx + 8.5, rightArmY, 2, 0, Math.PI * 2);
  ctx.fill();

  if (persona === 'office' || persona === 'merchant') {
    // Cartoon briefcase / bag
    ctx.fillStyle = '#78350F';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1;
    ctx.fillRect(sx + 6, rightArmY, 5.5, 4.5);
    ctx.strokeRect(sx + 6, rightArmY, 5.5, 4.5);
  }

  // Left Arm (Waving energetically at the helicopter!)
  const handX = isWaving ? sx - 12 + wavePhase * 2.5 : sx - 8.5;
  const handY = isWaving ? sy - 27 + wavePhase * 3.5 : sy - 10 + legSwing * 0.5;
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = 3.1;
  ctx.beginPath();
  ctx.moveTo(sx - 5.5, sy - 17);
  ctx.quadraticCurveTo(sx - 10, sy - 20, handX, handY);
  ctx.stroke();
  ctx.fillStyle = skinColor;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(handX, handY, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Expressive Cartoon Head
  const headY = sy - 25.5;
  ctx.fillStyle = skinColor;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(sx, headY, 6.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ears
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(sx - 6.4, headY + 0.5, 1.6, 0, Math.PI * 2);
  ctx.arc(sx + 6.4, headY + 0.5, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Cartoon Hair / Dupatta / Cap
  if (persona === 'aunty') {
    // Traditional hair bun + colorful headscarf border
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(sx, headY - 2, 6.6, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.arc(sx + 5.5, headY - 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (persona === 'student') {
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(sx, headY - 2.2, 6.7, Math.PI * 0.92, Math.PI * 0.08);
    ctx.fill();
    // Stylish bangs/cap brim
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.ellipse(sx + 2, headY - 6.5, 5.5, 2, -0.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = isUncle ? '#64748B' : '#0F172A';
    ctx.beginPath();
    ctx.arc(sx, headY - 2.4, 6.6, Math.PI * 0.95, Math.PI * 0.05);
    ctx.fill();
  }

  // Big Cartoon Eyes (White Sclera + Dark Pupils)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(sx - 2.2, headY - 0.5, 1.65, 0, Math.PI * 2);
  ctx.arc(sx + 2.2, headY - 0.5, 1.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(sx - 2.0, headY - 0.6, 0.9, 0, Math.PI * 2);
  ctx.arc(sx + 2.4, headY - 0.6, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Uncle mustache
  if (isUncle) {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx - 2.5, headY + 2);
    ctx.quadraticCurveTo(sx, headY + 1, sx + 2.5, headY + 2);
    ctx.stroke();
  }

  // Expressive Smiling / Calling Cartoon Mouth
  if (isCalling) {
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.ellipse(sx, headY + 3.2, 2.2, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx, headY + 2.2, 2.1, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  ctx.restore();
}

function drawIsoVehicle3D(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  v: TrafficVehicle,
  vx: number,
  vy: number,
  timeSec: number
) {
  const isH = v.roadAxis === 'H';
  const len =
    v.type === 'lorry'
      ? 66
      : v.type === 'bus'
        ? 58
        : v.type === 'truck'
          ? 52
          : v.type === 'car'
            ? 35
            : v.type === 'cng'
              ? 24
              : v.type === 'rickshaw'
                ? 23
                : 16;
  const wid =
    v.type === 'lorry'
      ? 24
      : v.type === 'bus'
        ? 23
        : v.type === 'truck'
          ? 22
          : v.type === 'car'
            ? 18
            : v.type === 'bike'
              ? 9
              : 15;
  const h =
    v.type === 'lorry'
      ? 26
      : v.type === 'bus'
        ? 23
        : v.type === 'truck'
          ? 22
          : v.type === 'cng'
            ? 15
            : v.type === 'rickshaw'
              ? 14
              : v.type === 'bike'
                ? 9
                : 12;

  const w = isH ? len : wid;
  const d = isH ? wid : len;

  // Ground shadow
  const sh = toScreen(vx + 3, vy + 3, 0);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.beginPath();
  ctx.ellipse(sh.x, sh.y, isH ? len * 0.42 : wid * 0.6, isH ? wid * 0.45 : len * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  if (v.type === 'bus') {
    drawIsoBox(ctx, toScreen, vx, vy, 0, w, d, h, '#F8FAFC', v.color, '#1E293B');
    // Dark window band & AC roof pods
    drawIsoBox(ctx, toScreen, vx, vy, h - 9, w * 0.94, d * 0.94, 5, v.color, '#0F172A', '#0F172A');
    drawIsoBox(ctx, toScreen, vx, vy, h, w * 0.45, d * 0.55, 3, '#E2E8F0', '#CBD5E1', '#94A3B8');
  } else if (v.type === 'truck') {
    // Bangladeshi Goods Truck: Painted Front Cab + Wooden/Steel Cargo Bed with Blue/Amber Tarpaulin
    const cabOffX = isH ? v.dir * 16 : 0;
    const cabOffY = isH ? 0 : v.dir * 16;
    const bedOffX = isH ? -v.dir * 8 : 0;
    const bedOffY = isH ? 0 : -v.dir * 8;
    const cabW = isH ? 18 : wid;
    const cabD = isH ? wid : 18;
    const bedW = isH ? 34 : wid;
    const bedD = isH ? wid : 34;

    // Cargo bed + high tarpaulin load
    drawIsoBox(ctx, toScreen, vx + bedOffX, vy + bedOffY, 0, bedW, bedD, 11, '#78350F', '#92400E', '#451A03');
    drawIsoBox(
      ctx,
      toScreen,
      vx + bedOffX,
      vy + bedOffY,
      11,
      bedW * 0.92,
      bedD * 0.92,
      11,
      v.secondaryColor,
      v.secondaryColor,
      '#1E3A8A'
    );
    // Decorated Yellow/Orange Truck Cab + Crown
    drawIsoBox(ctx, toScreen, vx + cabOffX, vy + cabOffY, 0, cabW, cabD, 18, '#FACC15', v.color, '#9A3412');
    drawIsoBox(ctx, toScreen, vx + cabOffX, vy + cabOffY, 18, cabW * 0.8, cabD * 0.8, 4, '#DC2626', '#FACC15', '#B91C1C');
  } else if (v.type === 'lorry') {
    // Heavy Long Container Lorry / Covered Van: Tractor Cab + Long Container Trailer
    const cabOffX = isH ? v.dir * 22 : 0;
    const cabOffY = isH ? 0 : v.dir * 22;
    const trOffX = isH ? -v.dir * 8 : 0;
    const trOffY = isH ? 0 : -v.dir * 8;
    const cabW = isH ? 18 : wid * 0.92;
    const cabD = isH ? wid * 0.92 : 18;
    const trW = isH ? 46 : wid;
    const trD = isH ? wid : 46;

    // Long Container Box
    drawIsoBox(ctx, toScreen, vx + trOffX, vy + trOffY, 0, trW, trD, h, '#F8FAFC', v.secondaryColor, '#64748B');
    // Tractor Cab
    drawIsoBox(ctx, toScreen, vx + cabOffX, vy + cabOffY, 0, cabW, cabD, 19, v.color, v.color, '#0F172A');
  } else if (v.type === 'cng') {
    // Classic Dhaka Green CNG with Yellow Canopy Top
    drawIsoBox(ctx, toScreen, vx, vy, 0, w, d, 9, '#16A34A', '#15803D', '#166534');
    drawIsoBox(ctx, toScreen, vx, vy, 9, w * 0.85, d * 0.85, 6, '#FACC15', '#1E293B', '#14532D');
  } else if (v.type === 'rickshaw') {
    // Colorful Dhaka Rickshaw Hood Canopy + Passenger + Puller
    drawIsoBox(ctx, toScreen, vx, vy, 0, w, d, 6, '#334155', '#1E293B', '#0F172A');
    const hoodX = isH ? vx - v.dir * 4 : vx;
    const hoodY = isH ? vy : vy - v.dir * 4;
    drawIsoBox(ctx, toScreen, hoodX, hoodY, 6, w * 0.65, d * 0.72, 10, v.color, v.color, '#881337');
    const puller = toScreen(isH ? vx + v.dir * 6 : vx, isH ? vy : vy + v.dir * 6, 11);
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(puller.x, puller.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (v.type === 'car') {
    // Lower Sedan Chassis + Raised Windshield Cabin
    drawIsoBox(ctx, toScreen, vx, vy, 0, w, d, 7, v.color, v.color, '#1E293B');
    drawIsoBox(ctx, toScreen, vx, vy, 7, w * 0.58, d * 0.78, 6, v.color, '#38BDF8', '#1E293B');
  } else {
    // Motorbike + Rider
    drawIsoBox(ctx, toScreen, vx, vy, 0, w, d, 8, '#1E293B', v.color, '#0F172A');
    const rider = toScreen(vx, vy, 12);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(rider.x, rider.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (v.honkTimer > 0 && v.honkText) {
    const sp = toScreen(vx, vy, h + 14 + Math.sin(timeSec * 12) * 2);
    ctx.font = '700 10px "Hind Siliguri", sans-serif';
    const tw = ctx.measureText(v.honkText).width + 10;
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.roundRect(sp.x - tw / 2, sp.y - 16, tw, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.fillText(v.honkText, sp.x, sp.y - 4);
  }
}

function drawIsoWalkingPerson(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  wx: number,
  wy: number,
  wz: number,
  anim: WalkingPassengerAnim,
  timeSec: number
) {
  const bob = Math.abs(Math.sin(timeSec * 16)) * 3;
  const sp = toScreen(wx, wy, wz + bob);

  drawCartoonPerson(ctx, sp.x, sp.y, {
    shirtColor: anim.shirtColor,
    skinColor: anim.skinColor,
    wavePhase: Math.sin(timeSec * 12),
    isWaving: anim.kind === 'deboarding',
    stridePhase: timeSec * 14,
    isCalling: false,
  });

  ctx.save();
  const label = anim.kind === 'boarding' ? `${anim.nameBn} উঠছে...` : `ধন্যবাদ! (${anim.fareText ?? ''})`;
  ctx.font = '700 11px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3;
  ctx.strokeText(label, sp.x, sp.y - 38);
  ctx.fillStyle = anim.kind === 'boarding' ? '#FDE68A' : '#34D399';
  ctx.fillText(label, sp.x, sp.y - 38);
  ctx.restore();
}

interface HeliPalette {
  light: string;
  main: string;
  mid: string;
  dark: string;
  tip: string;
  brandTop: string;
  brandBottom: string;
  brandBottomCol: string;
}

const HELI_PALETTES: Record<'PLAYER' | 'AI', HeliPalette> = {
  PLAYER: {
    light: '#FEF08A',
    main: '#FACC15',
    mid: '#EAB308',
    dark: '#CA8A04',
    tip: '#FACC15',
    brandTop: 'DHAKA',
    brandBottom: 'AIR TAXI',
    brandBottomCol: '#DC2626',
  },
  AI: {
    light: '#A7F3D0',
    main: '#10B981',
    mid: '#059669',
    dark: '#047857',
    tip: '#38BDF8',
    brandTop: 'AI',
    brandBottom: 'EXPRESS',
    brandBottomCol: '#0284C7',
  },
};

function drawRotorBlades4(
  ctx: CanvasRenderingContext2D,
  mastX: number,
  mastTopY: number,
  rxMax: number,
  ryMax: number,
  rotorAngle: number,
  tipColor = '#FACC15'
) {
  // Subtle rotor motion blur disc
  ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.24)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(mastX, mastTopY, rxMax, ryMax, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4 Carbon-Black Blades with Bright Tips
  for (let b = 0; b < 4; b++) {
    const ang = rotorAngle + (b * Math.PI) / 2;
    const rx = Math.cos(ang) * rxMax;
    const ry = Math.sin(ang) * ryMax;
    const midX = mastX + rx * 0.78;
    const midY = mastTopY + ry * 0.78;
    const tipX = mastX + rx;
    const tipY = mastTopY + ry;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(mastX, mastTopY);
    ctx.lineTo(midX, midY);
    ctx.stroke();

    ctx.strokeStyle = tipColor;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  }

  // Top rotor hub cap
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(mastX, mastTopY, 5.5, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * Multi-Angle 3D Isometric EC135 Helicopter (Player Yellow Taxi / AI Emerald Express):
 * Switches dynamically between Front Nose View, Back Tail View, and Left/Right 3/4 Side Views
 * so the helicopter's front ALWAYS faces the forward flight direction!
 */
function drawIsoHelicopter3D(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  heli: HelicopterState,
  heliZ: number,
  landedPad: RooftopPad | null,
  timeSec: number,
  variant: 'PLAYER' | 'AI' = 'PLAYER',
  aiLabel?: string
) {
  const pal = HELI_PALETTES[variant];

  // 1. Ground/Rooftop Shadow directly below helicopter
  const shadowZ = landedPad ? landedPad.height + 1 : 2;
  const shCenter = toScreen(heli.x + 14, heli.y + 14, shadowZ);
  const shScale = 1 - (heli.altitude / 100) * 0.25;
  ctx.save();
  ctx.translate(shCenter.x, shCenter.y);
  ctx.rotate(heli.headingAngle * 0.45);
  ctx.scale(shScale, shScale);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 56, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Normalized screen-space heading vector (unaffected by 2:1 isometric squash)
  const nx = Math.cos(heli.headingAngle) - Math.sin(heli.headingAngle);
  const ny = Math.cos(heli.headingAngle) + Math.sin(heli.headingAngle);
  const isCruising = heli.autoCruise && !landedPad;
  const hoverBob = !landedPad ? Math.sin(timeSec * 4.5 + (variant === 'AI' ? 1.5 : 0)) * 1.8 : 0;
  const hs = toScreen(heli.x, heli.y, heliZ + 14);
  const scale = (variant === 'AI' ? 0.98 : 1.05) + (heli.altitude / 100) * 0.1;

  ctx.save();
  ctx.translate(hs.x, hs.y + hoverBob);
  ctx.scale(scale, scale);

  const lean = Math.max(-1, Math.min(1, nx / 1.414));

  if (ny < 0 && Math.abs(ny) > Math.abs(nx) * 0.85) {
    drawHeliBackView(ctx, heli, isCruising, timeSec, lean, pal);
  } else if (ny > 0 && Math.abs(ny) > Math.abs(nx) * 0.85) {
    drawHeliFrontView(ctx, heli, isCruising, timeSec, lean, pal);
  } else {
    const flipX = nx > 0 ? -1 : 1;
    drawHeliSideView(ctx, heli, isCruising, timeSec, flipX, ny, pal);
  }

  ctx.restore();

  // AI Competitor Floating Tag
  if (variant === 'AI' && aiLabel) {
    const tagY = hs.y - 62;
    ctx.font = '700 11px "Hind Siliguri", sans-serif';
    const tw = ctx.measureText(aiLabel).width + 16;
    ctx.fillStyle = 'rgba(6, 78, 59, 0.92)';
    ctx.beginPath();
    ctx.roundRect(hs.x - tw / 2, tagY - 20, tw, 20, 6);
    ctx.fill();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#ECFDF5';
    ctx.textAlign = 'center';
    ctx.fillText(aiLabel, hs.x, tagY - 6);
  }

  // Helper Waving & Callout Speech Bubble (un-scaled, upright above helicopter)
  if (variant === 'PLAYER' && heli.helperCallingTimer > 0 && heli.helperCallText) {
    const wave = Math.sin(timeSec * 16) * 4;
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(hs.x + 10, hs.y + 8 + wave * 0.4, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const bubbleY = hs.y - 70;
    ctx.font = '700 12px "Hind Siliguri", sans-serif';
    const tw = ctx.measureText(heli.helperCallText).width + 20;
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.roundRect(hs.x - tw / 2, bubbleY - 24, tw, 24, 8);
    ctx.fill();
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.fillText(heli.helperCallText, hs.x, bubbleY - 8);
  }
}

/**
 * FRONT NOSE VIEW (Helicopter flying forward toward the viewer / Down-screen)
 */
function drawHeliFrontView(
  ctx: CanvasRenderingContext2D,
  heli: HelicopterState,
  isCruising: boolean,
  timeSec: number,
  lean: number,
  pal: HeliPalette
) {
  const noseX = lean * 12;
  const tailX = -lean * 18;
  const bankTilt = lean * 0.09;
  const pitchDrop = isCruising ? 4 : 0;

  ctx.save();
  ctx.rotate(bankTilt);

  // 1. Background Vertical Tail Fin & Bangladesh Flag rising behind upper cowling
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(tailX - 5, -24);
  ctx.lineTo(tailX - 3, -55);
  ctx.lineTo(tailX + 6, -55);
  ctx.lineTo(tailX + 7, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tail beacon light
  ctx.fillStyle = Math.sin(timeSec * 8) > 0 ? '#EF4444' : '#991B1B';
  ctx.beginPath();
  ctx.arc(tailX + 1.5, -56.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Horizontal stabilizer tips peeking out behind cabin
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(tailX - 24, -22, 48, 3.5);

  // 2. Symmetrical Curved Black Landing Skids extending toward viewer
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3.8;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const legX = sx * 25 + noseX * 0.35;
    // Diagonal skid struts
    ctx.beginPath();
    ctx.moveTo(sx * 16, 12);
    ctx.lineTo(legX, 27);
    ctx.moveTo(sx * 13, 6);
    ctx.lineTo(legX * 0.92, 18);
    // Front curved skid rail & upturned toe
    ctx.moveTo(legX * 0.92, 18);
    ctx.lineTo(legX, 28);
    ctx.quadraticCurveTo(legX, 32, legX + sx * 2, 23);
    ctx.stroke();
  }

  // 3. Wide Teardrop Front Fuselage Belly
  const hullGrad = ctx.createLinearGradient(0, -28, 0, 26);
  hullGrad.addColorStop(0, pal.light);
  hullGrad.addColorStop(0.35, pal.main);
  hullGrad.addColorStop(1, pal.dark);

  ctx.fillStyle = hullGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(noseX * 0.4, 2 + pitchDrop * 0.4, 30, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // White nose cheek wraparound stripes (left & right)
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(noseX - 28, 3 + pitchDrop * 0.5);
  ctx.bezierCurveTo(noseX - 18, 12 + pitchDrop, noseX - 8, 13 + pitchDrop, noseX - 4, 8 + pitchDrop);
  ctx.lineTo(noseX - 22, -2 + pitchDrop * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(noseX + 28, 3 + pitchDrop * 0.5);
  ctx.bezierCurveTo(noseX + 18, 12 + pitchDrop, noseX + 8, 13 + pitchDrop, noseX + 4, 8 + pitchDrop);
  ctx.lineTo(noseX + 22, -2 + pitchDrop * 0.4);
  ctx.closePath();
  ctx.fill();

  // Black lower cheek wedges
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(noseX - 25, 9 + pitchDrop * 0.6);
  ctx.lineTo(noseX - 10, 16 + pitchDrop);
  ctx.lineTo(noseX - 20, 14 + pitchDrop);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(noseX + 25, 9 + pitchDrop * 0.6);
  ctx.lineTo(noseX + 10, 16 + pitchDrop);
  ctx.lineTo(noseX + 20, 14 + pitchDrop);
  ctx.closePath();
  ctx.fill();

  // Glowing White Nose Headlight centered on Yellow Chin!
  ctx.fillStyle = 'rgba(254, 249, 195, 0.35)';
  ctx.beginPath();
  ctx.ellipse(noseX, 16 + pitchDrop, 8.5, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FEF9C3';
  ctx.beginPath();
  ctx.ellipse(noseX, 15.8 + pitchDrop, 4.8, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(noseX, 15.6 + pitchDrop, 2.5, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Huge Panoramic Front Glass Windshield with Tan Leather Seats, Pilot & Passengers!
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(noseX - 24, 3 + pitchDrop * 0.4);
  ctx.bezierCurveTo(noseX - 25, -15, noseX - 13, -24, noseX, -24);
  ctx.bezierCurveTo(noseX + 13, -24, noseX + 25, -15, noseX + 24, 3 + pitchDrop * 0.4);
  ctx.bezierCurveTo(noseX + 12, 9 + pitchDrop, noseX - 12, 9 + pitchDrop, noseX - 24, 3 + pitchDrop * 0.4);
  ctx.closePath();
  ctx.clip();

  // Dark cockpit interior
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(-35, -30, 70, 48);

  // Rear passenger tan leather seats (slightly behind front row)
  for (const rx of [-12, 0, 12]) {
    ctx.fillStyle = '#C6976E';
    ctx.beginPath();
    ctx.roundRect(noseX * 0.5 + rx - 4, -13, 8, 12, 2);
    ctx.fill();
  }
  // Seated passengers visible in rear row!
  const rearSeatX = [-12, 0, 12];
  for (let i = 0; i < 3; i++) {
    const p = heli.seats[i];
    if (!p) continue;
    const px = noseX * 0.5 + rearSeatX[i];
    ctx.fillStyle = p.shirtColor;
    ctx.fillRect(px - 3.5, -10, 7, 8);
    ctx.fillStyle = p.skinColor;
    ctx.beginPath();
    ctx.arc(px, -12.5, 2.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Front Pilot & Co-pilot Tan Leather Seats + Pilot
  ctx.fillStyle = '#B5835A';
  ctx.beginPath();
  ctx.roundRect(noseX - 16, -6, 10, 13, 3);
  ctx.roundRect(noseX + 6, -6, 10, 13, 3);
  ctx.fill();

  // Pilot sitting in front-right cockpit seat with sunglasses & headset
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(noseX + 6.5, -4, 9, 11);
  ctx.fillStyle = '#D99B72';
  ctx.beginPath();
  ctx.arc(noseX + 11, -7.5, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#09090B';
  ctx.fillRect(noseX + 8.5, -8.5, 5, 1.8);

  // Tinted Glass Gradient & Specular Glint
  const glassGrad = ctx.createLinearGradient(0, -24, 0, 10);
  glassGrad.addColorStop(0, 'rgba(56, 189, 248, 0.36)');
  glassGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.25)');
  glassGrad.addColorStop(1, 'rgba(30, 58, 95, 0.42)');
  ctx.fillStyle = glassGrad;
  ctx.fillRect(-35, -30, 70, 48);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.moveTo(noseX - 20, -2);
  ctx.bezierCurveTo(noseX - 18, -14, noseX - 9, -21, noseX - 3, -21);
  ctx.lineTo(noseX + 3, -21);
  ctx.bezierCurveTo(noseX - 4, -14, noseX - 12, -5, noseX - 15, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Windshield Outer Frame & Center Mullion
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(noseX - 24, 3 + pitchDrop * 0.4);
  ctx.bezierCurveTo(noseX - 25, -15, noseX - 13, -24, noseX, -24);
  ctx.bezierCurveTo(noseX + 13, -24, noseX + 25, -15, noseX + 24, 3 + pitchDrop * 0.4);
  ctx.bezierCurveTo(noseX + 12, 9 + pitchDrop, noseX - 12, 9 + pitchDrop, noseX - 24, 3 + pitchDrop * 0.4);
  ctx.moveTo(noseX, -24);
  ctx.lineTo(noseX, 8 + pitchDrop);
  ctx.stroke();

  // White Roof Arch & Yellow Upper Engine Cowling Dome + Twin Front Intakes
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.ellipse(noseX * 0.6, -23.5, 16, 4.5, 0, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -28, 17, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Twin dark intake grilles
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.ellipse(-9, -28, 3.2, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(9, -28, 3.2, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Rotor Mast & 4 Perspective Main Rotor Blades
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(0, -45);
  ctx.stroke();

  drawRotorBlades4(ctx, 0, -45, 84, 17, heli.rotorAngle, pal.tip);
  ctx.restore();
}

/**
 * REAR TAIL VIEW (Helicopter flying forward/away from the viewer / Up-screen)
 */
function drawHeliBackView(
  ctx: CanvasRenderingContext2D,
  heli: HelicopterState,
  isCruising: boolean,
  timeSec: number,
  lean: number,
  pal: HeliPalette
) {
  const noseX = lean * 16;
  const tailX = -lean * 18;
  const bankTilt = lean * 0.08;
  const pitchLift = isCruising ? -3 : 0;

  ctx.save();
  ctx.rotate(bankTilt);

  // 1. Symmetrical Curved Black Landing Skids behind/below hull
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3.8;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const legX = sx * 24 + noseX * 0.25;
    ctx.beginPath();
    ctx.moveTo(sx * 16, 11);
    ctx.lineTo(legX, 24);
    ctx.moveTo(legX, 24);
    ctx.lineTo(legX + sx * 3, 13);
    ctx.stroke();
  }

  // 2. Wide Rounded Rear Fuselage Body
  const backGrad = ctx.createLinearGradient(0, -28, 0, 22);
  backGrad.addColorStop(0, pal.light);
  backGrad.addColorStop(0.35, pal.main);
  backGrad.addColorStop(1, pal.dark);

  ctx.fillStyle = backGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(noseX * 0.3, -1 + pitchLift, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // White rear side door edges wrapping both flanks
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.ellipse(-22 + noseX * 0.3, 2 + pitchLift, 6, 12, 0.2, 0, Math.PI * 2);
  ctx.ellipse(22 + noseX * 0.3, 2 + pitchLift, 6, 12, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Dark glass side quarter windows peeking on flanks
  ctx.fillStyle = 'rgba(30, 58, 95, 0.85)';
  ctx.beginPath();
  ctx.ellipse(-21 + noseX * 0.3, -7 + pitchLift, 5, 6, 0.25, 0, Math.PI * 2);
  ctx.ellipse(21 + noseX * 0.3, -7 + pitchLift, 5, 6, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // Upper Cowling + Twin Rear Turbine Exhaust Nozzles
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -23 + pitchLift, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  for (const ex of [-7.5, 7.5]) {
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(ex, -22 + pitchLift, 3.6, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 3. Rotor Mast & 4 Perspective Main Rotor Blades (above cowling, behind tail fin tip)
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(0, -30 + pitchLift);
  ctx.lineTo(0, -44 + pitchLift);
  ctx.stroke();
  drawRotorBlades4(ctx, 0, -44 + pitchLift, 84, 17, heli.rotorAngle, pal.tip);

  // 4. Foreground Tapered Tail Boom + Fenestron + BD Flag Fin!
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(-12, -16 + pitchLift);
  ctx.lineTo(12, -16 + pitchLift);
  ctx.lineTo(tailX + 7, -8);
  ctx.lineTo(tailX - 7, -8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-13, -9 + pitchLift);
  ctx.lineTo(13, -9 + pitchLift);
  ctx.lineTo(tailX + 7.5, 6);
  ctx.lineTo(tailX - 7.5, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Checkerboard squares along rear tail cone
  for (let r = 0; r < 3; r++) {
    const cy = -5 + r * 3.5;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(tailX - 6.5 + (r % 2) * 3.5, cy, 3.2, 2.8);
    ctx.fillRect(tailX + 0.5 + (r % 2) * 3, cy, 3.2, 2.8);
  }

  // Horizontal Stabilizer Wings left & right
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(tailX - 24, -4, 48, 4.5, 2);
  ctx.fill();
  ctx.stroke();

  // Lower Ventral Tail Fin
  ctx.fillStyle = pal.main;
  ctx.beginPath();
  ctx.moveTo(tailX - 3, 6);
  ctx.lineTo(tailX + 3, 6);
  ctx.lineTo(tailX + 2, 16);
  ctx.lineTo(tailX - 2, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Circular Fenestron Ducted Tail Shroud
  const fenRx = 6 + Math.abs(lean) * 7.5;
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(tailX, -4, fenRx, 13.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner spinning Fenestron blades
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(tailX, -4, Math.max(3, fenRx * 0.62), 8.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.1;
  for (let fb = 0; fb < 6; fb++) {
    const fa = heli.rotorAngle * 2.4 + (fb * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(tailX, -4);
    ctx.lineTo(tailX + Math.cos(fa) * (fenRx * 0.55), -4 + Math.sin(fa) * 8);
    ctx.stroke();
  }

  // Tall Vertical Tail Fin above Fenestron with Bangladesh Flag
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(tailX - 5.5, -14);
  ctx.lineTo(tailX - 3.5, -45);
  ctx.lineTo(tailX + 4.5, -45);
  ctx.lineTo(tailX + 5.5, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Red beacon on top of tail fin
  ctx.fillStyle = Math.sin(timeSec * 8) > 0 ? '#EF4444' : '#991B1B';
  ctx.beginPath();
  ctx.arc(tailX + 0.5, -46.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Bangladesh Flag cleanly visible on rear vertical fin
  ctx.fillStyle = '#006A4E';
  ctx.fillRect(tailX - 3.5, -39, 8, 5.5);
  ctx.fillStyle = '#F42A41';
  ctx.beginPath();
  ctx.arc(tailX + 0.2, -36.2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 3/4 SIDE VIEW (Matching the uploaded EC135 photo, facing Left or Right)
 */
function drawHeliSideView(
  ctx: CanvasRenderingContext2D,
  heli: HelicopterState,
  isCruising: boolean,
  timeSec: number,
  flipX: number,
  ny: number,
  pal: HeliPalette
) {
  const pitchRad = isCruising ? -0.085 : 0;
  const yawBank = ny * 0.04;

  ctx.save();
  ctx.scale(flipX, 1);
  ctx.rotate(pitchRad + yawBank);

  // --- A. Far Tubular Landing Skid (behind fuselage) ---
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, 20);
  ctx.lineTo(-16, 10);
  ctx.moveTo(4, 20);
  ctx.lineTo(9, 10);
  ctx.moveTo(12, 20);
  ctx.lineTo(-34, 20);
  ctx.quadraticCurveTo(-45, 20, -49, 12);
  ctx.stroke();

  // --- B. Curved Tail Boom + Fenestron Circular Tail + Bangladesh Flag Fin ---
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(16, -11);
  ctx.bezierCurveTo(38, -11, 58, -15, 75, -17);
  ctx.lineTo(75, -4);
  ctx.bezierCurveTo(54, -2, 34, 7, 16, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sleek black upper spine & transition swoop behind rear cabin window
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(14, -13);
  ctx.bezierCurveTo(28, -14, 48, -14, 74, -17);
  ctx.lineTo(73, -12);
  ctx.bezierCurveTo(47, -10, 34, -4, 21, 0);
  ctx.bezierCurveTo(17, -4, 16, -9, 14, -13);
  ctx.closePath();
  ctx.fill();

  // 2-row Black & Yellow Taxi Checkerboard along Tail Boom
  for (let i = 0; i < 6; i++) {
    const cx = 22 + i * 7.2;
    const cy = 2.8 - i * 1.9;
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 3);
    ctx.lineTo(cx + 3.6, cy - 3.9);
    ctx.lineTo(cx + 3.6, cy - 0.5);
    ctx.lineTo(cx, cy + 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 3.6, cy - 0.5);
    ctx.lineTo(cx + 7.2, cy - 1.4);
    ctx.lineTo(cx + 7.2, cy + 2);
    ctx.lineTo(cx + 3.6, cy + 2.9);
    ctx.closePath();
    ctx.fill();
  }

  // Horizontal stabilizer winglet at tail
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(64, -12);
  ctx.lineTo(78, -11);
  ctx.lineTo(76, -8);
  ctx.lineTo(62, -9);
  ctx.closePath();
  ctx.fill();

  // Lower ventral tail fin
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(73, -2);
  ctx.lineTo(80, 6);
  ctx.lineTo(85, 5);
  ctx.lineTo(81, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vertical Swept Tail Fin above Fenestron with Bangladesh Flag
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(72, -20);
  ctx.lineTo(82, -48);
  ctx.lineTo(93, -47);
  ctx.lineTo(88, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Red beacon light on top of tail fin
  ctx.fillStyle = Math.sin(timeSec * 8) > 0 ? '#EF4444' : '#991B1B';
  ctx.beginPath();
  ctx.arc(86, -49, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Crisp Bangladesh Flag on Tail Fin
  ctx.save();
  ctx.translate(81, -40);
  ctx.transform(1, -0.06, -0.22, 1, 0, 0);
  ctx.fillStyle = '#006A4E';
  ctx.fillRect(0, 0, 9.5, 6);
  ctx.fillStyle = '#F42A41';
  ctx.beginPath();
  ctx.arc(4.2, 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Circular Fenestron Ducted Tail Rotor Ring
  const fenX = 81;
  const fenY = -12;
  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(fenX, fenY, 13.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(fenX, fenY, 8.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.2;
  for (let fb = 0; fb < 8; fb++) {
    const fa = heli.rotorAngle * 2.4 + (fb * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(fenX, fenY);
    ctx.lineTo(fenX + Math.cos(fa) * 8, fenY + Math.sin(fa) * 8);
    ctx.stroke();
  }
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(fenX, fenY, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // --- C. Teardrop Main Fuselage Body ---
  const bodyGrad = ctx.createLinearGradient(0, -30, 0, 22);
  bodyGrad.addColorStop(0, pal.light);
  bodyGrad.addColorStop(0.25, pal.main);
  bodyGrad.addColorStop(0.88, pal.mid);
  bodyGrad.addColorStop(1, pal.dark);

  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-54, 10);
  ctx.bezierCurveTo(-55, -2, -38, -22, -14, -27);
  ctx.bezierCurveTo(6, -32, 22, -26, 26, -13);
  ctx.bezierCurveTo(28, 3, 18, 17, 0, 20);
  ctx.bezierCurveTo(-24, 23, -52, 18, -54, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White side cabin door panel & sweeping nose stripe
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(-50, 7);
  ctx.bezierCurveTo(-30, 9, -18, 4, -8, -19);
  ctx.bezierCurveTo(4, -20, 18, -16, 23, -7);
  ctx.bezierCurveTo(25, 4, 17, 14, 2, 16);
  ctx.bezierCurveTo(-18, 18, -38, 13, -50, 7);
  ctx.closePath();
  ctx.fill();

  // Sleek jet-black lower nose wedge accent under white stripe
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(-45, 9);
  ctx.bezierCurveTo(-34, 11, -24, 12, -16, 15);
  ctx.lineTo(-27, 15);
  ctx.bezierCurveTo(-35, 13, -41, 11, -45, 9);
  ctx.closePath();
  ctx.fill();

  // Bright Glowing White Nose Headlight
  ctx.fillStyle = '#FEF9C3';
  ctx.beginPath();
  ctx.ellipse(-47, 11.5, 3.6, 2, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-47.3, 11.4, 2, 1.1, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // --- D. Panoramic Wraparound Cockpit Canopy with Visible Tan Leather Seats & Occupants ---
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-49, 4);
  ctx.bezierCurveTo(-45, -10, -28, -22, -9, -23);
  ctx.bezierCurveTo(4, -23, 16, -18, 19, -8);
  ctx.lineTo(15, 0);
  ctx.bezierCurveTo(-6, 3, -32, 6, -49, 4);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(-52, -26, 76, 36);

  const drawMiniSeat = (sx: number, sy: number) => {
    ctx.fillStyle = '#C6976E';
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.roundRect(sx - 3.5, sy - 9, 7, 11, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#9A6F49';
    ctx.fillRect(sx - 2.5, sy - 10.5, 5, 2.5);
  };
  drawMiniSeat(-21, -2);
  drawMiniSeat(-13, -3);
  drawMiniSeat(-3, -2);
  drawMiniSeat(5, -2.5);
  drawMiniSeat(12, -3);

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-24, -6, 6, 7);
  ctx.fillStyle = '#D99B72';
  ctx.beginPath();
  ctx.arc(-21, -8.5, 2.8, 0, Math.PI * 2);
  ctx.fill();

  const seatPositions = [
    { x: -13, y: -2 },
    { x: -3, y: -1.5 },
    { x: 6, y: -2 },
  ];
  for (let i = 0; i < 3; i++) {
    const p = heli.seats[i];
    if (!p) continue;
    const sp = seatPositions[i];
    ctx.fillStyle = p.shirtColor;
    ctx.fillRect(sp.x - 3, sp.y - 5, 6, 7);
    ctx.fillStyle = p.skinColor;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y - 7.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const glassGrad = ctx.createLinearGradient(-48, -22, 18, 4);
  glassGrad.addColorStop(0, 'rgba(56, 189, 248, 0.38)');
  glassGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
  glassGrad.addColorStop(1, 'rgba(30, 58, 95, 0.45)');
  ctx.fillStyle = glassGrad;
  ctx.fillRect(-52, -26, 76, 36);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.moveTo(-43, 0);
  ctx.bezierCurveTo(-36, -12, -24, -19, -15, -20);
  ctx.lineTo(-10, -20);
  ctx.bezierCurveTo(-19, -16, -29, -8, -36, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-49, 4);
  ctx.bezierCurveTo(-45, -10, -28, -22, -9, -23);
  ctx.bezierCurveTo(4, -23, 16, -18, 19, -8);
  ctx.lineTo(15, 0);
  ctx.bezierCurveTo(-6, 3, -32, 6, -49, 4);
  ctx.moveTo(-18, 3);
  ctx.bezierCurveTo(-16, -8, -11, -18, -6, -23);
  ctx.moveTo(-1, 1);
  ctx.bezierCurveTo(1, -8, 4, -16, 6, -20);
  ctx.stroke();

  // --- E. White Side Door Brand Text (Un-flipped so never backwards!) ---
  ctx.save();
  ctx.translate(-1, 10);
  ctx.scale(flipX, 1);
  ctx.textAlign = 'center';
  ctx.font = '800 5.8px "JetBrains Mono", monospace';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(pal.brandTop, 0, -0.5);
  ctx.font = '800 4.8px "JetBrains Mono", monospace';
  ctx.fillStyle = pal.brandBottomCol;
  ctx.fillText(pal.brandBottom, 0, 4.8);
  ctx.restore();

  // --- F. White Windshield Roof Arch + Engine Cowling + Intake Grille & Exhaust ---
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(-25, -17);
  ctx.bezierCurveTo(-16, -24, -2, -25, 10, -20);
  ctx.lineTo(5, -18);
  ctx.bezierCurveTo(-4, -21, -14, -20, -21, -15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = pal.main;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-14, -23);
  ctx.bezierCurveTo(-8, -32, 12, -32, 22, -20);
  ctx.bezierCurveTo(25, -15, 22, -13, 14, -14);
  ctx.bezierCurveTo(4, -17, -6, -21, -14, -23);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(3, -27, 8, 5);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(3.5, -25.2);
  ctx.lineTo(10.5, -25.2);
  ctx.moveTo(3.5, -23.5);
  ctx.lineTo(10.5, -23.5);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(17.5, -21, 3.6, 2.4, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- G. Near Jet-Black Landing Skid ---
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, 14);
  ctx.lineTo(16, 24);
  ctx.moveTo(-14, 15);
  ctx.lineTo(-9, 27);
  ctx.moveTo(27, 23);
  ctx.lineTo(-22, 29);
  ctx.quadraticCurveTo(-34, 30, -39, 22);
  ctx.stroke();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 22.2);
  ctx.lineTo(-22, 28);
  ctx.stroke();

  // --- H. Rotor Mast, Swashplate & 4 Perspective Main Rotor Blades ---
  const mastX = -2;
  const mastBaseY = -30;
  const mastTopY = -42;

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(mastX, mastBaseY);
  ctx.lineTo(mastX, mastTopY);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.fillRect(mastX - 4, mastTopY + 3, 8, 3);

  drawRotorBlades4(ctx, mastX, mastTopY, 82, 16, heli.rotorAngle, pal.tip);
  ctx.restore();
}

function drawIsoDestinationPointers(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  heli: HelicopterState,
  heliZ: number,
  highlightedDestId: StopId | null
) {
  const heliScreen = toScreen(heli.x, heli.y, heliZ);

  const targetIds = new Set<StopId>();
  heli.seats.forEach((s) => {
    if (s) targetIds.add(s.destinationId);
  });
  if (highlightedDestId) targetIds.add(highlightedDestId);

  for (const destId of targetIds) {
    const loc = DHAKA_LOCATIONS.find((l) => l.id === destId);
    if (!loc) continue;
    const distPx = Math.hypot(loc.x - heli.x, loc.y - heli.y);
    if (distPx < 280) continue;

    const destScreen = toScreen(loc.x, loc.y, 120);
    const angle = Math.atan2(destScreen.y - heliScreen.y, destScreen.x - heliScreen.x);
    const ringR = 105;
    const ax = heliScreen.x + Math.cos(angle) * ringR;
    const ay = heliScreen.y + Math.sin(angle) * ringR;
    const isPrimary = highlightedDestId === destId;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.fillStyle = isPrimary ? '#34D399' : '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const km = toBanglaDigits((distPx / PIXELS_PER_KM).toFixed(1));
    ctx.font = '700 11px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3.5;
    const txt = `${loc.nameBn} (${km} কি.মি.)`;
    ctx.strokeText(txt, ax, ay - 12);
    ctx.fillStyle = isPrimary ? '#6EE7B7' : '#FDE68A';
    ctx.fillText(txt, ax, ay - 12);
  }
}

function drawIsoToasts(
  ctx: CanvasRenderingContext2D,
  toScreen: (x: number, y: number, z?: number) => { x: number; y: number },
  toasts: FloatingToast[]
) {
  for (const t of toasts) {
    const sp = toScreen(t.x, t.y, t.z);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
    ctx.font = '700 14px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 4;
    ctx.strokeText(t.text, sp.x, sp.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, sp.x, sp.y);
    ctx.restore();
  }
}
