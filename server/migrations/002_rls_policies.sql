-- ═══════════════════════════════════════════════════════════════════════════
-- AniEmpire — Row Level Security Policies (Migration 002)
-- Apply AFTER migration 001
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_list        ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_ledger         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds            ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log      ENABLE ROW LEVEL SECURITY;

-- ── Profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_public_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update"    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert"    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ── Watch list ────────────────────────────────────────────────────────────────
CREATE POLICY "watch_list_own"         ON watch_list FOR ALL USING (auth.uid() = user_id);

-- ── XP ledger (read own, service role can write) ──────────────────────────────
CREATE POLICY "xp_own_read"            ON xp_ledger FOR SELECT USING (auth.uid() = user_id);

-- ── Achievements ──────────────────────────────────────────────────────────────
CREATE POLICY "achievements_public"    ON achievements        FOR SELECT USING (NOT hidden OR hidden IS FALSE);
CREATE POLICY "user_achievements_read" ON user_achievements   FOR SELECT USING (auth.uid() = user_id);

-- ── Quests ────────────────────────────────────────────────────────────────────
CREATE POLICY "quest_progress_own"     ON user_quest_progress FOR ALL USING (auth.uid() = user_id);

-- ── Guilds ────────────────────────────────────────────────────────────────────
CREATE POLICY "guilds_public_read"     ON guilds FOR SELECT USING (is_public);
CREATE POLICY "guilds_member_read"     ON guilds FOR SELECT
  USING (EXISTS (SELECT 1 FROM guild_members gm WHERE gm.guild_id = guilds.id AND gm.user_id = auth.uid()));
CREATE POLICY "guilds_leader_update"   ON guilds FOR UPDATE
  USING (EXISTS (SELECT 1 FROM guild_members gm WHERE gm.guild_id = guilds.id AND gm.user_id = auth.uid() AND gm.role = 'leader'));
CREATE POLICY "guilds_create"          ON guilds FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "guild_members_read"     ON guild_members FOR SELECT USING (true);
CREATE POLICY "guild_members_join"     ON guild_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "guild_members_leave"    ON guild_members FOR DELETE USING (auth.uid() = user_id);

-- ── Social ────────────────────────────────────────────────────────────────────
CREATE POLICY "follows_read"           ON follows FOR SELECT USING (true);
CREATE POLICY "follows_own"            ON follows FOR ALL USING (auth.uid() = follower_id);

-- ── Messages ──────────────────────────────────────────────────────────────────
CREATE POLICY "messages_active_read"   ON messages FOR SELECT USING (status = 'active');
CREATE POLICY "messages_own_insert"    ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_own_update"    ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "messages_mod_update"    ON messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('moderator','admin')));

CREATE POLICY "reactions_read"         ON message_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_own"          ON message_reactions FOR ALL USING (auth.uid() = user_id);

-- ── Reviews ───────────────────────────────────────────────────────────────────
CREATE POLICY "reviews_active_read"    ON reviews FOR SELECT USING (status = 'active');
CREATE POLICY "reviews_own_write"      ON reviews FOR ALL USING (auth.uid() = user_id);

-- ── Shop ──────────────────────────────────────────────────────────────────────
CREATE POLICY "shop_items_active_read" ON shop_items FOR SELECT USING (is_active);
CREATE POLICY "inventory_own"          ON user_inventory FOR ALL USING (auth.uid() = user_id);

-- ── Activity log ──────────────────────────────────────────────────────────────
CREATE POLICY "activity_own_read"      ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_own_insert"    ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
