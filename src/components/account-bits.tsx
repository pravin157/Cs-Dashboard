import { ArrowDownRight, ArrowUpRight, ArrowRight } from "lucide-react";
import type { AccountSummary, Momentum } from "../types";
import { BAND_LABEL, bandToState } from "../lib/rules";
import { quietState } from "../lib/home";
import { StateChip } from "./ui";

export const accountName = (a: Pick<AccountSummary, "name" | "organizationId">) =>
  a.name || `Unnamed account (${a.organizationId.slice(0, 8)})`;

export const HealthBadge = ({ account }: { account: AccountSummary }) => (
  <span className="inline-flex items-center gap-2">
    <span className="w-7 text-right text-base font-semibold tabular text-ink">{account.health.score}</span>
    <StateChip state={bandToState(account.health.band)} label={BAND_LABEL[account.health.band]} size="xs" />
  </span>
);

const MOMENTUM: Record<Momentum, { icon: typeof ArrowRight; cls: string; label: string }> = {
  improving: { icon: ArrowUpRight, cls: "text-good-ink", label: "Improving" },
  stable: { icon: ArrowRight, cls: "text-ink-3", label: "Stable" },
  declining: { icon: ArrowDownRight, cls: "text-bad-ink", label: "Declining" },
};

export const MomentumTag = ({ momentum, delta }: { momentum: Momentum; delta: number | null }) => {
  const m = MOMENTUM[momentum];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${m.cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
      {delta != null && delta !== 0 && (
        <span className="tabular">
          ({delta > 0 ? "+" : ""}
          {delta})
        </span>
      )}
    </span>
  );
};

/** Card-click filters for the Accounts page (spec G-7). */
export const ACCOUNT_FILTERS: Array<{
  id: string;
  label: string;
  test: (a: AccountSummary) => boolean;
}> = [
  { id: "all", label: "All", test: () => true },
  { id: "need-focus", label: "Need focus", test: (a) => quietState(a) === "watch" },
  { id: "inactive", label: "Inactive risk", test: (a) => quietState(a) === "action" },
  { id: "focus", label: "Low health", test: (a) => a.health.band !== "healthy" },
  { id: "critical", label: "Critical", test: (a) => a.health.band === "critical" },
  { id: "at-risk", label: "At risk", test: (a) => a.health.band === "at-risk" },
  { id: "healthy", label: "Healthy", test: (a) => a.health.band === "healthy" },
  { id: "declining", label: "Declining", test: (a) => a.health.momentum30d === "declining" },
  { id: "alerts", label: "Critical alerts", test: (a) => a.alerts.critical > 0 },
  { id: "zero-projects", label: "No projects", test: (a) => a.projects.connected && a.projects.active === 0 },
  {
    id: "renewal-90",
    label: "Renewing ≤ 90d",
    test: (a) => a.renewal.daysToRenewal != null && a.renewal.daysToRenewal <= 90,
  },
  { id: "churn", label: "Churn risk", test: (a) => a.churn.level !== "healthy" },
  { id: "low-seats", label: "Low seat use", test: (a) => a.seats.state === "action" },
  { id: "low-engagement", label: "Low engagement", test: (a) => a.engagement.state !== "healthy" },
];
