---
name: API base URL
description: How frontend reaches the backend API in dev and prod
---

**Dev:** `.env.local` at project root sets `VITE_API_BASE_URL=/api`. Vite proxies `/api/*` → `http://localhost:4000` (configured in `vite.config.js`).

**Result:** `src/services/api.js` reads `import.meta.env.VITE_API_BASE_URL` — was `undefined` (user set it to literal "later"), fixed by `.env.local`.

**Why:** Without this, all API calls went to `undefined/anime/...` and returned HTML (the Vite dev page), not JSON.

**How to apply:** If API calls return `text/html` or `undefined/...`, check that `.env.local` exists with `VITE_API_BASE_URL=/api` and that the backend workflow is running on port 4000.
