(() => {
  const run = () => {
// --------------------------
      // Data loading & helpers
      // --------------------------
      const loadSnapshot = () => {
        try {
          const raw = localStorage.getItem("novaSnapshot");
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (err) {
          console.warn("No snapshot available", err);
          return null;
        }
      };

      const sampleRooms = [
        { room: 201, patient: "Gwen Marra", nurse: "Evan", fall: "⚠️", novaNeedScore: 62, roundState: "soon", roundDrift: 1.05 },
        { room: 202, patient: "George Washburn", nurse: "Marsha", fall: "🛑", novaNeedScore: 78, roundState: "due", roundDrift: 1.22 },
        { room: 203, patient: "Thomas Jeffreys", nurse: "Pat", fall: "", novaNeedScore: 54, roundState: "ok", roundDrift: 0.5 },
        { room: 204, patient: "Antonio Mora", nurse: "Stacia", fall: "⚠️", novaNeedScore: 70, roundState: "critical", roundDrift: 1.6 },
        { room: 205, patient: "Randy Rockwell", nurse: "Evan", fall: "", novaNeedScore: 40, roundState: "ok", roundDrift: 0.2 },
      ];

      const computeNovaMetrics = (rooms) => {
        const active = rooms.filter((r) => r.patient);
        const statusCounts = { ok: 0, soon: 0, due: 0, critical: 0 };
        let totalNeed = 0;
        const nurseLoads = new Map();
        active.forEach((r) => {
          const state = r.roundState || "ok";
          statusCounts[state] = (statusCounts[state] || 0) + 1;
          totalNeed += r.novaNeedScore || 0;
          if (r.nurse) {
            const prev = nurseLoads.get(r.nurse) || { patients: 0, load: 0 };
            prev.patients += 1;
            prev.load += r.novaNeedScore || 0;
            nurseLoads.set(r.nurse, prev);
          }
        });
        const avgNeed = active.length ? totalNeed / active.length : 0;
        return { statusCounts, avgNeed, nurseLoads };
      };

      const buildActionQueue = (rooms) => {
        const scoreRow = (r) => {
          const need = r.novaNeedScore || 0;
          const drift = r.roundDrift || 0;
          const fallWeight = (r.fall || "").includes("🛑") ? 20 : (r.fall || "").includes("⚠️") ? 10 : 0;
          return need * 1.2 + drift * 50 + fallWeight;
        };
        const recommend = (r) => {
          if ((r.fall || "").includes("🛑")) return "High fall-risk safety round";
          if ((r.roundState || "") === "critical" || (r.roundDrift || 0) > 1.2) return "Immediate round";
          if ((r.roundState || "") === "due") return "Round now (overdue)";
          return "Check comfort & mobility";
        };
        return rooms
          .filter((r) => r.patient)
          .map((r) => ({
            ...r,
            priorityScore: scoreRow(r),
            recommended: recommend(r),
          }))
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .slice(0, 10);
      };

      const computeUnitTempo = (metrics) => {
        const { ok = 0, soon = 0, due = 0, critical = 0 } = metrics.statusCounts || {};
        const total = ok + soon + due + critical || 1;
        const driftRatio = (due * 1.2 + critical * 1.5 + soon * 0.9) / total;
        let label = "GOOD – mostly on time";
        let tone = "chip";
        if (driftRatio > 1.1) {
          label = "STRAINED – several overdue rounds";
          tone = "chip warn";
        }
        if (driftRatio > 1.3) {
          label = "OUT OF RHYTHM – many critical overdue rooms";
          tone = "chip danger";
        }
        return { label, tone, distribution: { ok, soon, due, critical }, driftRatio };
      };

      const computeStaffStrain = (metrics) => {
        const loads = metrics.nurseLoads || new Map();
        const entries = loads instanceof Map ? Array.from(loads.entries()) : Object.entries(loads);
        if (!entries.length) return { label: "No nurses assigned", detail: "", ratio: 1 };
        const totals = entries.reduce((acc, [, v]) => {
          acc.need += v.load || 0;
          acc.count += 1;
          if (!acc.avgPatients) acc.avgPatients = 0;
          acc.avgPatients += v.patients || 0;
          return acc;
        }, { need: 0, count: 0, avgPatients: 0 });
        const avgLoad = totals.count ? totals.need / totals.count : 1;
        let busiest = entries[0];
        entries.forEach((e) => { if (e[1].load > busiest[1].load) busiest = e; });
        const ratio = avgLoad ? busiest[1].load / avgLoad : 1;
        let label = "Staff strain: Balanced";
        if (ratio >= 1.4) label = "Staff strain: High";
        else if (ratio >= 1.15) label = "Staff strain: Moderate";
        const detail = `Heaviest load: ${busiest[0]} — ${busiest[1].patients || 0} pts, load ${Math.round(busiest[1].load || 0)}`;
        return { label, detail, ratio };
      };

      const renderActionQueue = (rows) => {
        const body = document.getElementById("queueBody");
        const summary = document.getElementById("queueSummary");
        if (!body) return;
        body.innerHTML = "";
        rows.forEach((r, idx) => {
          const tr = document.createElement("tr");
          const cells = [
            idx + 1,
            r.room || "—",
            r.patient || "—",
            Math.round(r.novaNeedScore || 0),
            `<span class="status ${r.roundState || "ok"}">${r.roundState || "ok"}</span>`,
            `${Math.round((r.roundDrift || 0) * 100)}%`,
            r.recommended || "—",
            r.nurse || "Unassigned",
          ];
          cells.forEach((c) => {
            const td = document.createElement("td");
            td.innerHTML = c;
            tr.appendChild(td);
          });
          body.appendChild(tr);
        });
        if (summary) {
          summary.textContent = rows.length
            ? "Top actions ranked by need, drift, and fall risk."
            : "No actionable rooms available.";
        }
      };

      const renderTempo = (tempo) => {
        const statusEl = document.getElementById("tempoStatus");
        const metaEl = document.getElementById("tempoMeta");
        const bar = document.getElementById("tempoBar");
        if (!statusEl || !bar) return;
        statusEl.innerHTML = `<span class="${tempo.tone}">${tempo.label}</span>`;
        const total = Object.values(tempo.distribution).reduce((a, b) => a + b, 0) || 1;
        bar.innerHTML = "";
        const seg = (cls, val) => {
          const d = document.createElement("div");
          d.className = cls;
          d.style.width = `${(val / total) * 100}%`;
          bar.appendChild(d);
        };
        seg("tempo-ok", tempo.distribution.ok || 0);
        seg("tempo-soon", tempo.distribution.soon || 0);
        seg("tempo-due", tempo.distribution.due || 0);
        seg("tempo-critical", tempo.distribution.critical || 0);
        if (metaEl) {
          metaEl.textContent = `Ok: ${tempo.distribution.ok || 0} · Soon: ${tempo.distribution.soon || 0} · Due: ${tempo.distribution.due || 0} · Critical: ${tempo.distribution.critical || 0}`;
        }
      };

      const renderStrain = (strain) => {
        const statusEl = document.getElementById("strainStatus");
        const metaEl = document.getElementById("strainMeta");
        if (statusEl) statusEl.textContent = strain.label;
        if (metaEl) metaEl.textContent = strain.detail || "";
      };

      const renderLedger = (metrics, rooms) => {
        const ledger = document.getElementById("ledgerSummary");
        const onTime = metrics.statusCounts.ok || 0;
        const total = Object.values(metrics.statusCounts).reduce((a, b) => a + b, 0) || 1;
        const pct = Math.round((onTime / total) * 100);
        const highRisk = rooms.filter((r) => (r.fall || "").includes("🛑") || r.status === "red").length;
        const highDrift = (metrics.statusCounts.due || 0) + (metrics.statusCounts.critical || 0);
        if (ledger) {
          ledger.innerHTML = `
            <div class="chip">On-time coverage: ${pct}%</div>
            <div class="chip warn">High-drift: ${highDrift}</div>
            <div class="chip danger">High-risk patients: ${highRisk}</div>
          `;
        }
      };

      const setSnapshotTime = () => {
        const timeEl = document.getElementById("snapshotTime");
        if (!timeEl) return;
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      };

      const runWhatIfSimulation = (metrics) => {
        const rnInput = document.getElementById("rnInput");
        const cnaInput = document.getElementById("cnaInput");
        const out = document.getElementById("whatifResult");
        if (!rnInput || !cnaInput || !out) return;
        const rn = Number(rnInput.value) || 0;
        const cna = Number(cnaInput.value) || 0;
        const totalNeed = metrics.avgNeed * (Object.values(metrics.statusCounts).reduce((a, b) => a + b, 0) || 0);
        const capacity = rn + cna * 0.7 || 1;
        const projected = totalNeed / capacity;
        let label = "Balanced";
        if (projected > 80) label = "High";
        else if (projected > 60) label = "Moderate";
        out.innerHTML = `
          <div style="margin-top:6px;">
            <div class="chip ${label === "High" ? "danger" : label === "Moderate" ? "warn" : ""}">Projected strain: ${label}</div>
            <div class="muted">With ${rn} RNs and ${cna} CNAs, projected load per staff: ${projected.toFixed(1)}</div>
          </div>
        `;
      };

      // --------------------------
      // Init
      // --------------------------
      const snapshot = loadSnapshot();
      const rooms = (snapshot && snapshot.rooms) || sampleRooms;
      const metrics = snapshot?.novaMetrics || computeNovaMetrics(rooms);

      renderActionQueue(buildActionQueue(rooms));
      renderTempo(computeUnitTempo(metrics));
      renderStrain(computeStaffStrain(metrics));
      renderLedger(metrics, rooms);
      runWhatIfSimulation(metrics);
      setSnapshotTime();

      document.getElementById("backBtn")?.addEventListener("click", () => {
        window.location.href = "/";
      });

      document.getElementById("rnInput")?.addEventListener("input", () => runWhatIfSimulation(metrics));
      document.getElementById("cnaInput")?.addEventListener("input", () => runWhatIfSimulation(metrics));
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
