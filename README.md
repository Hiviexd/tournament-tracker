# Tournament Tracker

[![CodeFactor](https://www.codefactor.io/repository/github/hiviexd/tournament-tracker/badge)](https://www.codefactor.io/repository/github/hiviexd/tournament-tracker)

The one-stop shop for all official osu! tournament correspondence and information!

> [!WARNING]
> This project is currently in active development and is not yet ready for production use.

## Development

### Prerequisites

- Node v18+
- MongoDB
- yarn
- an osu! API v2 client

### Setup

- Clone the repository
- Set up a MongoDB database
- Run `yarn`
- Set up `config.json` from `config.example.json` with the following fields:
  - `connection`: MongoDB connection string
  - `session`: session string, can be anything
  - `osuApp.id`: osu! API v2 client ID
  - `osuApp.secret`: osu! API v2 client secret
  - `osuApp.redirect`: osu! API v2 redirect URI, should be kept as `http://localhost:8088/api/auth/callback`
- Run `yarn dev`, the project will be served in `http://localhost:8088`
