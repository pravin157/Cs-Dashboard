import { useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { usePortfolio } from "../lib/usePortfolio";
import { fmtDate } from "../lib/format";
import type { ChurnedAccount } from "../types";
import { Empty, ErrorNote, Loading, StateChip, TabBar } from "../components/ui";
import { accountName } from "../components/account-bits";
import { Remarks } from "../components/Remarks";

type ChurnedTab = "details" | "remarks";

const Fact = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="card p-4">
    <h3 className="mb-2 text-[13px] font-medium text-ink-2">{title}</h3>
    <div className="text-sm text-ink">{children}</div>
  </div>
);

const ReasonChip = ({ reason }: { reason: ChurnedAccount["reason"] }) =>
  reason === "EXPIRED" ? (
    <StateChip state="action" label="Expired, not renewed" size="xs" />
  ) : (
    <StateChip state="watch" label="Switched off early" size="xs" />
  );

const Body = ({ c }: { c: ChurnedAccount }) => {
  const [params, setParams] = useSearchParams();
  const tab: ChurnedTab = params.get("tab") === "details" ? "details" : "remarks";
  const [remarkCount, setRemarkCount] = useState<number | undefined>(undefined);

  return (
    <div className="space-y-5">
      <div>
        <Link to="/churned" className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Churned accounts
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-ink">{accountName(c)}</h1>
          <ReasonChip reason={c.reason} />
        </div>
        <p className="mt-1 text-sm text-ink-3">
          {[c.accountNumber, c.countryCode, c.planName].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>

      <TabBar<ChurnedTab>
        label="Churned account sections"
        tabs={[
          { id: "remarks", label: "Remarks", count: remarkCount },
          { id: "details", label: "Details" },
        ]}
        active={tab}
        onChange={(id) => setParams(id === "remarks" ? {} : { tab: id }, { replace: true })}
      />

      {/* Keep Remarks mounted so the tab count stays loaded while viewing Details. */}
      <div hidden={tab !== "remarks"}>
        <Remarks organizationId={c.organizationId} onCount={setRemarkCount} />
      </div>
      {tab === "details" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Fact title="What happened">
            <ReasonChip reason={c.reason} />
          </Fact>
          <Fact title="Subscription end date">{fmtDate(c.subscriptionValidTill)}</Fact>
          <Fact title="Days since it ended">{c.daysSinceEnded ?? "—"}</Fact>
          <Fact title="Plan">{c.planName ?? "—"}</Fact>
        </div>
      )}
    </div>
  );
};

export const ChurnedAccountPage = () => {
  const { orgId = "" } = useParams();
  const { data, error, loading } = usePortfolio();
  const { refresh } = useApp();

  if (loading && !data) return <Loading label="Loading account…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;

  const c = (data.churned ?? []).find((x) => x.organizationId === orgId);
  if (!c) {
    return (
      <div className="space-y-4">
        <Link to="/churned" className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Churned accounts
        </Link>
        <div className="card">
          <Empty title="Account not in the churned list" text="It may have renewed, or moved to a different plan." />
        </div>
      </div>
    );
  }
  return <Body c={c} />;
};
