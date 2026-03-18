import { useState, useCallback, useEffect } from "react";
import { LEASE_PDF_BASE64 } from "./leasePdf.js";
import "./app.css";

const CHECKBOXES = [
  { id: "Check Box3",  label: "Prorated rent applies",            section: "rent" },
  { id: "Check Box4",  label: "Month-to-month",                   section: "term" },
  { id: "Check Box5",  label: "Fixed term",                       section: "term" },
  { id: "Check Box6",  label: "Parking is assigned",              section: "parking" },
  { id: "Check Box7",  label: "Parking is NOT assigned",          section: "parking" },
  { id: "Check Box13", label: "Rent control exemption applies",   section: "extra" },
  { id: "Check Box8",  label: "Credit reporting exempt",          section: "extra" },
  { id: "Check Box9",  label: "Property exempt from credit reporting", section: "extra" },
  { id: "Check Box10", label: "Property subject to credit reporting",  section: "extra" },
  { id: "Check Box11", label: "Tenant opts into credit reporting", section: "extra" },
];

const SECTIONS = [
  {
    id: "parties", label: "Parties & property",
    fields: [
      { id: "LANDLORD",         label: "Landlord name",     placeholder: "Jane Smith",                                  wide: false },
      { id: "TENANTS",          label: "Tenant(s)",         placeholder: "John Doe, Jane Doe",                          wide: false },
      { id: "PROPERTY ADDRESS", label: "Property address",  placeholder: "456 Maple Ave, Apt 2B, Los Angeles, CA 90025", wide: true },
    ],
  },
  {
    id: "rent", label: "Rental amount",
    checkboxIds: ["Check Box3"],
    fields: [
      { id: "RENTAL AMOUNT Commencing",    label: "Lease start date",       placeholder: "April 1, 2026" },
      { id: "undefined",                   label: "Monthly rent ($)",        placeholder: "2500", type: "number" },
      { id: "per month in advance on the", label: "Rent due day",            placeholder: "1",    type: "number", readonly: true, autoCalc: true },
      { id: "undefined_2", label: "Rent payment address", placeholder: "Auto-filled from property address", wide: true, autoCalc: true },
      { id: "A prorated share of rent in the sum of", label: "Prorated rent ($)", placeholder: "Leave blank if N/A", type: "number" },
      { id: "the period from",             label: "Prorated from",           placeholder: "Leave blank if N/A" },
      { id: "to",                          label: "Prorated to",             placeholder: "Leave blank if N/A" },
    ],
  },
  {
    id: "term", label: "Lease term",
    checkboxIds: ["Check Box4", "Check Box5"],
    fields: [
      { id: "until", label: "Fixed term end date", placeholder: "Auto-filled from start date", wide: true, readonly: true, autoCalc: true },
    ],
  },
  {
    id: "deposit", label: "Deposits & initial payment",
    fields: [
      { id: "3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of", label: "Security deposit ($)",      placeholder: "5000", type: "number" },
      { id: "4 INITIAL PAYMENT TENANT shall pay the first month rent of",        label: "First month rent ($)",      placeholder: "2500", type: "number" },
      { id: "deposit in the amount of",   label: "Security deposit (line 4) ($)", placeholder: "Auto-filled",       type: "number", readonly: true },
      { id: "for a total of",             label: "Total initial payment ($)",      placeholder: "Auto-calculated",   type: "number", readonly: true, autoCalc: true },
    ],
  },
  {
    id: "occupants", label: "Occupants, utilities & parking",
    checkboxIds: ["Check Box6", "Check Box7"],
    fields: [
      { id: "persons",            label: "Additional named occupants", placeholder: "None",                        wide: true },
      { id: "following exception",label: "Utilities paid by landlord", placeholder: "None (tenant pays all)",      wide: true },
      { id: "Text1",              label: "Parking space #",            placeholder: "Leave blank if none" },
    ],
  },
  {
    id: "notices", label: "Notices & rent payment",
    fields: [
      { id: "Text2",                               label: "Authorized agent name",       placeholder: "Auto-filled from landlord name", autoCalc: true },
      { id: "LandlordAuthorized Agent Phone Number", label: "Agent phone",               placeholder: "(310) 555-0100" },
      { id: "LandlordAuthorized Agent Address",    label: "Agent address",               placeholder: "123 Owner St, Los Angeles, CA", wide: true },
      { id: "PersonEntity",                        label: "Rent payable to",             placeholder: "Auto-filled from landlord name", autoCalc: true },
      { id: "Phone Number",                        label: "Rent payee phone",            placeholder: "(310) 555-0100" },
      { id: "Address",                             label: "Rent payee address",          placeholder: "123 Owner St, Los Angeles, CA", wide: true },
      { id: "Hours",                               label: "Payment hours",               placeholder: "Mon–Fri 9am–5pm" },
      { id: "Payment to be made in the following forms", label: "Accepted payment forms", placeholder: "Check, Money Order, Online Payment", wide: true, autoCalc: true },
    ],
  },
  {
    id: "signatures", label: "Signatures",
    fields: [
      { id: "XX",                 label: "Landlord/agent name",     placeholder: "Auto-filled from landlord name", autoCalc: true },
      { id: "LANDLORDAGENT DATE", label: "Landlord signature date", placeholder: "April 1, 2026" },
      { id: "XX_2",               label: "Tenant 1 name",           placeholder: "Auto-filled from tenant(s)", autoCalc: true },
      { id: "DATE",               label: "Tenant 1 date",           placeholder: "April 1, 2026" },
      { id: "XX_3",               label: "Tenant 2 name",           placeholder: "Auto-filled if 2 tenants", autoCalc: true },
      { id: "DATE_2",             label: "Tenant 2 date",           placeholder: "Leave blank if N/A" },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap(s => s.fields);

export default function App() {
  const [data, setData] = useState({
    "following exception": "Water, Trash",
    "Payment to be made in the following forms": "Check, Money Order, Online Payment",
    "LandlordAuthorized Agent Phone Number": "(818) 822-5678",
    "Phone Number": "(818) 822-5678",
  });
  const [checks, setChecks]   = useState({});
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiMsg, setAiMsg]           = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const set      = (id, val) => setData(prev => ({ ...prev, [id]: val }));
  const setCheck = (id, val) => setChecks(prev => ({ ...prev, [id]: val }));

  // ── Auto-calculate total initial payment ─────────────────────────────────
  useEffect(() => {
    const tenants = data["TENANTS"];
    if (!tenants) return;
    const parts = tenants.split(",").map(t => t.trim());
    setData(prev => ({
      ...prev,
      "XX_2": parts[0] || "",
      "XX_3": parts[1] || "",
    }));
  }, [data["TENANTS"]]);

  useEffect(() => {
    const landlord = data["LANDLORD"];
    if (!landlord) return;
    setData(prev => ({
      ...prev,
      "Text2": landlord,
      "PersonEntity": landlord,
      "XX": landlord,
    }));
  }, [data["LANDLORD"]]);

  useEffect(() => {
    const propertyAddress = data["PROPERTY ADDRESS"];
    if (!propertyAddress) return;
    setData(prev => ({ ...prev, "undefined_2": propertyAddress }));
  }, [data["PROPERTY ADDRESS"]]);

  useEffect(() => {
    const startVal = data["RENTAL AMOUNT Commencing"];
    let endDate = "";
    if (startVal) {
      const start = new Date(startVal);
      if (!isNaN(start)) {
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(end.getDate() - 1);
        endDate = end.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
      }
    }
    setData(prev => ({ ...prev, "until": endDate }));
  }, [data["RENTAL AMOUNT Commencing"]]);

  useEffect(() => {
    const secDep     = parseFloat(data["3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of"]) || 0;
    const firstMonth = parseFloat(data["4 INITIAL PAYMENT TENANT shall pay the first month rent of"]) || 0;
    setData(prev => ({
      ...prev,
      "per month in advance on the": "1",
      "deposit in the amount of": secDep > 0 ? String(secDep) : "",
      "for a total of": (secDep + firstMonth) > 0 ? String(secDep + firstMonth) : "",
    }));
  }, [
    data["3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of"],
    data["4 INITIAL PAYMENT TENANT shall pay the first month rent of"],
  ]);

  const filled = ALL_FIELDS.filter(f => !f.readonly && data[f.id]).length;
  const total  = ALL_FIELDS.filter(f => !f.readonly).length;
  const pct    = Math.round((filled / total) * 100);

  // ── AI Auto-fill ──────────────────────────────────────────────────────────
  const autoFill = useCallback(async () => {
    const filledKeys = Object.keys(data).filter(k => data[k]);
    if (filledKeys.length < 2) { setAiMsg("Fill in at least 2 fields first."); return; }
    setAiLoading(true);
    setAiMsg("");
    try {
      const knownFields   = filledKeys.map(k => { const f = ALL_FIELDS.find(f => f.id === k); return `${f?.label || k}: ${data[k]}`; }).join("\n");
      const missingFields = ALL_FIELDS.filter(f => !f.readonly && !data[f.id]).map(f => `"${f.id}" (${f.label})`).join(", ");
      const res  = await fetch("/api/autofill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ knownFields, missingFields }) });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(prev => {
        const next = { ...prev };
        for (const [k, val] of Object.entries(json.suggestions)) {
          const f = ALL_FIELDS.find(f => f.id === k);
          if (!f?.readonly && !prev[k] && val) next[k] = String(val);
        }
        return next;
      });
      setAiMsg("success");
    } catch (e) { setAiMsg("error"); }
    setAiLoading(false);
  }, [data]);

  // ── PDF Download ──────────────────────────────────────────────────────────
  const downloadPDF = useCallback(async () => {
    const required = ["LANDLORD", "TENANTS", "PROPERTY ADDRESS", "undefined", "3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of"];
    const missing  = required.filter(id => !data[id]).map(id => ALL_FIELDS.find(f => f.id === id)?.label);
    if (missing.length) { alert("Please fill in: " + missing.join(", ")); return; }
    setPdfLoading(true);
    if (!window.PDFLib) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    try {
      const { PDFDocument } = window.PDFLib;
      const b64    = LEASE_PDF_BASE64.replace(/\s/g, "");
      const binary = atob(b64);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const form   = pdfDoc.getForm();

      for (const field of ALL_FIELDS) {
        const val = data[field.id];
        if (!val) continue;
        try {
          const pdfField = form.getTextField(field.id);
          let display = val;
          if (field.type === "number") display = parseFloat(val).toLocaleString();
          pdfField.setText(display);
        } catch {}
      }
      for (const cb of CHECKBOXES) {
        if (!checks[cb.id]) continue;
        try { form.getCheckBox(cb.id).check(); } catch {}
      }
      form.flatten();
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `Lease_${(data["TENANTS"] || "Tenant").split(",")[0].trim().replace(/\s+/g, "_")}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) { alert("PDF generation failed: " + err.message); }
    setPdfLoading(false);
  }, [data, checks]);

  const fmtMoney = v => v ? `$${parseFloat(v).toLocaleString()}` : "___";

  return (
    <div className="app">

      <div className="topbar">
        <div>
          <div className="topbar-title">Capri Equities Property Management</div>
          <div className="topbar-sub">Lease Generator</div>
        </div>
        <button className={`btn-dl ${pdfLoading ? "loading" : ""}`} onClick={downloadPDF} disabled={pdfLoading}>
          {pdfLoading ? <><span className="spinner" /> Generating…</> : "↓ Download PDF"}
        </button>
      </div>

      <div className="main">

        <div className="logo-wrap">
          <img src="/logo.png" alt="Capri Equities Property Management" className="logo-img" />
          <p className="logo-sub">Residential Lease Generator</p>
        </div>

        <div className="progress-row">
          <span className="prog-label">{filled} of {total} fields</span>
          <div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
          <span className="prog-label">{pct}%</span>
        </div>

        <div className="ai-bar">
          <span className="ai-bar-text">
            {aiLoading ? "Thinking…" : aiMsg === "success" ? "✓ Fields filled — review and adjust as needed." : aiMsg === "error" ? "Could not reach AI — fill manually." : "Auto-fill remaining fields using AI"}
          </span>
          <button className="ai-bar-btn" onClick={autoFill} disabled={aiLoading}>
            {aiLoading ? <><span className="spinner sm" /></> : "✦ Fill with AI"}
          </button>
        </div>

        {SECTIONS.map(sec => {
          const secChecks = CHECKBOXES.filter(c => sec.checkboxIds?.includes(c.id));
          return (
            <div key={sec.id} className="section">
              <div className="section-label">{sec.label}</div>

              {secChecks.length > 0 && (
                <div className="cb-row">
                  {secChecks.map(cb => (
                    <label key={cb.id} className="cb-label">
                      <input type="checkbox" checked={!!checks[cb.id]} onChange={e => setCheck(cb.id, e.target.checked)} />
                      {cb.label}
                    </label>
                  ))}
                </div>
              )}

              <div className="grid">
                {sec.fields.map(field => (
                  <div key={field.id} className={`field ${field.wide ? "wide" : ""}`}>
                    <label>{field.label}{field.autoCalc && <span className="auto-badge">auto</span>}{field.readonly && !field.autoCalc && <span className="auto-badge">auto</span>}</label>
                    <input
                      type={field.type === "number" ? "text" : "text"}
                      value={field.type === "number" && data[field.id] ? `$${parseFloat(data[field.id]).toLocaleString()}` : (data[field.id] || "")}
                      onChange={e => {
                        if (field.readonly) return;
                        const raw = field.type === "number" ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value;
                        set(field.id, raw);
                      }}
                      readOnly={field.readonly}
                      placeholder={field.placeholder}
                      className={`finput ${data[field.id] ? "filled" : ""} ${field.readonly ? "readonly" : ""}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {data["TENANTS"] && data["PROPERTY ADDRESS"] && (
          <div className="preview">
            <strong>{data["TENANTS"]}</strong> will lease <strong>{data["PROPERTY ADDRESS"]}</strong> from{" "}
            <strong>{data["LANDLORD"] || "___"}</strong> at <strong>{fmtMoney(data["undefined"])}</strong>/month.
            Security deposit: <strong>{fmtMoney(data["3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of"])}</strong>.
            Total due at signing: <strong>{fmtMoney(data["for a total of"])}</strong>.
          </div>
        )}

        <button className={`btn-dl-full ${pdfLoading ? "loading" : ""}`} onClick={downloadPDF} disabled={pdfLoading}>
          {pdfLoading ? <><span className="spinner" /> Filling PDF…</> : "↓ Download filled lease PDF"}
        </button>
        <p className="dl-note">Downloads the original Dennis P. Block lease with your info filled in</p>

      </div>
    </div>
  );
}
