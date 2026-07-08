export type ThemeType = "slate" | "cyber" | "emerald" | "amber" | "ocean";

export interface ThemeColors {
  name: string;
  description: string;
  bg: string;
  text: string;
  textMuted: string;
  border: string;
  borderHover: string;
  cardBg: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  btnPrimary: string;
  btnPrimaryHover: string;
  ambientGradient: string;
  badgeClass: string;
  glow: string;
  previewColors: string[]; // for dot previews
}

export const THEME_CONFIGS: Record<ThemeType, ThemeColors> = {
  slate: {
    name: "Classic Alabaster",
    description: "Elegant, crisp white theme with premium slate details and slate-charcoal text.",
    bg: "bg-white",
    text: "text-slate-900",
    textMuted: "text-slate-500",
    border: "border-slate-200/80",
    borderHover: "hover:border-slate-300",
    cardBg: "bg-slate-50/70",
    accentText: "text-blue-600",
    accentBg: "bg-blue-50/80",
    accentBorder: "border-blue-100",
    btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
    btnPrimaryHover: "hover:bg-blue-700",
    ambientGradient: "from-slate-50/50 via-white to-white",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
    glow: "shadow-sm shadow-slate-200",
    previewColors: ["bg-white", "bg-slate-100", "bg-blue-600"]
  },
  cyber: {
    name: "Neon Breeze",
    description: "Pure white canvas featuring high-contrast indigo and amethyst neon accents.",
    bg: "bg-white",
    text: "text-indigo-950",
    textMuted: "text-indigo-500",
    border: "border-indigo-100",
    borderHover: "hover:border-indigo-200",
    cardBg: "bg-indigo-50/30",
    accentText: "text-purple-600",
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-100",
    btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    btnPrimaryHover: "hover:bg-indigo-700",
    ambientGradient: "from-indigo-50/30 via-white to-white",
    badgeClass: "bg-purple-50 text-purple-700 border border-purple-200",
    glow: "shadow-sm shadow-indigo-100",
    previewColors: ["bg-white", "bg-indigo-50", "bg-purple-600"]
  },
  emerald: {
    name: "Emerald Meadow",
    description: "Fresh sage and bright white canvas paired with deep rich forest emerald highlights.",
    bg: "bg-white",
    text: "text-stone-900",
    textMuted: "text-stone-500",
    border: "border-stone-200/80",
    borderHover: "hover:border-emerald-300",
    cardBg: "bg-emerald-50/30",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-100",
    btnPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    btnPrimaryHover: "hover:bg-emerald-700",
    ambientGradient: "from-emerald-50/20 via-white to-white",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    glow: "shadow-sm shadow-emerald-100",
    previewColors: ["bg-white", "bg-stone-100", "bg-emerald-600"]
  },
  amber: {
    name: "Amber Autumn",
    description: "Warm off-white background with golden harvest and deep bronze details.",
    bg: "bg-white",
    text: "text-zinc-900",
    textMuted: "text-zinc-500",
    border: "border-zinc-200/80",
    borderHover: "hover:border-amber-300",
    cardBg: "bg-amber-50/25",
    accentText: "text-amber-700",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-100",
    btnPrimary: "bg-amber-500 hover:bg-amber-600 text-zinc-950",
    btnPrimaryHover: "hover:bg-amber-600",
    ambientGradient: "from-amber-50/20 via-white to-white",
    badgeClass: "bg-amber-50 text-amber-800 border border-amber-200",
    glow: "shadow-sm shadow-amber-100",
    previewColors: ["bg-white", "bg-zinc-100", "bg-amber-500"]
  },
  ocean: {
    name: "Teal Breeze",
    description: "Light coastal white canvas matched with refreshing aqua and sea glass colors.",
    bg: "bg-white",
    text: "text-slate-900",
    textMuted: "text-slate-500",
    border: "border-teal-100",
    borderHover: "hover:border-teal-200",
    cardBg: "bg-teal-50/35",
    accentText: "text-teal-700",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    btnPrimary: "bg-teal-600 hover:bg-teal-700 text-white",
    btnPrimaryHover: "hover:bg-teal-700",
    ambientGradient: "from-teal-50/20 via-white to-white",
    badgeClass: "bg-teal-50 text-teal-700 border border-teal-200",
    glow: "shadow-sm shadow-teal-100",
    previewColors: ["bg-white", "bg-slate-100", "bg-teal-500"]
  }
};

export function getTheme(themeName?: string): ThemeColors {
  const name = (themeName || "slate") as ThemeType;
  return THEME_CONFIGS[name] || THEME_CONFIGS.slate;
}
