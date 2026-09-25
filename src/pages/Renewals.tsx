import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { useAsync } from "../lib/useAsync";
import { fmtDate } from "../lib/format";
import type { AccountSummary, CsState } from "../types";
import { Empty, ErrorNote, Loading, StateChip } from "../components/ui";
import { HealthBadge, MomentumTag, accountName } from "../components/account-bits";

const RANGES = [30, 60, 90, 180] as const;

const COLUMNS: Array<{ state: CsState; title: string; hint: string }> = [
  { state: "action", title: "Act now", hint: "Health below 40, open critical alerts, or declining with 60 days or less left" },
  { state: "watch", title: "Watch", hint: "Health 40–69 or declining, within 90 days" },
  { state: "healthy", title: "On track", hint: "Health 70+ and not declining" },
];

const Card = ({ a }: { a: AccountSummary }) => (
  <Link to={`/accounts/${a.organizationId}`} className="block rounded-lg border border-hairline bg-surface p-3 hover:border-[var(--ink-3)]">
    <div className="flex items-start justify-between gap-2">
      <span className="font-medium text-ink">{accountName(a)}</span>
      <span className="shrink-0 text-right">
        <span className="block text-lg font-semibold leading-none text-ink">
          {a.renewal.daysToRenewal != null && a.renewal.daysToRenewal < 0 ? "Overdue" : `${a.renewal.daysToRenewal}d`}
        </span>
        <span className="text-[11px] text-ink-3">{fmtDate(a.renewal.renewalDate, false)}</span>
      </span>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <HealthBadge account={a} />
      <MomentumTag momentum={a.health.momentum30d} delta={a.health.delta30d} />
    </div>
    {a.alerts.critical > 0 && <p className="mt-2 text-xs text-bad-ink">{a.alerts.critical} open critical alert(s)</p>}
  </Link>
);

export const Renewals = () => {
  const { window, refreshKey, refresh, setAsOf } = useApp();
  const [within, setWithin] = useState(90);
  const { data, error, loading } = useAsync(async () => {
    const r = await api.renewals(window, within);
    setAsOf(r.asOf);
    return r;
  }, [window, within, refreshKey]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Renewals</h1>
          <p className="mt-1 text-ink-2">Accounts renewing soon, grouped by how ready they are. Soonest first.</p>
        </div>
        <div role="radiogroup" aria-label="Renewal window" className="flex rounded-lg border border-hairline bg-surface p-0.5">
          {RANGES.map((d) => (
            <button
              key={d}
              role="radio"
              aria-checked={within === d}
              type="button"
              onClick={() => setWithin(d)}
              className={`rounded-md px-3 py-1 text-sm ${within === d ? "bg-ink text-page" : "text-ink-2 hover:text-ink"}`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Loading label="Loading renewals…" />
      ) : error && !data ? (
        <ErrorNote message={error} onRetry={refresh} />
      ) : !data || data.accounts.length === 0 ? (
        <div className="card">
          <Empty title={`No renewals in the next ${within} days`} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((c) => {
            const list = data.accounts.filter((a) => a.renewal.state === c.state);
            return (
              <section key={c.state} className="rounded-xl bg-surface-2 p-3">
                <header className="mb-3 px-1">
                  <div className="flex items-center justify-between">
                    <StateChip state={c.state} label={c.title} />
                    <span className="text-sm text-ink-2">{list.length}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-3">{c.hint}</p>
                </header>
                <div className="space-y-2">
                  {list.length === 0 ? (
                    <p className="px-1 py-4 text-sm text-ink-3">None</p>
                  ) : (
                    list.map((a) => <Card key={a.organizationId} a={a} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p className="text-xs text-ink-3">Renewal date = subscription end date (subscriptionValidTill) from Paymaster.</p>
    </div>
  );
};
