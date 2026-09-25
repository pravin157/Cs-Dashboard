import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { homeCards } from "../lib/home";
import { HELP } from "../lib/rules";
import { plural } from "../lib/format";
import type { AccountSummary } from "../types";
import { Empty, ErrorNote, Loading, MetricCard, TrendArrow } from "../components/ui";
import { AccountCard } from "./Today";

const PREVIEW = 3;

export const Home = () => {
  const { data, error, loading } = usePortfolio();
  const { refresh } = useApp();
  const navigate = useNavigate();

  if (loading && !data) return <Loading label="Loading your accounts…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;

  const h = homeCards(data);
  const bands = data.summary.bands;

  // Most urgent accounts first: anything in "Act today", else "This week".
  const byPriority = (p: number) =>
    data.accounts
      .filter((a) => a.actions.some((x) => x.priority === p))
      .sort((a, b) => a.health.score - b.health.score);
  const today = byPriority(1);
  const preview: { list: AccountSummary[]; priority: 1 | 2 } =
    today.length > 0 ? { list: today, priority: 1 } : { list: byPriority(2), priority: 2 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Home</h1>
        <p className="mt-1 text-ink-2">
          Your paid All-in-One customers at a glance. "Quiet" means nobody created or changed anything; logins alone
          don't count.
        </p>
      </div>

      {h.partial && (
        <div className="rounded-lg border border-hairline bg-warn-soft px-4 py-3 text-sm text-warn-ink">
          <strong>The backend is on an older version.</strong> Need focus, Inactive risk, Total active and Average
          health are worked out here from the account list. Churned and the exact Total accounts need the latest
          AECAutopilot changes deployed.
        </div>
      )}

      {/* The six headline cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total accounts"
          help={HELP.totalAccounts}
          value={h.totalAccounts.value}
          unit="accounts"
          detail={
            h.partial ? (
              "All All-in-One subscriptions, including churned and free trials"
            ) : (
            <>
              {h.activeAccounts.value} active · {h.churned.value} churned
              {h.totalAccounts.freeTrials > 0 && (
                <span className="text-ink-3"> · {plural(h.totalAccounts.freeTrials, "free trial")} not counted</span>
              )}
            </>
            )
          }
        />
        <MetricCard
          label="Total active"
          help={HELP.activeAccounts}
          value={h.activeAccounts.value}
          unit="with an active subscription"
          detail={`${h.activeAccounts.percentOfTotal}% of all paid accounts`}
          onClick={() => navigate("/accounts")}
        />
        <MetricCard
          label="Need focus"
          help={HELP.quiet}
          value={h.needFocus.value}
          unit="accounts"
          state={h.needFocus.state}
          trend={<TrendArrow current={h.needFocus.value} previous={h.needFocus.previous} goodWhenUp={false} />}
          detail={`Quiet for ${h.needFocus.fromDays}–${h.needFocus.toDays} days · ${h.needFocus.percentOfActive}% of active`}
          onClick={() => navigate("/accounts?filter=need-focus&sort=silent")}
        />
        <MetricCard
          label="Inactive risk"
          help={HELP.inactiveRisk}
          value={h.inactiveRisk.value}
          unit="accounts"
          state={h.inactiveRisk.state}
          trend={<TrendArrow current={h.inactiveRisk.value} previous={h.inactiveRisk.previous} goodWhenUp={false} />}
          detail={
            <>
              Quiet for {h.inactiveRisk.fromDays}+ days
              {h.inactiveRisk.neverActive > 0 && ` · ${h.inactiveRisk.neverActive} never active`}
            </>
          }
          onClick={() => navigate("/accounts?filter=inactive&sort=silent")}
        />
        <MetricCard
          label="Average health"
          help={HELP.avgHealth}
          value={h.avgHealth.value ?? "—"}
          unit="/ 100"
          state={h.avgHealth.state}
          trend={<TrendArrow current={h.avgHealth.value} previous={h.avgHealth.previous} label="vs previous snapshot" />}
          detail={`${bands.critical} critical · ${bands.atRisk} at risk · ${bands.healthy} healthy`}
          onClick={() => navigate("/portfolio")}
        />
        <MetricCard
          label="Churned"
          help={HELP.churned}
          value={h.churned.value}
          unit="accounts"
          notConnected={h.churned.available ? undefined : h.partial ? "Churn data" : "Subscription status"}
          detail={`${h.churned.expiredLast30d} in the last 30 days · ${h.churned.deactivated} switched off early`}
          onClick={() => navigate("/churned")}
        />
      </div>

      {/* A short look at who needs attention */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink">{preview.priority === 1 ? "Act today" : "This week"}</h2>
            <p className="text-sm text-ink-2">
              {preview.list.length === 0
                ? "Nothing urgent right now."
                : `${plural(preview.list.length, "account")}, weakest health first.`}
            </p>
          </div>
          <Link to="/today" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            See everything in Today <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {preview.list.length === 0 ? (
          <div className="card">
            <Empty title="Nothing needs you right now" text="Accounts show up here when a rule flags them." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {preview.list.slice(0, PREVIEW).map((a) => (
              <AccountCard key={a.organizationId} account={a} priority={preview.priority} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
