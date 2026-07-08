export interface ToolI18n {
  pageTitle: string; pageSubtitle: string; backToHome: string;
  from: string; to: string; result: string; calculate: string; reset: string;
  copy: string; copied: string; share: string; linkCopied: string;
  selectCountry: string; selectYear: string;
  publicHolidays: string; bankHolidays: string; federalHolidays: string;
  religiousHolidays: string; workingHours: string;
  startTime: string; endTime: string; breakMinutes: string;
  workingDays: string; mondayFriday: string; mondaySaturday: string;
  sundayThursday: string; totalWorkingHours: string;
  totalWorkingDays: string; hoursPerDay: string; holidayCalendar: string;
  unixTimestamp: string; unixSeconds: string; unixMilliseconds: string;
  isoString: string; utcTime: string; localTime: string;
  currentEpoch: string; nowAsEpoch: string; pasteEpoch: string;
  past: string; future: string; now: string; ago: string; inFuture: string;
  formatDate: string; iso8601Output: string; rfc3339: string;
  rfc2822: string; withTimezone: string; utc: string; dateOnly: string;
  dateTime: string; duration: string;
  startDate: string; addDays: string; subtractDays: string;
  addWeeks: string; addMonths: string; addYears: string;
  operation: string; add: string; subtract: string;
  businessDaysOnly: string; skipWeekends: string;
  endDate: string; daysBetween: string; weeksBetween: string;
  monthsBetween: string; yearsBetween: string; breakdown: string;
  sameDay: string; inclusive: string; exclusive: string;
  humanized: string; includeEndDate: string; calendarDays: string;
  workingDays: string; totalTime: string; hoursMinutes: string;
  writeInWords: string; wordsOutput: string; relativeTime: string;
  referenceDate: string; useToday: string; fullDate: string;
  dayOfWeek: string; monthName: string; yearOnly: string;
  ordinal: string; spokenForm: string; writtenForm: string;
}

const en: ToolI18n = {
  pageTitle: "Date & Time Tools", pageSubtitle: "Professional-grade calculators for global teams, developers, and personal scheduling.", backToHome: "Back to Home",
  from: "From", to: "To", result: "Result", calculate: "Calculate", reset: "Reset",
  copy: "Copy", copied: "Copied!", share: "Share", linkCopied: "Link copied to clipboard",
  selectCountry: "Country", selectYear: "Year",
  publicHolidays: "Public Holidays", bankHolidays: "Bank Holidays", federalHolidays: "Federal Holidays",
  religiousHolidays: "Religious Holidays", workingHours: "Working Hours",
  startTime: "Start time", endTime: "End time", breakMinutes: "Break (minutes)",
  workingDays: "Working days", mondayFriday: "Mon - Fri", mondaySaturday: "Mon - Sat",
  sundayThursday: "Sun - Thu", totalWorkingHours: "Total working hours",
  totalWorkingDays: "Total working days", hoursPerDay: "hours / day", holidayCalendar: "Holiday Calendar",
  unixTimestamp: "Unix Timestamp", unixSeconds: "Seconds", unixMilliseconds: "Milliseconds",
  isoString: "ISO 8601 String", utcTime: "UTC Time", localTime: "Local Time",
  currentEpoch: "Current Epoch", nowAsEpoch: "Now", pasteEpoch: "Paste an epoch or pick a date",
  past: "in the past", future: "in the future", now: "now", ago: "ago", inFuture: "from now",
  formatDate: "Format a Date", iso8601Output: "ISO 8601 Variants",
  rfc3339: "RFC 3339", rfc2822: "RFC 2822", withTimezone: "With Timezone",
  utc: "UTC", dateOnly: "Date only", dateTime: "Date & Time", duration: "Duration",
  startDate: "Start date", addDays: "Days", subtractDays: "Subtract",
  addWeeks: "Weeks", addMonths: "Months", addYears: "Years",
  operation: "Operation", add: "Add", subtract: "Subtract",
  businessDaysOnly: "Business days only", skipWeekends: "Skip weekends",
  endDate: "End date", daysBetween: "Days", weeksBetween: "Weeks",
  monthsBetween: "Months", yearsBetween: "Years", breakdown: "Breakdown",
  sameDay: "Same day", inclusive: "Inclusive", exclusive: "Exclusive",
  humanized: "Humanized", includeEndDate: "Include end date",
  calendarDays: "Calendar days", workingDays: "Working days",
  totalTime: "Total time", hoursMinutes: "Hours & minutes",
  writeInWords: "Write in Words", wordsOutput: "Words Output", relativeTime: "Relative Time",
  referenceDate: "Reference date", useToday: "Use today", fullDate: "Full date",
  dayOfWeek: "Day of week", monthName: "Month name", yearOnly: "Year",
  ordinal: "Ordinal", spokenForm: "Spoken form", writtenForm: "Written form"
};

const fr: ToolI18n = {
  pageTitle: "Outils de Date et d Heure", pageSubtitle: "Calculateurs professionnels pour equipes internationales, developpeurs et planification personnelle.", backToHome: "Retour a l accueil",
  from: "De", to: "A", result: "Resultat", calculate: "Calculer", reset: "Reinitialiser",
  copy: "Copier", copied: "Copie !", share: "Partager", linkCopied: "Lien copie",
  selectCountry: "Pays", selectYear: "Annee",
  publicHolidays: "Jours Feries", bankHolidays: "Jours Bancaires", federalHolidays: "Jours Federaux",
  religiousHolidays: "Jours Religieux", workingHours: "Heures de Travail",
  startTime: "Heure de debut", endTime: "Heure de fin", breakMinutes: "Pause (minutes)",
  workingDays: "Jours ouvres", mondayFriday: "Lun - Ven", mondaySaturday: "Lun - Sam",
  sundayThursday: "Dim - Jeu", totalWorkingHours: "Total heures de travail",
  totalWorkingDays: "Total jours ouvres", hoursPerDay: "heures / jour", holidayCalendar: "Calendrier des Jours Feries",
  unixTimestamp: "Horodatage Unix", unixSeconds: "Secondes", unixMilliseconds: "Millisecondes",
  isoString: "Chaine ISO 8601", utcTime: "Heure UTC", localTime: "Heure Locale",
  currentEpoch: "Epoch Actuel", nowAsEpoch: "Maintenant", pasteEpoch: "Coller un epoch ou choisir une date",
  past: "dans le passe", future: "dans le futur", now: "maintenant", ago: "il y a", inFuture: "a partir de maintenant",
  formatDate: "Formater une Date", iso8601Output: "Variantes ISO 8601",
  rfc3339: "RFC 3339", rfc2822: "RFC 2822", withTimezone: "Avec Fuseau",
  utc: "UTC", dateOnly: "Date seule", dateTime: "Date & Heure", duration: "Duree",
  startDate: "Date de debut", addDays: "Jours", subtractDays: "Soustraire",
  addWeeks: "Semaines", addMonths: "Mois", addYears: "Annees",
  operation: "Operation", add: "Ajouter", subtract: "Soustraire",
  businessDaysOnly: "Jours ouvres uniquement", skipWeekends: "Exclure les week-ends",
  endDate: "Date de fin", daysBetween: "Jours", weeksBetween: "Semaines",
  monthsBetween: "Mois", yearsBetween: "Annees", breakdown: "Detail",
  sameDay: "Meme jour", inclusive: "Inclusif", exclusive: "Exclusif",
  humanized: "Humanise", includeEndDate: "Inclure la date de fin",
  calendarDays: "Jours calendaires", workingDays: "Jours ouvres",
  totalTime: "Temps total", hoursMinutes: "Heures & minutes",
  writeInWords: "Ecrire en Mots", wordsOutput: "Resultat en mots", relativeTime: "Temps Relatif",
  referenceDate: "Date de reference", useToday: "Aujourd hui", fullDate: "Date complete",
  dayOfWeek: "Jour de la semaine", monthName: "Nom du mois", yearOnly: "Annee",
  ordinal: "Ordinal", spokenForm: "Forme parlee", writtenForm: "Forme ecrite"
};

const zh: ToolI18n = {
  pageTitle: "日期和时间工具", pageSubtitle: "面向全球团队、开发者和个人日程的专业级计算器。", backToHome: "返回首页",
  from: "从", to: "至", result: "结果", calculate: "计算", reset: "重置",
  copy: "复制", copied: "已复制！", share: "分享", linkCopied: "链接已复制",
  selectCountry: "国家", selectYear: "年份",
  publicHolidays: "公共假期", bankHolidays: "银行假期", federalHolidays: "联邦假期",
  religiousHolidays: "宗教节日", workingHours: "工作时间",
  startTime: "开始时间", endTime: "结束时间", breakMinutes: "休息（分钟）",
  workingDays: "工作日", mondayFriday: "周一至周五", mondaySaturday: "周一至周六",
  sundayThursday: "周日至周四", totalWorkingHours: "总工作时间",
  totalWorkingDays: "总工作日", hoursPerDay: "小时/天", holidayCalendar: "假期日历",
  unixTimestamp: "Unix 时间戳", unixSeconds: "秒", unixMilliseconds: "毫秒",
  isoString: "ISO 8601 字符串", utcTime: "UTC 时间", localTime: "本地时间",
  currentEpoch: "当前时间戳", nowAsEpoch: "现在", pasteEpoch: "粘贴时间戳或选择日期",
  past: "过去", future: "未来", now: "现在", ago: "前", inFuture: "后",
  formatDate: "格式化日期", iso8601Output: "ISO 8601 变体",
  rfc3339: "RFC 3339", rfc2822: "RFC 2822", withTimezone: "带时区",
  utc: "UTC", dateOnly: "仅日期", dateTime: "日期和时间", duration: "时长",
  startDate: "开始日期", addDays: "天", subtractDays: "减去",
  addWeeks: "周", addMonths: "月", addYears: "年",
  operation: "操作", add: "加", subtract: "减",
  businessDaysOnly: "仅工作日", skipWeekends: "跳过周末",
  endDate: "结束日期", daysBetween: "天", weeksBetween: "周",
  monthsBetween: "月", yearsBetween: "年", breakdown: "明细",
  sameDay: "同一天", inclusive: "包含", exclusive: "不包含",
  humanized: "人性化", includeEndDate: "包含结束日期",
  calendarDays: "日历天", workingDays: "工作日",
  totalTime: "总时间", hoursMinutes: "小时和分钟",
  writeInWords: "转换为文字", wordsOutput: "文字结果", relativeTime: "相对时间",
  referenceDate: "参考日期", useToday: "今天", fullDate: "完整日期",
  dayOfWeek: "星期", monthName: "月份", yearOnly: "年份",
  ordinal: "序数", spokenForm: "口语形式", writtenForm: "书面形式"
};

const ja: ToolI18n = {
  pageTitle: "日付と時刻ツール", pageSubtitle: "グローバルチーム、開発者、個人スケジューリング向けのプロフェッショナル計算ツール。", backToHome: "ホームに戻る",
  from: "開始", to: "終了", result: "結果", calculate: "計算", reset: "リセット",
  copy: "コピー", copied: "コピー済み！", share: "共有", linkCopied: "リンクをコピーしました",
  selectCountry: "国", selectYear: "年",
  publicHolidays: "公的休日", bankHolidays: "銀行休業日", federalHolidays: "連邦祝日",
  religiousHolidays: "宗教行事", workingHours: "勤務時間",
  startTime: "開始時刻", endTime: "終了時刻", breakMinutes: "休憩（分）",
  workingDays: "営業日", mondayFriday: "月〜金", mondaySaturday: "月〜土",
  sundayThursday: "日〜木", totalWorkingHours: "総勤務時間",
  totalWorkingDays: "総営業日数", hoursPerDay: "時間/日", holidayCalendar: "休日カレンダー",
  unixTimestamp: "Unix タイムスタンプ", unixSeconds: "秒", unixMilliseconds: "ミリ秒",
  isoString: "ISO 8601 文字列", utcTime: "UTC 時刻", localTime: "ローカル時刻",
  currentEpoch: "現在のエポック", nowAsEpoch: "現在", pasteEpoch: "エポックを貼り付けまたは日付を選択",
  past: "過去", future: "未来", now: "現在", ago: "前", inFuture: "後",
  formatDate: "日付をフォーマット", iso8601Output: "ISO 8601 バリアント",
  rfc3339: "RFC 3339", rfc2822: "RFC 2822", withTimezone: "タイムゾーン付き",
  utc: "UTC", dateOnly: "日付のみ", dateTime: "日付と時刻", duration: "期間",
  startDate: "開始日", addDays: "日", subtractDays: "引く",
  addWeeks: "週", addMonths: "月", addYears: "年",
  operation: "操作", add: "足す", subtract: "引く",
  businessDaysOnly: "営業日のみ", skipWeekends: "週末を除く",
  endDate: "終了日", daysBetween: "日", weeksBetween: "週",
  monthsBetween: "月", yearsBetween: "年", breakdown: "内訳",
  sameDay: "同日", inclusive: "含む", exclusive: "含まない",
  humanized: "人間が読みやすい形式", includeEndDate: "終了日を含む",
  calendarDays: "暦日", workingDays: "営業日",
  totalTime: "合計時間", hoursMinutes: "時間と分",
  writeInWords: "文字で書く", wordsOutput: "文字出力", relativeTime: "相対時間",
  referenceDate: "基準日", useToday: "今日", fullDate: "完全な日付",
  dayOfWeek: "曜日", monthName: "月の名前", yearOnly: "年",
  ordinal: "序数", spokenForm: "口頭形式", writtenForm: "書面形式"
};

export const TOOL_TRANSLATIONS: Record<string, ToolI18n> = { en, fr, zh, ja };

export function getToolI18n(lang?: string): ToolI18n {
  return TOOL_TRANSLATIONS[lang || "en"] || TOOL_TRANSLATIONS.en;
}
