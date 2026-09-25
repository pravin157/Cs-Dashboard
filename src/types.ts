// Shapes returned by AECAutopilot CS_V2_* eventTypes.

export type CsState = "healthy" | "watch" | "action";
export type HealthBand = "healthy" | "at-risk" | "critical";
export type Momentum = "improving" | "stable" | "declining";
export type EngagementWindow = "DAILY" | "WEEKLY" | "MONTHLY";

export interface HealthFactor {
  key: string;
  label: string;
  weight: number;
  score: number;
  weighted: number;
}

export interface HealthAdjustment {
  key: string;
  label: string;
  points: number;
}

export interface ChurnSignal {
  key: string;
  label: string;
  tripped: boolean | null;
}

export interface AccountAction {
  priority: 1 | 2 | 3 | 4;
  ruleId: string;
  title: string;
  reason: string;
}

export interface AccountSummary {
  organizationId: string;
  name: string | null;
  accountNumber: string | null;
  emailAddress: string | null;
  countryCode: string | null;
  planName: string | null;
  snapshotDate: number;
  isLive: boolean;
  health: {
    score: number;
    band: HealthBand;
    state: CsState;
    previousScore: number | null;
    weightedSum: number;
    factors: HealthFactor[];
    adjustments: HealthAdjustment[];
    momentum30d: Momentum;
    momentum7d: Momentum;
    delta30d: number | null;
    delta7d: number | null;
  };
  engagement: {
    window: EngagementWindow;
    activeUsers: number;
    dau: number;
    wau: number;
    mau: number;
    stickinessPct: number;
    state: CsState;
  };
  inactive: {
    lastMeaningfulActionAt: number | null;
    daysSilent: number | null;
    thresholdDays: number;
    state: CsState;
  };
  projects: {
    connected: boolean;
    active: number | null;
    progressing: number | null;
    stalled: number | null;
    state: CsState | null;
  };
  alerts: { critical: number; warning: number; escalated: number; state: CsState };
  renewal: {
    renewalDate: number | null;
    daysToRenewal: number | null;
    state: CsState | null;
    source: "PAYMASTER";
    isActive: boolean | null;
  };
  seats: {
    licensed: number | null;
    active30d: number;
    utilisation: number | null;
    state: CsState | null;
  };
  churn: { signals: ChurnSignal[]; tripped: number; level: CsState };
  relationship: {
    execIdentified: boolean;
    execSponsor: { name: string | null; title: string | null } | null;
    lastExecContactAt: number | null;
    lastQbrAt: number | null;
    state: CsState;
  };
  onboarding: {
    percent: number;
    signupAt: number | null;
    firstValueAt: number | null;
    ttfvDays: number | null;
    state: CsState;
  };
  modules: {
    core: Array<{ module: string; label: string; used: boolean }>;
    coreMissing: string[];
    other: string[];
    records30d: number;
  };
  features: Array<{ feature: string; label: string; used: boolean }>;
  automation: {
    activeWorkflows: number;
    executionsCompleted30d: number;
    executionsFailed30d: number;
  };
  support: { connected: boolean; tickets14d: number | null; csat: number | null; nps: number | null };
  actions: AccountAction[];
}

export interface CardValue {
  value: number | null;
  state: CsState | null;
  previous?: number | null;
}

export interface TrendPoint {
  date: number;
  avgHealth: number;
  avgStickiness: number;
  orgCount: number;
}

export interface Portfolio {
  asOf: number | null;
  generatedAt: number;
  window: EngagementWindow;
  settings: CsSettings;
  scope: {
    paidOrgs: number;
    accountsInScope: number;
    activeFilterApplied: boolean;
    projectsConnected: boolean;
    supportConnected: boolean;
    liveComputedAccounts: number;
  };
  summary: {
    totalAccounts: number;
    avgHealth: CardValue;
    needFocus: CardValue & { critical: number; atRisk: number; percentOfBook: number };
    engagement: CardValue;
    activeUsers: { value: number; window: EngagementWindow; previous: number | null };
    inactiveRisk: CardValue & { watch: number; thresholdDays: number };
    criticalAlerts: CardValue;
    trend: { improving: number; stable: number; declining: number; fastDeclining7d: number };
    activeProjects: {
      connected: boolean;
      total: number;
      progressing: number;
      stalled: number;
      zeroProjectAccounts: number;
      state: CsState | null;
    };
    renewals: { within90: number; healthy: number; watch: number; action: number; state: CsState };
    churnRisk: { healthy: number; watch: number; action: number; state: CsState };
    seatUtilisation: { value: number | null; state: CsState | null; lowSeatAccounts: number };
    bands: { healthy: number; atRisk: number; critical: number };
  };
  trend: TrendPoint[];
  adoption: {
    coreModules: Array<{
      module: string;
      label: string;
      orgsUsing: number;
      orgsMissing: Array<{ organizationId: string; name: string | null }>;
    }>;
    features: Array<{ feature: string; label: string; orgsUsing: number }>;
  };
  accounts: AccountSummary[];
}

export interface Touchpoint {
  touchpointId: string;
  organizationId: string;
  type: "EXEC_CONTACT" | "QBR" | "EXEC_SPONSOR" | "NOTE";
  occurredAt: number;
  contactName: string | null;
  contactTitle: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: number;
}

export interface AccountDetail extends AccountSummary {
  detail: {
    projects: Array<{
      projectId: string;
      projectName: string | null;
      lastActionAt: number | null;
      status: "PROGRESSING" | "STALLED";
    }>;
    moduleRecords: Array<{ module: string; label: string; used: boolean; records30d: number }>;
    featureLastUsed: Array<{ feature: string; label: string; lastUsedAt: number | null }>;
    onboardingMilestones: Array<{ key: string; achievedAt: number | null; daysToAchieve: number | null }>;
    alerts: Array<{
      alertId: string;
      ruleName: string;
      severity: string;
      description: string | null;
      firstDetectedAt: number | null;
      entityType: string | null;
    }>;
    users: Array<{
      userId: string;
      name: string;
      email: string | null;
      designation: string | null;
      isSuperAdmin: boolean;
      status: string | null;
      actions30d: number;
      lastActionAt: number | null;
    }>;
    touchpoints: Touchpoint[];
    history: Array<{ date: number; healthScore: number; stickinessPct: number; wau: number; mau: number }>;
  };
}

export interface CsSettings {
  inactiveThresholdDays: number;
  stalledProjectDays: number;
  trendDefaultDays: number;
}
