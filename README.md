# Tournament Tracker

[![CodeFactor](https://www.codefactor.io/repository/github/hiviexd/tournament-tracker/badge)](https://www.codefactor.io/repository/github/hiviexd/tournament-tracker) ![GitHub last commit](https://img.shields.io/github/last-commit/Hiviexd/tournament-tracker) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/Hiviexd/tournament-tracker/deploy-production.yml) ![Uptime Robot ratio (30 days)](https://img.shields.io/uptimerobot/ratio/m798812390-8b85ac6ef54622c9cfbd1301)

The one-stop shop for all official osu! tournament correspondence and information!

## Development

### Prerequisites

- Node v18+
- MongoDB
- [Cloudflare R2 Object Storage bucket](https://www.cloudflare.com/developer-platform/products/r2/) for storing uploaded files (optional)
- yarn
- an osu! API v2 client

### Setup

- Clone the repository
- Set up a MongoDB database
- Set up a Cloudflare R2 bucket (optional)
- Run `yarn`
- Set up `config.json` from `config.example.json` with the following fields:
  - `connection`: MongoDB connection string
  - `session`: session string, can be anything
  - `baseUrl`: base URL of the website
  - `automation`: boolean for whether to run automation jobs or not
  - `osuApp`: credentials for the osu! API v2 client
  - `osuBot`: credentials for the osu! bot API client
  - `discord`: Discord webhook setup
  - `r2`: the Cloudflare R2 bucket's credentials (optional)
- Set up `checklist.json` from `checklist.example.json`
- Run `yarn dev`, the project will be served in `http://localhost:8088`
- If you need automation jobs to run when the project starts, use `yarn dev-automation` instead

### Commit message flags

This is purely for self-documentation purposes.

- `--skip-deploy`: Skip the deployment of the project to production
- `--skip-client-refresh`: Skip the client refresh notification

### References

- [DeepWiki Overview](https://deepwiki.com/Hiviexd/tournament-tracker)

## API

Please refer to the [API documentation](API.md) for more information.
