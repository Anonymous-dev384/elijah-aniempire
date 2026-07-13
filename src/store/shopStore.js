import create from 'zustand'
import { supabase } from '../lib/supabase'

const useShopStore = create((set, get) => ({
  items: [],
  inventory: [],
  wallet: null,
  transactions: [],
  loading: false,
  error: null,

  fetchShopItems: async (category = null) => {
    try {
      set({ loading: true })
      let query = supabase.from('shop_items').select('*')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      set({ items: data })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchInventory: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*, shop_items(*)')
        .eq('user_id', userId)

      if (error) throw error
      set({ inventory: data })
    } catch (err) {
      console.error('Error fetching inventory:', err)
    }
  },

  fetchWallet: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      set({ wallet: data })
    } catch (err) {
      console.error('Error fetching wallet:', err)
    }
  },

  purchaseItem: async (userId, itemId, quantity = 1) => {
    try {
      const { data, error } = await supabase
        .rpc('purchase_shop_item', {
          p_user_id: userId,
          p_item_id: itemId,
          p_quantity: quantity,
        })

      if (error) throw error

      // Refresh inventory and wallet
      await get().fetchInventory(userId)
      await get().fetchWallet(userId)

      return data
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  fetchTransactions: async (userId, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      set({ transactions: data })
    } catch (err) {
      console.error('Error fetching transactions:', err)
    }
  },
}))

export default useShopStore
