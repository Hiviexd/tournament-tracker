## Notes

- @ts-nocheck is needed for each route file because we modified `express.Request` and `express.Response` interfaces to include more user-related data for auth.
- `requireScopes` is a middleware that checks if the user has the required scopes to access the route.
  - It should be added before any auth middleware, ideally it should be the first middleware in the route definition.
  - Adding `requireScopes` to a route makes it accessible via API key. By default, no routes are accessible via API key unless `requireScopes` is added.
