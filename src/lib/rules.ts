import type { CsState, HealthBand } from "../types";

/** Plain-language state names used everywhere (never colour alone). */
export const STATE_LABEL: Record<CsState, string> = {
  healthy: "On track",
  watch: "Watch",
  action: "Act now",
};

export const BAND_LABEL: Record<HealthBand, string> = {
  healthy: "Healthy",
  "at-risk": "At risk",
  critical: "Critical",
};

export const bandToState = (band: HealthBand): CsState =>
  band === "healthy" ? "healthy" : band === "at-risk" ? "watch" : "action";

/** One-line explanations shown with each metric, plus the spec rule IDs. */
export const HELP = {
  avgHealth: {
    text: "Average health score of all paid, active accounts (0–100).",
    rules: "AH-1, AH-2, HS-1",
  },
  needFocus: {
    text: "Accounts in the critical or at-risk band.",
    rules: "NF-1 to NF-3",
  },
  engagement: {
    text: "Share of this month's active users who were also active this week. Always weekly ÷ monthly.",
    rules: "EN-1 to EN-5, G-4",
  },
  activeUsers: {
    text: "People who created or changed something in the selected window. Logins alone don't count.",
    rules: "G-3, EN-2",
  },
  inactiveRisk: {
    text: "Accounts where nobody has done anything meaningful within the inactive threshold.",
    rules: "IR-1 to IR-5",
  },
  criticalAlerts: {
    text: "Open ALERT-severity Autopilot issues. Warnings appear on the account page only.",
    rules: "CA-1 to CA-4",
  },
  trend: {
    text: "Health now compared with 30 days ago (a change of 5+ points counts).",
    rules: "TR-1 to TR-3",
  },
  activeProjects: {
    text: "Active projects, split into progressing (touched in the last 14 days) and stalled.",
    rules: "AP-1 to AP-3",
  },
  renewals: {
    text: "Accounts renewing in the next 90 days and how ready they are.",
    rules: "RR-1 to RR-4",
  },
  churnRisk: {
    text: "Accounts by number of churn signals tripped (3 or more = act now).",
    rules: "CR-1 to CR-3",
  },
  seats: {
    text: "Average share of licensed seats used in the last 30 days.",
    rules: "SU-1, SU-2",
  },
} as const;

export const MILESTONE_LABEL: Record<string, string> = {
  FIRST_LOGIN: "First team login",
  FIRST_WORKFLOW_PUBLISHED: "First workflow published",
  FIRST_PO_ACCEPTED: "First purchase order accepted",
  FIRST_AUTOMATION_EXECUTION: "First automation run",
};

const MODULE_LABEL: Record<string, string> = {
  LEAD_MANAGER: "Lead Manager",
  PROPOSAL: "Proposals",
  QUESTIONNAIRE: "Questionnaire",
  AUTOMATION: "Automation",
  AEC_AUTOPILOT: "Autopilot",
  MEETANDNOTE: "Meet & Note",
};

export const moduleLabel = (key: string) =>
  MODULE_LABEL[key] ??
  key
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
