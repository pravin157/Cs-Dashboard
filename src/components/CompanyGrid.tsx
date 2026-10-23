import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Info, Search, Table2, X } from "lucide-react";
import type { AccountSummary, HealthBand } from "../types";
import { BAND_LABEL } from "../lib/rules";
import { quietState } from "../lib/home";
import { fmtDate } from "../lib/format";
import { accountName } from "./account-bits";
import { Empty } from "./ui";

type Tone = "good" | "warn" | "bad" | "none";

const TONE: Record<Tone, string> = {
  good: "bg-good-soft text-good-ink",
  warn: "bg-warn-soft text-warn-ink",
  bad: "bg-bad-soft text-bad-ink",
  none: "bg-none-soft text-ink-3",
};

const Pill = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <span
    className={`inline-flex min-w-[2.75rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular ${TONE[tone]}`}
  >
    {children}
  </span>
);

const BAND_TONE: Record<HealthBand, Tone> = { healthy: "good", "at-risk": "warn", critical: "bad" };

/** Expired or ≤ 30 days = red, ≤ 90 days = amber, later = green. */
const expiryTone = (days: number | null): Tone =>
  days == null ? "none" : days <= 30 ? "bad" : days <= 90 ? "warn" : "good";

const ACTIVITY_LABEL = { healthy: "Active", watch: "Need focus", action: "Inactive risk" } as const;
const ACTIVITY_TONE = { healthy: "good", watch: "warn", action: "bad" } as const;

const lastActivity = (a: AccountSummary) => {
  const d = a.inactive.daysSilent;
  return d == null ? "Never" : d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
};

const nextRenewal = (a: AccountSummary) => {
  const d = a.renewal.daysToRenewal;
  return d == null ? "—" : d < 0 ? `Overdue ${-d}d` : d === 0 ? "Today" : `In ${d}d`;
};

/** Rows that need attention get the highlighted background. */
const needsAttention = (a: AccountSummary) =>
  a.health.band === "critical" || quietState(a) === "action" || (a.renewal.daysToRenewal ?? 999) <= 30;

type ColKey = "name" | "users" | "active" | "health" | "activity" | "renewal" | "expires";

const COLS: Array<{ key: ColKey; label: string; align?: "center"; value: (a: AccountSummary) => number | string }> = [
  { key: "name", label: "Company", value: (a) => accountName(a).toLowerCase() },
  { key: "users", label: "Users", align: "center", value: (a) => a.seats.licensed ?? -1 },
  { key: "active", label: "Active users", align: "center", value: (a) => a.engagement.activeUsers },
  { key: "health", label: "Health score", align: "center", value: (a) => a.health.score },
  { key: "activity", label: "Last activity", align: "center", value: (a) => a.inactive.daysSilent ?? 99999 },
  { key: "renewal", label: "Next renewal", align: "center", value: (a) => a.renewal.daysToRenewal ?? 99999 },
  { key: "expires", label: "Plan expires on", align: "center", value: (a) => a.renewal.renewalDate ?? Infinity },
];

const RENEWAL_FILTERS: Record<string, { label: string; test: (d: number | null) => boolean }> = {
  all: { label: "Any renewal", test: () => true },
  overdue: { label: "Overdue", test: (d) => d != null && d < 0 },
  "30": { label: "Within 30 days", test: (d) => d != null && d >= 0 && d <= 30 },
  "90": { label: "Within 90 days", test: (d) => d != null && d >= 0 && d <= 90 },
  later: { label: "After 90 days", test: (d) => d != null && d > 90 },
  none: { label: "No renewal date", test: (d) => d == null },
};

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

const exportCsv = (rows: AccountSummary[]) => {
  const header = ["Company", "Account #", "Plan", "Users", "Active users", "Health score", "Health band", "Last activity", "Next renewal", "Plan expires on"];
  const lines = rows.map((a) =>
    [
      accountName(a),
      a.accountNumber ?? "",
      a.planName ?? "",
      a.seats.licensed ?? "",
      a.engagement.activeUsers,
      a.health.score,
      BAND_LABEL[a.health.band],
      lastActivity(a),
      nextRenewal(a),
      fmtDate(a.renewal.renewalDate),
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `companies-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const selectCls = "rounded-lg border border-hairline bg-surface px-2 py-2 text-sm text-ink";

export const CompanyGrid = ({ accounts }: { accounts: AccountSummary[] }) => {
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<"all" | HealthBand>("all");
  const [activity, setActivity] = useState<"all" | keyof typeof ACTIVITY_LABEL>("all");
  const [renewal, setRenewal] = useState("all");
  const [plan, setPlan] = useState("all");
  const [sort, setSort] = useState<{ key: ColKey; dir: 1 | -1 }>({ key: "health", dir: 1 });

  const plans = useMemo(
    () => [...new Set(accounts.map((a) => a.planName).filter((p): p is string => !!p))].sort(),
    [accounts],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const col = COLS.find((c) => c.key === sort.key)!;
    return accounts
      .filter(
        (a) =>
          (!q ||
            accountName(a).toLowerCase().includes(q) ||
            (a.accountNumber ?? "").toLowerCase().includes(q)) &&
          (band === "all" || a.health.band === band) &&
          (activity === "all" || quietState(a) === activity) &&
          RENEWAL_FILTERS[renewal].test(a.renewal.daysToRenewal) &&
          (plan === "all" || a.planName === plan),
      )
      .sort((a, b) => {
        const x = col.value(a);
        const y = col.value(b);
        return (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number)) * sort.dir;
      });
  }, [accounts, query, band, activity, renewal, plan, sort]);

  const filtered = query !== "" || band !== "all" || activity !== "all" || renewal !== "all" || plan !== "all";
  const clear = () => {
    setQuery("");
    setBand("all");
    setActivity("all");
    setRenewal("all");
    setPlan("all");
  };

  const toggleSort = (key: ColKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Table2 className="h-5 w-5" aria-hidden /> Company list
        </h2>
        <p className="text-sm text-ink-2">
          {rows.length} of {accounts.length} companies
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-hairline bg-accent-soft px-4 py-3 text-sm text-ink-2">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-good" aria-hidden /> Healthy / renewal &gt; 90 days
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-warn" aria-hidden /> At risk / renewal ≤ 90 days
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-bad" aria-hidden /> Critical / renewal ≤ 30 days
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-ink-3">
          <Info className="h-4 w-4" aria-hidden /> Highlighted rows need attention
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Search companies</span>
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-3" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or account #"
            className="w-60 rounded-lg border border-hairline bg-surface py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-3"
          />
        </label>
        <select aria-label="Health" value={band} onChange={(e) => setBand(e.target.value as typeof band)} className={selectCls}>
          <option value="all">Any health</option>
          {(Object.keys(BAND_LABEL) as HealthBand[]).map((b) => (
            <option key={b} value={b}>
              {BAND_LABEL[b]}
            </option>
          ))}
        </select>
        <select
          aria-label="Last activity"
          value={activity}
          onChange={(e) => setActivity(e.target.value as typeof activity)}
          className={selectCls}
        >
          <option value="all">Any activity</option>
          {(Object.keys(ACTIVITY_LABEL) as Array<keyof typeof ACTIVITY_LABEL>).map((k) => (
            <option key={k} value={k}>
              {ACTIVITY_LABEL[k]}
            </option>
          ))}
        </select>
        <select aria-label="Next renewal" value={renewal} onChange={(e) => setRenewal(e.target.value)} className={selectCls}>
          {Object.entries(RENEWAL_FILTERS).map(([k, f]) => (
            <option key={k} value={k}>
              {f.label}
            </option>
          ))}
        </select>
        {plans.length > 1 && (
          <select aria-label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={selectCls}>
            <option value="all">Any plan</option>
            {plans.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
        {filtered && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-ink-2 hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden /> Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => exportCsv(rows)}
          disabled={rows.length === 0}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-good-ink hover:bg-surface-2 disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden /> Export
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-hairline">
        {rows.length === 0 ? (
          <Empty title="No companies match" text="Try another filter or clear the search." />
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-2 text-xs font-semibold text-ink">
                {COLS.map((c) => {
                  const active = sort.key === c.key;
                  const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
                  return (
                    <th
                      key={c.key}
                      aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                      className={`border-r border-hairline px-3 py-3 last:border-r-0 ${c.align === "center" ? "text-center" : "text-left"}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`inline-flex items-center gap-1 hover:text-accent ${c.align === "center" ? "justify-center" : ""}`}
                      >
                        {c.label}
                        <Icon className={`h-3.5 w-3.5 ${active ? "text-accent" : "text-ink-3"}`} aria-hidden />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {rows.map((a) => {
                const q = quietState(a);
                return (
                  <tr key={a.organizationId} className={needsAttention(a) ? "bg-bad-soft/40" : "hover:bg-surface-2"}>
                    <td className="border-r border-hairline px-3 py-3">
                      <Link to={`/accounts/${a.organizationId}`} className="font-medium text-ink hover:text-accent">
                        {accountName(a)}
                        {a.accountNumber && <span className="text-ink-3"> - {a.accountNumber}</span>}
                      </Link>
                      {a.planName && <p className="text-xs text-ink-3">{a.planName}</p>}
                    </td>
                    <td className="border-r border-hairline px-3 py-3 text-center tabular text-ink">
                      {a.seats.licensed ?? <span className="text-ink-3">—</span>}
                    </td>
                    <td className="border-r border-hairline px-3 py-3 text-center">
                      <Pill tone={a.engagement.activeUsers > 0 ? "good" : "bad"}>{a.engagement.activeUsers}</Pill>
                    </td>
                    <td className="border-r border-hairline px-3 py-3 text-center">
                      <span title={BAND_LABEL[a.health.band]}>
                        <Pill tone={BAND_TONE[a.health.band]}>{a.health.score}</Pill>
                      </span>
                    </td>
                    <td className="border-r border-hairline px-3 py-3 text-center" title={ACTIVITY_LABEL[q]}>
                      <Pill tone={ACTIVITY_TONE[q]}>{lastActivity(a)}</Pill>
                    </td>
                    <td className="border-r border-hairline px-3 py-3 text-center tabular text-ink-2">{nextRenewal(a)}</td>
                    <td className="px-3 py-3 text-center">
                      <Pill tone={expiryTone(a.renewal.daysToRenewal)}>{fmtDate(a.renewal.renewalDate)}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
