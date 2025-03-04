# Tournament Tracker

[![CodeFactor](https://www.codefactor.io/repository/github/hiviexd/tournament-tracker/badge)](https://www.codefactor.io/repository/github/hiviexd/tournament-tracker)

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
- Run `yarn dev`, the project will be served in `http://localhost:8088`
- If you need automation jobs to run when the project starts, use `yarn dev-automation` instead
