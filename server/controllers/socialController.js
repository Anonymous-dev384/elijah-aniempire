/**
 * Social feed controller — in-memory store
 * Handles posts (text / image / video / link / poll),
 * likes, comments, saves and shares.
 */

const { randomUUID } = require('crypto');

// ── In-memory stores ──────────────────────────────────────────────────────────
const postsStore   = new Map(); // id → post
const likesStore   = new Map(); // postId → Set<userId>
const commentsStore = new Map(); // postId → Comment[]
const savesStore   = new Map(); // userId → Set<postId>

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED = [
  {
    id: 'p1', type: 'anime_rated',
    userId: 'u1', username: 'SakuraBlade', faction: 'shoujo', createdAt: new Date(Date.now() - 2*3600*1000).toISOString(),
    content: { anime: 'Violet Evergarden', score: 9.5, text: 'Absolutely beautiful. The animation and story had me in tears multiple times.' },
    likes: 34, commentCount: 7, saves: 8, shares: 3,
  },
  {
    id: 'p2', type: 'review_written',
    userId: 'u2', username: 'NeonKaito', faction: 'cyber', createdAt: new Date(Date.now() - 3*3600*1000).toISOString(),
    content: { anime: 'Cyberpunk: Edgerunners', text: `"This show redefined what anime can be in 2022. David's arc is one of the most tragic and compelling stories I've ever witnessed in any medium…"` },
    likes: 61, commentCount: 14, saves: 22, shares: 9,
  },
  {
    id: 'p3', type: 'achievement_earned',
    userId: 'u3', username: 'DragonPact', faction: 'fantasy', createdAt: new Date(Date.now() - 5*3600*1000).toISOString(),
    content: { achievement: 'Binge Master', emoji: '🏆', xp: 100, text: 'Watch 10 episodes in a single day.' },
    likes: 28, commentCount: 3, saves: 5, shares: 1,
  },
  {
    id: 'p4', type: 'episode_watched',
    userId: 'u4', username: 'MechLord', faction: 'seinen', createdAt: new Date(Date.now() - 7*3600*1000).toISOString(),
    content: { anime: 'Frieren: Beyond Journey\'s End', episode: 24, total: 28, text: '' },
    likes: 12, commentCount: 2, saves: 2, shares: 0,
  },
  {
    id: 'p5', type: 'text',
    userId: 'u5', username: 'IsekaiRei', faction: 'fantasy', createdAt: new Date(Date.now() - 9*3600*1000).toISOString(),
    content: { text: 'Watching 3 isekai at the same time. Send help. 😂 Which is your favourite this season?' },
    likes: 45, commentCount: 9, saves: 6, shares: 2,
  },
  {
    id: 'p6', type: 'review_written',
    userId: 'u6', username: 'VoidWalker', faction: 'seinen', createdAt: new Date(Date.now() - 12*3600*1000).toISOString(),
    content: { anime: 'Berserk', text: 'A dark masterpiece that stands the test of time. Guts\'s journey is unparalleled.' },
    likes: 88, commentCount: 21, saves: 33, shares: 14,
  },
  {
    id: 'p7', type: 'poll',
    userId: 'u7', username: 'ArcMaster', faction: 'shonen', createdAt: new Date(Date.now() - 18*3600*1000).toISOString(),
    content: {
      text: 'Best arc of the decade?',
      options: [
        { id: 'o1', text: 'Chimera Ant Arc (HxH)', votes: 142 },
        { id: 'o2', text: 'Marineford Arc (OP)',   votes: 118 },
        { id: 'o3', text: 'Shibuya Arc (JJK)',     votes: 97  },
        { id: 'o4', text: 'Infinity Castle (DS)',  votes: 76  },
      ],
      totalVotes: 433,
    },
    likes: 53, commentCount: 11, saves: 7, shares: 4,
  },
  {
    id: 'p8', type: 'image',
    userId: 'u8', username: 'CrimsonArc', faction: 'shonen', createdAt: new Date(Date.now() - 24*3600*1000).toISOString(),
    content: {
      text: 'My watch setup for this season 🔥 Twelve shows. Zero regrets.',
      imageUrl: 'https://picsum.photos/seed/anime-setup/800/450',
    },
    likes: 72, commentCount: 18, saves: 15, shares: 6,
  },
];

// Seed comments for some posts
const SEED_COMMENTS = {
  p1: [
    { id: 'c1', postId: 'p1', userId: 'u2', username: 'NeonKaito', faction: 'cyber', text: 'Episode 10 broke me completely.', createdAt: new Date(Date.now() - 1*3600*1000).toISOString() },
    { id: 'c2', postId: 'p1', userId: 'u3', username: 'DragonPact', faction: 'fantasy', text: 'The letter scenes are just perfection.', createdAt: new Date(Date.now() - 30*60*1000).toISOString() },
  ],
  p2: [
    { id: 'c3', postId: 'p2', userId: 'u5', username: 'IsekaiRei', faction: 'fantasy', text: 'David deserved better 😭', createdAt: new Date(Date.now() - 2*3600*1000).toISOString() },
  ],
  p7: [
    { id: 'c4', postId: 'p7', userId: 'u1', username: 'SakuraBlade', faction: 'shoujo', text: 'Chimera Ant Arc is the GOAT no contest.', createdAt: new Date(Date.now() - 5*3600*1000).toISOString() },
    { id: 'c5', postId: 'p7', userId: 'u4', username: 'MechLord', faction: 'seinen', text: 'Marineford hits different emotionally.', createdAt: new Date(Date.now() - 4*3600*1000).toISOString() },
  ],
};

// Initialize stores
SEED.forEach(p => {
  postsStore.set(p.id, { ...p });
  likesStore.set(p.id, new Set());
  commentsStore.set(p.id, SEED_COMMENTS[p.id] ? [...SEED_COMMENTS[p.id]] : []);
});

// ── Helper ────────────────────────────────────────────────────────────────────
function userId(req) {
  // Simple guest ID from header or generate one per request
  return req.headers['x-user-id'] || 'guest';
}

function postToJSON(post, uid) {
  const likeSet = likesStore.get(post.id) || new Set();
  const userSaves = savesStore.get(uid) || new Set();
  return {
    ...post,
    likes: likeSet.size > 0 ? post.likes + likeSet.size : post.likes,
    isLiked: likeSet.has(uid),
    isSaved: userSaves.has(post.id),
    commentCount: (commentsStore.get(post.id) || []).length + post.commentCount,
  };
}

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /api/social/feed?page=1&tab=all
exports.getFeed = (req, res) => {
  try {
    const uid  = userId(req);
    const tab  = (req.query.tab || 'all').toLowerCase();
    const page = parseInt(req.query.page || '1', 10);
    const limit = 10;

    let posts = Array.from(postsStore.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (tab === 'following') posts = posts.filter(p => ['u1', 'u2', 'u5'].includes(p.userId));
    if (tab === 'trending')  posts = posts.sort((a, b) => (b.likes + b.commentCount) - (a.likes + a.commentCount));
    if (tab === 'anime news') posts = posts.filter(p => ['anime_rated', 'episode_watched', 'review_written'].includes(p.type));

    const total = posts.length;
    const slice = posts.slice((page - 1) * limit, page * limit);

    res.json({ posts: slice.map(p => postToJSON(p, uid)), total, page, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/social/posts
exports.createPost = (req, res) => {
  try {
    const uid  = userId(req);
    const { type = 'text', content, username, faction } = req.body;

    if (!content) return res.status(400).json({ error: 'content is required' });

    // Validate poll options
    if (type === 'poll') {
      if (!content.options || content.options.length < 2) {
        return res.status(400).json({ error: 'polls need at least 2 options' });
      }
      content.options = content.options.map((opt, i) => ({
        id: `${randomUUID().slice(0, 8)}`,
        text: opt.text || opt,
        votes: 0,
      }));
      content.totalVotes = 0;
    }

    const post = {
      id: randomUUID(),
      type,
      userId: uid,
      username: username || 'Anonymous',
      faction: faction || 'shonen',
      createdAt: new Date().toISOString(),
      content,
      likes: 0,
      commentCount: 0,
      saves: 0,
      shares: 0,
    };

    postsStore.set(post.id, post);
    likesStore.set(post.id, new Set());
    commentsStore.set(post.id, []);

    res.status(201).json(postToJSON(post, uid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/social/posts/:id/like
exports.toggleLike = (req, res) => {
  try {
    const uid    = userId(req);
    const postId = req.params.id;
    const post   = postsStore.get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const set = likesStore.get(postId) || new Set();
    if (set.has(uid)) set.delete(uid); else set.add(uid);
    likesStore.set(postId, set);

    res.json({ liked: set.has(uid), totalLikes: post.likes + set.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/social/posts/:id/save
exports.toggleSave = (req, res) => {
  try {
    const uid    = userId(req);
    const postId = req.params.id;
    const post   = postsStore.get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const set = savesStore.get(uid) || new Set();
    if (set.has(postId)) set.delete(postId); else set.add(postId);
    savesStore.set(uid, set);

    post.saves += set.has(postId) ? 1 : -1;
    postsStore.set(postId, post);

    res.json({ saved: set.has(postId), totalSaves: post.saves });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/social/posts/:id/share
exports.sharePost = (req, res) => {
  try {
    const postId = req.params.id;
    const post   = postsStore.get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.shares = (post.shares || 0) + 1;
    postsStore.set(postId, post);

    res.json({ shares: post.shares });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/social/posts/:id/comments
exports.getComments = (req, res) => {
  try {
    const comments = commentsStore.get(req.params.id) || [];
    res.json({ comments: [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/social/posts/:id/comments
exports.addComment = (req, res) => {
  try {
    const uid    = userId(req);
    const postId = req.params.id;
    const post   = postsStore.get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { text, username, faction } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });

    const comment = {
      id:        randomUUID(),
      postId,
      userId:    uid,
      username:  username || 'Anonymous',
      faction:   faction  || 'shonen',
      text:      text.trim(),
      createdAt: new Date().toISOString(),
    };

    const list = commentsStore.get(postId) || [];
    list.push(comment);
    commentsStore.set(postId, list);

    // bump count in post
    post.commentCount = list.length;
    postsStore.set(postId, post);

    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/social/posts/:id/poll-vote
exports.pollVote = (req, res) => {
  try {
    const uid    = userId(req);
    const postId = req.params.id;
    const post   = postsStore.get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.type !== 'poll') return res.status(400).json({ error: 'Not a poll' });

    const { optionId } = req.body;
    const option = post.content.options.find(o => o.id === optionId);
    if (!option) return res.status(400).json({ error: 'Invalid option' });

    option.votes += 1;
    post.content.totalVotes = (post.content.totalVotes || 0) + 1;
    postsStore.set(postId, post);

    res.json({ options: post.content.options, totalVotes: post.content.totalVotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
