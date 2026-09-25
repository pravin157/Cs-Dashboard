import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";
import type { EngagementWindow } from "../types";

type Theme = "system" | "light" | "dark";

type AppContextValue = {
  window: EngagementWindow;
  setWindow: (w: EngagementWindow) => void;
  demoMode: boolean;
  asOf: number | null;
  setAsOf: (v: number | null) => void;
  refreshKey: number;
  refresh: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<AppContextValue | null>(null);

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable
  }
};

const initialWindow = (): EngagementWindow => {
  const v = read("cs-v2-window");
  return v === "DAILY" || v === "MONTHLY" ? v : "WEEKLY"; // G-3 default = Weekly
};

const initialTheme = (): Theme => {
  const v = read("cs-v2-theme");
  return v === "light" || v === "dark" ? v : "system";
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [window, setWindowState] = useState<EngagementWindow>(initialWindow);
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [demoMode, setDemoMode] = useState(false);
  const [asOf, setAsOf] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.status().then((s) => setDemoMode(Boolean(s.demoMode))).catch(() => undefined);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Ctx.Provider
      value={{
        window,
        setWindow: (w) => {
          setWindowState(w);
          write("cs-v2-window", w);
        },
        demoMode,
        asOf,
        setAsOf,
        refreshKey,
        refresh: () => setRefreshKey((k) => k + 1),
        theme,
        setTheme: (t) => {
          setThemeState(t);
          write("cs-v2-theme", t);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
};
