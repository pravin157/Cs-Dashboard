const DAY = 86_400_000;

export const fmtDate = (ms: number | null | undefined, withYear = true): string => {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
};

export const fmtShortDate = (ms: number): string =>
  new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export const daysAgo = (ms: number | null | undefined): string => {
  if (!ms) return "never";
  const d = Math.floor((Date.now() - ms) / DAY);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 60) return `${d} days ago`;
  return fmtDate(ms);
};

export const plural = (n: number, word: string, pluralWord = `${word}s`) =>
  `${n} ${n === 1 ? word : pluralWord}`;

export const windowLabel = { DAILY: "today", WEEKLY: "this week", MONTHLY: "this month" } as const;
export const windowShort = { DAILY: "DAU", WEEKLY: "WAU", MONTHLY: "MAU" } as const;
