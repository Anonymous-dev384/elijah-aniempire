const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Client-Side Cache (15 minutes lifespan) to prevent reloads when clicking Back/Forward
export const memoryCache = {};
const CACHE_TTL = 1000 * 60 * 15;

export const getFromMemoryCache = (url) => {
  if (memoryCache[url] && (Date.now() - memoryCache[url].timestamp < CACHE_TTL)) {
    return memoryCache[url].data;
  }
  return null;
};

const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 2000) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (retries > 0 && (res.status === 429 || res.status >= 500)) {
        console.warn(`Retry ${4 - retries}: ${res.status} for ${url}. Waiting ${backoff}ms...`);
        await new Promise(r => setTimeout(r, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
      }
      const error = new Error(`Network response was not ok: ${res.status} ${res.statusText} at ${url}`);
      error.status = res.status;
      throw error;
    }
    return res;
  } catch (err) {
    // Do not retry client errors like 404, 422, 400
    if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
      throw err;
    }
    if (retries > 0) {
       console.warn(`Retry ${4 - retries}: Fetch error. Waiting ${backoff}ms...`);
       await new Promise(r => setTimeout(r, backoff));
       return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
    }
    throw err;
  }
};

const fetchWithCache = async (url, options = {}) => {
  const isCacheable = !options.method || options.method === 'GET';
  if (isCacheable && memoryCache[url] && (Date.now() - memoryCache[url].timestamp < CACHE_TTL)) {
    return memoryCache[url].data; // Return instantly from memory
  }

  const res = await fetchWithRetry(url, options);
  
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Expected JSON but received:', contentType, 'at', url, 'Snippet:', text.slice(0, 200));
    throw new Error(`Expected JSON but received ${contentType} for ${url}`);
  }

  const json = await res.json();

  // Guard: if the API returns a JSON error body (e.g. {status: 500, type: "UpstreamException"}),
  // treat it as a failure and do NOT cache it.
  if (json && typeof json.status === 'number' && json.status >= 400) {
    const err = new Error(`API error: ${json.status} ${json.type || json.error || ''} at ${url}`);
    err.status = json.status;
    throw err;
  }

  if (isCacheable && json) {
    memoryCache[url] = { timestamp: Date.now(), data: json };
  }
  return json;
};


/**
 * Build a proxied URL.
 * Final shape: {PROXY_URL}?url={encodedBackendUrl}
 * Notice: Bypasses the Vercel proxy when targeting a localhost backend API!
 */
export const proxied = (path) => {
  // Never proxy our own backend API. It already has CORS enabled and 
  // proxying it causes double-compression/encoding issues.
  return `${API_BASE}${path}`;
};

// ─── Custom ID Encoding (Base62) ─────────────────────────────
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ID_OFFSET = 10000;

export const encodeId = (malId) => {
  if (malId === undefined || malId === null) return '0';
  
  // If it's a non-numeric string (slug), return as-is rather than '0'
  const parsed = parseInt(malId);
  if (isNaN(parsed)) {
    return typeof malId === 'string' && malId.length > 0 ? malId : '0';
  }
  
  let num = parsed + ID_OFFSET;
  let result = '';
  while (num > 0) {
    result = B62[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result || '0';
};

export const decodeId = (code) => {
  let num = 0;
  for (const char of code) {
    num = num * 62 + B62.indexOf(char);
  }
  return num - ID_OFFSET;
};

export const slugify = (title) =>
  (title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const formatCount = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) {
    const kValue = num / 1000;
    return kValue >= 100 ? `${Math.round(kValue)}k` : kValue.toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

export const generateDetailUrl = (type, title, malId) => {
  // If malId is an object, extract the best identifier
  let numericId = null;
  let slugFallback = null;
  
  if (malId && typeof malId === 'object') {
    // Try all known numeric ID fields
    const candidates = [
      malId.mal_id, malId.id, malId.malId,
      malId.artist_id, malId.artistId,
      malId.person_id, malId.personId,
      malId.producer_id, malId.producerId,
      malId.character_id, malId.characterId,
      malId.artist?.id,
      malId.pivot?.artist_id, malId.pivot?.id
    ];
    
    for (const c of candidates) {
      if (c !== undefined && c !== null && !isNaN(parseInt(c)) && parseInt(c) > 0) {
        numericId = parseInt(c);
        break;
      }
    }
    
    // If no numeric ID found, try slug as fallback
    if (numericId === null) {
      slugFallback = malId.slug || null;
      
      // Last resort: scan for any numeric property > 0
      if (!slugFallback) {
        for (const key in malId) {
          if (typeof malId[key] === 'number' && malId[key] > 0) {
            numericId = malId[key];
            break;
          }
        }
      }
    }
  } else if (malId !== undefined && malId !== null) {
    // malId is a primitive
    const parsed = parseInt(malId);
    if (!isNaN(parsed) && parsed > 0) {
      numericId = parsed;
    } else if (typeof malId === 'string' && malId.length > 0) {
      slugFallback = malId;
    }
  }
  
  // Use encoded numeric ID if available, otherwise use slug directly
  // For Anime/Manga, we REALLY want an ID, but if we only have a slug, we use it to avoid ".0"
  const urlId = (numericId !== null && !isNaN(numericId)) ? encodeId(numericId) : (slugFallback || '0');

  // For artists, ALWAYS prefer slug over numeric ID.
  // AnimeThemes artist IDs are internal and often return 404 when used directly.
  // The slug is stable and always resolves correctly via the filter API.
  if (type === 'artist') {
    const artistSlug = (malId && typeof malId === 'object') ? malId.slug : null;
    return `/artist/${artistSlug || slugFallback || urlId}`;
  }

  if (['producer', 'person', 'character'].includes(type)) {
    return `/${type}/${urlId}`;
  }
  
  // Use slugify for the title part (Anime/Manga)
  const slugPart = slugify(title || 'unknown');
  return `/${type}/${slugPart}.${urlId}`;
}

export const parseDetailSlug = (slug) => {
  if (!slug) return null;
  const parts = slug.split('.');
  const code = parts[parts.length - 1];
  
  if (!code || code === '0') return null;
  
  // If it's a Base62 encoded ID (alphanumeric only)
  if (/^[a-zA-Z0-9]+$/.test(code)) {
    // Try modern offset (10000)
    let decoded = decodeId(code);
    if (decoded > 0) return decoded;

    // Try legacy offset (253) - common for '4Q' (One Piece)
    const legacyNum = (() => {
      let num = 0;
      for (const char of code) {
        num = num * 62 + B62.indexOf(char);
      }
      return num - 253;
    })();
    if (legacyNum > 0) return legacyNum;
  }

  // Otherwise, treat it as a raw slug/ID string
  return code;
};

// ─── Detail Page API Functions ───────────────────────────────
export const getAnimeDetail = async (malId) => {
  let finalId = malId;
  
  // If malId is a string like 'one-piece' or an encoded ID that failed parseDetailSlug's decoding
  if (isNaN(malId) || !malId || malId === '0') {
    // Try to treat as a slug if it looks like one
    try {
      // First try AnimeThemes resolution
      const atRes = await fetchWithCache(proxied(`/anime/${malId}/themes`));
      const malResource = atRes?.resources?.find(r => r.site === 'MyAnimeList') || atRes?.anime?.resources?.find(r => r.site === 'MyAnimeList');
      if (malResource?.external_id) {
        finalId = malResource.external_id;
      }
    } catch (err) {
      // Not found on AnimeThemes
    }

    // Fallback to fuzzy search on backend if still unresolved
    if (finalId === malId) {
      const query = String(malId).replace(/[-_.]/g, ' ');
      const searchRes = await fetchWithCache(proxied(`/anime/search?q=${encodeURIComponent(query)}&limit=1`));
      if (searchRes.data && searchRes.data.length > 0) {
        finalId = searchRes.data[0].mal_id;
      }
    }
  }
  const url = proxied(`/anime/${finalId}/full`);
  const json = await fetchWithCache(url);
  
  // Safely unwrap Jikan/Koyeb double nested responses 
  // (e.g. { data: { data: { mal_id } } })
  let item = json;
  if (json?.data?.data?.mal_id) {
    item = json.data.data;
  } else if (json?.data?.mal_id) {
    item = json.data;
  }
  
  const enrichment = json?.enrichment || json?.data?.enrichment || null;

  // Fold enrichment properties directly into the full Jikan object
  if (enrichment?.anilist) {
    const anilist = enrichment.anilist;
    item.anilistBanner = anilist.bannerImage || null;
    
    // Resolve accurate episode count
    // 1. If currently airing, AniList's nextAiringEpisode is the most reliable source for "released" count
    if (anilist.nextAiringEpisode?.episode) {
      item.episodes = anilist.nextAiringEpisode.episode - 1;
    } 
    // 2. If Jikan has no count (0, null, or 1 which is often a placeholder), trust AniList
    else if (!item.episodes || item.episodes === 1) {
      if (anilist.episodes) {
        item.episodes = anilist.episodes;
      }
    }
    // 3. If it's "Currently Airing" but AniList says fewer episodes than Jikan (Jikan often shows planned total)
    else if (item.status === 'Currently Airing' && anilist.episodes && anilist.episodes < item.episodes) {
      item.episodes = anilist.episodes;
    }
    
    item.nextAiringEpisode = anilist.nextAiringEpisode || null;
  }
  
  return item;
};

export const getAnimeCharacters = async (malId) => {
  const url = proxied(`/anime/${malId}/character`);
  const json = await fetchWithCache(url);
  return json.data || [];
};

export const getAnimeDetailRecommendations = async (malId) => {
  const url = proxied(`/anime/${malId}/recommendations`);
  const json = await fetchWithCache(url);
  return (json.data || []).slice(0, 12).map(rec => {
    const entry = rec.entry || {};
    return {
      id: entry.mal_id,
      title: entry.title || 'Unknown',
      coverImage: entry.images?.webp?.large_image_url || entry.images?.jpg?.large_image_url || '',
      url: entry.url
    };
  });
};

export const getAnimePictures = async (malId) => {
  const url = proxied(`/anime/${malId}/pictures`);
  const json = await fetchWithCache(url);
  return (json.data || []).map(pic => pic.webp?.large_image_url || pic.jpg?.large_image_url || '').filter(Boolean);
};

export const getMangaDetail = async (malId) => {
  const url = proxied(`/manga/${malId}/full`);
  const json = await fetchWithCache(url);
  return json.data || json;
};

export const getMangaCharacters = async (malId) => {
  const url = proxied(`/manga/${malId}/character`);
  const json = await fetchWithCache(url);
  return json.data || [];
};

export const getMangaDetailRecommendations = async (malId) => {
  const url = proxied(`/manga/${malId}/recommendations`);
  const json = await fetchWithCache(url);
  return (json.data || []).slice(0, 12).map(rec => {
    const entry = rec.entry || {};
    return {
      id: entry.mal_id,
      title: entry.title || 'Unknown',
      coverImage: entry.images?.webp?.large_image_url || entry.images?.jpg?.large_image_url || '',
      url: entry.url
    };
  });
};

export const getMangaPictures = async (malId) => {
  const url = proxied(`/manga/${malId}/pictures`);
  const json = await fetchWithCache(url);
  return (json.data || []).map(pic => pic.webp?.large_image_url || pic.jpg?.large_image_url || '').filter(Boolean);
};

export const getMangaChapters = async (malId, provider = 'mangadex') => {
  const url = proxied(`/manga/${malId}/chapters?provider=${provider}`);
  return await fetchWithCache(url);
};

export const getMangaChapterPages = async (chapterId, provider, mangaId) => {
  const params = new URLSearchParams({ provider });
  if (mangaId) params.append('mangaId', mangaId);
  const url = proxied(`/manga/read/${chapterId}?${params.toString()}`);
  const json = await fetchWithCache(url);
  return json.pages || json;
};

/**
 * Build a proxied image URL that routes through the backend stream proxy.
 * This bypasses referer restrictions on manga image hosting servers.
 */
export const getProxiedImageUrl = (imageUrl, provider) => {
  if (!imageUrl) return '';
  // Determine the referer based on provider
  const referers = {
    mangapill: 'https://mangapill.com/',
    mangafire: 'https://mangafire.to/',
    flamecomics: 'https://flamecomics.xyz/',
    mangadex: 'https://mangadex.org/',
    mangapark: 'https://mangapark.to/',
  };
  const referrer = referers[provider] || '';
  const payload = JSON.stringify({ url: imageUrl, referrer, filename: 'page.jpg' });
  const encoded = btoa(payload);
  return `${API_BASE}/stream/download?q=${encoded}`;
};


export const getAnimeEpisodes = async (malId, page = 1) => {
  const url = proxied(`/anime/${malId}/episodes?page=${page}`);
  const json = await fetchWithCache(url);
  return {
    episodes: json.data || [],
    pagination: json.pagination || { last_visible_page: 1, has_next_page: false }
  };
};

export const getAnimeRelations = async (malId) => {
  const url = proxied(`/anime/${malId}/relations`);
  const json = await fetchWithCache(url);
  return json.data || [];
};

export const getAnimeThemes = async (malId) => {
  let finalId = malId;
  if (isNaN(malId) || !malId || malId === '0') {
    try {
      // Prioritize precise resolution via AnimeThemes resources
      const atRes = await fetchWithCache(proxied(`/anime/${malId}/themes`));
      const malResource = atRes?.resources?.find(r => r.site === 'MyAnimeList') || atRes?.anime?.resources?.find(r => r.site === 'MyAnimeList');
      if (malResource?.external_id) {
        finalId = malResource.external_id;
      }
    } catch (err) {
      console.warn('[api] Failed to resolve slug via AnimeThemes:', err);
    }

    // Fallback to fuzzy search if precise resolution failed
    if (finalId === malId) {
      const query = String(malId).replace(/_/g, ' ');
      const searchRes = await fetchWithCache(proxied(`/anime/search?q=${encodeURIComponent(query)}&limit=1`));
      if (searchRes.data && searchRes.data.length > 0) {
        finalId = searchRes.data[0].mal_id;
      }
    }
  }
  const url = proxied(`/anime/${finalId}/themes`);
  const json = await fetchWithCache(url);
  return json.themes || json.data || []; // Handle both rich backend and fallback jikan format
};

export const getAniListDetails = async (malId) => {
  const url = proxied(`/anime/${malId}/anilist`);
  return await fetchWithCache(url);
};

// Fetch AniList metadata (banner, chapters, episodes) for a detail page
export const fetchAnilistMediaData = async (malId, mediaType = 'ANIME') => {
  try {
    const endpoint = mediaType === 'MANGA' ? 'manga' : 'anime';
    const url = proxied(`/${endpoint}/${malId}/anilist`);
    return await fetchWithCache(url);
  } catch (err) {
    console.error('AniList metadata fetch error:', err);
    return null;
  }
};

export const enrichWithAnilistMetadata = async (jikanData) => {
  if (!jikanData || jikanData.length === 0) return jikanData;
  const malIds = jikanData.slice(0, 15).map(a => a.mal_id); // Only request top 15 to keep query light
  
  try {
    const query = `query ($idMal_in: [Int]) { 
      Page(perPage: 50) { 
        media(idMal_in: $idMal_in, type: ANIME) { 
          idMal 
          bannerImage 
          episodes 
          nextAiringEpisode { 
            episode 
          } 
        } 
      } 
    }`;
    const anilistJson = await fetchWithCache('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal_in: malIds } })
    });
    const media = anilistJson.data?.Page?.media || [];
    const metaMap = {};
    media.forEach(m => { 
       metaMap[m.idMal] = {
         banner: m.bannerImage || null,
         episodes: m.episodes || null,
         nextEp: m.nextAiringEpisode?.episode || null
       };
    });
    
    return jikanData.map(item => {
      const meta = metaMap[item.mal_id];
      const finalItem = { ...item };
      if (meta) {
        if (meta.banner) finalItem.anilistBanner = meta.banner;
        // Accurate Episodes Logic
        const alEps = meta.episodes;
        const alNext = meta.nextEp;
        if (!item.episodes || item.episodes === 1) { // 1 is often Jikan's fallback for ongoing
           if (alEps) finalItem.episodes = alEps;
           else if (alNext) finalItem.episodes = alNext - 1;
        }
      }
      return finalItem;
    });
  } catch (err) {
    console.error('Anilist metadata fetch error:', err);
    return jikanData;
  }
}

export const mapAnimeData = (item) => {
  const bannerSources = [];
  const enrichment = item.enrichment || {};
  const anilist = enrichment.anilist || {};
  
  // 1. Gold Standard: Backend-provided AniList Banner
  if (item.anilistBanner) {
    bannerSources.push(item.anilistBanner);
  } else if (anilist.bannerImage) {
    bannerSources.push(anilist.bannerImage);
  }

  // Extract YouTube ID
  let ytId = null;
  if (item.trailer?.youtube_id) {
    ytId = item.trailer.youtube_id;
  } else if (item.trailer?.embed_url) {
    const match = item.trailer.embed_url.match(/\/embed\/([^?]+)/);
    if (match && match[1]) ytId = match[1];
  }

  if (ytId) {
    // 2. Silver Medal: YouTube MaxRes
    bannerSources.push(`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`);
    // 3. Bronze Medal: YouTube HQ
    bannerSources.push(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
  }

  // 4. Jikan Trailer Image (if different from YT)
  if (item.trailer?.images?.maximum_image_url && !bannerSources.includes(item.trailer.images.maximum_image_url)) {
    bannerSources.push(item.trailer.images.maximum_image_url);
  }

  // Episodes Logic: Prioritize AniList if Jikan is uncertain
  let finalEpisodes = item.episodes || '?';
  if ((!item.episodes || item.episodes === 1) && anilist.episodes) {
    finalEpisodes = anilist.episodes;
  }

  return {
    id: item.mal_id,
    title: item.title_english || item.title || item.title_japanese || 'Unknown Title',
    coverImage: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || '',
    bannerSources: bannerSources,
    genres: Array.isArray(item.genres) ? item.genres.map(g => g.name) : (item.genres ? [item.genres] : []),
    score: item.score || 'N/A',
    episodes: finalEpisodes,
    status: anilist.status || (item.status === 'Currently Airing' ? 'Releasing' : (item.status || 'Unknown')),
    isNew: item.airing || false,
    isNewEpisode: item.isNewEpisode || false,
    episodeTitle: item.episodeTitle || null,
    year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : (item.aired?.prop?.from?.year || null)),
    season: item.season || null,
    duration: item.duration || null,
    type: item.type || 'TV',
    rating: item.rating || null,
    description: item.synopsis || '',
    isTrending: true,
    isPopular: true,
    enrichment: enrichment, // Pass through raw enrichment if needed by the caller
    nextAiring: anilist.nextAiringEpisode || item.nextAiringEpisode || null
  }
}

export const mapMangaData = (item) => {
  return {
    id: item.mal_id,
    title: item.title_english || item.title || item.title_japanese || 'Unknown Title',
    coverImage: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || '',
    genres: Array.isArray(item.genres) ? item.genres.map(g => g.name) : (item.genres ? [item.genres] : []),
    score: item.score || 'N/A',
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    status: item.status || 'Unknown',
    year: item.published?.from ? new Date(item.published.from).getFullYear() : (item.published?.prop?.from?.year || null),
    description: item.synopsis || '',
    type: item.type || 'Manga',
    isTrending: true,
    isPopular: true
  }
}


const wrapMangaResponse = (json) => {
  let list = json?.data || [];
  if (!Array.isArray(list) && Array.isArray(list.data)) list = list.data;
  else if (!Array.isArray(list) && !Array.isArray(json)) list = [];
  else if (Array.isArray(json)) list = json;

  return {
    data: list.map(mapMangaData),
    pagination: json?.pagination || json?.data?.pagination || { last_visible_page: 1, has_next_page: false }
  };
}

/**
 * Enhanced Flexible Search Function
 * Supports: subtype, filter, rating, genres, status, min_score, sfw, unapproved
 */
export const searchAnime = async (query = '', page = 1, options = {}) => {
  try {
    let path = `/anime/search?page=${page}`;
    if (query.trim()) path += `&query=${encodeURIComponent(query)}`;
    
    // Core Filters
    if (options.subtype) path += `&subtype=${options.subtype}`;
    if (options.order_by) path += `&order_by=${options.order_by}`;
    if (options.sort) path += `&sort=${options.sort}`;
    if (options.filter) path += `&filter=${options.filter}`;
    if (options.rating) path += `&rating=${options.rating}`;
    if (options.limit) path += `&limit=${options.limit}`;

    // Advanced Elite Filters
    if (options.genres) path += `&genres=${options.genres}`;
    if (options.status) path += `&status=${options.status.toLowerCase()}`;
    if (options.min_score) path += `&score=${options.min_score}`;
    
    if (options.unapproved) path += `&unapproved`;
    if (options.producers) path += `&producers=${options.producers}`;
    if (options.start_date) path += `&start_date=${options.start_date}`;
    if (options.end_date) path += `&end_date=${options.end_date}`;

    const url = proxied(path);
    const json = await fetchWithCache(url);
    let list = json?.data || [];
    if (!Array.isArray(list) && Array.isArray(list.data)) list = list.data;

    const enriched = await enrichWithAnilistMetadata(list);
    return {
      data: enriched.map(mapAnimeData).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
      pagination: json.pagination || { last_visible_page: 1, has_next_page: false }
    };
  } catch (err) {
    // Fallback: /anime/search doesn't exist on older API versions
    console.warn('searchAnime fell back:', err.message);
    try {
      // If there's a real query, use Jikan directly to get accurate results
      if (query && query.trim()) {
        const jikanUrl = proxied(`/anime/search?limit=24&q=${encodeURIComponent(query.trim())}&page=${page}`);
        const res = await fetch(jikanUrl);
        const json = await res.json();
        const list = json.data || [];
        const enriched = await enrichWithAnilistMetadata(list);
        return {
          data: enriched.map(mapAnimeData).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
          pagination: json.pagination || { last_visible_page: 1, has_next_page: false }
        };
      }
      // No query: fall back to /anime/top
      const filter = options.filter || '';
      return getTopAnime(filter, page, options.subtype || '', options.rating || '');
    } catch (fallbackErr) {
      console.error('Search fallback also failed:', fallbackErr);
      throw fallbackErr;
    }
  }
}

/**
 * RESTORED: Uses specialized /top endpoint for general browsing
 */
export const getTopAnime = async (filter = '', page = 1, subtype = '', rating = '') => {
  try {
    let path = `/anime/top?page=${page}`;
    if (filter) path += `&filter=${filter}`;
    if (subtype) path += `&subtype=${subtype}`;
    if (rating) path += `&rating=${rating}`;
    
    const url = proxied(path);
    const json = await fetchWithCache(url);
    let list = json?.data || [];
    if (!Array.isArray(list) && Array.isArray(list.data)) list = list.data;
    
    // Enrich with AniList metadata for banners and accurate episodes
    const enriched = await enrichWithAnilistMetadata(list);
    
    return {
      data: enriched.map(mapAnimeData).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
      pagination: json.pagination || { last_visible_page: 1, has_next_page: false }
    };
  } catch (err) {
    console.error('Error fetching top anime:', err);
    throw err;
  }
}

export const getPopularAnime = async (page = 1, rating = '') => {
  return getTopAnime('bypopularity', page, '', rating);
}

export const getTopAiringAnime = async (page = 1, rating = '') => {
  return getTopAnime('airing', page, '', rating);
}

export const getMovies = async (page = 1, rating = '') => {
  return getTopAnime('', page, 'movie', rating);
}

export const getSeasonalAnime = async (page = 1) => {
  try {
    const url = proxied(`/anime/seasons?page=${page}`); 
    const json = await fetchWithCache(url);
    let list = json?.data || [];
    if (!Array.isArray(list) && Array.isArray(list.data)) list = list.data;

    const enriched = await enrichWithAnilistMetadata(list);
    return {
      data: enriched.map(mapAnimeData).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
      pagination: json.pagination || { last_visible_page: 1, has_next_page: false }
    };
  } catch (err) {
    console.warn('getSeasonalAnime fell back to /anime/top?filter=airing:', err.message);
    return getTopAnime('airing', page);
  }
}

export const getUpcomingAnime = async (page = 1) => {
  try {
    const url = proxied(`/anime/seasons/upcoming?page=${page}`);
    const json = await fetchWithCache(url);
    let list = json?.data || [];
    if (!Array.isArray(list) && Array.isArray(list.data)) list = list.data;

    const enriched = await enrichWithAnilistMetadata(list);
    return {
      data: enriched.map(mapAnimeData).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
      pagination: json.pagination || { last_visible_page: 1, has_next_page: false }
    };
  } catch (err) {
    // Fallback for old Koyeb deployments without /anime/seasons/upcoming
    console.warn('getUpcomingAnime fell back to /anime/top?filter=upcoming:', err.message);
    return getTopAnime('upcoming', page);
  }
}

export const getNewEpisodes = async (page = 1) => {
  try {
    const url = proxied(`/anime/recent-episodes?page=${page}`);
    const json = await fetchWithCache(url);
    const list = json?.data || [];
    
    // Recent episodes can have duplicates of the same anime if multiple episodes aired recently.
    // We unique them by mal_id/id for a cleaner browse view.
    const uniqueList = list.filter((v, i, a) => a.findIndex(t => (t.entry?.mal_id || t.mal_id) === (v.entry?.mal_id || v.mal_id)) === i);
    
    // Map entries if needed (Jikan /recent-episodes returns { entry, episodes, ... })
    const entries = uniqueList.map(item => item.entry || item);

    const enriched = await enrichWithAnilistMetadata(entries);
    
    return {
      data: enriched.map(mapAnimeData).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
      pagination: json.pagination || { last_visible_page: 1, has_next_page: false }
    };
  } catch (err) {
    console.error('Error fetching new episodes:', err);
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false } };
  }
}

export const getSchedule = async (day) => {
  try {
    const url = proxied(`/anime/${day}/schedule`);
    const json = await fetchWithCache(url);
    let data = json?.data || json;
    if (!Array.isArray(data) && Array.isArray(data.data)) data = data.data;
    return (Array.isArray(data) ? data : []).map(item => ({
      id: item.mal_id || item.id,
      time: item.time || item.broadcast?.time || 'TBA',
      title: item.title_english || item.title_romaji || item.title,
      episode: item.episode || item.airing_info?.episode || 'TBA',
      timestamp: item.airing_info?.timestamp || null
    })).filter((v, i, a) => a.findIndex(t => t.title === v.title) === i);
  } catch (err) {
    console.error('Error fetching schedule for', day, err);
    return [];
  }
}

export const getRecommendations = async (page = 1) => {
  try {
    const url = proxied(`/anime/recommendations?page=${page}`);
    const json = await fetchWithCache(url);
    const resp = json?.data || json; 
    let raw = Array.isArray(resp) ? resp : [];
    if (!Array.isArray(raw) && Array.isArray(resp?.data)) raw = resp.data;
    
    const flattened = [];
    raw.forEach(rec => {
      if (rec.entry?.[0]) flattened.push(rec.entry[0]);
    });
    
    const enriched = await enrichWithAnilistMetadata(flattened);
    return {
      data: enriched.map(mapAnimeData).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
      pagination: json.pagination || { last_visible_page: 1 }
    };
  } catch (err) {
    console.error('Error fetching recommendations:', err);
    throw err;
  }
}

export const getTopManga = async (filter = '', page = 1) => {
  try {
    // Attempt standard backend call
    let path = `/manga/top?page=${page}`;
    if (filter) path += `&filter=${filter}`;
    const url = proxied(path);
    const json = await fetchWithCache(url);
    const result = wrapMangaResponse(json);
    result.data = result.data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    
    // Safety check: If the backend returns content but it seems to ignore the filter 
    // (detected by comparing it to standard Jikan results or if backend is known unreliable)
    return result;
  } catch (err) {
    // Direct Jikan fallback if backend fails
    if (filter) {
      console.warn(`getTopManga filter '${filter}' failed, retrying direct Jikan:`, err.message);
      try {
        const jikanUrl = `https://api.jikan.moe/v4/top/manga?page=${page}&filter=${filter}`;
        const res = await fetch(jikanUrl);
        const json = await res.json();
        const list = json.data || [];
        return {
          data: list.map(mapMangaData).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
          pagination: json.pagination || { last_visible_page: 1, has_next_page: false }
        };
      } catch (fallbackErr) {
        console.error('Manga top fallback also failed:', fallbackErr);
        throw fallbackErr;
      }
    }
    console.error('Error fetching top manga:', err);
    throw err;
  }
}

export const getPopularManga = async (page = 1) => {
  return getTopManga('bypopularity', page);
}

export const getPublishingManga = async (page = 1) => {
  return getTopManga('publishing', page);
}

/**
 * Enhanced Flexible Search Function for Manga
 * Supports: type, status, genres, score, order_by, sort, unapproved
 */
export const searchManga = async (query = '', page = 1, options = {}) => {
  try {
    let path = `/manga/search?page=${page}`;
    if (query.trim()) path += `&query=${encodeURIComponent(query)}`;
    
    // Core Filters
    if (options.type) path += `&type=${options.type.toLowerCase()}`;
    if (options.order_by) path += `&order_by=${options.order_by}`;
    if (options.sort) path += `&sort=${options.sort}`;
    if (options.limit) path += `&limit=${options.limit}`;

    // Advanced Filters
    if (options.genres) path += `&genres=${options.genres}`;
    if (options.status) path += `&status=${options.status.toLowerCase()}`;
    if (options.min_score) path += `&score=${options.min_score}`;
    if (options.start_date) path += `&start_date=${options.start_date}`;
    if (options.end_date) path += `&end_date=${options.end_date}`;
    if (options.unapproved) path += `&unapproved`;

    const url = proxied(path);
    const json = await fetchWithCache(url);
    const result = wrapMangaResponse(json);
    result.data = result.data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    return result;
  } catch (err) {
    // Fallback: /manga/search doesn't exist on older API versions → use /manga/top
    console.warn('searchManga fell back to /manga/top:', err.message);
    try {
      return getTopManga(options.filter || '', page);
    } catch (fallbackErr) {
      console.error('Manga fallback also failed:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export const getRandomAnime = async () => {
  try {
    const url = proxied('/anime/random');
    const res = await fetchWithRetry(url);
    const json = await res.json();
    let item = json?.data || json;
    if (item?.data && !item.mal_id) item = item.data;
    return mapAnimeData(item);
  } catch (err) {
    console.error('Error fetching random anime:', err);
    return null;
  }
}

export const getRandomManga = async () => {
  try {
    const url = proxied('/manga/random');
    const res = await fetchWithRetry(url);
    const json = await res.json();
    let item = json?.data || json;
    if (item?.data && !item.mal_id) item = item.data;
    return mapMangaData(item);
  } catch (err) {
    console.error('Error fetching random manga:', err);
    return null;
  }
}

// ─── AnimeThemes API Functions ────────────────────────────────

/**
 * Maps raw AnimeThemes API response (from our backend) to a normalized theme card format.
 * Backend returns: { name, slug, year, season, coverImage, themes: [ { id, type, sequence, song, video, audio } ] }
 */
export const mapThemeData = (animeEntry) => {
  if (!animeEntry) return null;
  const themes = (animeEntry.themes || []).map(t => ({
    id: t.id,
    type: t.type,
    sequence: t.sequence,
    songTitle: t.song?.title || 'Unknown',
    artists: t.song?.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    artistsData: t.song?.artists || null,
    videoLink: t.video?.link || t.video?.url || null,
    audioLink: t.audio?.link || t.audio?.url || t.video?.link || t.video?.url || null,
    resolution: t.video?.resolution || null,
  }));

  return {
    name: animeEntry.name || 'Unknown Anime',
    slug: animeEntry.slug || '',
    year: animeEntry.year || null,
    season: animeEntry.season || null,
    coverImage: animeEntry.coverImage || null,
    synopsis: animeEntry.synopsis || '',
    malId: animeEntry.mal_id || null,
    themes,
  };
};

export const getFeaturedAnimeTheme = async () => {
  try {
    const url = proxied('/anime/themes/featured');
    const json = await fetchWithCache(url);
    return mapThemeData(json.data || json);
  } catch (err) {
    console.error('Error fetching featured theme:', err);
    return null;
  }
};

export const getNewAnimeThemes = async (limit = 20, page = 1) => {
  const emptyResult = { data: [], pagination: { current_page: page, has_next_page: false, last_visible_page: 1 } };
  try {
    const url = proxied(`/anime/themes/new?limit=${limit}&page=${page}`);
    const json = await fetchWithCache(url);
    const list = json.data || json || [];
    const data = Array.isArray(list) ? list.map(mapThemeData).filter(Boolean) : [];
    return {
      data,
      pagination: json.pagination || { current_page: page, has_next_page: data.length >= limit, last_visible_page: Math.max(1, Math.ceil((json.meta?.total || data.length) / limit)) }
    };
  } catch (err) {
    console.error('Error fetching new themes:', err);
    throw err;
  }
};

export const getPopularAnimeThemes = async (limit = 20, page = 1) => {
  const emptyResult = { data: [], pagination: { current_page: page, has_next_page: false, last_visible_page: 1 } };
  try {
    const url = proxied(`/anime/themes/popular?limit=${limit}&page=${page}`);
    const json = await fetchWithCache(url);
    const list = json.data || json || [];
    const data = Array.isArray(list) ? list.map(mapThemeData).filter(Boolean) : [];
    return {
      data,
      pagination: json.pagination || { current_page: page, has_next_page: data.length >= limit, last_visible_page: Math.max(1, Math.ceil((json.meta?.total || data.length) / limit)) }
    };
  } catch (err) {
    console.error('Error fetching popular themes:', err);
    throw err;
  }
};

export const searchAnimeThemes = async (query, limit = 20, page = 1) => {
  const emptyResult = { data: [], pagination: { current_page: page, has_next_page: false, last_visible_page: 1 } };
  try {
    const url = proxied(`/anime/themes/search?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}`);
    const json = await fetchWithCache(url);
    const list = json.data || json || [];
    const data = Array.isArray(list) ? list.map(mapThemeData).filter(Boolean) : [];
    return {
      data,
      pagination: json.pagination || { current_page: page, has_next_page: data.length >= limit, last_visible_page: Math.max(1, Math.ceil((json.meta?.total || data.length) / limit)) }
    };
  } catch (err) {
    console.error('Error searching themes:', err);
    throw err;
  }
};

export const getSeasonalAnimeThemes = async (year, season, page = 1) => {
  const emptyResult = { data: [], pagination: { current_page: page, has_next_page: false, last_visible_page: 1 } };
  try {
    const url = proxied(`/anime/themes/seasonal?year=${year}&season=${season}&page=${page}`);
    const json = await fetchWithCache(url);
    const list = json.data || json || [];
    const data = Array.isArray(list) ? list.map(mapThemeData).filter(Boolean) : [];
    return {
      data,
      pagination: json.pagination || { current_page: page, has_next_page: data.length >= 10, last_visible_page: 1 }
    };
  } catch (err) {
    console.error('Error fetching seasonal themes:', err);
    throw err;
  }
};
// ─── Streaming / Watch API Functions ──────────────────────────

/**
 * Get episode-level streaming mappings for a specific episode.
 * Returns provider episode IDs, available providers, etc.
 */
export const getEpisodeSources = async (malId, episodeNumber, provider) => {
  try {
    let path = `/anime/${malId}/episode/${episodeNumber}`;
    if (provider) path += `?provider=${provider}`;
    const url = proxied(path);
    const json = await fetchWithCache(url);
    return json;
  } catch (err) {
    console.error('[api] getEpisodeSources error:', err);
    return null;
  }
};

/**
 * Get unified watch data (mapping + servers + sources) in one request.
 */
export const getEpisodeWatchData = async (malId, episodeNumber, provider, category = 'sub', fallbackTitle = '', isPolling = false) => {
  try {
    let path = `/anime/${malId}/episode/${episodeNumber}/watch?category=${category}`;
    if (provider) path += `&provider=${provider}`;
    if (fallbackTitle) path += `&title=${encodeURIComponent(fallbackTitle)}`;
    if (isPolling) path += `&poll=true`;
    const url = proxied(path);
    // Don't cache watch data - it contains expiring source URLs
    const res = await fetchWithRetry(url);
    return await res.json();
  } catch (err) {
    console.error('[api] getEpisodeWatchData error:', err);
    return null;
  }
};

/**
 * Get available servers for an episode from a specific provider.
 */
export const getStreamingServers = async (episodeId, provider = 'animepahe') => {
  try {
    const url = proxied(`/anime/streaming/servers?episodeId=${encodeURIComponent(episodeId)}&provider=${provider}`);
    const json = await fetchWithCache(url);
    return json;
  } catch (err) {
    console.error('[api] getStreamingServers error:', err);
    return null;
  }
};

/**
 * Get actual video sources (HLS/MP4 URLs) for a given server.
 */
export const getStreamingSources = async (episodeId, server, category = 'sub', provider = 'animepahe', animeId, title, episodeNumber) => {
  try {
    let path = `/anime/streaming/sources?episodeId=${encodeURIComponent(episodeId)}&category=${category}&provider=${provider}`;
    if (server) path += `&server=${encodeURIComponent(server)}`;
    if (animeId) path += `&animeId=${encodeURIComponent(animeId)}`;
    if (title) path += `&title=${encodeURIComponent(title)}`;
    if (episodeNumber) path += `&episode=${encodeURIComponent(episodeNumber)}`;
    
    const url = proxied(path);
    const res = await fetchWithRetry(url);
    return await res.json();
  } catch (err) {
    console.error('[api] getStreamingSources error:', err);
    return null;
  }
};


export const getProducerInfo = async (id) => {
  try {
    const res = await fetchWithCache(proxied(`/producers/${id}`));
    return res.data;
  } catch (err) {
    console.error('Error fetching producer info:', err);
    return null;
  }
}

export const getPersonInfo = async (id) => {
  try {
    const res = await fetchWithCache(proxied(`/person/${id}/full`));
    return res.data;
  } catch (err) {
    console.error('Error fetching person info:', err);
    return null;
  }
}

export const getAnimeStaff = async (malId) => {
  try {
    const url = proxied(`/anime/staff/${malId}`);
    const res = await fetchWithCache(url);
    return res.data || [];
  } catch (err) {
    console.error('Error fetching anime staff:', err);
    return [];
  }
}

export const getSeasonArchiveAnime = async (year, season, page = 1) => {
  try {
    const res = await fetchWithCache(proxied(`/anime/seasons?year=${year}&season=${season.toLowerCase()}&page=${page}`));
    return wrapResponse(res);
  } catch (err) {
    console.error(`Error fetching anime for ${season} ${year}:`, err);
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false } };
  }
}

export const getCharacterInfo = async (id) => {
  try {
    const res = await fetchWithCache(proxied(`/character/${id}/full`));
    return res.data;
  } catch (e) { console.error(e); return null; }
}

export const getCharacterAnime = async (id) => {
  try {
    const res = await fetchWithCache(proxied(`/character/${id}/anime`));
    return res.data;
  } catch (e) { console.error(e); return []; }
}

export const getArtistInfo = async (slugOrId) => {
  try {
    const url = proxied(`/anime/themes/artist/${slugOrId}`);
    return await fetchWithCache(url);
  } catch (err) {
    console.error(`[api] Error fetching artist info for ${slugOrId} via backend:`, err);
    return null;
  }
}

export const getBatchAnimeThemesMeta = async (slugs) => {
  if (!slugs || slugs.length === 0) return [];
  try {
    const url = proxied(`/anime/themes/batch?slugs=${encodeURIComponent(slugs.join(','))}`);
    return await fetchWithCache(url);
  } catch (err) {
    console.error(`[api] Error fetching batch themes meta:`, err);
    return [];
  }
}

// ─── AniSkip API (Community Skip Times — proxied through backend) ────
/**
 * Fetch community-sourced intro/outro skip timestamps via the backend.
 * Backend handles caching (24hr) and rate-limit protection.
 * 
 * @param {number} malId - MAL anime ID
 * @param {number} episodeNumber - Episode number
 * @returns {Promise<{intro: {start: number, end: number}|null, outro: {start: number, end: number}|null}>}
 */
export const getAniSkipTimes = async (malId, episodeNumber) => {
  if (!malId || !episodeNumber) return { intro: null, outro: null };
  
  try {
    const url = proxied(`/anime/${malId}/episode/${episodeNumber}/skip-times`);
    const data = await fetchWithCache(url);
    return {
      intro: data?.intro || null,
      outro: data?.outro || null
    };
  } catch (err) {
    console.warn('[AniSkip] Failed to fetch skip times:', err.message);
    return { intro: null, outro: null };
  }
}
