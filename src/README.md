## Code structure

- **`server.js`**: process startup (env, DB connect, optional seed, start HTTP server)
- **`src/app.js`**: Express app wiring (middlewares + routes + error handling)
- **`src/config/env.js`**: `.env.local`/`.env` loading + required env validation
- **`src/config/db.js`**: Mongo connection helpers
- **`src/middlewares/*`**: shared middlewares (`validate`, `notFound`, `errorHandler`)
- **`src/utils/*`**: tiny shared utilities (`asyncHandler`, `httpError`)


