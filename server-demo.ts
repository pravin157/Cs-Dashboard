/**
 * SAMPLE DATA — only served when CS_V2_DEMO=true, and the UI shows a
 * "Demo data" banner whenever it is used. Lets the UI be developed before the
 * CS_V2_* backend changes are deployed. Never mixed with real responses.
 */
import type {
  AccountAction,
  AccountDetail,
  AccountSummary,
  CsSettings,
  CsState,
  EngagementWindow,
  Momentum,
  Portfolio,
  Touchpoint,
} from "./src/types.js";

const DAY = 86_400_000;
const today = (() => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
})();
const asOf = today - DAY;

let settings: CsSettings = { inactiveThresholdDays: 30, stalledProjectDays: 14, trendDefaultDays: 30 };
const touchpoints: Touchpoint[] = [];

type Seed = {
  id: string;
  name: string;
  country: string;
  factors: [number, number, number, number, number, number, number];
  adjustments?: Array<{ key: string; label: string; points: number }>;
  prior30: number | null;
  prior7: number | null;
  dau: number;
  wau: number;
  mau: number;
  daysSilent: number | null;
  projects: [number, number] | null; // progressing, stalled
  alerts: [number, number, number];
  renewalInDays: number | null;
  seats: number | null;
  onboarding: number;
  signupDaysAgo: number;
  firstValueDaysAgo: number | null;
  core: string[];
  features: string[];
  execDaysAgo: number | null;
  qbrDaysAgo: number | null;
  sponsor: boolean;
};

const seeds: Seed[] = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Sample: Northwind Builders", country: "IN", factors: [100, 100, 100, 100, 100, 72, 100], prior30: 84, prior7: 88, dau: 9, wau: 16, mau: 22, daysSilent: 0, projects: [6, 1], alerts: [0, 1, 0], renewalInDays: 48, seats: 25, onboarding: 100, signupDaysAgo: 420, firstValueDaysAgo: 412, core: ["BOQ", "PROCUREMENT", "SCHEDULE"], features: ["ESTIMATION", "PROPOSAL_BUILDER", "WHATSAPP_AUTOMATION"], execDaysAgo: 21, qbrDaysAgo: 60, sponsor: true },
  { id: "00000000-0000-4000-8000-000000000002", name: "Sample: Crescent Interiors", country: "AE", factors: [80, 75, 88, 75, 66, 60, 100], adjustments: [{ key: "highWhatsappEngagement", label: "WhatsApp engagement above 70%", points: 2 }], prior30: 71, prior7: 76, dau: 4, wau: 7, mau: 16, daysSilent: 1, projects: [3, 0], alerts: [0, 0, 0], renewalInDays: 132, seats: 20, onboarding: 75, signupDaysAgo: 300, firstValueDaysAgo: 290, core: ["BOQ", "PROCUREMENT"], features: ["ESTIMATION", "WHATSAPP_AUTOMATION"], execDaysAgo: 75, qbrDaysAgo: 140, sponsor: true },
  { id: "00000000-0000-4000-8000-000000000003", name: "Sample: Harbor Line Contractors", country: "US", factors: [70, 60, 50, 50, 40, 55, 50], prior30: 67, prior7: 60, dau: 2, wau: 3, mau: 12, daysSilent: 4, projects: [1, 2], alerts: [1, 2, 0], renewalInDays: 38, seats: 15, onboarding: 50, signupDaysAgo: 200, firstValueDaysAgo: 170, core: ["PROCUREMENT", "SCHEDULE"], features: ["ESTIMATION"], execDaysAgo: 130, qbrDaysAgo: 200, sponsor: true },
  { id: "00000000-0000-4000-8000-000000000004", name: "Sample: Pinecrest Architects", country: "IN", factors: [40, 45, 40, 75, 40, 80, 100], prior30: 55, prior7: 54, dau: 1, wau: 2, mau: 10, daysSilent: 9, projects: [1, 0], alerts: [0, 0, 0], renewalInDays: 210, seats: 30, onboarding: 75, signupDaysAgo: 150, firstValueDaysAgo: 120, core: ["BOQ"], features: ["PROPOSAL_BUILDER"], execDaysAgo: 40, qbrDaysAgo: 90, sponsor: true },
  { id: "00000000-0000-4000-8000-000000000005", name: "Sample: Delta Fitouts", country: "SG", factors: [0, 30, 0, 50, 0, 100, 50], adjustments: [{ key: "slowAlertResolution", label: "Alerts take more than 7 days to resolve", points: -5 }], prior30: 41, prior7: 30, dau: 0, wau: 0, mau: 4, daysSilent: 36, projects: [0, 0], alerts: [2, 1, 1], renewalInDays: 55, seats: 12, onboarding: 50, signupDaysAgo: 240, firstValueDaysAgo: 230, core: ["SCHEDULE"], features: [], execDaysAgo: 220, qbrDaysAgo: null, sponsor: false },
  { id: "00000000-0000-4000-8000-000000000006", name: "Sample: Meridian Homes", country: "IN", factors: [50, 60, 70, 100, 60, 70, 100], prior30: 63, prior7: 66, dau: 3, wau: 5, mau: 14, daysSilent: 2, projects: [1, 1], alerts: [0, 0, 0], renewalInDays: 300, seats: 18, onboarding: 100, signupDaysAgo: 90, firstValueDaysAgo: 80, core: ["BOQ", "SCHEDULE"], features: ["ESTIMATION", "TAKEOFF_2D"], execDaysAgo: null, qbrDaysAgo: null, sponsor: false },
  { id: "00000000-0000-4000-8000-000000000007", name: "Sample: Oakridge Engineering", country: "UK", factors: [40, 30, 20, 25, 0, 90, 100], prior30: 48, prior7: 44, dau: 0, wau: 1, mau: 5, daysSilent: 18, projects: [0, 1], alerts: [0, 0, 0], renewalInDays: 80, seats: 25, onboarding: 25, signupDaysAgo: 45, firstValueDaysAgo: null, core: [], features: [], execDaysAgo: 100, qbrDaysAgo: null, sponsor: true },
  { id: "00000000-0000-4000-8000-000000000008", name: "Sample: Summit Build Co", country: "AU", factors: [90, 85, 90, 100, 80, 75, 100], prior30: 85, prior7: 87, dau: 7, wau: 12, mau: 19, daysSilent: 0, projects: [4, 0], alerts: [0, 0, 0], renewalInDays: 18, seats: 20, onboarding: 100, signupDaysAgo: 700, firstValueDaysAgo: 695, core: ["BOQ", "PROCUREMENT", "SCHEDULE"], features: ["ESTIMATION", "PROPOSAL_BUILDER", "TAKEOFF_2D", "WHATSAPP_AUTOMATION"], execDaysAgo: 10, qbrDaysAgo: 30, sponsor: true },
  { id: "00000000-0000-4000-8000-000000000009", name: "Sample: Riverbend Studio", country: "IN", factors: [70, 55, 60, 75, 40, 65, 100], prior30: null, prior7: null, dau: 2, wau: 4, mau: 11, daysSilent: 3, projects: [2, 1], alerts: [0, 0, 1], renewalInDays: null, seats: null, onboarding: 75, signupDaysAgo: 20, firstValueDaysAgo: 12, core: ["BOQ", "PROCUREMENT"], features: ["ESTIMATION"], execDaysAgo: 12, qbrDaysAgo: null, sponsor: true },
];

const WEIGHTS = [0.25, 0.2, 0.15, 0.1, 0.1, 0.1, 0.1];
const FACTOR_KEYS = ["projects", "modules", "engagement", "onboarding", "automation", "projectRisk", "alerts"];
const FACTOR_LABELS = [
  "Active projects & work flowing",
  "Module breadth & depth",
  "Engagement (WAU/MAU)",
  "Onboarding completion",
  "Automation adoption",
  "Project risk (inverted)",
  "Critical alerts",
];
const FEATURE_LABELS: Record<string, string> = {
  TAKEOFF_2D: "2D Takeoff",
  PROPOSAL_BUILDER: "Proposal Builder",
  WHATSAPP_AUTOMATION: "WhatsApp automation",
  ESTIMATION: "Estimation",
};
const CORE_LABELS: Record<string, string> = { BOQ: "BOQ", PROCUREMENT: "Procurement", SCHEDULE: "Schedule" };

const band = (s: number): "healthy" | "at-risk" | "critical" =>
  s >= 70 ? "healthy" : s >= 40 ? "at-risk" : "critical";
const bandState = (s: number): CsState => (s >= 70 ? "healthy" : s >= 40 ? "watch" : "action");
const mom = (cur: number, prior: number | null): Momentum =>
  prior == null ? "stable" : cur - prior >= 5 ? "improving" : cur - prior <= -5 ? "declining" : "stable";

const build = (s: Seed, window: EngagementWindow): AccountSummary => {
  const weightedSum = s.factors.reduce((sum, f, i) => sum + f * WEIGHTS[i], 0);
  const adj = s.adjustments ?? [];
  const score = Math.round(Math.max(0, Math.min(100, weightedSum + adj.reduce((a, b) => a + b.points, 0))));
  const m30 = mom(score, s.prior30);
  const m7 = mom(score, s.prior7);
  const stick = s.mau ? Math.round((s.wau / s.mau) * 100) : 0;
  const renewalDate = s.renewalInDays == null ? null : today + s.renewalInDays * DAY;
  const renewalState: CsState | null =
    s.renewalInDays == null
      ? null
      : score < 40 || s.alerts[0] > 0 || (m30 === "declining" && s.renewalInDays <= 60)
        ? "action"
        : (score < 70 || m30 === "declining") && s.renewalInDays <= 90
          ? "watch"
          : "healthy";
  const util = s.seats ? Math.round(Math.min(100, (s.mau / s.seats) * 100)) : null;
  const active = s.projects ? s.projects[0] + s.projects[1] : null;
  const delta30 = s.prior30 == null ? null : score - s.prior30;
  const signals = [
    { key: "healthDrop", label: "Health dropped 10+ points in 30 days", tripped: delta30 == null ? null : delta30 <= -10 },
    { key: "inactive30d", label: "No meaningful activity for 30+ days", tripped: s.daysSilent == null || s.daysSilent >= 30 },
    { key: "supportOrCsat", label: "3+ support tickets in 14 days or CSAT falling", tripped: null },
    { key: "noActiveProjects", label: "No active projects", tripped: active == null ? null : active === 0 },
    { key: "lowSeatUtilisation", label: "Seat utilisation below 40%", tripped: util == null ? null : util < 40 },
  ];
  const tripped = signals.filter((x) => x.tripped === true).length;
  const execAt = s.execDaysAgo == null ? null : today - s.execDaysAgo * DAY;
  const qbrAt = s.qbrDaysAgo == null ? null : today - s.qbrDaysAgo * DAY;
  const execState: CsState =
    !s.sponsor || s.execDaysAgo == null || s.execDaysAgo > 180
      ? "action"
      : s.execDaysAgo <= 90 && (s.qbrDaysAgo ?? 999) <= 180
        ? "healthy"
        : "watch";
  const obState: CsState =
    s.signupDaysAgo < 30 ? "healthy" : s.onboarding < 50 || s.firstValueDaysAgo == null ? "action" : "healthy";
  const inactive: CsState =
    s.daysSilent == null || s.daysSilent >= settings.inactiveThresholdDays ? "action" : s.daysSilent >= 15 ? "watch" : "healthy";
  const alertsState: CsState = s.alerts[0] >= 3 ? "action" : s.alerts[0] >= 1 ? "watch" : "healthy";
  const coreMissing = ["BOQ", "PROCUREMENT", "SCHEDULE"].filter((m) => !s.core.includes(m));

  const base: Omit<AccountSummary, "actions"> = {
    organizationId: s.id,
    name: s.name,
    accountNumber: `SAMPLE-${s.id.slice(-3)}`,
    emailAddress: null,
    countryCode: s.country,
    planName: "All-in-One",
    snapshotDate: asOf,
    isLive: false,
    health: {
      score,
      band: band(score),
      state: bandState(score),
      previousScore: s.prior7 == null ? null : Math.round(score - (score - s.prior7) / 7),
      weightedSum: Math.round(weightedSum * 10) / 10,
      factors: s.factors.map((f, i) => ({
        key: FACTOR_KEYS[i],
        label: FACTOR_LABELS[i],
        weight: WEIGHTS[i],
        score: f,
        weighted: Math.round(f * WEIGHTS[i] * 10) / 10,
      })),
      adjustments: adj,
      momentum30d: m30,
      momentum7d: m7,
      delta30d: delta30,
      delta7d: s.prior7 == null ? null : score - s.prior7,
    },
    engagement: {
      window,
      activeUsers: window === "DAILY" ? s.dau : window === "WEEKLY" ? s.wau : s.mau,
      dau: s.dau,
      wau: s.wau,
      mau: s.mau,
      stickinessPct: stick,
      state: stick >= 50 ? "healthy" : stick >= 20 ? "watch" : "action",
    },
    inactive: {
      lastMeaningfulActionAt: s.daysSilent == null ? null : today - s.daysSilent * DAY,
      daysSilent: s.daysSilent,
      thresholdDays: settings.inactiveThresholdDays,
      state: inactive,
    },
    projects: {
      connected: s.projects != null,
      active,
      progressing: s.projects?.[0] ?? null,
      stalled: s.projects?.[1] ?? null,
      state: active == null ? null : active === 0 ? "action" : s.projects![1] >= s.projects![0] ? "watch" : "healthy",
    },
    alerts: { critical: s.alerts[0], warning: s.alerts[1], escalated: s.alerts[2], state: alertsState },
    renewal: {
      renewalDate,
      daysToRenewal: s.renewalInDays,
      state: renewalState,
      source: "PAYMASTER",
      isActive: true,
    },
    seats: {
      licensed: s.seats,
      active30d: s.mau,
      utilisation: util,
      state: util == null ? null : util >= 70 ? "healthy" : util >= 40 ? "watch" : "action",
    },
    churn: { signals, tripped, level: tripped >= 3 ? "action" : tripped >= 1 ? "watch" : "healthy" },
    relationship: {
      execIdentified: s.sponsor,
      execSponsor: s.sponsor ? { name: "Sample Sponsor", title: "Director" } : null,
      lastExecContactAt: execAt,
      lastQbrAt: qbrAt,
      state: execState,
    },
    onboarding: {
      percent: s.onboarding,
      signupAt: today - s.signupDaysAgo * DAY,
      firstValueAt: s.firstValueDaysAgo == null ? null : today - s.firstValueDaysAgo * DAY,
      ttfvDays: s.firstValueDaysAgo == null ? null : s.signupDaysAgo - s.firstValueDaysAgo,
      state: obState,
    },
    modules: {
      core: ["BOQ", "PROCUREMENT", "SCHEDULE"].map((m) => ({ module: m, label: CORE_LABELS[m], used: s.core.includes(m) })),
      coreMissing,
      other: ["LEAD_MANAGER", "PROPOSAL"].slice(0, s.core.length > 1 ? 2 : 0),
      records30d: s.core.length * 6,
    },
    features: Object.keys(FEATURE_LABELS).map((f) => ({ feature: f, label: FEATURE_LABELS[f], used: s.features.includes(f) })),
    automation: {
      activeWorkflows: s.factors[4] >= 40 ? 2 : 0,
      executionsCompleted30d: Math.max(0, Math.round((s.factors[4] - 40) / 2)),
      executionsFailed30d: s.factors[4] > 0 && s.factors[4] < 80 ? 3 : 0,
    },
    support: { connected: false, tickets14d: null, csat: null, nps: null },
  };

  const actions: AccountAction[] = [];
  if (base.alerts.critical > 0) actions.push({ priority: 1, ruleId: "CA-1", title: `Resolve ${base.alerts.critical} critical alert${base.alerts.critical > 1 ? "s" : ""}`, reason: "Open ALERT-severity issues pull health down and block renewal readiness." });
  if (renewalState === "action" && (s.renewalInDays ?? 999) <= 90) actions.push({ priority: 1, ruleId: "RR-2", title: `Renewal at risk: ${s.renewalInDays} days left`, reason: "Renewal is close and the account is not renewal-ready." });
  if (base.churn.level === "action") actions.push({ priority: 1, ruleId: "CR-2", title: "High churn risk", reason: `${tripped} churn signals tripped.` });
  if (base.health.band === "critical") actions.push({ priority: 1, ruleId: "HS-10", title: "Book a health review call", reason: `Health score is ${score}, in the critical band.` });
  if (active === 0) actions.push({ priority: 2, ruleId: "AP-3", title: "No active projects", reason: "Zero active projects is a red flag regardless of health." });
  if (inactive === "action") actions.push({ priority: 2, ruleId: "IR-1", title: `Silent for ${s.daysSilent} days`, reason: "No user has created or updated anything recently (logins don't count)." });
  if (m30 === "declining") actions.push({ priority: 2, ruleId: "TR-1", title: `Health down ${Math.abs(delta30 ?? 0)} points in 30 days`, reason: "Check in before the decline reaches the renewal." });
  else if (m7 === "declining") actions.push({ priority: 2, ruleId: "TR-3", title: `Fast drop: ${Math.abs(score - (s.prior7 ?? score))} points this week`, reason: "7-day momentum is an early warning signal." });
  if (obState === "action") actions.push({ priority: 3, ruleId: "OB-3", title: "Onboarding is stuck", reason: s.firstValueDaysAgo == null ? "No first BOQ, PO or project after 30+ days." : `Only ${s.onboarding}% of onboarding milestones done after 30+ days.` });
  if (execState === "action") actions.push({ priority: 3, ruleId: "EE-2", title: s.sponsor ? "Re-engage the executive sponsor" : "Identify an executive sponsor", reason: s.sponsor ? "No exec contact in the last 180 days." : "No exec sponsor is recorded for this account." });
  if (base.seats.state === "action") actions.push({ priority: 3, ruleId: "SU-2", title: `Only ${util}% of seats in use`, reason: "Low seat usage signals shelfware ahead of renewal." });
  if (coreMissing.length) actions.push({ priority: 4, ruleId: "MD-1", title: `Introduce ${coreMissing.map((m) => CORE_LABELS[m]).join(", ")}`, reason: "Core modules not used in the last 30 days." });
  const unused = base.features.filter((f) => !f.used);
  if (unused.length) actions.push({ priority: 4, ruleId: "FA-2", title: `Adoption cue: ${unused.map((f) => f.label).join(", ")}`, reason: "High-value features not used in the last 30 days." });

  return { ...base, actions: actions.sort((a, b) => a.priority - b.priority) };
};

const worst = (c: { action: number; watch: number }): CsState => (c.action ? "action" : c.watch ? "watch" : "healthy");

const portfolio = (window: EngagementWindow, trendDays: number): Portfolio => {
  const accounts = seeds.map((s) => build(s, window)).sort((a, b) => a.health.score - b.health.score);
  const n = accounts.length;
  const avgHealth = Math.round((accounts.reduce((s, a) => s + a.health.score, 0) / n) * 10) / 10;
  const critical = accounts.filter((a) => a.health.band === "critical").length;
  const atRisk = accounts.filter((a) => a.health.band === "at-risk").length;
  const focusPct = ((critical + atRisk) / n) * 100;
  const eng = Math.round(accounts.reduce((s, a) => s + a.engagement.stickinessPct, 0) / n);
  const inAct = accounts.filter((a) => a.inactive.state === "action").length;
  const inWatch = accounts.filter((a) => a.inactive.state === "watch").length;
  const alerts = accounts.reduce((s, a) => s + a.alerts.critical, 0);
  const conn = accounts.filter((a) => a.projects.connected);
  const prog = conn.reduce((s, a) => s + (a.projects.progressing ?? 0), 0);
  const stall = conn.reduce((s, a) => s + (a.projects.stalled ?? 0), 0);
  const zero = conn.filter((a) => a.projects.active === 0).length;
  const renewing = accounts.filter((a) => a.renewal.daysToRenewal != null && a.renewal.daysToRenewal <= 90);
  const cnt = (list: AccountSummary[], f: (a: AccountSummary) => CsState | null) => ({
    healthy: list.filter((a) => f(a) === "healthy").length,
    watch: list.filter((a) => f(a) === "watch").length,
    action: list.filter((a) => f(a) === "action").length,
  });
  const rc = cnt(renewing, (a) => a.renewal.state);
  const cc = cnt(accounts, (a) => a.churn.level);
  const seatVals = accounts.map((a) => a.seats.utilisation).filter((v): v is number => v != null);
  const avgSeats = Math.round(seatVals.reduce((s, v) => s + v, 0) / seatVals.length);
  const trend = Array.from({ length: trendDays }, (_, i) => {
    const t = trendDays - 1 - i;
    return {
      date: asOf - t * DAY,
      avgHealth: Math.round((avgHealth + t * 0.12 + Math.sin(t / 3) * 1.4) * 10) / 10,
      avgStickiness: Math.round((eng / 100 + Math.cos(t / 4) * 0.03) * 1000) / 1000,
      orgCount: n,
    };
  });

  return {
    asOf,
    generatedAt: Date.now(),
    window,
    settings,
    scope: { paidOrgs: n + 2, accountsInScope: n, activeFilterApplied: true, projectsConnected: true, supportConnected: false, liveComputedAccounts: 0 },
    summary: {
      totalAccounts: n,
      avgHealth: { value: avgHealth, state: bandState(avgHealth), previous: avgHealth + 0.8 },
      needFocus: { value: critical + atRisk, critical, atRisk, percentOfBook: Math.round(focusPct), state: focusPct >= 20 ? "action" : focusPct >= 10 ? "watch" : "healthy", previous: critical + atRisk - 1 },
      engagement: { value: eng, state: eng >= 50 ? "healthy" : eng >= 20 ? "watch" : "action", previous: eng + 2 },
      activeUsers: { value: accounts.reduce((s, a) => s + a.engagement.activeUsers, 0), window, previous: null },
      inactiveRisk: { value: inAct, watch: inWatch, thresholdDays: settings.inactiveThresholdDays, state: worst({ action: inAct, watch: inWatch }), previous: inAct },
      criticalAlerts: { value: alerts, state: alerts >= 3 ? "action" : alerts >= 1 ? "watch" : "healthy", previous: alerts - 1 },
      trend: {
        improving: accounts.filter((a) => a.health.momentum30d === "improving").length,
        stable: accounts.filter((a) => a.health.momentum30d === "stable").length,
        declining: accounts.filter((a) => a.health.momentum30d === "declining").length,
        fastDeclining7d: accounts.filter((a) => a.health.momentum7d === "declining").length,
      },
      activeProjects: { connected: true, total: prog + stall, progressing: prog, stalled: stall, zeroProjectAccounts: zero, state: zero > 0 ? "action" : stall > prog ? "watch" : "healthy" },
      renewals: { within90: renewing.length, ...rc, state: worst(rc) },
      churnRisk: { ...cc, state: worst(cc) },
      seatUtilisation: { value: avgSeats, state: avgSeats >= 70 ? "healthy" : avgSeats >= 40 ? "watch" : "action", lowSeatAccounts: accounts.filter((a) => a.seats.state === "action").length },
      bands: { healthy: n - critical - atRisk, atRisk, critical },
    },
    trend,
    adoption: {
      coreModules: ["BOQ", "PROCUREMENT", "SCHEDULE"].map((m) => ({
        module: m,
        label: CORE_LABELS[m],
        orgsUsing: accounts.filter((a) => a.modules.core.find((c) => c.module === m)?.used).length,
        orgsMissing: accounts.filter((a) => !a.modules.core.find((c) => c.module === m)?.used).map((a) => ({ organizationId: a.organizationId, name: a.name })),
      })),
      features: Object.keys(FEATURE_LABELS).map((f) => ({
        feature: f,
        label: FEATURE_LABELS[f],
        orgsUsing: accounts.filter((a) => a.features.find((x) => x.feature === f)?.used).length,
      })),
    },
    accounts,
  };
};

const account = (id: string, window: EngagementWindow): AccountDetail | null => {
  const seed = seeds.find((s) => s.id === id);
  if (!seed) return null;
  const a = build(seed, window);
  const pCount = (seed.projects?.[0] ?? 0) + (seed.projects?.[1] ?? 0);
  return {
    ...a,
    detail: {
      projects: Array.from({ length: pCount }, (_, i) => {
        const progressing = i < (seed.projects?.[0] ?? 0);
        return {
          projectId: `${id}-p${i}`,
          projectName: `Sample project ${i + 1}`,
          lastActionAt: today - (progressing ? 2 + i : 20 + i * 5) * DAY,
          status: progressing ? "PROGRESSING" : "STALLED",
        };
      }),
      moduleRecords: a.modules.core.map((c) => ({ ...c, records30d: c.used ? 6 : 0 })),
      featureLastUsed: a.features.map((f) => ({ feature: f.feature, label: f.label, lastUsedAt: f.used ? today - 3 * DAY : null })),
      onboardingMilestones: ["FIRST_LOGIN", "FIRST_WORKFLOW_PUBLISHED", "FIRST_PO_ACCEPTED", "FIRST_AUTOMATION_EXECUTION"].map((key, i) => {
        const done = i < Math.round((seed.onboarding / 100) * 4);
        return { key, achievedAt: done ? today - (seed.signupDaysAgo - (i + 1) * 3) * DAY : null, daysToAchieve: done ? (i + 1) * 3 : null };
      }),
      alerts: Array.from({ length: seed.alerts[0] + seed.alerts[1] }, (_, i) => ({
        alertId: `${id}-a${i}`,
        ruleName: i < seed.alerts[0] ? "Project budget overrun" : "Schedule slipping",
        severity: i < seed.alerts[0] ? "ALERT" : "WARNING",
        description: "Sample alert",
        firstDetectedAt: today - (i + 2) * DAY,
        entityType: "PROJECT",
      })),
      users: Array.from({ length: Math.min(8, seed.mau + 2) }, (_, i) => ({
        userId: `${id}-u${i}`,
        name: `Sample User ${i + 1}`,
        email: null,
        designation: i === 0 ? "Owner" : "Member",
        isSuperAdmin: i === 0,
        status: "ACCEPTED",
        actions30d: i < seed.mau ? 40 - i * 4 : 0,
        lastActionAt: i < seed.mau ? today - i * DAY : null,
      })),
      touchpoints: touchpoints.filter((t) => t.organizationId === id),
      history: Array.from({ length: 30 }, (_, i) => {
        const t = 29 - i;
        const start = seed.prior30 ?? a.health.score;
        return {
          date: asOf - t * DAY,
          healthScore: Math.round(a.health.score + ((start - a.health.score) * t) / 29 + Math.sin(t) * 1.5),
          stickinessPct: a.engagement.stickinessPct,
          wau: seed.wau,
          mau: seed.mau,
        };
      }),
    },
  };
};

const ok = (code: string, body: unknown) => ({ status: 200, body: { code, message: "Demo data", body } });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const demoResponse = (req: any): { status: number; body: unknown } => {
  const window: EngagementWindow = req.window ?? "WEEKLY";
  switch (req.eventType) {
    case "CS_V2_GET_PORTFOLIO":
      return ok("CS_V2_PORTFOLIO_RETRIEVED", portfolio(window, req.trendDays ?? settings.trendDefaultDays));
    case "CS_V2_GET_ACCOUNT": {
      const a = account(req.organizationId, window);
      return a ? ok("CS_V2_ACCOUNT_RETRIEVED", a) : { status: 404, body: { code: "NOT_FOUND", message: "No such sample account" } };
    }
    case "CS_V2_GET_RENEWALS": {
      const within = req.withinDays ?? 90;
      const p = portfolio(window, 30);
      return ok("CS_V2_RENEWALS_RETRIEVED", {
        asOf,
        withinDays: within,
        accounts: p.accounts
          .filter((a) => a.renewal.daysToRenewal != null && a.renewal.daysToRenewal <= within)
          .sort((x, y) => (x.renewal.daysToRenewal ?? 0) - (y.renewal.daysToRenewal ?? 0)),
      });
    }
    case "CS_V2_LOG_TOUCHPOINT": {
      const t: Touchpoint = {
        touchpointId: `demo-${touchpoints.length + 1}`,
        organizationId: req.organizationId,
        type: req.type,
        occurredAt: req.occurredAt,
        contactName: req.contactName || null,
        contactTitle: req.contactTitle || null,
        notes: req.notes || null,
        createdBy: "demo",
        createdAt: Date.now(),
      };
      touchpoints.unshift(t);
      return ok("CS_V2_TOUCHPOINT_CREATED", t);
    }
    case "CS_V2_GET_TOUCHPOINTS":
      return ok("CS_V2_TOUCHPOINTS_RETRIEVED", touchpoints.filter((t) => t.organizationId === req.organizationId));
    case "CS_V2_GET_SETTINGS":
      return ok("CS_V2_SETTINGS_RETRIEVED", settings);
    case "CS_V2_UPDATE_SETTINGS":
      settings = { ...settings, ...req.settings };
      return ok("CS_V2_SETTINGS_UPDATED", settings);
    case "CS_V2_GET_HEALTH_TREND":
      return ok("CS_V2_HEALTH_TREND_RETRIEVED", { organizationId: null, days: req.days ?? 30, points: portfolio(window, req.days ?? 30).trend });
    case "CS_V2_RUN_SNAPSHOT":
      return ok("CS_V2_SNAPSHOT_COMPLETED", { snapshotDate: asOf, processed: seeds.length, failed: 0, projectsConnected: true });
    default:
      return { status: 400, body: { code: "INVALID_REQUEST", message: "Unsupported eventType." } };
  }
};
