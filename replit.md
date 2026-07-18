# AniEmpire

A premium anime discovery and community platform built with React + Vite.

## Stack
- **Frontend**: React 19, React Router v7, Framer Motion
- **State**: Zustand, React Query
- **Backend**: Supabase (auth, database, real-time)
- **Media**: ArtPlayer (video), APlayer (music), hls.js (HLS streams)
- **Build**: Vite 8, with Brotli compression and manual chunk splitting

## Features
- Anime/manga browsing and detail pages
- Episode watch page with HLS video player
- Music page with playlist support
- Community: guilds, global/guild chat, watch parties
- User profiles with titles, achievements, cosmetics shop
- Onboarding wizard (character creation)

## Running locally
```bash
npm install
npm run dev
```

Requires a `.env.local` with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Key directories
- `src/pages/` — route-level page components
- `src/components/` — shared UI components
- `src/store/` — Zustand stores (user, chat, guild, shop, community)
- `src/services/` — API/data-fetching layer
- `src/datalib/` — data utilities
- `supabase/` — Supabase config/migrations

## User preferences
- No Supabase credentials yet — backend-dependent features will be wired up later.
