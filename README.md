# [Tournament Tracker](https://tcomm.hivie.tn/)

[![CodeFactor](https://www.codefactor.io/repository/github/hiviexd/tournament-tracker/badge)](https://www.codefactor.io/repository/github/hiviexd/tournament-tracker) ![GitHub last commit](https://img.shields.io/github/last-commit/Hiviexd/tournament-tracker) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/Hiviexd/tournament-tracker/deploy-production.yml) [![Uptime Kuma ratio (30 days)](https://status.hivie.tn/api/badge/1/uptime/168?label=uptime%20(30d))](https://status.hivie.tn/status)

The one-stop shop for all official osu! tournament correspondence and information!

## API Usage

Please refer to the [API documentation](https://tcomm.hivie.tn/api/docs) for more information.

For a guide on how to use the Mappool Compliance API in your mappooling sheets, consult [this wiki article](https://github.com/Hiviexd/tournament-tracker/wiki/Compliance-API-Example-Usage).

## Development

### Prerequisites

- Node v22 (LTS)
- pnpm
- MongoDB
- [Cloudflare R2 Object Storage bucket](https://www.cloudflare.com/developer-platform/products/r2/) for storing uploaded files (optional)
- an osu! API v2 client

### Setup

- Clone the repository
- Set up a MongoDB database
- Set up a Cloudflare R2 bucket (optional)
- Run `pnpm install`
- This is a pnpm monorepo (`apps/client`, `apps/server`, `packages/*`)
- Set up `config.json` from `config.example.json` with the following fields:
  - `connection`: MongoDB connection URL
  - `session`: session string, grab a random string from [this website](https://www.random.org/strings/?num=10&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new)
  - `baseUrl`: base URL of the website
  - `automation`: boolean for whether to run automation jobs or not
  - `osuApp`: credentials for the osu! API v2 client
  - `osuBot`: credentials for the osu! bot API client (`allowUserMessages` sends announcements to real users; defaults to `false`, which uses the actor as a fallback recipient)
  - `discord`: Discord webhook setup
  - `r2`: the Cloudflare R2 bucket's credentials (optional)
  - `complianceApi`: the [Mappool Compliance API](https://github.com/hburn7/omc-api)'s credentials (optional)
- Run `pnpm dev`, the project will be served in `http://localhost:8088`

### Docker (production / preview)

Production and preview run via Docker Compose (server API + nginx static client + nginx gateway). Local development stays on `pnpm dev`.

**Local prod-style stack** (requires Docker and `config.json` at the repo root):

```bash
pnpm docker:prod          # gateway on http://localhost:8088
pnpm docker:prod:down
pnpm docker:preview       # gateway on http://localhost:8089
pnpm docker:preview:down
```

**VPS deploy** (GitHub Actions → GHCR → `docker compose pull/up`):

- Production: push to `main` (or workflow_dispatch) — see `.github/workflows/deploy-production.yml`
- Preview: push to `preview` / `preview/*` — see `.github/workflows/deploy-preview.yml`
- Keep `config.json` on the VPS deploy path (bind-mounted into the server container; not baked into images)
- Image refs for restarts are written to `.images.env` on the VPS

### Automation jobs

If you need automation jobs to run when the project starts, use `pnpm dev:automation`. Pass a job name to run only that job immediately (`pnpm dev:automation PendingSanctionReminder`); omit it to run all jobs.

For documentation on how to create a new automation job, see the [jobs README](https://github.com/Hiviexd/tournament-tracker/blob/main/apps/server/jobs/README.md) page.

### Migrations

For running a specific migration, run `pnpm migrate -- <migration-name>`. You can list all available migrations by running `pnpm migrate`.

For documentation on how to create a new migration, see the [migrations README](https://github.com/Hiviexd/tournament-tracker/blob/main/apps/server/migrations/README.md) page.

### Commit message flags

This is purely for self-documentation purposes.

- `--skip-deploy`: Skip the deployment of the project to production
- `--skip-client-refresh`: Skip the client refresh notification

### References

- [DeepWiki Overview](https://deepwiki.com/Hiviexd/tournament-tracker)
