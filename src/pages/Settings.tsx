import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { useAsync } from "../lib/useAsync";
import { fmtDate } from "../lib/format";
import { ErrorNote, Loading, Section } from "../components/ui";

export const Settings = () => {
  const { refreshKey, refresh } = useApp();
  const { data, error, loading } = useAsync(() => api.settings(), [refreshKey]);
  const [needFocus, setNeedFocus] = useState(14);
  const [inactive, setInactive] = useState(25);
  const [stalled, setStalled] = useState(14);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (data) {
      setNeedFocus(data.needFocusFromDays ?? 14);
      setInactive(data.inactiveThresholdDays);
      setStalled(data.stalledProjectDays);
    }
  }, [data]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (needFocus >= inactive) {
      setMessage("Need focus must start before inactive risk.");
      return;
    }
    setSaving(true);
    try {
      await api.updateSettings({
        ...(data?.needFocusFromDays != null ? { needFocusFromDays: needFocus } : {}),
        inactiveThresholdDays: inactive,
        stalledProjectDays: stalled,
      });
      setMessage("Saved. Dashboards use the new values from the next load.");
      refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const runSnapshot = async () => {
    setRunning(true);
    setSnapshotMsg(null);
    try {
      const r = await api.runSnapshot();
      setSnapshotMsg(`Snapshot for ${fmtDate(r.snapshotDate)}: ${r.processed} accounts updated, ${r.failed} failed.`);
      refresh();
    } catch (err) {
      setSnapshotMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorNote message={error} onRetry={refresh} />;

  const input = "mt-1 w-32 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink";
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold text-ink">Settings</h1>
      <Section title="Thresholds" subtitle="Shared by everyone using this dashboard">
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm text-ink">
            Need focus from (days)
            <span className="block text-xs text-ink-3">An active account moves to Need focus after this many days without real work. Default 14.</span>
            <input type="number" min={1} max={364} value={needFocus} onChange={(e) => setNeedFocus(Number(e.target.value))} className={input} required />
          </label>
          <label className="block text-sm text-ink">
            Inactive risk from (days)
            <span className="block text-xs text-ink-3">After this many days it moves to Inactive risk. Default 25 (IR-5). Need focus covers the days in between: {needFocus}–{Math.max(needFocus, inactive - 1)}.</span>
            <input type="number" min={2} max={365} value={inactive} onChange={(e) => setInactive(Number(e.target.value))} className={input} required />
          </label>
          <label className="block text-sm text-ink">
            Project stalled after (days)
            <span className="block text-xs text-ink-3">A project with no activity for this long counts as stalled. Default 14 (AP-2).</span>
            <input type="number" min={1} max={365} value={stalled} onChange={(e) => setStalled(Number(e.target.value))} className={input} required />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-page disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
            {message && <span className="text-sm text-ink-2">{message}</span>}
          </div>
        </form>
      </Section>
      <Section title="Daily snapshot" subtitle="Runs automatically at 02:00 UTC for the previous day (G-2)">
        <p className="mb-3 text-sm text-ink-2">
          Run it now after first setup, or after changing thresholds. It can take a few minutes for a large book.
        </p>
        <button
          type="button"
          onClick={runSnapshot}
          disabled={running}
          className="rounded-lg border border-hairline px-4 py-2 text-sm text-ink hover:bg-surface-2 disabled:opacity-60"
        >
          {running ? "Running…" : "Run snapshot now"}
        </button>
        {snapshotMsg && <p className="mt-2 text-sm text-ink-2">{snapshotMsg}</p>}
      </Section>
    </div>
  );
};
