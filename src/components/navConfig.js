import {
  IconHome, IconSword, IconBook, IconMusic,
  IconUsers, IconShield, IconTrophy, IconShoppingBag,
  IconBell, IconTv, IconSettings, IconUser,
} from './Icons'

export const NAV = [
  { icon: IconHome,         label: 'Home',         to: '/',              exact: true },
  { icon: IconSword,        label: 'Anime',         to: '/browse/anime' },
  { icon: IconBook,         label: 'Manga',         to: '/browse/manga' },
  { icon: IconMusic,        label: 'Music',         to: '/browse/music' },
]

export const NAV_COMMUNITY = [
  { icon: IconUsers,        label: 'Community',     to: '/social'        },
  { icon: IconShield,       label: 'Guilds',        to: '/guilds'        },
  { icon: IconTrophy,       label: 'Leaderboard',   to: '/leaderboard'   },
  { icon: IconShoppingBag,  label: 'Shop',          to: '/shop'          },
  { icon: IconTv,           label: 'Watch Party',   to: '/watch-party'   },
]

export const NAV_USER = [
  { icon: IconUser,         label: 'Profile',       to: '/profile'       },
  { icon: IconSettings,     label: 'Settings',      to: '/settings'      },
]
