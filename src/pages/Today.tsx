import { useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarClock, FolderKanban, Users, Zap } from "lucide-react";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { plural, windowLabel } from "../lib/format";
import type { AccountAction, AccountSummary, CsState } from "../types";
import { Empty, ErrorNote, Loading, MetricCard, StateChip, StateDot } from "../components/ui";
import { HealthBadge, MomentumTag, accountName } from "../components/account-bits";

type Priority = AccountAction["priority"];

const GROUPS: Array<{ id: string; priority: Priority; title: string; hint: string; state: CsState }> = [
  { id: "today", priority: 1, title: "Act today", hint: "Critical alerts, renewals at risk, high churn risk, critical health", state: "action" },
  { id: "week", priority: 2, title: "This week", hint: "No projects, silent accounts, falling health", state: "watch" },
  { id: "later", priority: 3, title: "When you can", hint: "Onboarding, exec contact, seat usage", state: "healthy" },
  { id: "growth", priority: 4, title: "Growth ideas", hint: "Modules and features to introduce", state: "healthy" },
];

const PAGE_SIZE = 12;

/** Accounts that have at least one action at this priority, weakest health first. */
const accountsFor = (accounts: AccountSummary[], priority: Priority) =>
  accounts
    .filter((a) => a.actions.some((x) => x.priority === priority))
    .sort((a, b) => a.health.score - b.health.score);

const Fact = ({ icon: Icon, state, children }: { icon: typeof Zap; state?: CsState | null; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5">
    <Icon className="h-3.5 w-3.5 text-ink-3" aria-hidden />
    {state !== undefined && <StateDot state={state} />}
    {children}
  </span>
);

const AccountCard = ({ account: a, priority }: { account: AccountSummary; priority: Priority }) => {
  const { window } = useApp();
  const here = a.actions.filter((x) => x.priority === priority);
  const elsewhere = a.actions.length - here.length;

  const renewal =
    a.renewal.daysToRenewal == null
      ? null
      : a.renewal.daysToRenewal < 0
        ? "Renewal overdue"
        : `Renews in ${a.renewal.daysToRenewal}d`;
  const lastActive =
    a.inactive.daysSilent == null
      ? "No activity yet"
      : a.inactive.daysSilent === 0
        ? "Active today"
        : `Last active ${a.inactive.daysSilent}d ago`;

  return (
    <article className="card flex flex-col p-4">
      {/* Who */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/accounts/${a.organizationId}`}
            className="block truncate text-[15px] font-semibold text-ink hover:text-accent"
          >
            {accountName(a)}
          </Link>
          <p className="truncate text-xs text-ink-3">
            {[a.accountNumber, a.countryCode, a.planName].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <HealthBadge account={a} />
      </header>
      <div className="mt-1">
        <MomentumTag momentum={a.health.momentum30d} delta={a.health.delta30d} />
        <span className="text-xs text-ink-3"> over 30 days</span>
      </div>

      {/* Why it is here */}
      <ul className="mt-3 space-y-2">
        {here.map((x) => (
          <li key={x.ruleId + x.title} className="rounded-lg bg-surface-2 px-3 py-2">
            <p className="text-sm font-medium text-ink">
              {x.title}
              <span className="ml-1.5 text-[11px] font-normal text-ink-3">{x.ruleId}</span>
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{x.reason}</p>
          </li>
        ))}
      </ul>

      {/* Quick facts */}
      <div className="mb-4 mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-2">
        <Fact icon={Zap} state={a.inactive.state}>
          {lastActive}
        </Fact>
        {renewal && (
          <Fact icon={CalendarClock} state={a.renewal.state}>
            {renewal}
          </Fact>
        )}
        {a.projects.connected && (
          <Fact icon={FolderKanban} state={a.projects.state}>
            {plural(a.projects.active ?? 0, "project")}
            {a.projects.stalled ? ` · ${a.projects.stalled} stalled` : ""}
          </Fact>
        )}
        <Fact icon={Users}>
          {a.engagement.activeUsers} active {windowLabel[window]}
        </Fact>
      </div>

      {/* Next */}
      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-hairline pt-3">
        <span className="text-xs text-ink-3">
          {elsewhere > 0 ? `+${plural(elsewhere, "more item")} in other groups` : " "}
        </span>
        <Link
          to={`/accounts/${a.organizationId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Open account <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </footer>
    </article>
  );
};

export const Today = () => {
  const { data, error, loading } = usePortfolio();
  const { refresh } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [showAll, setShowAll] = useState(false);

  if (loading && !data) return <Loading label="Building today's list…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;

  const byGroup = Object.fromEntries(GROUPS.map((g) => [g.id, accountsFor(data.accounts, g.priority)])) as Record<
    string,
    AccountSummary[]
  >;
  // Default to the most urgent group that has something in it.
  const requested = GROUPS.find((g) => g.id === params.get("view"));
  const active = requested ?? GROUPS.find((g) => byGroup[g.id].length > 0) ?? GROUPS[0];
  const cards = byGroup[active.id];
  const visible = showAll ? cards : cards.slice(0, PAGE_SIZE);

  const selectGroup = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("view", id);
    setParams(next, { replace: true });
    setShowAll(false);
  };

  const urgent = new Set([...byGroup.today, ...byGroup.week].map((a) => a.organizationId)).size;
  const renewingSoon = data.accounts.filter((a) => a.renewal.daysToRenewal != null && a.renewal.daysToRenewal <= 30);
  const renewingAtRisk = renewingSoon.filter((a) => a.renewal.state !== "healthy").length;
  const alertAccounts = data.accounts.filter((a) => a.alerts.critical > 0);
  const openAlerts = alertAccounts.reduce((s, a) => s + a.alerts.critical, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Today</h1>
        <p className="mt-1 text-ink-2">
          {urgent === 0
            ? "No account needs urgent attention right now."
            : `${plural(urgent, "account")} need${urgent === 1 ? "s" : ""} you this week, out of ${data.summary.totalAccounts}.`}{" "}
          Each card says why it is here.
        </p>
      </div>

      {data.accounts.length === 0 ? (
        <div className="card">
          <Empty title="No paid, active accounts found" text="Check the Paymaster connection or run the daily snapshot." />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Act today"
              value={byGroup.today.length}
              unit={byGroup.today.length === 1 ? "account" : "accounts"}
              state={byGroup.today.length > 0 ? "action" : "healthy"}
              detail="Critical alerts, risky renewals, high churn risk, critical health"
              onClick={() => selectGroup("today")}
            />
            <MetricCard
              label="This week"
              value={byGroup.week.length}
              unit={byGroup.week.length === 1 ? "account" : "accounts"}
              state={byGroup.week.length > 0 ? "watch" : "healthy"}
              detail="No projects, silent accounts, falling health"
              onClick={() => selectGroup("week")}
            />
            <MetricCard
              label="Renewing in 30 days"
              value={renewingSoon.length}
              unit={renewingSoon.length === 1 ? "account" : "accounts"}
              state={renewingAtRisk > 0 ? "action" : "healthy"}
              detail={renewingAtRisk > 0 ? `${renewingAtRisk} not renewal-ready` : "All renewal-ready"}
              onClick={() => navigate("/renewals")}
            />
            <MetricCard
              label="Critical alerts"
              value={openAlerts}
              unit="open"
              state={openAlerts >= 3 ? "action" : openAlerts > 0 ? "watch" : "healthy"}
              detail={`Across ${plural(alertAccounts.length, "account")}`}
              onClick={() => navigate("/accounts?filter=alerts")}
            />
          </div>

          {/* Group switcher */}
          <div>
            <div role="tablist" aria-label="Priority" className="flex flex-wrap gap-1.5">
              {GROUPS.map((g) => {
                const selected = g.id === active.id;
                return (
                  <button
                    key={g.id}
                    role="tab"
                    aria-selected={selected}
                    type="button"
                    onClick={() => selectGroup(g.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      selected
                        ? "border-ink bg-ink text-page"
                        : "border-hairline bg-surface text-ink-2 hover:border-[var(--ink-3)] hover:text-ink"
                    }`}
                  >
                    {g.title} <span className={selected ? "opacity-70" : "text-ink-3"}>{byGroup[g.id].length}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-3">
              <StateChip state={active.state} label={active.title} size="xs" />
              {active.hint}
            </p>
          </div>

          {/* Account cards */}
          {cards.length === 0 ? (
            <div className="card">
              <Empty title="Nothing here. Nice." text="No account has an item in this group right now." />
            </div>
          ) : (
            <>
              <div role="tabpanel" className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {visible.map((a) => (
                  <AccountCard key={a.organizationId} account={a} priority={active.priority} />
                ))}
              </div>
              {cards.length > PAGE_SIZE && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowAll((s) => !s)}
                    className="rounded-lg border border-hairline bg-surface px-4 py-2 text-sm text-ink-2 hover:text-ink"
                  >
                    {showAll ? "Show fewer" : `Show all ${cards.length} accounts`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
