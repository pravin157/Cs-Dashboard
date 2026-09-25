import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { ErrorNote, Loading, Section } from "../components/ui";

const Meter = ({ label, using, total }: { label: string; using: number; total: number }) => {
  const pct = total ? Math.round((using / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="tabular text-ink-2">
          {using} of {total} accounts <span className="text-ink-3">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-surface-2" role="img" aria-label={`${label}: ${pct}% of accounts`}>
        <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const Adoption = () => {
  const { data, error, loading } = usePortfolio();
  const { refresh } = useApp();
  const [openModule, setOpenModule] = useState<string | null>(null);

  if (loading && !data) return <Loading label="Loading adoption…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;
  const total = data.summary.totalAccounts;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Adoption</h1>
        <p className="mt-1 text-ink-2">Which core modules and high-value features each account uses (last 30 days).</p>
      </div>

      <Section title="Core modules" subtitle="BOQ, Procurement and Schedule drive the health score (MD-1, HS-3). Open one to see who is missing it.">
        <div className="space-y-5">
          {data.adoption.coreModules.map((m) => (
            <div key={m.module}>
              <Meter label={m.label} using={m.orgsUsing} total={total} />
              {m.orgsMissing.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOpenModule(openModule === m.module ? null : m.module)}
                  aria-expanded={openModule === m.module}
                  className="mt-1.5 text-xs text-accent hover:underline"
                >
                  {openModule === m.module ? "Hide" : "Show"} {m.orgsMissing.length} accounts not using {m.label}
                </button>
              )}
              {openModule === m.module && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {m.orgsMissing.map((o) => (
                    <li key={o.organizationId}>
                      <Link
                        to={`/accounts/${o.organizationId}`}
                        className="inline-block rounded-full border border-hairline px-2.5 py-0.5 text-xs text-ink-2 hover:border-[var(--ink-3)] hover:text-ink"
                      >
                        {o.name || o.organizationId.slice(0, 8)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="High-value features" subtitle="Unused features are adoption and upsell cues (FA-1, FA-2)">
        <div className="space-y-5">
          {data.adoption.features.map((f) => (
            <Meter key={f.feature} label={f.label} using={f.orgsUsing} total={total} />
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-3">
          2D Takeoff usage is only counted once the takeoff service writes to the activity log.
        </p>
      </Section>
    </div>
  );
};
