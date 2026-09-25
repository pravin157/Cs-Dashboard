# IntoAEC Customer Success: Dashboard v2

A new CS dashboard built to `CS_Dashboard_Card_Rules.md`. It runs separately from `customer-success-dashboard-final`, and the old dashboard keeps working unchanged.

## What's different from v1

| | v1 | v2 |
|---|---|---|
| Data | Most spec metrics were generated from the org ID (mock) | Real data from AECAutopilot, Leadmanager and Paymaster; missing sources say **"not connected"** |
| Health score | Backend score overwritten in the proxy | Spec HS-1…HS-10 computed in the backend, with the 7-factor breakdown shown |
| Layout | One long page + modal | Sidebar with pages: **Today, Portfolio, Accounts, Account, Renewals, Adoption, Settings** |
| Day/Week/Month | Only relabelled a column | Re-queries every page (G-3) |
| Cards | 6, some not clickable | 12 portfolio cards; each opens the filtered account list (G-7) |
| Next steps | 1 generic line | Rule-driven action list per account and a **Today** inbox, each with the rule ID and the reason |

## Pages

- **Today**: everything that needs attention, grouped into Act today / This week / When you can / Growth ideas.
- **Portfolio**: average health, health bands, the spec cards with trend arrows, and 30/60/90-day health and engagement trends.
- **Accounts**: the account list, lowest health first, with filter chips (need focus, inactive, alerts, no projects, renewing ≤90d, churn, low seats…), search and sort.
- **Account**: the health score with an explanation of why, history, what to do next, projects, renewal, seats, churn signals, exec relationship (with a log form), onboarding, core modules, features, alerts and people.
- **Renewals**: accounts renewing in 30/60/90/180 days, in Act now / Watch / On track columns.
- **Adoption**: who uses BOQ / Procurement / Schedule and the four tracked features, and who doesn't.
- **Settings**: inactive threshold (IR-5), stalled-project days, and "run snapshot now".

## Run locally

```bash
npm install
cp .env.example .env    # set AECAUTOPILOT_ENDPOINT and AECAUTOPILOT_APIKEY
npm run dev             # http://localhost:3100
```

**Before the backend changes are deployed**, set `CS_V2_DEMO=true` in `.env` to browse the UI with sample accounts. A yellow "Demo data" banner is shown whenever this is on.

Other scripts: `npm run lint` (type-check), `npm run build` then `npm start`.

## Backend it needs

The browser only talks to `server.ts`, which forwards an allow-list of `CS_V2_*` eventTypes to AECAutopilot `POST /customer-success`. The API key is added on the server side.

| eventType | Used by |
|---|---|
| `CS_V2_GET_PORTFOLIO` | Today, Portfolio, Accounts, Adoption |
| `CS_V2_GET_ACCOUNT` | Account page |
| `CS_V2_GET_RENEWALS` | Renewals |
| `CS_V2_GET_HEALTH_TREND` | trend data (also included in the portfolio response) |
| `CS_V2_LOG_TOUCHPOINT` / `CS_V2_GET_TOUCHPOINTS` | Relationship log (EE-1) |
| `CS_V2_GET_SETTINGS` / `CS_V2_UPDATE_SETTINGS` | Settings |
| `CS_V2_RUN_SNAPSHOT` | Settings → Run snapshot now |

These are **new, additive** changes on branch `feature/cs-dashboard-v2` in `AECAutopilot`, plus one new `GET_CS_PROJECT_STATS` eventType in `Leadmanager`. No existing eventType, table or job was changed. To deploy:

1. Run the migration `1788000000000-cs-dashboard-v2-tables` (creates `cs_health_snapshot_v2`, `cs_account_touchpoint`, `cs_settings`).
2. Deploy AECAutopilot and Leadmanager. AECAutopilot needs `LEADMANAGER_ENDPOINT` and `PAYMASTER_ENDPOINT` set; both are already used elsewhere.
3. Open **Settings → Run snapshot now** once. After that it runs daily at 02:00 UTC.

## Data sources

- **Renewal date, licensed seats, plan, active status**: Paymaster (`GET_ORG_SUBSCRIPTIONS_BY_BILLING_TYPE`), with `subscriptionValidTill` as the renewal date. The live subscription is read on every load, so an extended subscription shows immediately.
- **Paid org list**: Paymaster `POST /subscriptions` `GET_ALL_IN_ONE_PLAN_ORGANIZATIONS`.

## Known gaps

- **Support tickets, CSAT, NPS**: no Freshdesk/Zoho sync exists yet, so they show "not connected" and churn signal CR-1(c) is skipped.
- **2D Takeoff** only counts as used once the takeoff service writes activity-log events.
- **Colour bands** are blank in the spec. The defaults (70/40, etc.) are defined in one place: `AECAutopilot/src/application/customer-success/v2/health-score-v2.ts`.
