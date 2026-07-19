# AniEmpire

Premium anime discovery platform with community features and a marketplace.

## Stack

- **Frontend**: React 19 + Vite (port 5000)
- **Backend**: Express.js API server (port 4000)
- **Auth/DB**: Supabase (PostgreSQL + auth)
- **Media**: Artplayer, HLS.js, APlayer

## How to run

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev -- --port 5000 --host` | 5000 |
| Backend API | `cd server && node server.js` | 4000 |

Install dependencies before first run:
```bash
npm install --legacy-peer-deps   # frontend (root)
cd server && npm install          # backend
```

## Environment variables

### Frontend (root `.env`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:4000/api`) |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_ENABLE_COMMUNITY` | Feature flag for community features |
| `VITE_ENABLE_SHOP` | Feature flag for shop/marketplace |

### Backend (`server/.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port (default 4000) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `JWT_SECRET` | Secret for signing API session tokens |
| `DISCORD_CLIENT_ID` | Discord OAuth app client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth app secret |
| `SESSION_SECRET` | Express session secret (already set in Replit secrets) |

## Notes

- Frontend deps require `--legacy-peer-deps` due to peer dependency conflicts between React 19 and some packages.
- The backend starts without a database connection and logs a warning — features requiring Supabase will not work until credentials are configured.
- Backend also supports MongoDB (optional); without a `MONGO_URI` env var it logs a connection warning but continues running.

## User preferences
