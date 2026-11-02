"use client";

import { useEffect } from "react";
import type { InspectionItem } from "../lab-types";
import { ENERGY_READINGS, SCAN_READINGS } from "../lab-data";

interface Props {
  inspectionItems: InspectionItem[];
  reactorPower: number;
  onBack: () => void;
}

// ── Helpers that build the print-portal HTML ────────────────────────────────
// We write the report as plain HTML string so it can be injected as a direct
// child of <body>. This means `body > * { display:none }` hides the entire
// Next.js app tree while `#lab-print-portal { display:block }` shows only
// the report — no ancestor threading, no duplication.

function statusColor(status: InspectionItem["status"]): string {
  if (status === "NOMINAL") return "color:#065f46";
  if (status === "ELEVATED") return "color:#b45309";
  return "color:#b91c1c";
}

function buildPortalHTML(
  inspectionItems: InspectionItem[],
  reactorPower: number,
  date: string
): string {
  const inspectionRows = inspectionItems
    .map(
      (item) => `
      <div class="row">
        <div>
          <strong>${item.component}</strong><br/>
          <span class="muted">${item.location}</span>
        </div>
        <div class="right">
          <span style="${statusColor(item.status)};font-weight:700">${item.status}</span><br/>
          <span style="color:#065f46">✓ INSPECTED</span>
        </div>
      </div>`
    )
    .join("");

  const energyRows = ENERGY_READINGS.map(
    (r) => `
      <div class="cell">
        <div class="muted small">${r.label}</div>
        <div style="color:#0e7490;font-weight:700">${r.value} ${r.unit}</div>
      </div>`
  ).join("");

  const scanRows = SCAN_READINGS.map(
    (r) => `
      <div class="row${r.anomaly ? " anomaly-row" : ""}">
        <span>${r.label}</span>
        <div class="right">
          <span style="${r.anomaly ? "color:#b91c1c" : "color:#065f46"};font-weight:700">${r.value}</span>
          ${r.anomaly ? `<br/><span style="color:#b91c1c" class="small">ANOMALY</span>` : ""}
        </div>
      </div>`
  ).join("");

  return `
    <div id="lab-print-portal">
      <style>
        #lab-print-portal {
          display: none; /* shown only in @media print via injected stylesheet */
          font-family: 'Courier New', Courier, monospace;
          font-size: 10pt;
          line-height: 1.6;
          color: #111827;
          background: #ffffff;
          padding: 0;
          margin: 0;
          width: 100%;
        }
        #lab-print-portal h1 { font-size:20pt; font-weight:900; margin:0 0 4pt 0; letter-spacing:0.05em; }
        #lab-print-portal h2 { font-size:11pt; font-weight:700; margin:10pt 0 4pt 0; letter-spacing:0.25em; color:#374151; text-transform:uppercase; border-bottom:0.5pt solid #d1d5db; padding-bottom:2pt; }
        #lab-print-portal .card { border:0.75pt solid #d1d5db; padding:8pt; margin-bottom:6pt; background:#f9fafb; break-inside:avoid; page-break-inside:avoid; }
        #lab-print-portal .row { display:flex; justify-content:space-between; align-items:flex-start; padding:5pt 8pt; border-bottom:0.5pt solid #e5e7eb; }
        #lab-print-portal .row:last-child { border-bottom:none; }
        #lab-print-portal .anomaly-row { background:#fff5f5; }
        #lab-print-portal .right { text-align:right; }
        #lab-print-portal .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6pt; }
        #lab-print-portal .cell { border:0.75pt solid #d1d5db; padding:5pt; background:#f9fafb; }
        #lab-print-portal .muted { color:#6b7280; }
        #lab-print-portal .small { font-size:7.5pt; letter-spacing:0.15em; }
        #lab-print-portal .badge { display:inline-block; border:0.5pt solid #d1d5db; padding:1pt 4pt; font-size:7pt; letter-spacing:0.2em; }
        #lab-print-portal .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:4pt; font-size:9pt; }
        #lab-print-portal .conclusion { border:0.75pt solid #fca5a5; background:#fff5f5; padding:8pt; margin-bottom:8pt; }
        #lab-print-portal .footer { border:0.75pt solid #d1d5db; padding:6pt; text-align:center; }
        #lab-print-portal .note { font-size:7.5pt; color:#9ca3af; margin-top:3pt; }
        #lab-print-portal .header-box { border:0.75pt solid #0e7490; background:#f0fdfe; padding:8pt; margin-bottom:10pt; }
      </style>

      <!-- HEADER -->
      <div class="header-box">
        <div class="small muted" style="color:#0e7490;letter-spacing:0.4em">OFFICIAL RESEARCH RECORD</div>
        <h1>FINAL LAB REPORT</h1>
        <div class="meta-grid" style="margin-top:6pt">
          <div><span class="muted">FACILITY · </span>M.I.M. RESEARCH DIV.</div>
          <div><span class="muted">DATE · </span>${date}</div>
          <div><span class="muted">SPECIMEN · </span>M-001 / UNKNOWN ORGANISM</div>
          <div><span class="muted">STATUS · </span><span style="color:#065f46;font-weight:700">ALL EXPERIMENTS COMPLETE</span></div>
        </div>
      </div>

      <!-- EXP-01 -->
      <h2>EXP-01 / Machine Inspection</h2>
      <div style="border:0.75pt solid #d1d5db;margin-bottom:6pt">
        ${inspectionRows}
      </div>

      <!-- EXP-02 -->
      <h2>EXP-02 / Energy Regulation</h2>
      <div class="card">
        Reactor successfully brought online. Peak simulated output recorded at
        <strong style="color:#0e7490">${reactorPower.toFixed(1)}%</strong>.
        All six energy network readings confirmed within operational tolerance.
      </div>
      <div class="grid" style="margin-bottom:4pt">
        ${energyRows}
      </div>
      <div class="note">* All energy readings are simulated.</div>

      <!-- EXP-03 -->
      <h2 style="margin-top:10pt">EXP-03 / Moth Investigation</h2>
      <div style="border:0.75pt solid #d1d5db;margin-bottom:4pt">
        ${scanRows}
      </div>
      <div class="note">* All scan readings are simulated.</div>

      <!-- CONCLUSION -->
      <h2 style="margin-top:10pt">Research Conclusion</h2>
      <div class="conclusion">
        Specimen M-001 represents an unprecedented convergence of mechanical and biological
        characteristics. The three-level machine structure appears to function as both
        habitat and power source for the organism. Energy absorption rates and neural
        activity patterns suggest a symbiotic relationship with the reactor core.
        Containment integrity holding. Continued observation recommended at Access Level 03.
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <span class="small muted">RESTRICTED RESEARCH DIVISION · M.I.M. FACILITY · ACCESS LEVEL 03</span>
      </div>
    </div>
  `;
}

export default function LabReport({ inspectionItems, reactorPower, onBack }: Props) {
  const date = new Date().toISOString().split("T")[0];

  // ── 1. Inject the print portal directly on <body> ────────────────────────
  // Being a direct child of <body> means the standard print CSS
  //   body > * { display:none }  +  #lab-print-portal { display:block }
  // works reliably — no ancestor tree to thread through.
  useEffect(() => {
    const portalId = "lab-print-portal";

    // Remove any stale portal from a previous render
    document.getElementById(portalId)?.remove();

    const tmp = document.createElement("div");
    tmp.innerHTML = buildPortalHTML(inspectionItems, reactorPower, date);
    const portal = tmp.firstElementChild as HTMLElement;
    document.body.appendChild(portal);

    return () => {
      document.getElementById(portalId)?.remove();
    };
  // Rebuild portal whenever report data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionItems, reactorPower, date]);

  // ── 2. Inject the @media print stylesheet ───────────────────────────────
  useEffect(() => {
    const styleId = "lab-print-styles";
    document.getElementById(styleId)?.remove();

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media print {
        /* Hide the entire Next.js app */
        body > *:not(#lab-print-portal) {
          display: none !important;
        }

        /* Show only the print portal */
        #lab-print-portal {
          display: block !important;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          background: #ffffff;
          color: #111827;
        }

        /* Page setup */
        @page {
          size: A4 portrait;
          margin: 1.8cm 1.5cm;
        }

        html, body {
          background: #ffffff !important;
          margin: 0;
          padding: 0;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, []);

  function handlePrint() {
    window.print();
  }

  // ── Screen render — normal lab UI, unchanged ─────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-8">

      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 self-start text-[9px] tracking-widest text-gray-500 transition hover:text-cyan-400"
      >
        ← BACK TO DASHBOARD
      </button>

      {/* ── Report header ── */}
      <div className="mb-6 border border-cyan-400/30 bg-cyan-400/5 p-4">
        <p className="text-[9px] tracking-[0.4em] text-cyan-400">OFFICIAL RESEARCH RECORD</p>
        <h2 className="mt-2 text-2xl font-black tracking-wider md:text-3xl">FINAL LAB REPORT</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] text-gray-400">
          <div><span className="text-gray-600">FACILITY · </span>M.I.M. RESEARCH DIV.</div>
          <div><span className="text-gray-600">DATE · </span>{date}</div>
          <div><span className="text-gray-600">SPECIMEN · </span>M-001 / UNKNOWN ORGANISM</div>
          <div>
            <span className="text-gray-600">STATUS · </span>
            <span className="text-emerald-400">ALL EXPERIMENTS COMPLETE</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Inspection ── */}
      <section className="mb-6">
        <p className="mb-3 text-[9px] tracking-[0.4em] text-gray-500">EXP-01 / MACHINE INSPECTION</p>
        <div className="space-y-2">
          {inspectionItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between border border-white/10 bg-black/20 px-3 py-2">
              <div>
                <p className="text-[10px] font-bold text-white">{item.component}</p>
                <p className="text-[9px] text-gray-500">{item.location}</p>
              </div>
              <div className="text-right">
                <p className={`text-[9px] font-bold ${
                  item.status === "NOMINAL" ? "text-emerald-400"
                  : item.status === "ELEVATED" ? "text-amber-400"
                  : "text-red-400"
                }`}>{item.status}</p>
                <p className="text-[9px] text-emerald-400">✓ INSPECTED</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Energy ── */}
      <section className="mb-6">
        <p className="mb-3 text-[9px] tracking-[0.4em] text-gray-500">EXP-02 / ENERGY REGULATION</p>
        <div className="mb-2 border border-cyan-400/20 bg-cyan-400/5 p-3">
          <p className="text-[10px] text-gray-400">
            Reactor successfully brought online. Peak simulated output recorded at{" "}
            <span className="font-bold text-cyan-300">{reactorPower.toFixed(1)}%</span>.
            All six energy network readings confirmed within operational tolerance.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {ENERGY_READINGS.map((r) => (
            <div key={r.label} className="border border-white/10 bg-black/20 p-2">
              <p className="text-[8px] tracking-widest text-gray-500">{r.label}</p>
              <p className="mt-0.5 text-xs font-bold text-cyan-300">{r.value} {r.unit}</p>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[9px] text-gray-600">* All energy readings are simulated.</p>
      </section>

      {/* ── Section 3: Moth scan ── */}
      <section className="mb-6">
        <p className="mb-3 text-[9px] tracking-[0.4em] text-gray-500">EXP-03 / MOTH INVESTIGATION</p>
        <div className="space-y-2">
          {SCAN_READINGS.map((r) => (
            <div key={r.label} className={`flex items-center justify-between border px-3 py-2 ${r.anomaly ? "border-red-400/20 bg-red-400/5" : "border-white/10 bg-black/20"}`}>
              <p className="text-[10px] text-gray-400">{r.label}</p>
              <div className="text-right">
                <p className={`text-[10px] font-bold ${r.anomaly ? "text-red-400" : "text-emerald-400"}`}>{r.value}</p>
                {r.anomaly && <p className="text-[8px] text-red-400/70">ANOMALY</p>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[9px] text-gray-600">* All scan readings are simulated.</p>
      </section>

      {/* ── Conclusion ── */}
      <div className="mb-6 border border-red-400/20 bg-red-400/5 p-4">
        <p className="text-[9px] tracking-[0.35em] text-red-400">RESEARCH CONCLUSION</p>
        <p className="mt-2 text-[11px] leading-5 text-gray-300">
          Specimen M-001 represents an unprecedented convergence of mechanical and biological
          characteristics. The three-level machine structure appears to function as both
          habitat and power source for the organism. Energy absorption rates and neural
          activity patterns suggest a symbiotic relationship with the reactor core.
          Containment integrity holding. Continued observation recommended at Access Level 03.
        </p>
      </div>

      {/* ── Footer ── */}
      <div className="mb-6 border border-white/10 p-3 text-center">
        <p className="text-[9px] tracking-[0.3em] text-gray-500">
          RESTRICTED RESEARCH DIVISION · M.I.M. FACILITY · ACCESS LEVEL 03
        </p>
      </div>

      {/* ── Print button ── */}
      <button
        onClick={handlePrint}
        className="flex w-full items-center justify-center gap-3 border border-cyan-400/50 bg-cyan-400/10 py-4 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
        </svg>
        PRINT REPORT / SAVE AS PDF
      </button>
      <p className="mt-2 text-center text-[9px] text-gray-600">
        In the print dialog, choose <strong className="text-gray-400">Save as PDF</strong> as the destination to export.
      </p>

    </div>
  );
}
