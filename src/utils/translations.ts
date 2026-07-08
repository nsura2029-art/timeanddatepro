export interface TranslationSet {
  title: string;
  subtitle: string;
  exploreBtn: string;
  plannerBtn: string;
  syncTitleBehind: string;
  syncAccuracy: string;
  syncTimeNowIn: string;
  heroHeadline: string;
  heroDescription: string;
  workHoursLabel: string;
  firstDayLabel: string;
  holidaysTitle: string;
  activeCityBadge: string;
  flagAlt: string;
}

export const TRANSLATIONS: Record<string, TranslationSet> = {
  en: {
    title: "Synchronized World Time Intelligence",
    subtitle: "Professional-grade atomic synchronization, zone coordination, and custom workday optimization for high-performance global teams.",
    exploreBtn: "Explore Zones",
    plannerBtn: "Meeting Planner",
    syncTitleBehind: "Your clock is 0.4 seconds behind.",
    syncAccuracy: "Accuracy of synchronization was ±0.089 seconds.",
    syncTimeNowIn: "Time in {location} now:",
    heroHeadline: "Welcome to London Command Center",
    heroDescription: "Configured for the United Kingdom. Experience atomic precision with direct GMT / BST adjustments, integrated banking holiday calendars, and coordinated standard operating hours.",
    workHoursLabel: "Standard Working Hours",
    firstDayLabel: "First Day of Week",
    holidaysTitle: "Upcoming National Holidays",
    activeCityBadge: "Active Command Center: London",
    flagAlt: "United Kingdom Flag"
  },
  fr: {
    title: "Intelligence Temporelle Mondiale Synchronisée",
    subtitle: "Synchronisation atomique professionnelle, coordination de zones et optimisation personnalisée de la journée de travail pour les équipes mondiales.",
    exploreBtn: "Explorer les Zones",
    plannerBtn: "Planificateur de Réunions",
    syncTitleBehind: "Votre horloge a 0,4 secondes de retard.",
    syncAccuracy: "La précision de la synchronisation était de ±0,089 secondes.",
    syncTimeNowIn: "Heure à {location} actuellement :",
    heroHeadline: "Bienvenue au Centre de Commande de Paris",
    heroDescription: "Configuré pour la République Française. Découvrez une précision chronométrique absolue, un calendrier complet des jours fériés français et une harmonisation automatique des heures de travail.",
    workHoursLabel: "Heures Standard de Travail",
    firstDayLabel: "Premier Jour de la Semaine",
    holidaysTitle: "Prochains Jours Fériés Nationaux",
    activeCityBadge: "Centre de Commande Actif : Paris",
    flagAlt: "Drapeau Français"
  },
  zh: {
    title: "全球同步时间智能指挥中心",
    subtitle: "面向高效率全球协作团队的专业级原子钟同步、多时区协调以及个性化工作日日程优化系统。",
    exploreBtn: "探索全球时区",
    plannerBtn: "跨时区会议策划",
    syncTitleBehind: "您的系统时钟慢了 0.4 秒。",
    syncAccuracy: "时间同步精度达 ±0.089 秒。",
    syncTimeNowIn: "当前{location}的时间：",
    heroHeadline: "欢迎进入北京时间指挥中心",
    heroDescription: "专为中国标准时间定制。采用毫秒级精准同步，集成中国法定节假日（春节、国庆等）与标准朝九晚五（或定制）高效作息协同系统。",
    workHoursLabel: "标准法定工作时间",
    firstDayLabel: "每周起始工作日",
    holidaysTitle: "中国法定节假日安排",
    activeCityBadge: "活动指挥中心：北京",
    flagAlt: "中国国旗"
  },
  ja: {
    title: "同期型グローバル時間インテリジェンス",
    subtitle: "高性能なグローバルチーム向けに設計された、プロ仕様の原子時計同期、複数タイムゾーン調整、およびカスタムワークデイ最適化システム。",
    exploreBtn: "タイムゾーン探索",
    plannerBtn: "ミーティングプランナー",
    syncTitleBehind: "お使いの時計は 0.4 秒遅れています。",
    syncAccuracy: "同期の精度は ±0.089 秒でした。",
    syncTimeNowIn: "現在の{location}の時刻：",
    heroHeadline: "東京タイム・コマンドセンターへようこそ",
    heroDescription: "日本標準時（JST）用に最適化されています。日本の祝日スケジュール（ゴールデンウィーク、山の日など）や、独自のビジネス習慣、標準勤務時間の調整を完全サポートします。",
    workHoursLabel: "標準勤務時間帯",
    firstDayLabel: "週の開始曜日",
    holidaysTitle: "今後の国民の祝日一覧",
    activeCityBadge: "アクティブ・コマンドセンター：東京",
    flagAlt: "日本国旗"
  }
};
