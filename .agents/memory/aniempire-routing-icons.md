---
name: AniEmpire routing & icons
description: Lessons from wiring all community/RPG page routes and fixing icon import gaps in AniEmpire
---

All major community and RPG pages existed as files but were unrouted in App.jsx. The single biggest fix was adding routes for: /social, /friends, /notifications, /guilds, /guilds/:id, /leaderboard, /shop, /watch-party, /profile, /profile/:username, /achievements, /inventory, /settings, /onboarding.

**Why:** Pages were built but never connected to the router — visiting them returned the 404 page.

**How to apply:** When a new page component is added, always check App.jsx for the matching Route before assuming the feature is missing.

Icon import gaps cause blank pages with a React error boundary warning — no visible error message. Pattern: page uses an icon not listed in its import block. Affected: ProfilePage used IconSettings without importing it; BrowsePage and MusicPage used IconWifiOff before it was exported; OnboardingWizard used IconCircle, IconMars, IconVenus.

**How to apply:** When a page renders blank, check browser console for "does not provide an export named 'IconX'" — fix by adding the export to Icons.jsx or the import to the page.

NavConfig exports: NAV (core), NAV_COMMUNITY (community section), NAV_USER (account section). Keep NAV_USER to Profile + Settings only — Notifications is hardcoded separately in Navbar with a badge counter.
