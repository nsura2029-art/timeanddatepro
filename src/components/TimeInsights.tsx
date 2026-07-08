import React from "react";
import { 
  Lightbulb, 
  ArrowRight, 
  Calendar, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { CountryPreferences } from "../types";
import { getTheme } from "../utils/theme";

interface TimeInsightsProps {
  preferences: CountryPreferences;
  onNavigateToTool: (toolId: string) => void;
}

export default function TimeInsights({ preferences, onNavigateToTool }: TimeInsightsProps) {
  const t = getTheme(preferences.theme);
  const getInsights = (): { title: string; text: string; icon: any; actionText: string; toolId: string; type: "info" | "warning" | "success" }[] => {
    const country = preferences.country;

    if (country === "US") {
      return [
        {
          title: "Best US–India Meeting Window",
          text: "Today’s balanced window is 8:30 AM–11:00 AM New York / 6:00 PM–8:30 PM India. Avoids early mornings or deep nights.",
          icon: Clock,
          actionText: "Open meeting planner",
          toolId: "planner",
          type: "success"
        },
        {
          title: "Upcoming US DST Shift",
          text: "Daylight Saving Time (DST) ends on November 1. Your European and Asian meeting times will shift by 1 hour.",
          icon: AlertTriangle,
          actionText: "Check Time Converter",
          toolId: "converter",
          type: "warning"
        },
        {
          title: "Long Weekend Checklist",
          text: "Labor Day is 62 days away (Sept 7), giving you a 3-day weekend. Use your business days tool to plan deadlines.",
          icon: Calendar,
          actionText: "Plan working days",
          toolId: "business",
          type: "info"
        }
      ];
    } else if (country === "IN") {
      return [
        {
          title: "Best US–India Sync Hours",
          text: "Your optimal overlap slot to sync with NYC / East Coast is 6:00 PM–8:30 PM IST (which is 8:30 AM–11:00 AM New York).",
          icon: Clock,
          actionText: "Align calendars",
          toolId: "planner",
          type: "success"
        },
        {
          title: "Eid al-Adha Calendar Break",
          text: "Upcoming bank/public holidays are approaching. Ensure business day count calculations are calibrated.",
          icon: Calendar,
          actionText: "Verify business days",
          toolId: "business",
          type: "info"
        },
        {
          title: "London Time Offset Notice",
          text: "London is currently exactly 4.5 hours behind you. This will increase to 5.5 hours when the UK exits summer time.",
          icon: AlertTriangle,
          actionText: "Verify GMT conversions",
          toolId: "converter",
          type: "warning"
        }
      ];
    } else if (country === "DE") {
      return [
        {
          title: "Optimal Singapore Sync Window",
          text: "The best overlap window for Berlin and Singapore is 8:00 AM–11:00 AM Berlin (2:00 PM–5:00 PM Singapore).",
          icon: Clock,
          actionText: "Open meeting planner",
          toolId: "planner",
          type: "success"
        },
        {
          title: "German Unity Day compensated?",
          text: "Tag der Deutschen Einheit on Oct 3 falls on a Saturday in 2026. Check your regional bank rules regarding compensation.",
          icon: Calendar,
          actionText: "Check holiday list",
          toolId: "business",
          type: "warning"
        },
        {
          title: "Euro DST Schedule",
          text: "DST ends on Sunday, October 25. Standard winter offset (CET, UTC+1) will resume.",
          icon: AlertTriangle,
          actionText: "Convert times",
          toolId: "converter",
          type: "info"
        }
      ];
    } else if (country === "JP") {
      return [
        {
          title: "Japan–Australia Overlap",
          text: "Tokyo and Sydney have a highly synced 1-hour timezone wave. Enjoy overlap throughout entire business days (9 AM - 5 PM).",
          icon: Clock,
          actionText: "Examine overlaps",
          toolId: "planner",
          type: "success"
        },
        {
          title: "Mountain Day (Yama no Hi) Countdown",
          text: "Japan's next public holiday is Mountain Day on August 11, creating a valuable planning window.",
          icon: Calendar,
          actionText: "Calculate working days",
          toolId: "business",
          type: "info"
        }
      ];
    } else if (country === "AE") {
      return [
        {
          title: "Core UAE–UK Overlap Alignment",
          text: "The best window for Dubai to sync with London is 12:00 PM–4:00 PM UAE (which is 9:00 AM–1:00 PM London).",
          icon: Clock,
          actionText: "Open meeting planner",
          toolId: "planner",
          type: "success"
        },
        {
          title: "National Day Long Weekend",
          text: "UAE National Day falls on Dec 2, providing a mid-week public holiday opportunity.",
          icon: Calendar,
          actionText: "Add holiday countdown",
          toolId: "countdown",
          type: "info"
        }
      ];
    }

    // Default Fallback
    return [
      {
        title: "Best Overlap Window Finder",
        text: "The general overlap window for cross-continent coordination is between 12:00 UTC and 15:00 UTC.",
        icon: Clock,
        actionText: "Open meeting planner",
        toolId: "planner",
        type: "success"
      },
      {
        title: "UTC Conversion Anchor",
        text: "All SaaS architectures and APIs rely on Unix epoch standards. Easily convert timestamps with the terminal helper.",
        icon: Lightbulb,
        actionText: "Unix converter",
        toolId: "unix",
        type: "info"
      }
    ];
  };

  const insights = getInsights();

  return (
    <div className="scroll-mt-20">
      <div className="mb-6">
        <span className={`text-xs font-mono ${t.accentText} font-semibold uppercase tracking-wider`}>Smart Recommendations</span>
        <h2 className={`text-2xl font-sans font-semibold ${t.text} tracking-tight mt-1`}>Personalized Time Insights</h2>
        <p className="text-xs text-slate-400 mt-1">Proactive workspace alerts warning of shifting overlaps and local productivity trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {insights.map((ins, idx) => {
          const IconComponent = ins.icon;
          
          let cardBorder = `${t.border} ${t.borderHover}`;
          let iconColor = `text-blue-500 bg-blue-500/10`;
          if (ins.type === "warning") {
            cardBorder = "border-amber-500/20 hover:border-amber-500/40";
            iconColor = "text-amber-500 bg-amber-500/10";
          } else if (ins.type === "success") {
            cardBorder = "border-emerald-500/20 hover:border-emerald-500/40";
            iconColor = "text-emerald-500 bg-emerald-500/10";
          }

          return (
            <div 
              key={idx}
              className={`rounded-xl border ${cardBorder} ${t.cardBg} p-5 shadow-lg flex flex-col justify-between hover:bg-slate-50/40 transition-all`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${iconColor}`}>
                    <IconComponent size={18} />
                  </div>
                  <h3 className={`text-sm font-semibold ${t.text}`}>{ins.title}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-3.5 leading-relaxed">{ins.text}</p>
              </div>

              <div className={`border-t ${t.border} mt-5 pt-4`}>
                <button 
                  onClick={() => onNavigateToTool(ins.toolId)}
                  className={`inline-flex items-center gap-1.5 text-xs ${t.accentText} hover:opacity-80 font-semibold transition cursor-pointer`}
                >
                  <span>{ins.actionText}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
