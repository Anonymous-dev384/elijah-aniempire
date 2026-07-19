---
name: AniEmpire API proxy
description: How VITE_API_BASE_URL and the Vite proxy connect the frontend to the backend in AniEmpire
---

The backend Express server runs on port 4000. Vite proxies /api → http://localhost:4000 (configured in vite.config.js server.proxy). VITE_API_BASE_URL must be set to "/api" in Replit shared env vars.

**Why:** The env var was previously set to "later" as a placeholder, causing all API calls to hit relative URLs like "later/anime/top" which resolved to the Vite dev server returning HTML instead of JSON.

**How to apply:** If API calls return "Expected JSON but received text/html", check VITE_API_BASE_URL via viewEnvVars and set it to "/api" with setEnvVars. Restart the frontend workflow after changing env vars so Vite picks them up.

The Jikan fallback in the backend (via the Express proxy routes) hits the Jikan API — rate limits cause "Jikan failed for top anime, trying Kitsu fallback" warnings in the backend log. This is expected behavior, not an error.
