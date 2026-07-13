import { IconHome, IconSword, IconBook, IconMusic } from './Icons'

export const NAV = [
  { icon: IconHome, label: 'Home', to: '/', exact: true },
  { icon: IconSword, label: 'Anime', to: '/browse/anime' },
  { icon: IconBook, label: 'Manga', to: '/browse/manga' },
  { icon: IconMusic, label: 'Music', to: '/browse/music' },
]
