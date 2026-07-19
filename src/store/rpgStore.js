/**
 * RPG Store — Zustand store for the gamification layer.
 * Manages XP, level, faction, quests, achievements, streaks, and currencies.
 * Works offline with localStorage persistence; syncs to Supabase when connected.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── XP table: XP required to reach each level ───────────────────────────────
const XP_PER_LEVEL = (level) => Math.floor(100 * Math.pow(1.35, level - 1))

// ── Activity → XP rewards ────────────────────────────────────────────────────
export const XP_REWARDS = {
  daily_login:         25,
  anime_rated:         15,
  anime_watched:       30,
  review_written:      50,
  episode_watched:     10,
  manga_chapter:        8,
  music_played:         5,
  chat_message_sent:    3,
  guild_joined:        75,
  achievement_earned: 100,
  streak_3day:         50,
  streak_7day:        150,
  streak_30day:       500,
}

// ── Faction definitions ──────────────────────────────────────────────────────
export const FACTIONS = {
  shonen:    { id: 'shonen',    label: 'Shonen Empire',       color: '#FF6B6B', icon: '⚔️' },
  seinen:    { id: 'seinen',    label: 'Seinen Order',        color: '#4ECDC4', icon: '🧠' },
  shoujo:    { id: 'shoujo',    label: 'Shoujo Kingdom',      color: '#FFB7C5', icon: '🌸' },
  cyber:     { id: 'cyber',     label: 'Cyber Syndicate',     color: '#00D9FF', icon: '⚡' },
  fantasy:   { id: 'fantasy',   label: 'Fantasy Realm',       color: '#9D84B7', icon: '🔮' },
  mecha:     { id: 'mecha',     label: 'Mecha Union',         color: '#8B949E', icon: '🤖' },
  sol:       { id: 'sol',       label: 'Slice of Life Society', color: '#FFD93D', icon: '☀️' },
  horror:    { id: 'horror',    label: 'Horror Cult',         color: '#8B0000', icon: '👁️' },
  isekai:    { id: 'isekai',    label: 'Isekai Dominion',     color: '#7B68EE', icon: '🌀' },
  mystic:    { id: 'mystic',    label: 'Mystic Academy',      color: '#20B2AA', icon: '✨' },
}

// ── Title tiers ──────────────────────────────────────────────────────────────
export const TITLES = [
  { minLevel:  1, title: 'Rookie Watcher' },
  { minLevel:  5, title: 'Anime Initiate' },
  { minLevel: 10, title: 'Episode Hunter' },
  { minLevel: 20, title: 'Season Veteran' },
  { minLevel: 30, title: 'Arc Master' },
  { minLevel: 50, title: 'Saga Champion' },
  { minLevel: 75, title: 'Legend of the Empire' },
  { minLevel: 99, title: 'AniEmpire Sovereign' },
]

// ── Daily quests pool ────────────────────────────────────────────────────────
export const DAILY_QUEST_POOL = [
  { id: 'watch_3ep',    label: 'Watch 3 Episodes',    xp: 45, icon: '▶', target: 3,  activity: 'episode_watched' },
  { id: 'rate_2anime',  label: 'Rate 2 Anime',        xp: 30, icon: '⭐', target: 2, activity: 'anime_rated' },
  { id: 'send_5chat',   label: 'Send 5 Chat Messages', xp: 20, icon: '💬', target: 5, activity: 'chat_message_sent' },
  { id: 'read_5ch',     label: 'Read 5 Manga Chapters', xp: 40, icon: '📖', target: 5, activity: 'manga_chapter' },
  { id: 'write_review', label: 'Write a Review',       xp: 60, icon: '✍', target: 1, activity: 'review_written' },
  { id: 'play_music',   label: 'Play 3 Anime Themes',  xp: 15, icon: '🎵', target: 3, activity: 'music_played' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function getTitle(level) {
  return [...TITLES].reverse().find(t => level >= t.minLevel)?.title || 'Rookie Watcher'
}

function getXPForLevel(level) {
  return XP_PER_LEVEL(level)
}

function levelFromTotalXP(totalXP) {
  let level = 1
  let remaining = totalXP
  while (remaining >= getXPForLevel(level)) {
    remaining -= getXPForLevel(level)
    level++
  }
  return { level, xpIntoLevel: remaining, xpForNext: getXPForLevel(level) }
}

function pickDailyQuests() {
  const shuffled = [...DAILY_QUEST_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map(q => ({ ...q, progress: 0, completed: false }))
}

// ── Store ────────────────────────────────────────────────────────────────────
export const useRPGStore = create(
  persist(
    (set, get) => ({
      // Character
      userId:       null,
      username:     'Guest',
      totalXP:      0,
      level:        1,
      xpIntoLevel:  0,
      xpForNext:    100,
      title:        'Rookie Watcher',
      faction:      null,
      streak:       0,
      lastLoginDate: null,

      // Currencies
      credits:      100,
      gems:         0,
      guildTokens:  0,

      // Quests
      dailyQuests:  [],
      questDate:    null,

      // Achievements (id list)
      achievements: [],

      // Pending toast queue
      toasts: [],

      // ── Actions ─────────────────────────────────────────────────────────────
      setUser: (user) => set({
        userId:   user.id,
        username: user.username || 'Adventurer',
      }),

      addXP: (amount, reason = '') => {
        const state = get()
        const newTotal = state.totalXP + amount
        const { level, xpIntoLevel, xpForNext } = levelFromTotalXP(newTotal)
        const didLevelUp = level > state.level
        const newTitle = getTitle(level)

        set({
          totalXP:      newTotal,
          level,
          xpIntoLevel,
          xpForNext,
          title:        newTitle,
          toasts: [
            ...state.toasts,
            {
              id:       Date.now() + Math.random(),
              type:     didLevelUp ? 'level_up' : 'xp',
              message:  didLevelUp
                          ? `Level Up! You're now level ${level} — "${newTitle}"`
                          : `+${amount} XP${reason ? ` · ${reason}` : ''}`,
              xp:       amount,
              level:    didLevelUp ? level : null,
            }
          ],
        })
      },

      recordActivity: (activity) => {
        const reward = XP_REWARDS[activity] || 0
        if (reward > 0) get().addXP(reward, activity.replace(/_/g, ' '))

        // Update quest progress
        const state = get()
        const updatedQuests = state.dailyQuests.map(q => {
          if (q.activity === activity && !q.completed) {
            const progress = Math.min(q.target, q.progress + 1)
            const completed = progress >= q.target
            if (completed && !q.completed) get().addXP(q.xp, `Quest: ${q.label}`)
            return { ...q, progress, completed }
          }
          return q
        })
        set({ dailyQuests: updatedQuests })
      },

      setFaction: (factionId) => {
        if (!FACTIONS[factionId]) return
        set({ faction: factionId })
      },

      checkDailyLogin: () => {
        const today = new Date().toDateString()
        const state = get()
        if (state.questDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString()
          const newStreak = state.lastLoginDate === yesterday ? state.streak + 1 : 1
          set({
            dailyQuests:   pickDailyQuests(),
            questDate:     today,
            lastLoginDate: today,
            streak:        newStreak,
          })
          get().addXP(XP_REWARDS.daily_login, 'Daily Login')
          if (newStreak === 3)  get().addXP(XP_REWARDS.streak_3day, '3-Day Streak!')
          if (newStreak === 7)  get().addXP(XP_REWARDS.streak_7day, '7-Day Streak!')
          if (newStreak === 30) get().addXP(XP_REWARDS.streak_30day, '30-Day Streak!')
        }
      },

      unlockAchievement: (id, label) => {
        const state = get()
        if (state.achievements.includes(id)) return
        set({
          achievements: [...state.achievements, id],
          toasts: [
            ...state.toasts,
            { id: Date.now() + Math.random(), type: 'achievement', message: `Achievement Unlocked: ${label}`, label }
          ],
        })
        get().addXP(XP_REWARDS.achievement_earned, `Achievement: ${label}`)
      },

      dismissToast: (toastId) => {
        set(s => ({ toasts: s.toasts.filter(t => t.id !== toastId) }))
      },
    }),
    {
      name: 'aniempire-rpg',
      partialize: (state) => ({
        totalXP: state.totalXP, level: state.level, xpIntoLevel: state.xpIntoLevel,
        xpForNext: state.xpForNext, title: state.title, faction: state.faction,
        streak: state.streak, lastLoginDate: state.lastLoginDate, credits: state.credits,
        gems: state.gems, achievements: state.achievements,
        dailyQuests: state.dailyQuests, questDate: state.questDate,
        username: state.username,
      }),
    }
  )
)
