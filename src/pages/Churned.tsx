import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { fmtDate } from "../lib/format";
import { HELP } from "../lib/rules";
import { Empty, ErrorNote, Loading, NotConnected, StateChip } from "../components/ui";
import { accountName } from "../components/account-bits";

export const Churned = () => {
  const { data, error, loading } = usePortfolio();
  const { refresh } = useApp();

  if (loading && !data) return <Loading label="Loading churned accounts…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;

  const rows = data.churned ?? [];
  const available = data.home?.churned.available ?? false;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Home
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Churned accounts</h1>
        <p className="mt-1 text-ink-2">{HELP.churned.text} Most recent first.</p>
      </div>

      {!available ? (
        <div className="card p-5">
          <NotConnected what="Subscription status" />
          <p className="mt-2 text-sm text-ink-3">
            {data.home
              ? "Paymaster did not return subscription details, so churn can't be worked out."
              : "The backend is on an older version without the churned list. Deploy the latest AECAutopilot changes."}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          {rows.length === 0 ? (
            <Empty title="No churned accounts" text="Every paying All-in-One account still has an active subscription." />
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-ink-3">
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-3 py-3 font-medium">Plan</th>
                  <th className="px-3 py-3 font-medium">What happened</th>
                  <th className="px-3 py-3 font-medium">Subscription end date</th>
                  <th className="px-3 py-3 text-right font-medium">Days since it ended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {rows.map((c) => (
                  <tr key={c.organizationId}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{accountName(c)}</span>
                      <p className="text-xs text-ink-3">
                        {[c.accountNumber, c.countryCode].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-ink-2">{c.planName ?? "—"}</td>
                    <td className="px-3 py-3">
                      {c.reason === "EXPIRED" ? (
                        <StateChip state="action" label="Expired, not renewed" size="xs" />
                      ) : (
                        <StateChip state="watch" label="Switched off early" size="xs" />
                      )}
                    </td>
                    <td className="px-3 py-3 text-ink-2">{fmtDate(c.subscriptionValidTill)}</td>
                    <td className="px-3 py-3 text-right tabular text-ink">
                      {c.daysSinceEnded ?? <span className="text-ink-3">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <p className="text-xs text-ink-3">
        Source: Paymaster subscription status. An account that moved to a different plan isn't in the All-in-One list, so it
        doesn't show up here.
      </p>
    </div>
  );
};
