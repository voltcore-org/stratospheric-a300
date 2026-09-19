import { create } from "zustand";

export type ApplicationState = "MATERIALS" | "ASSEMBLY" | "RENDER" | "SIMULATION";

export const NAV: { id: ApplicationState; label: string; hint: string }[] = [
  { id: "MATERIALS", label: "BOM", hint: "Bill of materials" },
  { id: "ASSEMBLY", label: "Protocol", hint: "Fabrication sequence" },
  { id: "RENDER", label: "3D Mesh", hint: "Envelope inspect" },
  { id: "SIMULATION", label: "Telemetry", hint: "Ascent engine" },
];

export interface MaterialLine {
  id: string;
  component: string;
  spec: string;
  qty: string;
  massKg: number;
  costUsd: number;
  group: "Envelope" | "Structure" | "Propulsion" | "Avionics";
}

export const MATERIALS: MaterialLine[] = [
  {
    id: "env-ripstop",
    component: "Envelope",
    spec: "1.9 oz/yd² polyurethane ripstop, 24 gore panels",
    qty: "2,180 yd²",
    massKg: 412,
    costUsd: 31465,
    group: "Envelope",
  },
  {
    id: "crown-silicone",
    component: "Crown",
    spec: "1.9 oz/yd² silicone ripstop, UV/ozone face",
    qty: "310 yd²",
    massKg: 58,
    costUsd: 18000,
    group: "Envelope",
  },
  {
    id: "load-tapes",
    component: "Load tapes",
    spec: "1 in nylon webbing, 4,800 lbf rated",
    qty: "1,140 ft",
    massKg: 36,
    costUsd: 4200,
    group: "Envelope",
  },
  {
    id: "skirt-nomex",
    component: "Skirt",
    spec: "Nomex thermal throat, 18 in drop",
    qty: "1",
    massKg: 14,
    costUsd: 2800,
    group: "Envelope",
  },
  {
    id: "deflation",
    component: "Deflation panel",
    spec: "Smart vent + parachute top, 48 in",
    qty: "1",
    massKg: 11,
    costUsd: 3600,
    group: "Envelope",
  },
  {
    id: "frame",
    component: "Gondola space-frame",
    spec: "6061-T6 tube, 5 × 8 × 6.5 ft prism",
    qty: "1",
    massKg: 186,
    costUsd: 9800,
    group: "Structure",
  },
  {
    id: "cables",
    component: "Flying wires",
    spec: "1/4 in 7×19 stainless aircraft cable",
    qty: "16 terminations",
    massKg: 28,
    costUsd: 1900,
    group: "Structure",
  },
  {
    id: "burner",
    component: "Burner",
    spec: "Triple-manifold liquid-propane, 24 MBtu/h",
    qty: "1",
    massKg: 42,
    costUsd: 15000,
    group: "Propulsion",
  },
  {
    id: "fuel",
    component: "Fuel matrix",
    spec: "23× 15-gal titanium cylinders",
    qty: "23",
    massKg: 950,
    costUsd: 34500,
    group: "Propulsion",
  },
  {
    id: "avionics",
    component: "Flight deck",
    spec: "GNSS / baro / envelope thermocouple bus",
    qty: "1",
    massKg: 9,
    costUsd: 6400,
    group: "Avionics",
  },
];

export const BOM_TOTAL_USD = MATERIALS.reduce((s, m) => s + m.costUsd, 0);
export const BOM_TOTAL_KG = MATERIALS.reduce((s, m) => s + m.massKg, 0);

export interface ProtocolStep {
  id: string;
  title: string;
  detail: string;
  hours: number;
  station: string;
}

export const PROTOCOL: ProtocolStep[] = [
  {
    id: "p1",
    title: "Gore extraction",
    detail: "Execute CAD-plotted gore patterns via hot-knife extraction on polyurethane ripstop.",
    hours: 18,
    station: "Loft A",
  },
  {
    id: "p2",
    title: "Load-tape bonding",
    detail: "RF-weld 1 in nylon load tapes along each gore seam; proof at 1.5× flight load.",
    hours: 22,
    station: "Loft A",
  },
  {
    id: "p3",
    title: "Crown overlay",
    detail: "Bond silicone crown, parachute top, and deflation panel. Leak-check at 2 in H₂O.",
    hours: 10,
    station: "Loft B",
  },
  {
    id: "p4",
    title: "Space-frame weld",
    detail: "TIG weld 6061-T6 aluminum tubing into a 5 × 8 × 6.5 ft rectangular prism.",
    hours: 16,
    station: "Metals",
  },
  {
    id: "p5",
    title: "Cable termination",
    detail: "Terminate 1/4-inch 7×19 stainless steel aircraft cables to structural nodes.",
    hours: 8,
    station: "Metals",
  },
  {
    id: "p6",
    title: "Burner hang",
    detail: "Mount triple-manifold burner, plumb fuel rails, torque to 28 N·m.",
    hours: 6,
    station: "Propulsion",
  },
  {
    id: "p7",
    title: "Fuel matrix",
    detail: "Strap 23 titanium cylinders; hydrostatic stamp check; manifold isolation test.",
    hours: 9,
    station: "Propulsion",
  },
  {
    id: "p8",
    title: "Envelope QA",
    detail: "Full heat-weld inspection, skirt stitch, and 30-minute inflation leak-down.",
    hours: 12,
    station: "QA",
  },
];

export const PROTOCOL_HOURS = PROTOCOL.reduce((s, p) => s + p.hours, 0);

/** ISA + hot-air buoyancy engine. Tuned so A-300 hovers near 17,500 ft MSL at 100 °C envelope. */
export const G = 9.80665;
export const R_AIR = 287.05;
export const T0 = 288.15;
export const P0 = 101325;
export const LAPSE = 0.0065;
export const VOLUME_M3 = 9080;
export const DRY_MASS_KG = 796;
export const PAYLOAD_KG = 280;
export const FUEL_CAPACITY_KG = 950;
export const DRAG_AREA_M2 = 310;
export const CD = 0.42;
export const HEAT_RATE_K_S = 4.8;
export const COOL_RATE = 0.018;
export const VENT_COOL = 0.12;
export const FUEL_FLOW_KG_S = 0.062;
export const MAX_ENVELOPE_K = 393.15;
export const MIN_ENVELOPE_K = 250;
export const INITIAL_ALT_M = 17500 * 0.3048;
export const INITIAL_ENVELOPE_K = 373.15;

export interface IsaState {
  tempK: number;
  pressurePa: number;
  density: number;
}

export function isa(altitudeM: number): IsaState {
  const h = Math.max(0, Math.min(altitudeM, 11000));
  const tempK = T0 - LAPSE * h;
  const pressurePa = P0 * (tempK / T0) ** (G / (R_AIR * LAPSE));
  const density = pressurePa / (R_AIR * tempK);
  return { tempK, pressurePa, density };
}

export interface DerivedTelemetry {
  ambientC: number;
  envelopeC: number;
  density: number;
  netLiftN: number;
  massKg: number;
  climbFpm: number;
  altitudeFt: number;
  fuelFrac: number;
  hoverMarginKg: number;
}

export interface Sample {
  altFt: number;
  vsFpm: number;
  envC: number;
}

export interface StratumStore {
  tab: ApplicationState;
  setTab: (tab: ApplicationState) => void;
  done: Record<string, boolean>;
  toggleStep: (id: string) => void;
  hydrateProtocol: (done: Record<string, boolean>) => void;
  altitudeM: number;
  envelopeK: number;
  fuelKg: number;
  verticalMs: number;
  throttle: number;
  vent: number;
  missionS: number;
  paused: boolean;
  history: Sample[];
  setThrottle: (v: number) => void;
  setVent: (v: number) => void;
  togglePause: () => void;
  resetFlight: () => void;
  step: (dt: number) => void;
  derived: () => DerivedTelemetry;
}

const HISTORY_CAP = 96;

function flightSeed() {
  return {
    altitudeM: INITIAL_ALT_M,
    envelopeK: INITIAL_ENVELOPE_K,
    fuelKg: FUEL_CAPACITY_KG,
    verticalMs: 0,
    throttle: 0.45,
    vent: 0,
    missionS: 0,
    paused: false,
    history: [] as Sample[],
  };
}

export function derive(
  altitudeM: number,
  envelopeK: number,
  fuelKg: number,
  verticalMs: number,
): DerivedTelemetry {
  const air = isa(altitudeM);
  const massKg = DRY_MASS_KG + PAYLOAD_KG + fuelKg;
  const rhoGas = air.pressurePa / (R_AIR * envelopeK);
  const netLiftN = (air.density - rhoGas) * VOLUME_M3 * G - massKg * G;
  const hoverMass = (air.density - rhoGas) * VOLUME_M3;
  return {
    ambientC: air.tempK - 273.15,
    envelopeC: envelopeK - 273.15,
    density: air.density,
    netLiftN,
    massKg,
    climbFpm: verticalMs * 196.85,
    altitudeFt: altitudeM / 0.3048,
    fuelFrac: fuelKg / FUEL_CAPACITY_KG,
    hoverMarginKg: hoverMass - massKg,
  };
}

export const useStratum = create<StratumStore>((set, get) => ({
  tab: "MATERIALS",
  setTab: (tab) => set({ tab }),
  done: {},
  toggleStep: (id) =>
    set((s) => {
      const done = { ...s.done, [id]: !s.done[id] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("stratum-protocol", JSON.stringify(done));
      }
      return { done };
    }),
  hydrateProtocol: (done) => set({ done }),
  ...flightSeed(),
  setThrottle: (throttle) => set({ throttle: Math.min(1, Math.max(0, throttle)) }),
  setVent: (vent) => set({ vent: Math.min(1, Math.max(0, vent)) }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  resetFlight: () => set(flightSeed()),
  derived: () => {
    const s = get();
    return derive(s.altitudeM, s.envelopeK, s.fuelKg, s.verticalMs);
  },
  step: (dt) => {
    const s = get();
    if (s.paused) return;
    const air = isa(s.altitudeM);
    let envelopeK = s.envelopeK;
    let fuelKg = s.fuelKg;
    const heating = s.fuelKg > 0 ? s.throttle * HEAT_RATE_K_S : 0;
    const cooling = COOL_RATE * (envelopeK - air.tempK);
    const venting = s.vent * VENT_COOL * Math.max(0, envelopeK - air.tempK);
    envelopeK += (heating - cooling - venting) * dt;
    envelopeK = Math.min(MAX_ENVELOPE_K, Math.max(MIN_ENVELOPE_K, envelopeK));
    if (s.fuelKg > 0 && s.throttle > 0.02) {
      fuelKg = Math.max(0, fuelKg - s.throttle * FUEL_FLOW_KG_S * dt);
    }
    const massKg = DRY_MASS_KG + PAYLOAD_KG + fuelKg;
    const rhoGas = air.pressurePa / (R_AIR * envelopeK);
    const buoyancy = (air.density - rhoGas) * VOLUME_M3 * G;
    const weight = massKg * G;
    const drag =
      0.5 * air.density * s.verticalMs * Math.abs(s.verticalMs) * CD * DRAG_AREA_M2;
    const accel = (buoyancy - weight - drag) / massKg;
    let verticalMs = s.verticalMs + accel * dt;
    let altitudeM = s.altitudeM + verticalMs * dt;
    if (altitudeM < 0) {
      altitudeM = 0;
      verticalMs = 0;
    }
    if (altitudeM > 11000) {
      altitudeM = 11000;
      verticalMs = Math.min(0, verticalMs);
    }
    const missionS = s.missionS + dt;
    let history = s.history;
    if (history.length === 0 || missionS - history.length * 0.5 >= 0.5) {
      history = [
        ...history,
        {
          altFt: altitudeM / 0.3048,
          vsFpm: verticalMs * 196.85,
          envC: envelopeK - 273.15,
        },
      ].slice(-HISTORY_CAP);
    }
    set({ envelopeK, fuelKg, verticalMs, altitudeM, missionS, history });
  },
}));

export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatFt(n: number): string {
  return `${Math.round(n).toLocaleString("en-US")} ft`;
}

export function formatClock(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
