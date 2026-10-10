# MailRakshak · Analyst dashboard (SIH26106)

React + Vite + Tailwind. Talks to the real MailRakshak backend (no demo data).

## Run

```bash
npm install
cp .env.example .env     # set VITE_API_BASE_URL to your backend, e.g. /api (proxied to https://sih26106.onrender.com)
npm run dev              # http://localhost:5173
```


## Connect the real backend

Set in `.env`:

```
VITE_API_BASE_URL=/api (proxied to https://sih26106.onrender.com)
```

`src/services/api.js` calls `GET /api/cases` and `GET /api/cases/:id` with `Authorization: Bearer <localStorage.token>`.
The list is polled every `VITE_POLL_MS` (default 8s); a case that appears after first load with
`overall_risk_score >= 80` raises the alert banner.

### Fields the UI reads (from `case.schema.json`)

| UI | Field |
| --- | --- |
| Subject, sender, domain | `email.subject`, `email.sender`, `email.domain` (add this block to the schema if it is not there yet) |
| Risk badge | `overall_risk_score` (0-100: 80+ critical, 60+ high, 40+ medium) |
| Fraud score | `detection.confidence_score` (0-1, probability the email is malicious) |
| Auth checks | `forensics.spf_result`, `dkim_result`, `dmarc_result` (`pass`, `fail`, `softfail`, `neutral`, `none`) |
| Timeline | `received_at`, `detection.processed_at`, `forensics.processed_at`, `enrichment.processed_at`, `correlated_at` |
| Trace | `forensics.relay_path[{hop, server, timestamp}]`, `enrichment.geolocation{ip, city, country, lat, lng, isp}` |
| Campaigns | `campaign_id` (grouped client-side) |

## Where things live

```
src/
  components/LiveBackground.jsx   animated network canvas, grid, glows, scan line
  components/Timeline.jsx         5-stage pipeline timing
  components/TraceMap.jsx         Leaflet map + Recharts hop delays
  components/CaseList.jsx, AlertBanner.jsx, ScoreGauge.jsx, AuthChecks.jsx, IndicatorChips.jsx
  pages/Dashboard.jsx, CaseDetail.jsx, Campaigns.jsx
  context/CasesContext.jsx        polling + alert detection
  services/api.js, data/mockCases.js
```

Map tiles load from OpenStreetMap over the internet (no API key needed), so the trace map needs a connection. The recipient pin is set in `TraceMap.jsx` (`RECIPIENT`).
**Analyze email page** (`/upload`): drag in an `.eml`; it is sent to `POST /api/emails/analyze` as multipart form data (field name `file`) and the page opens the returned case. If your Multer field name differs, change it in `analyzeEmail()` in `src/services/api.js`. In demo mode the result comes from a simple keyword scorer, not the real ML engine.

**Landing page** (`/`): public page that explains MailRakshak, its core features, the five-stage pipeline, the evidence layer and the three portals. Edit the copy at the top of `src/pages/Landing.jsx` (`FEATURES`, `STEPS`, `ROLES`). The analyst console now lives at `/dashboard`.

**Sign-in** (`/login`): Reporter (email + 6-digit code), Analyst and Admin (email + password). Reporters can only use the Analyze email page and get a plain-language verdict; analysts and admins get the full console. Endpoints are assumed to be `POST /api/auth/login`, `/api/auth/request-code` and `/api/auth/verify-code`; change them in `src/services/api.js` to match `auth.routes.js`. A 401 from any call signs the user out. In demo mode any email/password works and the reporter code is `123456`.

The Confirm Threat action and report export belong to Role 6 and are not in this folder.


## Backend wiring (real contract)

Set `VITE_API_BASE_URL=/api (proxied to https://sih26106.onrender.com)`. All calls live in `src/services/api.js`;
`src/lib/caseAdapter.js` converts the backend Case document (`_id`, `createdAt`, `channel`, `forensics.spf.status`,
0-100 `confidence_score`, ...) into the shape the UI reads, so no component needed changes.

| UI action | Route |
| --- | --- |
| Case list / detail | `GET /api/cases`, `GET /api/cases/:id` |
| Analyze email | `POST /api/emails/submit` (JSON `rawEmail`, `sender`, `recipients`, `subject`, `source`) |
| Staff sign-in | `POST /api/auth/login` then `/api/auth/verify-otp` or `/api/auth/set-initial-password` |
| Reporter sign-in | `POST /api/reporters/login` (or `/signup`) then `/api/reporters/verify-otp` |

Login.jsx handles the staff OTP / first-login password steps and reporter sign-up (name + phone) when no account exists.

Password reset: staff use "Forgot your password?" on the sign-in screen; the emailed link should point at `<your frontend>/reset-password` (set `PASSWORD_RESET_URL` on the backend). Admins can assign analysts from the case page.

## Sharing through ngrok

Stable option (recommended): `npm run share`, then in a second terminal `ngrok http 4173`.
Quick option: `npm run dev`, then `ngrok http 5173`.
Open the https URL ngrok prints. The first visit shows ngrok's "Visit Site" notice; click it once.
The URL changes every time ngrok restarts (free plan). If the backend emails reset links, set its
PASSWORD_RESET_URL to `<ngrok URL>/reset-password`.
