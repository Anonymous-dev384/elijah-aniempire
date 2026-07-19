import {
  IconHome, IconSword, IconBook, IconMusic,
  IconUsers, IconShield, IconTrophy, IconShoppingBag,
} from './Icons'

export const NAV = [
  { icon: IconHome,         label: 'Home',         to: '/',              exact: true },
  { icon: IconSword,        label: 'Anime',         to: '/browse/anime' },
  { icon: IconBook,         label: 'Manga',         to: '/browse/manga' },
  { icon: IconMusic,        label: 'Music',         to: '/browse/music' },
]

export const NAV_COMMUNITY = [
  { icon: IconUsers,        label: 'Community',     to: '/social' },
  { icon: IconShield,       label: 'Guilds',        to: '/guilds' },
  { icon: IconTrophy,       label: 'Leaderboard',   to: '/leaderboard' },
  { icon: IconShoppingBag,  label: 'Shop',          to: '/shop' },
]
