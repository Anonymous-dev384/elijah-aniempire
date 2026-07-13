import create from 'zustand'
import { supabase } from '../lib/supabase'

const useUserStore = create((set, get) => ({
  user: null,
  profile: null,
  stats: null,
  achievements: [],
  loading: true,
  error: null,

  setUser: (user) => set({ user }),

  fetchProfile: async (userId) => {
    try {
      set({ loading: true })
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      set({ profile })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchStats: async (userId) => {
    try {
      const { data: stats, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      set({ stats })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  },

  fetchAchievements: async (userId) => {
    try {
      const { data: achievements, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId)

      if (error) throw error
      set({ achievements })
    } catch (err) {
      console.error('Error fetching achievements:', err)
    }
  },

  updateProfile: async (updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', get().user.id)
        .select()
        .single()

      if (error) throw error
      set({ profile: data })
      return data
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },
}))

export default useUserStore
