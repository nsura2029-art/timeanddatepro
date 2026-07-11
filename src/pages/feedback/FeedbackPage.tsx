// src/pages/feedback/FeedbackPage.tsx
// Feedback / Tool Suggestion page — cloudconvert-style 2-col layout
// with sticky TOC, INSIDE the standard app shell. Width standard
// (polish-8): outer 1600px, content 1120px.
//
// One component = one purpose: collect user feedback, surface the
// community's top suggestions, and answer the most common "how
// does feedback work" questions. Stores entries in localStorage
// (key: tdp_feedback) for now; the T6 backend replaces this.
//
// Sections (sticky TOC sidebar):
//   01 Submit feedback
//   02 Top suggestions
//   03 FAQ
//   04 Contact
//
// Feedback types: suggestion (tool/feature), bug, idea, general.

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  MessageSquare,
  Lightbulb,
  Bug,
  Sparkles,
  Send,
  ArrowLeft,
  Mail,
  Printer,
  Globe,
  ThumbsUp,
  ChevronDown,
  Trash2,
  TrendingUp,
  Clock,
} from "lucide-react";
import "./FeedbackPage.css";

const STORAGE_KEY = "tdp_feedback";
const VOTED_KEY = "tdp_feedback_voted";
// VITE_API_BASE: absolute origin of the feedback API (set at build time).
// - undefined in local dev (Vite) → falls back to relative /api/v1/feedback
//   (proxied to localhost:3000 by the Vite dev server).
// - "https://dev.api.dateandtime.live" in the dev Pages build.
// - "https://api.dateandtime.live" in the prod Pages build.
const RAW_API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined;
const API_BASE = RAW_API_BASE
  ? `${RAW_API_BASE.replace(/\/+$/, "")}/v1/feedback`
  : "/api/v1/feedback";

const SUPPORT_EMAIL = "support@timeanddatepro.com";
const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";

type FeedbackType = "suggestion" | "bug" | "idea" | "general";
const TYPE_SET: ReadonlySet<FeedbackType> = new Set<FeedbackType>(["suggestion", "bug", "idea", "general"]);

interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  votes: number;
  /** ISO timestamp string */
  createdAt: string;
  /** Anonymous user-given name (optional, never required) */
  author?: string;
}

const TYPE_META: Record<FeedbackType, { label: string; icon: React.ReactNode }> = {
  suggestion: { label: "Tool suggestion", icon: <Lightbulb size={12} /> },
  bug:        { label: "Bug report",      icon: <Bug size={12} /> },
  idea:       { label: "Idea",            icon: <Sparkles size={12} /> },
  general:    { label: "General",         icon: <MessageSquare size={12} /> },
};

// Seed entries (used the first time the page is opened, before the
// user has submitted anything). These represent the items we know
// we want to build per the roadmap — gives the page real content
// from day one and demonstrates the voting UI.
const SEED_ENTRIES: FeedbackEntry[] = [
  {
    id: "seed-1",
    type: "suggestion",
    title: "Embeddable world clock widget for any website",
    description: "A one-line iframe that any site can drop in to show a live world clock. Would help news and travel sites.",
    votes: 47,
    createdAt: "2026-06-15T10:00:00.000Z",
  },
  {
    id: "seed-2",
    type: "suggestion",
    title: "Public holiday calendar download (ICS / Google Calendar)",
    description: "One-click import of any country's public holidays into Google Calendar, Outlook, or Apple Calendar.",
    votes: 38,
    createdAt: "2026-06-20T10:00:00.000Z",
  },
  {
    id: "seed-3",
    type: "idea",
    title: "Meeting time translator in Slack and Teams",
    description: "Native integration so you can type /time 3pm in #london and it converts to every team member's local time.",
    votes: 29,
    createdAt: "2026-06-25T10:00:00.000Z",
  },
  {
    id: "seed-4",
    type: "suggestion",
    title: "DST change reminder emails",
    description: "Get an email one week before a country changes its clocks, with a list of meetings that will shift.",
    votes: 22,
    createdAt: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "seed-5",
    type: "bug",
    title: "DST transition shows wrong time for one hour",
    description: "On the day of a DST change, the live clock shows the new time before the actual change happens.",
    votes: 18,
    createdAt: "2026-07-05T10:00:00.000Z",
  },
  {
    id: "seed-6",
    type: "general",
    title: "Add a dark mode",
    description: "Many users check the time at night. A dark theme would reduce eye strain.",
    votes: 14,
    createdAt: "2026-07-08T10:00:00.000Z",
  },
];

const FAQ_ITEMS = [
  {
    q: "How do I vote on a suggestion?",
    a: "Click the up-arrow on the left side of any suggestion card. One vote per device. Your vote is saved in your browser — no account required.",
  },
  {
    q: "Can I edit or delete a suggestion I submitted?",
    a: "Yes. Your most recent submission shows a trash icon. Click it to remove the entry. Older submissions persist until you clear your browser data.",
  },
  {
    q: "Where do the seed suggestions come from?",
    a: "The first five entries come from our public roadmap. They represent the most-requested features we've heard about from early users and our own product thinking. Vote them up to show support, or submit a new one.",
  },
  {
    q: "When will my suggestion be implemented?",
    a: "We read every submission. Top-voted suggestions get prioritized each release. The /about page roadmap shows what's shipped and what's next.",
  },
];

function readEntries(): FeedbackEntry[] {
  if (typeof window === "undefined") return SEED_ENTRIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_ENTRIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_ENTRIES;
    return parsed.filter(
      (e): e is FeedbackEntry =>
        e && typeof e === "object" &&
        typeof e.id === "string" && typeof e.title === "string" &&
        typeof e.description === "string" && typeof e.votes === "number" &&
        typeof e.createdAt === "string" && typeof e.type === "string"
    );
  } catch {
    return SEED_ENTRIES;
  }
}

function writeEntries(entries: FeedbackEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* noop — quota or private mode */ }
}

function readVoted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((s): s is string => typeof s === "string"));
  } catch {
    return new Set();
  }
}

function writeVoted(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOTED_KEY, JSON.stringify(Array.from(set)));
  } catch { /* noop */ }
}

export function FeedbackPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>(SEED_ENTRIES);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string>("submit");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [filterType, setFilterType] = useState<FeedbackType | "all">("all");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // ── URL prefill (from ?type=&tool= on the feedback CTA links) ──
  // If the page is reached from a tool page's bottom CTA, the URL
  // carries the tool slug and we pre-select the "suggestion" type.
  // The "tool" prefill shows a read-only chip above the form so the
  // user knows which tool the feedback will be associated with.
  const [prefillTool, setPrefillTool] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get("type");
    if (urlType && TYPE_SET.has(urlType as FeedbackType)) {
      setFormType(urlType as FeedbackType);
    }
    const urlTool = params.get("tool");
    if (urlTool) {
      setPrefillTool(urlTool);
    }
  }, []);

  // ── API helpers (T6 backend) ─────────────────────────────────
  // The API is the source of truth for entries. localStorage is
  // only used to cache (a) the device's voted-set so the UI feels
  // instant, and (b) the most recently seen entries so a slow /
  // failed fetch still shows something on a refresh.
  const fetchEntries = useCallback(async (sort: "votes" | "recent", type: FeedbackType | "all") => {
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (type !== "all") params.set("type", type);
    params.set("limit", "100");
    const r = await fetch(`${API_BASE}?${params.toString()}`);
    if (!r.ok) throw new Error(`Failed to load suggestions: ${r.status}`);
    return (await r.json()) as { entries: FeedbackEntry[]; count: number };
  }, []);

  const submitEntry = useCallback(async (body: Omit<FeedbackEntry, "id" | "votes" | "createdAt">) => {
    const r = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Submission failed" }));
      throw new Error(err.error || `Submission failed (${r.status})`);
    }
    return (await r.json()) as FeedbackEntry;
  }, []);

  const voteOnEntry = useCallback(async (id: string) => {
    const r = await fetch(`${API_BASE}/${encodeURIComponent(id)}/vote`, { method: "POST" });
    if (r.status === 409) return { alreadyVoted: true as const };
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Vote failed" }));
      throw new Error(err.error || `Vote failed (${r.status})`);
    }
    return (await r.json()) as FeedbackEntry;
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const r = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Delete failed" }));
      throw new Error(err.error || `Delete failed (${r.status})`);
    }
    return (await r.json()) as { deleted: boolean; id: string };
  }, []);

  // Form state
  const [formType, setFormType] = useState<FeedbackType>("suggestion");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAuthor, setFormAuthor] = useState("");

  // Load on mount: try the API, fall back to localStorage cache, then
  // to the seed list. Read the voted set straight from localStorage
  // (device-only cache) so the UI feels instant.
  useEffect(() => {
    cancelledRef.current = false;
    (async () => {
      setVoted(readVoted());
      try {
        const data = await fetchEntries("votes", "all");
        if (cancelledRef.current) return;
        setEntries(data.entries);
        setApiError(null);
        // Cache the most recently seen list for offline / slow-refresh
        // fallback. The API remains the source of truth.
        writeEntries(data.entries);
      } catch (err) {
        if (cancelledRef.current) return;
        const cached = readEntries();
        if (cached.length > 0) {
          setEntries(cached);
          setApiError("Showing the last cached suggestions. The server is unreachable.");
        } else {
          setApiError("Could not reach the suggestions server. Try refreshing in a moment.");
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    })();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when sort/filter change (debounced via the dependencies).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchEntries(sortBy, filterType);
        if (cancelled) return;
        setEntries(data.entries);
        setApiError(null);
      } catch {
        // Silent — keep current list
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sortBy, filterType, fetchEntries]);

  // IntersectionObserver for TOC active state
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const ids = ["submit", "list", "faq", "contact"];
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, []);

  const navigateToHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new Event("tdp:navigate"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) return;
    try {
      const entry = await submitEntry({
        type: formType,
        title: formTitle.trim().slice(0, 120),
        description: formDesc.trim().slice(0, 800),
        author: formAuthor.trim() || undefined,
        // Spread any extra prefill metadata; the API only persists the
        // fields it knows about, so unknown fields are safely ignored.
        ...(prefillTool ? { tool: prefillTool } : {}),
      } as any);
      // Prepend to the current view and mark as voted (the API
      // already auto-votes on creation).
      const next = [entry, ...entries];
      setEntries(next);
      writeEntries(next);
      const nextVoted = new Set(voted);
      nextVoted.add(entry.id);
      setVoted(nextVoted);
      writeVoted(nextVoted);
      // Reset form
      setFormTitle("");
      setFormDesc("");
      setFormAuthor("");
      setSubmitted(true);
      setApiError(null);
      // Scroll to the suggestions list so the user sees their entry
      setTimeout(() => {
        document.getElementById("list")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      // Hide the success banner after a few seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Could not submit feedback.");
    }
  };

  const handleVote = async (id: string) => {
    if (voted.has(id)) return; // one vote per device (per localStorage cache)
    try {
      const result = await voteOnEntry(id);
      if ("alreadyVoted" in result) {
        // Server says we already voted (different device / cleared cache).
        // Mirror the state so the UI stays consistent.
        const nextVoted = new Set(voted);
        nextVoted.add(id);
        setVoted(nextVoted);
        writeVoted(nextVoted);
        return;
      }
      const nextVoted = new Set(voted);
      nextVoted.add(id);
      setVoted(nextVoted);
      writeVoted(nextVoted);
      const next = entries.map((e) => e.id === id ? { ...e, votes: result.votes } : e);
      setEntries(next);
      writeEntries(next);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Could not record your vote.");
    }
  };

  const handleDelete = async (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    writeEntries(next);
    // Only call the API for non-seed entries (seeds cannot be deleted
    // via the API; we just hide them locally).
    if (id.startsWith("seed-")) return;
    try {
      await deleteEntry(id);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Could not delete the entry.");
      // Restore on failure
      setEntries(entries);
      writeEntries(entries);
      return;
    }
    const nextVoted = new Set(voted);
    nextVoted.delete(id);
    setVoted(nextVoted);
    writeVoted(nextVoted);
  };

  // Sort + filter
  const visibleEntries = useMemo(() => {
    const filtered = filterType === "all" ? entries : entries.filter((e) => e.type === filterType);
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "votes") return b.votes - a.votes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted;
  }, [entries, sortBy, filterType]);

  const totalCount = entries.length;

  return (
    <article className="lp">
      <nav className="lp-breadcrumb" aria-label="Breadcrumb">
        <a href="/" onClick={navigateToHome}>Home</a>
        <span className="lp-breadcrumb__sep">/</span>
        <span className="lp-breadcrumb__current">Feedback</span>
      </nav>

      <header className="lp-head">
        <div className="lp-eyebrow" style={{ background: "rgba(37, 99, 235, 0.08)", color: "#1d4ed8" }}>
          Feedback
        </div>
        <h1 className="lp-title">Feedback and tool suggestions</h1>
        <div className="lp-meta__row">
          <span className="lp-meta__badge">{totalCount} suggestions</span>
          <span className="lp-meta__sep">•</span>
          <span>No account required</span>
          <span className="lp-meta__sep">•</span>
          <span>~3 min</span>
        </div>
      </header>

      <div className="lp-grid">
        <aside className="lp-toc" aria-label="Table of contents">
          <div className="lp-toc__label">On this page</div>
          <ol className="lp-toc__list">
            {[
              { id: "submit", label: "Submit feedback" },
              { id: "list",   label: "Top suggestions" },
              { id: "faq",    label: "FAQ" },
              { id: "contact", label: "Contact" },
            ].map((s, idx) => (
              <li key={s.id} className="lp-toc__item">
                <a
                  href={`#${s.id}`}
                  className={`lp-toc__link ${activeId === s.id ? "is-active" : ""}`}
                >
                  <span style={{ color: "#94a3b8", marginRight: 8, fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem" }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="lp-content">
          {/* ==================== SECTION 1: SUBMIT ==================== */}
          <section id="submit" className="lp-section">
            <div className="lp-section__num">01</div>
            <h2>Submit feedback</h2>
            <p>
              Tell us what would make {SITE_NAME} more useful. We read
              every submission. Top-voted suggestions are prioritized
              each release.
            </p>

            {submitted && (
              <div className="fb-form__success" role="status">
                <Send size={16} />
                <span>
                  <strong>Thanks!</strong> Your suggestion is live below.
                  We will reply if we need more details.
                </span>
              </div>
            )}

            {apiError && (
              <div className="fb-form__error" role="alert">
                <Sparkles size={16} />
                <span>{apiError}</span>
                <button
                  type="button"
                  className="fb-form__error-dismiss"
                  onClick={() => setApiError(null)}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}

            <form className="fb-form" onSubmit={handleSubmit}>
              {prefillTool && (
                <div className="fb-form__prefill" role="status">
                  <span className="fb-form__prefill-label">Related tool</span>
                  <code className="fb-form__prefill-value">{prefillTool}</code>
                  <button
                    type="button"
                    className="fb-form__prefill-clear"
                    onClick={() => {
                      setPrefillTool(null);
                      const url = new URL(window.location.href);
                      url.searchParams.delete("tool");
                      window.history.replaceState(null, "", url.toString());
                    }}
                    aria-label="Clear related tool"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="fb-form__row">
                <div className="fb-form__field">
                  <label className="fb-form__label fb-form__label--required" htmlFor="fb-type">
                    Type
                  </label>
                  <div className="fb-form__chips" id="fb-type">
                    {(Object.keys(TYPE_META) as FeedbackType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`fb-form__chip ${formType === t ? "is-active" : ""}`}
                        onClick={() => setFormType(t)}
                      >
                        {TYPE_META[t].icon}
                        {TYPE_META[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="fb-form__field">
                  <label className="fb-form__label" htmlFor="fb-author">
                    Your name <span className="fb-form__hint">optional</span>
                  </label>
                  <input
                    id="fb-author"
                    type="text"
                    className="fb-form__input"
                    placeholder="Anonymous"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    maxLength={60}
                  />
                </div>
              </div>

              <div className="fb-form__row fb-form__row--single">
                <div className="fb-form__field">
                  <label className="fb-form__label fb-form__label--required" htmlFor="fb-title">
                    Title
                  </label>
                  <input
                    id="fb-title"
                    type="text"
                    className="fb-form__input"
                    placeholder={
                      formType === "bug"
                        ? "What went wrong? (one sentence)"
                        : formType === "suggestion"
                          ? "What tool or feature would you like?"
                          : formType === "idea"
                            ? "What is your idea?"
                            : "What is on your mind?"
                    }
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    maxLength={120}
                    required
                  />
                </div>
              </div>

              <div className="fb-form__row fb-form__row--single">
                <div className="fb-form__field">
                  <label className="fb-form__label fb-form__label--required" htmlFor="fb-desc">
                    Details
                  </label>
                  <textarea
                    id="fb-desc"
                    className="fb-form__textarea"
                    placeholder="Tell us more. What problem does this solve? Who would benefit? Any examples?"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    maxLength={800}
                    required
                  />
                </div>
              </div>

              <div className="fb-form__footer">
                <span className="fb-form__meta">
                  <Mail size={12} /> Or email us at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="lp-link">
                    {SUPPORT_EMAIL}
                  </a>
                </span>
                <div className="fb-form__actions">
                  <button
                    type="button"
                    className="fb-btn fb-btn--ghost"
                    onClick={() => { setFormTitle(""); setFormDesc(""); setFormAuthor(""); }}
                  >
                    Clear
                  </button>
                  <button type="submit" className="fb-btn fb-btn--primary">
                    <Send size={14} /> Submit
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* ==================== SECTION 2: TOP SUGGESTIONS ==================== */}
          <section id="list" className="lp-section">
            <div className="lp-section__num">02</div>
            <h2>
              Top suggestions
              <span className="fb-list__live" title="Live data from /api/v1/feedback">
                <span className="fb-list__live-dot" aria-hidden="true" />
                Live
              </span>
            </h2>
            <p>
              {totalCount} {totalCount === 1 ? "submission" : "submissions"} from the
              community. Vote with the up-arrow on the left of each card.
            </p>

            <div className="fb-list__controls">
              <span className="fb-list__count">
                Showing {visibleEntries.length} of {totalCount}
              </span>
              <div className="fb-list__sort" role="tablist" aria-label="Sort suggestions">
                <button
                  type="button"
                  className={`fb-list__sort-btn ${sortBy === "votes" ? "is-active" : ""}`}
                  onClick={() => setSortBy("votes")}
                >
                  <TrendingUp size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Top voted
                </button>
                <button
                  type="button"
                  className={`fb-list__sort-btn ${sortBy === "recent" ? "is-active" : ""}`}
                  onClick={() => setSortBy("recent")}
                >
                  <Clock size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Most recent
                </button>
              </div>
            </div>

            <div className="fb-form__chips" style={{ marginBottom: 16 }}>
              <button
                type="button"
                className={`fb-form__chip ${filterType === "all" ? "is-active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                All
              </button>
              {(Object.keys(TYPE_META) as FeedbackType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`fb-form__chip ${filterType === t ? "is-active" : ""}`}
                  onClick={() => setFilterType(t)}
                >
                  {TYPE_META[t].icon}
                  {TYPE_META[t].label}
                </button>
              ))}
            </div>

            <div className="fb-list">
              {visibleEntries.length === 0 ? (
                <div className="fb-list__empty">
                  No suggestions in this category yet. Be the first to
                  submit one.
                </div>
              ) : (
                visibleEntries.map((e) => {
                  const isVoted = voted.has(e.id);
                  return (
                    <article key={e.id} className="fb-item">
                      <button
                        type="button"
                        className={`fb-item__vote ${isVoted ? "is-voted" : ""}`}
                        onClick={() => handleVote(e.id)}
                        aria-label={`Upvote: ${e.title}`}
                        aria-pressed={isVoted}
                        disabled={isVoted}
                      >
                        <ThumbsUp size={14} />
                        <span className="fb-item__vote-num">{e.votes}</span>
                        <span className="fb-item__vote-label">
                          {isVoted ? "Voted" : "Vote"}
                        </span>
                      </button>
                      <div className="fb-item__body">
                        <span className={`fb-item__type fb-item__type--${e.type}`}>
                          {TYPE_META[e.type].icon}
                          {TYPE_META[e.type].label}
                        </span>
                        <h3 className="fb-item__title">{e.title}</h3>
                        <p className="fb-item__desc">{e.description}</p>
                        <div className="fb-item__meta">
                          <span>
                            <Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                            {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          {e.author && <span>by {e.author}</span>}
                        </div>
                      </div>
                      {!e.id.startsWith("seed-") && (
                        <button
                          type="button"
                          className="fb-item__delete"
                          onClick={() => handleDelete(e.id)}
                          aria-label="Delete this submission"
                          title="Delete this submission"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* ==================== SECTION 3: FAQ ==================== */}
          <section id="faq" className="lp-section">
            <div className="lp-section__num">03</div>
            <h2>Frequently asked questions</h2>
            <p>Common questions about how feedback works.</p>
            <div className="fb-faq">
              {FAQ_ITEMS.map((item) => (
                <details key={item.q} className="fb-faq__item">
                  <summary className="fb-faq__summary">
                    <span>{item.q}</span>
                    <ChevronDown size={18} className="fb-faq__icon" />
                  </summary>
                  <div className="fb-faq__body">
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* ==================== SECTION 4: CONTACT ==================== */}
          <section id="contact" className="lp-section">
            <div className="lp-section__num">04</div>
            <h2>Contact</h2>
            <p>
              For anything that does not fit the form above, email us
              at{" "}
              <a className="lp-link" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              . We respond within five business days.
            </p>
            <p>
              For privacy and data requests, use{" "}
              <a className="lp-link" href="/privacy" onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, "", "/privacy");
                window.dispatchEvent(new Event("tdp:navigate"));
              }}>privacy@timeanddatepro.com</a>.
            </p>
            <p>
              For legal questions, see the{" "}
              <a className="lp-link" href="/terms" onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, "", "/terms");
                window.dispatchEvent(new Event("tdp:navigate"));
              }}>Terms of Service</a>.
            </p>
          </section>

          <footer className="lp-foot">
            <p>
              <Mail size={14} style={{ verticalAlign: "middle" }} />{" "}
              <a className="lp-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>
            <div className="lp-foot__actions">
              <button
                type="button"
                className="lp-foot__btn"
                onClick={() => { if (typeof window !== "undefined") window.print(); }}
              >
                <Printer size={13} /> Print
              </button>
              <a className="lp-foot__btn" href={SITE_URL}>
                <Globe size={13} /> {SITE_URL.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}

export default FeedbackPage;
