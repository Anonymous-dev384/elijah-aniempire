-- ═══════════════════════════════════════════════════════════════════════════
-- AniEmpire Gamified Ecosystem — Supabase Migration 001
-- Run in Supabase SQL Editor (or via supabase db push)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fast text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- composite gin indexes

-- ── Enums ─────────────────────────────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE content_status  AS ENUM ('active', 'hidden', 'deleted', 'flagged');
CREATE TYPE media_type      AS ENUM ('anime', 'manga', 'music');
CREATE TYPE quest_type      AS ENUM ('daily', 'weekly', 'seasonal', 'hidden');
CREATE TYPE guild_role      AS ENUM ('member', 'officer', 'leader');
CREATE TYPE faction_id AS ENUM (
  'shonen','seinen','shoujo','cyber','fantasy','mecha','sol','horror','isekai','mystic'
);
CREATE TYPE currency_type AS ENUM ('credits','gems','guild_tokens','event_tokens','legend_tokens');
CREATE TYPE achievement_rarity AS ENUM ('common','uncommon','rare','epic','legendary');

-- ═══════════════════════════════════════════════════════════════════════════
-- USERS & PROFILES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 32),
  display_name    TEXT,
  bio             TEXT CHECK (char_length(bio) <= 500),
  avatar_url      TEXT,
  banner_url      TEXT,
  custom_url      TEXT UNIQUE CHECK (custom_url ~ '^[a-z0-9_-]+$'),
  faction         faction_id,
  title           TEXT,
  class           TEXT DEFAULT 'Novice',
  level           INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 999),
  prestige        INTEGER NOT NULL DEFAULT 0,
  total_xp        BIGINT  NOT NULL DEFAULT 0,
  xp_into_level   INTEGER NOT NULL DEFAULT 0,
  xp_for_next     INTEGER NOT NULL DEFAULT 100,
  credits         INTEGER NOT NULL DEFAULT 100  CHECK (credits >= 0),
  gems            INTEGER NOT NULL DEFAULT 0    CHECK (gems >= 0),
  guild_tokens    INTEGER NOT NULL DEFAULT 0    CHECK (guild_tokens >= 0),
  event_tokens    INTEGER NOT NULL DEFAULT 0    CHECK (event_tokens >= 0),
  legend_tokens   INTEGER NOT NULL DEFAULT 0    CHECK (legend_tokens >= 0),
  streak          INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  role            user_role NOT NULL DEFAULT 'user',
  is_online       BOOLEAN DEFAULT FALSE,
  online_status   TEXT DEFAULT 'online' CHECK (online_status IN ('online','idle','dnd','invisible')),
  social_links    JSONB DEFAULT '{}',
  showcase_config JSONB DEFAULT '[]',
  profile_theme   TEXT DEFAULT 'default',
  featured_quote  TEXT CHECK (char_length(featured_quote) <= 200),
  featured_amv    TEXT,
  profile_music   TEXT,
  visitors        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username  ON profiles USING GIN (username gin_trgm_ops);
CREATE INDEX idx_profiles_faction   ON profiles (faction);
CREATE INDEX idx_profiles_level     ON profiles (level DESC);
CREATE INDEX idx_profiles_xp        ON profiles (total_xp DESC);
CREATE INDEX idx_profiles_custom_url ON profiles (custom_url);

-- ── Watch / read list ─────────────────────────────────────────────────────────
CREATE TABLE watch_list (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  media_type  media_type NOT NULL DEFAULT 'anime',
  media_id    INTEGER NOT NULL,
  title       TEXT NOT NULL,
  cover_image TEXT,
  status      TEXT NOT NULL DEFAULT 'planning'
              CHECK (status IN ('watching','completed','on_hold','dropped','planning')),
  progress    INTEGER NOT NULL DEFAULT 0,
  total       INTEGER,
  score       NUMERIC(3,1) CHECK (score BETWEEN 1 AND 10),
  notes       TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, media_type, media_id)
);
CREATE INDEX idx_watch_list_user   ON watch_list (user_id, status);
CREATE INDEX idx_watch_list_media  ON watch_list (media_type, media_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RPG SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE xp_ledger (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  meta       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_xp_ledger_user ON xp_ledger (user_id, created_at DESC);

-- Achievements catalogue
CREATE TABLE achievements (
  id          TEXT PRIMARY KEY,  -- e.g. 'first_review', 'streak_30'
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity      achievement_rarity NOT NULL DEFAULT 'common',
  icon        TEXT,
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User achievements earned
CREATE TABLE user_achievements (
  user_id        UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
CREATE INDEX idx_user_achievements_user ON user_achievements (user_id, earned_at DESC);

-- Quests
CREATE TABLE quests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         quest_type NOT NULL DEFAULT 'daily',
  title        TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  xp_reward    INTEGER NOT NULL DEFAULT 0,
  credit_reward INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER NOT NULL DEFAULT 1,
  activity_key TEXT NOT NULL,  -- matches XP_REWARDS keys
  faction      faction_id,     -- NULL = all factions
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from   TIMESTAMPTZ,
  valid_until  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_quest_progress (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  quest_id    UUID NOT NULL REFERENCES quests ON DELETE CASCADE,
  progress    INTEGER NOT NULL DEFAULT 0,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  period_key  TEXT NOT NULL,  -- 'daily:2024-01-15' or 'weekly:2024-W03'
  UNIQUE (user_id, quest_id, period_key)
);
CREATE INDEX idx_uqp_user_period ON user_quest_progress (user_id, period_key);

-- ═══════════════════════════════════════════════════════════════════════════
-- GUILDS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE guilds (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT UNIQUE NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
  tag          TEXT UNIQUE NOT NULL CHECK (char_length(tag) BETWEEN 2 AND 6),
  description  TEXT CHECK (char_length(description) <= 1000),
  banner_url   TEXT,
  emblem       JSONB DEFAULT '{}',
  faction      faction_id,
  level        INTEGER NOT NULL DEFAULT 1,
  xp           BIGINT  NOT NULL DEFAULT 0,
  is_public    BOOLEAN NOT NULL DEFAULT TRUE,
  max_members  INTEGER NOT NULL DEFAULT 50,
  treasury_credits INTEGER NOT NULL DEFAULT 0,
  treasury_gems    INTEGER NOT NULL DEFAULT 0,
  stats        JSONB DEFAULT '{}',
  created_by   UUID NOT NULL REFERENCES profiles ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_guilds_faction ON guilds (faction);
CREATE INDEX idx_guilds_xp      ON guilds (xp DESC);

CREATE TABLE guild_members (
  guild_id    UUID NOT NULL REFERENCES guilds ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  role        guild_role NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contribution_xp BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);
CREATE INDEX idx_guild_members_user ON guild_members (user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SOCIAL
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX idx_follows_following ON follows (following_id);

CREATE TABLE profile_visitors (
  profile_id  UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  visitor_id  UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, visitor_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CHAT & MESSAGES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE chat_rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT,
  type        TEXT NOT NULL DEFAULT 'global'
              CHECK (type IN ('global','guild','faction','dm','watch_party')),
  guild_id    UUID REFERENCES guilds ON DELETE CASCADE,
  faction     faction_id,
  is_private  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES profiles ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES chat_rooms ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  reply_to    UUID REFERENCES messages ON DELETE SET NULL,
  media_url   TEXT,
  media_type  TEXT,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  status      content_status NOT NULL DEFAULT 'active',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_room ON messages (room_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages (user_id, created_at DESC);

CREATE TABLE message_reactions (
  message_id UUID NOT NULL REFERENCES messages ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- REVIEWS & DISCUSSIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  media_type  media_type NOT NULL,
  media_id    INTEGER NOT NULL,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  body        TEXT NOT NULL CHECK (char_length(body) >= 50),
  score       NUMERIC(3,1) NOT NULL CHECK (score BETWEEN 1 AND 10),
  is_spoiler  BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, media_type, media_id)
);
CREATE INDEX idx_reviews_media ON reviews (media_type, media_id, helpful_count DESC);
CREATE INDEX idx_reviews_user  ON reviews (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- SHOP & ECONOMY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE shop_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL
                CHECK (category IN ('avatar_border','animated_background','cursor_effect',
                                    'chat_effect','profile_effect','particle_system',
                                    'custom_font','name_color','title_pack','music_pack',
                                    'sticker_pack','profile_theme','profile_card')),
  preview_url   TEXT,
  price_credits INTEGER DEFAULT 0  CHECK (price_credits >= 0),
  price_gems    INTEGER DEFAULT 0  CHECK (price_gems >= 0),
  is_limited    BOOLEAN NOT NULL DEFAULT FALSE,
  stock         INTEGER,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shop_items_category ON shop_items (category, is_active);

CREATE TABLE user_inventory (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES shop_items ON DELETE RESTRICT,
  equipped    BOOLEAN NOT NULL DEFAULT FALSE,
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);
CREATE INDEX idx_user_inventory_user ON user_inventory (user_id, equipped);

-- ═══════════════════════════════════════════════════════════════════════════
-- ACTIVITY LOG
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_user ON activity_log (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS & FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at    BEFORE UPDATE ON messages    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at     BEFORE UPDATE ON reviews     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guilds_updated_at      BEFORE UPDATE ON guilds      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- XP award function (call from backend/supabase edge functions)
CREATE OR REPLACE FUNCTION add_user_xp(
  p_user_id UUID,
  p_amount  INTEGER,
  p_reason  TEXT,
  p_meta    JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_profile     profiles%ROWTYPE;
  v_new_total   BIGINT;
  v_level       INTEGER;
  v_remaining   BIGINT;
  v_xp_for_next INTEGER;
  v_did_level   BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  INSERT INTO xp_ledger (user_id, amount, reason, meta)
  VALUES (p_user_id, p_amount, p_reason, p_meta);

  v_new_total := v_profile.total_xp + p_amount;
  v_level     := v_profile.level;
  v_remaining := v_new_total;

  -- Recompute level from total XP
  LOOP
    v_xp_for_next := FLOOR(100 * POWER(1.35, v_level - 1));
    EXIT WHEN v_remaining < v_xp_for_next;
    v_remaining := v_remaining - v_xp_for_next;
    v_level := v_level + 1;
    v_did_level := TRUE;
  END LOOP;

  UPDATE profiles SET
    total_xp      = v_new_total,
    level         = v_level,
    xp_into_level = v_remaining,
    xp_for_next   = v_xp_for_next
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'new_total',   v_new_total,
    'level',       v_level,
    'did_level_up',v_did_level,
    'xp_into',     v_remaining,
    'xp_for_next', v_xp_for_next
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- Achievements
INSERT INTO achievements (id, title, description, rarity, xp_reward) VALUES
  ('first_login',       'Welcome to the Empire',      'Log in for the first time.',            'common',    25),
  ('first_review',      'Critic''s First Step',        'Write your first review.',              'common',    50),
  ('streak_7',          '7-Day Warrior',               'Maintain a 7-day login streak.',        'uncommon', 150),
  ('streak_30',         '30-Day Legend',               'Maintain a 30-day login streak.',       'rare',     500),
  ('rated_100',         'Century Rater',               'Rate 100 anime.',                       'rare',     200),
  ('guild_founder',     'Guild Founder',               'Create a guild.',                       'uncommon', 100),
  ('level_10',          'Rising Adventurer',           'Reach level 10.',                       'uncommon', 100),
  ('level_50',          'Saga Champion',               'Reach level 50.',                       'epic',     500),
  ('level_99',          'AniEmpire Sovereign',         'Reach level 99.',                       'legendary',5000),
  ('social_butterfly',  'Social Butterfly',            'Follow 25 other users.',                'common',    50),
  ('guild_wars_1',      'First Blood',                 'Participate in your first guild war.',  'uncommon', 100),
  ('perfect_score',     'Perfectionist',               'Give a 10/10 rating.',                 'common',    25),
  ('review_master',     'Review Master',               'Write 50 reviews.',                     'epic',     300),
  ('hidden_1',          '???',                         'You found a hidden achievement.',       'legendary',1000),
  ('night_owl',         'Night Owl',                   'Be active between midnight and 4AM.',   'uncommon',  75)
ON CONFLICT DO NOTHING;

-- Default chat rooms
INSERT INTO chat_rooms (id, name, type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Global',       'global'),
  ('00000000-0000-0000-0000-000000000002', 'Shonen Empire','faction'),
  ('00000000-0000-0000-0000-000000000003', 'Seinen Order', 'faction'),
  ('00000000-0000-0000-0000-000000000004', 'Shoujo Kingdom','faction'),
  ('00000000-0000-0000-0000-000000000005', 'Cyber Syndicate','faction'),
  ('00000000-0000-0000-0000-000000000006', 'Fantasy Realm','faction')
ON CONFLICT DO NOTHING;

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE guild_members;
