import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { homeCards } from "../lib/home";
import { HELP } from "../lib/rules";
import { plural } from "../lib/format";
import { ErrorNote, Loading, MetricCard, ModuleInfo, TrendArrow } from "../components/ui";
import { CompanyGrid } from "../components/CompanyGrid";

export const Home = () => {
  const { data, error, loading } = usePortfolio();
  const { refresh } = useApp();
  const navigate = useNavigate();

  if (loading && !data) return <Loading label="Loading your accounts…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;

  const h = homeCards(data);
  const bands = data.summary.bands;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">Home</h1>
          <ModuleInfo id="home" />
        </div>
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

      <CompanyGrid accounts={data.accounts} />
    </div>
  );
};
