import type {
  AccountDetail,
  AccountSummary,
  CsSettings,
  EngagementWindow,
  Portfolio,
  Touchpoint,
  TrendPoint,
} from "../types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Envelope<T> = { code?: string; message?: string; body?: T; error?: string };

/** The API sometimes returns double-encoded JSON strings. */
const parse = <T>(text: string): Envelope<T> => {
  let value: unknown = text;
  for (let i = 0; i < 2 && typeof value === "string"; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      break;
    }
  }
  return (value && typeof value === "object" ? value : {}) as Envelope<T>;
};

const call = async <T>(eventType: string, payload: Record<string, unknown> = {}): Promise<T> => {
  const res = await fetch("/api/cs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, ...payload }),
  });
  const env = parse<T>(await res.text());
  if (!res.ok) {
    const detail = typeof env.error === "string" ? env.error : env.message;
    throw new ApiError(detail || `Request failed (HTTP ${res.status})`, res.status);
  }
  return env.body as T;
};

export const api = {
  status: async (): Promise<{ demoMode: boolean; configured: boolean }> => {
    const res = await fetch("/api/status");
    return res.json();
  },
  portfolio: (window: EngagementWindow, trendDays?: number) =>
    call<Portfolio>("CS_V2_GET_PORTFOLIO", { window, ...(trendDays ? { trendDays } : {}) }),
  account: (organizationId: string, window: EngagementWindow) =>
    call<AccountDetail>("CS_V2_GET_ACCOUNT", { organizationId, window }),
  trend: (days: number, organizationId?: string) =>
    call<{ points: TrendPoint[] }>("CS_V2_GET_HEALTH_TREND", {
      days,
      ...(organizationId ? { organizationId } : {}),
    }),
  renewals: (window: EngagementWindow, withinDays = 90) =>
    call<{ asOf: number | null; withinDays: number; accounts: AccountSummary[] }>(
      "CS_V2_GET_RENEWALS",
      { window, withinDays },
    ),
  logTouchpoint: (t: {
    organizationId: string;
    type: Touchpoint["type"];
    occurredAt: number;
    contactName?: string;
    contactTitle?: string;
    notes?: string;
  }) => call<Touchpoint>("CS_V2_LOG_TOUCHPOINT", t),
  settings: () => call<CsSettings>("CS_V2_GET_SETTINGS"),
  updateSettings: (settings: Partial<CsSettings>) =>
    call<CsSettings>("CS_V2_UPDATE_SETTINGS", { settings }),
  runSnapshot: () =>
    call<{ snapshotDate: number; processed: number; failed: number }>("CS_V2_RUN_SNAPSHOT"),
};
