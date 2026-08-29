# Prime Sources Hatties farmOS pilot

This package runs an isolated farmOS records engine for the Masaphokati Agriculture OS pilot.

## Safety boundary

- Do not connect this deployment to Siyabusa or another product database.
- Do not expose port 8080 directly to the public internet.
- Terminate HTTPS in a managed ingress/reverse proxy and forward privately to `127.0.0.1:8080`.
- Store the real database password and farmOS OAuth credentials in the host/deployment secret manager.
- Back up all three named volumes before upgrades.

## Version baseline

- farmOS `3.5.5`
- PostgreSQL `17`

The farmOS version is pinned so an upstream release cannot silently change the pilot. Upgrade only after backup and adapter tests.

## Start

1. Copy `.env.example` to `.env` on the host.
2. Replace the database password with a long generated value.
3. Run `docker compose --env-file .env -f compose.yml config`.
4. Run `docker compose --env-file .env -f compose.yml up -d`.
5. Complete the farmOS web installer through the HTTPS pilot URL.
6. Select PostgreSQL and use host `db`, port `5432`, and the values from `.env`.
7. Create a dedicated OAuth client/service account for Masaphokati.
8. Put its URL and access token into the Masaphokati backend secrets as `FARMOS_BASE_URL` and `FARMOS_ACCESS_TOKEN`.

## Pilot records

Create these records after installation:

- Organisation: Prime Sources
- Farm: Prime Sources — Hatties Pilot Farm
- Location: Mankayane, Manzini, Eswatini
- Land asset: Vegetable Block A1, 1.2 ha
- Plant asset/crop cycle: Cabbage, growing
- Equipment assets: irrigation pump, pressure sensor and flow meter

All sizes and device thresholds remain demonstration assumptions until approved from real farm evidence.
