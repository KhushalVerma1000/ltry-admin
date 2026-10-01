// Single source of truth for the backend API base URL.
//
// Every file that called `process.env.API_URL` used to fall back to a
// different (and mostly wrong) value if the env var wasn't set:
//   - lib/api/auth.ts     -> http://localhost:3000/api/v1
//   - lib/api/pools.ts    -> http://localhost:3000/api        (missing /v1)
//   - middleware.ts       -> http://localhost:3000/api/v1
//   - app/Login/action.ts -> no fallback at all (becomes "undefined/admin/login")
//
// The backend (ltry) actually listens on port 8000 by default and mounts
// every route under /api/v1, so none of the above matched it. In dev,
// with no .env.local set, login would crash instead of failing gracefully,
// and every other page would silently hit the wrong host/port.
export const API_URL = process.env.API_URL || "http://localhost:8000/api/v1";
