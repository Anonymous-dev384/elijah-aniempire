---
name: Backend setup
description: AniEmpire server/ directory setup, port, stubbed modules, installed packages
---

**Port:** server.js was hardcoded to 3000; changed `process.env.PORT || 3000` → `process.env.PORT || 4000`. The Backend API workflow expects port 4000.

**Stubbed modules** (packages not available in Replit registry):
- `server/services/anime/animepahe.js` — replaced with stub returning `null/[]`
- `server/services/manga/yomu.js` — replaced with stub
- `server/services/anime/hianime.js` — rewritten to wrap `hianime` npm package with try/catch; falls back gracefully

**Installed packages** (not in original package.json):
- `natural` — required by `server/utils/fuzzyMatcher.js`
- `fastest-levenshtein` — also required by fuzzyMatcher
- `bottleneck`, `axios-retry`, `ioredis`, `lodash`, `luxon`, `uuid`, `cheerio`, `node-cache`, `node-cron`, `bull`, `@consumet/extensions`, `@mateoaranda/jikanjs`, `hianime`

**Why:** The API server was cloned from GitHub and its dependencies were incomplete for Replit's environment.

**How to apply:** If backend crashes with `Cannot find module X`, install it with `npm install X --legacy-peer-deps` in the `server/` directory, or stub it out in its service file.
