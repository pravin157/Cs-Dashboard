export type ModuleId =
  | "home"
  | "today"
  | "portfolio"
  | "accounts"
  | "account"
  | "renewals"
  | "adoption"
  | "churned"
  | "settings";

export type ModuleInfo = {
  id: ModuleId;
  title: string;
  /** Route to open from search; omitted for pages that need an id (account detail). */
  path?: string;
  summary: string;
  points: string[];
  keywords?: string[];
};

export const MODULES: Record<ModuleId, ModuleInfo> = {
  home: {
    id: "home",
    title: "Home",
    path: "/",
    summary:
      "A one-screen snapshot of every paid All-in-One customer: how many are active, how many have gone quiet, average health and churn.",
    points: [
      "Six headline cards; click one to see the accounts behind it.",
      "\"Quiet\" means nobody created or changed anything. Logins alone don't count.",
      "A short preview of the accounts that need you most urgently.",
    ],
    keywords: ["overview", "summary", "dashboard"],
  },
  today: {
    id: "today",
    title: "Today",
    path: "/today",
    summary:
      "Your work queue. Every account that a rule has flagged, grouped by how urgently it needs attention.",
    points: [
      "Act today: critical alerts, risky renewals, critical health.",
      "This week: no projects, silent accounts, falling health.",
      "When you can / Growth ideas: seat usage and modules worth introducing.",
      "Each card explains why the account is listed and links straight to it.",
    ],
    keywords: ["tasks", "queue", "priority", "actions", "to do"],
  },
  portfolio: {
    id: "portfolio",
    title: "Portfolio",
    path: "/portfolio",
    summary:
      "The health of the whole book of business: average score, health bands, engagement, risk and how they trend over time.",
    points: [
      "Health bands: green 70+, amber 40–69, red below 40.",
      "Engagement and risk cards filter the Accounts list when clicked.",
      "Trend charts for the last 30, 60 or 90 days.",
    ],
    keywords: ["health", "bands", "trend", "engagement", "risk", "metrics"],
  },
  accounts: {
    id: "accounts",
    title: "Accounts",
    path: "/accounts",
    summary:
      "The full list of paid, active accounts with health, trend, activity, projects and renewal in one table.",
    points: [
      "Filter by health band, inactivity, alerts, renewals and more.",
      "Sort by lowest health, longest silent, renewing soonest or name.",
      "Click an account name to open its detail page.",
    ],
    keywords: ["customers", "list", "table", "organisations", "orgs"],
  },
  account: {
    id: "account",
    title: "Account detail",
    summary:
      "Everything about a single customer: its health score and why, what to do next, usage, renewal, alerts and the people using the product.",
    points: [
      "What to do next: actions generated from the card rules, most urgent first.",
      "Why this score: the seven weighted factors behind the health score.",
      "Fact cards for engagement, activity, renewal, seats, alerts, modules and features.",
      "People: who used the product in the last 30 days.",
    ],
  },
  renewals: {
    id: "renewals",
    title: "Renewals",
    path: "/renewals",
    summary:
      "Accounts whose subscription ends soon, grouped by how ready they are to renew so you can step in early.",
    points: [
      "Act now: health below 40, open critical alerts, or declining with 60 days or less left.",
      "Watch: health 40–69 or declining, within 90 days.",
      "On track: health 70+ and not declining.",
      "Renewal date is the subscription end date from Paymaster.",
    ],
    keywords: ["subscription", "expiry", "contract", "renew"],
  },
  adoption: {
    id: "adoption",
    title: "Adoption",
    path: "/adoption",
    summary:
      "Which core modules and high-value features each account uses, so you can spot adoption gaps and upsell cues.",
    points: [
      "Core modules (BOQ, Procurement, Schedule) drive the health score.",
      "Open a module to see which accounts are not using it.",
      "Unused high-value features are good conversation starters.",
    ],
    keywords: ["modules", "features", "usage", "boq", "procurement", "schedule", "upsell"],
  },
  churned: {
    id: "churned",
    title: "Churned accounts",
    path: "/churned",
    summary:
      "Customers whose All-in-One subscription has ended, either expired without renewal or switched off early.",
    points: [
      "Most recent first, with the subscription end date and days since it ended.",
      "Source: Paymaster subscription status.",
    ],
    keywords: ["lost", "expired", "cancelled", "churn"],
  },
  settings: {
    id: "settings",
    title: "Settings",
    path: "/settings",
    summary:
      "Shared thresholds that decide when an account counts as needing focus, inactive or stalled, plus a manual snapshot run.",
    points: [
      "Need focus and Inactive risk day thresholds.",
      "Project stalled threshold.",
      "Run the daily snapshot on demand after setup or threshold changes.",
    ],
    keywords: ["thresholds", "configuration", "snapshot", "preferences"],
  },
};
