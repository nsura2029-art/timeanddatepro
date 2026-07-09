// src/components/admin/AdminShell.tsx

import * as React from "react";
// Top-level admin layout. Left sidebar with category chips, top header, main pane.

import { useEffect, useState } from "react";
import {
  LayoutDashboard, Database, Settings2, History, ShieldCheck, LogOut,
  Activity, ArrowRightLeft, BookOpen, Clock, Globe2, Coins, Zap,
} from "lucide-react";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard } from "./AdminDashboard";
import { AdminApiStatus } from "./AdminApiStatus";
import { AdminCache } from "./AdminCache";
import { AdminTriggers } from "./AdminTriggers";

type Page = "dashboard" | "api-status" | "cache" | "triggers";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  hotkey?: string;
}

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, hotkey: "D" },
  { id: "api-status", label: "API Status", icon: Activity, hotkey: "A" },
  { id: "cache", label: "Cache", icon: Settings2, hotkey: "C" },
  { id: "triggers", label: "Triggers", icon: Zap, hotkey: "T" },
];

export function AdminShell() {
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("dashboard");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        setUser(j.data?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-faint)" }}>Loading…</div>
        </div>
      </div>
    );
  }
  if (!user) {
    return <AdminLogin onSuccess={(u) => setUser(u)} />;
  }

  function logout() {
    fetch("/api/admin/logout", { method: "POST", credentials: "include" }).then(() => {
      setUser(null);
    });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h1>
            <ShieldCheck size={16} className="text-[color:var(--adm-accent)]" />
            TDP Admin
          </h1>
          <small>Control room · {user.username}</small>
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-section">Pages</div>
          {NAV.map((n) => (
            <a
              key={n.id}
              className={`admin-nav-link ${page === n.id ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setPage(n.id);
                window.history.pushState(null, "", `/admin/${n.id === "dashboard" ? "" : n.id}`);
              }}
              href={`/admin/${n.id === "dashboard" ? "" : n.id}`}
            >
              <n.icon size={14} />
              <span>{n.label}</span>
              {n.hotkey && <span className="badge">{n.hotkey}</span>}
            </a>
          ))}
          <div className="admin-nav-section">API Categories</div>
          <AdminCatChips onClick={(slug) => {
            setPage("api-status");
            // store wanted slug in sessionStorage for the api-status page to consume
            sessionStorage.setItem("tdp_admin_filter_category", slug);
          }} />
          <div className="admin-nav-section">Resources</div>
          <a className="admin-nav-link" href="/docs/api-reference">
            <BookOpen size={14} />
            <span>API Reference</span>
          </a>
          <a className="admin-nav-link" href="/">
            <ArrowRightLeft size={14} />
            <span>Back to app</span>
          </a>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-button" onClick={logout} style={{ width: "100%" }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {page === "dashboard" && <AdminDashboard tick={refreshTick} />}
        {page === "api-status" && <AdminApiStatus onRefresh={() => setRefreshTick((t) => t + 1)} />}
        {page === "cache" && <AdminCache onRefresh={() => setRefreshTick((t) => t + 1)} />}
        {page === "triggers" && <AdminTriggers onRefresh={() => setRefreshTick((t) => t + 1)} />}
      </main>
    </div>
  );
}

function AdminCatChips({ onClick }: { onClick: (slug: string) => void }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<{ slug: string; label: string; icon: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/authed/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        setCategories(j.data?.categories || []);
        const map: Record<string, number> = {};
        for (const c of j.data?.counts || []) map[c.category] = c.count;
        setCounts(map);
      })
      .catch(() => {});
  }, []);

  const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Clock, Database, Coins, BookOpen, Globe2, ShieldCheck,
  };

  return (
    <>
      {categories.map((c) => {
        const Icon = ICONS[c.icon] || Database;
        return (
          <a
            key={c.slug}
            className="admin-nav-link"
            onClick={(e) => {
              e.preventDefault();
              onClick(c.slug);
            }}
            href="#"
          >
            <Icon size={13} />
            <span>{c.label}</span>
            {counts[c.slug] != null && (
              <span className="badge">{counts[c.slug]}</span>
            )}
          </a>
        );
      })}
    </>
  );
}
