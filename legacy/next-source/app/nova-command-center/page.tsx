import Script from "next/script";

export default function NovaCommandCenter() {
  return (
    <div
      className="min-h-screen bg-[#eef2f9] text-[#0f2742] p-3"
      style={{ fontFamily: "Rubik, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}
    >
      <div className="mx-auto max-w-[1280px] rounded-2xl border border-[#d2deeb] bg-white p-4 shadow-[0_24px_60px_rgba(16,35,66,0.12)]">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d7e4f2] bg-gradient-to-br from-[rgba(27,111,217,0.12)] to-[rgba(26,166,163,0.08)] p-3">
          <div>
            <h1 className="m-0 text-[24px] font-bold tracking-[0.02em] text-[#0d3b73]">
              NOVA Command Center
            </h1>
            <div className="mt-1 text-[13px] text-[#6f8296]">
              Unit-level orchestration: next actions, tempo, quality, and staffing simulations.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="backBtn"
              className="rounded-lg border border-[#dbe4f3] bg-[#eef4ff] px-3 py-2 text-[13px] font-bold text-[#0d3b73]"
            >
              Back to Whiteboard
            </button>
          </div>
        </header>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.7fr_1.3fr]">
          <div className="rounded-xl border border-[#dbe5f0] bg-white p-4 shadow-[0_10px_24px_rgba(16,35,66,0.08)]">
            <h3 className="m-0 mb-2 text-[15px] font-bold text-[#0d3b73]">
              Global Action Queue™
            </h3>
            <div className="mb-2 text-[12px] text-[#6f8296]" id="queueSummary" />
            <table className="w-full border-collapse text-[12px]" aria-label="Action queue">
              <thead>
                <tr>
                  {[
                    "Priority",
                    "Room",
                    "Patient",
                    "Need",
                    "State",
                    "Drift",
                    "Recommended Action",
                    "Suggested Staff",
                  ].map((label) => (
                    <th
                      key={label}
                      className="border border-[#dbe5f0] bg-[#eaf2ff] px-2 py-1 text-left font-bold text-[#0d3b73]"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody id="queueBody" />
            </table>
          </div>

          <div className="rounded-xl border border-[#dbe5f0] bg-white p-4 shadow-[0_10px_24px_rgba(16,35,66,0.08)]">
            <h3 className="m-0 mb-2 text-[15px] font-bold text-[#0d3b73]">
              Unit Tempo &amp; Staffing Strain
            </h3>
            <div id="tempoStatus" className="mb-2 font-bold" />
            <div id="tempoBar" className="flex h-2 overflow-hidden rounded-full bg-[#e5e7eb]" />
            <div id="tempoMeta" className="mt-2 text-[12px] text-[#6f8296]" />
            <hr className="my-3 border-t border-[#dbe5f0]" />
            <div id="strainStatus" className="mb-2 font-bold" />
            <div id="strainMeta" className="text-[12px] text-[#6f8296]" />
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-[#dbe5f0] bg-white p-4 shadow-[0_10px_24px_rgba(16,35,66,0.08)]">
          <h3 className="m-0 mb-2 text-[15px] font-bold text-[#0d3b73]">
            Care Quality Ledger™ + What-if Simulation
          </h3>
          <div id="ledgerSummary" className="mb-2 text-[12px] text-[#6f8296]" />
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            <label className="flex flex-col text-[12px] font-bold text-[#0d3b73]">
              RN count
              <input
                type="number"
                id="rnInput"
                min={0}
                step={1}
                defaultValue={3}
                className="mt-1 rounded-lg border border-[#dbe5f0] px-2 py-1 text-[12px]"
              />
            </label>
            <label className="flex flex-col text-[12px] font-bold text-[#0d3b73]">
              CNA count
              <input
                type="number"
                id="cnaInput"
                min={0}
                step={1}
                defaultValue={2}
                className="mt-1 rounded-lg border border-[#dbe5f0] px-2 py-1 text-[12px]"
              />
            </label>
          </div>
          <div id="whatifResult" className="mt-3" />
        </div>
      </div>

      <Script src="/nova-command-center.js" strategy="afterInteractive" />
    </div>
  );
}
