import React, { useState, useEffect } from "react";
import { Type, Clock, Calendar } from "lucide-react";
import { getToolI18n } from "../../utils/toolTranslations";
import ToolSdkPanel from "./ToolSdkPanel";
import ApiVerifyChip from "./ApiVerifyChip";
import { dateWordsVerify } from "../../utils/apiToolMap";

interface Props { lang?: string; }

const ORDINALS_EN = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth", "twenty-fifth", "twenty-sixth", "twenty-seventh", "twenty-eighth", "twenty-ninth", "thirtieth", "thirty-first"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const ZH_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const ZH_MONTHS = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const ZH_DAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const numToZh = (n: number): string => {
  if (n === 0) return "零";
  if (n < 10) return ZH_DIGITS[n];
  if (n < 20) return "十" + (n % 10 === 0 ? "" : ZH_DIGITS[n % 10]);
  if (n < 100) return ZH_DIGITS[Math.floor(n / 10)] + "十" + (n % 10 === 0 ? "" : ZH_DIGITS[n % 10]);
  return String(n);
};

const JA_NUMBERS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

const numToJa = (n: number): string => {
  if (n === 0) return "零";
  if (n < 10) return JA_NUMBERS[n];
  if (n < 20) return "十" + (n % 10 === 0 ? "" : JA_NUMBERS[n % 10]);
  if (n < 100) return JA_NUMBERS[Math.floor(n / 10)] + "十" + (n % 10 === 0 ? "" : JA_NUMBERS[n % 10]);
  return String(n);
};

export default function DateToWords({ lang = "en" }: Props) {
  const t = getToolI18n(lang);
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [now, setNow] = useState(new Date());
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const d = new Date(dateStr + "T00:00:00");
  const valid = !isNaN(d.getTime());
  const ref = new Date(refDate + "T00:00:00");

  const buildWords = (date: Date, lng: string): string => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const day = date.getDate();
    const dow = date.getDay();

    if (lng === "fr") {
      return `${ORDINALS_EN[day] || day} ${MONTHS_FR[m]} ${y} (${DAYS_FR[dow]})`;
    }
    if (lng === "zh") {
      return `${y}年${ZH_MONTHS[m]}${numToZh(day)}日 ${ZH_DAYS[dow]}`;
    }
    if (lng === "ja") {
      return `${y}年${(m + 1)}月${numToJa(day)}日 (${["日", "月", "火", "水", "木", "金", "土"][dow]}曜日)`;
    }
    return `${DAYS_EN[dow]}, ${MONTHS_EN[m]} ${day}, ${y}`;
  };

  const relativeTime = (): string => {
    if (!valid) return "—";
    const diff = d.getTime() - ref.getTime();
    const days = Math.round(diff / 86400000);
    const rtf = new Intl.RelativeTimeFormat(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "fr" ? "fr-FR" : "en-US", { numeric: "auto" });
    if (Math.abs(days) >= 365) return rtf.format(Math.round(days / 365), "year");
    if (Math.abs(days) >= 30) return rtf.format(Math.round(days / 30), "month");
    if (Math.abs(days) >= 7) return rtf.format(Math.round(days / 7), "week");
    if (Math.abs(days) >= 1) return rtf.format(days, "day");
    const hours = Math.round(diff / 3600000);
    if (Math.abs(hours) >= 1) return rtf.format(hours, "hour");
    const minutes = Math.round(diff / 60000);
    if (Math.abs(minutes) >= 1) return rtf.format(minutes, "minute");
    return rtf.format(0, "second");
  };

  const fromNow = (): string => {
    if (!valid) return "—";
    const diff = d.getTime() - now.getTime();
    const abs = Math.abs(diff);
    const days = Math.floor(abs / 86400000);
    const hours = Math.floor((abs % 86400000) / 3600000);
    const mins = Math.floor((abs % 3600000) / 60000);
    let phrase = "";
    if (days) phrase += `${days}d `;
    if (hours) phrase += `${hours}h `;
    if (mins || !days) phrase += `${mins}m`;
    return diff < 0 ? `${phrase.trim()} ${t.ago}` : `${t.inFuture} ${phrase.trim()}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#212121]">
      <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-xl p-6 md:p-8 space-y-6">
        <header className="mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
            <Type size={11} /> DATE-TO-WORDS ENGINE
          </span>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-[#212121]">{t.writeInWords}</h1>
          <p className="mt-1 text-sm text-[#616161]">{t.spokenForm} · {t.dayOfWeek} · {t.relativeTime}</p>
        </header>
        <div>
          <label className="block text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider mb-2">{t.fullDate}</label>
          <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
            className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[#212121] outline-none focus:border-[#3f51b5]" />
        </div>

        {valid && (
          <div className="rounded-2xl p-6 bg-gradient-to-br from-[#e8eaf6] to-[#e0f2f1] border border-[#3f51b5]/20 text-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#3f51b5] mb-3">{t.writtenForm}</div>
            <div className="text-2xl md:text-3xl font-bold text-[#1a237e] leading-relaxed">{buildWords(d, lang)}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-[10px] font-mono font-bold text-[#9e9e9e] uppercase tracking-wider">{t.referenceDate}</label>
            <input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[#212121] outline-none focus:border-[#3f51b5]" />
            <div className="rounded-2xl p-4 bg-[#fff3e0] border border-[#e65100]/30 text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#e65100] mb-1">{t.relativeTime}</div>
              <div className="text-base font-bold text-[#bf360c]">{relativeTime()}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#3f51b5] uppercase tracking-wider">
              <Clock size={14} /> {t.nowAsEpoch} (Live)
            </div>
            <div className="rounded-2xl p-4 bg-[#f3e5f5] border border-[#7b1fa2]/30 text-center h-full flex flex-col justify-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#7b1fa2] mb-1">{t.now}</div>
              <div className="text-base font-bold text-[#4a148c]">{fromNow()}</div>
            </div>
          </div>
        </div>

        {valid && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[#eeeeee]">
            <div className="text-center p-3 bg-[#fafafa] rounded-xl border border-[#e0e0e0]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9e9e9e]">{t.yearOnly}</div>
              <div className="text-base font-bold text-[#212121] mt-1">{d.getFullYear()}</div>
            </div>
            <div className="text-center p-3 bg-[#fafafa] rounded-xl border border-[#e0e0e0]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9e9e9e]">{t.dayOfWeek}</div>
              <div className="text-base font-bold text-[#212121] mt-1">{lang === "zh" ? ZH_DAYS[d.getDay()] : lang === "ja" ? ["日", "月", "火", "水", "木", "金", "土"][d.getDay()] : (lang === "fr" ? DAYS_FR[d.getDay()] : DAYS_EN[d.getDay()])}</div>
            </div>
            <div className="text-center p-3 bg-[#fafafa] rounded-xl border border-[#e0e0e0]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9e9e9e]">{t.monthName}</div>
              <div className="text-base font-bold text-[#212121] mt-1">{lang === "fr" ? MONTHS_FR[d.getMonth()] : lang === "zh" ? ZH_MONTHS[d.getMonth()] : MONTHS_EN[d.getMonth()]}</div>
            </div>
            <div className="text-center p-3 bg-[#fafafa] rounded-xl border border-[#e0e0e0]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9e9e9e]">{t.ordinal}</div>
              <div className="text-base font-bold text-[#212121] mt-1">{d.getDate()}</div>
            </div>
          </div>
        )}
      </div>
      <ToolSdkPanel
        summary="Natural-language date strings in en/fr/zh/ja — perfect for emails, calendar invites, and accessibility."
        nodeCode={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const result = await client.time.words({
  date: "2026-07-08",
  lang: "fr",
});
console.log(result.output); // "mercredi 8 juillet 2026"`}
        curlCode={`curl "https://timeanddatepro.com/api/v1/time/words?date=2026-07-08&lang=fr"`}
        docsHref="/docs/integrations/date-to-words"
      />
      <ApiVerifyChip config={dateWordsVerify} state={{ date: dateStr, lang }} />
    </div>
  );
}
