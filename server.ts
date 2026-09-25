import "dotenv/config";
import express from "express";
import path from "path";
import { demoResponse } from "./server-demo.js";

/**
 * Thin BFF: forwards only the CS_V2_* eventTypes to AECAutopilot
 * `POST /customer-success`, attaching the API key server-side.
 */
const ALLOWED_EVENTS = new Set([
  "CS_V2_GET_PORTFOLIO",
  "CS_V2_GET_ACCOUNT",
  "CS_V2_GET_HEALTH_TREND",
  "CS_V2_GET_RENEWALS",
  "CS_V2_LOG_TOUCHPOINT",
  "CS_V2_GET_TOUCHPOINTS",
  "CS_V2_GET_SETTINGS",
  "CS_V2_UPDATE_SETTINGS",
  "CS_V2_RUN_SNAPSHOT",
]);

const endpoint = (process.env.AECAUTOPILOT_ENDPOINT || "").trim().replace(/\/+$/, "");
const apiKey = (process.env.AECAUTOPILOT_APIKEY || "").trim();
const demoMode = process.env.CS_V2_DEMO === "true";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/status", (_req, res) => {
  res.json({ demoMode, configured: Boolean(endpoint && apiKey) });
});

app.post("/api/cs", async (req, res) => {
  const eventType = String(req.body?.eventType ?? "");
  if (!ALLOWED_EVENTS.has(eventType)) {
    res.status(400).json({ code: "INVALID_REQUEST", message: "Unsupported eventType." });
    return;
  }

  if (demoMode) {
    const out = demoResponse(req.body);
    res.status(out.status).json(out.body);
    return;
  }

  if (!endpoint || !apiKey) {
    res.status(503).json({
      code: "NOT_CONFIGURED",
      message:
        "AECAUTOPILOT_ENDPOINT and AECAUTOPILOT_APIKEY must be set in .env (or set CS_V2_DEMO=true for sample data).",
    });
    return;
  }

  try {
    const upstream = await fetch(`${endpoint}/customer-success`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify(req.body),
    });
    const text = await upstream.text();
    res.status(upstream.status).type("application/json").send(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ code: "UPSTREAM_UNREACHABLE", message });
  }
});

const PORT = Number(process.env.PORT) || 3100;

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  (async () => {
    const { createServer } = await import("vite");
    const server = app.listen(PORT, () =>
      console.log(`CS dashboard v2 on http://localhost:${PORT}${demoMode ? " (demo data)" : ""}`),
    );
    // Run Vite's live-reload websocket on the same HTTP server (middleware mode has none of its own).
    const vite = await createServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  })();
} else if (!process.env.VERCEL) {
  const dist = path.join(process.cwd(), "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  app.listen(PORT, () => console.log(`CS dashboard v2 on port ${PORT}`));
}

export default app;
