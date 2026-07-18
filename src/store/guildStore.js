import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useGuildStore = create((set, get) => ({
  userGuild: null,
  allGuilds: [],
  guildDetails: {}, // { guildId: { ...guildData, members: [...] } }
  isLoading: false,
  error: null,

  // Fetch all active guilds
  fetchAllGuilds: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('guilds')
        .select(`
          id,
          name,
          description,
          emblem_url,
          owner_id,
          level,
          xp,
          member_count,
          max_members,
          guild_members(user_id)
        `)
        .order('member_count', { ascending: false });

      if (error) throw error;

      set({ allGuilds: data || [], isLoading: false });
    } catch (error) {
      console.error('Fetch guilds error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch user's current guild (if any)
  fetchUserGuild: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData, error: memberError } = await supabase
        .from('guild_members')
        .select('guild_id')
        .eq('user_id', user.id)
        .single();

      if (memberError && memberError.code !== 'PGRST116') throw memberError;
      
      if (!memberData) {
        set({ userGuild: null });
        return;
      }

      // Fetch full guild details
      await get().fetchGuildDetails(memberData.guild_id);
      set({ userGuild: memberData.guild_id });
    } catch (error) {
      console.error('Fetch user guild error:', error);
      set({ error: error.message });
    }
  },

  // Fetch detailed guild info
  fetchGuildDetails: async (guildId) => {
    try {
      set({ isLoading: true });
      
      const { data: guildData, error: guildError } = await supabase
        .from('guilds')
        .select(`
          id,
          name,
          description,
          emblem_url,
          owner_id,
          level,
          xp,
          member_count,
          max_members,
          created_at
        `)
        .eq('id', guildId)
        .single();

      if (guildError) throw guildError;

      // Fetch members
      const { data: members, error: membersError } = await supabase
        .from('guild_members')
        .select(`
          user_id,
          joined_at,
          profiles:user_id(
            id,
            username,
            avatar_url,
            xp,
            gender_title_pref,
            is_donor
          )
        `)
        .eq('guild_id', guildId);

      if (membersError) throw membersError;

      // Fetch weekly quests
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const { data: quests, error: questsError } = await supabase
        .from('guild_quests')
        .select('*')
        .eq('guild_id', guildId)
        .gte('week_starting', weekStart.toISOString().split('T')[0]);

      if (questsError) throw questsError;

      set((state) => ({
        guildDetails: {
          ...state.guildDetails,
          [guildId]: {
            ...guildData,
            members: members || [],
            quests: quests || [],
          },
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Fetch guild details error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Create a new guild
  createGuild: async (name, description) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check user level requirement (Level 5+)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      const userLevel = profile.xp < 500 ? 1 : profile.xp < 1500 ? 5 : 15; // Simplified level calc
      if (userLevel < 5) {
        set({ 
          error: 'You must be Level 5 or higher to create a guild',
          isLoading: false,
        });
        return;
      }

      // Check if user already in a guild
      const { data: existingMembership } = await supabase
        .from('guild_members')
        .select('guild_id')
        .eq('user_id', user.id)
        .single();

      if (existingMembership) {
        set({
          error: 'You can only be in one guild at a time. Leave your current guild first.',
          isLoading: false,
        });
        return;
      }

      // Create guild
      const { data: newGuild, error: createError } = await supabase
        .from('guilds')
        .insert([
          {
            name,
            description,
            owner_id: user.id,
            member_count: 1,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from('guild_members')
        .insert([
          {
            guild_id: newGuild.id,
            user_id: user.id,
          },
        ]);

      if (memberError) throw memberError;

      set((state) => ({
        userGuild: newGuild.id,
        allGuilds: [newGuild, ...state.allGuilds],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Create guild error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Join an existing guild
  joinGuild: async (guildId) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check user isn't already in a guild
      const { data: existingMembership } = await supabase
        .from('guild_members')
        .select('guild_id')
        .eq('user_id', user.id)
        .single();

      if (existingMembership) {
        set({
          error: 'You can only be in one guild at a time. Leave your current guild first.',
          isLoading: false,
        });
        return;
      }

      // Check guild capacity
      const { data: guildData, error: guildError } = await supabase
        .from('guilds')
        .select('member_count, max_members')
        .eq('id', guildId)
        .single();

      if (guildError) throw guildError;
      if (guildData.member_count >= guildData.max_members) {
        set({
          error: 'This guild is full',
          isLoading: false,
        });
        return;
      }

      // Add user to guild
      const { error: joinError } = await supabase
        .from('guild_members')
        .insert([
          {
            guild_id: guildId,
            user_id: user.id,
          },
        ]);

      if (joinError) throw joinError;

      // Update member count
      await supabase
        .from('guilds')
        .update({ member_count: guildData.member_count + 1 })
        .eq('id', guildId);

      set({ userGuild: guildId, isLoading: false });
    } catch (error) {
      console.error('Join guild error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Leave current guild
  leaveGuild: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentGuild = get().userGuild;
      if (!currentGuild) {
        set({ error: 'You are not in a guild', isLoading: false });
        return;
      }

      // Remove from guild_members
      const { error: leaveError } = await supabase
        .from('guild_members')
        .delete()
        .eq('guild_id', currentGuild)
        .eq('user_id', user.id);

      if (leaveError) throw leaveError;

      // Update member count
      const { data: guildData } = await supabase
        .from('guilds')
        .select('member_count, owner_id')
        .eq('id', currentGuild)
        .single();

      if (guildData.owner_id === user.id) {
        // Owner leaving: delete guild
        await supabase
          .from('guilds')
          .delete()
          .eq('id', currentGuild);
      } else {
        // Regular member leaving: decrement count
        await supabase
          .from('guilds')
          .update({ member_count: Math.max(1, guildData.member_count - 1) })
          .eq('id', currentGuild);
      }

      set({ userGuild: null, isLoading: false });
    } catch (error) {
      console.error('Leave guild error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
