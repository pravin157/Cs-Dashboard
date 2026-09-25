import type { AccountSummary, CsState, Portfolio } from "../types";

/** Agreed defaults, used when the backend doesn't send the home settings yet. */
const NEED_FOCUS_FROM = 14;
const INACTIVE_FROM = 25;

/**
 * Quiet-days state for one account: healthy (< 14 days), watch = Need focus
 * (14–24), action = Inactive risk (25+ or never active). Newer backends send
 * this already (with the configured thresholds); for older ones it is derived
 * from daysSilent with the agreed defaults so every page agrees with Home.
 */
export const quietState = (a: AccountSummary): CsState => {
  if (a.inactive?.needFocusFromDays != null) return a.inactive.state;
  const d = a.inactive?.daysSilent ?? null;
  if (d == null || d >= INACTIVE_FROM) return "action";
  if (d >= NEED_FOCUS_FROM) return "watch";
  return "healthy";
};

export type HomeCards = NonNullable<Portfolio["home"]> & {
  /** true when the backend predates the home cards and values were derived here. */
  partial: boolean;
};

const focusState = (pct: number): CsState => (pct >= 20 ? "action" : pct >= 10 ? "watch" : "healthy");

/**
 * The six home cards. Uses the backend's `home` block when present; otherwise
 * derives what it can from the accounts list (older backend deployments).
 * Total accounts and Churned need the backend's subscription data, so they are
 * marked unavailable in that case.
 */
export const homeCards = (data: Portfolio): HomeCards => {
  if (data.home) return { ...data.home, partial: false };

  const needFrom = NEED_FOCUS_FROM;
  const inactiveFrom = INACTIVE_FROM;
  const active = data.accounts.length;
  const states = data.accounts.map(quietState);
  const quiet = states.filter((s) => s === "watch").length;
  const inactive = states.filter((s) => s === "action").length;
  const quietPct = active ? (quiet / active) * 100 : 0;

  return {
    partial: true,
    totalAccounts: { value: data.scope?.paidOrgs ?? active, freeTrials: 0 },
    activeAccounts: {
      value: active,
      percentOfTotal: data.scope?.paidOrgs ? Math.round((active / data.scope.paidOrgs) * 100) : 100,
    },
    needFocus: {
      value: quiet,
      fromDays: needFrom,
      toDays: inactiveFrom - 1,
      percentOfActive: Math.round(quietPct),
      state: focusState(quietPct),
      previous: null,
    },
    inactiveRisk: {
      value: inactive,
      fromDays: inactiveFrom,
      neverActive: data.accounts.filter((a) => a.inactive?.daysSilent == null).length,
      state: inactive > 0 ? "action" : "healthy",
      previous: null,
    },
    avgHealth: data.summary.avgHealth,
    churned: { available: false, value: 0, expiredLast30d: 0, deactivated: 0 },
  };
};
