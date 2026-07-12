// src/components/tools/TwelveMonthCalendar.tsx
// 12-month calendar view — full year at a glance, with holidays + DST markers.

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
// (i18n not yet implemented for this tool)

const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface Holiday { name: string; date: string; cca2: string; type: string; }

export default function TwelveMonthCalendar() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [country, setCountry] = useState("US");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://dev.api.dateandtime.live/api/v1/holidays/year?country=${country}&year=${year}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setHolidays(j?.data?.holidays ?? []); })
      .catch(() => { if (!cancelled) setHolidays([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, country]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const firstDay = new Date(year, monthIdx, 1);
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      const startWeekday = firstDay.getDay();
      const cells: Array<{ day: number | null; date?: string }> = [];
      for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
      for (let d = 1; d <= daysInMonth; d++) {
        const mm = String(monthIdx + 1).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        cells.push({ day: d, date: `${year}-${mm}-${dd}` });
      }
      return { name: MONTH_NAMES_EN[monthIdx], cells };
    });
  }, [year]);

  const holidaysByDate = useMemo(() => {
    const map: Record<string, Holiday> = {};
    for (const h of holidays) {
      if (h.date && h.date.length === 10) map[h.date] = h;
    }
    return map;
  }, [holidays]);

  return (
    <div className="tdp-tool tdp-tool-calendar" data-testid="tool-12-month-calendar">
      <header className="tdp-tool-header">
        <h2 className="tdp-tool-title">""</h2>
        <p className="tdp-tool-sub">""</p>
      </header>

      <div className="tdp-tool-controls">
        <div className="tdp-tool-control-group">
          <label>Year</label>
          <div className="tdp-tool-year-nav">
            <button onClick={() => setYear(year - 1)} aria-label="Previous year"><ChevronLeft size={16} /></button>
            <strong>{year}</strong>
            <button onClick={() => setYear(year + 1)} aria-label="Next year"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="tdp-tool-control-group">
          <label>Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="US">🇺🇸 US</option>
            <option value="GB">🇬🇧 UK</option>
            <option value="FR">🇫🇷 France</option>
            <option value="DE">🇩🇪 Germany</option>
            <option value="JP">🇯🇵 Japan</option>
            <option value="CN">🇨🇳 China</option>
            <option value="IN">🇮🇳 India</option>
            <option value="BR">🇧🇷 Brazil</option>
            <option value="AU">🇦🇺 Australia</option>
            <option value="CA">🇨🇦 Canada</option>
          </select>
        </div>
        {loading && <span className="tdp-tool-loading">Loading…</span>}
      </div>

      <div className="tdp-calendar-grid">
        {months.map((m) => (
          <div key={m.name} className="tdp-calendar-month" data-testid={`calendar-month-${m.name.toLowerCase()}`}>
            <h3 className="tdp-calendar-month-name">{m.name}</h3>
            <div className="tdp-calendar-weekdays">
              {WEEKDAYS_EN.map((w) => (<span key={w}>{w[0]}</span>))}
            </div>
            <div className="tdp-calendar-days">
              {m.cells.map((c, idx) => {
                if (c.day === null) return <span key={idx} className="tdp-calendar-day--empty" />;
                const holiday = c.date ? holidaysByDate[c.date] : undefined;
                return (
                  <span
                    key={idx}
                    className={`tdp-calendar-day ${holiday ? "tdp-calendar-day--holiday" : ""}`}
                    title={holiday ? `${holiday.name} (${holiday.type})` : undefined}
                    data-holiday={holiday ? holiday.name : undefined}
                  >
                    {c.day}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(holidaysByDate).length > 0 && (
        <div className="tdp-calendar-legend">
          <strong>Holidays in {year}:</strong>
          <ul>
            {Object.entries(holidaysByDate).slice(0, 8).map(([date, h]) => (
              <li key={date}><span className="tdp-calendar-legend-date">{date.slice(5)}</span> {h.name}</li>
            ))}
            {Object.keys(holidaysByDate).length > 8 && <li>… and {Object.keys(holidaysByDate).length - 8} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
