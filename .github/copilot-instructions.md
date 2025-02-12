# Tournament Tracker Project Context

## Project Structure

-   Frontend: React + TypeScript + Vite
-   Backend: Node.js + Express + MongoDB
-   UI Framework: Mantine

## Architecture Patterns

### Frontend

-   Component-based architecture using React
-   Centralized state management (store directory)
    -   store should only be used for global state (i.e. loggedInUser)
-   Common components in `src/components/common`
-   Page-based routing in `src/pages`
-   Type definitions in `interfaces/`

### Backend

-   MVC architecture
-   Models using Mongoose schemas
-   Controller-based routing
-   Middleware pattern for cross-cutting concerns
-   Service layer for business logic

## Code Style Conventions

### TypeScript Patterns

-   Interface names prefixed with 'I' (e.g., `IUser`, `IMessage`)
-   Strong typing with custom interfaces
-   Strict TypeScript configuration

### Component Patterns

-   Functional components with TypeScript
-   Props interfaces defined above components
-   Consistent naming: {Purpose}{Type} (e.g., UserGroupBadge)
-   Mantine UI components with some custom styling

### Backend Patterns

-   Mongoose models with timestamps
-   RESTful API endpoints
-   Middleware for authentication and validation
-   Error handling middleware

## Common Implementations

### User Management

-   Committee-based roles (Tournament/Content Committee)
-   Alumni status tracking
-   Badge system for visual role identification

### UI Elements

-   Badge components with tooltips
-   Consistent color scheme using Mantine variables
-   Responsive design patterns

### Data Models

-   Timestamp tracking on models
-   Virtual properties when needed
-   Required field validation
-   Reference relationships between models

## Project Configuration

-   Separate tsconfig for frontend and backend
-   Environment-based configuration
-   Path aliases for cleaner imports
-   Strict linting and formatting rules
