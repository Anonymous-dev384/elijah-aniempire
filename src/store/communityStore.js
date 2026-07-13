import create from 'zustand'
import { supabase } from '../lib/supabase'

const useCommunityStore = create((set, get) => ({
  reviews: [],
  comments: [],
  followers: [],
  following: [],
  loading: false,
  error: null,

  fetchReviews: async (animeId, page = 1, limit = 10) => {
    try {
      set({ loading: true })
      const offset = (page - 1) * limit
      const { data, error } = await supabase
        .from('anime_reviews')
        .select('*, profiles(username, avatar_url)')
        .eq('anime_id', animeId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      set({ reviews: data })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  createReview: async (userId, animeId, { rating, title, content }) => {
    try {
      const { data, error } = await supabase
        .from('anime_reviews')
        .insert([
          {
            user_id: userId,
            anime_id: animeId,
            rating,
            title,
            content,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  fetchFollowers: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, profiles(id, username, avatar_url)')
        .eq('following_id', userId)

      if (error) throw error
      set({ followers: data })
    } catch (err) {
      console.error('Error fetching followers:', err)
    }
  },

  followUser: async (userId, targetUserId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert([
          {
            follower_id: userId,
            following_id: targetUserId,
          },
        ])

      if (error) throw error
      await get().fetchFollowers(targetUserId)
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  unfollowUser: async (userId, targetUserId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)

      if (error) throw error
      await get().fetchFollowers(targetUserId)
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },
}))

export default useCommunityStore
