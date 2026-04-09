import { useState, useCallback, useEffect } from "react";
import { LEASE_PDF_BASE64 } from "./leasePdf.js";

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
    id: "parties", label: "Parties & Property",
    fields: [
      { id: "LANDLORD",         label: "Landlord name",     placeholder: "Jane Smith",                                  wide: false },
      { id: "TENANTS",          label: "Tenant(s)",         placeholder: "John Doe, Jane Doe",                          wide: false },
      { id: "PROPERTY ADDRESS", label: "Property address",  placeholder: "456 Maple Ave, Apt 2B, Los Angeles, CA 90025", wide: true },
    ],
  },
  {
    id: "rent", label: "Rental Amount",
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
    id: "term", label: "Lease Term",
    checkboxIds: ["Check Box4", "Check Box5"],
    fields: [
      { id: "until", label: "Fixed term end date", placeholder: "Auto-filled from start date", wide: true, readonly: true, autoCalc: true },
    ],
  },
  {
    id: "deposit", label: "Deposits & Initial Payment",
    fields: [
      { id: "3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of", label: "Security deposit ($)",      placeholder: "5000", type: "number" },
      { id: "4 INITIAL PAYMENT TENANT shall pay the first month rent of",        label: "First month rent ($)",      placeholder: "2500", type: "number" },
      { id: "deposit in the amount of",   label: "Security deposit (line 4) ($)", placeholder: "Auto-filled",       type: "number", readonly: true },
      { id: "for a total of",             label: "Total initial payment ($)",      placeholder: "Auto-calculated",   type: "number", readonly: true, autoCalc: true },
    ],
  },
  {
    id: "occupants", label: "Occupants, Utilities & Parking",
    checkboxIds: ["Check Box6", "Check Box7"],
    fields: [
      { id: "persons",            label: "Additional named occupants", placeholder: "None",                        wide: true },
      { id: "following exception",label: "Utilities paid by landlord", placeholder: "None (tenant pays all)",      wide: true },
      { id: "Text1",              label: "Parking space #",            placeholder: "Leave blank if none" },
    ],
  },
  {
    id: "notices", label: "Notices & Rent Payment",
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

const colors = {
  dark: "#1a3a3a",
  mid: "#254f4f",
  gold: "#b8963e",
  goldLight: "#f0e8d0",
  goldMid: "#d4b06a",
  tealLight: "#e8f0f0",
  tealMid: "#c0d4d4",
};

const styles = {
  app: { minHeight: "100vh", fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#f7f2ea", color: "#1a3a3a" },
  topbar: { background: colors.dark, padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  topbarTitle: { fontSize: 14, fontWeight: 500, color: "#fff" },
  topbarSub: { fontSize: 11, color: colors.goldMid, marginTop: 1 },
  main: { maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" },
  logoWrap: { textAlign: "center", padding: "32px 0 24px", borderBottom: `1px solid ${colors.tealMid}`, marginBottom: 24 },
  logoText: { fontSize: 22, fontWeight: 700, color: colors.dark, letterSpacing: "-0.5px" },
  logoSub: { fontSize: 13, color: colors.mid, marginTop: 8, letterSpacing: "0.04em", fontWeight: 500 },
  progressRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  progTrack: { flex: 1, height: 3, background: colors.tealMid, borderRadius: 99 },
  progLabel: { fontSize: 12, color: "#666", whiteSpace: "nowrap" },
  aiBar: { display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.tealLight, border: `0.5px solid ${colors.tealMid}`, borderRadius: 8, padding: "10px 14px", marginBottom: 24, gap: 12 },
  aiBarText: { fontSize: 13, color: colors.dark },
  section: { marginBottom: 28 },
  sectionLabel: { fontSize: 11, fontWeight: 500, color: colors.dark, textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 10, marginBottom: 12, borderBottom: `1.5px solid ${colors.gold}` },
  cbRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: 500, color: colors.mid, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 },
  autoBadge: { fontSize: 10, fontWeight: 500, background: colors.goldLight, color: colors.gold, border: `0.5px solid ${colors.goldMid}`, borderRadius: 4, padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.04em" },
  preview: { background: colors.tealLight, border: `0.5px solid ${colors.tealMid}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, lineHeight: 1.8, color: colors.mid, marginBottom: 16 },
  btnDlFull: { width: "100%", padding: 12, background: colors.dark, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  dlNote: { textAlign: "center", fontSize: 11, color: "#666", marginTop: 8 },
};


function ProratedCalc({ onApply, monthlyRent, leaseStart }) {
  const today = new Date();
  const defaultMoveIn = leaseStart
    ? leaseStart
    : `${today.toLocaleString("en-US", { month: "long" })} ${today.getDate()}, ${today.getFullYear()}`;

  const [moveIn, setMoveIn] = useState(leaseStart || "");
  const [customRent, setCustomRent] = useState(monthlyRent || "");
  const [rawRent, setRawRent] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => { if (monthlyRent) setCustomRent(monthlyRent); }, [monthlyRent]);
  useEffect(() => { if (leaseStart) setMoveIn(leaseStart); }, [leaseStart]);

  const calc = () => {
    if (!moveIn || !customRent) return null;
    const rent = parseFloat(customRent);
    if (isNaN(rent)) return null;

    // Parse move-in date flexibly
    const d = new Date(moveIn);
    if (isNaN(d)) return null;

    const moveInDay = d.getDate();
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed

    // Days in the move-in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Prorated days = from move-in day to end of month (inclusive)
    const proratedDays = daysInMonth - moveInDay + 1;
    const dailyRate = rent / daysInMonth;
    const proratedAmount = dailyRate * proratedDays;

    // Period: move-in date to last day of that month
    const periodStart = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const lastDay = new Date(year, month + 1, 0);
    const periodEnd = lastDay.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return { proratedAmount, proratedDays, daysInMonth, dailyRate, periodStart, periodEnd, rent };
  };

  const result = calc();

  return (
    <div style={{ background: colors.tealLight, border: `0.5px solid ${colors.tealMid}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: colors.mid, textTransform: "uppercase", letterSpacing: "0.04em" }}>Move-in Date</label>
          <input
            type="text"
            value={moveIn}
            onChange={e => setMoveIn(e.target.value)}
            placeholder="April 15, 2026"
            style={{ padding: "8px 11px", border: `0.5px solid ${moveIn ? colors.goldMid : "#ccc"}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: colors.dark, background: moveIn ? colors.goldLight : "#fff", outline: "none", width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: colors.mid, textTransform: "uppercase", letterSpacing: "0.04em" }}>Monthly Rent ($)</label>
          <input
            type="text"
            value={focused ? rawRent : (customRent ? `$${parseFloat(customRent).toLocaleString()}` : "")}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9.]/g, "");
              setRawRent(raw);
              setCustomRent(raw);
            }}
            onFocus={() => { setFocused(true); setRawRent(customRent); }}
            onBlur={() => setFocused(false)}
            placeholder="2500"
            style={{ padding: "8px 11px", border: `0.5px solid ${customRent ? colors.goldMid : "#ccc"}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: colors.dark, background: customRent ? colors.goldLight : "#fff", outline: "none", width: "100%" }}
          />
        </div>
      </div>

      {result ? (
        <div style={{ background: "#fff", border: `0.5px solid ${colors.tealMid}`, borderRadius: 8, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Prorated Amount", value: `$${result.proratedAmount.toFixed(2)}`, accent: true },
              { label: "Days Occupied", value: `${result.proratedDays} of ${result.daysInMonth}` },
              { label: "Daily Rate", value: `$${result.dailyRate.toFixed(2)}/day` },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ textAlign: "center", padding: "10px 8px", background: accent ? colors.goldLight : colors.tealLight, borderRadius: 8, border: `0.5px solid ${accent ? colors.goldMid : colors.tealMid}` }}>
                <div style={{ fontSize: 11, color: accent ? colors.gold : colors.mid, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: accent ? 20 : 15, fontWeight: 500, color: colors.dark }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: colors.mid, textAlign: "center", marginBottom: 12 }}>
            Period: <strong style={{ color: colors.dark }}>{result.periodStart}</strong> → <strong style={{ color: colors.dark }}>{result.periodEnd}</strong>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            ${result.rent.toLocaleString()}/mo ÷ {result.daysInMonth} days × {result.proratedDays} days
          </div>
          <button
            onClick={() => onApply(result.proratedAmount.toFixed(2), result.periodStart, result.periodEnd)}
            style={{ width: "100%", padding: "9px 0", background: colors.dark, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}
          >
            ↑ Apply to lease form
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", fontSize: 13, color: colors.mid, padding: "14px 0" }}>
          Enter a move-in date and monthly rent to calculate
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState({
    "following exception": "Water, Trash",
    "Payment to be made in the following forms": "Check, Money Order, Online Payment",
    "LandlordAuthorized Agent Phone Number": "(818) 822-5678",
    "Phone Number": "(818) 822-5678",
  });
  const [rawInputs, setRawInputs] = useState({});
  const [checks, setChecks] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const set = (id, val) => setData(prev => ({ ...prev, [id]: val }));
  const setCheck = (id, val) => setChecks(prev => ({ ...prev, [id]: val }));

  useEffect(() => {
    const tenants = data["TENANTS"];
    if (!tenants) return;
    const parts = tenants.split(",").map(t => t.trim());
    setData(prev => ({ ...prev, "XX_2": parts[0] || "", "XX_3": parts[1] || "" }));
  }, [data["TENANTS"]]);

  useEffect(() => {
    const landlord = data["LANDLORD"];
    if (!landlord) return;
    setData(prev => ({ ...prev, "Text2": landlord, "PersonEntity": landlord, "XX": landlord }));
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
    const secDep = parseFloat(data["3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of"]) || 0;
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
  const total = ALL_FIELDS.filter(f => !f.readonly).length;
  const pct = Math.round((filled / total) * 100);

  const autoFill = useCallback(async () => {
    const filledKeys = Object.keys(data).filter(k => data[k]);
    if (filledKeys.length < 2) { setAiMsg("Fill in at least 2 fields first."); return; }
    setAiLoading(true);
    setAiMsg("");
    try {
      const knownFields = filledKeys.map(k => { const f = ALL_FIELDS.find(f => f.id === k); return `${f?.label || k}: ${data[k]}`; }).join("\n");
      const missingFields = ALL_FIELDS.filter(f => !f.readonly && !data[f.id]).map(f => `"${f.id}" (${f.label})`).join(", ");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are helping fill out a California residential lease agreement. Based on the known information, suggest realistic values for the missing fields. Return ONLY a valid JSON object with field IDs as keys and suggested string values. No explanation, no markdown fences, just raw JSON.\n\nKnown fields:\n${knownFields}\n\nSuggest values for these field IDs:\n${missingFields}\n\nRules:\n- For leaseStart and leaseEnd: return YYYY-MM-DD format\n- For monthlyRent, securityDeposit, lateFee: return just the number as a string (e.g. "2500")\n- For phone numbers: use (XXX) XXX-XXXX format\n- Make all suggestions realistic for a California residential lease\n- securityDeposit is typically 2x monthlyRent in California\n- lateFee is typically $50-$150\n- gracePeriod is typically 3-5 days\n- rentDueDay is typically "1"\n- If propertyAddress is missing but landlordAddress is known, create a nearby but different address`,
          }],
        }),
      });
      const json = await response.json();
      if (json.error) throw new Error(json.error.message);
      const text = json.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const suggestions = JSON.parse(clean);
      setData(prev => {
        const next = { ...prev };
        for (const [k, val] of Object.entries(suggestions)) {
          const f = ALL_FIELDS.find(f => f.id === k);
          if (!f?.readonly && !prev[k] && val) next[k] = String(val);
        }
        return next;
      });
      setAiMsg("success");
    } catch (e) { setAiMsg("error: " + e.message); }
    setAiLoading(false);
  }, [data]);

  const downloadPDF = useCallback(async () => {
    const required = ["LANDLORD", "TENANTS", "PROPERTY ADDRESS", "undefined", "3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of"];
    const missing = required.filter(id => !data[id]).map(id => ALL_FIELDS.find(f => f.id === id)?.label);
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
      const b64 = LEASE_PDF_BASE64.replace(/\s/g, "");
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const form = pdfDoc.getForm();
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Lease_${(data["TENANTS"] || "Tenant").split(",")[0].trim().replace(/\s+/g, "_")}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) { alert("PDF generation failed: " + err.message); }
    setPdfLoading(false);
  }, [data, checks]);

  const fmtMoney = v => v ? `$${parseFloat(v).toLocaleString()}` : "___";

  const inputStyle = (field) => ({
    padding: "8px 11px",
    border: `0.5px solid ${data[field.id] ? colors.goldMid : "#ccc"}`,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    color: colors.dark,
    background: field.readonly ? (data[field.id] ? colors.goldLight : "#f5f5f3") : (data[field.id] ? colors.goldLight : "#fff"),
    outline: "none",
    width: "100%",
    fontWeight: data[field.id] && field.readonly ? 500 : 400,
    cursor: field.readonly ? "default" : "text",
  });

  return (
    <div style={styles.app}>
      <div style={styles.topbar}>
        <div>
          <div style={styles.topbarTitle}>Capri Equities Property Management</div>
          <div style={styles.topbarSub}>Lease Generator</div>
        </div>
        <button
          style={{ background: colors.gold, color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}
          onClick={downloadPDF} disabled={pdfLoading}
        >
          ↓ Download PDF
        </button>
      </div>

      <div style={styles.main}>
        <div style={styles.logoWrap}>
          <div style={styles.logoText}>CAPRI EQUITIES LP</div>
          <p style={styles.logoSub}>Residential Lease Generator</p>
        </div>

        <div style={styles.progressRow}>
          <span style={styles.progLabel}>{filled} of {total} fields</span>
          <div style={styles.progTrack}>
            <div style={{ height: 3, background: colors.gold, borderRadius: 99, width: `${pct}%`, transition: "width 0.3s ease" }} />
          </div>
          <span style={styles.progLabel}>{pct}%</span>
        </div>

        <div style={styles.aiBar}>
          <span style={styles.aiBarText}>
            {aiLoading ? "Thinking…" : aiMsg === "success" ? "✓ Fields filled — review and adjust as needed." : aiMsg.startsWith("error") ? `⚠ ${aiMsg}` : aiMsg || "Auto-fill remaining fields using AI"}
          </span>
          <button
            style={{ background: colors.dark, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#fff", cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
            onClick={autoFill}
            disabled={aiLoading}
          >
            {aiLoading ? "…" : "✦ Fill with AI"}
          </button>
        </div>

        {SECTIONS.map(sec => {
          const secChecks = CHECKBOXES.filter(c => sec.checkboxIds?.includes(c.id));
          return (
            <div key={sec.id} style={styles.section}>
              <div style={styles.sectionLabel}>{sec.label}</div>

              {secChecks.length > 0 && (
                <div style={styles.cbRow}>
                  {secChecks.map(cb => (
                    <label key={cb.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#555", cursor: "pointer" }}>
                      <input type="checkbox" checked={!!checks[cb.id]} onChange={e => setCheck(cb.id, e.target.checked)} style={{ accentColor: colors.dark, width: 14, height: 14, cursor: "pointer" }} />
                      {cb.label}
                    </label>
                  ))}
                </div>
              )}

              <div style={styles.grid}>
                {sec.fields.map(field => (
                  <div key={field.id} style={{ display: "flex", flexDirection: "column", gridColumn: field.wide ? "1 / -1" : undefined }}>
                    <label style={styles.fieldLabel}>
                      {field.label}
                      {(field.autoCalc || (field.readonly && !field.autoCalc)) && (
                        <span style={styles.autoBadge}>auto</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={
                        field.type === "number"
                          ? (rawInputs[field.id] !== undefined
                              ? rawInputs[field.id]
                              : (data[field.id] ? `$${parseFloat(data[field.id]).toLocaleString()}` : ""))
                          : (data[field.id] || "")
                      }
                      onChange={e => {
                        if (field.readonly) return;
                        if (field.type === "number") {
                          const raw = e.target.value.replace(/[^0-9.]/g, "");
                          setRawInputs(prev => ({ ...prev, [field.id]: raw }));
                          set(field.id, raw);
                        } else {
                          set(field.id, e.target.value);
                        }
                      }}
                      onFocus={() => {
                        if (field.type === "number" && data[field.id]) {
                          setRawInputs(prev => ({ ...prev, [field.id]: data[field.id] }));
                        }
                      }}
                      onBlur={() => {
                        if (field.type === "number") {
                          setRawInputs(prev => { const n = { ...prev }; delete n[field.id]; return n; });
                        }
                      }}
                      readOnly={field.readonly}
                      placeholder={field.placeholder}
                      style={inputStyle(field)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Prorated Rent Calculator */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Prorated Rent Calculator</div>
          <ProratedCalc onApply={(amount, from, to) => {
            setData(prev => ({
              ...prev,
              "A prorated share of rent in the sum of": String(amount),
              "the period from": from,
              "to": to,
            }));
          }} monthlyRent={data["undefined"]} leaseStart={data["RENTAL AMOUNT Commencing"]} />
        </div>

                {data["TENANTS"] && data["PROPERTY ADDRESS"] && (
          <div style={styles.preview}>
            <strong style={{ color: colors.dark }}>{data["TENANTS"]}</strong> will lease{" "}
            <strong style={{ color: colors.dark }}>{data["PROPERTY ADDRESS"]}</strong> from{" "}
            <strong style={{ color: colors.dark }}>{data["LANDLORD"] || "___"}</strong> at{" "}
            <strong style={{ color: colors.dark }}>{fmtMoney(data["undefined"])}</strong>/month.{" "}
            Security deposit: <strong style={{ color: colors.dark }}>{fmtMoney(data["3 SECURITY DEPOSITS TENANT shall deposit with landlord the sum of"])}</strong>.{" "}
            Total due at signing: <strong style={{ color: colors.dark }}>{fmtMoney(data["for a total of"])}</strong>.
          </div>
        )}

        <button style={{...styles.btnDlFull, opacity: pdfLoading ? 0.6 : 1, cursor: pdfLoading ? "not-allowed" : "pointer"}} onClick={downloadPDF} disabled={pdfLoading}>
          {pdfLoading ? "Filling PDF…" : "↓ Download filled lease PDF"}
        </button>
        <p style={styles.dlNote}>Downloads the original Dennis P. Block lease with your info filled in</p>
      </div>
    </div>
  );
}
