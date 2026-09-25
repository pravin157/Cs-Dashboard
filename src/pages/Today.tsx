import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { plural } from "../lib/format";
import type { AccountAction, AccountSummary } from "../types";
import { Empty, ErrorNote, Loading } from "../components/ui";
import { HealthBadge, accountName } from "../components/account-bits";

const GROUPS: Array<{ priority: AccountAction["priority"]; title: string; hint: string; startOpen: boolean }> = [
  { priority: 1, title: "Act today", hint: "Critical alerts, renewals at risk, high churn risk, critical health", startOpen: true },
  { priority: 2, title: "This week", hint: "No projects, silent accounts, falling health", startOpen: true },
  { priority: 3, title: "When you can", hint: "Onboarding, exec contact, seat usage", startOpen: false },
  { priority: 4, title: "Growth ideas", hint: "Modules and features to introduce", startOpen: false },
];

type Item = { account: AccountSummary; action: AccountAction };

const ActionRow = ({ item }: { item: Item }) => (
  <li>
    <Link
      to={`/accounts/${item.account.organizationId}`}
      className="flex flex-col gap-2 px-4 py-3 hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">
          {item.action.title}
          <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-normal text-ink-3">
            {item.action.ruleId}
          </span>
        </p>
        <p className="mt-0.5 text-sm text-ink-2">
          <span className="font-medium text-ink">{accountName(item.account)}</span> · {item.action.reason}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <HealthBadge account={item.account} />
        <ChevronRight className="h-4 w-4 text-ink-3" aria-hidden />
      </div>
    </Link>
  </li>
);

const Group = ({ title, hint, items, startOpen }: { title: string; hint: string; items: Item[]; startOpen: boolean }) => {
  const [open, setOpen] = useState(startOpen);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 8);
  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="text-[15px] font-semibold text-ink">{title}</span>
          <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2">{items.length}</span>
          <span className="mt-0.5 block text-xs text-ink-3">{hint}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-ink-3 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden />
      </button>
      {open &&
        (items.length === 0 ? (
          <p className="border-t border-hairline px-4 py-4 text-sm text-ink-3">Nothing here. Nice.</p>
        ) : (
          <>
            <ul className="divide-y divide-[var(--hairline)] border-t border-hairline">
              {visible.map((it) => (
                <ActionRow key={`${it.account.organizationId}-${it.action.ruleId}`} item={it} />
              ))}
            </ul>
            {items.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="w-full border-t border-hairline py-2 text-sm text-accent hover:bg-surface-2"
              >
                {showAll ? "Show fewer" : `Show all ${items.length}`}
              </button>
            )}
          </>
        ))}
    </section>
  );
};

export const Today = () => {
  const { data, error, loading } = usePortfolio();
  const { refresh } = useApp();

  if (loading && !data) return <Loading label="Building today's list…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;

  const items: Item[] = data.accounts.flatMap((account) =>
    account.actions.map((action) => ({ account, action })),
  );
  // Within a group, the weakest accounts come first.
  items.sort((a, b) => a.action.priority - b.action.priority || a.account.health.score - b.account.health.score);
  const urgentAccounts = new Set(items.filter((i) => i.action.priority <= 2).map((i) => i.account.organizationId));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Today</h1>
        <p className="mt-1 text-ink-2">
          {urgentAccounts.size === 0
            ? "No account needs urgent attention right now."
            : `${plural(urgentAccounts.size, "account")} need${urgentAccounts.size === 1 ? "s" : ""} you this week, out of ${data.summary.totalAccounts}.`}{" "}
          Each item says why it is here.
        </p>
      </div>
      {data.accounts.length === 0 ? (
        <Empty title="No paid, active accounts found" text="Check the Paymaster connection or run the daily snapshot." />
      ) : (
        GROUPS.map((g) => (
          <Group
            key={g.priority}
            title={g.title}
            hint={g.hint}
            startOpen={g.startOpen}
            items={items.filter((i) => i.action.priority === g.priority)}
          />
        ))
      )}
    </div>
  );
};
