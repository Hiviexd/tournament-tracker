# Tournament Tracker

The one-stop shop for all official osu! tournament correspondence and information.

> [!WARNING]
> This project is currently in an extremely WIP stage (only the backend is (barely) functional)

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
  - `devs`: array of osu! user IDs who should have extra developer permissions (currently unused)
- Run `yarn dev`, the project will be served in `http://localhost:8088`
