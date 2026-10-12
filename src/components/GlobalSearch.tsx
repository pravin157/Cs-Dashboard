import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, CornerDownLeft, LayoutGrid, Search, UserX } from "lucide-react";
import { usePortfolio } from "../lib/usePortfolio";
import { MODULES } from "../lib/modules";
import type { Portfolio } from "../types";
import { accountName } from "./account-bits";

type Item = {
  key: string;
  kind: "module" | "account" | "churned" | "all";
  label: string;
  sub?: string;
  to: string;
};

const MAX_ACCOUNTS = 8;
const MAX_CHURNED = 4;

const KIND_ICON = { module: LayoutGrid, account: Building2, churned: UserX, all: Search };
const KIND_HEADING: Record<Item["kind"], string> = {
  module: "Pages",
  account: "Accounts",
  churned: "Churned accounts",
  all: "",
};

/** Loads the shared portfolio only once the search is first used, so idle pages don't pay for it. */
const PortfolioFeed = ({ onData }: { onData: (p: Portfolio) => void }) => {
  const { data } = usePortfolio();
  useEffect(() => {
    if (data) onData(data);
  }, [data, onData]);
  return null;
};

const has = (q: string, ...values: Array<string | null | undefined>) =>
  values.some((v) => v != null && v.toLowerCase().includes(q));

export const GlobalSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const modules: Item[] = Object.values(MODULES)
      .filter((m) => m.path && has(q, m.title, ...(m.keywords ?? [])))
      .map((m) => ({ key: `m-${m.id}`, kind: "module", label: m.title, sub: m.summary, to: m.path! }));

    const accountMatches = (portfolio?.accounts ?? []).filter((a) =>
      has(q, a.name, a.accountNumber, a.organizationId, a.emailAddress, a.planName, a.countryCode),
    );
    const accounts: Item[] = accountMatches.slice(0, MAX_ACCOUNTS).map((a) => ({
      key: `a-${a.organizationId}`,
      kind: "account",
      label: accountName(a),
      sub: [a.accountNumber, a.countryCode, a.planName, `Health ${a.health.score}`].filter(Boolean).join(" · "),
      to: `/accounts/${a.organizationId}`,
    }));

    const churned: Item[] = (portfolio?.churned ?? [])
      .filter((c) => has(q, c.name, c.accountNumber, c.organizationId, c.planName))
      .slice(0, MAX_CHURNED)
      .map((c) => ({
        key: `c-${c.organizationId}`,
        kind: "churned",
        label: accountName(c),
        sub: [c.accountNumber, c.reason === "EXPIRED" ? "Expired, not renewed" : "Switched off early"]
          .filter(Boolean)
          .join(" · "),
        to: "/churned",
      }));

    const all: Item[] =
      accountMatches.length > MAX_ACCOUNTS
        ? [
            {
              key: "all",
              kind: "all",
              label: `See all ${accountMatches.length} matching accounts`,
              to: `/accounts?q=${encodeURIComponent(query.trim())}`,
            },
          ]
        : [];

    return [...modules, ...accounts, ...churned, ...all];
  }, [query, portfolio]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = (item: Item) => {
    navigate(item.to);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active]);
    }
  };

  const showPanel = open && query.trim().length > 0;
  const loadingAccounts = armed && !portfolio;

  return (
    <div className="relative w-full min-w-[220px] max-w-md flex-1">
      {armed && <PortfolioFeed onData={setPortfolio} />}
      <label className="relative block">
        <span className="sr-only">Search pages and accounts</span>
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-3" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setArmed(true);
            setOpen(true);
          }}
          onFocus={() => {
            setArmed(true);
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="Search accounts, pages…"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="global-search-results"
          aria-activedescendant={showPanel && items[active] ? `gs-${items[active].key}` : undefined}
          className="w-full rounded-lg border border-hairline bg-surface py-2 pl-8 pr-14 text-sm text-ink placeholder:text-ink-3"
        />
        <kbd className="pointer-events-none absolute right-2 top-2 hidden rounded border border-hairline px-1.5 py-0.5 text-[11px] text-ink-3 sm:block">
          Ctrl K
        </kbd>
      </label>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[70vh] overflow-y-auto rounded-lg border border-hairline bg-surface p-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {items.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-ink-3">
              {loadingAccounts ? "Loading accounts…" : `Nothing matches "${query.trim()}"`}
            </p>
          ) : (
            items.map((item, i) => {
              const Icon = KIND_ICON[item.kind];
              const heading = i === 0 || items[i - 1].kind !== item.kind ? KIND_HEADING[item.kind] : "";
              const selected = i === active;
              return (
                <div key={item.key}>
                  {heading && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink-3">{heading}</p>
                  )}
                  <button
                    id={`gs-${item.key}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left ${
                      selected ? "bg-surface-2" : ""
                    } ${item.kind === "all" ? "border-t border-hairline" : ""}`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${item.kind === "all" ? "text-accent" : "text-ink"}`}>
                        {item.label}
                      </span>
                      {item.sub && <span className="block truncate text-xs text-ink-3">{item.sub}</span>}
                    </span>
                    {selected && <CornerDownLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />}
                  </button>
                </div>
              );
            })
          )}
          {loadingAccounts && items.length > 0 && (
            <p className="px-3 py-2 text-xs text-ink-3">Loading accounts…</p>
          )}
        </div>
      )}
    </div>
  );
};
