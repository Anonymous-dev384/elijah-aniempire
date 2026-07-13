# AniEmpire Features Documentation

## Performance Optimizations ⚡

### 1. Image Optimization
- **Lazy Loading**: Images load on-demand using Intersection Observer
- **WebP Support**: Automatic format detection with fallbacks
- **Responsive Images**: srcSet for different screen sizes
- **Caching**: Service Worker caches images for offline support

### 2. Code Splitting
- **Dynamic Imports**: Detail pages split into separate chunks
- **Route-Based Splitting**: Each page loads independently
- **Bundle Analysis**: Visualizer reports included in build

### 3. Caching Strategy
- **Memory Cache**: Smart TTL with automatic invalidation (5 min default)
- **Service Worker**: Offline support with network-first strategy
- **IndexedDB**: Option for larger cache storage

### 4. Bundle Optimization
- **Brotli Compression**: Reduces bundle by ~30%
- **Manual Chunks**: Separates vendor, media, state, and UI code
- **Tree Shaking**: Unused code automatically removed

## Community Features 👥

### User Profiles
- Custom profile pages with bio and avatar
- Activity feed showing user interactions
- Follow/Follower system
- Profile statistics (reviews, level, followers)

### Reviews & Ratings
- Rate anime/manga (1-10 scale)
- Write detailed reviews
- Track helpful votes
- Comment on reviews
- View review history

### Social Interactions
- Follow other users
- View followers/following list
- Community activity feed
- Recommendation system

## Profiling System 🎖️

### Leveling System
- Experience gained from:
  - Writing reviews (+10 XP)
  - Following users (+5 XP)
  - Receiving helpful votes (+2 XP per vote)
  - Daily login streaks (+5 XP)
- Level progression: 100 XP per level
- Max level: 100

### Achievement System
- **Common**: Easy milestones (Write first review, Follow first user)
- **Rare**: Challenging goals (Level 10, 100 reviews)
- **Epic**: Very difficult (Level 50, 1000 followers)
- **Legendary**: Nearly impossible (Level 100, Featured review)

### Leaderboards
- Global leaderboards by:
  - Total XP
  - Reviews written
  - Followers count
  - Level
- Weekly/monthly rankings
- Category-specific leaderboards

## Shop System 🛍️

### Currency System
- **Credits**: Free in-game currency
  - Earn from achievements
  - Daily login rewards
  - Referral bonuses
- **Premium Currency**: Purchase with real money (optional)

### Item Categories

#### Cosmetics
- Profile borders
- Custom badges
- Theme customizations
- Avatar frames

#### Themes
- Dark mode variants
- Color schemes
- Custom fonts
- Seasonal themes

#### Badges
- Community badges
- Tier-based badges
- Limited edition badges
- Event badges

#### Currency Packs
- Starter pack (100 credits)
- Standard pack (500 credits)
- Premium pack (2000 credits)
- Mega pack (5000 credits)

### Transaction System
- Complete purchase history
- Transaction receipts
- Refund management
- Gift functionality (upcoming)

## Supabase Database Schema 🗄️

### Tables
- `profiles`: User profile information
- `user_stats`: Leveling, experience, and statistics
- `achievements`: Achievement definitions
- `user_achievements`: User achievement progress
- `shop_items`: Shop inventory
- `user_inventory`: User owned items
- `user_wallets`: Currency and credit management
- `transactions`: Purchase history
- `anime_reviews`: User reviews
- `follows`: Social connections
- `comments`: Review comments

### Key Functions
- `purchase_shop_item()`: Atomic purchase transaction
- `grant_achievement()`: Award achievements safely
- `update_user_stats()`: Batch stats updates

## Configuration

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_COMMUNITY=true
VITE_ENABLE_SHOP=true
VITE_ENABLE_PROFILING=true
```

### Supabase Setup
1. Create Supabase project
2. Run migrations in `supabase/migrations/`
3. Deploy functions in `supabase/functions/`
4. Configure Row Level Security (RLS) policies
5. Set up real-time subscriptions

## Performance Metrics

- **Bundle Size**: ~250KB (before compression)
- **Gzip**: ~80KB
- **Brotli**: ~65KB
- **Lighthouse Score**: 85+
- **Core Web Vitals**: Green

## Security Considerations

- All database operations use Supabase RLS
- User input sanitized before database insertion
- Transaction atomicity guaranteed
- Rate limiting on shop purchases
- Audit logs for financial transactions
