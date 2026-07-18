# AniEmpire - Complete Frontend Setup Guide

## Overview

This is a full-featured anime community platform built with React, Zustand, Tailwind CSS, and Supabase. Features include user profiles with dynamic titles, guilds with synchronized watch parties, real-time global/guild chat, a cosmetics shop, and achievement tracking.

## Project Structure

```
src/
├── components/
│   ├── Onboarding/
│   │   └── OnboardingWizard.jsx        # 3-step character creation
│   ├── Profile/
│   │   └── UserProfile.jsx              # View & customize profiles
│   ├── Chat/
│   │   └── ChatInterface.jsx            # Real-time messaging (global + guild)
│   ├── Guilds/
│   │   └── GuildHideout.jsx             # Guild management & watch party
│   └── Shop/
│       └── Shop.jsx                     # Cosmetics marketplace
├── store/
│   ├── profileStore.js                  # User profile state (Zustand)
│   ├── chatStore.js                     # Chat messaging state
│   └── guildStore.js                    # Guild management state
├── lib/
│   └── supabase.js                      # Supabase client (not included - create it)
└── App.jsx                              # Main routing
```

## Installation & Setup

### 1. Prerequisites

```bash
node --version  # 16+ required
npm --version   # 7+ required
```

### 2. Install Dependencies

```bash
npm install
# Core
npm install react react-dom
npm install zustand
npm install @supabase/supabase-js

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Create Supabase Client

Create `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4. Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Tailwind CSS Setup

Update `tailwind.config.js`:

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: require('tailwindcss/colors').slate,
        purple: require('tailwindcss/colors').purple,
      },
    },
  },
  plugins: [],
};
```

Create `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Database Schema

The frontend expects these Supabase tables:

### profiles
```sql
- id (UUID, primary key, auth.users.id)
- username (TEXT, unique)
- avatar_url (TEXT)
- xp (INTEGER, default 0)
- credits (INTEGER, default 0)
- gender_title_pref (TEXT: 'male'|'female'|'neutral')
- faction (TEXT: 'shonen'|'seinen'|'shoujo'|'cyberpunk'|'fantasy'|'slice-of-life')
- about (TEXT)
- is_donor (BOOLEAN)
- guild_id (UUID, FK to guilds)
- last_chat_message_timestamp (TIMESTAMP)
- profile_effect_iframe_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### messages
```sql
- id (UUID, primary key)
- content (TEXT)
- user_id (UUID, FK to profiles)
- guild_id (UUID, FK to guilds, nullable for global)
- created_at (TIMESTAMP)
```

### guilds
```sql
- id (UUID, primary key)
- name (TEXT, unique)
- description (TEXT)
- emblem_url (TEXT)
- owner_id (UUID, FK to profiles)
- level (INTEGER, default 1)
- xp (INTEGER, default 0)
- member_count (INTEGER, default 1)
- max_members (INTEGER, default 50)
- created_at (TIMESTAMP)
```

### guild_members
```sql
- user_id (UUID, FK to profiles)
- guild_id (UUID, FK to guilds)
- joined_at (TIMESTAMP)
- (composite primary key: user_id + guild_id)
```

### shop_items
```sql
- id (UUID, primary key)
- name (TEXT)
- description (TEXT)
- price (INTEGER)
- category (TEXT: 'profile_effect'|'avatar_border'|'title_effect')
- iframe_template (TEXT, HTML with animations)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

### user_inventory
```sql
- id (UUID, primary key)
- user_id (UUID, FK to profiles)
- shop_item_id (UUID, FK to shop_items)
- is_equipped (BOOLEAN, default false)
- acquired_at (TIMESTAMP)
```

### achievements
```sql
- id (UUID, primary key)
- name (TEXT)
- description (TEXT)
- icon_url (TEXT)
- created_at (TIMESTAMP)
```

### user_achievements
```sql
- user_id (UUID, FK to profiles)
- achievement_id (UUID, FK to achievements)
- unlocked_at (TIMESTAMP)
- (composite primary key: user_id + achievement_id)
```

### guild_quests
```sql
- id (UUID, primary key)
- guild_id (UUID, FK to guilds)
- title (TEXT)
- description (TEXT)
- target_count (INTEGER)
- current_count (INTEGER, default 0)
- reward_xp (INTEGER)
- week_starting (DATE)
- created_at (TIMESTAMP)
```

## Component Integration

### Using ProfileStore

```javascript
import { useProfileStore } from '../store/profileStore';

function MyComponent() {
  const profile = useProfileStore((state) => state.profile);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const purchaseItem = useProfileStore((state) => state.purchaseItem);
  const equipItem = useProfileStore((state) => state.equipItem);

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return <div>{profile?.username}</div>;
}
```

### Using ChatStore

```javascript
import { useChatStore } from '../store/chatStore';

function ChatComponent() {
  const messages = useChatStore((state) => state.globalMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const subscribeToChat = useChatStore((state) => state.subscribeToChat);

  useEffect(() => {
    subscribeToChat();
  }, [subscribeToChat]);

  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => sendMessage('Hello!')}>Send</button>
    </>
  );
}
```

### Using GuildStore

```javascript
import { useGuildStore } from '../store/guildStore';

function GuildsComponent() {
  const userGuild = useGuildStore((state) => state.userGuild);
  const allGuilds = useGuildStore((state) => state.allGuilds);
  const fetchAllGuilds = useGuildStore((state) => state.fetchAllGuilds);
  const joinGuild = useGuildStore((state) => state.joinGuild);

  useEffect(() => {
    fetchAllGuilds();
  }, [fetchAllGuilds]);

  return (
    <>
      {allGuilds.map((guild) => (
        <button key={guild.id} onClick={() => joinGuild(guild.id)}>
          Join {guild.name}
        </button>
      ))}
    </>
  );
}
```

## Key Features Implementation

### 1. Dynamic Titles

Titles are calculated based on XP and gender preference:

```
XP < 500: Peasant
500 ≤ XP < 1500: Knight/Lady
1500 ≤ XP < 3000: Noble/Noblewoman
3000 ≤ XP < 4500: High Priest/Priestess
4500 ≤ XP < 6000: King/Queen
6000+ XP: Overlord/Overlady
```

The `getHierarchyTitle()` function in profileStore returns gender-specific titles based on the user's `gender_title_pref`.

### 2. Real-time Chat with Spam Protection

- **Minimum 10 seconds** between messages
- **Max 2000 characters** per message
- **Max 100 messages/day** (backend enforces)
- Uses Supabase realtime subscriptions for instant delivery

### 3. Guild Watch Party

- Synchronized video player across all guild members
- Uses Supabase broadcast channels for real-time sync
- Guild leader can set video URL
- Play/pause events are broadcast to all members

### 4. Profile Effects

Custom animations rendered in iframes with `mixBlendMode: 'screen'` for overlay effect:

- **Cherry Blossom**: Falling petals animation
- **Matrix Rain**: Green digital rain effect
- **Glowing Embers**: Floating fire particles

### 5. Shop System

- Items have categories: `profile_effect`, `avatar_border`, `title_effect`
- Users earn credits through:
  - Chat messages (+1, max 100/day)
  - Episode tracking (+5 per episode)
  - Reviews (+50 per review)
- Donors get 2x credit rewards

## Routing Example

Create `src/App.jsx`:

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OnboardingWizard from './components/Onboarding/OnboardingWizard';
import UserProfile from './components/Profile/UserProfile';
import ChatInterface from './components/Chat/ChatInterface';
import GuildHideout from './components/Guilds/GuildHideout';
import Shop from './components/Shop/Shop';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/onboard" element={<OnboardingWizard />} />
        <Route path="/profile/:userId?" element={<UserProfile />} />
        <Route path="/chat" element={<ChatInterface />} />
        <Route path="/guild" element={<GuildHideout />} />
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </Router>
  );
}
```

## RLS Policies

Essential Supabase Row Level Security policies:

### profiles table
```sql
-- Users can read all profiles (public)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### messages table
```sql
-- Anyone can read messages
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);

-- Users can insert messages (authenticated)
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### guilds table
```sql
-- Anyone can read guilds
CREATE POLICY "guilds_select" ON guilds FOR SELECT USING (true);
```

## Performance Tips

1. **Pagination**: Fetch messages/achievements in batches
2. **Debouncing**: Throttle chat messages client-side (already implemented)
3. **Image Optimization**: Use WebP avatars with fallbacks
4. **Lazy Loading**: Load shop items and achievements on-demand
5. **Caching**: Store shop items in local state to avoid refetches

## Troubleshooting

### Issue: Realtime not updating
- Check Supabase realtime is enabled in project settings
- Verify RLS policies allow SELECT on the table
- Check browser console for WebSocket errors

### Issue: Chat messages not sending
- Verify user is authenticated
- Check message length (max 2000 chars)
- Ensure 10-second throttle window has passed
- Check browser console for detailed error

### Issue: Profile effect not rendering
- Ensure iframe_template is valid HTML
- Check browser console for iframe errors
- Verify HTML contains animation CSS

### Issue: Shop items show old data
- Clear local Zustand cache: `sessionStorage.clear()`
- Refresh profile with `fetchProfile()`
- Check Supabase table permissions

## Next Steps

1. Implement backend RPC functions for:
   - Dynamic title calculation
   - Activity rewards system
   - Guild quest progress tracking
   - Achievement unlocking system

2. Add features:
   - Episode tracking modal
   - Review writing interface
   - Achievement showcase page
   - Guild invitation system
   - Leaderboards

3. Deploy:
   - Build: `npm run build`
   - Deploy to Vercel/Netlify
   - Enable CORS on Supabase
   - Set up environment variables in deployment platform

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase connection and permissions
3. Inspect Zustand store state in React DevTools
4. Review Supabase realtime logs in dashboard
