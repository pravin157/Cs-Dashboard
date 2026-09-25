import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDownUp, Search } from "lucide-react";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { quietState } from "../lib/home";
import { windowShort } from "../lib/format";
import type { AccountSummary } from "../types";
import { Empty, ErrorNote, Loading, StateChip, StateDot } from "../components/ui";
import { ACCOUNT_FILTERS, HealthBadge, MomentumTag, accountName } from "../components/account-bits";

type SortKey = "health" | "silent" | "renewal" | "name";

const SORTS: Record<SortKey, { label: string; cmp: (a: AccountSummary, b: AccountSummary) => number }> = {
  health: { label: "Lowest health", cmp: (a, b) => a.health.score - b.health.score },
  silent: {
    label: "Longest silent",
    cmp: (a, b) => (b.inactive.daysSilent ?? 9999) - (a.inactive.daysSilent ?? 9999),
  },
  renewal: {
    label: "Renewing soonest",
    cmp: (a, b) => (a.renewal.daysToRenewal ?? 99999) - (b.renewal.daysToRenewal ?? 99999),
  },
  name: { label: "Name", cmp: (a, b) => accountName(a).localeCompare(accountName(b)) },
};

export const Accounts = () => {
  const { data, error, loading } = usePortfolio();
  const { refresh, window } = useApp();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const filterId = params.get("filter") ?? "all";
  const sort = (params.get("sort") as SortKey) || "health"; // G-7 default

  const filter = ACCOUNT_FILTERS.find((f) => f.id === filterId) ?? ACCOUNT_FILTERS[0];

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.accounts
      .filter(filter.test)
      .filter(
        (a) =>
          !q ||
          accountName(a).toLowerCase().includes(q) ||
          (a.accountNumber ?? "").toLowerCase().includes(q) ||
          a.organizationId.includes(q),
      )
      .sort(SORTS[sort].cmp);
  }, [data, filter, query, sort]);

  if (loading && !data) return <Loading label="Loading accounts…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Accounts</h1>
        <p className="mt-1 text-ink-2">
          {rows.length} of {data.accounts.length} accounts
          {filter.id !== "all" && (
            <>
              {" "}· filtered by <strong className="font-medium text-ink">{filter.label}</strong>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Search accounts</span>
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-3" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or account #"
            className="w-64 rounded-lg border border-hairline bg-surface py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-3"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-ink-2">
          <ArrowDownUp className="h-4 w-4 text-ink-3" aria-hidden />
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="rounded-lg border border-hairline bg-surface px-2 py-2 text-sm text-ink"
          >
            {(Object.keys(SORTS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORTS[k].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter accounts">
        {ACCOUNT_FILTERS.map((f) => {
          const count = data.accounts.filter(f.test).length;
          const active = f.id === filter.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setParam("filter", f.id)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-ink bg-ink text-page"
                  : "border-hairline bg-surface text-ink-2 hover:border-[var(--ink-3)] hover:text-ink"
              }`}
            >
              {f.label} <span className={active ? "opacity-70" : "text-ink-3"}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="card overflow-x-auto">
        {rows.length === 0 ? (
          <Empty title="No accounts match" text="Try another filter or clear the search." />
        ) : (
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs font-medium text-ink-3">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-3 py-3 font-medium">Health</th>
                <th className="px-3 py-3 font-medium">30-day trend</th>
                <th className="px-3 py-3 font-medium">Active users ({windowShort[window]})</th>
                <th className="px-3 py-3 font-medium">Last activity</th>
                <th className="px-3 py-3 font-medium">Projects</th>
                <th className="px-3 py-3 font-medium">Renewal</th>
                <th className="px-3 py-3 font-medium">Top next step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {rows.map((a) => (
                <tr key={a.organizationId} className="hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link to={`/accounts/${a.organizationId}`} className="font-medium text-ink hover:text-accent">
                      {accountName(a)}
                    </Link>
                    <p className="text-xs text-ink-3">
                      {[a.accountNumber, a.countryCode, a.planName].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <HealthBadge account={a} />
                  </td>
                  <td className="px-3 py-3">
                    <MomentumTag momentum={a.health.momentum30d} delta={a.health.delta30d} />
                  </td>
                  <td className="px-3 py-3 tabular text-ink">
                    {a.engagement.activeUsers}
                    {a.seats.licensed != null && <span className="text-ink-3"> / {a.seats.licensed} seats</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5 text-ink-2">
                      <StateDot state={quietState(a)} />
                      {a.inactive.daysSilent == null
                        ? "Never"
                        : a.inactive.daysSilent === 0
                          ? "Today"
                          : `${a.inactive.daysSilent}d ago`}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {!a.projects.connected ? (
                      <span className="text-xs text-ink-3">n/a</span>
                    ) : a.projects.active === 0 ? (
                      <StateChip state="action" label="None" size="xs" />
                    ) : (
                      <span className="text-ink-2">
                        <span className="text-ink">{a.projects.active}</span>
                        {a.projects.stalled ? <span className="text-ink-3"> · {a.projects.stalled} stalled</span> : null}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {a.renewal.daysToRenewal == null ? (
                      <span className="text-xs text-ink-3">—</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-ink-2">
                        <StateDot state={a.renewal.state} />
                        {a.renewal.daysToRenewal < 0 ? "Overdue" : `${a.renewal.daysToRenewal}d`}
                      </span>
                    )}
                  </td>
                  <td className="max-w-[240px] px-3 py-3 text-ink-2">
                    <span className="line-clamp-2">{a.actions[0]?.title ?? "Keep the relationship warm"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
