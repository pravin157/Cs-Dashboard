import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useAsync } from "../lib/useAsync";
import { daysAgo, fmtDate } from "../lib/format";
import { Empty, ErrorNote, Loading, Section } from "./ui";

const AUTHOR_KEY = "cs-v2-remark-author";
const MAX_LENGTH = 4000;

/** CS remarks for one customer, stored as NOTE touchpoints. Works for active and churned accounts. */
export const Remarks = ({
  organizationId,
  onCount,
}: {
  organizationId: string;
  /** Called with the number of remarks whenever the list (re)loads. */
  onCount?: (count: number) => void;
}) => {
  const [reloadKey, setReloadKey] = useState(0);
  const { data, error, loading } = useAsync(() => api.touchpoints(organizationId), [organizationId, reloadKey]);

  const [text, setText] = useState("");
  const [author, setAuthor] = useState(() => localStorage.getItem(AUTHOR_KEY) ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const remarks = (data ?? []).filter((t) => t.type === "NOTE" && t.notes);

  useEffect(() => {
    if (data) onCount?.(remarks.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const notes = text.trim();
    if (!notes) return;
    setSaving(true);
    setSaveError(null);
    try {
      const createdBy = author.trim();
      localStorage.setItem(AUTHOR_KEY, createdBy);
      await api.logTouchpoint({
        organizationId,
        type: "NOTE",
        occurredAt: Date.now(),
        notes,
        ...(createdBy ? { createdBy } : {}),
      });
      setText("");
      setReloadKey((k) => k + 1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const input = "rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink";

  return (
    <div className="space-y-5">
      <Section title="Add a remark" subtitle="Call notes, reasons for churn, follow-ups… visible to the whole CS team.">
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={4}
            placeholder="Write a remark…"
            aria-label="Remark"
            className={`${input} w-full`}
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={200}
              placeholder="Your name"
              aria-label="Your name"
              className={`${input} w-48`}
            />
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-page disabled:opacity-60"
            >
              {saving ? "Saving…" : "Add remark"}
            </button>
            <span className="text-xs text-ink-3">
              {text.length}/{MAX_LENGTH}
            </span>
          </div>
          {saveError && <p className="text-sm text-bad-ink">{saveError}</p>}
        </form>
      </Section>

      <Section title="Remarks" subtitle="Newest first">
        {loading && !data ? (
          <Loading label="Loading remarks…" />
        ) : error && !data ? (
          <ErrorNote message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : remarks.length === 0 ? (
          <Empty title="No remarks yet" text="Add the first one above." />
        ) : (
          <ul className="divide-y divide-[var(--hairline)]">
            {remarks.map((r) => (
              <li key={r.touchpointId} className="py-3">
                <p className="whitespace-pre-wrap text-sm text-ink">{r.notes}</p>
                <p className="mt-1 text-xs text-ink-3" title={new Date(r.occurredAt).toLocaleString()}>
                  {r.createdBy ?? "Unknown"} · {fmtDate(r.occurredAt)} ({daysAgo(r.occurredAt)})
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};
