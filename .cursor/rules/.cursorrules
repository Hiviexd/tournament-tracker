# Tournament Tracker Project Context

## Overview

Tournament Tracker is a full-stack application for managing osu! tournaments, badge reviews, voting, support tickets, and community resources. It integrates with the osu! API for user/game data and Discord for notifications. The system is modular, extensible, and built for both committee and community use.

---

## System Architecture

### High-Level Design

- **Client-server architecture**: React frontend, Express.js backend.
- **Core domain entities**: Tournaments, Votes, Tickets/Reports, Users, Resources, Articles, Quotes, Logs.
- **Database**: MongoDB (with Mongoose ODM).
- **File storage**: Local or cloud (Cloudflare R2 supported).
- **External integrations**: osu! API (user/game data), Discord (notifications/webhooks).

---

## Frontend Architecture

### Technologies

- **React** (UI library)
- **React Router** (client-side routing)
- **Jotai** (global state management)
- **React Query** (API state, caching, mutations)
- **Mantine** (UI component library)
- **FontAwesome** (icons)
- **React Markdown** (markdown rendering)

### Component Organization

- **Pages**: Located in `src/pages/`, named `{Feature}Page.tsx`. Each page represents a major route (e.g., `TournamentsListPage`, `VotingDetailsPage`).
- **Feature components**: Grouped by domain in `src/components/{feature}/` (e.g., `tournaments`, `tickets`, `votings`, `users`, `compliance`, `resources`, `previewer`, `logs`).
- **Common components**: Shared UI in `src/components/common/`.
- **Props**: All components use strongly-typed props interfaces, defined above the component.
- **Export style**: Always use `export default function`.

### Styles

- **Mantine** is the default for UI.
- **Custom SCSS**: All custom styles are in `src/sass/components/`, named after the component (e.g., `TournamentCard.scss`).
- **Importing styles**: Custom styles are imported into `src/sass/app.scss` (never directly in the component).

### State Management

- **Global state**: Managed with Jotai atoms in `src/store/atoms.ts` (e.g., `loggedInUserAtom`, `tournamentViewModeAtom`).
- **Local state**: Managed with React hooks.
- **API state**: Managed with React Query, using custom hooks for each domain (e.g., `useTournaments`, `useTickets`, `useVotings`, `useUsers`).
- **Preferences**: UI preferences (e.g., view mode) are persisted and loaded via hooks.

### API Integration

- **API abstraction**: All API calls use `utils.apiCall` called in their respective hooks for consistent request/response handling.
- **Hooks**: Each domain has a dedicated hook file in `src/hooks/` (e.g., `useTournaments.ts`, `useTickets.ts`).
- **Error handling**: All mutations use `utils.handleMutationResponse` for notification and error display.
- **File uploads**: Supported via FormData in hooks (e.g., badge uploads, ticket attachments).
- **File downloads**: Handled in hooks with blob responses and dynamic download links.
- **Type safety**: All requests and responses are strongly typed.

### Routing

- **React Router**: All routes are defined in `src/base/routes.config.tsx`.
- **Protected routes**: Permissions are enforced at the route level (e.g., committee-only pages).
- **Layout**: Consistent page structure with shared header/footer/navigation.
- **Dynamic routes**: Used for details pages (e.g., `/tournaments/:tournamentId`).

### Constants

- **Centralized**: All UI and logic constants are in `src/constants/index.ts` (e.g., voting presets, badge options, review checklists).

---

## Backend Architecture

### Technologies

- **Express.js** (web framework)
- **MongoDB** (database)
- **Mongoose** (ODM)
- **Express Session** (session management)
- **Multer** (file uploads)
- **Axios** (HTTP client for external APIs)

### API Endpoints

- **RESTful**: Each domain has its own router (e.g., `/api/tournaments`, `/api/votes`, `/api/tickets`, `/api/users`, `/api/resources`, `/api/articles`, `/api/quotes`, `/api/logs`, `/api/beatmaps`).
- **Consistent response format**: All endpoints return JSON with clear error/success messages.
- **404 and error handling**: All unknown API routes return a JSON error; global error handler for exceptions.

### Controller Pattern

- **Controllers**: Each domain has a controller in `server/controllers/` (e.g., `TournamentsController`, `VotingsController`).
- **Services**: Business logic is separated into services in `server/services/` (e.g., `TournamentService`, `VotingService`, `AutomationService`, `OsuApiService`, `DiscordService`).
- **Models**: Mongoose schemas in `server/models/`, with TypeScript interfaces (that are shared with the frontend) in `/interfaces`.

### Middleware

- **Authentication/authorization**: Session-based, with role checks for protected endpoints.
- **Rate limiting**: Prevents abuse of sensitive endpoints.
- **Request logging**: All requests are logged for audit and debugging.
- **File upload handling**: Multer-based, with validation and storage management.
- **SEO/crawler handling**: Custom middleware for search engine optimization.

### Database Models

- **Entities**: Tournaments, Users, Votes, Tickets, Resources, Articles, Quotes, Logs, Attachments, Reviews, Messages.
- **Relationships**: References between models (e.g., tournament reviewers, ticket messages).
- **Virtuals**: Computed fields for display and logic.
- **Timestamps**: All models track creation and update times.

### Automation and Integrations

- **osu! API**: Used for user verification, beatmap compliance, and data enrichment.
- **Discord**: Webhook integration for notifications and announcements.
- **AutomationService**: Handles scheduled jobs and background tasks.
- **MigrationService**: For data migrations and legacy import.

### Constants

- **Backend constants**: In `server/constants/` (e.g., SEO config, webhook colors, tournament CSV).

---

## Code Style and Patterns

### TypeScript

- **Interface-first**: All data structures are defined as interfaces in `/interfaces`, prefixed with `I`.
- **Strong typing**: All functions, components, and API calls are fully typed.
- **Consistent naming**: Use `{Feature}{Type}` for components and interfaces.

### Components

- **Functional components**: All React components are functional and typed.
- **Props interfaces**: Defined above the component.
- **Naming**: `{Feature}{Type}` (e.g., `TournamentCard`, `VotingTable`).
- **Mantine**: Used for all UI, with custom styles as needed.

### API

- **Consistent endpoint structure**: RESTful, grouped by domain.
- **Type-safe**: All requests and responses are typed.
- **Error handling**: All errors are surfaced to the frontend and displayed via notifications.
- **File upload/download**: Supported in both frontend and backend.

### Forms

- **Mantine form components**: Used for all forms.
- **Validation**: All forms have validation logic.
- **Auto-save**: Some forms support auto-save via hooks.
- **Loading states**: All forms and actions display loading indicators.

---

## Features

### Authentication

- **osu! OAuth**: Used for login and user verification.
- **Session management**: Express session with MongoDB store.
- **Role-based access control**: Roles include Anonymous, User, Committee, Administrator. Permissions are enforced at both API and route level.

### User Management

- **Roles**: Committee (TC/CC), Alumni, Admin, User.
- **Badge system**: Track and manage user badges.
- **Activity tracking**: User actions are logged and auditable.

### Tournament Management

- **Registration**: Create and manage tournaments.
- **Badge review**: Submit and track badge requests.
- **Reviewer assignment**: Assign and reassign reviewers.
- **Mappool compliance**: Validate beatmaps for tournament use.

### Voting System

- **Vote creation**: Committee can create votes for decisions.
- **Vote participation**: Users and committee can participate as permitted.
- **Vote presets**: Binary and variable voting options, with durations and custom options.
- **Result visibility**: Public/private toggling for votes.

### Ticket and Report System

- **Support tickets**: Users can submit tickets for help or issues.
- **Reports**: Users can report issues or misconduct.
- **Threaded messages**: Tickets support threaded communication.
- **Status management**: Tickets can be opened/closed/toggled.

### Content and Asset Management

- **Articles**: Documentation and guides managed via articles.
- **Resources**: Official and community resources, with upload/download support.
- **Quotes**: Community quote management.
- **Logs**: System and user activity logs, accessible to committee.

### Notifications

- **Success/error notifications**: All actions provide user feedback.
- **Discord webhooks**: Key events are announced in Discord.
- **System logging**: All actions are logged for audit.

---

## UI/UX Patterns

- **Consistent layout**: Shared header, footer, and navigation.
- **Responsive design**: All pages are mobile-friendly.
- **Badge components**: Visual indicators for user roles and achievements.
- **Loading and error states**: All async actions provide feedback.
- **Table and card layouts**: Used for lists and overviews.

---

## Development Workflow

### Feature Implementation

1. Define interfaces in `/interfaces`.
2. Create/update Mongoose models in `server/models/`.
3. Add/extend API endpoints in `server/routers/` and `server/controllers/`.
4. Implement business logic in `server/services/`.
5. Create/update frontend hooks in `src/hooks/`.
6. Build or update components in `src/components/` and pages in `src/pages/`.
7. Add/modify routes in `src/base/routes.config.tsx`.
8. Implement error handling and notifications.
9. Add logging and Discord notifications as needed.

### Console Commands

- Use `yarn` for all dependency management and scripts.
- Key scripts:
  - `yarn dev`: Start client and server in development mode.
  - `yarn build`: Build the client and server.
  - `yarn build-client`: Build the client only.
  - `yarn build-server`: Build the server only.
  - `yarn prod`: Run production build.
  - `yarn dev-automation`: Development mode that runs automation jobs on startup.
  - `yarn dev-migration`: Development mode that runs migration scripts on startup.

### Testing and Quality

- **Type safety**: All code must be TypeScript and type-checked.
- **Error scenarios**: All features must handle and display errors.
- **Permission checks**: All protected actions must enforce permissions.
- **Loading states**: All async actions must show loading indicators.
- **Form validation**: All forms must validate input before submission.

---

## References

- [DeepWiki: Tournament Tracker Overview](https://deepwiki.com/Hiviexd/tournament-tracker)
- See `README.md`, `src/base/routes.config.tsx`, and `server/app.ts` for further details.

---

**This file should be updated as the project evolves. All contributors are encouraged to keep this documentation current and detailed.**
