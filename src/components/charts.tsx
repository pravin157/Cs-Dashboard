import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import { fmtDate, fmtShortDate } from "../lib/format";
import type { HealthAdjustment, HealthFactor } from "../types";

/** Resolve CSS custom properties for SVG attributes; re-read on theme change. */
const useTokens = <K extends string>(names: readonly K[]): Record<K, string> => {
  const { theme } = useApp();
  const read = () => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(`--${n}`).trim()])) as Record<K, string>;
  };
  const [tokens, setTokens] = useState(read);
  useEffect(() => {
    setTokens(read());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTokens(read());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  return tokens;
};

const TOKENS = ["series-1", "grid", "axis", "ink-3", "surface", "good-soft", "warn-soft", "bad-soft"] as const;

/**
 * Single-series line on a 0–100 axis with the health bands shaded behind it.
 * Tooltip + crosshair on hover.
 */
export const HealthLine = ({
  points,
  valueLabel,
  unit = "",
  height = 220,
  showBands = true,
}: {
  points: Array<{ date: number; value: number }>;
  valueLabel: string;
  unit?: string;
  height?: number;
  showBands?: boolean;
}) => {
  const t = useTokens(TOKENS);
  if (points.length === 0) return null;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          {showBands && (
            <>
              <ReferenceArea y1={70} y2={100} fill={t["good-soft"]} fillOpacity={0.6} ifOverflow="hidden" />
              <ReferenceArea y1={40} y2={70} fill={t["warn-soft"]} fillOpacity={0.6} ifOverflow="hidden" />
              <ReferenceArea y1={0} y2={40} fill={t["bad-soft"]} fillOpacity={0.6} ifOverflow="hidden" />
            </>
          )}
          <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="0" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtShortDate}
            stroke={t.axis}
            tick={{ fill: t["ink-3"], fontSize: 11 }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 40, 70, 100]}
            stroke={t.axis}
            tick={{ fill: t["ink-3"], fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: t.axis, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { date: number; value: number };
              return (
                <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-xs shadow-md">
                  <p className="text-ink-3">{fmtDate(p.date)}</p>
                  <p className="mt-0.5 text-ink">
                    {valueLabel}: <strong className="tabular">{p.value}{unit}</strong>
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={t["series-1"]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: t.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Horizontal part-to-whole bar for the health bands; segments are clickable. */
export const BandBar = ({
  healthy,
  atRisk,
  critical,
  onSelect,
}: {
  healthy: number;
  atRisk: number;
  critical: number;
  onSelect?: (band: "healthy" | "at-risk" | "critical") => void;
}) => {
  const total = healthy + atRisk + critical;
  const segs = [
    { key: "critical" as const, label: "Critical", n: critical, color: "var(--bad)", hint: "below 40" },
    { key: "at-risk" as const, label: "At risk", n: atRisk, color: "var(--warn)", hint: "40–69" },
    { key: "healthy" as const, label: "Healthy", n: healthy, color: "var(--good)", hint: "70+" },
  ];
  if (total === 0) return null;
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
        {segs
          .filter((s) => s.n > 0)
          .map((s) => (
            <button
              key={s.key}
              type="button"
              title={`${s.label}: ${s.n}`}
              aria-label={`${s.label}: ${s.n} accounts`}
              onClick={() => onSelect?.(s.key)}
              style={{ width: `${(s.n / total) * 100}%`, background: s.color }}
              className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-80"
            />
          ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {segs.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect?.(s.key)}
            className="rounded-lg px-2 py-1.5 text-left hover:bg-surface-2"
          >
            <span className="flex items-center gap-1.5 text-xs text-ink-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.label} <span className="text-ink-3">({s.hint})</span>
            </span>
            <span className="text-lg font-semibold text-ink">{s.n}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Explains the health score: each factor's 0–100 score, its weight, and the
 * points it contributes, plus adjustments (HS-1, HS-9).
 */
export const HealthBreakdown = ({
  factors,
  adjustments,
  score,
}: {
  factors: HealthFactor[];
  adjustments: HealthAdjustment[];
  score: number;
}) => {
  const sorted = [...factors].sort((a, b) => b.weight - a.weight);
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm">
        {sorted.map((f) => {
          const tone = f.score >= 70 ? "var(--good)" : f.score >= 40 ? "var(--warn)" : "var(--bad)";
          return (
            <div key={f.key} className="contents">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-ink">{f.label}</span>
                  <span className="shrink-0 text-xs text-ink-3">weight {Math.round(f.weight * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-surface-2" role="img" aria-label={`${f.label}: ${f.score} of 100`}>
                  <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: tone }} />
                </div>
              </div>
              <div className="self-end text-right tabular">
                <span className="text-ink">{f.score}</span>
                <span className="text-ink-3">/100</span>
                <span className="ml-2 inline-block w-14 text-ink-2">+{f.weighted} pts</span>
              </div>
            </div>
          );
        })}
      </div>
      {adjustments.length > 0 && (
        <div className="mt-4 border-t border-hairline pt-3">
          <p className="mb-1.5 text-xs font-medium text-ink-2">Adjustments</p>
          <ul className="space-y-1 text-sm">
            {adjustments.map((a) => (
              <li key={a.key + a.points} className="flex justify-between gap-2">
                <span className="text-ink-2">{a.label}</span>
                <span className={`tabular ${a.points < 0 ? "text-bad-ink" : "text-good-ink"}`}>
                  {a.points > 0 ? "+" : ""}
                  {a.points} pts
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 flex justify-between border-t border-hairline pt-3 text-sm">
        <span className="font-medium text-ink">Health score</span>
        <span className="font-semibold tabular text-ink">{score}/100</span>
      </div>
    </div>
  );
};
