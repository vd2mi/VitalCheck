# VitalCheck

Connected care platform for patients and doctors built on React, Firebase, and Cloud Functions.

## Overview

- **Frontend**: Vite + React + TypeScript, Tailwind CSS, React Router, Vitest, ESLint & Prettier.
- **Backend**: Firebase Auth, Firestore, Cloud Functions (TypeScript), nodemailer for transactional email.
- **Infrastructure**: Vercel for frontend hosting, Firebase for backend. Optional Dockerfile for local emulation.
- **Testing & CI**: Vitest suites for UI and functions, GitHub Actions pipelines, npm scripts for lint/test/coverage.

![Patient dashboard](https://via.placeholder.com/1200x720?text=VitalCheck+Patient+Dashboard)
![Doctor inbox](https://via.placeholder.com/1200x720?text=VitalCheck+Doctor+Inbox)

## Repository layout

```
vitalcheck/
├─ frontend/         # Vite React app (src/pages, components, services, tests)
├─ functions/        # Firebase Cloud Functions (onAppointmentCreate, sendDailyReminders)
├─ docs/             # README, OpenAPI spec, seed data
├─ scripts/          # Firestore seed loader
├─ firebase.json     # Emulator + deploy config
├─ firestore.rules   # Security rules
├─ Dockerfile        # Optional local emulation container
└─ .github/workflows # CI pipelines (see below)
```

## Prerequisites

- Node.js ≥ 20.16 (recommended ≥ 20.19 for stricter engine requirements)
- npm ≥ 10
- Firebase CLI (`npm install -g firebase-tools`)
- Vercel CLI (`npm install -g vercel`) for production deploys
- Google Cloud project with Firestore + Auth enabled

## Installation

```bash
cd vitalcheck
npm install           # installs root dev deps + workspaces
npm install --workspace frontend
npm install --workspace functions
```

## Environment variables

### Frontend (`frontend/.env`)

```
VITE_FIREBASE_API_KEY=<firebase_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project>
VITE_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
VITE_FIREBASE_APP_ID=<app_id>
```

### Cloud Functions

Secrets are stored via `firebase functions:secrets:set`, but for local development you can load them from `.env`:

```
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=supersecret
MAIL_FROM="VitalCheck <no-reply@vitalcheck.app>"
```

Alternatively, set them as Firebase secrets:

```bash
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set MAIL_FROM
```

## One-command local development

```bash
npm run dev
```

This starts Vite on port 5173 and the Firebase emulator suite (Firestore + Functions + Emulator UI). Visit:

- Frontend: http://localhost:5173
- Emulator UI: http://localhost:4000

### Manual commands

```bash
npm run dev --workspace frontend           # Vite only
firebase emulators:start                   # Backend only
```

## Tests & linting

```bash
npm run lint        # frontend + functions linters
npm run test        # frontend unit tests + functions vitest suite
npm run test:ci     # frontend coverage + functions tests
```

## Seeding Firestore

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
node scripts/seed.js
```

`docs/SEED_DATA.json` includes demo users (`patient-demo`, `doctor-demo`) with vitals, meds, appointments, and notifications.

## Deployment

### Frontend (Vercel)

1. `cd frontend`
2. `vercel link` (once) and configure env vars via `vercel env add`
3. `npm run build`
4. `vercel --prod`

Include `vercel.json` (see repo root) with framework defaults.

### Backend (Firebase)

```bash
firebase login
firebase use <project-id>
firebase deploy --only functions,firestore
```

Ensure secrets are configured (see above). Firestore rules and indexes deploy alongside functions.

## CI/CD

- `.github/workflows/ci.yml`: runs lint + tests on pull requests.
- `.github/workflows/deploy.yml`: example pipeline for tagged releases using Vercel + `firebase deploy`.

Configure GitHub secrets:

| Secret | Description |
| ------ | ----------- |
| `FIREBASE_TOKEN` | `firebase login:ci` token for deploying functions/rules |
| `VERCEL_TOKEN` | Personal token for Vercel deployments |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Provided by Vercel |

## Security highlights

- Firestore rules enforce role-based access (`rules_version = '2'`, see `firestore.rules`).
- Auth roles stored in `users/{uid}`; `ProtectedRoute` guards client routes.
- Secrets kept in Firebase Secret Manager or Vercel project env, never committed.
- Client validation ensures vitals ranges and appointment scheduling rules.

## Accessibility

- Semantic HTML, labelled inputs, focus-visible styles.
- Tailwind with forms plugin for consistent accessible form controls.
- Keyboard-friendly navigation and status messaging (`aria-live` usage in components).

## Monitoring & logging

- Cloud Functions use `logger` for structured logs.
- Appointment creation logs when payload is missing.
- Scheduled reminders log summary counts for observability.

## Video demo script (2–3 minutes)

1. **Intro (15s)** – Introduce VitalCheck, highlight patient/doctor roles.
2. **Patient flow (60s)** – Log in as `patient@example.com`, show vitals form validation, log a symptom, add medication, review reminders.
3. **Appointment request (30s)** – Request appointment with doctor, highlight past-date prevention + conflict check.
4. **Doctor flow (45s)** – Switch to doctor demo account, show appointment inbox, approve request, search patient.
5. **Notifications & functions (20s)** – Mention automated email + notification doc, scheduled reminders, CI pipeline, deployment commands.
6. **Wrap-up (10s)** – Summarize security (Firestore rules/secrets) and next steps.

## Additional resources

- API spec: `docs/OPENAPI.yaml`
- Seed data: `docs/SEED_DATA.json`
- Docker: `docker build -t vitalcheck . && docker run --rm -p 5173:5173 -p 5001:5001 -p 8080:8080 -p 4000:4000 vitalcheck`

## Support & future work

- Extend scheduled reminders to include push notifications.
- Add doctor-admin dashboard for patient onboarding.
- Integrate audit logs via BigQuery export.

