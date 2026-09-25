import { useEffect, useState, type DependencyList } from "react";

/** Minimal data hook: re-runs whenever deps change (e.g. the Day/Week/Month toggle). */
export const useAsync = <T>(fn: () => Promise<T>, deps: DependencyList) => {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setState((s) => ({
          data: s.data,
          error: err instanceof Error ? err.message : String(err),
          loading: false,
        }));
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
};
