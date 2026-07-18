import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useChatStore = create((set, get) => ({
  globalMessages: [],
  guildMessages: {}, // { guildId: [messages] }
  activeRoom: 'global', // 'global' or guildId
  isLoading: false,
  error: null,
  subscriptions: {},

  // Subscribe to chat messages (realtime)
  subscribeToChat: async (guildId = null) => {
    try {
      set({ isLoading: true, error: null });
      
      const roomId = guildId || 'global';
      const channel = supabase.channel(`chat:${roomId}`);

      // Fetch initial messages
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          guild_id,
          profiles:user_id(id, username, avatar_url, gender_title_pref, xp, is_donor)
        `)
        .eq(guildId ? 'guild_id' : 'guild_id', guildId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Update state based on room
      if (guildId) {
        set((state) => ({
          guildMessages: {
            ...state.guildMessages,
            [guildId]: data || [],
          },
        }));
      } else {
        set({ globalMessages: data || [] });
      }

      // Subscribe to new messages
      const subscription = channel
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: guildId ? `guild_id=eq.${guildId}` : 'guild_id=is.null',
          },
          async (payload) => {
            // Fetch full profile data for new message
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, username, avatar_url, gender_title_pref, xp, is_donor')
              .eq('id', payload.new.user_id)
              .single();

            const newMessage = {
              ...payload.new,
              profiles: profileData,
            };

            if (guildId) {
              set((state) => ({
                guildMessages: {
                  ...state.guildMessages,
                  [guildId]: [...(state.guildMessages[guildId] || []), newMessage],
                },
              }));
            } else {
              set((state) => ({
                globalMessages: [...state.globalMessages, newMessage],
              }));
            }
          }
        )
        .subscribe();

      // Store subscription for cleanup
      set((state) => ({
        subscriptions: {
          ...state.subscriptions,
          [roomId]: subscription,
        },
      }));

      set({ isLoading: false });
    } catch (error) {
      console.error('Chat subscription error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Send message with spam protection & rewards
  sendMessage: async (content, guildId = null) => {
    try {
      if (!content.trim()) return;
      if (content.length > 2000) {
        set({ error: 'Message too long (max 2000 characters)' });
        return;
      }

      // Spam protection: Check last message timestamp
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_chat_message_timestamp')
        .eq('id', (await supabase.auth.getUser()).data.user.id)
        .single();

      const lastMessageTime = profile?.last_chat_message_timestamp
        ? new Date(profile.last_chat_message_timestamp)
        : null;
      const now = new Date();
      const timeDiff = lastMessageTime ? (now - lastMessageTime) / 1000 : Infinity;

      if (timeDiff < 10) {
        set({ error: `Please wait ${(10 - timeDiff).toFixed(1)}s before sending another message` });
        return;
      }

      // Insert message
      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .insert([
          {
            content,
            guild_id: guildId,
            user_id: (await supabase.auth.getUser()).data.user.id,
          },
        ])
        .select()
        .single();

      if (msgError) throw msgError;

      // Award credits & XP
      const { data: rewardResult, error: rewardError } = await supabase
        .rpc('add_user_activity_rewards', {
          p_user_id: (await supabase.auth.getUser()).data.user.id,
          p_activity_type: 'chat_message_sent',
        });

      if (rewardError) console.warn('Reward error:', rewardError);

      // Update last message timestamp
      await supabase
        .from('profiles')
        .update({ last_chat_message_timestamp: now })
        .eq('id', (await supabase.auth.getUser()).data.user.id);

      set({ error: null });
    } catch (error) {
      console.error('Send message error:', error);
      set({ error: error.message });
    }
  },

  // Fetch message history
  fetchHistory: async (guildId = null, limit = 50) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          guild_id,
          profiles:user_id(id, username, avatar_url, gender_title_pref, xp, is_donor)
        `)
        .eq(guildId ? 'guild_id' : 'guild_id', guildId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      if (guildId) {
        set((state) => ({
          guildMessages: {
            ...state.guildMessages,
            [guildId]: data || [],
          },
        }));
      } else {
        set({ globalMessages: data || [] });
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Fetch history error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Set active room
  setActiveRoom: (roomId) => {
    set({ activeRoom: roomId });
  },

  // Unsubscribe from chat
  unsubscribeFromChat: (guildId = null) => {
    const roomId = guildId || 'global';
    const subscriptions = get().subscriptions;
    
    if (subscriptions[roomId]) {
      supabase.removeChannel(subscriptions[roomId]);
      set((state) => {
        const newSubs = { ...state.subscriptions };
        delete newSubs[roomId];
        return { subscriptions: newSubs };
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
