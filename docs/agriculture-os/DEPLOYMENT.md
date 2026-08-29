# Masaphokati Agriculture OS deployment

## Target topology

- **Vercel:** React/Vite web application in `frontend/`.
- **Render:** long-running Express API, Socket.IO connections, and Redis-backed work.
- **PostgreSQL:** use the approved existing database through `DATABASE_URL`; the Blueprint deliberately does not create a duplicate database.
- **SenseIT, FleetSA, Siyabusa:** connect through server-side adapters and signed webhooks. Their credentials must never be exposed through `VITE_*` variables.

## Vercel project settings

Set the project Root Directory to `frontend`. The repository includes `frontend/vercel.json` for the production build and SPA routing.

After the Render preview API exists, configure:

- `VITE_API_URL=https://<render-api-host>`
- `VITE_WS_URL=https://<render-api-host>`

## Render Blueprint settings

The root `render.yaml` creates a preview API and Key Value service. During Blueprint creation, provide:

- `DATABASE_URL`
- `CORS_ORIGIN` as the exact Vercel preview/production origins, comma separated

Render generates `JWT_SECRET` and `MIGRATION_ADMIN_SECRET`.

The initial Blueprint uses free preview plans. Select production-grade plans before putting live farm telemetry or operational workloads on the system.

## Go-live gate

Do not mark a signal as **Measured** until its adapter passes device identity, timestamp freshness, unit, range, and duplicate-event checks. Until then it remains **Demo**, **Calculated**, or **Forecast** in the UI.
