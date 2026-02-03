(() => {
  const run = () => {
// ==================== Utility Functions ====================
        // XSS Protection: Sanitize HTML content
        const sanitizeHTML = (str) => {
          if (typeof str !== 'string') return '';
          const div = document.createElement('div');
          div.textContent = str;
          return div.innerHTML;
        };

        // Safe innerHTML setter with XSS protection
        const setSafeHTML = (element, html) => {
          if (!element) return;
          if (typeof html === 'string' && html.includes('<')) {
            // Only allow safe HTML tags for user-generated content
            const temp = document.createElement('div');
            temp.textContent = html;
            element.textContent = html;
          } else {
            element.innerHTML = html;
          }
        };

        // Debounce function for performance optimization
        const debounce = (func, wait) => {
          let timeout;
          return function executedFunction(...args) {
            const later = () => {
              clearTimeout(timeout);
              func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
          };
        };

        // Enhanced error handler with user feedback
        const handleError = (error, userMessage, context = '') => {
          const errorDetails = error instanceof Error ? error.message : String(error);
          console.error(`[${context}] ${errorDetails}`, error);
          // openFeedback will be available after it's defined
          if (typeof openFeedback === 'function') {
            openFeedback('Error', userMessage || 'An unexpected error occurred. Please try again.');
          }
        };

        // Check localStorage availability
        const isLocalStorageAvailable = () => {
          try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
          } catch {
            return false;
          }
        };

        // ==================== Main Application ====================
        const STORAGE_KEY = "novaBoardState";
        const bedBody = document.getElementById("bedBody");
        const apptBody = document.getElementById("apptBody");
        const showerBody = document.getElementById("showerBody");
        const filtersEl = document.getElementById("filters");
        const openEditorBtn = document.getElementById("openEditor");
        const openCommandBtn = document.getElementById("openCommandCenter");
        const openStatsBtn = document.getElementById("openStats");
        const togglePrivacyBtn = document.getElementById("togglePrivacy");
        const dischargeBtn = document.getElementById("markDischarge");
        const completeRoundBtn = document.getElementById("completeRound");
        const resetBoardBtn = document.getElementById("resetBoardBtn");
        const quietSafetyBtn = document.getElementById("showQuietSafety");
        const playbookBtn = document.getElementById("openPlaybooks");
        const priorityQueueBtn = document.getElementById("openPriorityQueue");
        const handoffBtn = document.getElementById("generateHandoff");
        const assignmentInfoBtn = document.getElementById("showAssignmentInfo");
        const novaOverviewBtn = document.getElementById("showNovaOverview");
        const onTimeBtn = document.getElementById("showOnTime");
        const fallsBtn = document.getElementById("showFalls");
        const showerModalBtn = document.getElementById("showShowerModal");
        const moreActionsBtn = document.getElementById("moreActions");
        const moreMenu = document.getElementById("moreMenu");
        const tableSummary = document.getElementById("tableSummary");
        const staffFairnessBody = document.getElementById("staffFairnessBody");
        const toiletPriorityBody = document.getElementById("toiletPriorityBody");
        const toiletPriorityCount = document.getElementById("toiletPriorityCount");
        const showerDueRooms = new Set();
        const carefusionData = {
          staff: [],
          patients: [],
          assignments: [],
          shiftInputs: {
            day: { rn: "", tech: "", support: "" },
            night: { rn: "", tech: "", support: "" },
          },
          currentShift: "day",
        };
        const novaState = { tasks: [], updatedAt: 0 };
        const listIdByField = {
          iso: "isoList",
          n: "nList",
          r: "riskList",
          t: "tList",
          assist: "assistList",
          sp: "spList",
          fall: "fallList",
        };
        const lensFieldMap = {
          falls: "novaFallScore",
          mobility: "novaMobilityScore",
          toileting: "novaToiletScore",
          comfort: "novaComfortScore",
        };
        const emojiOnlyFields = new Set(["iso", "r", "assist", "diet", "sp", "fall", "t", "n"]);
        const formatEmojiOnly = (field, value) => {
          if (!emojiOnlyFields.has(field)) return value || "";
          const trimmed = (value || "").trim();
          if (!trimmed) return "";
          return trimmed.split(/\s+/)[0];
        };

        const palette = [
          "green",
          "purple",
          "orange",
          "blue",
          "teal",
          "gray",
          "pink",
          "navy",
          "amber",
          "lime",
          "coral",
          "cyan",
        ];
        const nurseColors = new Map();
        const applyRowDefaults = (row = {}) => ({
          roundReliabilityStreak: row.roundReliabilityStreak || 0,
          roundTotalCount: row.roundTotalCount || 0,
          roundOnTimeCount: row.roundOnTimeCount || 0,
          roomReliability: row.roomReliability || 0,
          novaNeedHistory: Array.isArray(row.novaNeedHistory) ? row.novaNeedHistory : [],
          novaPriorityScore: row.novaPriorityScore || 0,
          novaSuggestedStaff: row.novaSuggestedStaff || "",
          novaFallScore: row.novaFallScore || 0,
          novaToiletScore: row.novaToiletScore || 0,
          novaMobilityScore: row.novaMobilityScore || 0,
          novaComfortScore: row.novaComfortScore || 0,
          novaTrajectory: row.novaTrajectory || "stable",
          justAdmittedAt: row.justAdmittedAt || 0,
          ...row,
        });

        const initialRows = [
          {
            status: "green",
            room: 201,
            nurse: "Evan",
            cna: "Marsha",
            roundedAgo: 18,
            lastRoundedAt: Date.now() - 18 * 60000,
          roundInterval: 60,
          roundingHistory: [Date.now() - 18 * 60000],
          patient: "Gwen Marra",
          physician: "Arnold, P",
            sp: "⭐ VIP / family liaison",
            iso: "🟩 None",
            n: "💊 Pain control",
            r: "🛑 High fall risk",
            t: "🚶 Assist to walk",
            assist: "🤝 Standby assist",
            fall: "🛑",
            diet: "❤️ Cardiac",
          },
          {
            status: "green",
            room: 202,
            nurse: "Marsha",
            cna: "Evan",
            roundedAgo: 32,
            lastRoundedAt: Date.now() - 32 * 60000,
            roundInterval: 60,
            roundingHistory: [Date.now() - 32 * 60000],
            patient: "George Washburn",
            physician: "Arnold, P",
            sp: "🧊 Ice pack / cooling",
            iso: "🟦 Contact",
            n: "💧 IV fluids",
            r: "⚠️ Moderate fall risk",
            t: "🪜 Walker assist",
            assist: "🪜 Walker",
            fall: "⚠️",
            diet: "🍽️ Regular",
          },
          {
            status: "yellow",
            room: 203,
            nurse: "Pat",
            cna: "Evan",
            roundedAgo: 74,
            lastRoundedAt: Date.now() - 74 * 60000,
            roundInterval: 60,
            roundingHistory: [Date.now() - 74 * 60000],
            patient: "Thomas Jeffreys",
            physician: "Carr, W",
            sp: "🧩 Psych support",
            iso: "🟥 Droplet",
            n: "🧘 Anxiety support",
            r: "🛑 High fall risk",
            t: "🏗️ Lift only / bed rest",
            assist: "🏗️ Lift required",
            fall: "🛑",
            diet: "🍲 Soft",
          },
          {
            status: "blue",
            room: 204,
            nurse: "Stacia",
            cna: "Pat",
            roundedAgo: 58,
            lastRoundedAt: Date.now() - 58 * 60000,
            roundInterval: 60,
            roundingHistory: [Date.now() - 58 * 60000],
            patient: "Antonio Mora",
            physician: "Smith, R",
            sp: "🎀 Gift at bedside",
            iso: "🟪 Airborne",
            n: "🥤 Hydration focus",
            r: "⚠️ Moderate fall risk",
            t: "♿ Wheelchair",
            assist: "♿ Wheelchair transport",
            fall: "⚠️",
            diet: "🧊 Clear liquids",
          },
          {
            status: "green",
            room: 205,
            nurse: "Evan",
            cna: "Randy Rockwell",
            roundedAgo: 24,
            lastRoundedAt: Date.now() - 24 * 60000,
            roundInterval: 60,
            roundingHistory: [Date.now() - 24 * 60000],
            patient: "Randy Rockwell",
            physician: "Carr, W",
            sp: "🤝 Sitter / 1:1",
            iso: "🟫 Enhanced",
            n: "🛏️ Reposition q2",
            r: "⭐ Low fall risk",
            t: "🚶 Assist to walk",
            assist: "🤝 Standby assist",
            fall: "⭐",
            diet: "🍽️ Regular",
          },
          {
            status: "yellow",
            room: 206,
            nurse: "Jennifer",
            cna: "Andrew",
            roundedAgo: 66,
            lastRoundedAt: Date.now() - 66 * 60000,
            roundInterval: 60,
            roundingHistory: [Date.now() - 66 * 60000],
            patient: "Donald Naimoli",
            physician: "Patel, K",
            sp: "🧘 Anxiety watch",
            iso: "🟩 None",
            n: "💊 Pain control",
            r: "⚠️ Moderate fall risk",
            t: "🚶 Assist to walk",
            assist: "🤝 Standby assist",
            fall: "⚠️",
            diet: "❤️ Cardiac",
          },
          {
            status: "green",
            room: 207,
            nurse: "Lizbet",
            cna: "Mark",
            roundedAgo: 42,
            lastRoundedAt: Date.now() - 42 * 60000,
            roundInterval: 60,
            roundingHistory: [Date.now() - 42 * 60000],
            patient: "Julene Dekkers",
            physician: "Smith, R",
            sp: "📞 Interpreter needed",
            iso: "🅲 C Diff",
            n: "🩹 Wound care",
            r: "⚠️ Moderate fall risk",
            t: "🧘 Rehab / OT",
            assist: "🤝 Standby assist",
            fall: "⭐",
            diet: "🥣 Pureed",
          },
          {
            status: "red",
            room: 208,
            nurse: "Laura",
            cna: "Erin",
            roundedAgo: 92,
            lastRoundedAt: Date.now() - 92 * 60000,
            roundInterval: 60,
            roundingHistory: [Date.now() - 92 * 60000],
            patient: "John Olthoff",
            physician: "Carr, W",
            sp: "🛡️ Elopement precautions",
            iso: "🟫 Enhanced",
            n: "🧘 Anxiety support",
            r: "🛑 High fall risk",
            t: "🏗️ Lift only / bed rest",
            assist: "🏗️ Lift required",
            fall: "🛑",
            diet: "🚫 NPO",
          },
          {
            status: "red",
            room: 209,
            nurse: "Jenny",
            cna: "Andrew",
            roundedAgo: 78,
            lastRoundedAt: Date.now() - 78 * 60000,
            roundInterval: 60,
          roundingHistory: [Date.now() - 78 * 60000],
          patient: "Karen Schuiteman",
          physician: "Patel, K",
            sp: "🧘 Anxiety watch",
            iso: "🟦 Contact",
            n: "🥤 Hydration focus",
            r: "⚠️ Moderate fall risk",
            t: "♿ Wheelchair",
            assist: "♿ Wheelchair transport",
            fall: "⚠️",
            diet: "🧊 Clear liquids",
          },
        ];

        const rooms = [];
        const hydrateRoomsDefault = () => {
          rooms.splice(
            0,
            rooms.length,
            ...initialRows.map(applyRowDefaults),
            ...Array.from({ length: 14 }, (_, i) =>
              applyRowDefaults({
                status: "",
                room: 210 + i,
                nurse: "",
                cna: "",
                time: "",
                roundedAgo: 0,
                roundInterval: 60,
                roundingHistory: [],
                patient: "",
                physician: "",
                sp: "",
                iso: "",
                n: "",
                r: "",
                t: "",
                assist: "",
                fall: "",
                diet: "",
                lastRoundedAt: Date.now(),
              })
            )
          );
        };
        hydrateRoomsDefault();

        const ensureStateIntegrity = () => {
          if (!rooms.length || !rooms.some((r) => r && r.room)) {
            hydrateRoomsDefault();
          }
          if (!selectedRoom || !rooms.find((r) => r.room === selectedRoom)) {
            const firstValid = rooms.find((r) => r && r.room);
            selectedRoom = firstValid ? firstValid.room : null;
          }
        };
        let selectionTimer = null;
        let privacyMasked = true;
        const filterState = { round: "all", iso: false, fall: false };
        let modeLens = "all";
        const currentUser = "NOVA User";

        const appointments = Array.from({ length: 6 }, () => ({
          room: "",
          time: "",
          pickup: "",
        }));
        const showers = Array.from({ length: 6 }, () => ({
          room: "",
          last: "",
          next: "",
        }));
        const codeTeam = [
          { role: "Supervisor", assigned: "" },
          { role: "Meds", assigned: "" },
          { role: "Records", assigned: "" },
          { role: "CPR", assigned: "" },
          { role: "Respiratory", assigned: "" },
          { role: "Doctor", assigned: "" },
        ];

        restoreState();
        const firstValidRoom = rooms.find((r) => r && r.room);
        let selectedRoom = firstValidRoom ? firstValidRoom.room : rooms[0]?.room || null;
        if (!rooms.length) {
          hydrateRoomsDefault();
          selectedRoom = rooms[0]?.room || null;
        }

        const persistState = () => {
          if (!isLocalStorageAvailable()) {
            handleError(new Error('LocalStorage unavailable'), 'Unable to save board state. Your browser may be in private mode or storage is disabled.', 'persistState');
            return;
          }
          try {
            const payload = {
              rooms,
              appointments,
              showers,
              codeTeam,
              shiftInputs: carefusionData.shiftInputs,
              currentShift: carefusionData.currentShift,
              novaState,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
          } catch (err) {
            handleError(err, 'Unable to save board state. Data may be too large or storage quota exceeded.', 'persistState');
          }
        };

        const computeSnapshotMetrics = () => {
          const active = rooms.filter((r) => r.patient);
          const statusCounts = { ok: 0, soon: 0, due: 0, critical: 0 };
          let totalNeed = 0;
          const nurseLoads = new Map();
          active.forEach((r) => {
            statusCounts[r.roundState || "ok"] = (statusCounts[r.roundState || "ok"] || 0) + 1;
            totalNeed += r.novaNeedScore || 0;
            if (r.nurse) {
              const prev = nurseLoads.get(r.nurse) || { patients: 0, load: 0 };
              prev.patients += 1;
              prev.load += r.novaNeedScore || 0;
              nurseLoads.set(r.nurse, prev);
            }
          });
          const avgNeed = active.length ? totalNeed / active.length : 0;
          const nurseLoadsObj = {};
          nurseLoads.forEach((v, k) => {
            nurseLoadsObj[k] = v;
          });
          return { avgNeed, statusCounts, nurseLoads: nurseLoadsObj };
        };

        const persistSnapshot = () => {
          if (!isLocalStorageAvailable()) {
            return; // Silently fail for snapshots as they're not critical
          }
          try {
            const snapshot = {
              rooms,
              novaMetrics: computeSnapshotMetrics(),
              timestamp: Date.now(),
            };
            localStorage.setItem("novaSnapshot", JSON.stringify(snapshot));
          } catch (err) {
            // Snapshot failures are non-critical, log but don't show user
            console.warn("Unable to save snapshot", err);
          }
        };

        function restoreState() {
          if (!isLocalStorageAvailable()) {
            return; // No saved state available
          }
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (Array.isArray(data.rooms)) {
              rooms.splice(0, rooms.length, ...data.rooms.map((r) => applyRowDefaults({
                ...r,
                lastRoundedAt: r.lastRoundedAt ? Number(r.lastRoundedAt) : 0,
                roundingHistory: Array.isArray(r.roundingHistory)
                  ? r.roundingHistory
                      .map((ts) => {
                        const tsNum = Number(ts.ts ?? ts);
                        return Number.isNaN(tsNum) ? null : { ts: tsNum, user: ts.user || r.nurse || "", shift: ts.shift || data.currentShift || "day" };
                      })
                      .filter(Boolean)
                  : [],
              })));
            }
            if (Array.isArray(data.appointments)) {
              appointments.splice(0, appointments.length, ...data.appointments);
            }
            if (Array.isArray(data.showers)) {
              showers.splice(0, showers.length, ...data.showers);
            }
            if (Array.isArray(data.codeTeam)) {
              codeTeam.splice(0, codeTeam.length, ...data.codeTeam);
            }
            if (data.shiftInputs) {
              carefusionData.shiftInputs = data.shiftInputs;
            }
            if (data.currentShift) {
              carefusionData.currentShift = data.currentShift;
            }
            if (data.novaState && Array.isArray(data.novaState.tasks)) {
              novaState.tasks = data.novaState.tasks;
              novaState.updatedAt = data.novaState.updatedAt || 0;
            }
          } catch (err) {
            handleError(err, 'Unable to restore saved board state. Starting with default data.', 'restoreState');
          }
          const hasValidRooms = rooms.some((r) => r && r.room);
          if (!rooms.length || !hasValidRooms) {
            hydrateRoomsDefault();
          }
        }

        const hardResetState = () => {
          if (isLocalStorageAvailable()) {
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem("novaSnapshot");
          } catch (err) {
              handleError(err, 'Unable to clear saved state completely.', 'hardResetState');
            }
          }
          hydrateRoomsDefault();
          selectedRoom = rooms[0]?.room || null;
          novaState.tasks = [];
          novaState.updatedAt = 0;
          renderTable();
          if (typeof openFeedback === 'function') {
            openFeedback('Board Reset', 'The board has been reset to default state.');
          }
        };

        // Stats modal helpers
        const statsBackdrop = document.createElement("div");
        statsBackdrop.className = "modal-backdrop";
        statsBackdrop.innerHTML = `
          <div class="modal modal-lg" role="dialog" aria-modal="true">
            <h3>Unit Statistics</h3>
            <div id="statsBody" class="modal-body scroll"></div>
            <div class="actions">
              <button type="button" class="action-btn secondary" id="closeStats">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(statsBackdrop);
        const closeStatsBtn = statsBackdrop.querySelector("#closeStats");

        const buildStatsTable = (rows) => {
          return `
            <table class="cf-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Patient</th>
                  <th>Nurse</th>
                  <th>CNA</th>
                  <th>State</th>
                  <th>Drift</th>
                  <th>Fall</th>
                  <th>Assist</th>
                  <th>NOVA Need</th>
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map((r) => {
                    return `<tr>
                      <td>${r.room || "—"}</td>
                      <td>${r.patient || "—"}</td>
                      <td>${r.nurse || "—"}</td>
                      <td>${r.cna || "—"}</td>
                      <td>${r.roundState || "ok"}</td>
                      <td>${Math.round((r.roundDrift || 0) * 100)}%</td>
                      <td>${r.fall || "—"}</td>
                      <td>${r.assist || "—"}</td>
                      <td>${r.novaNeedScore != null ? Math.round(r.novaNeedScore) : "—"}</td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          `;
        };

        const renderStats = () => {
          const target = document.getElementById("statsBody");
          if (!target) return;
          NOVA_ENGINE.updateAll(rooms);
          const metrics = NOVA_ENGINE.computeUnitMetrics(rooms);
          const totalRooms = rooms.length;
          const activeRooms = rooms.filter((r) => r.patient);
          const highFall = rooms.filter((r) => (r.fall || "").includes("🛑")).length;
          const statusCounts = metrics.statusCounts;
          const nurseSummary = (() => {
            const map = new Map();
            activeRooms.forEach((r) => {
              if (!r.nurse) return;
              const prev = map.get(r.nurse) || { pts: 0, need: 0 };
              prev.pts += 1;
              prev.need += r.novaNeedScore || 0;
              map.set(r.nurse, prev);
            });
            return Array.from(map.entries())
              .map(([name, v]) => `<div class="chip" style="margin:2px 4px 0 0;">${name}: ${v.pts} pts · need ${Math.round(v.need)}</div>`)
              .join("") || "<div class='muted'>No nurse assignments</div>";
          })();

          const strainLabel = (metrics.staffingStrain || 1) >= 1.4 ? "High" : (metrics.staffingStrain || 1) >= 1.15 ? "Moderate" : "Balanced";
          const busiest = metrics.busiest;
          const onTimePct = activeRooms.length ? Math.round(((statusCounts.ok || 0) / activeRooms.length) * 100) : 0;

          target.innerHTML = `
            <div style="margin-bottom:10px; line-height:1.6;">
              <strong>Total rooms:</strong> ${totalRooms} · <strong>Active patients:</strong> ${activeRooms.length}<br/>
              <strong>Rounding status:</strong> OK ${statusCounts.ok || 0} · Soon ${statusCounts.soon || 0} · Due ${statusCounts.due || 0} · Critical ${statusCounts.critical || 0}<br/>
              <strong>Avg NOVA need:</strong> ${metrics.avgNeed.toFixed(1)} · <strong>High fall-risk:</strong> ${highFall}
            </div>
            <div style="margin-bottom:10px; padding:8px; background:#f5f8ff; border:1px solid #dbe4f3; border-radius:8px; line-height:1.6;">
              <div><strong>Unit pressure (need):</strong> ${metrics.avgNeed.toFixed(1)} / 100</div>
              <div><strong>Patient stability (avg):</strong> ${(metrics.avgStability || 0).toFixed(1)} / 100</div>
              <div><strong>Staffing strain:</strong> ${strainLabel} (ratio ${(metrics.staffingStrain || 1).toFixed(2)})</div>
              ${busiest ? `<div><strong>Heaviest load:</strong> ${busiest.name} — ${busiest.patients} pts · load ${Math.round(busiest.load)}</div>` : ""}
              <div><strong>On-time rounds:</strong> ${onTimePct}% · <strong>High-drift rooms:</strong> ${(statusCounts.critical || 0) + (statusCounts.due || 0)} · <strong>Silent saves:</strong> ${metrics.silentSaves || 0}</div>
            </div>
            <div style="margin-bottom:8px;">
              <div class="muted" style="margin-bottom:4px;">Nurse load summary:</div>
              ${nurseSummary}
            </div>
            <div class="muted" style="margin:6px 0;">Rooms overview:</div>
            <div style="overflow:auto; max-height:50vh;">${buildStatsTable(rooms)}</div>
          `;
        };

        const renderToiletingPriority = () => {
          if (!toiletPriorityBody) return;
          NOVA_ENGINE.updateAll(rooms);
          const candidates = rooms
            .filter((r) => r.patient)
            .map((r) => {
              const toiletingScore = Number(r.novaToiletScore) || 0;
              const driftScore = (Number(r.roundDrift) || 0) * 25;
              const score = toiletingScore + driftScore;
              return {
                room: r.room,
                need: toiletingScore,
                assist: formatEmojiOnly("assist", r.assist),
                score,
              };
            })
            .filter((c) => c.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);

          toiletPriorityBody.innerHTML = "";
          const fragment = document.createDocumentFragment();
          candidates.forEach((c) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${c.room || "—"}</td>
              <td style="text-align:center; font-size:14px;">🚻</td>
              <td style="text-align:center; font-size:14px;">${c.assist || "—"}</td>
            `;
            fragment.appendChild(tr);
          });
          toiletPriorityBody.appendChild(fragment);
          if (toiletPriorityCount) {
            toiletPriorityCount.textContent = candidates.length ? `(${candidates.length})` : "";
          }
        };

        const formatDateInput = (str = "") => {
          if (!str) return "";
          const ts = Date.parse(str);
          if (Number.isNaN(ts)) return "";
          return new Date(ts).toISOString().slice(0, 10);
        };

        const MIN_SHOWER_MS = 3 * 86400000; // twice-weekly minimum cadence
        const normalizeShower = (s) => {
          const lastTs = Date.parse(s.last || "");
          const nextTsRaw = Date.parse(s.next || "");
          let nextTs = Number.isNaN(nextTsRaw) ? null : nextTsRaw;
          if (!Number.isNaN(lastTs) && (nextTs === null || nextTs < lastTs + MIN_SHOWER_MS)) {
            nextTs = lastTs + MIN_SHOWER_MS;
          }
          const formattedNext = nextTs ? new Date(nextTs).toISOString().slice(0, 10) : "";
          return {
            ...s,
            last: formatDateInput(s.last),
            next: formattedNext,
            _nextTs: nextTs,
          };
        };

        const computeShowerAlerts = () => {
          const now = Date.now();
          const msPerDay = 86400000;
          let overdue = 0;
          let updated = false;
          const normalized = showers.map((s, idx) => {
            const norm = normalizeShower(s);
            const lastTs = Date.parse(norm.last || "") || null;
            const nextTs = norm._nextTs || Date.parse(norm.next || "") || null;
            const daysSinceLast = lastTs ? (now - lastTs) / msPerDay : null;
            const due = nextTs ? nextTs <= now : daysSinceLast !== null && daysSinceLast > 3.5;
            const soon = !due && nextTs && nextTs - now < msPerDay;
            if (due) overdue += 1;
            // persist computed next if it was inferred
            if (norm._nextTs && (!showers[idx].next || showers[idx].next !== norm.next)) {
              showers[idx].next = norm.next;
              updated = true;
            }
            return { ...norm, due, soon, daysSinceLast };
          });
          if (updated) persistState();
          return { overdue, normalized };
        };

        const renderShowers = () => {
          if (!showerBody) return;
          const { normalized, overdue } = computeShowerAlerts();
          showerDueRooms.clear();
          normalized.forEach((s) => {
            if (s.due && s.room) showerDueRooms.add(Number(s.room));
          });
          showerBody.innerHTML = "";
          const fragment = document.createDocumentFragment();
          normalized.forEach((s, idx) => {
            const tr = document.createElement("tr");
            if (s.due) tr.classList.add("row-critical");
            const soon = s.soon;
            if (soon) tr.classList.add("row-shower-due");
            const statusClass = s.due ? "due" : soon ? "soon" : "";
            const statusText = s.due ? "Due now" : soon ? "Due within 24h" : "On cadence";
            tr.innerHTML = `
              <td><input class="cell-input" data-field="room" data-idx="${idx}" value="${s.room || ""}"></td>
              <td><input class="cell-input" type="date" data-field="last" data-idx="${idx}" value="${formatDateInput(s.last)}"></td>
              <td><input class="cell-input" type="date" data-field="next" data-idx="${idx}" value="${formatDateInput(s.next)}"></td>
              <td style="font-size:12px;"><span class="shower-status ${statusClass}">${statusText}</span></td>
            `;
            fragment.appendChild(tr);
          });
          showerBody.appendChild(fragment);
          if (showerCount) showerCount.textContent = `(${showers.length}${overdue ? " • ⚠️" : ""})`;
        };

        const formatDateFriendly = (dateVal = "") => {
          const ts =
            typeof dateVal === "number"
              ? Number.isFinite(dateVal)
                ? dateVal
                : NaN
              : Date.parse(dateVal);
          if (Number.isNaN(ts)) return "—";
          const d = new Date(ts);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        };

        const getPatientNameForRoom = (roomNum) => {
          const match = rooms.find((r) => Number(r.room) === Number(roomNum));
          if (!match) return "";
          if (privacyMasked && match.patient) return "Protected";
          return match.patient || "";
        };

        const buildShowerSchedule = (days = 14) => {
          const horizonMs = days * 86400000;
          const now = Date.now();
          const { normalized } = computeShowerAlerts();
          return normalized
            .filter((s) => s.room)
            .map((s) => {
              const start =
                Date.parse(s.next || "") ||
                (Date.parse(s.last || "")
                  ? Date.parse(s.last) + MIN_SHOWER_MS
                  : null);
              const schedule = [];
              if (start) {
                let ts = start;
                const cutoff = now + horizonMs;
                while (ts <= cutoff) {
                  schedule.push(ts);
                  ts += MIN_SHOWER_MS;
                }
              }
              return {
                ...s,
                patient: getPatientNameForRoom(s.room),
                schedule,
              };
            });
        };

        const renderShowerAlertBar = () => {
          const bar = document.getElementById("showerAlertBanner");
          if (!bar) return;
          const { normalized, overdue } = computeShowerAlerts();
          const withRoom = normalized
            .map((s) => {
              const lastTs = Date.parse(s.last || "") || null;
              const nextTs = Date.parse(s.next || "") || (lastTs ? lastTs + MIN_SHOWER_MS : null);
              return { ...s, nextTs };
            })
            .filter((s) => s.room && s.nextTs)
            .sort((a, b) => (a.nextTs || Infinity) - (b.nextTs || Infinity));
          const next = withRoom[0];
          const dueSoon = withRoom.filter((s) => s.nextTs && s.nextTs - Date.now() < 1 * 86400000).length;
          const dueList = withRoom.filter((s) => s.due).slice(0, 3);
          const items = [];
          items.push(`<span class="shower-chip ${overdue ? "due" : ""}">Overdue: ${overdue || 0}</span>`);
          items.push(`<span class="shower-chip ${dueSoon ? "soon" : ""}">Due soon: ${dueSoon}</span>`);
          if (next) {
            items.push(`<span class="shower-chip">Next: Room ${next.room} • ${formatDateFriendly(next.nextTs)}</span>`);
          } else {
            items.push(`<span class="shower-chip">Next: —</span>`);
          }
          if (dueList.length) {
            const dueRooms = dueList.map((d) => `Room ${d.room} (${formatDateFriendly(d.nextTs)})`).join(", ");
            items.push(`<span class="shower-chip due">Act on: ${dueRooms}</span>`);
          }
          const itemsHost = document.getElementById("showerAlertItems");
          if (itemsHost) itemsHost.innerHTML = items.join(" ");
          bar.style.display = items.length ? "flex" : "none";
        };

        // Shower tracker modal
        const showerBackdrop = document.createElement("div");
        showerBackdrop.className = "modal-backdrop";
        showerBackdrop.innerHTML = `
          <div class="modal modal-md" role="dialog" aria-modal="true">
            <h3>Shower Tracker</h3>
            <div id="showerModalBody" class="modal-body scroll"></div>
            <div class="actions align-end">
              <button type="button" class="action-btn secondary" id="closeShowerModal">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(showerBackdrop);
        const showerModalBody = showerBackdrop.querySelector("#showerModalBody");
        const closeShowerModalBtn = showerBackdrop.querySelector("#closeShowerModal");
        const renderShowerModal = () => {
          const schedule = buildShowerSchedule(14);
          const rows = schedule
            .map((s) => {
              const upcoming = s.schedule
                .slice(0, 5)
                .map((ts) => formatDateFriendly(ts))
                .join(" • ");
              return `
                <tr class="${s.due ? "row-critical" : s.soon ? "row-shower-due" : ""}">
                  <td>${s.room || "—"}</td>
                  <td>${s.patient || "—"}</td>
                  <td>${s.last || "—"}</td>
                  <td>${s.next || "—"}</td>
                  <td>${s.due ? "Due" : s.soon ? "Soon" : "On cadence"}</td>
                  <td>${upcoming || "—"}</td>
                </tr>
              `;
            })
            .join("");
          showerModalBody.innerHTML = `
            <div class="info-note" style="margin-bottom:8px;">
              <strong>Tip:</strong> Enter a last shower date to auto-fill the next one (3-day cadence). Planner shows the next two weeks per room/patient.
            </div>
            <table class="shower-table" style="width:100%; margin-top:6px;">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Patient</th>
                  <th>Last</th>
                  <th>Next</th>
                  <th>Status</th>
                  <th>Next 2 weeks</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          `;
        };
        if (closeShowerModalBtn) {
          closeShowerModalBtn.addEventListener("click", () => {
            showerBackdrop.style.display = "none";
          });
        }

        const setBadgeColors = () => {
          nurseColors.clear();
          let colorIndex = 0;
          rooms.forEach((row) => {
            if (!row.nurse) return;
            if (!nurseColors.has(row.nurse)) {
              nurseColors.set(row.nurse, palette[colorIndex % palette.length]);
              colorIndex += 1;
            }
          });
        };

        const riskWeights = { high: 30, medium: 15, low: 5 };
        const classifyFallLevel = (row) => {
          const text = (row.fall || "").toLowerCase();
          if (text.includes("🛑") || text.includes("high")) return "high";
          if (text.includes("⚠️") || text.includes("mod")) return "moderate";
          if (text.includes("⭐") || text.includes("low")) return "low";
          return "none";
        };
        const classifyAssistLevel = (row) => {
          const text = (row.assist || "").toLowerCase();
          if (!text) return "independent";
          if (text.includes("lift")) return "lift";
          if (text.includes("wheel") || text.includes("chair")) return "wheelchair";
          if (text.includes("stand") || text.includes("assist") || text.includes("walk")) return "assist";
          return "independent";
        };
        const clamp = (val, min = 0, max = 100) => Math.min(max, Math.max(min, val));

        // Maintain rounding history per room (last 24h)
        const normalizeHistory = (history = []) =>
          (history || [])
            .map((h) =>
              typeof h === "number" ? { ts: h, user: "", shift: "" } : h
            )
            .filter((h) => h && Number.isFinite(Number(h.ts)))
            .map((h) => ({ ...h, ts: Number(h.ts) }));

        const trimHistory = (history = []) => {
          const normalized = normalizeHistory(history);
          const cutoff = Date.now() - 24 * 60 * 60000;
          return normalized.filter((h) => h.ts >= cutoff);
        };

        const computeRoundMeta = (row) => {
          if (!row.patient) {
            return { ago: 0, ratio: 0, state: "ok", interval: row.roundInterval || 60 };
          }
          const interval = row.roundInterval || 60;
          const now = Date.now();
          const last = Number(row.lastRoundedAt) || 0;
          const agoFromStamp = last ? Math.max(0, Math.round((now - last) / 60000)) : 0;
          const agoFallback = Number.isFinite(row.roundedAgo) ? Number(row.roundedAgo) : 0;
          const ago = Math.max(0, agoFromStamp || agoFallback);
          const ratio = interval > 0 ? ago / interval : 0;
          let state = "ok";
          if (ratio >= 1.5) state = "critical";
          else if (ratio >= 1.15) state = "due";
          else if (ratio >= 0.9) state = "soon";
          return { ago, ratio, state, interval };
        };

        const inferRisk = (row) => {
          const riskText = (row.r || "").toLowerCase();
          if (riskText.includes("high") || row.status === "red") return "high";
          if (riskText.includes("med") || row.status === "yellow") return "medium";
          return "low";
        };

        const parseNames = (text) =>
          text
            .split(/[,\\n]/)
            .map((s) => s.trim())
            .filter(Boolean);

        // NOVA engine: unit-level intelligence
        const NOVA_ENGINE = {
          computeModeScores(row) {
            const assist = (row.assist || "").toLowerCase();
            const notes = (row.n || row.notes || row.sp || "").toLowerCase();
            const fallText = (row.fall || "").toLowerCase();

            let fallScore = 0;
            if (fallText.includes("🛑") || fallText.includes("high")) fallScore = 80;
            else if (fallText.includes("⚠️") || fallText.includes("mod")) fallScore = 55;
            else if (fallText.includes("⭐") || fallText.includes("low")) fallScore = 25;
            if (assist.includes("lift")) fallScore += 15;
            else if (assist.includes("wheel") || assist.includes("chair")) fallScore += 10;
            else if (assist.includes("assist") || assist.includes("walker")) fallScore += 6;

            let toiletingScore = 0;
            const toiletingTokens = ["restroom", "toilet", "bathroom", "brp", "incont", "urine", "bowel", "commode"];
            if (toiletingTokens.some((k) => notes.includes(k) || (row.t || "").toLowerCase().includes(k))) {
              toiletingScore = 60;
            }
            if ((row.t || "").toLowerCase().includes("brp") || (row.t || "").toLowerCase().includes("bath")) {
              toiletingScore += 15;
            }
            if ((row.roundDrift || 0) > 1) toiletingScore += 8;

            let mobilityScore = 10;
            if (assist.includes("lift")) mobilityScore = 85;
            else if (assist.includes("wheel") || assist.includes("chair")) mobilityScore = 65;
            else if (assist.includes("assist") || assist.includes("walker") || assist.includes("stand")) mobilityScore = 50;
            else mobilityScore = 25;

            let comfortScore = 0;
            if (notes.includes("pain") || notes.includes("ache")) comfortScore += 60;
            if (notes.includes("anxious") || notes.includes("distress") || notes.includes("agitated")) comfortScore += 35;
            if (notes.includes("nausea") || notes.includes("discomfort")) comfortScore += 25;

            const novaFallScore = clamp(fallScore);
            const novaToiletScore = clamp(toiletingScore);
            const novaMobilityScore = clamp(mobilityScore);
            const novaComfortScore = clamp(comfortScore);

            row.novaFallScore = novaFallScore;
            row.novaToiletScore = novaToiletScore;
            row.novaMobilityScore = novaMobilityScore;
            row.novaComfortScore = novaComfortScore;

            return {
              fall: novaFallScore,
              toilet: novaToiletScore,
              mobility: novaMobilityScore,
              comfort: novaComfortScore,
            };
          },

          computeLegacyNeed(row, meta) {
            let score = 0;
            const interval = meta?.interval || row.roundInterval || 60;
            const drift = meta ? meta.ratio : row.roundDrift || (row.roundedAgo || 0) / interval;
            score += Math.min(60, drift * 40);

            const fall = row.fall || "";
            if (fall.includes("🛑")) score += 30;
            else if (fall.includes("⚠️")) score += 18;

            const assist = (row.assist || "").toLowerCase();
            if (assist.includes("lift")) score += 20;
            else if (assist.includes("wheel")) score += 12;
            else if (assist.includes("assist")) score += 8;

            const iso = row.iso || "";
            if (iso && !iso.includes("None") && !iso.includes("🟩")) score += 8;

            const notes = (row.n || row.notes || "").toLowerCase();
            if (notes.includes("pain")) score += 15;
            if (notes.includes("confused") || notes.includes("agitated")) score += 15;
            if (notes.includes("anxious") || notes.includes("distress")) score += 10;

            return clamp(Math.round(score));
          },

          computeNeedScore(row) {
            const meta = computeRoundMeta(row);
            const legacy = this.computeLegacyNeed(row, meta);
            const modes = this.computeModeScores(row);
            const modeMax = Math.max(modes.fall, modes.toilet, modes.mobility, modes.comfort);
            const blended = legacy * 0.55 + modeMax * 0.45;
            return clamp(Math.round(blended));
          },

          computeStabilityScore(row) {
            const need = row.novaNeedScore ?? this.computeNeedScore(row);
            return clamp(100 - need);
          },

          classifyRoundState(row) {
            const meta = computeRoundMeta(row);
            return meta.state;
          },

          updateNeedHistory(row, score) {
            const history = Array.isArray(row.novaNeedHistory) ? row.novaNeedHistory.slice() : [];
            if (!history.length || history[history.length - 1] !== score) {
              history.push(score);
            }
            while (history.length > 6) history.shift();
            row.novaNeedHistory = history;
            const trend = history.length >= 2 ? history[history.length - 1] - history[0] : 0;
            const threshold = 5;
            let trajectory = "stable";
            if (trend > threshold) trajectory = "worsening";
            else if (trend < -threshold) trajectory = "improving";
            row.novaTrajectory = trajectory;
          },

          computePriorityScore(row) {
            const fallLevel = classifyFallLevel(row);
            const fallWeight = fallLevel === "high" ? 20 : fallLevel === "moderate" ? 10 : 0;
            const base = row.novaNeedScore || this.computeNeedScore(row);
            const score = base + (row.roundDrift || 0) * 30 + fallWeight;
            row.novaPriorityScore = clamp(Math.round(score), 0, 150);
            row.novaSuggestedStaff = row.nurse || row.cna || "";
            return row.novaPriorityScore;
          },

          updateRow(row) {
            Object.assign(row, applyRowDefaults(row));
          if (!row.patient) {
            row.roundState = "ok";
            row.roundDrift = 0;
            row.roundedAgo = 0;
            row.novaNeedScore = 0;
            row.novaPriorityScore = 0;
            row.novaSuggestedStaff = "";
            row.novaTrajectory = "stable";
            row.novaNeedHistory = [];
            row.justAdmittedAt = 0;
            row.roundReliabilityStreak = row.roundReliabilityStreak || 0;
            row.roundTotalCount = row.roundTotalCount || 0;
            row.roundOnTimeCount = row.roundOnTimeCount || 0;
            return;
          }
            const meta = computeRoundMeta(row);
            row.roundedAgo = meta.ago;
            row.roundDrift = meta.ratio;
            row.roundState = meta.state;
            row.roundInterval = meta.interval;
            row.novaNeedScore = this.computeNeedScore(row);
            row.novaStabilityScore = this.computeStabilityScore(row);
            const hist = trimHistory(row.roundingHistory || []);
            const interval = row.roundInterval || 60;
            const expected = interval > 0 ? Math.max(1, Math.round((24 * 60) / interval)) : 1;
            const actual = hist.length;
            row.novaOnTimePct = Math.min(100, Math.round((actual / expected) * 100));
            row.roundingHistory = hist;
            row.lastRoundedAt = hist.length ? hist[hist.length - 1].ts : row.lastRoundedAt;
            this.updateNeedHistory(row, row.novaNeedScore);
            this.computePriorityScore(row);
            row.roomReliability = row.roundTotalCount ? row.roundOnTimeCount / Math.max(1, row.roundTotalCount) : 0;
            row.novaSuggestedStaff = row.nurse || row.cna || "";
          },

          updateAll(rooms) {
            rooms.forEach((row) => this.updateRow(row));
          },

          computeUnitMetrics(rooms) {
            const activeRooms = rooms.filter((r) => r.patient);
            if (!activeRooms.length) {
              return {
                avgNeed: 0,
                avgStability: 0,
                statusCounts: { ok: 0, soon: 0, due: 0, critical: 0 },
                staffingStrain: 1,
                staffingStrainRatio: 1,
                busiest: null,
                careDebt: 0,
                staffStats: {},
                onTimePct: 0,
                silentSaves: 0,
              };
            }

            let totalNeed = 0;
            let totalStability = 0;
            const statusCounts = { ok: 0, soon: 0, due: 0, critical: 0 };
            const staffStats = new Map();
            let careDebt = 0;
            let totalRounds = 0;
            let onTimeRounds = 0;
            let silentSaves = 0;

            const addStaff = (name, role, need, isHighRisk, reliability) => {
              if (!name) return;
              const prev = staffStats.get(name) || { patients: 0, load: 0, highRiskCount: 0, role, reliability: [] };
              prev.patients += 1;
              prev.load += need;
              if (isHighRisk) prev.highRiskCount += 1;
              if (Number.isFinite(reliability)) prev.reliability.push(reliability);
              staffStats.set(name, prev);
            };

            activeRooms.forEach((row) => {
              const need = row.novaNeedScore ?? this.computeNeedScore(row);
              const stability = row.novaStabilityScore ?? this.computeStabilityScore(row);
              const state = this.classifyRoundState(row);
              const drift = row.roundDrift ?? computeRoundMeta(row).ratio;
              const fallLevel = classifyFallLevel(row);
              const isHighRisk = fallLevel === "high" || need >= 70;

              statusCounts[state] = (statusCounts[state] || 0) + 1;
              totalNeed += need;
              totalStability += stability;
              careDebt += Math.max(0, drift - 1);
              totalRounds += row.roundTotalCount || 0;
              onTimeRounds += row.roundOnTimeCount || 0;
              const highRisk = fallLevel === "high" || need >= 70;
              if (highRisk && drift < 1) {
                silentSaves += 1;
              }

              addStaff(row.nurse, "RN", need, isHighRisk, row.roomReliability);
              addStaff(row.cna, "CNA", need * 0.6, isHighRisk, row.roomReliability);
            });

            const avgNeed = totalNeed / activeRooms.length;
            const avgStability = totalStability / activeRooms.length;

            let maxLoad = 0;
            let busiest = null;
            staffStats.forEach((v, name) => {
              const reliabilityScore = v.reliability.length
                ? v.reliability.reduce((a, b) => a + b, 0) / v.reliability.length
                : 0;
              v.reliabilityScore = reliabilityScore;
              const fatigueScore =
                (v.load || 0) / 50 +
                (v.highRiskCount || 0) * 3 +
                (v.patients || 0) * 0.5;
              v.fatigueScore = clamp(Math.round(fatigueScore), 0, 100);
              delete v.reliability;
              if (v.load > maxLoad) {
                maxLoad = v.load;
                busiest = { name, ...v };
              }
            });

            const avgLoad =
              staffStats.size > 0
                ? Array.from(staffStats.values()).reduce((a, b) => a + b.load, 0) / staffStats.size
                : totalNeed || 1;
            const staffingStrain = avgLoad ? maxLoad / avgLoad : 1;

            return {
              avgNeed,
              avgStability,
              statusCounts,
              staffingStrain,
              staffingStrainRatio: staffingStrain,
              busiest,
              careDebt,
              staffStats: Object.fromEntries(staffStats),
              onTimePct: totalRounds ? onTimeRounds / Math.max(1, totalRounds) : 0,
              totalRounds,
              onTimeRounds,
              silentSaves,
            };
          },

          computeRadar(rooms) {
            const active = rooms.filter((r) => r.patient);
            if (!active.length) {
              return { falls: 0, mobility: 0, toileting: 0, comfort: 0 };
            }
            const avg = (key) =>
              active.reduce((sum, r) => sum + (Number(r[key]) || 0), 0) / active.length;
            return {
              falls: Math.round(avg("novaFallScore")),
              mobility: Math.round(avg("novaMobilityScore")),
              toileting: Math.round(avg("novaToiletScore")),
              comfort: Math.round(avg("novaComfortScore")),
            };
          },
        };

        const buildNovaTasks = (roomsList = rooms) => {
          const tasks = [];
          roomsList
            .filter((r) => r && r.patient)
            .forEach((r) => {
              const fallLevel = classifyFallLevel(r);
              const fallWeight = fallLevel === "high" ? 30 : fallLevel === "moderate" ? 15 : 0;
              const drift = r.roundDrift || computeRoundMeta(r).ratio || 0;
              const priority = r.novaPriorityScore || NOVA_ENGINE.computeNeedScore(r) + drift * 30 + fallWeight;
              const taskType =
                fallWeight >= 30 && drift >= 1
                  ? "Fall-prevention rounding"
                  : drift >= 1.1
                  ? "Overdue rounding"
                  : drift >= 0.7
                  ? "Soon rounding"
                  : "Check-in / comfort round";
              const suggested = r.novaSuggestedStaff || r.nurse || (r.cna && taskType.includes("toileting") ? r.cna : r.cna) || "Unassigned";
              tasks.push({
                room: r.room,
                patient: r.patient,
                novaPriorityScore: priority,
                roundDrift: drift,
                fallWeight,
                taskType,
                suggestedStaff: suggested,
                need: r.novaNeedScore || 0,
                riskFlags: `${r.fall || ""} ${r.assist || ""}`.trim(),
                critical: drift >= 1.2 || fallWeight >= 30,
                ref: r,
              });
            });
          return tasks.sort((a, b) => (b.novaPriorityScore || 0) - (a.novaPriorityScore || 0)).slice(0, 10);
        };

        const updateNovaTasks = () => {
          novaState.tasks = buildNovaTasks();
          novaState.updatedAt = Date.now();
        };

        const prepareCarefusionData = () => {
          const staffMap = new Map();
          const shiftKey = carefusionData.currentShift || "day";
          const shift = carefusionData.shiftInputs[shiftKey];
          if (shift) {
            parseNames(shift.rn).forEach((name, idx) => {
              staffMap.set(`rn-${name}-${idx}`, {
                id: `rn-${name}-${idx}`,
                name,
                role: "RN",
                fatigue: 0.2,
                available: true,
                proximity: 5,
              });
            });
            parseNames(shift.tech).forEach((name, idx) => {
              staffMap.set(`tech-${name}-${idx}`, {
                id: `tech-${name}-${idx}`,
                name,
                role: "Tech",
                fatigue: 0.2,
                available: true,
                proximity: 7,
              });
            });
            parseNames(shift.support).forEach((name, idx) => {
              staffMap.set(`sup-${name}-${idx}`, {
                id: `sup-${name}-${idx}`,
                name,
                role: "Support",
                fatigue: 0.2,
                available: true,
                proximity: 8,
              });
            });
          }
          rooms.forEach((row) => {
            if (row.nurse) {
              staffMap.set(row.nurse, {
                id: `n-${row.nurse}`,
                name: row.nurse,
                role: "RN",
                fatigue: 0.3,
                available: row.status !== "red",
                proximity: Math.abs((row.room || 0) % 10) + 2,
              });
            }
            if (row.cna) {
              staffMap.set(`cna-${row.cna}`, {
                id: `c-${row.cna}`,
                name: row.cna,
                role: "Tech",
                fatigue: 0.3,
                available: true,
                proximity: Math.abs((row.room || 0) % 10) + 4,
              });
            }
          });

          const patients = rooms
            .filter((row) => row.patient)
            .map((row) => ({
              id: `p-${row.room}`,
              name: row.patient,
              risk: inferRisk(row),
              requiredRole: "RN",
              room: row.room,
            }));

          carefusionData.staff = Array.from(staffMap.values());
          carefusionData.patients = patients;
        };

        const computeAssignmentScore = (staffMember, patient) => {
          let score = 0;
          if (!staffMember.available) return -Infinity;
          score += 30;
          score += (1 - (staffMember.fatigue || 0)) * 20;
          score += Math.max(0, 20 - (staffMember.proximity || 0));
          score += staffMember.role === patient.requiredRole ? 30 : 10;
          score += riskWeights[patient.risk] || 0;
          return score;
        };

        const runCarefusionAssignment = () => {
          prepareCarefusionData();
          const results = carefusionData.patients.map((patient) => {
            let best = null;
            let bestScore = -Infinity;
            carefusionData.staff.forEach((member) => {
              const s = computeAssignmentScore(member, patient);
              if (s > bestScore) {
                bestScore = s;
                best = member;
              }
            });
            return {
              patient: patient.name,
              staff: best ? best.name : "No available staff",
              risk: patient.risk,
              score: bestScore,
              room: patient.room,
              role: best ? best.role : "",
            };
          });
          carefusionData.assignments = results;
          renderCarefusion();
        };

        const applyAssignmentsToBoard = () => {
          (carefusionData.assignments || []).forEach((a) => {
            const row = rooms.find((r) => r.room === a.room);
            if (!row) return;
            if (a.role === "RN" && a.staff) {
              row.nurse = a.staff;
            } else if (a.role === "Tech" && a.staff) {
              row.cna = a.staff;
            } else if (a.role === "Support" && a.staff) {
              row.sp = a.staff;
            }
          });
          renderTable();
          persistState();
        };

        // Feedback modal (rounding events)
        const feedbackBackdrop = document.createElement("div");
        feedbackBackdrop.className = "modal-backdrop";
        feedbackBackdrop.innerHTML = `
          <div class="modal modal-sm modal-centered" role="alertdialog" aria-modal="true">
            <h3 id="feedbackTitle" style="margin-bottom:8px;">Notification</h3>
            <div id="feedbackBody" class="modal-body compact" style="margin-bottom:8px;"></div>
            <div class="actions align-center">
              <button type="button" class="action-btn secondary" id="closeFeedback">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(feedbackBackdrop);
        const feedbackTitle = feedbackBackdrop.querySelector("#feedbackTitle");
        const feedbackBody = feedbackBackdrop.querySelector("#feedbackBody");
        const closeFeedbackBtn = feedbackBackdrop.querySelector("#closeFeedback");
        const openFeedback = (title, message) => {
          if (feedbackTitle) feedbackTitle.textContent = title || "Notification";
          if (feedbackBody) feedbackBody.textContent = message || "";
          feedbackBackdrop.style.display = "flex";
          // Focus the close button for accessibility
          if (closeFeedbackBtn) {
            setTimeout(() => closeFeedbackBtn.focus(), 100);
          }
        };
        const closeFeedback = () => {
          feedbackBackdrop.style.display = "none";
        };
        if (closeFeedbackBtn) {
          closeFeedbackBtn.addEventListener("click", closeFeedback);
        }
        feedbackBackdrop.addEventListener("click", (e) => {
          if (e.target === feedbackBackdrop) closeFeedback();
        });
        // Close feedback modal with Escape key
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && feedbackBackdrop.style.display === "flex") {
            closeFeedback();
          }
        });

        const renderCarefusion = () => {
          const app = assignmentBackdrop.querySelector("#carefusion-app");
          if (!app) return;
          const riskRank = { high: 3, medium: 2, low: 1 };
          NOVA_ENGINE.updateAll(rooms);
          const workload = (() => {
            const map = new Map();
            rooms.forEach((r) => {
              if (r.nurse) {
                const prev = map.get(r.nurse) || { pts: 0, need: 0 };
                prev.pts += 1;
                prev.need += r.novaNeedScore || 0;
                map.set(r.nurse, prev);
              }
            });
            return Array.from(map.entries()).map(([name, v]) => ({
              name,
              pts: v.pts,
              need: Math.round(v.need),
            }));
          })();
          const staffList = carefusionData.staff
            .map(
              (s) => `
              <div class="cf-row">
                <span>${s.name} (${s.role})</span>
                <span>
                  <span class="cf-chip ${s.available ? "good" : "danger"}">${s.available ? "Available" : "Busy"}</span>
                  <span class="cf-chip ${s.fatigue > 0.6 ? "danger" : s.fatigue > 0.3 ? "warn" : "good"}">Fatigue ${Math.round(s.fatigue * 100)}%</span>
                </span>
              </div>`
            )
            .join("");

          const staffOptions = carefusionData.staff
            .map(
              (s) => `<option value="${s.name}" data-role="${s.role}">${s.name} (${s.role})</option>`
            )
            .join("");

          const patientRows = carefusionData.assignments
            .slice()
            .sort((a, b) => (riskRank[b.risk] || 0) - (riskRank[a.risk] || 0))
            .map(
              (a) => `
              <tr>
                <td>${a.patient}</td>
                <td>${a.risk || "—"}</td>
                <td>${a.staff}</td>
                <td>${a.role || ""}</td>
                <td>${a.score === -Infinity ? "N/A" : a.score.toFixed(1)}</td>
              </tr>`
            )
            .join("");

          const hasAssignments = carefusionData.assignments.length > 0;
          const hasStaff = (carefusionData.staff || []).length > 0;
          const hasPatients = (carefusionData.patients || []).length > 0;
          const statusLine = !hasStaff
            ? "Add staff names to begin."
            : !hasPatients
            ? "No active patients to assign."
            : "Run the engine to see suggested pairings.";

          app.innerHTML = `
            <div class="cf-shell">
              <div class="cf-head">
                <h3 class="cf-title">CareFusion™ Assignment</h3>
                <div style="display:flex; gap:6px;">
                  <button class="cf-btn" id="cf-run">Run engine</button>
                  <button class="cf-btn" id="cf-apply" ${hasAssignments ? "" : "disabled"}>Apply to board</button>
                </div>
              </div>
              <div class="cf-desc" style="background:#eef4ff; border:1px solid #d8e3ff; padding:8px; border-radius:10px; margin-bottom:8px;">
                <strong>Simple steps:</strong> Add staff → Run engine → Apply. Uses availability, fatigue, proximity, skills, and risk automatically.<br/>
                <span style="color:#10356b; font-weight:700;">Status:</span> ${statusLine}
              </div>

              <div class="cf-controls">
                <div class="cf-field">
                  <label>Shift</label>
                  <div style="display:flex; gap:6px;">
                    <button type="button" class="cf-btn" id="cf-shift-day" style="padding:6px 10px; font-size:12px;">Day</button>
                    <button type="button" class="cf-btn secondary" id="cf-shift-night" style="padding:6px 10px; font-size:12px;">Night</button>
                  </div>
                </div>
                <div class="cf-field">
                  <label>${carefusionData.currentShift === "day" ? "Day" : "Night"} RN (comma separated)</label>
                  <input id="cf-rn" placeholder="e.g., Alex, Taylor" />
                </div>
                <div class="cf-field">
                  <label>${carefusionData.currentShift === "day" ? "Day" : "Night"} Tech</label>
                  <input id="cf-tech" placeholder="e.g., Jamie" />
                </div>
                <div class="cf-field">
                  <label>${carefusionData.currentShift === "day" ? "Day" : "Night"} Support</label>
                  <input id="cf-support" placeholder="e.g., Morgan" />
                </div>
              </div>

              <div class="cf-card">
                <div class="cf-subtitle">Staff (auto + shift)</div>
                ${staffList || "<div class='cf-desc'>Add staff names to begin.</div>"}
              </div>

              <div class="cf-card">
                <div class="cf-subtitle">Workload balance (RN)</div>
                ${
                  workload.length
                    ? workload
                        .map(
                          (w) =>
                            `<div class="cf-row"><span>${w.name}</span><span class="cf-chip">${w.pts} pts · need ${w.need}</span></div>`
                        )
                        .join("")
                    : "<div class='cf-desc'>No nurse assignments yet.</div>"
                }
              </div>

              <div class="cf-card">
                <div class="cf-subtitle">Bundle assignment (optional)</div>
                <div class="cf-field">
                  <label>Select staff</label>
                  <select id="cf-bundle-staff" class="cell-input">
                    <option value="">Choose…</option>
                    ${staffOptions}
                  </select>
                </div>
                <div class="cf-field">
                  <label>Rooms (comma separated)</label>
                  <input id="cf-bundle-rooms" placeholder="e.g., 201,202,203" />
                </div>
                <div class="cf-inline" style="margin-top:6px;">
                  <label style="font-weight:700; font-size:12px; color:#10356b;">
                    <input type="checkbox" id="cf-bundle-acuity" /> Fill highest acuity first
                  </label>
                  <button class="cf-btn secondary" id="cf-apply-bundle">Assign bundle</button>
                </div>
                <div class="cf-desc">Uses role to place into Nurse/Tech/Support fields; skips filled slots.</div>
              </div>

              <div class="cf-subtitle" style="margin-top:6px;">Assignments</div>
              <div class="cf-results">
                ${
                  hasAssignments
                    ? ""
                    : `<div class="cf-desc">${hasStaff && hasPatients ? "Run the engine to see best matches." : statusLine}</div>`
                }
                ${hasAssignments ? `
                  <table class="cf-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Risk</th>
                        <th>Assigned staff</th>
                        <th>Role</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>${patientRows}</tbody>
                  </table>` : ""}
              </div>
            </div>
          `;
          const runBtn = app.querySelector("#cf-run");
          if (runBtn) runBtn.addEventListener("click", runCarefusionAssignment);
          const applyBtn = app.querySelector("#cf-apply");
          if (applyBtn) applyBtn.addEventListener("click", applyAssignmentsToBoard);
          const shiftDay = app.querySelector("#cf-shift-day");
          const shiftNight = app.querySelector("#cf-shift-night");
          const setShiftStyles = () => {
            if (shiftDay && shiftNight) {
              const dayActive = carefusionData.currentShift === "day";
              shiftDay.style.background = dayActive ? "linear-gradient(135deg, #1c5bbf, #10356b)" : "#eef2f7";
              shiftDay.style.color = dayActive ? "#fff" : "#10356b";
              shiftDay.style.boxShadow = dayActive ? "0 12px 28px rgba(16,53,107,0.16)" : "none";
              shiftDay.style.border = dayActive ? "none" : "1px solid #d8deeb";
              shiftNight.style.background = dayActive ? "#eef2f7" : "linear-gradient(135deg, #1c5bbf, #10356b)";
              shiftNight.style.color = dayActive ? "#10356b" : "#fff";
              shiftNight.style.boxShadow = dayActive ? "none" : "0 12px 28px rgba(16,53,107,0.16)";
              shiftNight.style.border = dayActive ? "1px solid #d8deeb" : "none";
            }
          };
          const bindShift = (key) => {
            carefusionData.currentShift = key;
            setShiftStyles();
            syncInputs();
            runCarefusionAssignment();
          };
          const syncInputs = () => {
            const shift = carefusionData.shiftInputs[carefusionData.currentShift];
            const setVal = (id, val) => {
              const el = app.querySelector(id);
              if (el) el.value = val || "";
            };
            setVal("#cf-rn", shift.rn);
            setVal("#cf-tech", shift.tech);
            setVal("#cf-support", shift.support);
          };
          syncInputs();
          if (shiftDay) shiftDay.addEventListener("click", () => bindShift("day"));
          if (shiftNight) shiftNight.addEventListener("click", () => bindShift("night"));
          const bindInput = (selector, targetKey) => {
            const el = app.querySelector(selector);
            if (el) {
              el.addEventListener("input", () => {
              carefusionData.shiftInputs[carefusionData.currentShift][targetKey] = el.value;
                persistState();
                runCarefusionAssignment();
              });
            }
          };
          bindInput("#cf-rn", "rn");
          bindInput("#cf-tech", "tech");
          bindInput("#cf-support", "support");
          setShiftStyles();
          const bundleBtn = app.querySelector("#cf-apply-bundle");
          if (bundleBtn) {
            bundleBtn.addEventListener("click", () => {
              const staffSel = app.querySelector("#cf-bundle-staff");
              const roomsInput = app.querySelector("#cf-bundle-rooms");
              const acuityFirst = app.querySelector("#cf-bundle-acuity")?.checked;
              const staffName = staffSel?.value?.trim();
              const staffRole = staffSel?.selectedOptions?.[0]?.dataset?.role || "";
              if (!staffName || !roomsInput) return;
              const roomList = roomsInput.value
                .split(",")
                .map((r) => Number(r.trim()))
                .filter((n) => !Number.isNaN(n));
              const sortedRooms = acuityFirst
                ? roomList
                    .map((room) => {
                      const row = rooms.find((r) => r.room === room);
                      const risk = row ? inferRisk(row) : "low";
                      return { room, risk };
                    })
                    .sort((a, b) => (riskRank[b.risk] || 0) - (riskRank[a.risk] || 0))
                    .map((r) => r.room)
                : roomList;
              sortedRooms.forEach((roomNum) => {
                const row = rooms.find((r) => r.room === roomNum);
                if (!row) return;
                if (staffRole === "RN" && !row.nurse) {
                  row.nurse = staffName;
                } else if (staffRole === "Tech" && !row.cna) {
                  row.cna = staffName;
                } else if (staffRole === "Support" && !row.sp) {
                  row.sp = staffName;
                }
              });
              renderTable();
              runCarefusionAssignment();
              persistState();
            });
          }
        };

        let roundTooltipEl = null;
        const hideRoundTooltip = () => {
          if (!roundTooltipEl) return;
          roundTooltipEl.classList.remove("visible");
          roundTooltipEl.setAttribute("aria-hidden", "true");
        };
        const ensureRoundTooltip = () => {
          if (roundTooltipEl) return roundTooltipEl;
          roundTooltipEl = document.createElement("div");
          roundTooltipEl.className = "round-tooltip-panel";
          roundTooltipEl.setAttribute("aria-hidden", "true");
          roundTooltipEl.innerHTML = `
            <div class="round-tooltip-title"></div>
            <div class="round-tooltip-progress round-progress"><div></div></div>
            <div class="round-meta"></div>
          `;
          document.body.appendChild(roundTooltipEl);
          window.addEventListener("scroll", hideRoundTooltip, true);
          window.addEventListener("resize", hideRoundTooltip);
          return roundTooltipEl;
        };
        const showRoundTooltip = (anchor, title, ratio, state, metaText) => {
          const tooltip = ensureRoundTooltip();
          const titleEl = tooltip.querySelector(".round-tooltip-title");
          const progressEl = tooltip.querySelector(".round-tooltip-progress");
          const fillEl = progressEl.querySelector("div");
          const metaEl = tooltip.querySelector(".round-meta");
          titleEl.textContent = title;
          progressEl.className = "round-tooltip-progress round-progress" + (state !== "ok" ? ` ${state}` : "");
          const visualRatio = Math.min(ratio, 1.2);
          fillEl.style.width = `${Math.min(visualRatio, 1) * 100}%`;
          metaEl.textContent = metaText;
          tooltip.style.left = "0px";
          tooltip.style.top = "0px";
          tooltip.classList.add("visible");
          tooltip.setAttribute("aria-hidden", "false");
          const anchorRect = anchor.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();
          let top = anchorRect.bottom + 8;
          if (top + tooltipRect.height > window.innerHeight - 8) {
            top = anchorRect.top - tooltipRect.height - 8;
          }
          let left = anchorRect.left;
          if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
          }
          left = Math.max(8, left);
          top = Math.max(8, top);
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
        };

        const buildRoundingCell = (row) => {
          const td = document.createElement("td");
          td.className = "round";

          const container = document.createElement("div");
          container.className = "rounding-cell";

          // Smart interval logic
          let interval = Number(row.roundInterval);
          if (!interval || interval <= 0) {
            const riskText = ((row.r || "") + " " + (row.fall || "")).toLowerCase();
            if (riskText.includes("high") || row.status === "red") interval = 60;
            else if (riskText.includes("mod") || row.status === "yellow") interval = 90;
            else interval = 120;
            row.roundInterval = interval;
          }

          const metaInfo = computeRoundMeta(row);
          const ago = metaInfo.ago;
          row.roundedAgo = ago;
          const hist = trimHistory(row.roundingHistory || []);
          row.roundingHistory = hist;
          const ratio = metaInfo.ratio;
          const state = metaInfo.state;
          row.roundState = state;
          row.roundDrift = ratio;

          const label = !row.patient
            ? "Empty"
            : ago === 0
            ? "Now"
            : ago >= 60
            ? `${Math.round(ago / 60)}h`
            : `${ago}m`;
          let badgeText;
          if (!row.patient) {
            badgeText = "Paused";
          } else if (state === "ok" && ratio < 0.5) badgeText = "Fresh";
          else if (state === "ok") badgeText = "On track";
          else if (state === "soon") badgeText = "Due soon";
          else if (state === "due") {
            const overdueMin = Math.max(0, ago - interval);
            badgeText = overdueMin > 0 ? `Overdue • +${overdueMin}m` : "Due now";
          } else {
            const overdueMin = Math.max(0, ago - interval);
            badgeText = `LATE • +${overdueMin}m`;
          }

          const badge = document.createElement("div");
          badge.className = "round-badge" + (state !== "ok" ? ` ${state}` : "");
          const dot = document.createElement("span");
          dot.className = "round-dot";
          badge.appendChild(dot);
          const badgeLabel = document.createElement("span");
          badgeLabel.textContent = `${badgeText} • ${label}`;
          badge.appendChild(badgeLabel);
          if (row.justAdmittedAt && Date.now() - row.justAdmittedAt < 10 * 60 * 1000) {
            const newStart = document.createElement("span");
            newStart.className = "new-start";
            newStart.textContent = "New start";
            badge.appendChild(newStart);
          }
          if (row.roundReliabilityStreak) {
            const streak = document.createElement("span");
            streak.className = "streak-chip";
            streak.textContent = `Streak: ${row.roundReliabilityStreak}`;
            badge.appendChild(streak);
          }

          const last3 = hist.slice(-3).map((h) => new Date(h.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })).join(" · ") || "—";
          const lastGap =
            hist.length >= 2
              ? Math.round((hist[hist.length - 1].ts - hist[hist.length - 2].ts) / 60000) + "m gap"
              : "—";
          const metaText = `${interval}m window · drift ${(ratio * 100).toFixed(0)}% · last: ${last3} · gap: ${lastGap}`;

          const tooltipTitle = `${badgeText} • ${label}`;
          container.addEventListener("mouseenter", () => {
            showRoundTooltip(container, tooltipTitle, ratio, state, metaText);
          });
          container.addEventListener("mouseleave", hideRoundTooltip);

          container.appendChild(badge);
          const startActive = row.justAdmittedAt && Date.now() - row.justAdmittedAt < 3 * 60 * 1000;
          if (startActive) {
            const startTag = document.createElement("span");
            startTag.className = "start-indicator";
            startTag.textContent = "Timer started";
            container.appendChild(startTag);
          }
          td.appendChild(container);
          return td;
        };

        // Render NOVA quality panel

        const renderStaffFairness = () => {
          if (!staffFairnessBody) return;
          NOVA_ENGINE.updateAll(rooms);
          const metrics = NOVA_ENGINE.computeUnitMetrics(rooms);
          const stats = metrics.staffStats || {};
          const staffEntries = Object.entries(stats);
          if (!staffEntries.length) {
            staffFairnessBody.innerHTML = "<div class='cf-desc'>No staff assignments yet.</div>";
            return;
          }
          const avgLoad = staffEntries.reduce((sum, [, v]) => sum + (v.load || 0), 0) / staffEntries.length;
          const maxLoad = staffEntries.reduce((max, [, v]) => Math.max(max, v.load || 0), 0);
          const strainRatio = avgLoad ? maxLoad / avgLoad : 1;
          const strainLabel = strainRatio >= 1.4 ? "HIGH" : strainRatio >= 1.15 ? "Moderate" : "Balanced";
          const heaviest = metrics.busiest;
          const sortedByLoad = staffEntries.sort((a, b) => (b[1].load || 0) - (a[1].load || 0));
          const lightest = sortedByLoad[sortedByLoad.length - 1];
          const suggestion =
            heaviest && lightest && heaviest.name !== lightest[0]
              ? `Suggestion: Reassign one high-risk patient from ${heaviest.name} to ${lightest[0]} to reduce strain.`
              : "Suggestion: Load balanced — keep assignments steady.";
          const lines = staffEntries
            .sort((a, b) => (b[1].load || 0) - (a[1].load || 0))
            .slice(0, 4)
            .map(
              ([name, v]) =>
                `<div>${name}: ${v.patients} pts · load ${Math.round(v.load || 0)} · high-risk ${v.highRiskCount || 0} · fatigue ${v.fatigueScore || 0}</div>`
            )
            .join("");
          staffFairnessBody.innerHTML = `
            <div><strong>Heaviest load:</strong> ${
              heaviest ? `${heaviest.name} — ${heaviest.patients} pts, load ${Math.round(heaviest.load)}, high-risk ${heaviest.highRiskCount || 0}` : "N/A"
            }</div>
            <div><strong>Average load:</strong> ${avgLoad ? avgLoad.toFixed(1) : "0"}</div>
            <div><strong>Strain:</strong> ${strainLabel} (ratio ${strainRatio.toFixed(2)})</div>
            <div style="margin-top:6px; font-size:11px; color:#47566f;">Staff Load & Fairness + Burnout Guard highlights load distribution across staff so assignments remain fair and sustainable.</div>
            <div style="margin-top:6px;">${lines || "—"}</div>
            <div style="margin-top:6px; font-weight:700; color:#0b3f78;">${suggestion}</div>
          `;
        };

        // Fit table rows to the visible board height
        const autoScaleBoard = (countOverride) => {
          const visibleRows =
            typeof countOverride === "number" && !Number.isNaN(countOverride)
              ? countOverride
              : rooms.length;
          document.documentElement.style.setProperty("--board-scale", "1");
          const main = document.querySelector(".main");
          if (main) {
            main.style.height = "calc(100vh - 4px)";
            main.style.minHeight = main.style.height;
          }
          const applyRowHeight = (value) => {
            if (!Number.isFinite(value) || value <= 0) return;
            document.documentElement.style.setProperty("--row-height", `${value}px`);
          };
          window.requestAnimationFrame(() => {
            const tableWrap = document.querySelector(".table-wrap");
            const table = tableWrap?.querySelector(".bed-table");
            const thead = table?.querySelector("thead");
            if (!tableWrap || !table || !thead) return;
            const blocks = tableWrap.querySelectorAll(
              ".table-actions, .table-controls, .table-summary"
            );
            let used = 0;
            blocks.forEach((el) => {
              const rect = el.getBoundingClientRect();
              const styles = window.getComputedStyle(el);
              used += rect.height;
              used += parseFloat(styles.marginTop || "0") + parseFloat(styles.marginBottom || "0");
            });
            const wrapStyles = window.getComputedStyle(tableWrap);
            used += parseFloat(wrapStyles.paddingTop || "0") + parseFloat(wrapStyles.paddingBottom || "0");
            const headHeight = thead.getBoundingClientRect().height;
            const available = Math.max(0, tableWrap.clientHeight - used - headHeight);
            const rowCount = Math.max(1, visibleRows || 0);
            const borderAllowance = rowCount + 1; // collapsed borders between rows
            const safeAvailable = Math.max(0, available - borderAllowance - 2);
            let rowHeight = Math.floor(safeAvailable / rowCount);
            applyRowHeight(rowHeight);
            window.requestAnimationFrame(() => {
              const overflow = tableWrap.scrollHeight - tableWrap.clientHeight;
              if (overflow > 0) {
                const adjust = Math.ceil((overflow + 2) / rowCount);
                rowHeight = Math.max(12, rowHeight - adjust);
                applyRowHeight(rowHeight);
              }
            });
          });
        };

        const hasActiveIsolation = (row) => {
          const iso = `${row.iso || ""}`.toLowerCase();
          if (!iso.trim()) return false;
          return !(iso.includes("none") || iso.includes("🟩"));
        };
        const hasFallRisk = (row) => {
          const text = `${row.fall || ""} ${row.r || ""}`.toLowerCase();
          if (!text.trim()) return false;
          return text.includes("🛑") || text.includes("⚠️") || text.includes("⭐") || text.includes("fall");
        };
        const applyFilters = (row) => {
          if (filterState.round !== "all" && row.roundState !== filterState.round) return false;
          if (filterState.iso && !hasActiveIsolation(row)) return false;
          if (filterState.fall && !hasFallRisk(row)) return false;
          return true;
        };

        const renderTable = () => {
          const hasValidRooms = rooms.some((r) => r && r.room);
          if (!rooms.length || !hasValidRooms) {
            hydrateRoomsDefault();
            persistState();
          }
          if (!selectedRoom) {
            const fallback = rooms.find((r) => r && r.room);
            selectedRoom = fallback ? fallback.room : null;
          }
          const cleanRooms = rooms.filter((r) => r && r.room);
          setBadgeColors();
          renderShowers();
          NOVA_ENGINE.updateAll(cleanRooms);
          const filteredRooms = cleanRooms.filter(applyFilters);
          const rowsToRender = filteredRooms.length ? filteredRooms : cleanRooms;
          const lensField = lensFieldMap[modeLens];
          if (lensField) {
            rowsToRender.sort((a, b) => (b[lensField] || 0) - (a[lensField] || 0));
          }
          bedBody.innerHTML = "";
          const fragment = document.createDocumentFragment();
          rowsToRender.forEach((row) => {
            const tr = document.createElement("tr");
            tr.dataset.room = row.room;
            if (selectedRoom === row.room) tr.classList.add("row-selected");
            if (row.roundState === "critical") tr.classList.add("row-critical");
            else if (row.roundState === "due") tr.classList.add("row-due");
            else if (row.roundState === "soon") tr.classList.add("row-soon");
            if (showerDueRooms.has(row.room)) tr.classList.add("row-shower-due");
            if (modeLens !== "all" && lensField && (row[lensField] || 0) >= 60) {
              tr.classList.add("lens-highlight");
            }

            const statusCell = document.createElement("td");
            statusCell.className = "status";
            const dot = document.createElement("span");
            dot.className = `status-dot ${row.status || "gray"}`;
            statusCell.appendChild(dot);

        const focusableFields = new Set(["iso", "n", "r", "t", "assist"]);
        const makeCell = (value, field, isNurse = false) => {
          const td = document.createElement("td");
          if (field === "room") {
            td.className = "room";
            td.textContent = row.room;
            return td;
              }
              const input = document.createElement("input");
              input.className = "cell-input" + (isNurse ? " nurse-input" : "");
              if (field === "patient" && privacyMasked) {
                input.value = value ? "Protected" : "";
                input.readOnly = true;
                td.classList.add("patient");
              } else {
                input.value = formatEmojiOnly(field, value);
              }
              if (listIdByField[field]) {
                input.setAttribute("list", listIdByField[field]);
              }
              input.dataset.field = field;
              if (field === "room") input.disabled = true;
          if (field === "nurse") {
            const color = nurseColors.get(row.nurse) || "blue";
            input.classList.add(color);
          }
          if (field === "cna") td.classList.add("cna");
          if (emojiOnlyFields.has(field)) {
            td.classList.add("emoji-cell");
            input.classList.add("emoji-only");
          }
          if (field === "patient") td.classList.add("patient");
          if (field === "physician") td.classList.add("physician");
          if (field === "sp") td.classList.add("sp");
          if (focusableFields.has(field)) td.classList.add("clickable-cell");
          if (focusableFields.has(field)) {
            td.addEventListener("click", () => input.focus());
          }
          if (field === "patient") {
            const wrap = document.createElement("div");
            wrap.className = "patient-wrap";
            wrap.appendChild(input);
            if (showerDueRooms.has(row.room)) {
              const pill = document.createElement("span");
              pill.className = "alert-pill";
              pill.textContent = "🛁";
              wrap.appendChild(pill);
            } else {
              const spacer = document.createElement("span");
              spacer.className = "alert-placeholder";
              wrap.appendChild(spacer);
            }
            td.appendChild(wrap);
          } else {
            td.appendChild(input);
          }
          return td;
        };

          const cells = [
            statusCell,
            makeCell(row.room, "room"),
            buildRoundingCell(row),
            makeCell(row.nurse, "nurse", true),
              makeCell(row.cna, "cna"),
              makeCell(row.patient, "patient"),
              makeCell(row.physician, "physician"),
              makeCell(row.sp, "sp"),
              makeCell(row.iso, "iso"),
              makeCell(row.n, "n"),
              makeCell(row.r, "r"),
              makeCell(row.t, "t"),
            makeCell(row.assist, "assist"),
            makeCell(row.fall, "fall"),
            makeCell(row.diet, "diet"),
            (() => {
              const td = document.createElement("td");
              const wrap = document.createElement("div");
              wrap.className = "quick-actions";
              const mkBtn = (icon, title, handler) => {
                const b = document.createElement("button");
                b.className = "qa-btn";
                b.innerHTML = icon;
                b.title = title;
                b.setAttribute("aria-label", title);
                b.addEventListener("click", (e) => {
                  e.stopPropagation();
                  handler();
                });
                return b;
              };
              wrap.appendChild(
                mkBtn("⟳", "Complete round", () => {
                  completeRound(row.room);
                })
              );
              wrap.appendChild(
                mkBtn("🞩", "Mark empty room", () => {
                  emptyRoom(row.room);
                })
              );
              wrap.appendChild(
                mkBtn("✎", "Open editor", () => {
                  selectedRoom = row.room;
                  openModal();
                })
              );
              td.appendChild(wrap);
              return td;
            })(),
          ];

          cells.forEach((td) => tr.appendChild(td));
          fragment.appendChild(tr);
        });
          bedBody.appendChild(fragment);
          renderStaffFairness();
          renderToiletingPriority();
          renderShowerAlertBar();
          updateNovaTasks();
          const filterActive = filterState.round !== "all" || filterState.iso || filterState.fall;
          const scaleCount = filterActive
            ? cleanRooms.length
            : rowsToRender.length || cleanRooms.length;
          autoScaleBoard(scaleCount);
          persistState();
          persistSnapshot();
          // Update summary
          if (tableSummary) {
            const metrics = NOVA_ENGINE.computeUnitMetrics(rooms);
            const strainLabel =
              metrics.staffingStrain >= 1.4
                ? "High"
                : metrics.staffingStrain >= 1.15
                ? "Moderate"
                : "Balanced";
            // Safe HTML rendering for summary (numbers only, no user input)
            if (tableSummary) {
              const due = sanitizeHTML(String(metrics.statusCounts.due));
              const critical = sanitizeHTML(String(metrics.statusCounts.critical));
              const avgNeed = sanitizeHTML(metrics.avgNeed.toFixed(1));
              const strainLabelSafe = sanitizeHTML(strainLabel);
              const careDebt = sanitizeHTML(metrics.careDebt.toFixed(1));
            tableSummary.innerHTML = `
                <span><strong>Due:</strong> ${due}</span>
                <span><strong>Critical:</strong> ${critical}</span>
                <span><strong>Avg need:</strong> ${avgNeed}</span>
                <span><strong>Staffing strain:</strong> ${strainLabelSafe}</span>
                <span><strong>Care debt:</strong> ${careDebt}</span>
              `;
            }
          }
        };

        bedBody.addEventListener("click", (e) => {
          const tr = e.target.closest("tr");
          if (!tr) return;
          selectedRoom = Number(tr.dataset.room);
          renderTable();
          if (selectionTimer) clearTimeout(selectionTimer);
          selectionTimer = setTimeout(() => {
            selectedRoom = null;
            renderTable();
          }, 5000);
        });

        const handleTableEdit = (e) => {
          const input = e.target;
          const field = input.dataset.field;
          if (!field) return;
          const tr = input.closest("tr");
          if (!tr) return;
          const room = Number(tr.dataset.room);
          const row = rooms.find((r) => r.room === room);
          if (!row) return;
          const prevPatient = row.patient;
          row[field] = input.value;
          if (field === "patient") {
            const now = Date.now();
            if (input.value && !prevPatient) {
              row.lastRoundedAt = now;
              row.roundedAgo = 0;
              row.roundingHistory = trimHistory(row.roundingHistory || []);
              row.roundingHistory.push({ ts: now, user: row.nurse || currentUser, shift: carefusionData.currentShift });
              row.justAdmittedAt = now;
              openFeedback("Rounding started", `Room ${row.room}: timer started for ${privacyMasked ? "patient" : input.value}`);
            } else if (!input.value) {
              row.lastRoundedAt = 0;
              row.roundedAgo = 0;
              row.roundingHistory = [];
              row.justAdmittedAt = 0;
            }
          }
          if (field === "nurse") renderTable();
          updateNovaTasks();
          persistState();
        };

        // Debounced version for input events (performance optimization)
        const debouncedHandleTableEdit = debounce(handleTableEdit, 300);
        bedBody.addEventListener("input", debouncedHandleTableEdit);
        bedBody.addEventListener("change", handleTableEdit);
        const completeRound = (roomNum) => {
          const row = rooms.find((r) => r.room === roomNum);
          if (!row) return;
          const now = new Date();
          const ts = Date.now();
          const meta = computeRoundMeta(row);
          const onTime = meta.ratio <= 1.1;
          row.roundTotalCount = (row.roundTotalCount || 0) + 1;
          if (onTime) {
            row.roundOnTimeCount = (row.roundOnTimeCount || 0) + 1;
            row.roundReliabilityStreak = (row.roundReliabilityStreak || 0) + 1;
            openFeedback(
              "Thanks for rounding on time",
              `Room ${roomNum}${row.patient ? " — " + (privacyMasked ? "patient" : row.patient) : ""}`
            );
          } else {
            row.roundReliabilityStreak = 0;
          }
          const hours = now.getHours();
          const minutes = now.getMinutes().toString().padStart(2, "0");
          const ampm = hours >= 12 ? "P" : "A";
          const displayHour = ((hours + 11) % 12) + 1;
          row.roundedAgo = 0;
          row.roundInterval = row.roundInterval || 60;
          row.lastRoundedAt = ts;
          row.roundingHistory = trimHistory(row.roundingHistory || []);
          row.roundingHistory.push({ ts, user: row.nurse || currentUser, shift: carefusionData.currentShift });
          row.roomReliability = row.roundOnTimeCount / Math.max(1, row.roundTotalCount);
          renderTable();
          persistState();
        };

        const emptyRoom = (roomNum) => {
          const row = rooms.find((r) => r.room === roomNum);
          if (!row) return;
          row.status = "gray";
          row.nurse = "";
          row.cna = "";
          row.patient = "";
          row.physician = "";
          row.sp = "";
          row.iso = "";
          row.n = "";
          row.r = "";
          row.t = "";
          row.assist = "";
          row.fall = "";
          row.diet = "";
          row.roundedAgo = 0;
          row.lastRoundedAt = 0;
          row.roundInterval = 60;
          row.roundState = "ok";
          row.roundDrift = 0;
          row.roundingHistory = [];
          row.roundReliabilityStreak = 0;
          row.roundTotalCount = 0;
          row.roundOnTimeCount = 0;
          row.roomReliability = 0;
          row.novaNeedHistory = [];
          row.novaPriorityScore = 0;
          row.novaSuggestedStaff = "";
          renderTable();
          persistState();
        };

        completeRoundBtn.addEventListener("click", () => {
          if (!selectedRoom) return;
          completeRound(selectedRoom);
        });
        dischargeBtn.addEventListener("click", () => {
          if (!selectedRoom) return;
          emptyRoom(selectedRoom);
        });

        // Modal setup
        const modalBackdrop = document.createElement("div");
        modalBackdrop.className = "modal-backdrop";
        modalBackdrop.innerHTML = `
          <div class="modal" role="dialog" aria-modal="true">
            <h3>Edit Assignment</h3>
            <form id="editForm">
              <div class="modal-section-label">Room &amp; Status</div>
              <label>Room
                <input name="room" class="cell-input" disabled />
              </label>
              <label>Status
                <select name="status" class="cell-input">
                  <option value="green">🟢 Stable</option>
                  <option value="yellow">🟡 Watch</option>
                  <option value="blue">🔵 New</option>
                  <option value="red">🔴 Alert</option>
                  <option value="gray">⚫ Pending</option>
                </select>
              </label>
              <label>Rounding Interval
                <input name="roundInterval" type="number" min="15" step="5" class="cell-input" placeholder="60" />
              </label>

              <div class="modal-section-label">Staff &amp; Rounding</div>
              <label>Nurse
                <input name="nurse" class="cell-input nurse-input" required placeholder="Nurse name" />
              </label>
              <label>CNA
                <input name="cna" class="cell-input" placeholder="CNA name" />
              </label>
              <label>Last Rounded (min ago)
                <input name="roundedAgo" type="number" min="0" class="cell-input" placeholder="0" />
              </label>

              <div class="modal-section-label">Patient Info</div>
              <label>Patient
                <input name="patient" class="cell-input" placeholder="Patient name" />
              </label>
              <label>Physician
                <input name="physician" class="cell-input" placeholder="Physician name" />
              </label>
              <label>Special Considerations
                <input name="sp" class="cell-input" list="spList" placeholder="🎀 Gift, 🧩 Psych, ⭐ VIP..." />
              </label>

              <div class="modal-section-label">Clinical Details</div>
              <label>Isolation
                <input name="iso" class="cell-input" list="isoList" placeholder="🟦 Contact, 🟥 Droplet..." />
              </label>
              <label>Needs
                <input name="n" class="cell-input" list="nList" placeholder="💊 Pain, 💧 IV fluids..." />
              </label>
              <label>Risks
                <input name="r" class="cell-input" list="riskList" placeholder="🛑 High fall risk..." />
              </label>

              <div class="modal-section-label">Mobility &amp; Safety</div>
              <label>Therapy / Mobility
                <select name="t" class="cell-input">
                  <option value="">— Select —</option>
                  <option value="🏃 Independent mobility">🏃 Independent</option>
                  <option value="🚶 Assist to walk">🚶 Assist to walk</option>
                  <option value="🪜 Walker assist">🪜 Walker assist</option>
                  <option value="♿ Wheelchair">♿ Wheelchair</option>
                  <option value="🏗️ Lift only / bed rest">🏗️ Lift / bed rest</option>
                  <option value="🧘 Rehab / OT">🧘 Rehab / OT</option>
                  <option value="🛏️ BRP">🛏️ BRP</option>
                </select>
              </label>
              <label>Assist Level
                <select name="assist" class="cell-input">
                  <option value="">— Select —</option>
                  <option value="🚶 Walking assist">🚶 Walking</option>
                  <option value="🤝 Standby assist">🤝 Standby</option>
                  <option value="🔄 Transfer assist">🔄 Transfer</option>
                  <option value="🏗️ Lift required">🏗️ Lift required</option>
                  <option value="♿ Wheelchair transport">♿ Wheelchair</option>
                </select>
              </label>
              <label>Fall Risk
                <select name="fall" class="cell-input">
                  <option value="">— Select —</option>
                  <option value="⭐ Low risk">⭐ Low</option>
                  <option value="⚠️ Moderate risk">⚠️ Moderate</option>
                  <option value="🛑 High risk">🛑 High</option>
                  <option value="🔔 Bed alarm">🔔 Bed alarm</option>
                  <option value="✨ Monitor closely">✨ Monitor</option>
                </select>
              </label>

              <div class="modal-section-label">Nutrition</div>
              <label>Diet
                <select name="diet" class="cell-input">
                  <option value="">— Select —</option>
                  <option value="🍽️ Regular">🍽️ Regular</option>
                  <option value="❤️ Cardiac">❤️ Cardiac</option>
                  <option value="🥣 Pureed">🥣 Pureed</option>
                  <option value="🍲 Soft">🍲 Soft</option>
                  <option value="🧊 Clear liquids">🧊 Clear liquids</option>
                  <option value="🚫 NPO">🚫 NPO</option>
                </select>
              </label>

              <div class="actions">
                <button type="button" class="action-btn secondary" id="closeModal">Cancel</button>
                <button type="submit" class="action-btn">Save</button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(modalBackdrop);

        const editForm = modalBackdrop.querySelector("#editForm");
        const closeModalBtn = modalBackdrop.querySelector("#closeModal");

        const openModal = () => {
          if (!selectedRoom) return;
          const row = rooms.find((r) => r.room === selectedRoom);
          if (!row) return;
          Object.keys(row).forEach((key) => {
            const input = editForm.elements.namedItem(key);
            if (input) {
              input.value = row[key] || "";
            }
          });
          modalBackdrop.style.display = "flex";
        };

        const closeModal = () => {
          modalBackdrop.style.display = "none";
        };

        openEditorBtn.addEventListener("click", openModal);
        togglePrivacyBtn.addEventListener("click", () => {
          privacyMasked = !privacyMasked;
          togglePrivacyBtn.textContent = privacyMasked
            ? "Privacy on"
            : "Privacy off";
          renderTable();
        });
        closeModalBtn.addEventListener("click", closeModal);
        modalBackdrop.addEventListener("click", (e) => {
          if (e.target === modalBackdrop) closeModal();
        });

        // Assignment Fluidity modal
        const assignmentBackdrop = document.createElement("div");
        assignmentBackdrop.className = "modal-backdrop";
        assignmentBackdrop.innerHTML = `
          <div class="modal" role="dialog" aria-modal="true">
            <div id="carefusion-app"></div>
            <div class="actions">
              <button type="button" class="action-btn secondary" id="closeAssignment">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(assignmentBackdrop);
        const closeAssignmentBtn = assignmentBackdrop.querySelector("#closeAssignment");
        assignmentInfoBtn.addEventListener("click", () => {
          assignmentBackdrop.style.display = "flex";
          renderCarefusion();
          runCarefusionAssignment();
        });
        closeAssignmentBtn.addEventListener("click", () => {
          assignmentBackdrop.style.display = "none";
        });
        assignmentBackdrop.addEventListener("click", (e) => {
          if (e.target === assignmentBackdrop) assignmentBackdrop.style.display = "none";
        });


        // NOVA overview modal
        const novaBackdrop = document.createElement("div");
        novaBackdrop.className = "modal-backdrop";
        novaBackdrop.innerHTML = `
          <div class="modal" role="dialog" aria-modal="true">
            <div class="nova-section">
              <h3>NOVA: Dynamic Needs-Driven Orchestration</h3>
              <p style="margin:0 0 6px; color:#47566f;">From hourly/manual/siloed rounding to adaptive, team-wide coordination.</p>
              <div class="nova-grid">
                <div class="nova-card">
                  <h4>1) Needs-Driven Rounding Engine™</h4>
                  <ul>
                    <li>Pain/mobility/toileting/call-light/fall/pressure/emotional signals</li>
                    <li>Adaptive rounding windows per patient</li>
                  </ul>
                </div>
                <div class="nova-card">
                  <h4>2) Whole-Team Visibility Grid™</h4>
                  <ul>
                    <li>Who was rounded / due / overdue</li>
                    <li>Who can help now, who’s closest/available</li>
                  </ul>
                </div>
                <div class="nova-card">
                  <h4>3) CareFusion™ Assignment</h4>
                  <ul>
                    <li>Availability, fatigue, proximity, skills, risk priority</li>
                    <li>Fluid distribution to level workload</li>
                  </ul>
                </div>
                <div class="nova-card">
                  <h4>4) Predictive Safety Alerts</h4>
                  <ul>
                    <li>Early warnings: unassisted get-up, falls, pain return, toileting, pressure</li>
                  </ul>
                </div>
                <div class="nova-card">
                  <h4>5) Silent Coordination Layer</h4>
                  <ul>
                    <li>Rounds → board/mobile update → doc autofill</li>
                    <li>No alarms or interruptions</li>
                  </ul>
                </div>
                <div class="nova-card">
                  <h4>6) Care Quality Ledger™</h4>
                  <ul>
                    <li>Risk reduction, reliability, fall prevention wins</li>
                    <li>Staffing patterns, predictive accuracy, recommended workflow changes</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="actions">
              <button type="button" class="action-btn secondary" id="closeNova">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(novaBackdrop);
        const closeNovaBtn = novaBackdrop.querySelector("#closeNova");
        novaOverviewBtn.addEventListener("click", () => {
          novaBackdrop.style.display = "flex";
        });
        closeNovaBtn.addEventListener("click", () => {
          novaBackdrop.style.display = "none";
        });
        novaBackdrop.addEventListener("click", (e) => {
          if (e.target === novaBackdrop) novaBackdrop.style.display = "none";
        });


        // On-time rounds modal
        const onTimeBackdrop = document.createElement("div");
        onTimeBackdrop.className = "modal-backdrop";
        onTimeBackdrop.innerHTML = `
          <div class="modal modal-md" role="dialog" aria-modal="true">
            <h3>On-time Rounding</h3>
            <div id="onTimeBody" class="modal-body"></div>
            <div class="actions">
              <button type="button" class="action-btn secondary" id="closeOnTime">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(onTimeBackdrop);
        const closeOnTimeBtn = onTimeBackdrop.querySelector("#closeOnTime");
        const onTimeBody = onTimeBackdrop.querySelector("#onTimeBody");

        const renderOnTimeModal = () => {
          if (!onTimeBody) return;
          const rows = rooms
            .filter((r) => r.patient)
            .map((r) => {
              const hist = normalizeHistory(r.roundingHistory || []);
              const lastRounded = hist.length ? new Date(hist[hist.length - 1].ts) : null;
              const last3 = hist.slice(-3).map((h) => new Date(h.ts));
              return {
                room: r.room,
                patient: r.patient,
                onTime: r.novaOnTimePct ?? 0,
                state: r.roundState || "ok",
                lastRounded,
                last3,
              };
            })
            .sort((a, b) => b.onTime - a.onTime);

          const rowsHtml = rows
            .map((r) => {
              const lastRounded = r.lastRounded ? r.lastRounded.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "N/A";
              const last3 = r.last3.length
                ? r.last3.map((d) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })).join(", ")
                : "No rounds logged";
              const stateLabel = r.state === "critical" ? "Critical" : r.state === "due" ? "Due" : r.state === "soon" ? "Soon" : "OK";
              return `
                <div style="padding:6px 0; border-bottom:1px solid #e5eaf3;">
                  <div><strong>Room ${r.room}</strong> — ${r.patient}</div>
                  <div>On-time: <strong>${r.onTime}%</strong> · State: ${stateLabel}</div>
                  <div>Last rounded: ${lastRounded}</div>
                  <div>Last 3 rounds: ${last3}</div>
                </div>
              `;
            })
            .join("");

          onTimeBody.innerHTML = rowsHtml || "<div>No patients available.</div>";
        };

        onTimeBtn.addEventListener("click", () => {
          renderOnTimeModal();
          onTimeBackdrop.style.display = "flex";
        });
        closeOnTimeBtn.addEventListener("click", () => {
          onTimeBackdrop.style.display = "none";
        });
        onTimeBackdrop.addEventListener("click", (e) => {
          if (e.target === onTimeBackdrop) onTimeBackdrop.style.display = "none";
        });

        // FallWatch modal
        const fallsBackdrop = document.createElement("div");
        fallsBackdrop.className = "modal-backdrop";
        fallsBackdrop.innerHTML = `
          <div class="modal modal-md" role="dialog" aria-modal="true">
            <h3>NOVA FallWatch™</h3>
            <div id="fallsBody" class="modal-body scroll"></div>
            <div class="actions">
              <button type="button" class="action-btn" id="printFallHotspots">Print fall hotspots</button>
              <button type="button" class="action-btn secondary" id="closeFalls">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(fallsBackdrop);
        const closeFallsBtn = fallsBackdrop.querySelector("#closeFalls");
        const printFallsBtn = fallsBackdrop.querySelector("#printFallHotspots");
        const fallsBody = fallsBackdrop.querySelector("#fallsBody");

        const computeFallAnalytics = () => {
          const active = rooms.filter((r) => r.patient);
          const result = {
            total: active.length,
            high: [],
            moderate: [],
            low: [],
            none: [],
            lift: [],
            overdueHigh: [],
            soonHigh: [],
            isoHigh: [],
            pressureScore: 0,
            hotspots: [],
            hotspotsAll: [],
            focus: [],
          };

          active.forEach((r) => {
            const fallLevel = classifyFallLevel(r);
            const assistLevel = classifyAssistLevel(r);
            const state = r.roundState || "ok";
            const notes = (r.n || r.notes || "").toLowerCase();
            const rounded = {
              room: r.room,
              patient: r.patient,
              assist: assistLevel,
              state,
              nurse: r.nurse,
              fall: r.fall,
              drift: r.roundDrift || 0,
            };
            result[fallLevel === "none" ? "none" : fallLevel].push(rounded);
            if (assistLevel === "lift" || assistLevel === "wheelchair") {
              result.lift.push(rounded);
            }
            if (fallLevel === "high" && (state === "due" || state === "critical")) {
              result.overdueHigh.push(rounded);
            }
            if (fallLevel === "high" && state === "soon") {
              result.soonHigh.push(rounded);
            }
            if (fallLevel === "high" && (r.iso || "").trim()) {
              result.isoHigh.push(rounded);
            }

            // hotspot / pressure scoring
            let score = 0;
            if (fallLevel === "high") score += 40;
            else if (fallLevel === "moderate") score += 22;
            if (assistLevel === "lift") score += 15;
            else if (assistLevel === "wheelchair") score += 10;
            else if (assistLevel === "assist") score += 6;
            if (state === "critical") score += 18;
            else if (state === "due") score += 12;
            else if (state === "soon") score += 6;
            if (notes.includes("restroom") || notes.includes("toilet") || notes.includes("bathroom")) score += 6;
            if (notes.includes("confused") || notes.includes("dizzy") || notes.includes("unsteady")) score += 8;

            result.hotspots.push({ ...rounded, score });
            if (fallLevel === "high" || fallLevel === "moderate") {
              result.pressureScore += score;
            }
          });

          const maxPossible = Math.max(100, result.total * 50);
          const pressurePct = Math.min(100, Math.round((result.pressureScore / maxPossible) * 100));
          result.pressure = pressurePct;

          result.hotspotsAll = result.hotspots
            .slice()
            .sort((a, b) => b.score - a.score);
          result.hotspots = result.hotspotsAll.slice(0, 5);

          // Next hour focus: pick top 3 with overdue/soon and high risk
          result.focus = result.hotspots
            .filter((h) => h.state !== "ok")
            .slice(0, 3)
            .map((h) => ({
              room: h.room,
              patient: h.patient,
              action:
                h.state === "critical" || h.state === "due"
                  ? "Immediate safety round and toileting check"
                  : "Check-in within the hour for mobility and re-education",
            }));

          return result;
        };

        const renderFallsModal = () => {
          if (!fallsBody) return;
          NOVA_ENGINE.updateAll(rooms);
          const data = computeFallAnalytics();
          const pct = (count) => (data.total ? Math.round((count / data.total) * 100) : 0);

          const riskCard = (label, count, color) => `
            <div class="cf-card" style="background:${color}; border:1px solid #dfe6f2; padding:10px; border-radius:10px; flex:1; min-width:140px;">
              <div style="font-weight:800; color:#10356b; font-size:13px;">${label}</div>
              <div style="font-size:13px; color:#0b3f78;"><strong>${count}</strong> patients · ${pct(count)}%</div>
            </div>
          `;

          const listRooms = (arr) =>
            arr.length
              ? arr.map((r) => `Room ${r.room}${r.patient ? " – " + r.patient : ""}`).join(", ")
              : "None";

          const pressureLabel =
            data.pressure >= 75 ? "High" : data.pressure >= 50 ? "Moderate" : "Low";

          const recs = [];
          if (data.overdueHigh.length) {
            recs.push(
              `Prioritize immediate rounding on high fall-risk rooms: ${listRooms(data.overdueHigh)}.`
            );
          }
          if (data.lift.length >= 2) {
            recs.push(
              `Ensure lift/wheelchair assist is available for: ${listRooms(
                data.lift
              )}. Pair staff for transfers.`
            );
          }
          if (data.soonHigh.length) {
            recs.push(
              `Tighten rounding windows for high-risk (due soon): ${listRooms(data.soonHigh)}.`
            );
          }
          if (data.high.length >= 3) {
            recs.push(
              "Overall fall risk is elevated. Consider a quick team huddle to review fall precautions."
            );
          }
          if (!recs.length) {
            recs.push("Fall risk is stable. Maintain standard rounding rhythm and call-light education.");
          }

          const hotspotList =
            data.hotspots.length === 0
              ? "<div class='cf-desc'>No hotspots detected.</div>"
              : data.hotspots
                  .map(
                    (h) => `
                  <div class="cf-row" style="border-bottom:1px solid #eef1f7;">
                    <span><strong>Room ${h.room}</strong> ${h.patient ? "– " + h.patient : ""}</span>
                    <span class="cf-chip">${h.fall || "Risk"} · ${h.assist}</span>
                  </div>`
                  )
                  .join("");

          const focusList =
            data.focus.length === 0
              ? "<div class='cf-desc'>No immediate focus items.</div>"
              : data.focus
                  .map(
                    (f) => `
                    <div class="cf-item" style="padding:6px 0; border-bottom:1px solid #eef1f7;">
                      <div><strong>Room ${f.room}</strong> ${f.patient ? "– " + f.patient : ""}</div>
                      <div style="color:#47566f;">${f.action}</div>
                    </div>`
                  )
                  .join("");

          const assistBreakdown = (() => {
            const buckets = {
              lift: data.lift.length,
              wheelchair: data.hotspots.filter((h) => h.assist === "wheelchair").length,
              assist: data.hotspots.filter((h) => h.assist === "assist").length,
              independent: data.hotspots.filter((h) => h.assist === "independent").length,
            };
            return `
              <div class="cf-row"><span>Lift required</span><span class="cf-chip">${buckets.lift}</span></div>
              <div class="cf-row"><span>Wheelchair</span><span class="cf-chip">${buckets.wheelchair}</span></div>
              <div class="cf-row"><span>Assist / standby</span><span class="cf-chip">${buckets.assist}</span></div>
              <div class="cf-row"><span>Independent</span><span class="cf-chip">${buckets.independent}</span></div>
            `;
          })();

          fallsBody.innerHTML = `
            <div class="info-note">
              FallWatch™ surfaces risk, rounding pressure, and action steps to prevent falls in the next hour.
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
              ${riskCard("High risk", data.high.length, "#ffeaea")}
              ${riskCard("Moderate risk", data.moderate.length, "#fff6e5")}
              ${riskCard("Low / None", data.low.length + data.none.length, "#e8f7ee")}
            </div>
            <div class="cf-card" style="margin-bottom:10px;">
              <div class="cf-subtitle">FallWatch Radar</div>
              <div class="cf-desc">Unit fall pressure based on risk, assist needs, and rounding status.</div>
              <div class="cf-row" style="align-items:center;">
                <span>Pressure: <strong>${data.pressure}%</strong> (${pressureLabel})</span>
                <div class="cf-bar" style="flex:1; margin-left:8px;"><div style="width:${data.pressure}%;"></div></div>
              </div>
            </div>
            <div class="cf-card" style="margin-bottom:10px;">
              <div class="cf-subtitle">Fall Risk Breakdown</div>
              <div class="cf-desc">Where risk concentrates by assist level, rounding, and isolation.</div>
              ${assistBreakdown}
              <div class="cf-row"><span>High risk + overdue/critical</span><span class="cf-chip ${data.overdueHigh.length ? "danger" : ""}">${data.overdueHigh.length}</span></div>
              <div class="cf-row"><span>High risk + due soon</span><span class="cf-chip">${data.soonHigh.length}</span></div>
              <div class="cf-row"><span>High risk + isolation</span><span class="cf-chip">${data.isoHigh.length}</span></div>
            </div>
            <div class="cf-card" style="margin-bottom:10px;">
              <div class="cf-subtitle">NOVA Fall Hotspots™</div>
              ${hotspotList}
            </div>
            <div class="cf-card" style="margin-bottom:10px;">
              <div class="cf-subtitle">Next Hour Fall Focus</div>
              ${focusList}
            </div>
            <div class="cf-card">
              <div class="cf-subtitle">Recommendations</div>
              <ul style="margin:6px 0 0 16px; color:#10356b;">
                ${recs.map((r) => `<li>${r}</li>`).join("")}
              </ul>
            </div>
          `;
        };

        const openFallHotspotsPrint = (data) => {
          const now = new Date();
          const stamp = now.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
          let hotspotRows = (data.hotspotsAll || data.hotspots || []).length
            ? (data.hotspotsAll || data.hotspots || [])
            : [];
          if (!hotspotRows.length) {
            const scoreRow = (row, assistLevel, state) => {
              const fallLevel = classifyFallLevel(row);
              const notes = (row.n || row.notes || "").toLowerCase();
              let score = 0;
              if (fallLevel === "high") score += 40;
              else if (fallLevel === "moderate") score += 22;
              if (assistLevel === "lift") score += 15;
              else if (assistLevel === "wheelchair") score += 10;
              else if (assistLevel === "assist") score += 6;
              if (state === "critical") score += 18;
              else if (state === "due") score += 12;
              else if (state === "soon") score += 6;
              if (notes.includes("restroom") || notes.includes("toilet") || notes.includes("bathroom")) score += 6;
              if (notes.includes("confused") || notes.includes("dizzy") || notes.includes("unsteady")) score += 8;
              return score;
            };
            hotspotRows = rooms
              .filter((r) => r && r.room)
              .map((r) => {
                const assistLevel = classifyAssistLevel(r);
                const state = r.roundState || "ok";
                return {
                  room: r.room,
                  patient: r.patient,
                  fall: r.fall,
                  assist: assistLevel,
                  state,
                  score: scoreRow(r, assistLevel, state),
                };
              })
              .sort((a, b) => (b.score || 0) - (a.score || 0));
          }
          const rows =
            hotspotRows.length === 0
              ? `<tr><td colspan="6">No hotspots detected.</td></tr>`
              : hotspotRows
                  .map(
                    (h) => `
                      <tr>
                        <td>Room ${h.room ?? "—"}</td>
                        <td>${privacyMasked ? "Protected" : h.patient || "—"}</td>
                        <td>${h.fall || "Risk"}</td>
                        <td>${h.assist}</td>
                        <td>${h.state || "ok"}</td>
                        <td>${Math.round(h.score || 0)}</td>
                      </tr>
                    `
                  )
                  .join("");

          const win = window.open("", "_blank", "width=900,height=700");
          if (!win) return;
          win.document.write(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <title>Fall Hotspots</title>
                <style>
                  body { font-family: "Inter", Arial, sans-serif; color: #0f2742; padding: 24px; }
                  h1 { margin: 0 0 4px; font-size: 22px; }
                  .meta { color: #5b6b7a; font-size: 12px; margin-bottom: 16px; }
                  .actions { margin: 10px 0 16px; }
                  .btn { background: #1b6fd9; color: #fff; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
                  table { width: 100%; border-collapse: collapse; font-size: 12px; }
                  th, td { border: 1px solid #dbe5f0; padding: 8px; text-align: left; }
                  th { background: #eef4ff; color: #0d3b73; }
                  @media print { .actions { display: none; } }
                </style>
              </head>
              <body>
                <h1>NOVA Fall Hotspots</h1>
                <div class="meta">Generated ${stamp}</div>
                <div class="actions"><button class="btn" id="printBtn">Print</button></div>
                <table>
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Patient</th>
                      <th>Risk</th>
                      <th>Assist</th>
                      <th>Rounding</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
                <scr` + `ipt>
                  document.getElementById("printBtn").addEventListener("click", () => window.print());
                </scr` + `ipt>
              </body>
            </html>
          `);
          win.document.close();
          win.focus();
        };

        // More dropdown toggle
        if (moreActionsBtn && moreMenu) {
        moreActionsBtn.addEventListener("click", () => {
          const isOpen = moreMenu.style.display === "block";
          moreMenu.style.display = isOpen ? "none" : "block";
        });
        document.addEventListener("click", (e) => {
          if (!moreMenu.contains(e.target) && e.target !== moreActionsBtn) {
            moreMenu.style.display = "none";
          }
        });
          // Falls modal wiring
          if (fallsBtn) {
            fallsBtn.addEventListener("click", () => {
              renderFallsModal();
              fallsBackdrop.style.display = "flex";
            });
          }
          if (closeFallsBtn) {
            closeFallsBtn.addEventListener("click", () => {
              fallsBackdrop.style.display = "none";
            });
          }
          if (printFallsBtn) {
            printFallsBtn.addEventListener("click", () => {
              NOVA_ENGINE.updateAll(rooms);
              const data = computeFallAnalytics();
              openFallHotspotsPrint(data);
            });
          }
          fallsBackdrop.addEventListener("click", (e) => {
            if (e.target === fallsBackdrop) fallsBackdrop.style.display = "none";
          });
        }

        // Priority queue modal
        const priorityBackdrop = document.createElement("div");
        priorityBackdrop.className = "modal-backdrop";
        priorityBackdrop.innerHTML = `
          <div class="modal modal-xl" role="dialog" aria-modal="true">
            <h3>NOVA Priority Queue</h3>
            <p class="modal-note">Ordered list of patients who likely need attention next, based on NOVA need, fall risk, and rounding drift.</p>
            <div id="priorityBody" class="modal-body scroll"></div>
            <div class="actions">
              <button type="button" class="action-btn secondary" id="closePriority">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(priorityBackdrop);
        const priorityBody = priorityBackdrop.querySelector("#priorityBody");
        const closePriorityBtn = priorityBackdrop.querySelector("#closePriority");
        const buildRecommendedAction = (row) => {
          const fallLevel = classifyFallLevel(row);
          if (row.roundState === "critical" || row.roundState === "due") return "Immediate safety + rounding check";
          if (fallLevel === "high") return "Fall safety + toileting round";
          if ((row.novaMobilityScore || 0) >= 70) return "Mobility + toileting round";
          if ((row.novaComfortScore || 0) >= 60) return "Comfort/pain reassessment";
          if ((row.novaToiletScore || 0) >= 60) return "Toileting cadence check";
          return "Check-in and reinforce plan";
        };
        const buildRiskFlags = (row) => {
          const flags = [];
          if (row.fall) flags.push(row.fall);
          if (row.assist) flags.push(row.assist);
          const notes = (row.n || "").toLowerCase();
          if (notes.includes("confus") || notes.includes("psych")) flags.push("Confusion");
          return flags.join(" • ");
        };
        const renderPriorityQueue = () => {
          if (!priorityBody) return;
          NOVA_ENGINE.updateAll(rooms);
          updateNovaTasks();
          const queue = novaState.tasks;
          if (!queue.length) {
            priorityBody.innerHTML = "<div class='cf-desc'>No active patients to rank.</div>";
            return;
          }
          const rowsHtml = queue
            .map((task, idx) => {
              const r = task.ref || task;
              const driftPct = Math.round((task.roundDrift || 0) * 100);
              const suggested = task.suggestedStaff || r.novaSuggestedStaff || r.nurse || r.cna || "Unassigned";
              const badge = task.critical ? `<span class="cf-chip danger">Critical</span>` : "";
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${task.room}</td>
                  <td>${privacyMasked ? "Protected" : task.patient || "—"}</td>
                  <td>${Math.round(task.need || 0)}</td>
                  <td>${driftPct}%</td>
                  <td>${buildRiskFlags(r)} ${badge}</td>
                  <td>${task.taskType || buildRecommendedAction(r)}</td>
                  <td>${suggested}</td>
                  <td><button class="qa-btn" data-focus="${task.room}">Focus</button></td>
                </tr>
              `;
            })
            .join("");
          priorityBody.innerHTML = `
            <div class="cf-desc" style="margin-bottom:6px;">Use this list to decide who to see next. Updated ${novaState.updatedAt ? new Date(novaState.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "just now"}.</div>
            <table class="priority-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Room</th>
                  <th>Patient</th>
                  <th>Need</th>
                  <th>Drift</th>
                  <th>Risk flags</th>
                  <th>Recommended action</th>
                  <th>Suggested staff</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          `;
          priorityBody.querySelectorAll("button[data-focus]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const roomNum = Number(btn.dataset.focus);
              if (roomNum) {
                selectedRoom = roomNum;
                renderTable();
              }
              priorityBackdrop.style.display = "none";
            });
          });
        };
        if (priorityQueueBtn) {
          priorityQueueBtn.addEventListener("click", () => {
            renderPriorityQueue();
            priorityBackdrop.style.display = "flex";
          });
        }
        if (closePriorityBtn) {
          closePriorityBtn.addEventListener("click", () => {
            priorityBackdrop.style.display = "none";
          });
        }
        priorityBackdrop.addEventListener("click", (e) => {
          if (e.target === priorityBackdrop) priorityBackdrop.style.display = "none";
        });

        // Handoff modal
        const handoffBackdrop = document.createElement("div");
        handoffBackdrop.className = "modal-backdrop";
        handoffBackdrop.innerHTML = `
          <div class="modal modal-xl" role="dialog" aria-modal="true">
            <h3>Shift Handoff View</h3>
            <div id="handoffBody" class="modal-body scroll"></div>
            <div class="actions">
              <button type="button" class="action-btn secondary" id="copyHandoff">Copy all</button>
              <button type="button" class="action-btn secondary" id="closeHandoff">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(handoffBackdrop);
        const handoffBody = handoffBackdrop.querySelector("#handoffBody");
        const closeHandoffBtn = handoffBackdrop.querySelector("#closeHandoff");
        const buildFocusLine = (row) => {
          const channels = [
            { key: "novaFallScore", label: "Falls" },
            { key: "novaMobilityScore", label: "Mobility" },
            { key: "novaToiletScore", label: "Toileting" },
            { key: "novaComfortScore", label: "Comfort" },
          ];
          const top = channels.sort((a, b) => (row[b.key] || 0) - (row[a.key] || 0))[0];
          if (!top || !row[top.key]) return "Maintain standard rounding rhythm.";
          if (top.key === "novaFallScore") return "Focus on toileting and safe mobility within 60-minute windows.";
          if (top.key === "novaMobilityScore") return "Plan mobility + reposition checks this shift.";
          if (top.key === "novaToiletScore") return "Prioritize toileting cadence and quick response to call lights.";
          return "Comfort check-ins and reassurance every round.";
        };
        const buildSBARBullets = (r) => {
          const fallLevel = classifyFallLevel(r);
          const riskParts = [];
          if (fallLevel === "high") riskParts.push("high fall risk");
          if (r.assist) riskParts.push(r.assist);
          if (r.iso) riskParts.push(`iso: ${r.iso}`);
          const situation = `Situation: ${riskParts.length ? riskParts.join(", ") : "standard precautions"}.`;
          const rhythm =
            r.roundReliabilityStreak && r.roundReliabilityStreak >= 3
              ? "on time"
              : r.roundDrift > 1
              ? "drifting"
              : "steady";
          const background = `Background: Rounding is ${rhythm}; streak ${r.roundReliabilityStreak || 0}.`;
          const comfortTrend =
            (r.novaComfortScore || 0) >= 70 ? "worse" : (r.novaComfortScore || 0) <= 30 ? "improving" : "stable";
          const assessment = `Assessment: Comfort ${comfortTrend}; toileting ${r.novaToiletScore >= 60 ? "frequent" : "routine"}.`;
          const recFocus =
            (r.novaMobilityScore || 0) >= 70
              ? "mobility with assist/lift"
              : (r.novaToiletScore || 0) >= 60
              ? "toileting every 60m"
              : (r.novaComfortScore || 0) >= 60
              ? "comfort/pain check-ins"
              : "standard cadence";
          const recommendation = `Recommendation: Next shift focus — ${recFocus}; watch fall risk.`;
          return [situation, background, assessment, recommendation];
        };
        const renderHandoffView = () => {
          if (!handoffBody) return;
          NOVA_ENGINE.updateAll(rooms);
          const sorted = rooms
            .filter((r) => r.patient)
            .map((r) => ({ ...r, combined: (r.novaPriorityScore || 0) * 0.6 + (r.novaNeedScore || 0) * 0.4 }))
            .sort((a, b) => b.combined - a.combined);
          if (!sorted.length) {
            handoffBody.innerHTML = "<div class='cf-desc'>No patients to include.</div>";
            return;
          }
          const blocks = [];
          const content = sorted
            .map((r) => {
              const bullets = buildSBARBullets(r);
              blocks.push(
                `Room ${r.room} — ${privacyMasked ? "Protected" : r.patient || "—"}\n${bullets
                  .map((b) => `• ${b}`)
                  .join("\n")}`
              );
              return `
                <div class="info-card" style="margin:6px 0;">
                  <h3 style="margin:0 0 6px;">Room ${r.room} — ${privacyMasked ? "Protected" : r.patient || "—"}</h3>
                  <ul style="margin:0 0 4px 18px; color:#10356b;">
                    ${bullets.map((b) => `<li>${b}</li>`).join("")}
                  </ul>
                </div>
              `;
            })
            .join("");
          handoffBody.innerHTML = content;
          handoffBody.dataset.clipboard = blocks.join("\n\n");
        };
        if (handoffBtn) {
          handoffBtn.addEventListener("click", () => {
            renderHandoffView();
            handoffBackdrop.style.display = "flex";
          });
        }
        if (closeHandoffBtn) {
          closeHandoffBtn.addEventListener("click", () => {
            handoffBackdrop.style.display = "none";
          });
        }
        handoffBackdrop.addEventListener("click", (e) => {
          if (e.target === handoffBackdrop) handoffBackdrop.style.display = "none";
        });
        const copyHandoffBtn = handoffBackdrop.querySelector("#copyHandoff");
        if (copyHandoffBtn) {
          copyHandoffBtn.addEventListener("click", async () => {
            const text = handoffBody?.dataset?.clipboard || handoffBody?.innerText || "";
            try {
              await navigator.clipboard.writeText(text);
              copyHandoffBtn.textContent = "Copied!";
              setTimeout(() => {
                copyHandoffBtn.textContent = "Copy all";
              }, 1200);
            } catch (err) {
              copyHandoffBtn.textContent = "Copy failed";
              setTimeout(() => {
                copyHandoffBtn.textContent = "Copy all";
              }, 1200);
            }
          });
        }

        editForm.addEventListener("submit", (e) => {
          e.preventDefault();
          if (!selectedRoom) return;
          const row = rooms.find((r) => r.room === selectedRoom);
          if (!row) return;
          Array.from(editForm.elements).forEach((el) => {
            if (!el.name || el.name === "room") return;
            if (el.name === "roundedAgo" || el.name === "roundInterval") {
              row[el.name] = Number(el.value) || 0;
            } else {
              row[el.name] = el.value;
            }
          });
          closeModal();
          renderTable();
          persistState();
        });

        togglePrivacyBtn.textContent = "Privacy on";
        ensureStateIntegrity();
        renderTable();

        const renderList = (rows, target, fields) => {
          if (!target) return;
          target.innerHTML = "";
          const fragment = document.createDocumentFragment();
          rows.forEach((row, idx) => {
            const tr = document.createElement("tr");
            fields.forEach((field) => {
              const td = document.createElement("td");
              const input = document.createElement("input");
              input.className = "cell-input";
              input.value = row[field] || "";
              input.dataset.idx = idx;
              input.dataset.field = field;
              td.appendChild(input);
              tr.appendChild(td);
            });
            fragment.appendChild(tr);
          });
          target.appendChild(fragment);
        };

        const wireList = (target, rows) => {
          if (!target) return;
          target.addEventListener("input", (e) => {
            const input = e.target;
            const idx = Number(input.dataset.idx);
            const field = input.dataset.field;
            if (!Number.isInteger(idx) || !field) return;
            rows[idx][field] = input.value;
            persistState();
          });
        };

        renderList(appointments, apptBody, ["room", "time", "pickup"]);
        renderShowers();
        renderShowerAlertBar();
        renderList(codeTeam, document.getElementById("codeBody"), [
          "role",
          "assigned",
        ]);
        wireList(apptBody, appointments);
        wireList(document.getElementById("codeBody"), codeTeam);
        if (showerBody) {
          showerBody.addEventListener("input", (e) => {
            const input = e.target;
            const idx = Number(input.dataset.idx);
            const field = input.dataset.field;
            if (!Number.isInteger(idx) || !field) return;
            showers[idx][field] = input.value;
            if (field === "last") {
              const ts = Date.parse(input.value);
              if (!Number.isNaN(ts)) {
                const suggested = new Date(ts + MIN_SHOWER_MS).toISOString().slice(0, 10);
                const nextTs = Date.parse(showers[idx].next || "");
                if (Number.isNaN(nextTs) || nextTs < ts) {
                  showers[idx].next = suggested;
                }
              }
            }
            if (field === "next" && showers[idx].last) {
              const lastTs = Date.parse(showers[idx].last);
              const nextTs = Date.parse(showers[idx].next || "");
              if (!Number.isNaN(lastTs) && !Number.isNaN(nextTs) && nextTs < lastTs + MIN_SHOWER_MS) {
                showers[idx].next = new Date(lastTs + MIN_SHOWER_MS).toISOString().slice(0, 10);
              }
            }
            renderShowers();
            renderShowerAlertBar();
            renderTable();
            updateCounts();
            persistState();
          });
        }
        if (showerModalBtn) {
          showerModalBtn.addEventListener("click", () => {
            renderShowerModal();
            showerBackdrop.style.display = "flex";
          });
        }

        const updateCounts = () => {
          const apptCountEl = document.getElementById("apptCount");
          const codeCountEl = document.getElementById("codeCount");
          const showerCountEl = document.getElementById("showerCount");
          if (apptCountEl) apptCountEl.textContent = `(${appointments.length})`;
          if (codeCountEl) codeCountEl.textContent = `(${codeTeam.length})`;
          if (showerCountEl) {
            const overdue = computeShowerAlerts().overdue;
            showerCountEl.textContent = `(${showers.length}${overdue ? " • ⚠️" : ""})`;
          }
          if (toiletPriorityCount) {
            const count = document.getElementById("toiletPriorityBody")?.childElementCount || 0;
            toiletPriorityCount.textContent = count ? `(${count})` : "";
          }
        };

        // Quiet Safety modal
        const quietBackdrop = document.createElement("div");
        quietBackdrop.className = "modal-backdrop";
        quietBackdrop.innerHTML = `
          <div class="modal modal-tight" role="dialog" aria-modal="true">
            <h3>Quiet Safety – Alarm Debt</h3>
            <div id="quietBody" class="modal-body"></div>
            <div class="actions">
              <button type="button" class="action-btn secondary" id="closeQuiet">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(quietBackdrop);
        const quietBody = quietBackdrop.querySelector("#quietBody");
        const closeQuietBtn = quietBackdrop.querySelector("#closeQuiet");
        const renderQuietSafety = () => {
          NOVA_ENGINE.updateAll(rooms);
          const metrics = NOVA_ENGINE.computeUnitMetrics(rooms);
          const onTimePct = Math.round((metrics.onTimePct || 0) * 100);
          const careDebt = (metrics.careDebt || 0).toFixed(1);
          const silentSaves = metrics.silentSaves || 0;
          const alarmReduction = Math.round((silentSaves || 0) * 1.2);
          quietBody.innerHTML = `
            <div class="info-note" style="margin:0 0 8px;">
              NOVA flags drift and risk visually so fewer audible alarms are needed. Quiet Safety = less noise, more protection.
            </div>
            <div><strong>Silent saves:</strong> ${silentSaves} likely alarms avoided this shift.</div>
            <div><strong>Alarm reduction estimate:</strong> ~${alarmReduction} bed exit / call light alarms prevented.</div>
            <div><strong>On-time rounds:</strong> ${onTimePct}%</div>
            <div><strong>Care debt:</strong> ${careDebt} equivalent overdue rounds.</div>
            <div style="margin-top:6px; color:#47566f;">Quiet safety reduces alarm fatigue and keeps attention on the right patients.</div>
          `;
        };


        // Playbook modal
        const playbookBackdrop = document.createElement("div");
        playbookBackdrop.className = "modal-backdrop";
        playbookBackdrop.innerHTML = `
          <div class="modal modal-md" role="dialog" aria-modal="true">
            <h3>NOVA Playbook Suggestions</h3>
            <div id="playbookBody" class="modal-body scroll"></div>
            <div class="actions">
              <button type="button" class="action-btn secondary" id="closePlaybook">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(playbookBackdrop);
        const playbookBody = playbookBackdrop.querySelector("#playbookBody");
        const closePlaybookBtn = playbookBackdrop.querySelector("#closePlaybook");


        const buildPlaybookSuggestions = () => {
          NOVA_ENGINE.updateAll(rooms);
          const metrics = NOVA_ENGINE.computeUnitMetrics(rooms);
          const radar = NOVA_ENGINE.computeRadar(rooms);
          const active = rooms.filter((r) => r.patient);
          const highMobilityShare =
            active.length ? active.filter((r) => (r.novaMobilityScore || 0) >= 70).length / active.length : 0;
          const highRiskPerRn = (() => {
            const rnStats = Object.entries(metrics.staffStats || {}).filter(([, v]) => (v.role || "").toLowerCase() === "rn");
            if (!rnStats.length) return 0;
            const total = rnStats.reduce((sum, [, v]) => sum + (v.highRiskCount || 0), 0);
            return total / rnStats.length;
          })();

          const suggestions = [];

          if (highMobilityShare > 0.4) {
            suggestions.push({
              title: "High mobility load",
              text: "For units with >40% high-mobility patients, tighten rounding to 45–60m on top 3 mobility rooms to cut care debt.",
              impact: "Care debt ↓, fall exposure ↓",
            });
          }
          if (highRiskPerRn > 1.5) {
            suggestions.push({
              title: "Distribute high-risk patients",
              text: "Splitting high-risk patients ~1 per RN improves reliability vs. stacking 2–3 per RN.",
              impact: "Reliability ↑, strain ↓",
            });
          }
          if ((metrics.staffingStrainRatio || 1) >= 1.4) {
            suggestions.push({
              title: "Strain relief",
              text: "High strain detected; adding 0.5–1 CNA or shortening intervals on overdue rooms reduces care debt.",
              impact: "Strain ↓, care debt ↓",
            });
          }
          if (suggestions.length === 0) {
            suggestions.push({
              title: "Balanced",
              text: "Current patterns look balanced. Keep monitoring to hold gains.",
              impact: "Maintain reliability",
            });
          }
          return suggestions;
        };


        const setupCollapsibles = () => {
          document.querySelectorAll(".collapse-btn").forEach((btn) => {
            const box = btn.closest(".collapsible");
            if (!box) return;
            let open = btn.dataset.open !== "false";
            const applyState = () => {
              box.classList.toggle("collapsed", !open);
              btn.textContent = open ? "Hide" : "Show";
              btn.setAttribute("aria-expanded", String(open));
              btn.dataset.open = String(open);
            };
            applyState();
            btn.addEventListener("click", () => {
              open = !open;
              applyState();
            });
          });
        };

        autoScaleBoard();
        renderShowers();
        renderShowerAlertBar();
        renderToiletingPriority();
        updateCounts();
        setupCollapsibles();
        window.addEventListener("resize", autoScaleBoard);

        if (quietSafetyBtn) {
          quietSafetyBtn.addEventListener("click", () => {
            renderQuietSafety();
            quietBackdrop.style.display = "flex";
          });
        }
        if (closeQuietBtn) {
          closeQuietBtn.addEventListener("click", () => {
            quietBackdrop.style.display = "none";
          });
        }
        quietBackdrop.addEventListener("click", (e) => {
          if (e.target === quietBackdrop) quietBackdrop.style.display = "none";
        });
        const renderPlaybooks = () => {
          if (!playbookBody) return;
          const suggestions = buildPlaybookSuggestions();
          playbookBody.innerHTML = suggestions
            .map((s) => {
              return `
                <div class="cf-card" style="margin-bottom:8px;">
                  <div class="cf-subtitle">${s.title}</div>
                  <div>${s.text}</div>
                  <div style="color:#47566f; margin-top:4px;">Impact: ${s.impact}</div>
                </div>
              `;
            })
            .join("");
        };
        if (playbookBtn) {
          playbookBtn.addEventListener("click", () => {
            renderPlaybooks();
            playbookBackdrop.style.display = "flex";
          });
        }
        if (closePlaybookBtn) {
          closePlaybookBtn.addEventListener("click", () => {
            playbookBackdrop.style.display = "none";
          });
        }
        playbookBackdrop.addEventListener("click", (e) => {
          if (e.target === playbookBackdrop) playbookBackdrop.style.display = "none";
        });

        if (openCommandBtn) {
          openCommandBtn.addEventListener("click", () => {
            persistSnapshot();
            window.location.href = "/nova-command-center";
          });
        }
        if (openStatsBtn) {
          openStatsBtn.addEventListener("click", () => {
            renderStats();
            statsBackdrop.style.display = "flex";
          });
        }
        if (closeStatsBtn) {
          closeStatsBtn.addEventListener("click", () => {
            statsBackdrop.style.display = "none";
          });
        }
        statsBackdrop.addEventListener("click", (e) => {
          if (e.target === statsBackdrop) statsBackdrop.style.display = "none";
        });
        if (resetBoardBtn) {
          resetBoardBtn.addEventListener("click", () => {
            hardResetState();
          });
        }

        if (filtersEl) {
          const refreshActive = () => {
            filtersEl.querySelectorAll(".filter-chip").forEach((btn) => {
              const round = btn.dataset.round;
              const iso = btn.dataset.iso;
              const fall = btn.dataset.fall;
              const mode = btn.dataset.mode;
              let active = false;
              if (round) active = filterState.round === round;
              if (iso) active = filterState.iso;
              if (fall) active = filterState.fall;
              if (mode) active = modeLens === mode;
              btn.classList.toggle("active", active);
              btn.setAttribute("aria-pressed", active ? "true" : "false");
            });
          };
          filtersEl.addEventListener("click", (e) => {
            const btn = e.target.closest(".filter-chip");
            if (!btn) return;
            if (btn.dataset.round) {
              filterState.round = btn.dataset.round;
            }
            if (btn.dataset.iso) {
              filterState.iso = !filterState.iso;
            }
            if (btn.dataset.fall) {
              filterState.fall = !filterState.fall;
            }
            if (btn.dataset.mode) {
              modeLens = btn.dataset.mode;
            }
            refreshActive();
            renderTable();
          });
          refreshActive();
        }


        // Keyboard shortcuts for selected row
        window.addEventListener("keydown", (e) => {
          const tag = e.target.tagName.toLowerCase();
          if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey) return;
          
          // Escape key closes any open modal
          if (e.key === "Escape") {
            const openModals = document.querySelectorAll('.modal-backdrop[style*="flex"]');
            openModals.forEach(modal => {
              const closeBtn = modal.querySelector('button[id*="close"], button[class*="close"]');
              if (closeBtn) closeBtn.click();
              else modal.style.display = "none";
            });
            return;
          }
          
          if (!selectedRoom) return;
          if (e.key === "c" || e.key === "C") {
            completeRound(selectedRoom);
          } else if (e.key === "x" || e.key === "X") {
            emptyRoom(selectedRoom);
          } else if (e.key === "e" || e.key === "E") {
            openModal();
          }
        });

      
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
