---
name: Supabase schema
description: Full database schema for AniEmpire — where it lives and how to apply it
---

**Location:** `server/migrations/`
- `001_gamified_ecosystem.sql` — all tables, enums, functions, triggers, seed data
- `002_rls_policies.sql` — Row Level Security policies (run AFTER 001)

**Key tables:** profiles, watch_list, xp_ledger, achievements, user_achievements, quests, user_quest_progress, guilds, guild_members, follows, chat_rooms, messages, message_reactions, reviews, shop_items, user_inventory, activity_log

**Key functions:**
- `add_user_xp(user_id, amount, reason, meta)` — awards XP, levels up automatically, returns JSON with new level/XP
- `handle_new_user()` — trigger on `auth.users` INSERT to auto-create profile

**How to apply:** Run in Supabase SQL Editor (Dashboard → SQL Editor → paste and run 001, then 002). Or use `supabase db push` if CLI is configured.

**Why:** Supabase needs RLS enabled or all table access is denied; run 002 immediately after 001.

**Realtime:** messages, profiles, guild_members tables added to `supabase_realtime` publication in 001.
