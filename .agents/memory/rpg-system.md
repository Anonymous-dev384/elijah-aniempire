---
name: RPG system
description: Gamification layer — XP, levels, factions, quests, theme toggle
---

**Files:**
- `src/store/rpgStore.js` — Zustand store with persist; exports `useRPGStore`, `FACTIONS`, `XP_REWARDS`, `recordActivity()`
- `src/context/ThemeContext.jsx` — dark/light/OLED theme provider; exports `ThemeProvider`, `useTheme`
- `src/components/RPG/RPGHud.jsx` — persistent overlay: XP bar, level badge, faction icon, quest dots, toast queue
- `src/components/Layout/AnimatedBackground.jsx` — canvas particle backdrop, faction-color-reactive
- `src/components/RPG/FactionSelector.jsx` — modal to choose faction
- `src/components/RPG/LevelUpModal.jsx` — celebratory level-up overlay
- `src/components/RPG/DailyQuestPanel.jsx` — daily quest list widget

**Wiring in App.jsx:**
- `ThemeProvider` wraps everything (outermost)
- `MusicProvider` inside ThemeProvider
- `AnimatedBackground` and `RPGHud` rendered inside MainLayout before the `<main>` tag

**Theme:** stored in `data-theme` attribute on `<html>`; CSS vars handle all visual switching. Toggle cycles dark→light→oled.

**Why:** Theme must be on html element so CSS vars propagate everywhere including portals.
