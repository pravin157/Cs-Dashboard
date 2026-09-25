import { useEffect } from "react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import type { EngagementWindow, Portfolio } from "../types";
import { useAsync } from "./useAsync";

// Pages share one in-flight/cached portfolio per (window, trendDays, refresh) so
// switching pages doesn't re-run the heavy backend query.
const cache = new Map<string, Promise<Portfolio>>();

const load = (window: EngagementWindow, trendDays: number | undefined, refreshKey: number) => {
  const key = `${window}|${trendDays ?? ""}|${refreshKey}`;
  let p = cache.get(key);
  if (!p) {
    p = api.portfolio(window, trendDays);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
};

export const usePortfolio = (trendDays?: number) => {
  const { window, refreshKey, setAsOf } = useApp();
  const state = useAsync(() => load(window, trendDays, refreshKey), [window, trendDays, refreshKey]);
  useEffect(() => {
    if (state.data) setAsOf(state.data.asOf);
  }, [state.data, setAsOf]);
  return state;
};
