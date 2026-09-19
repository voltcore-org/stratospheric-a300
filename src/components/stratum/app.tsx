import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Box,
  Check,
  Circle,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Wrench,
} from "lucide-react";
import {
  BOM_TOTAL_KG,
  BOM_TOTAL_USD,
  G,
  MATERIALS,
  NAV,
  PROTOCOL,
  PROTOCOL_HOURS,
  derive,
  formatClock,
  formatFt,
  formatUsd,
  useStratum,
  type ApplicationState,
} from "@/lib/stratum/engine";
import { cn } from "@/lib/utils";

const BalloonScene = lazy(() =>
  import("./balloon-scene").then((m) => ({ default: m.BalloonScene })),
);

const NAV_ICON: Record<ApplicationState, typeof Layers> = {
  MATERIALS: Layers,
  ASSEMBLY: Wrench,
  RENDER: Box,
  SIMULATION: Activity,
};

function useSimLoop() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const FIXED = 1 / 60;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      acc += dt;
      const step = useStratum.getState().step;
      while (acc >= FIXED) {
        step(FIXED);
        acc -= FIXED;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}

function useProtocolHydrate() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("stratum-protocol");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      if (parsed && typeof parsed === "object") {
        useStratum.getState().hydrateProtocol(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);
}

export function StratosphericApplication() {
  useSimLoop();
  useProtocolHydrate();
  const tab = useStratum((s) => s.tab);
  const setTab = useStratum((s) => s.setTab);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-muted uppercase">
              Voltcore · Class A-300
            </p>
            <h1 className="mt-1 py-0.5 text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              STRATUM
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Heavy thermal envelope operations — bill of materials, fabrication
              protocol, mesh inspect, live ascent telemetry.
            </p>
          </div>
          <LiveStats />
        </div>
        <nav
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
          aria-label="Console sections"
        >
          {NAV.map((node) => {
            const Icon = NAV_ICON[node.id];
            const active = tab === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setTab(node.id)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-out active:scale-[0.96]",
                  active
                    ? "bg-accent text-accent-fg shadow-[var(--shadow-border)]"
                    : "bg-elevated text-muted shadow-[var(--shadow-border)] hover:text-fg",
                )}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{node.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 px-3 py-3 sm:px-5 sm:py-4">
        <div className="h-full min-h-[28rem] overflow-auto rounded-lg bg-surface p-3 shadow-[var(--shadow-border)] sm:p-5">
          {tab === "MATERIALS" && <BomView />}
          {tab === "ASSEMBLY" && <ProtocolView />}
          {tab === "RENDER" && <MeshView />}
          {tab === "SIMULATION" && <TelemetryView />}
        </div>
      </main>
    </div>
  );
}

function LiveStats() {
  const altitudeM = useStratum((s) => s.altitudeM);
  const fuelKg = useStratum((s) => s.fuelKg);
  const verticalMs = useStratum((s) => s.verticalMs);
  const envelopeK = useStratum((s) => s.envelopeK);
  const d = derive(altitudeM, envelopeK, fuelKg, verticalMs);
  return (
    <div className="flex flex-wrap gap-2 font-mono text-xs">
      <StatChip label="MSL" value={formatFt(d.altitudeFt)} />
      <StatChip
        label="VS"
        value={`${d.climbFpm >= 0 ? "+" : ""}${Math.round(d.climbFpm)} fpm`}
        tone={d.climbFpm > 40 ? "ok" : d.climbFpm < -40 ? "warn" : "idle"}
      />
      <StatChip label="Fuel" value={`${Math.round(d.fuelFrac * 100)}%`} />
    </div>
  );
}

function StatChip({
  label,
  value,
  tone = "idle",
}: {
  label: string;
  value: string;
  tone?: "idle" | "ok" | "warn";
}) {
  return (
    <div className="min-h-11 rounded-sm bg-elevated px-3 py-2 shadow-[var(--shadow-border)]">
      <div className="text-[10px] tracking-[0.18em] text-subtle uppercase">{label}</div>
      <div
        className={cn(
          "mt-0.5 tabular-nums",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "idle" && "text-fg",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function BomView() {
  const groups = useMemo(() => {
    const map = new Map<string, typeof MATERIALS>();
    for (const row of MATERIALS) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, []);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Class A-300 Heavy Thermal Envelope BOM
          </h2>
          <p className="mt-1 text-sm text-muted">
            {MATERIALS.length} line items · {BOM_TOTAL_KG.toLocaleString("en-US")} kg
            allocated mass
          </p>
        </div>
        <p className="font-mono text-lg tabular-nums">{formatUsd(BOM_TOTAL_USD)}</p>
      </div>
      <div className="space-y-6">
        {groups.map(([group, rows]) => (
          <div key={group}>
            <h3 className="mb-2 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
              {group}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="pb-2 font-medium">Component</th>
                    <th className="pb-2 font-medium">Specification</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Mass</th>
                    <th className="pb-2 text-right font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/70">
                      <td className="py-2.5 pr-3 font-medium">{row.component}</td>
                      <td className="py-2.5 pr-3 text-muted">{row.spec}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs">{row.qty}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums">
                        {row.massKg} kg
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs tabular-nums">
                        {formatUsd(row.costUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProtocolView() {
  const done = useStratum((s) => s.done);
  const toggle = useStratum((s) => s.toggleStep);
  const complete = PROTOCOL.filter((p) => done[p.id]).length;
  const hoursLeft = PROTOCOL.filter((p) => !done[p.id]).reduce((s, p) => s + p.hours, 0);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Fabrication Protocol</h2>
          <p className="mt-1 text-sm text-muted">
            {complete}/{PROTOCOL.length} stations closed · {PROTOCOL_HOURS} h planned ·{" "}
            {hoursLeft} h remaining
          </p>
        </div>
      </div>
      <ol className="space-y-2">
        {PROTOCOL.map((step, i) => {
          const on = Boolean(done[step.id]);
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => toggle(step.id)}
                className={cn(
                  "flex w-full min-h-11 items-start gap-3 rounded-md bg-elevated px-3 py-3 text-left shadow-[var(--shadow-border)] transition-colors duration-150 ease-out active:scale-[0.99] sm:px-4",
                  on && "opacity-70",
                )}
              >
                <span className="mt-0.5 text-accent">
                  {on ? <Check size={18} /> : <Circle size={18} />}
                </span>
                <span className="flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      <span className="mr-2 font-mono text-xs text-subtle">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {step.title}
                    </span>
                    <span className="font-mono text-[11px] tracking-wide text-subtle uppercase">
                      {step.station} · {step.hours} h
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted">{step.detail}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function MeshView() {
  const [ready, setReady] = useState(false);
  const throttle = useStratum((s) => s.throttle);
  const setThrottle = useStratum((s) => s.setThrottle);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <section className="flex h-full min-h-[26rem] flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Envelope Mesh</h2>
          <p className="mt-1 text-sm text-muted">
            Lathe envelope, space-frame gondola, live burner. Drag to orbit.
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-3 font-mono text-xs text-muted">
          Burner
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={throttle}
            onChange={(e) => setThrottle(Number(e.target.value))}
            className="h-2 w-32 accent-accent"
            aria-label="Burner throttle"
          />
          <span className="w-10 tabular-nums text-fg">{Math.round(throttle * 100)}%</span>
        </label>
      </div>
      <div className="relative h-[min(68dvh,560px)] min-h-[22rem] overflow-hidden rounded-md bg-bg shadow-[var(--shadow-border)]">
        {!ready ? (
          <MeshFallback />
        ) : (
          <Suspense fallback={<MeshFallback />}>
            <BalloonScene />
          </Suspense>
        )}
      </div>
    </section>
  );
}

function MeshFallback() {
  return (
    <div className="flex h-full min-h-[22rem] items-center justify-center text-sm text-muted">
      Loading mesh…
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-16 text-xs text-muted">Collecting samples…</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 30 - ((v - min) / span) * 26;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="h-16 w-full text-fg" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

function TelemetryView() {
  const throttle = useStratum((s) => s.throttle);
  const vent = useStratum((s) => s.vent);
  const paused = useStratum((s) => s.paused);
  const missionS = useStratum((s) => s.missionS);
  const fuelKg = useStratum((s) => s.fuelKg);
  const history = useStratum((s) => s.history);
  const altitudeM = useStratum((s) => s.altitudeM);
  const envelopeK = useStratum((s) => s.envelopeK);
  const verticalMs = useStratum((s) => s.verticalMs);
  const setThrottle = useStratum((s) => s.setThrottle);
  const setVent = useStratum((s) => s.setVent);
  const togglePause = useStratum((s) => s.togglePause);
  const resetFlight = useStratum((s) => s.resetFlight);
  const d = derive(altitudeM, envelopeK, fuelKg, verticalMs);

  const cells = [
    { k: "Altitude", v: `${formatFt(d.altitudeFt)} MSL` },
    { k: "Envelope", v: `${d.envelopeC.toFixed(1)} °C` },
    { k: "Ambient", v: `${d.ambientC.toFixed(1)} °C` },
    { k: "Air density (ρa)", v: `${d.density.toFixed(3)} kg/m³` },
    { k: "Fuel mass", v: `${fuelKg.toFixed(0)} kg remaining` },
    { k: "Vertical speed", v: `${d.climbFpm >= 0 ? "+" : ""}${d.climbFpm.toFixed(0)} fpm` },
    { k: "Net lift", v: `${(d.netLiftN / G).toFixed(0)} kgf` },
    { k: "Hover margin", v: `${d.hoverMarginKg >= 0 ? "+" : ""}${d.hoverMarginKg.toFixed(0)} kg` },
  ];

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Telemetry Matrix</h2>
          <p className="mt-1 text-sm text-muted">
            ISA troposphere · hot-air buoyancy · mission {formatClock(missionS)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={togglePause}
            className="flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 font-medium text-sm shadow-[var(--shadow-border)] transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? "Resume" : "Hold"}
          </button>
          <button
            type="button"
            onClick={resetFlight}
            className="flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 font-medium text-sm shadow-[var(--shadow-border)] transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cells.map((c) => (
          <div key={c.k} className="rounded-md bg-elevated px-4 py-3 shadow-[var(--shadow-border)]">
            <div className="text-[11px] tracking-[0.16em] text-subtle uppercase">{c.k}</div>
            <div className="mt-1 font-mono text-sm tabular-nums">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-md bg-elevated p-4 shadow-[var(--shadow-border)]">
          <div className="mb-2 text-[11px] tracking-[0.16em] text-subtle uppercase">
            Altitude (ft)
          </div>
          <Sparkline values={history.map((h) => h.altFt)} />
        </div>
        <div className="rounded-md bg-elevated p-4 shadow-[var(--shadow-border)]">
          <div className="mb-2 text-[11px] tracking-[0.16em] text-subtle uppercase">
            Envelope (°C)
          </div>
          <Sparkline values={history.map((h) => h.envC)} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="rounded-md bg-elevated p-4 shadow-[var(--shadow-border)]">
          <div className="mb-3 flex justify-between font-mono text-xs">
            <span className="tracking-[0.16em] text-subtle uppercase">Burner throttle</span>
            <span className="tabular-nums">{Math.round(throttle * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={throttle}
            onChange={(e) => setThrottle(Number(e.target.value))}
            className="w-full accent-accent"
            aria-label="Burner throttle"
          />
        </label>
        <label className="rounded-md bg-elevated p-4 shadow-[var(--shadow-border)]">
          <div className="mb-3 flex justify-between font-mono text-xs">
            <span className="tracking-[0.16em] text-subtle uppercase">Crown vent</span>
            <span className="tabular-nums">{Math.round(vent * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={vent}
            onChange={(e) => setVent(Number(e.target.value))}
            className="w-full accent-accent"
            aria-label="Crown vent"
          />
        </label>
      </div>
    </section>
  );
}

