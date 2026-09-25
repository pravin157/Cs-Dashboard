import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import {
  CalendarClock,
  House,
  Inbox,
  LayoutGrid,
  Moon,
  Puzzle,
  RefreshCw,
  Settings,
  Sun,
  Users,
  Monitor,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { fmtDate } from "../lib/format";
import type { EngagementWindow } from "../types";

const NAV = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/today", label: "Today", icon: Inbox },
  { to: "/portfolio", label: "Portfolio", icon: LayoutGrid },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/renewals", label: "Renewals", icon: CalendarClock },
  { to: "/adoption", label: "Adoption", icon: Puzzle },
  { to: "/settings", label: "Settings", icon: Settings },
];

const WINDOWS: Array<{ id: EngagementWindow; label: string }> = [
  { id: "DAILY", label: "Day" },
  { id: "WEEKLY", label: "Week" },
  { id: "MONTHLY", label: "Month" },
];

const ThemeButton = () => {
  const { theme, setTheme } = useApp();
  const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Theme: ${theme} (click for ${next})`}
      aria-label={`Theme: ${theme}`}
      className="rounded-lg p-2 text-side-ink-2 hover:bg-side-active hover:text-side-ink"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

export const Layout = () => {
  const { window, setWindow, asOf, demoMode, refresh } = useApp();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col bg-side text-side-ink md:sticky md:top-0 md:h-screen md:w-60">
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-side-ink-2">IntoAEC</p>
            <p className="text-base font-semibold">Customer Success</p>
          </div>
          <div className="md:hidden">
            <ThemeButton />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-side-active font-medium text-side-ink"
                    : "text-side-ink-2 hover:bg-side-active hover:text-side-ink"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden items-center justify-between px-5 py-4 text-xs text-side-ink-2 md:flex">
          <span>Paid, active accounts only</span>
          <ThemeButton />
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        {demoMode && (
          <div className="bg-warn-soft px-4 py-2 text-center text-sm text-warn-ink">
            <strong>Demo data.</strong> These are sample accounts, not real customers. Set{" "}
            <code>CS_V2_DEMO=false</code> to use live data.
          </div>
        )}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-page/95 px-4 py-3 backdrop-blur md:px-8">
          <p className="text-sm text-ink-2">
            {asOf ? (
              <>
                Data as of <strong className="font-medium text-ink">{fmtDate(asOf)}</strong>
                <span className="text-ink-3"> · refreshed daily at 02:00 UTC</span>
              </>
            ) : (
              <span className="text-ink-3">Daily snapshot at 02:00 UTC</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-ink-3 sm:inline">Active users in the last</span>
            <div role="radiogroup" aria-label="Engagement window" className="flex rounded-lg border border-hairline bg-surface p-0.5">
              {WINDOWS.map((w) => (
                <button
                  key={w.id}
                  role="radio"
                  aria-checked={window === w.id}
                  type="button"
                  onClick={() => setWindow(w.id)}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    window === w.id ? "bg-ink text-page" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={refresh}
              aria-label="Reload data"
              title="Reload data"
              className="rounded-lg border border-hairline bg-surface p-2 text-ink-2 hover:text-ink"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
