"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

/* ─── Types ─── */
interface Room {
  room: number;
  patient: string;
  nurse: string;
  fall: string;
  novaNeedScore: number;
  roundState: "ok" | "soon" | "due" | "critical";
  roundDrift: number;
}

interface ActionRow extends Room {
  priorityScore: number;
  recommended: string;
}

interface StatusCounts {
  ok: number;
  soon: number;
  due: number;
  critical: number;
}

interface NovaMetrics {
  statusCounts: StatusCounts;
  avgNeed: number;
  nurseLoads: Map<string, { patients: number; load: number }>;
}

/* ─── Sample data ─── */
const sampleRooms: Room[] = [
  { room: 201, patient: "Gwen Marra", nurse: "Evan", fall: "⚠️", novaNeedScore: 62, roundState: "soon", roundDrift: 1.05 },
  { room: 202, patient: "George Washburn", nurse: "Marsha", fall: "🛑", novaNeedScore: 78, roundState: "due", roundDrift: 1.22 },
  { room: 203, patient: "Thomas Jeffreys", nurse: "Pat", fall: "", novaNeedScore: 54, roundState: "ok", roundDrift: 0.5 },
  { room: 204, patient: "Antonio Mora", nurse: "Stacia", fall: "⚠️", novaNeedScore: 70, roundState: "critical", roundDrift: 1.6 },
  { room: 205, patient: "Randy Rockwell", nurse: "Evan", fall: "", novaNeedScore: 40, roundState: "ok", roundDrift: 0.2 },
];

/* ─── Pure compute functions ─── */
function computeNovaMetrics(rooms: Room[]): NovaMetrics {
  const active = rooms.filter((r) => r.patient);
  const statusCounts: StatusCounts = { ok: 0, soon: 0, due: 0, critical: 0 };
  let totalNeed = 0;
  const nurseLoads = new Map<string, { patients: number; load: number }>();

  active.forEach((r) => {
    statusCounts[r.roundState] = (statusCounts[r.roundState] || 0) + 1;
    totalNeed += r.novaNeedScore || 0;
    if (r.nurse) {
      const prev = nurseLoads.get(r.nurse) || { patients: 0, load: 0 };
      prev.patients += 1;
      prev.load += r.novaNeedScore || 0;
      nurseLoads.set(r.nurse, prev);
    }
  });

  return { statusCounts, avgNeed: active.length ? totalNeed / active.length : 0, nurseLoads };
}

function buildActionQueue(rooms: Room[]): ActionRow[] {
  const scoreRow = (r: Room) => {
    const fallWeight = r.fall.includes("🛑") ? 20 : r.fall.includes("⚠️") ? 10 : 0;
    return r.novaNeedScore * 1.2 + r.roundDrift * 50 + fallWeight;
  };
  const recommend = (r: Room) => {
    if (r.fall.includes("🛑")) return "High fall-risk safety round";
    if (r.roundState === "critical" || r.roundDrift > 1.2) return "Immediate round";
    if (r.roundState === "due") return "Round now (overdue)";
    return "Check comfort & mobility";
  };
  return rooms
    .filter((r) => r.patient)
    .map((r) => ({ ...r, priorityScore: scoreRow(r), recommended: recommend(r) }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);
}

function computeUnitTempo(metrics: NovaMetrics) {
  const { ok = 0, soon = 0, due = 0, critical = 0 } = metrics.statusCounts;
  const total = ok + soon + due + critical || 1;
  const driftRatio = (due * 1.2 + critical * 1.5 + soon * 0.9) / total;
  let label = "Good — mostly on time";
  let tone: "green" | "yellow" | "red" = "green";
  if (driftRatio > 1.1) { label = "Strained — several overdue rounds"; tone = "yellow"; }
  if (driftRatio > 1.3) { label = "Out of Rhythm — many critical overdue"; tone = "red"; }
  return { label, tone, distribution: { ok, soon, due, critical }, total };
}

function computeStaffStrain(metrics: NovaMetrics) {
  const entries = Array.from(metrics.nurseLoads.entries());
  if (!entries.length) return { label: "No nurses assigned", detail: "", severity: "green" as const };
  let busiest = entries[0];
  let totalLoad = 0;
  entries.forEach((e) => { totalLoad += e[1].load; if (e[1].load > busiest[1].load) busiest = e; });
  const avgLoad = totalLoad / entries.length;
  const ratio = avgLoad ? busiest[1].load / avgLoad : 1;
  let label = "Balanced";
  let severity: "green" | "yellow" | "red" = "green";
  if (ratio >= 1.4) { label = "High"; severity = "red"; }
  else if (ratio >= 1.15) { label = "Moderate"; severity = "yellow"; }
  const detail = `Heaviest: ${busiest[0]} — ${busiest[1].patients} pts, load ${Math.round(busiest[1].load)}`;
  return { label, detail, severity };
}

/* ─── Style maps ─── */
const stateStyles: Record<string, React.CSSProperties> = {
  ok: { background: "#e8f7ee", color: "#0f7a3c", border: "1px solid #bfe9d2" },
  soon: { background: "#edf4ff", color: "#0b3f78", border: "1px solid #cfe0ff" },
  due: { background: "#fff2da", color: "#9a5b00", border: "1px solid #f2d19a" },
  critical: { background: "#ffe4e4", color: "#b32626", border: "1px solid #f5b4b4" },
};

const toneStyles: Record<string, React.CSSProperties> = {
  green: { background: "#e8f7ee", color: "#0f7a3c", border: "1px solid #bfe9d2" },
  yellow: { background: "#fff4e5", color: "#9a5b00", border: "1px solid #f4d3a1" },
  red: { background: "#ffe8e8", color: "#b32626", border: "1px solid #f3b6b6" },
};

/* ─── Reusable styles ─── */
const card: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 18,
  border: "1px solid #dbe5f0",
  padding: 20,
  boxShadow: "0 10px 24px rgba(16,35,66,0.08)",
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 14px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};

/* ─── Main page ─── */
export default function NovaCommandCenter() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [rnCount, setRnCount] = useState(3);
  const [cnaCount, setCnaCount] = useState(2);
  const [time, setTime] = useState("");

  useEffect(() => {
    let loaded: Room[] | null = null;
    try {
      const raw = localStorage.getItem("novaSnapshot");
      if (raw) {
        const snap = JSON.parse(raw);
        if (snap?.rooms) loaded = snap.rooms;
      }
    } catch { /* ignore */ }
    setRooms(loaded || sampleRooms);
    setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const metrics = useMemo(() => computeNovaMetrics(rooms), [rooms]);
  const queue = useMemo(() => buildActionQueue(rooms), [rooms]);
  const tempo = useMemo(() => computeUnitTempo(metrics), [metrics]);
  const strain = useMemo(() => computeStaffStrain(metrics), [metrics]);

  const ledger = useMemo(() => {
    const onTime = metrics.statusCounts.ok;
    const total = Object.values(metrics.statusCounts).reduce((a, b) => a + b, 0) || 1;
    const pct = Math.round((onTime / total) * 100);
    const highRisk = rooms.filter((r) => r.fall.includes("🛑")).length;
    const highDrift = (metrics.statusCounts.due || 0) + (metrics.statusCounts.critical || 0);
    return { pct, highRisk, highDrift };
  }, [metrics, rooms]);

  const whatIf = useMemo(() => {
    const totalNeed = metrics.avgNeed * Object.values(metrics.statusCounts).reduce((a, b) => a + b, 0);
    const capacity = rnCount + cnaCount * 0.7 || 1;
    const projected = totalNeed / capacity;
    let label = "Balanced";
    if (projected > 80) label = "High";
    else if (projected > 60) label = "Moderate";
    return { label, projected };
  }, [metrics, rnCount, cnaCount]);

  if (!rooms.length) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f4f8fc 0%, #eef4fb 50%, #e9f1f8 100%)",
        color: "#0f2742",
        padding: "24px",
        fontFamily: "Rubik, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: -120, right: -120, width: 500, height: 500, borderRadius: "50%", background: "rgba(27,111,217,0.12)", filter: "blur(100px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -120, left: -120, width: 500, height: 500, borderRadius: "50%", background: "rgba(26,166,163,0.12)", filter: "blur(100px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto" }}>

        {/* ─── Outer Shell ─── */}
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: 20,
            border: "1px solid #d2deeb",
            padding: 24,
            boxShadow: "0 24px 60px rgba(16,35,66,0.12)",
            backdropFilter: "blur(20px)",
          }}
        >

          {/* ─── Header ─── */}
          <header
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "20px 24px",
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(27,111,217,0.10) 0%, rgba(26,166,163,0.06) 100%)",
              border: "1px solid #d7e4f2",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(135deg, #1b6fd9, #1aa6a3, #7dd8d1)" }} />

            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0d3b73", letterSpacing: "-0.02em", fontFamily: "Space Grotesk, sans-serif" }}>
                NOVA{" "}
                <span style={{ background: "linear-gradient(135deg, #1b6fd9, #1aa6a3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Command Center
                </span>
              </h1>
              <div style={{ marginTop: 4, fontSize: 13, color: "#6f8296" }}>
                Unit-level orchestration: next actions, tempo, quality, and staffing simulations
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  ...pill,
                  background: "#e8f7ee",
                  color: "#0f7a3c",
                  border: "1px solid #bfe9d2",
                  fontSize: 11,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0f7a3c", animation: "pulse 2s ease-in-out infinite" }} />
                Live
              </span>
              <span style={{ fontSize: 12, color: "#6f8296" }}>Updated {time}</span>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  padding: "8px 18px",
                  borderRadius: 12,
                  border: "1px solid #cfe0f3",
                  background: "#fff",
                  color: "#0d3b73",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(16,35,66,0.08)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                Back to Whiteboard
              </Link>
            </div>
          </header>

          {/* ─── Main Grid ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: 16, marginTop: 20 }}>

            {/* Action Queue */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0d3b73" }}>Global Action Queue™</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6f8296" }}>Top actions ranked by need, drift, and fall risk</p>
                </div>
                <span style={{ ...pill, background: "#f1f5ff", color: "#0d3b73", border: "1px solid #dbe5f0", fontSize: 11, textTransform: "uppercase" }}>
                  Live queue
                </span>
              </div>

              <div style={{ overflow: "auto", maxHeight: 420, borderRadius: 14, border: "1px solid #dbe5f0", background: "#f9fbff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 850 }}>
                  <thead>
                    <tr>
                      {["#", "Room", "Patient", "Need", "State", "Drift", "Recommended Action", "Suggested Staff"].map((h) => (
                        <th
                          key={h}
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                            background: "#eaf2ff",
                            color: "#0d3b73",
                            padding: "10px 12px",
                            border: "1px solid #dbe5f0",
                            fontWeight: 700,
                            fontSize: 11,
                            textAlign: "left",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((r, i) => (
                      <tr
                        key={r.room}
                        style={{ transition: "background 0.15s" }}
                        onMouseEnter={(e) => { for (const td of e.currentTarget.children as any) td.style.background = "#eef4ff"; }}
                        onMouseLeave={(e) => { for (const td of e.currentTarget.children as any) td.style.background = i % 2 === 0 ? "#fff" : "#f9fbff"; }}
                      >
                        {[
                          <span key="idx" style={{ fontWeight: 700, color: "#6f8296" }}>{i + 1}</span>,
                          <span key="room" style={{ fontWeight: 700 }}>{r.room}</span>,
                          r.patient,
                          <span key="need" style={{ fontWeight: 600 }}>{Math.round(r.novaNeedScore)}</span>,
                          <span key="state" style={{ ...pill, ...stateStyles[r.roundState], fontSize: 10, padding: "3px 10px" }}>{r.roundState}</span>,
                          <span key="drift" style={{ fontFamily: "monospace" }}>{Math.round(r.roundDrift * 100)}%</span>,
                          r.recommended,
                          r.nurse || "Unassigned",
                        ].map((cell, ci) => (
                          <td
                            key={ci}
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #edf2f7",
                              verticalAlign: "middle",
                              color: "#1e3a5f",
                              background: i % 2 === 0 ? "#fff" : "#f9fbff",
                              fontSize: 12,
                              lineHeight: 1.4,
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right column: Tempo + Strain */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Tempo */}
              <section style={card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0d3b73" }}>Unit Tempo &amp; Staffing Strain</h3>
                  <span style={{ ...pill, background: "#f1f5ff", color: "#0d3b73", border: "1px solid #dbe5f0", fontSize: 11 }}>Snapshot</span>
                </div>

                {/* Tempo status */}
                <div style={{ ...pill, ...toneStyles[tempo.tone], marginBottom: 12, fontSize: 13, padding: "6px 16px" }}>
                  {tempo.tone === "green" && "✓ "}{tempo.tone === "yellow" && "⚡ "}{tempo.tone === "red" && "⚠ "}
                  {tempo.label}
                </div>

                {/* Tempo bar */}
                <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: "#e5e7eb" }}>
                  {[
                    { key: "ok", color: "#1f9a6a", val: tempo.distribution.ok },
                    { key: "soon", color: "#5aa2ff", val: tempo.distribution.soon },
                    { key: "due", color: "#f2a93b", val: tempo.distribution.due },
                    { key: "critical", color: "#e04b4b", val: tempo.distribution.critical },
                  ].map((s) => (
                    <div
                      key={s.key}
                      style={{
                        width: `${(s.val / tempo.total) * 100}%`,
                        background: s.color,
                        transition: "width 0.3s ease",
                      }}
                    />
                  ))}
                </div>

                <div style={{ marginTop: 6, fontSize: 12, color: "#6f8296" }}>
                  Ok: {tempo.distribution.ok} · Soon: {tempo.distribution.soon} · Due: {tempo.distribution.due} · Critical: {tempo.distribution.critical}
                </div>

                {/* Legend */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10, fontSize: 11, color: "#6f8296" }}>
                  {[
                    { label: "On-time", color: "#1f9a6a" },
                    { label: "Soon", color: "#5aa2ff" },
                    { label: "Due", color: "#f2a93b" },
                    { label: "Critical", color: "#e04b4b" },
                  ].map((l) => (
                    <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>

                {/* Divider */}
                <hr style={{ margin: "18px 0", border: "none", borderTop: "1px solid #dbe5f0" }} />

                {/* Strain */}
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0d3b73", marginBottom: 8 }}>Staffing Strain</div>
                <div style={{ ...pill, ...toneStyles[strain.severity], marginBottom: 8, fontSize: 13, padding: "6px 16px" }}>
                  {strain.label}
                </div>
                {strain.detail && <p style={{ margin: 0, fontSize: 12, color: "#6f8296" }}>{strain.detail}</p>}
              </section>
            </div>
          </div>

          {/* ─── Bottom: Ledger + What-if ─── */}
          <section style={{ ...card, marginTop: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0d3b73" }}>
                Care Quality Ledger™ + What-if Simulation
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6f8296" }}>
                Quick indicators tied to rounding reliability and fall risk
              </p>
            </div>

            {/* Ledger chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <span style={{ ...pill, background: "#f1f5ff", color: "#0d3b73", border: "1px solid #dbe5f0" }}>
                On-time coverage: {ledger.pct}%
              </span>
              <span style={{ ...pill, background: "#fff4e5", color: "#9a5b00", border: "1px solid #f4d3a1" }}>
                High-drift: {ledger.highDrift}
              </span>
              <span style={{ ...pill, background: "#ffe8e8", color: "#b32626", border: "1px solid #f3b6b6" }}>
                High-risk patients: {ledger.highRisk}
              </span>
            </div>

            {/* What-if inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#0d3b73" }}>
                RN count
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={rnCount}
                  onChange={(e) => setRnCount(Number(e.target.value) || 0)}
                  style={{
                    borderRadius: 12,
                    border: "1px solid #dbe5f0",
                    background: "#f8fbff",
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "#0f2742",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#0d3b73" }}>
                CNA count
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cnaCount}
                  onChange={(e) => setCnaCount(Number(e.target.value) || 0)}
                  style={{
                    borderRadius: 12,
                    border: "1px solid #dbe5f0",
                    background: "#f8fbff",
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "#0f2742",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </label>
            </div>

            {/* Result */}
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  ...pill,
                  ...(whatIf.label === "High"
                    ? toneStyles.red
                    : whatIf.label === "Moderate"
                    ? toneStyles.yellow
                    : toneStyles.green),
                  fontSize: 13,
                  padding: "6px 16px",
                }}
              >
                Projected strain: {whatIf.label}
              </span>
              <span style={{ fontSize: 12, color: "#6f8296" }}>
                With {rnCount} RNs and {cnaCount} CNAs — projected load per staff: {whatIf.projected.toFixed(1)}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
