import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, CircleDashed, X } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { useAsync } from "../lib/useAsync";
import { daysAgo, fmtDate, windowLabel } from "../lib/format";
import { BAND_LABEL, MILESTONE_LABEL, bandToState, moduleLabel } from "../lib/rules";
import type { AccountDetail, CsState, Touchpoint } from "../types";
import { ErrorNote, InfoTip, Loading, NotConnected, Section, StateChip } from "../components/ui";
import { HealthBreakdown, HealthLine } from "../components/charts";
import { MomentumTag, accountName } from "../components/account-bits";

/** Small labelled fact tile used across the account page. */
const Fact = ({
  title,
  state,
  help,
  children,
}: {
  title: string;
  state?: CsState | null;
  help?: { text: string; rules: string };
  children: ReactNode;
}) => (
  <div className="card p-4">
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
        {title}
        {help && <InfoTip text={help.text} rules={help.rules} />}
      </h3>
      {state !== undefined && <StateChip state={state} size="xs" />}
    </div>
    <div className="text-sm text-ink-2">{children}</div>
  </div>
);

const Big = ({ children, unit }: { children: ReactNode; unit?: string }) => (
  <p className="mb-1">
    <span className="text-2xl font-semibold text-ink">{children}</span>
    {unit && <span className="ml-1 text-sm text-ink-3">{unit}</span>}
  </p>
);

const YesNo = ({ ok, label }: { ok: boolean | null; label: string }) => (
  <li className="flex items-center gap-2">
    {ok === null ? (
      <CircleDashed className="h-4 w-4 text-ink-3" aria-label="unknown" />
    ) : ok ? (
      <Check className="h-4 w-4 text-good-ink" aria-label="yes" />
    ) : (
      <X className="h-4 w-4 text-ink-3" aria-label="no" />
    )}
    <span className={ok ? "text-ink" : "text-ink-2"}>{label}</span>
  </li>
);

const TOUCHPOINT_LABEL: Record<Touchpoint["type"], string> = {
  EXEC_CONTACT: "Exec contact",
  QBR: "QBR",
  EXEC_SPONSOR: "Exec sponsor set",
  NOTE: "Note",
};

const TouchpointForm = ({ organizationId, onSaved }: { organizationId: string; onSaved: (t: Touchpoint) => void }) => {
  const [type, setType] = useState<Touchpoint["type"]>("EXEC_CONTACT");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await api.logTouchpoint({
        organizationId,
        type,
        occurredAt: new Date(`${date}T12:00:00Z`).getTime(),
        contactName,
        contactTitle,
        notes,
      });
      onSaved(saved);
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink";
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs text-ink-2">
        What happened
        <select value={type} onChange={(e) => setType(e.target.value as Touchpoint["type"])} className={`${input} mt-1`}>
          <option value="EXEC_CONTACT">Talked to an executive</option>
          <option value="QBR">Held a QBR</option>
          <option value="EXEC_SPONSOR">Set the executive sponsor</option>
          <option value="NOTE">Other note</option>
        </select>
      </label>
      <label className="text-xs text-ink-2">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mt-1`} required />
      </label>
      <label className="text-xs text-ink-2">
        Contact name
        <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs text-ink-2">
        Title
        <input value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs text-ink-2 sm:col-span-2">
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${input} mt-1`} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-page disabled:opacity-60"
        >
          {saving ? "Saving…" : "Log it"}
        </button>
        {error && <span className="text-sm text-bad-ink">{error}</span>}
      </div>
    </form>
  );
};

const Body = ({ a, onTouchpoint }: { a: AccountDetail; onTouchpoint: (t: Touchpoint) => void }) => {
  const { window } = useApp();
  const d = a.detail;
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link to="/accounts" className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All accounts
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{accountName(a)}</h1>
            <p className="mt-1 text-sm text-ink-3">
              {[a.accountNumber, a.countryCode, a.planName, a.emailAddress].filter(Boolean).join(" · ")}
              {a.isLive && " · score computed live (no snapshot yet)"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-ink-3">Health score</p>
              <p className="text-4xl font-semibold text-ink">{a.health.score}</p>
            </div>
            <div className="space-y-1">
              <StateChip state={bandToState(a.health.band)} label={BAND_LABEL[a.health.band]} />
              <div>
                <MomentumTag momentum={a.health.momentum30d} delta={a.health.delta30d} />
                <span className="text-xs text-ink-3"> 30d</span>
              </div>
              {a.health.momentum7d === "declining" && (
                <div>
                  <MomentumTag momentum="declining" delta={a.health.delta7d} />
                  <span className="text-xs text-ink-3"> 7d</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* What to do */}
      {a.actions.length > 0 && (
        <Section title="What to do next" subtitle="Generated from the card rules; most urgent first">
          <ol className="space-y-2">
            {a.actions.map((x) => (
              <li key={x.ruleId + x.title} className="flex gap-3 rounded-lg bg-surface-2 px-3 py-2">
                <span className="mt-0.5 shrink-0">
                  <StateChip state={x.priority === 1 ? "action" : x.priority === 2 ? "watch" : "healthy"} label={`P${x.priority}`} size="xs" />
                </span>
                <span className="text-sm">
                  <span className="font-medium text-ink">{x.title}</span>
                  <span className="text-ink-2"> · {x.reason}</span>
                  <span className="ml-1 text-xs text-ink-3">({x.ruleId})</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Why this score */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Why this score" subtitle="Seven weighted factors, then adjustments (HS-1)">
          <HealthBreakdown factors={a.health.factors} adjustments={a.health.adjustments} score={a.health.score} />
        </Section>
        <Section title="Health history" subtitle="Daily snapshots">
          {d.history.length > 1 ? (
            <HealthLine points={d.history.map((h) => ({ date: h.date, value: h.healthScore }))} valueLabel="Health" height={260} />
          ) : (
            <p className="py-10 text-center text-sm text-ink-3">History appears after a few daily snapshots.</p>
          )}
        </Section>
      </div>

      {/* Facts grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Fact title="Engagement" state={a.engagement.state} help={{ text: "Weekly ÷ monthly active users. 50% or more is on track.", rules: "EN-1…EN-5" }}>
          <Big unit="weekly ÷ monthly">{a.engagement.stickinessPct}%</Big>
          <p>
            {a.engagement.activeUsers} active {windowLabel[window]} · {a.engagement.wau} this week · {a.engagement.mau} this month
          </p>
        </Fact>
        <Fact title="Last meaningful activity" state={a.inactive.state} help={{ text: "Creating or updating a record, running a workflow, raising a PO… Logins don't count.", rules: "IR-1…IR-5" }}>
          <Big>{a.inactive.daysSilent == null ? "Never" : a.inactive.daysSilent === 0 ? "Today" : `${a.inactive.daysSilent} days ago`}</Big>
          <p>Flagged after {a.inactive.thresholdDays} silent days; watch from 15.</p>
        </Fact>
        <Fact title="Active projects" state={a.projects.state} help={{ text: "Progressing = touched in the last 14 days. Zero projects is always a red flag.", rules: "AP-1…AP-3" }}>
          {a.projects.connected ? (
            <>
              <Big unit="active">{a.projects.active}</Big>
              <p>
                {a.projects.progressing} progressing · {a.projects.stalled} stalled
              </p>
            </>
          ) : (
            <NotConnected what="Project data" />
          )}
        </Fact>
        <Fact title="Renewal" state={a.renewal.state} help={{ text: "On track: health 70+ and not declining. Watch: 40–69 or declining within 90 days. Act now: below 40, open critical alerts, or declining within 60 days.", rules: "RR-1…RR-4" }}>
          {a.renewal.renewalDate ? (
            <>
              <Big unit={a.renewal.daysToRenewal != null && a.renewal.daysToRenewal >= 0 ? "days left" : undefined}>
                {a.renewal.daysToRenewal != null && a.renewal.daysToRenewal < 0 ? "Overdue" : a.renewal.daysToRenewal}
              </Big>
              <p>Renews {fmtDate(a.renewal.renewalDate)} (from Paymaster)</p>
            </>
          ) : (
            <p className="text-ink-3">No renewal date on file.</p>
          )}
        </Fact>
        <Fact title="Seat utilisation" state={a.seats.state} help={{ text: "People active in the last 30 days ÷ licensed seats.", rules: "SU-1, SU-2" }}>
          {a.seats.utilisation != null ? (
            <>
              <Big>{a.seats.utilisation}%</Big>
              <p>
                {a.seats.active30d} of {a.seats.licensed} licensed seats used
              </p>
            </>
          ) : (
            <p className="text-ink-3">Licensed seat count not available.</p>
          )}
        </Fact>
        <Fact title="Open alerts" state={a.alerts.state} help={{ text: "Only ALERT severity counts toward the portfolio. Warnings and escalations are listed here.", rules: "CA-1…CA-4" }}>
          <Big unit="critical">{a.alerts.critical}</Big>
          <p>
            {a.alerts.warning} warnings · {a.alerts.escalated} escalated
          </p>
        </Fact>
        <Fact title="Churn signals" state={a.churn.level} help={{ text: "0 signals on track, 1–2 watch, 3+ act now.", rules: "CR-1…CR-3" }}>
          <ul className="space-y-1">
            {a.churn.signals.map((s) => (
              <YesNo key={s.key} ok={s.tripped} label={s.tripped === null ? `${s.label} (no data)` : s.label} />
            ))}
          </ul>
        </Fact>
        <Fact title="Executive relationship" state={a.relationship.state} help={{ text: "On track: exec contact within 90 days and a QBR within 180 days.", rules: "EE-1, EE-2" }}>
          <p>
            Sponsor:{" "}
            <span className="text-ink">
              {a.relationship.execSponsor
                ? [a.relationship.execSponsor.name, a.relationship.execSponsor.title].filter(Boolean).join(", ")
                : "not identified"}
            </span>
          </p>
          <p>Last exec contact: {daysAgo(a.relationship.lastExecContactAt)}</p>
          <p>Last QBR: {daysAgo(a.relationship.lastQbrAt)}</p>
        </Fact>
        <Fact title="Onboarding" state={a.onboarding.state} help={{ text: "Act now if under 50% complete or no first value (BOQ, PO or project) after 30 days.", rules: "OB-1…OB-3" }}>
          <Big unit="complete">{a.onboarding.percent}%</Big>
          <p>
            Time to first value: {a.onboarding.ttfvDays != null ? `${a.onboarding.ttfvDays} days` : "not reached yet"}
          </p>
          <ul className="mt-2 space-y-1">
            {d.onboardingMilestones.map((m) => (
              <YesNo key={m.key} ok={m.achievedAt != null} label={MILESTONE_LABEL[m.key] ?? m.key} />
            ))}
          </ul>
        </Fact>
        <Fact title="Core modules (30 days)" help={{ text: "BOQ, Procurement and Schedule. Depth = real records created.", rules: "MD-1…MD-3, HS-3" }}>
          <ul className="space-y-1">
            {d.moduleRecords.map((m) => (
              <li key={m.module} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {m.used ? <Check className="h-4 w-4 text-good-ink" aria-label="used" /> : <X className="h-4 w-4 text-ink-3" aria-label="not used" />}
                  <span className={m.used ? "text-ink" : "text-ink-2"}>{m.label}</span>
                </span>
                <span className="tabular text-ink-3">{m.records30d} records</span>
              </li>
            ))}
          </ul>
          {a.modules.other.length > 0 && (
            <p className="mt-2 text-xs text-ink-3">Also uses: {a.modules.other.map(moduleLabel).join(", ")}</p>
          )}
        </Fact>
        <Fact title="Feature adoption (30 days)" help={{ text: "Unused high-value features are adoption or upsell cues.", rules: "FA-1, FA-2" }}>
          <ul className="space-y-1">
            {d.featureLastUsed.map((f) => (
              <li key={f.feature} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {f.lastUsedAt ? <Check className="h-4 w-4 text-good-ink" aria-label="used" /> : <X className="h-4 w-4 text-ink-3" aria-label="not used" />}
                  <span className={f.lastUsedAt ? "text-ink" : "text-ink-2"}>{f.label}</span>
                </span>
                <span className="text-xs text-ink-3">{f.lastUsedAt ? daysAgo(f.lastUsedAt) : "Suggest it"}</span>
              </li>
            ))}
          </ul>
        </Fact>
        <Fact title="Support">
          <NotConnected what="Tickets, CSAT and NPS" />
          <p className="mt-2 text-xs text-ink-3">Needs the Freshdesk / Zoho sync.</p>
        </Fact>
      </div>

      {/* Lists */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Projects" subtitle="Active projects, stalled ones first">
          {!a.projects.connected ? (
            <NotConnected what="Project data" />
          ) : d.projects.length === 0 ? (
            <p className="text-sm text-ink-3">No active projects.</p>
          ) : (
            <ul className="divide-y divide-[var(--hairline)] text-sm">
              {[...d.projects]
                .sort((x, y) => (x.status === y.status ? 0 : x.status === "STALLED" ? -1 : 1))
                .map((p) => (
                  <li key={p.projectId} className="flex items-center justify-between gap-2 py-2">
                    <span className="truncate text-ink">{p.projectName || "Untitled project"}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-ink-3">
                      {daysAgo(p.lastActionAt)}
                      <StateChip state={p.status === "PROGRESSING" ? "healthy" : "watch"} label={p.status === "PROGRESSING" ? "Progressing" : "Stalled"} size="xs" />
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Section>
        <Section title="Open alerts" subtitle="From Autopilot">
          {d.alerts.length === 0 ? (
            <p className="text-sm text-ink-3">No open alerts.</p>
          ) : (
            <ul className="divide-y divide-[var(--hairline)] text-sm">
              {d.alerts.map((al) => (
                <li key={al.alertId} className="flex items-start justify-between gap-3 py-2">
                  <span>
                    <span className="text-ink">{al.ruleName}</span>
                    {al.description && <span className="block text-xs text-ink-3">{al.description}</span>}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-ink-3">
                    <StateChip state={al.severity === "ALERT" ? "action" : "watch"} label={al.severity.toLowerCase()} size="xs" />
                    {daysAgo(al.firstDetectedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="People" subtitle="Who is using the product (last 30 days)">
        {d.users.length === 0 ? (
          <p className="text-sm text-ink-3">No user list available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-ink-3">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Role</th>
                  <th className="py-2 pr-3 text-right font-medium">Actions (30d)</th>
                  <th className="py-2 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {d.users.map((u) => (
                  <tr key={u.userId}>
                    <td className="py-2 pr-3 text-ink">
                      {u.name}
                      {u.isSuperAdmin && <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent">Owner</span>}
                    </td>
                    <td className="py-2 pr-3 text-ink-2">{u.designation ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular text-ink">{u.actions30d}</td>
                    <td className="py-2 text-ink-2">{u.lastActionAt ? daysAgo(u.lastActionAt) : <span className="text-ink-3">not in 30 days</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Relationship log" subtitle="Log exec contacts, QBRs and the sponsor so the relationship card stays accurate (EE-1)">
        <TouchpointForm organizationId={a.organizationId} onSaved={onTouchpoint} />
        {d.touchpoints.length > 0 && (
          <ul className="mt-5 divide-y divide-[var(--hairline)] border-t border-hairline text-sm">
            {d.touchpoints.map((t) => (
              <li key={t.touchpointId} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span>
                  <span className="font-medium text-ink">{TOUCHPOINT_LABEL[t.type]}</span>
                  {t.contactName && <span className="text-ink-2"> with {t.contactName}{t.contactTitle ? `, ${t.contactTitle}` : ""}</span>}
                  {t.notes && <span className="block text-xs text-ink-3">{t.notes}</span>}
                </span>
                <span className="text-xs text-ink-3">{fmtDate(t.occurredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};

export const AccountPage = () => {
  const { orgId = "" } = useParams();
  const { window, refreshKey, refresh } = useApp();
  const [bump, setBump] = useState(0);
  const { data, error, loading } = useAsync(() => api.account(orgId, window), [orgId, window, refreshKey, bump]);

  if (loading && !data) return <Loading label="Loading account…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;
  if (!data) return null;
  // Reload so the relationship card re-evaluates EE-2 with the new touchpoint.
  return <Body a={data} onTouchpoint={() => setBump((b) => b + 1)} />;
};
