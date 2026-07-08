import React, { useState, useEffect } from "react";
import { Clock, Copy, Check, Hash } from "lucide-react";
import { getToolI18n } from "../../utils/toolTranslations";

interface Props { lang?: string; }

export default function UnixTimestampConverter({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  const [now, setNow] = useState(new Date());
  const [epoch, setEpoch] = useState(Math.floor(Date.now() / 1000));
  const [unit, setUnit] = useState<"s" | "ms">("s");
  const [pickedDate, setPickedDate] = useState(new Date().toISOString().slice(0, 16));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    setEpoch(unit === "s" ? Math.floor(Date.now() / 1000) : Date.now());
  }, [now, unit]);

  const dateFromEpoch = new Date(unit === "s" ? epoch * 1000 : epoch);
  const localeStr = (d: Date) => d.toLocaleString(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "fr" ? "fr-FR" : "en-US");
  const isoStr = (d: Date) => d.toISOString();
  const utcStr = (d: Date) => d.toUTCString();

  const handleDateChange = (v: string) => {
    setPickedDate(v);
    const d = new Date(v);
    if (!isNaN(d.getTime())) setEpoch(unit === "s" ? Math.floor(d.getTime() / 1000) : d.getTime());
  };

  const handleEpochChange = (v: string) => {
    const n = parseInt(v);
    if (!isNaN(n)) setEpoch(n);
  };

  const copyTo = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const diffMs = dateFromEpoch.getTime() - now.getTime();
  const diffLabel = diffMs === 0 ? t.now : (diffMs > 0 ? `${Math.abs(diffMs/1000).toFixed(0)}s ${t.inFuture}` : `${Math.abs(diffMs/1000).toFixed(0)}s ${t.ago}`);

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button onClick={() => copyTo(text, k)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#9e9e9e] hover:text-[#3f51b5] transition">
      {copiedKey === k ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#212121]">
      <div className="rounded-3xl bg-gradient-to-r from-[#e8eaf6] via-[#e0f2f1] to-[#e8f5e9] p-8 md:p-12 text-center relative overflow-hidden shadow-sm border border-[#e0e0e0]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fce4ec]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#2e7d32] text-xs font-semibold shadow-sm border border-[#eeeeee]">
            <Hash size={14} /> UNIX EPOCH CONVERTER
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#212121]">{t.unixTimestamp}</h1>
          <p className="text-sm md:text-base text-[#616161] font-sans leading-relaxed">
            {t.unixSeconds} / {t.unixMilliseconds} ↔ {t.isoString}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider">
            <Clock size={14} /> {t.nowAsEpoch}
          </div>
          <div className="flex gap-1 bg-[#fafafa] border border-[#e0e0e0] rounded-lg p-0.5">
            {(["s", "ms"] as const).map(u => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold transition ${unit === u ? "bg-[#3f51b5] text-white" : "text-[#616161]"}`}>
                {u === "s" ? t.unixSeconds : t.unixMilliseconds}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider">{t.currentEpoch}</label>
            <div className="flex items-center gap-2">
              <input type="text" value={epoch} onChange={(e) => handleEpochChange(e.target.value)}
                className="flex-1 bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-base font-mono font-bold text-[#3f51b5] outline-none focus:border-[#3f51b5]" />
              <CopyBtn text={String(epoch)} k="epoch" />
            </div>
            <div className="text-[10px] font-mono text-[#9e9e9e]">{diffLabel}</div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider">{t.pasteEpoch}</label>
            <input type="datetime-local" value={pickedDate} onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm text-[#212121] font-semibold outline-none focus:border-[#3f51b5]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#eeeeee]">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider">{t.utcTime}</span>
              <CopyBtn text={utcStr(dateFromEpoch)} k="utc" />
            </div>
            <div className="text-sm font-mono font-bold text-[#212121] bg-[#fafafa] border border-[#e0e0e0] rounded-lg px-3 py-2 break-all">
              {utcStr(dateFromEpoch)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider">{t.localTime}</span>
              <CopyBtn text={localeStr(dateFromEpoch)} k="local" />
            </div>
            <div className="text-sm font-mono font-bold text-[#212121] bg-[#fafafa] border border-[#e0e0e0] rounded-lg px-3 py-2 break-all">
              {localeStr(dateFromEpoch)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#9e9e9e] uppercase tracking-wider">{t.isoString}</span>
              <CopyBtn text={isoStr(dateFromEpoch)} k="iso" />
            </div>
            <div className="text-sm font-mono font-bold text-[#3f51b5] bg-[#fafafa] border border-[#e0e0e0] rounded-lg px-3 py-2 break-all">
              {isoStr(dateFromEpoch)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
