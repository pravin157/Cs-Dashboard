import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  AlertOctagon,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  HelpCircle,
  Info,
  Minus,
  PlugZap,
  RefreshCw,
} from "lucide-react";
import type { CsState } from "../types";
import { STATE_LABEL } from "../lib/rules";
import { MODULES, type ModuleId } from "../lib/modules";

const STATE_STYLE: Record<CsState, { chip: string; icon: typeof CheckCircle2; dot: string }> = {
  healthy: { chip: "bg-good-soft text-good-ink", icon: CheckCircle2, dot: "bg-good" },
  watch: { chip: "bg-warn-soft text-warn-ink", icon: Eye, dot: "bg-warn" },
  action: { chip: "bg-bad-soft text-bad-ink", icon: AlertOctagon, dot: "bg-bad" },
};

/** State = icon + label + colour, never colour alone (G-6). */
export const StateChip = ({
  state,
  label,
  size = "sm",
}: {
  state: CsState | null | undefined;
  label?: string;
  size?: "sm" | "xs";
}) => {
  if (!state) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-none-soft px-2 py-0.5 text-xs text-ink-3">
        <Minus className="h-3 w-3" aria-hidden />
        {label ?? "No data"}
      </span>
    );
  }
  const s = STATE_STYLE[state];
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${s.chip} ${
        size === "xs" ? "px-1.5 py-0 text-[11px]" : "px-2 py-0.5 text-xs"
      }`}
    >
      <Icon className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {label ?? STATE_LABEL[state]}
    </span>
  );
};

export const StateDot = ({ state }: { state: CsState | null | undefined }) => (
  <span
    aria-hidden
    className={`inline-block h-2 w-2 shrink-0 rounded-full ${state ? STATE_STYLE[state].dot : "bg-ink-3"}`}
  />
);

/**
 * Trend arrow vs a prior value. `goodWhenUp` decides colour; the arrow
 * direction always shows the raw change.
 */
export const TrendArrow = ({
  current,
  previous,
  goodWhenUp = true,
  suffix = "",
  label = "vs yesterday",
}: {
  current: number | null | undefined;
  previous: number | null | undefined;
  goodWhenUp?: boolean;
  suffix?: string;
  label?: string;
}) => {
  if (current == null || previous == null) return null;
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-ink-3">
        <Minus className="h-3.5 w-3.5" aria-hidden /> no change {label}
      </span>
    );
  }
  const up = delta > 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${good ? "text-good-ink" : "text-bad-ink"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {up ? "+" : ""}
      {delta}
      {suffix} {label}
    </span>
  );
};

/** Open on hover or keyboard focus; the short close delay lets the pointer cross into the popover. */
const useHoverOpen = (closeDelayMs = 150) => {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = () => clearTimeout(timer.current);
  useEffect(() => cancel, []);
  return {
    open,
    show: () => {
      cancel();
      setOpen(true);
    },
    hide: () => {
      cancel();
      timer.current = setTimeout(() => setOpen(false), closeDelayMs);
    },
    close: () => {
      cancel();
      setOpen(false);
    },
  };
};

export const InfoTip = ({ text, rules }: { text: string; rules?: string }) => {
  const { open, show, hide, close } = useHoverOpen();
  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        aria-label="What does this mean?"
        className="text-ink-3 hover:text-ink-2"
        onClick={(e) => {
          e.stopPropagation();
          show();
        }}
        onFocus={show}
        onBlur={close}
        onKeyDown={(e) => e.key === "Escape" && close()}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-5 z-30 w-64 -translate-x-1/2 rounded-lg border border-hairline bg-surface p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink-2 shadow-lg"
        >
          {text}
          {rules && <span className="mt-1.5 block text-[11px] text-ink-3">Spec: {rules}</span>}
        </span>
      )}
    </span>
  );
};

export const Section = ({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={`card p-5 ${className}`}>
    <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </header>
    {children}
  </section>
);

/** Info icon placed beside a page title; hovering or focusing it shows the "About this module" card. */
export const ModuleInfo = ({ id }: { id: ModuleId }) => {
  const m = MODULES[id];
  const { open, show, hide, close } = useHoverOpen();
  const panelId = useId();

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        aria-label={`About ${m.title}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={show}
        onFocus={show}
        onBlur={close}
        onKeyDown={(e) => e.key === "Escape" && close()}
        className={`rounded-full p-1 transition-colors hover:bg-surface-2 hover:text-accent ${
          open ? "text-accent" : "text-ink-3"
        }`}
      >
        <Info className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div
          id={panelId}
          role="tooltip"
          className="card absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] border-l-4 !border-l-[var(--accent)] p-4 text-left text-sm font-normal shadow-lg"
        >
          <p className="flex items-center gap-2 font-medium text-ink">
            <Info className="h-4 w-4 text-accent" aria-hidden />
            About {m.title}
          </p>
          <p className="mt-2 text-ink-2">{m.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-ink-2 marker:text-ink-3">
            {m.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
};

export const NotConnected = ({ what }: { what: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-md bg-none-soft px-2 py-1 text-xs text-ink-3">
    <PlugZap className="h-3.5 w-3.5" aria-hidden />
    {what} not connected yet
  </span>
);

export const Loading = ({ label = "Loading…" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-3">
    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
    {label}
  </div>
);

export const ErrorNote = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="card flex flex-wrap items-center justify-between gap-3 border-l-4 !border-l-[var(--bad)] p-4">
    <div className="flex items-start gap-2 text-sm">
      <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-bad-ink" aria-hidden />
      <div>
        <p className="font-medium text-ink">Couldn't load this page</p>
        <p className="text-ink-2">{message}</p>
      </div>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink hover:bg-surface-2"
      >
        Try again
      </button>
    )}
  </div>
);

export const Empty = ({ title, text }: { title: string; text?: string }) => (
  <div className="py-10 text-center">
    <p className="text-sm font-medium text-ink">{title}</p>
    {text && <p className="mt-1 text-sm text-ink-3">{text}</p>}
  </div>
);

/** A metric tile: label + help, value, state, trend, optional click-through (G-7). */
export const MetricCard = ({
  label,
  help,
  value,
  unit,
  state,
  trend,
  detail,
  onClick,
  notConnected,
}: {
  label: string;
  help?: { text: string; rules: string };
  value: ReactNode;
  unit?: string;
  state?: CsState | null;
  trend?: ReactNode;
  detail?: ReactNode;
  onClick?: () => void;
  notConnected?: string;
}) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`card flex min-h-[132px] flex-col p-4 text-left ${
        onClick ? "cursor-pointer transition-colors hover:border-[var(--ink-3)]" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
          {label}
          {help && <InfoTip text={help.text} rules={help.rules} />}
        </span>
        {state !== undefined && !notConnected && <StateChip state={state} size="xs" />}
      </div>
      {notConnected ? (
        <div className="mt-3">
          <NotConnected what={notConnected} />
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-[28px] font-semibold leading-none text-ink">{value}</span>
            {unit && <span className="text-sm text-ink-3">{unit}</span>}
          </div>
          {trend && <div className="mt-1.5">{trend}</div>}
          {detail && <div className="mt-auto pt-2 text-xs text-ink-2">{detail}</div>}
        </>
      )}
    </Tag>
  );
};
