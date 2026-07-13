// Using Placehold.co for reliable dummy images since MAL blocks hotlinking
const ph = (title, w=400, h=600) => `https://placehold.co/${w}x${h}/1A1815/D4A843?text=${encodeURIComponent(title)}`

export const ANIME = [
  { id: 1, title: "Frieren", coverImage: ph('Frieren'), genres: ['Adventure','Drama','Fantasy'], score: 9.3, episodes: 28, status: 'Finished', type: 'TV', year: 2023, sub: true, dub: true, isNew: false, isTrending: true, isPopular: true, description: "Half a century after the party's triumph over the Demon King..." },
  { id: 2, title: 'Demon Slayer', coverImage: ph('Demon\nSlayer'), genres: ['Action','Fantasy','Supernatural'], score: 8.7, episodes: 26, status: 'Finished', type: 'TV', year: 2019, sub: true, dub: true, isNew: false, isTrending: true, isPopular: true, description: 'A young boy finds his family slaughtered by a demon...' },
  { id: 3, title: 'Jujutsu Kaisen', coverImage: ph('Jujutsu\nKaisen'), genres: ['Action','Horror','Supernatural'], score: 8.9, episodes: 23, status: 'Finished', type: 'TV', year: 2023, sub: true, dub: true, isNew: false, isTrending: true, isPopular: true, description: 'The past of Satoru Gojo is unveiled...' },
  { id: 4, title: 'Chainsaw Man', coverImage: ph('Chainsaw\nMan'), genres: ['Action','Horror','Supernatural'], score: 8.6, episodes: 12, status: 'Finished', type: 'TV', year: 2022, sub: true, dub: true, isNew: false, isTrending: true, isPopular: true, description: 'Denji merges with his devil dog Pochita to survive...' },
  { id: 5, title: 'Spy x Family', coverImage: ph('Spy x\nFamily'), genres: ['Action','Comedy','Slice of Life'], score: 8.5, episodes: 25, status: 'Releasing', type: 'TV', year: 2022, sub: true, dub: true, isNew: true, isTrending: true, isPopular: true, description: 'A spy assembles a fake family for a mission...' },
  { id: 6, title: 'Solo Leveling', coverImage: ph('Solo\nLeveling'), genres: ['Action','Adventure','Fantasy'], score: 8.8, episodes: 13, status: 'Finished', type: 'TV', year: 2024, sub: true, dub: false, isNew: true, isTrending: true, isPopular: true, description: "The world's weakest hunter awakens a unique power..." },
  { id: 7, title: 'Oshi no Ko', coverImage: ph('Oshi\nno Ko'), genres: ['Drama','Mystery','Supernatural'], score: 8.7, episodes: 11, status: 'Finished', type: 'TV', year: 2023, sub: true, dub: false, isNew: false, isTrending: true, isPopular: true, description: 'A doctor reincarnates as the child of his favorite idol...' },
  { id: 8, title: 'Blue Lock', coverImage: ph('Blue\nLock'), genres: ['Sports','Drama'], score: 8.2, episodes: 24, status: 'Finished', type: 'TV', year: 2022, sub: true, dub: false, isNew: false, isTrending: true, isPopular: true, description: "Japan creates a radical football program..." },
  { id: 9, title: 'Vinland Saga', coverImage: ph('Vinland\nSaga'), genres: ['Action','Adventure','Drama'], score: 9.0, episodes: 24, status: 'Finished', type: 'TV', year: 2023, sub: true, dub: false, isNew: false, isTrending: true, isPopular: false, description: 'Thorfinn, now enslaved, seeks a new path...' },
  { id: 10, title: 'One Piece', coverImage: ph('One\nPiece'), genres: ['Action','Adventure','Comedy'], score: 8.9, episodes: 1110, status: 'Releasing', type: 'TV', year: 1999, sub: true, dub: true, isNew: true, isTrending: true, isPopular: true, description: 'Monkey D. Luffy vows to become King of the Pirates...' },
  { id: 11, title: 'Bleach: TYBW', coverImage: ph('Bleach\nTYBW'), genres: ['Action','Supernatural'], score: 9.1, episodes: 26, status: 'Releasing', type: 'TV', year: 2022, sub: true, dub: true, isNew: true, isTrending: true, isPopular: true, description: 'Soul Reapers face Yhwach and the Quincy empire...' },
  { id: 12, title: 'Mushoku Tensei', coverImage: ph('Mushoku\nTensei'), genres: ['Adventure','Drama','Fantasy'], score: 8.4, episodes: 23, status: 'Finished', type: 'TV', year: 2021, sub: true, dub: true, isNew: false, isTrending: true, isPopular: true, description: 'A 34-year-old NEET reincarnates in a fantasy world...' },
]

export const MANGA = [
  { id: 101, title: 'Berserk', coverImage: ph('Berserk'), genres: ['Action','Dark Fantasy','Horror'], score: 9.4, chapters: 374, status: 'Releasing', type: 'Manga', year: 1989, isNew: false, isTrending: true, description: 'In a brutal dark fantasy world...' },
  { id: 102, title: 'Vagabond', coverImage: ph('Vagabond'), genres: ['Action','Drama','Historical'], score: 9.2, chapters: 327, status: 'Hiatus', type: 'Manga', year: 1998, isNew: false, isTrending: false, description: "The fictional journey of Japan's greatest swordsman..." },
  { id: 103, title: 'One Piece', coverImage: ph('One\nPiece'), genres: ['Action','Adventure','Comedy'], score: 9.1, chapters: 1112, status: 'Releasing', type: 'Manga', year: 1997, isNew: true, isTrending: true, description: 'The grand voyage of Monkey D. Luffy...' },
  { id: 104, title: 'Chainsaw Man', coverImage: ph('Chainsaw\nMan'), genres: ['Action','Horror','Supernatural'], score: 8.9, chapters: 170, status: 'Releasing', type: 'Manga', year: 2018, isNew: true, isTrending: true, description: 'The dark adventures of Denji...' },
  { id: 105, title: 'Vinland Saga', coverImage: ph('Vinland\nSaga'), genres: ['Action','Adventure','Historical'], score: 9.0, chapters: 210, status: 'Releasing', type: 'Manga', year: 2005, isNew: false, isTrending: false, description: 'A young Viking warrior seeks revenge...' },
  { id: 106, title: 'Jujutsu Kaisen', coverImage: ph('Jujutsu\nKaisen'), genres: ['Action','Horror','Supernatural'], score: 8.8, chapters: 267, status: 'Finished', type: 'Manga', year: 2018, isNew: false, isTrending: true, description: 'Yuji Itadori becomes the vessel...' },
]

export const MUSIC = [
  { id: 201, title: 'Gurenge', artist: 'LiSA', anime: 'Demon Slayer', coverImage: ph('Gurenge', 300, 300), type: 'Opening', year: 2019, score: 9.1, duration: '3:42', isNew: false, isTrending: true, genres: ['J-Rock'] },
  { id: 202, title: 'Idol', artist: 'YOASOBI', anime: 'Oshi no Ko', coverImage: ph('Idol', 300, 300), type: 'Opening', year: 2023, score: 9.4, duration: '3:52', isNew: false, isTrending: true, genres: ['J-Pop'] },
  { id: 203, title: 'Ao no Sumika', artist: 'Tatsuya Kitani', anime: 'Jujutsu Kaisen S2', coverImage: ph('Ao no\nSumika', 300, 300), type: 'Opening', year: 2023, score: 9.0, duration: '3:58', isNew: false, isTrending: true, genres: ['J-Rock'] },
  { id: 204, title: 'KICK BACK', artist: 'Kenshi Yonezu', anime: 'Chainsaw Man', coverImage: ph('KICK\nBACK', 300, 300), type: 'Opening', year: 2022, score: 9.2, duration: '3:40', isNew: false, isTrending: false, genres: ['J-Pop'] },
]

export const HERO_SLIDES = [
  { id: 1, title: "Frieren: Beyond Journey's End", description: "Half a century after the party's triumph over the Demon King, the elf mage Frieren begins a new journey to understand what it means to be human.", coverImage: ph('Frieren', 1200, 600), genres: ['Adventure','Fantasy','Drama'], score: 9.3, episodes: 28, status: 'Finished', isNew: false },
  { id: 2, title: 'Solo Leveling', description: "In a world of hunters, the weakest awakens a unique power — the ability to grow without limit.", coverImage: ph('Solo\nLeveling', 1200, 600), genres: ['Action','Fantasy'], score: 8.8, episodes: 13, status: 'Finished', isNew: true },
  { id: 3, title: 'Bleach: Thousand-Year Blood War', description: "Ichigo and the Soul Reapers face Yhwach's Quincy army in the most devastating war the Soul Society has ever seen.", coverImage: ph('Bleach\nTYBW', 1200, 600), genres: ['Action','Supernatural'], score: 9.1, episodes: 26, status: 'Releasing', isNew: true },
]

export const SCHEDULE_DATA = {
  0: [ // Sunday
    { time: '10:00', title: 'One Piece', episode: 1111 },
    { time: '23:15', title: 'Demon Slayer', episode: 27 }
  ],
  1: [ // Monday
    { time: '14:30', title: 'The Angel Next Door Spoils Me Rotten Season 2', episode: 2 },
    { time: '17:00', title: 'That Time I Got Reincarnated as a Slime', episode: 50 },
    { time: '21:00', title: 'Spy x Family', episode: 26 }
  ],
  2: [ // Tuesday
    { time: '09:00', title: 'Oshi no Ko', episode: 12 },
    { time: '19:30', title: 'Bleach: Thousand-Year Blood War', episode: 27 }
  ],
  3: [ // Wednesday
    { time: '08:00', title: 'Blue Lock', episode: 25 },
    { time: '18:15', title: 'Mushoku Tensei', episode: 24 }
  ],
  4: [ // Thursday
    { time: '16:00', title: 'Dr. Stone: New World', episode: 12 },
    { time: '22:30', title: 'Jujutsu Kaisen', episode: 24 }
  ],
  5: [ // Friday
    { time: '14:30', title: 'Frieren: Beyond Journey\'s End', episode: 29 },
    { time: '23:30', title: 'Chainsaw Man', episode: 13 }
  ],
  6: [ // Saturday
    { time: '11:00', title: 'Solo Leveling', episode: 14 },
    { time: '15:30', title: 'Kaiju No. 8', episode: 4 },
    { time: '20:00', title: 'My Hero Academia', episode: 140 }
  ]
}
