import React, { useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import { getToolI18n } from "../../utils/toolTranslations";
import ToolSdkPanel from "./ToolSdkPanel";

interface Props { lang?: string; }

export default function ISO8601Formatter({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 16));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const d = new Date(dateStr);
  const valid = !isNaN(d.getTime());

  const variants = valid ? [
    { label: "ISO 8601 (UTC, ms)", value: d.toISOString() },
    { label: "ISO 8601 (UTC, s)", value: d.toISOString().replace(/\.\d{3}Z$/, "Z") },
    { label: "RFC 3339", value: d.toISOString() },
    { label: "RFC 2822", value: d.toUTCString() },
    { label: "Unix (seconds)", value: String(Math.floor(d.getTime() / 1000)) },
    { label: "Unix (milliseconds)", value: String(d.getTime()) },
    { label: "ISO Date only", value: d.toISOString().slice(0, 10) },
    { label: "ISO Week", value: (() => { const t = new Date(d); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); const y = t.getUTCFullYear(); const w = Math.ceil((((t.getTime() - Date.UTC(y, 0, 1)) / 86400000) + 1) / 7); return `${y}-W${String(w).padStart(2, "0")}`; })() },
    { label: "ISO Ordinal Day", value: (() => { const s = new Date(Date.UTC(d.getFullYear(), 0, 1)); const day = Math.floor((d.getTime() - s.getTime()) / 86400000) + 1; return `${d.getFullYear()}-${String(day).padStart(3, "0")}`; })() },
    { label: "Local (en-US)", value: d.toLocaleString("en-US") },
    { label: "Local (ja-JP)", value: d.toLocaleString("ja-JP") },
    { label: "Local (zh-CN)", value: d.toLocaleString("zh-CN") },
    { label: "Local (fr-FR)", value: d.toLocaleString("fr-FR") },
    { label: "JSON (ISO)", value: JSON.stringify(d) }
  ] : [];

  const copyTo = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#212121]">
      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <header className="mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
            <FileCode size={11} /> ISO 8601 FORMAT ENGINE
          </span>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-[#212121]">{t.iso8601Output}</h1>
          <p className="mt-1 text-sm text-[#616161]">{t.rfc3339} · {t.rfc2822} · {t.withTimezone} · {t.utc}</p>
        </header>
        <div>
          <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.formatDate}</label>
          <input type="datetime-local" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
            className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[#212121] outline-none focus:border-[#3f51b5]" />
          {!valid && <p className="text-[10px] text-rose-600 mt-2">Invalid date</p>}
        </div>

        {valid && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider border-b border-[#eeeeee] pb-2">{t.iso8601Output}</div>
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-[#fafafa] border border-[#e0e0e0] rounded-xl hover:border-[#3f51b5]/40 transition">
                <div className="text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider w-44 shrink-0">{v.label}</div>
                <div className="flex-1 text-sm font-mono font-bold text-[#212121] break-all">{v.value}</div>
                <button onClick={() => copyTo(v.value, `v${i}`)} className="p-1.5 rounded-lg hover:bg-white text-[#9e9e9e] hover:text-[#3f51b5] transition shrink-0">
                  {copiedKey === `v${i}` ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToolSdkPanel
        summary="Format any date as ISO 8601, RFC 3339, RFC 2822, ISO Week, ISO Ordinal, or ISO Basic — with optional timezone."
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const result = await client.time.iso({
  date: "2026-07-08",
  format: "rfc3339",
  tz: "America/New_York",
});
console.log(result.output); // "2026-07-07T20:00:00-04:00"

// Other formats: "week", "ordinal", "basic", "rfc2822"
const week = await client.time.iso({
  date: "2026-07-08",
  format: "week",
});
console.log(week.output); // "2026-W28"`}
        curlCode={`curl "https://timeanddatepro.com/api/v1/time/iso?date=2026-07-08&format=rfc3339&tz=America/New_York"
curl "https://timeanddatepro.com/api/v1/time/iso?date=2026-07-08&format=week"`}
        docsHref="/docs/integrations/iso8601-formatter"
      />
    </div>
  );
}
