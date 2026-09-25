import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { HELP } from "../lib/rules";
import { windowLabel } from "../lib/format";
import { ErrorNote, Loading, MetricCard, Section, TrendArrow } from "../components/ui";
import { BandBar, HealthLine } from "../components/charts";

const RANGES = [30, 60, 90] as const;

export const Portfolio = () => {
  const [trendDays, setTrendDays] = useState<number>(30); // TR-2 default
  const { data, error, loading } = usePortfolio(trendDays);
  const { refresh, window } = useApp();
  const navigate = useNavigate();
  const go = (filter: string) => navigate(`/accounts?filter=${filter}`);

  if (loading && !data) return <Loading label="Loading portfolio…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;
  const s = data.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Portfolio</h1>
          <p className="mt-1 text-ink-2">
            {s.totalAccounts} paid, active accounts. Click any card to see the accounts behind it.
          </p>
        </div>
        {!data.scope.activeFilterApplied && (
          <p className="text-xs text-ink-3">Subscription status unavailable, so showing all paid accounts.</p>
        )}
      </div>

      {/* Health first: the one headline */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card flex flex-col justify-between p-5">
          <div>
            <p className="text-sm font-medium text-ink-2">Average health</p>
            <p className="mt-2 text-5xl font-semibold text-ink">
              {s.avgHealth.value}
              <span className="text-lg font-normal text-ink-3"> / 100</span>
            </p>
            <div className="mt-2">
              <TrendArrow current={s.avgHealth.value} previous={s.avgHealth.previous} label="vs previous snapshot" />
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-3">{HELP.avgHealth.text}</p>
        </section>
        <Section title="Health bands" subtitle="Click a band to list those accounts" className="lg:col-span-2">
          <BandBar
            healthy={s.bands.healthy}
            atRisk={s.bands.atRisk}
            critical={s.bands.critical}
            onSelect={(b) => go(b)}
          />
        </Section>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ink-3">Engagement & risk</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Low health"
            help={HELP.lowHealth}
            value={s.needFocus.value}
            unit={`of ${s.totalAccounts}`}
            state={s.needFocus.state}
            trend={<TrendArrow current={s.needFocus.value} previous={s.needFocus.previous} goodWhenUp={false} />}
            detail={`${s.needFocus.critical} critical · ${s.needFocus.atRisk} at risk (${s.needFocus.percentOfBook}% of book)`}
            onClick={() => go("focus")}
          />
          <MetricCard
            label="Engagement"
            help={HELP.engagement}
            value={`${s.engagement.value}%`}
            unit="weekly ÷ monthly"
            state={s.engagement.state}
            trend={<TrendArrow current={s.engagement.value} previous={s.engagement.previous} suffix=" pts" />}
            detail="Fixed ratio; not affected by the Day/Week/Month switch"
            onClick={() => go("low-engagement")}
          />
          <MetricCard
            label={`Active users ${windowLabel[window]}`}
            help={HELP.activeUsers}
            value={s.activeUsers.value}
            unit="people"
            trend={<TrendArrow current={s.activeUsers.value} previous={s.activeUsers.previous} />}
            detail="Created or changed something (logins don't count)"
          />
          <MetricCard
            label="Inactive risk"
            help={HELP.inactiveRisk}
            value={s.inactiveRisk.value}
            unit="accounts"
            state={s.inactiveRisk.state}
            trend={<TrendArrow current={s.inactiveRisk.value} previous={s.inactiveRisk.previous} goodWhenUp={false} />}
            detail={`Quiet ${s.inactiveRisk.thresholdDays}+ days · ${s.inactiveRisk.watch} more quiet ${data.settings?.needFocusFromDays ?? 14}+ days`}
            onClick={() => go("inactive")}
          />
          <MetricCard
            label="Critical alerts"
            help={HELP.criticalAlerts}
            value={s.criticalAlerts.value}
            unit="open"
            state={s.criticalAlerts.state}
            trend={<TrendArrow current={s.criticalAlerts.value} previous={s.criticalAlerts.previous} goodWhenUp={false} />}
            detail="ALERT severity only"
            onClick={() => go("alerts")}
          />
          <MetricCard
            label="Health trend (30 days)"
            help={HELP.trend}
            value={s.trend.declining}
            unit="declining"
            state={s.trend.declining > 0 ? "watch" : "healthy"}
            detail={`${s.trend.improving} improving · ${s.trend.stable} stable · ${s.trend.fastDeclining7d} fell fast this week`}
            onClick={() => go("declining")}
          />
          <MetricCard
            label="Churn risk"
            help={HELP.churnRisk}
            value={s.churnRisk.action}
            unit="high risk"
            state={s.churnRisk.state}
            detail={`${s.churnRisk.watch} with 1–2 signals`}
            onClick={() => go("churn")}
          />
          <MetricCard
            label="Seat utilisation"
            help={HELP.seats}
            value={s.seatUtilisation.value == null ? "—" : `${s.seatUtilisation.value}%`}
            unit="average"
            state={s.seatUtilisation.state}
            detail={`${s.seatUtilisation.lowSeatAccounts} accounts below 40%`}
            onClick={() => go("low-seats")}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ink-3">Projects & renewals</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricCard
            label="Active projects"
            help={HELP.activeProjects}
            value={s.activeProjects.total}
            unit="projects"
            state={s.activeProjects.state}
            notConnected={s.activeProjects.connected ? undefined : "Project data"}
            detail={
              <>
                {s.activeProjects.progressing} progressing · {s.activeProjects.stalled} stalled ·{" "}
                <strong className="font-medium text-bad-ink">
                  {s.activeProjects.zeroProjectAccounts} accounts with no projects
                </strong>
              </>
            }
            onClick={() => go("zero-projects")}
          />
          <MetricCard
            label="Renewals in 90 days"
            help={HELP.renewals}
            value={s.renewals.within90}
            unit="accounts"
            state={s.renewals.state}
            detail={`${s.renewals.action} act now · ${s.renewals.watch} watch · ${s.renewals.healthy} on track`}
            onClick={() => navigate("/renewals")}
          />
        </div>
      </div>

      <Section
        title="Average health over time"
        subtitle="Shaded bands: green 70+, amber 40–69, red below 40"
        action={
          <div role="radiogroup" aria-label="Trend range" className="flex rounded-lg border border-hairline p-0.5">
            {RANGES.map((d) => (
              <button
                key={d}
                role="radio"
                aria-checked={trendDays === d}
                type="button"
                onClick={() => setTrendDays(d)}
                className={`rounded-md px-2.5 py-1 text-xs ${trendDays === d ? "bg-ink text-page" : "text-ink-2 hover:text-ink"}`}
              >
                {d} days
              </button>
            ))}
          </div>
        }
      >
        {data.trend.length > 1 ? (
          <HealthLine points={data.trend.map((p) => ({ date: p.date, value: p.avgHealth }))} valueLabel="Average health" />
        ) : (
          <p className="py-10 text-center text-sm text-ink-3">
            The trend appears once the daily snapshot has run for a few days.
          </p>
        )}
      </Section>

      <Section title="Engagement over time" subtitle="Average weekly ÷ monthly active users, per account">
        {data.trend.length > 1 ? (
          <HealthLine
            points={data.trend.map((p) => ({ date: p.date, value: Math.round(p.avgStickiness * 100) }))}
            valueLabel="Engagement"
            unit="%"
            height={160}
            showBands={false}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-3">No history yet.</p>
        )}
      </Section>

      <p className="text-xs text-ink-3">
        Support tickets, CSAT and NPS are not connected yet (no Freshdesk/Zoho sync), so churn signal
        "support tickets or CSAT" is skipped. Renewal dates are the subscription end dates from Paymaster.
      </p>
    </div>
  );
};
