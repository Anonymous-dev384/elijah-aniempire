import './WatchPage.css'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import PlaylistDrawer from '../components/PlaylistDrawer'
import InternetError from '../components/InternetError'
import Artplayer from 'artplayer'
import {
  parseDetailSlug, getAnimeDetail, getAnimeEpisodes,
  getEpisodeSources, getStreamingServers, getStreamingSources,
  getEpisodeWatchData, getAniSkipTimes,
  generateDetailUrl, encodeId, slugify,
  getAnimeRelations, getAnimeDetailRecommendations
} from '../services/api'
import Hls from 'hls.js'
import { IconPlay, IconStar, IconChevronLeft, IconChevronRight, IconLayers, IconGrid, IconSearch, IconChevron } from '../components/Icons'
import AnimeCard from '../components/AnimeCard'

/* ─── ArtPlayer Wrapper ─────────────────────────────────────── */
function WatchPlayer({ url, videoSources, poster, onReady, onVideoEnd, onError, subtitles, skips, autoSkip, setAutoSkip, autoNext, setAutoNext, autoPlay, setAutoPlay, onMinimize, malId, currentEp }) {
  const artRef = useRef(null);
  const instanceRef = useRef(null)
  const hlsRef = useRef(null)
  const networkRetryCount = useRef(0)
  const loadingDebounceRef = useRef(null)

  const autoNextRef = useRef(autoNext)
  const autoSkipRef = useRef(autoSkip)
  const autoPlayRef = useRef(autoPlay)
  const skipsRef = useRef(skips)

  useEffect(() => {
    autoNextRef.current = autoNext
    autoSkipRef.current = autoSkip
    autoPlayRef.current = autoPlay
    skipsRef.current = skips
  }, [autoNext, autoSkip, autoPlay, skips])

  // ── Nuclear cleanup: Kill ALL video elements and their MediaSources in a container ──
  const nukeVideosInContainer = (container) => {
    if (!container) return;
    const videos = container.querySelectorAll('video');
    videos.forEach(v => {
      try {
        v.muted = true;
        v.volume = 0;
        v.pause();
        if (v.src && v.src.startsWith('blob:')) {
          URL.revokeObjectURL(v.src);
        }
        v.src = '';
        v.removeAttribute('src');
        v.load();
        v.remove();
      } catch (e) { /* ignore */ }
    });
  };

  // 1. Initialize Player Instance (Once)
  useEffect(() => {
    if (!artRef.current) return

    // ── CRITICAL: Kill any ghost instances from React StrictMode double-mount ──
    // In development, React StrictMode unmounts and re-mounts. The first mount's
    // Artplayer and HLS instance may leave behind orphaned <video> elements with
    // active MediaSource streams. We must nuke them before creating a new player.
    if (instanceRef.current) {
      console.warn('[WatchPlayer] Destroying leftover instance before re-init');
      try {
        if (instanceRef.current.hls) {
          instanceRef.current.hls.destroy();
        }
        instanceRef.current.destroy(true);
      } catch (e) { /* ignore */ }
      instanceRef.current = null;
    }
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (e) { /* ignore */ }
      hlsRef.current = null;
    }
    nukeVideosInContainer(artRef.current);

    // ── Helper: Debounced loading control ──
    const showLoadingDebounced = (art) => {
      if (loadingDebounceRef.current) clearTimeout(loadingDebounceRef.current);
      loadingDebounceRef.current = setTimeout(() => {
        if (art.video && art.video.paused) return;
        if (art.video && art.video.readyState >= 3) return;
        if (art.loading) art.loading.show = true;
      }, 1500);
    };

    const clearLoading = (art) => {
      if (loadingDebounceRef.current) {
        clearTimeout(loadingDebounceRef.current);
        loadingDebounceRef.current = null;
      }
      if (art.loading && art.loading.show) {
        art.loading.show = false;
      }
    };

    const art = new Artplayer({
      container: artRef.current,
      url: url || '',
      type: url?.includes('m3u8') ? 'm3u8' : 'mp4',
      poster: poster || '',
      volume: 0.8,
      autoplay: autoPlay,
      theme: '#D4A843',
      setting: true,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      playbackRate: true,
      aspectRatio: true,
      flip: true,
      controls: [
        {
          position: 'right',
          html: `<svg style="width:20px;height:20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>`,
          tooltip: 'Backward 10s',
          click: function () {
            art.backward = 10;
          },
        },
        {
          position: 'right',
          html: `<svg style="width:20px;height:20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>`,
          tooltip: 'Forward 10s',
          click: function () {
            art.forward = 10;
          },
        },
      ],
      mutex: false, // Prevent it from trying to pause/mute other background audio automatically
      hotkey: true,
      hotkeys: [
        {
          key: 'i',
          click: function () {
            if (onMinimize) onMinimize();
          },
        },
      ],
      miniProgressBar: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: autoPlay,
      airplay: true,
      autoOrientation: true,
      lock: true,
      fastForward: true,
      plugins: [],
      contextmenu: [
        {
          html: 'Miniplayer (i)',
          click: function (contextmenu) {
            contextmenu.show = false;
            if (onMinimize) onMinimize();
          },
        },
        {
          html: `Auto Play: <span style="color: ${autoPlayRef.current ? '#D4A843' : '#888'}; font-weight: bold;">${autoPlayRef.current ? 'ON' : 'OFF'}</span>`,
          switch: true,
          on: autoPlayRef.current,
          click: function (item) {
            const newState = !autoPlayRef.current;
            item.on = newState;
            item.html = `Auto Play: <span style="color: ${newState ? '#D4A843' : '#888'}; font-weight: bold;">${newState ? 'ON' : 'OFF'}</span>`;
            setTimeout(() => setAutoPlay(newState), 0);
            return newState;
          },
        },
        {
          html: `Auto Next: <span style="color: ${autoNextRef.current ? '#D4A843' : '#888'}; font-weight: bold;">${autoNextRef.current ? 'ON' : 'OFF'}</span>`,
          switch: true,
          on: autoNextRef.current,
          click: function (item) {
            const newState = !autoNextRef.current;
            item.on = newState;
            item.html = `Auto Next: <span style="color: ${newState ? '#D4A843' : '#888'}; font-weight: bold;">${newState ? 'ON' : 'OFF'}</span>`;
            setTimeout(() => setAutoNext(newState), 0);
            return newState;
          },
        },
        {
          html: `Auto Skip: <span style="color: ${autoSkipRef.current ? '#D4A843' : '#888'}; font-weight: bold;">${autoSkipRef.current ? 'ON' : 'OFF'}</span>`,
          switch: true,
          on: autoSkipRef.current,
          click: function (item) {
            const newState = !autoSkipRef.current;
            item.on = newState;
            item.html = `Auto Skip: <span style="color: ${newState ? '#D4A843' : '#888'}; font-weight: bold;">${newState ? 'ON' : 'OFF'}</span>`;
            setTimeout(() => setAutoSkip(newState), 0);
            return newState;
          },
        },
      ],
      moreVideoAttr: {
        'webkit-playsinline': true,
        playsinline: true,
      },
      settings: [
        ...(videoSources?.length > 1 ? [
          {
            html: 'Quality',
            width: 150,
            tooltip: videoSources.find(s => s.isDefault)?.quality || (videoSources[0]?.quality || 'Auto'),
            selector: videoSources.map((s, idx) => {
              let label = s.quality || `Source ${idx + 1}`;
              if (/^\d+$/.test(label)) label += 'p';
              return {
                default: s.isDefault || false,
                html: label,
                url: s.url,
              };
            }),
            onSelect: function (item) {
              this.switchQuality(item.url, item.html);
              return item.html;
            },
          }
        ] : [])
      ],
      ...(subtitles?.length ? {
        subtitle: {
          url: subtitles[0].file || subtitles[0].url,
          type: 'vtt',
          encoding: 'utf-8',
          style: { color: '#fff', fontSize: '20px' }
        }
      } : {}),
      customType: {
        m3u8: function (video, url, art) {
          if (art.isDestroy) {
            console.warn('[WatchPlayer] Aborting HLS init on destroyed Artplayer instance');
            return;
          }

          if (Hls.isSupported()) {
            // Destroy any previous HLS instance (including ghosts)
            if (art.hls) {
              art.hls.destroy();
              art.hls = null;
            }
            if (hlsRef.current) {
              hlsRef.current.destroy();
              hlsRef.current = null;
            }

            // Fully clear the video element
            video.pause();
            video.muted = true;
            if (video.src && video.src.startsWith('blob:')) {
              URL.revokeObjectURL(video.src);
            }
            video.removeAttribute('src');
            video.load();

            const hls = new Hls({
              enableWorker: false,
              enableFetch: true, // Force modern Fetch API to bypass XHR-intercepting Chrome extensions
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              maxBufferSize: 60 * 1024 * 1024,
              fragLoadingTimeOut: 30000,
              fragLoadingMaxRetry: 10,
              fragLoadingRetryDelay: 1000,
              manifestLoadingTimeOut: 30000,
              levelLoadingTimeOut: 30000,
              lowLatencyMode: false,
              backOffRetryStep: 1000,
              backOffMaxRetryDelay: 10000,
              nudgeOffset: 0.5,
              nudgeMaxRetry: 20,
              maxBufferHole: 1.0,
              testBandwidth: false,
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            art.hls = hls;
            hlsRef.current = hls; // Track in ref for cleanup even if art is gone

            art.on('destroy', () => {
              if (hls) hls.destroy();
            });

            // Save quality to localStorage when user manually switches
            art.on('switch', (url) => {
              const src = videoSources?.find(s => s.url === url);
              if (src && src.quality) {
                let label = src.quality;
                if (/^\d+$/.test(label)) label += 'p';
                console.log('[WatchPlayer] User switched quality to:', label);
                localStorage.setItem('preferredQuality', label);
              }
            });

            art.on('video:ended', () => {
              if (onVideoEnd) onVideoEnd();
            });

            hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
              console.log('[WatchPlayer] HLS Manifest loaded:', data.url);
            });

            hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
              console.log('[WatchPlayer] HLS Level loaded:', data.level, 'fragments:', data.details?.fragments?.length);
            });

            // Diagnostic: Log each fragment load attempt
            hls.on(Hls.Events.FRAG_LOADING, (event, data) => {
              console.log('[WatchPlayer] Loading fragment:', data.frag?.sn, data.frag?.url?.substring(0, 120));
            });

            hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
              console.log('[WatchPlayer] Fragment loaded OK:', data.frag?.sn, 'size:', data.frag?.stats?.total);
            });

            hls.on(Hls.Events.KEY_LOADING, (event, data) => {
              console.log('[WatchPlayer] Loading key:', data.frag?.decryptdata?.uri?.substring(0, 120));
            });

            hls.on(Hls.Events.KEY_LOADED, (event, data) => {
              console.log('[WatchPlayer] Key loaded OK');
            });

            hls.on(Hls.Events.ERROR, function (event, data) {
              // Log ALL errors (including non-fatal) for diagnostics
              console.warn('[WatchPlayer] HLS Error:', data.type, data.details, 'fatal:', data.fatal,
                data.frag ? `frag:${data.frag.sn} url:${data.frag.url?.substring(0, 120)}` : '',
                data.response ? `status:${data.response.code}` : '',
                data.reason || '');

              if (data.fatal) {

                // If video has buffer, let it play through
                if (!video.paused && video.readyState >= 2) {
                  clearLoading(art);
                  return;
                }

                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    networkRetryCount.current++;
                    if (networkRetryCount.current <= 5) {
                      hls.startLoad();
                      clearLoading(art);
                    } else {
                      if (onError) onError(url, 'network');
                    }
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    hls.destroy();
                    break;
                }
              }
            });

            // Clear loading on progress signals
            art.on('video:playing', () => clearLoading(art));
            art.on('video:canplay', () => clearLoading(art));
            art.on('video:canplaythrough', () => clearLoading(art));
            art.on('video:seeked', () => clearLoading(art));

            hls.on(Hls.Events.BUFFER_APPENDED, () => {
              if (!video.paused) clearLoading(art);
            });

            hls.on(Hls.Events.FRAG_LOADED, () => {
              if (!video.paused) clearLoading(art);
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          } else {
            art.notice.show = 'Unsupported format: m3u8';
          }
        }
      }
    })

    // ── Debounced waiting handler ──
    art.on('video:waiting', () => {
      if (art.loading) art.loading.show = false;
      showLoadingDebounced(art);
    });

    // --- Event Listeners ---

    art.on('video:ended', () => {
      const resumeKey = `aniempire-resume-${malId || 'unknown'}-${currentEp || '1'}`;
      localStorage.removeItem(resumeKey);
      if (onVideoEnd) onVideoEnd();
    });

    art.on('video:play', () => {
      if (art.poster) art.poster = '';
      if (art.hls) art.hls.startLoad();
      clearLoading(art);

      // Eager prefetch next episode as soon as this one successfully starts playing
      if (art.shouldPrefetchNext) {
        art.shouldPrefetchNext();
      }
    });

    art.on('video:pause', () => {
      clearLoading(art);
    });

    art.on('video:timeupdate', () => {
      const currentTime = art.currentTime;
      const duration = art.duration;

      clearLoading(art);

      // Removed manual frozen frame detection to prevent aggressive transmuxer flushing during normal buffering

      if (duration > 0 && (currentTime / duration > 0.8 || (duration - currentTime < 120))) {
        // Moved to video:play for earlier execution
      }

      // Skip logic
      const currentSkips = skipsRef.current;
      const isIntro = currentSkips?.intro?.start && currentSkips?.intro?.end && currentTime >= currentSkips.intro.start && currentTime <= currentSkips.intro.end;
      const isOutro = currentSkips?.outro?.start && currentSkips?.outro?.end && currentTime >= currentSkips.outro.start && currentTime <= currentSkips.outro.end;

      let skipType = null;
      let targetTime = null;

      if (isIntro) {
        if (autoSkipRef.current) {
          art.currentTime = currentSkips.intro.end;
          art.notice.show = 'Skipped Intro';
        } else {
          skipType = 'Intro';
          targetTime = currentSkips.intro.end;
        }
      } else if (isOutro) {
        if (autoSkipRef.current) {
          art.currentTime = currentSkips.outro.end;
          art.notice.show = 'Skipped Outro';
        } else {
          skipType = 'Outro';
          targetTime = currentSkips.outro.end;
        }
      }

      // Manual skip button overlay
      if (art?.template?.$player) {
        let btn = art.template.$player.querySelector('.manual-skip-btn');
        if (skipType) {
          if (!btn) {
            btn = document.createElement('div');
            btn.className = 'manual-skip-btn';
            art.template.$player.appendChild(btn);
          }
          btn.innerHTML = `Skip ${skipType} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>`;
          btn.style.display = 'flex';
          btn.onclick = () => {
            art.currentTime = targetTime;
            btn.style.display = 'none';
          };
        } else {
          if (btn) btn.style.display = 'none';
        }
      }

      // Save time for resume logic
      if (currentTime > 10 && duration > 0 && duration - currentTime > 10) {
        const resumeKey = `aniempire-resume-${malId || 'unknown'}-${currentEp || '1'}`;
        localStorage.setItem(resumeKey, currentTime.toString());
      }
    });

    art.on('video:ended', () => { if (onVideoEnd) onVideoEnd() })

    art.on('ready', () => {
      // Check for resume time
      const resumeKey = `aniempire-resume-${malId || 'unknown'}-${currentEp || '1'}`;
      const savedTime = parseFloat(localStorage.getItem(resumeKey));

      if (savedTime > 10) {
        const mins = Math.floor(savedTime / 60);
        const secs = Math.floor(savedTime % 60);
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Show notice for 10 seconds as requested
        // ArtPlayer notice.show is a property setter, not a function.
        art.notice.show = `Resume playback at ${timeStr}? Click to jump.`;
        setTimeout(() => { try { art.notice.show = ''; } catch (e) {} }, 10000);

        // Add a one-time click listener to the notice area to trigger the seek
        const noticeEl = art.template?.$player; // Use the player container
        if (noticeEl) {
          const handleNoticeClick = (e) => {
            // Only handle clicks that originate from the notice element itself
            if (!e.target.closest('.art-notice')) return;
            art.currentTime = savedTime;
            art.notice.show = `Resumed to ${timeStr}`;
            noticeEl.removeEventListener('click', handleNoticeClick);
          };
          noticeEl.addEventListener('click', handleNoticeClick);
          // Cleanup listener if notice expires
          setTimeout(() => noticeEl.removeEventListener('click', handleNoticeClick), 10000);
        }
      }

      if (autoPlay) {
        setTimeout(() => {
          if (instanceRef.current) {
            instanceRef.current.play().catch(() => { });
          }
        }, 100);
      }
    })

    instanceRef.current = art
    if (onReady) onReady(art)

    // Fast watchdog
    const watchdog = setInterval(() => {
      if (instanceRef.current && instanceRef.current.video) {
        const v = instanceRef.current.video;
        if (!v.paused && !v.ended && v.readyState >= 2 && instanceRef.current.loading.show) {
          clearLoading(instanceRef.current);
        }
      }
    }, 500);

    // ── CLEANUP: Nuclear destruction of all media ──
    return () => {
      if (watchdog) clearInterval(watchdog);
      if (loadingDebounceRef.current) clearTimeout(loadingDebounceRef.current);
      // 1. Force exit PiP if active
      try {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(() => { });
        }
      } catch (e) { /* ignore */ }

      // 2. Destroy HLS via the ref (survives even if instanceRef was cleared)
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (e) { /* ignore */ }
        hlsRef.current = null;
      }

      // 2. Destroy the Artplayer instance
      if (instanceRef.current) {
        const inst = instanceRef.current;
        // Kill the video element's media stream
        if (inst.video) {
          inst.video.muted = true;
          inst.video.volume = 0;
          inst.video.pause();
          if (inst.video.src && inst.video.src.startsWith('blob:')) {
            URL.revokeObjectURL(inst.video.src);
          }
          inst.video.src = '';
          inst.video.removeAttribute('src');
          inst.video.load();
          inst.video.remove();
        }
        // Destroy HLS attached to art (in case it's different from hlsRef)
        if (inst.hls) {
          try { inst.hls.destroy(); } catch (e) { /* ignore */ }
          inst.hls = null;
        }
        inst.destroy(true);
        instanceRef.current = null;
      }

      // 3. Final sweep: kill ANY orphaned video elements in the container
      nukeVideosInContainer(artRef.current);
    }
  }, []) // Initialize once

  // 2. Handle URL/Source Changes
  useEffect(() => {
    if (instanceRef.current && url) {
      if (instanceRef.current.url !== url) {
        console.log('[WatchPlayer] Switching URL to:', url)
        const type = url.includes('m3u8') ? 'm3u8' : 'mp4';
        instanceRef.current.type = type;
        instanceRef.current.switchUrl(url);
      }
    }
  }, [url])

  // 3. Handle Poster Changes
  useEffect(() => {
    if (instanceRef.current && poster) {
      instanceRef.current.poster = poster;
    }
  }, [poster])

  // 4. Sync context menu toggle labels when autoPlay/autoNext/autoSkip state changes
  useEffect(() => {
    const art = instanceRef.current;
    if (!art) return;

    // Artplayer's contextmenu is a plugin object, not a DOM element.
    // The actual DOM lives inside art.template.$contextmenu or we can query the container.
    const contextEl = art.template?.$contextmenu || artRef.current?.querySelector('.art-contextmenus');
    if (!contextEl) return;

    const menuItems = contextEl.querySelectorAll('.art-contextmenu a, .art-contextmenu span, .art-contextmenu div');
    if (!menuItems || menuItems.length === 0) return;

    const labels = [
      { match: 'Auto Play', value: autoPlay },
      { match: 'Auto Next', value: autoNext },
      { match: 'Auto Skip', value: autoSkip },
    ];

    menuItems.forEach(item => {
      for (const label of labels) {
        if (item.textContent.includes(label.match)) {
          const color = label.value ? '#D4A843' : '#888';
          const text = label.value ? 'ON' : 'OFF';
          item.innerHTML = `${label.match}: <span style="color: ${color}; font-weight: bold;">${text}</span>`;
          break;
        }
      }
    });
  }, [autoPlay, autoNext, autoSkip])

  // 5. Draw skip highlights on the timeline
  useEffect(() => {
    const art = instanceRef.current;
    if (!art) return;

    const drawHighlights = () => {
      const container = art.template?.$progress;
      if (!container) return;

      const duration = art.duration;
      if (!duration || duration <= 0) return;

      const existing = container.querySelectorAll('.ani-skip-highlight');
      existing.forEach(el => el.remove());

      const addHighlight = (start, end, label) => {
        if (!start || !end || start >= end || end > duration) return;
        const hl = document.createElement('div');
        hl.className = 'ani-skip-highlight';
        hl.style.left = `${(start / duration) * 100}%`;
        hl.style.width = `${((end - start) / duration) * 100}%`;
        hl.setAttribute('data-label', label);
        container.appendChild(hl);
      };

      if (skips?.intro) addHighlight(skips.intro.start, skips.intro.end, 'Opening');
      if (skips?.outro) addHighlight(skips.outro.start, skips.outro.end, 'Ending');
    };

    drawHighlights();

    art.on('video:durationchange', drawHighlights);
    art.on('video:loadedmetadata', drawHighlights);
    
    return () => {
      art.off('video:durationchange', drawHighlights);
      art.off('video:loadedmetadata', drawHighlights);
    };
  }, [skips, url]);

  if (!url) return null;

  return <div ref={artRef} className="watch-player-container" />
}

/* ─── Next Airing Countdown ─────────────────────────────────── */
function NextAiringBanner({ data }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!data?.airingAt) return
    const calc = () => {
      const diff = data.airingAt - Math.floor(Date.now() / 1000)
      if (diff <= 0) return 'Airing Now!'
      const d = Math.floor(diff / 86400)
      const h = Math.floor((diff % 86400) / 3600)
      const m = Math.floor((diff % 3600) / 60)
      let s = ''
      if (d > 0) s += `${d}d `
      if (h > 0) s += `${h}h `
      s += `${m}m`
      return s
    }
    setTimeLeft(calc())
    const t = setInterval(() => setTimeLeft(calc()), 60000)
    return () => clearInterval(t)
  }, [data])

  if (!data?.airingAt) return null

  return (
    <div className="watch-airing-banner">
      <span className="watch-airing-banner__dot" />
      <span className="watch-airing-banner__label">NEXT EPISODE</span>
      <span className="watch-airing-banner__ep">EP {data.episode}</span>
      <span className="watch-airing-banner__sep">•</span>
      <span className="watch-airing-banner__time">{timeLeft}</span>
    </div>
  )
}

/* ─── Episode Sidebar ───────────────────────────────────────── */
function EpisodeSidebar({ episodes, currentEp, totalEpisodes, onSelect }) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const gridRef = useRef(null)

  // Create a lookup map for episodes to avoid .find() in the loop
  const episodeMap = episodes.reduce((acc, ep) => {
    const num = ep.mal_id || parseInt(ep.number);
    if (num) acc[num] = ep;
    return acc;
  }, {});

  const CHUNK = 100
  const total = totalEpisodes || 1
  const totalPages = Math.ceil(total / CHUNK)

  useEffect(() => {
    const correct = Math.floor((currentEp - 1) / CHUNK)
    if (correct !== page && correct < totalPages) setPage(correct)
  }, [currentEp])

  // Scroll active episode into view
  useEffect(() => {
    if (!gridRef.current) return
    const active = gridRef.current.querySelector('.ep-num-btn.active')
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentEp, page])

  const start = page * CHUNK + 1
  const end = Math.min((page + 1) * CHUNK, total)

  // If searching, search across all possible episode numbers
  // Otherwise, only show numbers in the current range
  let displayedNums = []
  if (search.trim()) {
    const searchTerm = search.trim()
    for (let i = 1; i <= total; i++) {
      if (String(i).includes(searchTerm)) {
        displayedNums.push(i)
      }
    }
  } else {
    for (let i = start; i <= end; i++) {
      displayedNums.push(i)
    }
  }

  const handleSelect = (num) => {
    // If we are searching and click an episode, ensure we update the page to match that episode's range
    const targetPage = Math.floor((num - 1) / CHUNK)
    if (targetPage !== page) setPage(targetPage)
    onSelect(num)
  }

  const handleJump = (num) => {
    setPage(Math.floor((num - 1) / CHUNK))
    onSelect(num)
  }

  return (
    <div className="ep-sidebar">
      <div className="ep-sidebar__head">
        <div className="ep-sidebar__title">
          <h3>Episodes</h3>
          <span className="ep-sidebar__badge">{total}</span>
        </div>
        <div className="ep-sidebar__controls">
          {totalPages > 1 && (
            <div className="ep-range-select-wrap">
              <select
                className="ep-range-select"
                value={page}
                onChange={e => setPage(parseInt(e.target.value))}
              >
                {Array.from({ length: totalPages }, (_, i) => {
                  const start = i * CHUNK + 1
                  const end = Math.min((i + 1) * CHUNK, total)
                  return (
                    <option key={i} value={i}>
                      {start}–{end}
                    </option>
                  )
                })}
              </select>
              <IconChevron size={14} className="ep-range-chevron" />
            </div>
          )}
          <div className="ep-sidebar__search">
            <IconSearch size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="ep-sidebar__grid" ref={gridRef}>
        {displayedNums.map(num => {
          const ep = episodeMap[num]
          return (
            <button
              key={num}
              className={`ep-num-btn ${num === currentEp ? 'active' : ''} ${ep?.filler ? 'filler' : ''}`}
              onClick={() => handleSelect(num)}
              title={ep?.title || `Episode ${num}`}
            >
              {num}
            </button>
          )
        })}
        {displayedNums.length === 0 && (
          <p className="ep-sidebar__empty">No match</p>
        )}
      </div>
    </div>
  )
}

/* ─── Embed Player Component ────────────────────────────────── */
function IframeEmbed({ url, epNum, language }) {
  const iframeRef = useRef(null)
  const [embedFailed, setEmbedFailed] = useState(false)

  return (
    <div className="megaplay-embed-wrap">
      <iframe
        ref={iframeRef}
        key={`${url}-${epNum}-${language}`}
        src={url}
        className="megaplay-embed-iframe"
        frameBorder="0"
        scrolling="no"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        onError={() => setEmbedFailed(true)}
      />
      {embedFailed && (
        <div className="megaplay-embed-notice">
          <span>⚠ This title may not be available on MegaPlay yet.</span>
          <a href="https://megaplay.buzz/api#contact" target="_blank" rel="noopener noreferrer" className="megaplay-embed-notice__link">Request it here →</a>
        </div>
      )}
    </div>
  )
}

/* ─── Main Watch Page ───────────────────────────────────────── */
export default function WatchPage({ slugProp, initialSearch, isMinimized, onClose, onExpand, onMinimize, onMetadataChange }) {
  const params = useParams()
  const slug = slugProp || params.slug
  const [searchParams, setSearchParams] = useSearchParams()
  const malId = parseDetailSlug(slug)

  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [episodesPagination, setEpisodesPagination] = useState(null)

  // Parse episode from URL
  const getEpFromUrl = () => parseInt(new URLSearchParams(initialSearch || searchParams.toString()).get('ep')) || 1
  const [currentEp, setCurrentEp] = useState(getEpFromUrl())
  const [maxEpisodesSeen, setMaxEpisodesSeen] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeMetadata, setActiveMetadata] = useState({ title: '', subtitle: '' })
  const [providers, setProviders] = useState([])
  const [activeProvider, setActiveProvider] = useState(null)
  const activeProviderRef = useRef(null)
  useEffect(() => {
    activeProviderRef.current = activeProvider
  }, [activeProvider])
  const [servers, setServers] = useState([])
  const [activeServer, setActiveServer] = useState(null)
  const [category, setCategory] = useState(localStorage.getItem('preferredCategory') || 'sub')
  const [videoUrl, setVideoUrl] = useState('') // Also mirrored in videoUrlRef below
  const [embedUrl, setEmbedUrl] = useState('')
  const [videoSources, setVideoSources] = useState([])
  const [subtitles, setSubtitles] = useState([])
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceError, setSourceError] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [allDownloads, setAllDownloads] = useState([])
  const [episodeMapping, setEpisodeMapping] = useState(null)
  const [prefetchedData, setPrefetchedData] = useState(null)
  const [isPollingProviders, setIsPollingProviders] = useState(false)
  const prefetchTriggered = useRef(false)
  const pollCountRef = useRef(0)
  const pollIntervalRef = useRef(null)

  const [artInstance, setArtInstance] = useState(null)
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem('aniempire-autoplay') !== 'false')
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem('aniempire-autonext') !== 'false')
  const [autoSkip, setAutoSkip] = useState(() => localStorage.getItem('aniempire-autoskip') !== 'false')
  const [skips, setSkips] = useState({ intro: null, outro: null })
  const [lightsOut, setLightsOut] = useState(false)
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  const [relations, setRelations] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [expandedRelations, setExpandedRelations] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})

  const toggleExpandItem = (idx) => {
    setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const playerAreaRef = useRef(null)
  const directFallbackAttempted = useRef(false)
  const sourceRequestId = useRef(0)
  // Track current videoUrl/embedUrl in refs so async callbacks (loadEpisodeSources, applyWatchData)
  // can check if a video is already playing without depending on stale closure state.
  const videoUrlRef = useRef('')
  const embedUrlRef = useRef('')
  // Keep refs in sync with state so async callbacks can read the
  // latest value without depending on a potentially-stale closure.
  useEffect(() => { videoUrlRef.current = videoUrl }, [videoUrl])
  useEffect(() => { embedUrlRef.current = embedUrl }, [embedUrl])

  // Persist settings
  useEffect(() => { localStorage.setItem('aniempire-autoplay', autoPlay) }, [autoPlay])
  useEffect(() => { localStorage.setItem('aniempire-autonext', autoNext) }, [autoNext])
  useEffect(() => { localStorage.setItem('aniempire-autoskip', autoSkip) }, [autoSkip])
  const watchDataCache = useRef({})
  const providerSkipsRef = useRef({ intro: null, outro: null })

  const displayTotal = useMemo(() => {
    const lastMetadataEp = episodes.length > 0 ? Math.max(...episodes.map(e => parseInt(e.mal_id || e.number) || 0)) : 0;
    const jikanTotalHint = episodesPagination?.items?.total || ((episodesPagination?.last_visible_page || 1) * (episodes.length || 100));

    let total = 0;
    if (anime?.episodes && anime.episodes > 0) {
      total = anime.episodes;
    } else if (episodeMapping?.total_episodes && episodeMapping.total_episodes > 0) {
      total = episodeMapping.total_episodes;
    } else if (episodesPagination?.items?.total && episodesPagination.items.total > 0) {
      total = episodesPagination.items.total;
    } else {
      total = Math.max(jikanTotalHint, lastMetadataEp, maxEpisodesSeen);
    }
    return Math.max(total, lastMetadataEp);
  }, [anime, episodes, episodeMapping, episodesPagination, maxEpisodesSeen]);

  useEffect(() => {
    if (displayTotal > maxEpisodesSeen && displayTotal < 10000) {
      setMaxEpisodesSeen(displayTotal);
    }
  }, [displayTotal, maxEpisodesSeen]);

  // Fallback: When the proxy fails (DDoS-Guard), try the direct CDN URL
  const handlePlayerError = (failedUrl, errorType) => {
    if (sourceLoading || !videoUrl) {
      console.log('[WatchPage] Ignoring player error because we are actively loading or url is empty');
      return;
    }
    if (directFallbackAttempted.current || errorType !== 'network') return;
    directFallbackAttempted.current = true;
    console.warn('[WatchPage] Proxy playback failed, attempting direct URL fallback...');
    const currentSource = videoSources.find(s => s.url === failedUrl);
    const directUrl = currentSource?.originalUrl;
    if (directUrl && directUrl !== failedUrl && directUrl.includes('.m3u8')) {
      console.log('[WatchPage] Switching to direct URL:', directUrl);
      setVideoUrl(directUrl);
    } else {
      // Try switching to a different provider if available
      const nextProv = providers.find(p => p.provider !== activeProvider?.provider);
      if (nextProv) {
        console.log('[WatchPage] Trying alternate provider:', nextProv.provider);
        handleProviderSwitch(nextProv);
      } else {
        setSourceError('Video source is currently unavailable. Try a different server or provider.');
      }
    }
  }

  // Clear cache when navigating to a new anime
  useEffect(() => {
    watchDataCache.current = {}
  }, [malId])

  // Sync currentEp from URL when props change
  useEffect(() => {
    const newEp = getEpFromUrl()
    if (newEp !== currentEp) {
      setCurrentEp(newEp)
    }
  }, [initialSearch])

  /* ── Load anime data ── */
  useEffect(() => {
    if (!slug) return
    const loadCritical = async () => {
      setLoading(true)
      try {
        // Stage 1: Critical data needed for player and sidebar
        let detail = null;
        let epsData = null;
        try {
          const [d, e] = await Promise.all([
            getAnimeDetail(malId),
            getAnimeEpisodes(malId, 1)
          ]);
          detail = d;
          epsData = e;
        } catch (jikanErr) {
          console.warn('[WatchPage] Jikan metadata fetch failed, using fallback:', jikanErr);
        }

        if (!detail) {
          const fallbackTitle = slug ? slug.split('.')[0].replace(/-/g, ' ') : 'Unknown Anime';
          detail = {
            mal_id: malId,
            title: fallbackTitle,
            title_english: fallbackTitle,
            episodes: 999,
          };
        }

        setAnime(detail)
        setEpisodes(epsData?.episodes || [])
        setEpisodesPagination(epsData?.pagination || null)
        document.title = `Watch ${detail.title_english || detail.title} — Episode ${currentEp} — AniEmpire`

        setLoading(false)

        // Stage 2: Staggered fetch for non-critical content to avoid Jikan rate limits
        setTimeout(async () => {
          try {
            const rels = await getAnimeRelations(malId)
            setRelations(rels || [])

            // Further delay for recommendations
            setTimeout(async () => {
              const recs = await getAnimeDetailRecommendations(malId)
              setRecommendations(recs || [])
            }, 1000)
          } catch (err) {
            console.warn('[WatchPage] Background load error:', err)
          }
        }, 1500)

      } catch (err) {
        console.error('[WatchPage] Critical load error:', err)
        setError('An unexpected error occurred.')
        setLoading(false)
      }
    }
    loadCritical()
  }, [malId, slug])

  useEffect(() => {
    if (isMinimized && lightsOut) {
      setLightsOut(false)
    }
  }, [isMinimized, lightsOut])

  useEffect(() => {
    if (!malId || loading) return

    if (displayTotal > 0 && currentEp > displayTotal) {
      setSourceError('invalid_episode');
      setSourceLoading(false);
      return;
    }

    prefetchTriggered.current = false;
    directFallbackAttempted.current = false;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    loadEpisodeSources(currentEp)

    // Fetch community skip times from AniSkip (non-blocking)
    const numericMalId = parseInt(malId);
    if (!isNaN(numericMalId) && numericMalId > 0) {
      getAniSkipTimes(numericMalId, currentEp).then(aniSkip => {
        if (aniSkip.intro || aniSkip.outro) {
          console.log('[WatchPage] AniSkip data found:', aniSkip);
          setSkips(prev => ({
            // AniSkip takes priority when available, fall back to provider data
            intro: aniSkip.intro || prev.intro || providerSkipsRef.current.intro,
            outro: aniSkip.outro || prev.outro || providerSkipsRef.current.outro
          }));
        }
      });
    }

    const handleKeyDown = (e) => {
      if (isMinimized) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'i' || e.key === 'I') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (onMinimize) onMinimize()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentEp, malId, onMinimize, loading, displayTotal])

  const startProviderPoll = (epNum) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollCountRef.current = 0;

    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current++;
      if (pollCountRef.current > 3 || window.location.pathname.indexOf(slug) === -1) {
        clearInterval(pollIntervalRef.current);
        setIsPollingProviders(false);
        return;
      }

      try {
        const prefProv = localStorage.getItem('preferredProvider') || 'animepahe';
        const prefCat = localStorage.getItem('preferredCategory') || 'sub';
        const fallbackTitle = slug ? slug.split('.')[0] : '';
        const data = await getEpisodeWatchData(malId, epNum, prefProv, prefCat, fallbackTitle, true);

        if (data && !data.error && data.episode_mappings?.available_providers) {
          const newProviders = data.episode_mappings.available_providers;
          setProviders(newProviders);

          // Auto-switch to preferred provider if it becomes available and we are currently on a non-preferred one
          if (newProviders.length > 0) {
            const hasPref = newProviders.find(p => p.provider === prefProv);
            if (hasPref && activeProviderRef.current?.provider !== prefProv) {
              console.log(`[WatchPage] Polling found preferred provider (${prefProv}), auto-switching.`);
              handleProviderSwitch(hasPref);
            }
          }

          if (!data.episode_mappings.is_resolving || newProviders.length >= 2) {
            clearInterval(pollIntervalRef.current);
            setIsPollingProviders(false);

            // Update cache silently
            const oldCache = watchDataCache.current[epNum];
            if (oldCache) {
              oldCache.episode_mappings = data.episode_mappings;
            }
          }
        }
      } catch (e) { }
    }, 4000);
  }

  const loadEpisodeSources = async (epNum, forceFetch = false) => {
    const requestId = ++sourceRequestId.current;

    // Check cache first
    const cachedData = watchDataCache.current[epNum];
    const prefProv = localStorage.getItem('preferredProvider');
    const prefCat = localStorage.getItem('preferredCategory') || 'sub';

    if (!forceFetch && cachedData) {
      const cachedProviders = cachedData.episode_mappings?.available_providers?.length || 0;
      const wasIncomplete = cachedData.episode_mappings?.is_resolving || cachedProviders < 2;

      console.log(`[WatchPage] Using cached data for ep ${epNum} (providers: ${cachedProviders}, wasIncomplete: ${wasIncomplete})`);
      setSourceError(null);

      // ── SWITCHBACK GUARD ──────────────────────────────────────────────────────
      // If the video is already playing (videoUrlRef has a value), this call was
      // triggered by a secondary dep change (e.g. displayTotal/episodeMapping)
      // rather than a genuine episode navigation. Re-applying watch data would
      // reset the active provider to the mapping default and cause a switchback.
      // In this case, just silently refresh the providers list and bail out.
      if (videoUrlRef.current || embedUrlRef.current) {
        console.log(`[WatchPage] Video/embed already playing for ep ${epNum}, skipping re-apply to prevent switchback.`);
        if (cachedData.episode_mappings?.available_providers) {
          setProviders(cachedData.episode_mappings.available_providers);
        }
        setSourceLoading(false);
        return;
      }
      // ─────────────────────────────────────────────────────────────────────────

      await applyWatchData(cachedData, requestId);
      setSourceLoading(false);

      // If the cached data was incomplete, silently re-fetch in the background to update providers
      if (wasIncomplete) {
        const fallbackTitle = slug ? slug.split('.')[0] : '';
        getEpisodeWatchData(malId, epNum, prefProv, prefCat, fallbackTitle).then(freshData => {
          if (freshData && !freshData.error && freshData.episode_mappings?.available_providers) {
            const freshProviders = freshData.episode_mappings.available_providers.length;
            if (freshProviders > cachedProviders) {
              console.log(`[WatchPage] Background refresh found ${freshProviders} providers (was ${cachedProviders}), updating.`);
              watchDataCache.current[epNum] = freshData;
              setProviders(freshData.episode_mappings.available_providers);
            }
          }
        }).catch(() => {});
      }
      return;
    }

    setSourceLoading(true); setSourceError(null); setVideoUrl(''); setEmbedUrl(''); setVideoSources([]); setServers([]); setProviders([]); setDownloadUrl(null); setAllDownloads([]); setSubtitles([]); setSkips({ intro: null, outro: null }); providerSkipsRef.current = { intro: null, outro: null };
    try {
      // Pass slug-derived title as fallback in case Jikan and DB are both down
      const fallbackTitle = slug ? slug.split('.')[0] : '';
      console.log(`[WatchPage] Fetching watch data for ep ${epNum}...`);
      const data = await getEpisodeWatchData(malId, epNum, prefProv, prefCat, fallbackTitle);

      if (data && !data.error) {
        watchDataCache.current[epNum] = data;
        if (data.episode_mappings?.is_resolving) {
          setIsPollingProviders(true);
          startProviderPoll(epNum);
        } else {
          setIsPollingProviders(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      }

      if (requestId !== sourceRequestId.current) return;

      if (!data || data.error) {
        // Fallback to old sequential method if unified endpoint fails
        console.warn('[WatchPage] Unified endpoint failed, falling back to sequential fetch...');
        return loadEpisodeSourcesSequential(epNum, requestId);
      }

      await applyWatchData(data, requestId);
      if (requestId === sourceRequestId.current) setSourceLoading(false);
    } catch (err) {
      if (requestId !== sourceRequestId.current) return;
      console.error('[WatchPage] Source error:', err);
      setSourceError('Failed to load sources.');
      setSourceLoading(false);
    }
  }

  const applyWatchData = async (data, requestId) => {
    const mapping = data.episode_mappings;

    // Structural data (providers/mapping) should be applied if it matches the current episode
    // even if the specific source request is "stale" due to a fast click.
    if (mapping && parseInt(mapping.number || mapping.episode_number || currentEp) === currentEp) {
      if (mapping.available_providers) setProviders(mapping.available_providers);
      setEpisodeMapping(mapping);
    }

    if (requestId && requestId !== sourceRequestId.current) return;

    const avail = mapping?.available_providers || [];
    // ── PRESERVE USER CHOICE ─────────────────────────────────────────────────
    // If the user has already switched to a provider (tracked in activeProviderRef
    // and persisted in localStorage), honour that choice instead of resetting to
    // the mapping's default provider (which caused the "switchback" bug).
    const userPrefProvider = activeProviderRef.current?.provider || localStorage.getItem('preferredProvider');
    const currentProv =
      (userPrefProvider ? avail.find(p => p.provider === userPrefProvider) : null) ||
      avail.find(p => p.provider === mapping?.provider) ||
      avail[0];
    // ─────────────────────────────────────────────────────────────────────────
    setActiveProvider(currentProv);

    // If the selected provider is an embed type (e.g. MegaPlay), skip server loading
    if (currentProv?.is_embed) {
      setServers([]);
      setActiveServer(null);
      // Always fetch fresh embed URL — ignore data.sources which may be from a different provider
      await loadVideoSource(currentProv.episode_id, `${currentProv.provider}-${category}`, category, currentProv.provider, currentProv.anime_id);
      return;
    }

    // Handle servers
    if (data.servers) {
      let serverList = [];
      if (data.servers.sub) {
        serverList = [...(data.servers.sub || []).map(s => ({ ...s, cat: 'sub' })), ...(data.servers.dub || []).map(s => ({ ...s, cat: 'dub' }))];
      } else if (Array.isArray(data.servers)) {
        serverList = data.servers.map(s => ({ ...s, cat: s.cat || 'sub' }));
      }
      setServers(serverList);

      const targetCat = localStorage.getItem('preferredCategory') || serverList[0]?.cat || 'sub';
      setCategory(targetCat);

      if (data.sources) {
        console.log('[WatchPage] Using pre-fetched sources');
        // Ensure we pick the server object from our local serverList to maintain reference integrity if possible,
        // or fallback to a robust comparison in the UI.
        const matchingServer = data.sources.activeServer ?
          serverList.find(s => (s.serverId === data.sources.activeServer.serverId || s.id === data.sources.activeServer.id || s.name === data.sources.activeServer.name) && s.cat === targetCat) :
          null;

        const finalServer = matchingServer || serverList.find(s => s.cat === targetCat) || serverList[0];
        setActiveServer(finalServer);
        // Force category sync if requested preference is missing
        if (finalServer && finalServer.cat !== targetCat) setCategory(finalServer.cat);
        processSources(data.sources, mapping.provider, finalServer?.cat || targetCat);
      } else {
        const preferred = serverList.find(s => s.cat === targetCat) || serverList[0];
        if (preferred) {
          setActiveServer(preferred);
          // Force category sync if requested preference is missing
          if (preferred.cat !== targetCat) setCategory(preferred.cat);
          const sId = preferred.serverId || preferred.id || preferred.name;
          await loadVideoSource(mapping.episode_id, sId, preferred.cat, mapping.provider, mapping.anime_id, data.title || anime?.title || slug.split('.')[0].replace(/-/g, ' '), currentEp);
        }
      }
    } else {
      setSourceError('No streaming servers available.');
    }
  }

  const prefetchNextEpisode = async () => {
    if (prefetchTriggered.current || !hasNext || !malId) return;
    const nextEp = currentEp + 1;
    prefetchTriggered.current = true;
    console.log('[WatchPage] Prefetching next episode:', nextEp);

    try {
      const prefProv = localStorage.getItem('preferredProvider');
      const prefCat = localStorage.getItem('preferredCategory') || 'sub';
      const data = await getEpisodeWatchData(malId, nextEp, prefProv, prefCat);
      if (data && !data.error) {
        setPrefetchedData({ epNum: nextEp, data });
        console.log('[WatchPage] Prefetch successful for ep', nextEp);
      }
    } catch (err) {
      console.warn('[WatchPage] Prefetch failed:', err);
    }
  }

  const loadEpisodeSourcesSequential = async (epNum, requestId) => {
    try {
      const data = await getEpisodeSources(malId, epNum)
      if (requestId && requestId !== sourceRequestId.current) return;
      if (!data || data.error) {
        setSourceError(data?.error || 'No sources found.');
        setSourceLoading(false);
        return
      }

      const mapping = data.episode_mappings || data
      setEpisodeMapping(mapping)
      const avail = [...(mapping.available_providers || [])]

      if (avail.length === 0 && (mapping.provider || mapping.episode_id)) {
        avail.push({
          provider: mapping.provider || 'animepahe',
          episode_id: mapping.episode_id,
          anime_id: mapping.anime_id
        })
      }

      setProviders(avail)

      if (avail.length > 0) {
        const prefProv = localStorage.getItem('preferredProvider');
        const first = avail.find(p => p.provider === prefProv) || avail[0];
        setActiveProvider(first)
        await loadServers(first.episode_id, first.provider, first.anime_id)
      } else {
        setSourceError('No streaming providers available.');
        setSourceLoading(false)
      }
    } catch (err) {
      console.error('[WatchPage] Sequential fallback error:', err);
      setSourceError('Failed to load sources.');
      setSourceLoading(false);
    }
  }

  const processSources = (data, provider, cat) => {
    let url = ''
    let finalSources = []

    const proxyBase = import.meta.env.VITE_PROXY_URL || ''
    const katalystBase = proxyBase.replace(/\/api\/proxy\/?$/, '')
    const proxyPrefix = katalystBase ? `${katalystBase}/api/stream/m3u8/video.m3u8` : '/api/stream/m3u8/video.m3u8'

    if (data.sources && Array.isArray(data.sources)) {
      finalSources = data.sources.map(s => {
        let sourceUrl = s.url || s.file || '';
        const targetEmbed = s.embed || '';
        if (sourceUrl && (sourceUrl.includes('.m3u8') || s.isM3U8)) {
          let pUrl = `${proxyPrefix}?url=${encodeURIComponent(sourceUrl)}&proxySegments=true`;

          if (targetEmbed) {
            pUrl += `&referrer=${encodeURIComponent(targetEmbed)}`;
          }
          sourceUrl = pUrl;
        }
        const isDef = s.quality === 'auto' || s.quality === '1080p';
        return { ...s, url: sourceUrl, originalUrl: (s.url || s.file || ''), isDefault: isDef };
      });

      // Prioritize sources matching the requested category
      let pool = finalSources.filter(s => {
        if (cat === 'dub') return s.isDub === true;
        return s.isDub !== true;
      });

      if (pool.length === 0) pool = finalSources;

      // Retrieve preferred quality from localStorage
      const prefQuality = localStorage.getItem('preferredQuality');

      // Re-calculate default within this pool
      let defFound = false;
      pool.forEach(s => {
        let sLabel = s.quality || '';
        if (/^\d+$/.test(sLabel)) sLabel += 'p';

        const isDef = prefQuality
          ? (sLabel === prefQuality || sLabel.toLowerCase().includes(prefQuality.toLowerCase()))
          : (s.quality === 'auto' || s.quality === '1080p');

        if (isDef && !defFound) {
          s.isDefault = true;
          defFound = true;
        } else {
          s.isDefault = false;
        }
      });
      if (!defFound && pool.length > 0) pool[0].isDefault = true;

      const best = pool.find(s => s.isDefault) || pool[0];
      url = best?.url || ''
    } else if (data.url) {
      url = data.url
      if (url) {
        const isM3u8 = url.includes('.m3u8');
        const isSite = url.includes('kwik.cx') || url.includes('animepahe');

        if (isM3u8) {
          url = `${proxyPrefix}?url=${encodeURIComponent(url)}&proxySegments=true`
        } else if (isSite) {
          // Route site-based extraction through Katalyst
          const sitePrefix = katalystBase ? `${katalystBase}/api/stream/site` : '/api/stream/site';
          url = `${sitePrefix}?url=${encodeURIComponent(url)}&proxySegments=true`;
        }
      }
    }

    setVideoUrl(url)
    setVideoSources(finalSources)

    const segmentProxy = katalystBase ? `${katalystBase}/api/stream/segment` : '/api/stream/segment';
    const rawSubtitles = data.subtitles || data.tracks || [];
    const proxiedSubtitles = rawSubtitles.map(sub => {
      const subUrl = sub.url || sub.file;
      if (!subUrl) return sub;
      return { ...sub, url: `${segmentProxy}?url=${encodeURIComponent(subUrl)}`, file: `${segmentProxy}?url=${encodeURIComponent(subUrl)}` };
    });
    setSubtitles(proxiedSubtitles)
    const providerSkips = { intro: data.intro || null, outro: data.outro || null };
    providerSkipsRef.current = providerSkips;
    setSkips(prev => ({
      intro: prev.intro || providerSkips.intro,
      outro: prev.outro || providerSkips.outro
    }))

    let singleDownload = data.download || (url && !url.includes('.m3u8') ? url : null);
    if (singleDownload) setDownloadUrl(singleDownload)
    else setDownloadUrl(null)

    const providerDownloads = [...(data.downloads || [])];
    if (singleDownload && providerDownloads.length === 0) {
      providerDownloads.push({
        url: singleDownload,
        resolution: 'Download',
        isDub: cat === 'dub'
      });
    }

    if (providerDownloads.length > 0) {
      setAllDownloads(prev => {
        const newDownloads = providerDownloads.map(dl => ({ ...dl, provider }))
        // Filter out old downloads from the SAME provider before adding new ones
        const otherProviders = prev.filter(d => d.provider !== provider)
        const combined = [...otherProviders, ...newDownloads]

        const seen = new Set()
        // Reverse and filter so the LATEST entries (from newDownloads) are kept if keys clash
        return combined.reverse().filter(d => {
          const key = `${d.provider}-${d.resolution}-${d.isDub}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        }).reverse()
      })
    }
  }

  const loadServers = async (episodeId, provider, animeId) => {
    const requestId = ++sourceRequestId.current;
    setSourceLoading(true); setSourceError(null); setVideoUrl(''); setEmbedUrl(''); setVideoSources([]);
    if (!episodeId) { setSourceError('Episode not available.'); setSourceLoading(false); return }
    try {
      const data = await getStreamingServers(episodeId, provider)
      if (requestId !== sourceRequestId.current) return;
      if (!data) { setSourceError('No servers found.'); setSourceLoading(false); return }
      let serverList = []
      if (data.sub) {
        serverList = [...(data.sub || []).map(s => ({ ...s, cat: 'sub' })), ...(data.dub || []).map(s => ({ ...s, cat: 'dub' }))]
      } else if (Array.isArray(data)) {
        serverList = data.map(s => ({ ...s, cat: s.cat || 'sub' }))
      }
      else if (data.data) serverList = (Array.isArray(data.data) ? data.data : []).map(s => ({ ...s, cat: s.cat || 'sub' }))

      setServers(serverList)

      const prefCat = localStorage.getItem('preferredCategory') || 'sub';
      const hasPrefCat = serverList.some(s => s.cat === prefCat);
      const targetCat = hasPrefCat ? prefCat : (serverList[0]?.cat || 'sub');
      setCategory(targetCat);

      const hasSub = serverList.some(s => s.cat === 'sub')
      const hasDub = serverList.some(s => s.cat === 'dub')

      let preferred = null;
      const prefServer = localStorage.getItem(`preferredServer_${provider}`);
      if (prefServer) {
        preferred = serverList.find(s => s.cat === targetCat && (s.serverId === prefServer || s.id === prefServer || s.name === prefServer));
      }
      if (!preferred) {
        preferred = serverList.find(s => s.cat === targetCat) || serverList[0];
      }

      if (preferred) {
        setActiveServer(preferred)
        const sId = preferred.serverId || preferred.id || preferred.name
        console.log(`[WatchPage] Loading server: ${preferred.name} (${sId}) for ${provider}`)
        await loadVideoSource(episodeId, sId, preferred.cat || targetCat, provider, animeId, anime.title, currentEp)
      } else {
        // Fallback: Some providers (like AnimeSaturn) don't expose servers but work directly
        console.log(`[WatchPage] No servers found for ${provider}, attempting direct load...`)
        await loadVideoSource(episodeId, null, category, provider, animeId, anime.title, currentEp)
      }
      if (requestId === sourceRequestId.current) setSourceLoading(false);
    } catch (err) {
      if (requestId !== sourceRequestId.current) return;
      console.error('[WatchPage] Server error:', err);
      setSourceError('Failed to load servers.');
      setSourceLoading(false)
    }
  }

  const loadVideoSource = async (episodeId, serverId, category = 'sub', provider = 'animepahe', animeId, title = '', ep = 1) => {
    console.log(`[WatchPage] loadVideoSource(ep:${episodeId}, server:${serverId}, cat:${category}, prov:${provider})`);
    const requestId = ++sourceRequestId.current;
    setSourceLoading(true); setSourceError(null); setVideoUrl(''); setEmbedUrl(''); setVideoSources([]);
    
    try {
      const data = await getStreamingSources(episodeId, serverId, category, provider, animeId, title, ep);
      console.log(`[WatchPage] getStreamingSources result:`, data);
      if (requestId !== sourceRequestId.current) return;
      
      if (data && data.isEmbed) {
        setEmbedUrl(data.embedUrl)
      } else if (data) {
        processSources(data, provider, category);
      } else {
        setSourceError('Failed to load video sources.');
      }
      setSourceLoading(false);
    } catch (err) {
      if (requestId !== sourceRequestId.current) return;
      console.error('[WatchPage] loadVideoSource error:', err);
      setSourceError('An error occurred while loading the video.');
      setSourceLoading(false);
    }
  }

  const goToEp = (num) => {
    setCurrentEp(num)
    if (!isMinimized) {
      setSearchParams({ ep: num })
    }
    playerAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }



  const hasPrev = currentEp > 1
  const hasNext = currentEp < displayTotal

  const handleServerClick = async (server) => {
    setVideoUrl('')
    setEmbedUrl('')
    setVideoSources([])
    setSourceLoading(true)
    setSourceError(null)
    setActiveServer(server)
    const sId = server.serverId || server.id || server.name
    if (activeProvider) {
      localStorage.setItem(`preferredServer_${activeProvider.provider}`, sId)
      await loadVideoSource(activeProvider.episode_id, sId, server.cat || category, activeProvider.provider, activeProvider.anime_id)
    }
  }

  const handleProviderSwitch = async (prov) => {
    setVideoUrl('')
    setEmbedUrl('')
    setVideoSources([])
    setSourceLoading(true)
    setSourceError(null)
    setActiveProvider(prov)
    localStorage.setItem('preferredProvider', prov.provider)

    // Embed providers don't have servers — load the iframe URL directly
    if (prov.is_embed) {
      setServers([])
      setActiveServer(null)
      await loadVideoSource(prov.episode_id, `${prov.provider}-${category}`, category, prov.provider, prov.anime_id)
      return
    }

    // Load servers/sources for the selected provider directly.
    // We already have the episode_id from the providers list, so there's no need
    // to re-fetch the entire episode mapping from the backend.
    await loadServers(prov.episode_id, prov.provider, prov.anime_id)
  }

  const handleCategorySwitch = async (cat) => {
    setVideoUrl('')
    setEmbedUrl('')
    setVideoSources([])
    setSourceLoading(true)
    setSourceError(null)
    setCategory(cat)
    localStorage.setItem('preferredCategory', cat)
    
    if (!activeProvider) return;

    // For embed providers, just reload with the new language
    if (activeProvider.is_embed) {
      await loadVideoSource(activeProvider.episode_id, `${activeProvider.provider}-${cat}`, cat, activeProvider.provider, activeProvider.anime_id)
      return
    }

    // Find a server that matches the new category
    let preferred = servers.find(s => s.cat === cat);

    // If no server found for this category, it might be because the provider 
    // needs a refresh or doesn't have it. We'll try to load sources directly for the category.
    if (activeProvider) {
      if (preferred) {
        setActiveServer(preferred);
        const sId = preferred.serverId || preferred.id || preferred.name;
        await loadVideoSource(activeProvider.episode_id, sId, cat, activeProvider.provider, activeProvider.anime_id);
      } else {
        // Force re-fetch of servers/sources for the new category
        console.log(`[WatchPage] No ${cat} server found, re-fetching for category...`);
        await loadServers(activeProvider.episode_id, activeProvider.provider, activeProvider.anime_id);
      }
    }
  }

  const currentEpData = episodes.find(e => e.mal_id === currentEp)
  const poster = anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url || ''
  const title = anime?.title_english || anime?.title || ''

  useEffect(() => {
    if (anime && onMetadataChange) {
      const newSubtitle = currentEpData?.title || `Episode ${currentEp}`;
      if (activeMetadata.title !== title || activeMetadata.subtitle !== newSubtitle) {
        setActiveMetadata({ title, subtitle: newSubtitle });
        onMetadataChange({ title, subtitle: newSubtitle });
      }
    }
  }, [anime, currentEp, currentEpData, title, onMetadataChange, activeMetadata])

  /* ── Render ── */
  if (loading) return <WatchSkeleton />
  if (error) return (
    <InternetError
      onRetry={() => window.location.reload()}
      title="Playback Error"
      message={error}
    />
  )
  if (!anime) return null

  const animeUrl = generateDetailUrl('anime', title, anime)
  const subServers = servers.filter(s => s.cat === 'sub')
  const dubServers = servers.filter(s => s.cat === 'dub')
  const hasSub = subServers.length > 0
  const hasDub = dubServers.length > 0

  return (
    <div className={`watch-page anim-fade-up ${lightsOut ? 'lights-out' : ''} ${isMinimized ? 'watch-page--minimized' : ''}`} ref={playerAreaRef}>
      {lightsOut && <div className="watch-lights-overlay" onClick={() => setLightsOut(false)} />}

      {/* ── Breadcrumb ── */}
      {!isMinimized && (
        <div className="watch-breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">/</span>
          <Link to={animeUrl}>{title}</Link>
          <span className="sep">/</span>
          <span className="current">{currentEpData?.title || `Episode ${currentEp}`}</span>
        </div>
      )}



      {/* ── Theater: Player + Episode Sidebar ── */}
      <div className="watch-theater-main">
        <div className="watch-theater">
          <div className="watch-theater__player">
            <div className="watch-player-wrap">
              {sourceLoading && sourceError !== 'invalid_episode' ? (
                <div className="watch-player-loading"><div className="watch-spinner" /><p>Loading video source...</p></div>
              ) : sourceError === 'invalid_episode' ? (
                <InternetError
                  title="Episode Not Available"
                  message={`Episode ${currentEp} has not been released or is not available. The latest episode is ${displayTotal}.`}
                  buttonText="Go to Latest Episode"
                  onRetry={() => {
                    setSourceError(null);
                    goToEp(displayTotal);
                  }}
                />
              ) : sourceError && !videoUrl && !embedUrl ? (
                <InternetError
                  title="Source Unavailable"
                  message="We couldn't load the video from this provider. The provider might be down or internet connection issue. Please try again or switching servers or providers."
                  onRetry={() => {
                    setSourceError(null);
                    setSourceLoading(true);
                    loadEpisodeSources(currentEp, true);
                  }}
                />
              ) : embedUrl ? (
                <IframeEmbed url={embedUrl} epNum={currentEp} language={category} />
              ) : (
                <WatchPlayer
                  key={`${malId}-${activeProvider?.provider || 'default'}-${currentEp}-${activeServer?.serverId || activeServer?.id || activeServer?.name || ''}`}
                  url={videoUrl}
                  videoSources={videoSources}
                  poster={poster}
                  subtitles={subtitles}
                  skips={skips}
                  autoSkip={autoSkip}
                  setAutoSkip={setAutoSkip}
                  autoNext={autoNext}
                  setAutoNext={setAutoNext}
                  autoPlay={autoPlay}
                  setAutoPlay={setAutoPlay}
                  onMinimize={onMinimize}
                  onReady={art => {
                    setArtInstance(art);
                    art.shouldPrefetchNext = prefetchNextEpisode;
                    
                    // Force unmute on play to recover from any background audio focus conflicts
                    art.on('video:play', () => {
                      if (art.video.muted) {
                        console.log('[WatchPlayer] Auto-unmuting video on play');
                        art.video.muted = false;
                        art.volume = 0.8;
                      }
                    });
                  }}
                  onVideoEnd={() => autoNext && hasNext && goToEp(currentEp + 1)}
                  onError={handlePlayerError}
                  malId={malId}
                  currentEp={currentEp}
                />
              )}
            </div>
          </div>

          {!isMinimized && (
            <EpisodeSidebar
              episodes={episodes.filter(ep => {
                const epNum = parseInt(ep.mal_id);
                if (isNaN(displayTotal)) return true;
                return epNum <= displayTotal;
              })}
              currentEp={currentEp}
              totalEpisodes={displayTotal}
              onSelect={goToEp}
            />
          )}
        </div>

        {/* Airing countdown – outside theater, under both */}
        {!isMinimized && anime.nextAiringEpisode && (
          <div className="watch-airing-under">
            <NextAiringBanner data={anime.nextAiringEpisode} />
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      {!isMinimized && (
        <div className="watch-toolbar">
          <div className="watch-toolbar__nav">
            <button className="wt-btn" disabled={!hasPrev} onClick={() => goToEp(currentEp - 1)}>
              <IconChevronLeft size={15} /> Prev
            </button>
            <button className="wt-btn" disabled={!hasNext} onClick={() => goToEp(currentEp + 1)}>
              Next <IconChevronRight size={15} />
            </button>
          </div>

          <div className="watch-toolbar__title">
            {currentEpData?.title ? (
              <><span className="wt-ep-name">{currentEpData.title}</span><span className="wt-ep-num">EP {currentEp}</span></>
            ) : (
              <span className="wt-ep-name">Episode {currentEp}</span>
            )}
          </div>

          <div className="watch-toolbar__actions">
            <div className={`wt-toggle ${lightsOut ? 'on' : ''}`} onClick={() => setLightsOut(!lightsOut)} title="Toggle Lights">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
              <span className="wt-toggle__label">Lights</span>
              <span className="wt-toggle__track"><span className="wt-toggle__thumb" /></span>
            </div>
            <div className={`wt-toggle ${autoNext ? 'on' : ''}`} onClick={() => setAutoNext(!autoNext)} title={`Auto Next: ${autoNext ? 'ON' : 'OFF'}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
              <span className="wt-toggle__label">Auto Next</span>
              <span className="wt-toggle__track"><span className="wt-toggle__thumb" /></span>
            </div>
            <div className={`wt-toggle ${autoSkip ? 'on' : ''}`} onClick={() => setAutoSkip(!autoSkip)} title={`Auto Skip: ${autoSkip ? 'ON' : 'OFF'}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
              <span className="wt-toggle__label">Auto Skip</span>
              <span className="wt-toggle__track"><span className="wt-toggle__thumb" /></span>
            </div>
            {(downloadUrl || allDownloads.length > 0) && (
              <div className="wt-download-wrap">
                <button className="wt-action download" title="Downloads" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </button>
                <div className="wt-download-dropdown">
                  {allDownloads.length > 0 ? allDownloads.map((dl, i) => {
                    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
                    const downloadEndpoint = `${apiBase}/stream/download`

                    const isAlreadyProxiedFrontend = dl.url && (dl.url.includes('/stream/download') || dl.url.includes('/stream/segment'));
                    const isM3U8 = dl.url && dl.url.includes('.m3u8');
                    
                    let finalUrl = dl.url || dl.downloadPage || dl.pahe || '#'

                    // If it is a direct download link (and not HLS/m3u8) and not already proxied, ALWAYS wrap/obfuscate it!
                    if (dl.url && !isAlreadyProxiedFrontend && !isM3U8) {
                      try {
                        const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
                          url: dl.url,
                          referrer: dl.downloadPage || '',
                          filename: dl.filename || `aniempire_${dl.provider.toLowerCase()}_${dl.resolution || 'video'}.mp4`
                        }))))
                        finalUrl = `${downloadEndpoint}?q=${payload}`
                      } catch (e) {
                        console.error('Failed to encode download link:', e)
                      }
                    }

                    return (
                      <a
                        key={i}
                        href={finalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wt-download-item"
                        title="Download Video File"
                      >
                        <span className="wt-dl-quality">
                          {dl.resolution || dl.quality}
                          <span className={`wt-dl-lang-tag ${dl.isDub ? 'dub' : 'sub'}`}>
                            {dl.isDub ? 'ENG' : 'SUB'}
                          </span>
                        </span>
                        {dl.fansub && <span className="wt-dl-fansub">{dl.fansub}</span>}
                        {dl.filesize && <span className="wt-dl-size">{dl.filesize}</span>}
                        <span className="wt-dl-provider">{dl.provider}{!dl.url && dl.downloadPage ? ' Portal' : ''}</span>
                      </a>
                    )
                  }) : downloadUrl ? (() => {
                    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
                    const downloadEndpoint = `${apiBase}/stream/download`
                    
                    let finalUrl = downloadUrl
                    const isAlreadyProxied = downloadUrl.includes('/stream/download')
                    const isM3U8 = downloadUrl.includes('.m3u8')
                    
                    if (!isAlreadyProxied && !isM3U8) {
                      try {
                        const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
                          url: downloadUrl,
                          referrer: '',
                          filename: 'aniempire_download.mp4'
                        }))))
                        finalUrl = `${downloadEndpoint}?q=${payload}`
                      } catch (e) {}
                    }
                    
                    return (
                      <a 
                        href={finalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="wt-download-item"
                        title="Download Video File"
                      >
                        <span className="wt-dl-quality">Download</span>
                      </a>
                    )
                  })() : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Server & Source Selection ── */}
      {!isMinimized && (
        <div className="watch-server-bar">
          {/* Source pills */}
          <div className="watch-server-bar__source">

            <div className="wsb-source-pills">
              {providers.map((prov, i) => {
                const isActive = activeProvider?.provider === prov.provider;
                const displayName = { animepahe: 'Pahe', animesaturn: 'Saturn (ITA)', animeunity: 'Unity (ITA)' }[prov.provider] || prov.provider;
                return (
                  <button
                    key={i}
                    className={`wsb-source-pill ${isActive ? 'active' : ''}`}
                    onClick={() => !isActive && handleProviderSwitch(prov)}
                    disabled={sourceLoading && isActive}
                  >
                    <span className="wsb-source-pill__dot" />
                    {displayName}
                  </button>
                );
              })}
              {sourceLoading && providers.length === 0 && (
                <>
                  <div className="skeleton-line wsb-source-pill-skeleton" style={{ width: 75 }} />
                  <div className="skeleton-line wsb-source-pill-skeleton" style={{ width: 85 }} />
                  <div className="skeleton-line wsb-source-pill-skeleton" style={{ width: 70 }} />
                </>
              )}

              {isPollingProviders && providers.length > 0 && providers.length < 3 && (
                <div className="skeleton-line wsb-source-pill-skeleton" style={{ width: 75 }} title="Discovering more providers..." />
              )}
            </div>
          </div>

          {/* Divider */}
          {(hasSub || hasDub || servers.length > 0) && providers.length > 0 && (
            <div className="wsb-divider" />
          )}

          {/* Category toggles — embed shows both, others only show what servers exist */}
          {(hasSub || hasDub || activeProvider?.is_embed) && (
            <div className="watch-server-bar__cats">
              {(hasSub || activeProvider?.is_embed) && (
                <button className={`wsb-cat ${category === 'sub' ? 'active' : ''}`} onClick={() => handleCategorySwitch('sub')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h2a2 2 0 100-4H7M15 15h2a2 2 0 100-4h-2" /></svg>
                  SUB
                </button>
              )}
              {(hasDub || activeProvider?.is_embed) && (
                <button className={`wsb-cat ${category === 'dub' ? 'active' : ''}`} onClick={() => handleCategorySwitch('dub')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /></svg>
                  DUB
                </button>
              )}
            </div>
          )}

          {/* Servers */}
          {servers.length > 0 && (
            <div className="watch-server-bar__servers">

              {(category === 'sub' ? subServers : dubServers).map((server, i) => {
                const isServerActive = activeServer && (
                  (activeServer.serverId && activeServer.serverId === server.serverId) ||
                  (activeServer.id && activeServer.id === server.id) ||
                  (activeServer.name === server.name)
                ) && activeServer.cat === server.cat;

                return (
                  <button
                    key={i}
                    className={`wsb-server ${isServerActive ? 'active' : ''}`}
                    onClick={() => handleServerClick(server)}
                  >
                    {server.serverName || server.name || `Server ${i + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {servers.length === 0 && !sourceLoading && !videoUrl && !embedUrl && !sourceError && providers.length > 0 && (
            <span className="wsb-empty">Using direct provider source</span>
          )}
          {sourceError && servers.length === 0 && (
            <span className="wsb-error-inline">{sourceError}</span>
          )}
        </div>
      )}

      {/* ── Anime Info Card ── */}
      {!isMinimized && (
        <div className="watch-info-section">
          <div className="watch-info-header">
            <h1 className="watch-main-title">{title}</h1>
            {anime.title_japanese && <p className="watch-jp-title">{anime.title_japanese}</p>}
          </div>

          <div className="watch-anime-info">
            <Link to={animeUrl} className="watch-anime-info__poster-link">
              <img src={poster} alt={title} className="watch-anime-info__poster" />
            </Link>
            <div className="watch-anime-info__body">
              <div className="watch-anime-info__chips">
                {anime.score && (
                  <span className="wai-chip score"><IconStar size={11} /> {anime.score}</span>
                )}
                {anime.type && <span className="wai-chip">{anime.type}</span>}
                {anime.status && (
                  <span className={`wai-chip ${anime.status === 'Currently Airing' ? 'airing' : ''}`}>
                    {anime.status === 'Currently Airing' ? 'Airing' : anime.status}
                  </span>
                )}
                {anime.episodes && <span className="wai-chip">{anime.episodes} EPS</span>}
              </div>

              {anime.genres && (
                <div className="watch-anime-info__genres">
                  {anime.genres.slice(0, 6).map(g => (
                    <Link key={g.mal_id} to={`/browse/anime?genres=${g.name}`} className="wai-genre">{g.name}</Link>
                  ))}
                </div>
              )}

              <div className="watch-anime-info__description">
                <p className={`watch-synopsis ${isDescExpanded ? 'expanded' : ''}`}>
                  {anime.synopsis || 'No description available.'}
                </p>
                {anime.synopsis && anime.synopsis.length > 300 && (
                  <button className="synopsis-toggle" onClick={() => setIsDescExpanded(!isDescExpanded)}>
                    {isDescExpanded ? '− Show Less' : '+ Read More'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Discovery Flow ── */}
      {!isMinimized && (
        <div className="watch-extra-sections">
          {relations.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title" style={{ marginBottom: '16px' }}>Related Content</h3>
              <div className="relations-list">
                {relations.slice(0, expandedRelations ? undefined : 3).map((rel, idx) => {
                  const items = rel.entry || [];
                  const isExpanded = expandedItems[idx];
                  const visibleItems = isExpanded ? items : items.slice(0, 10);

                  return (
                    <div key={idx} className="relation-stack">
                      <h4 className="relation-stack-title">{rel.relation}</h4>
                      <div className="relation-stack-grid">
                        {visibleItems.map(ent => (
                          <Link
                            key={ent.mal_id}
                            to={generateDetailUrl(ent.type, ent.name, ent)}
                            className="relation-link"
                            title={ent.name}
                          >
                            {ent.name}
                          </Link>
                        ))}
                      </div>
                      {items.length > 10 && (
                        <button className="btn btn-link btn-sm" style={{ alignSelf: 'flex-start', marginTop: '8px' }} onClick={() => toggleExpandItem(idx)}>
                          {isExpanded ? 'Show Less' : `+${items.length - 10} More`}
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {relations.length > 3 && (
                  <button 
                    className="btn-show-more" 
                    onClick={() => setExpandedRelations(!expandedRelations)}
                  >
                    {expandedRelations ? '− Show Less Categories' : `+ Show ${relations.length - 3} More Categories`}
                  </button>
                )}
              </div>
            </section>
          )}

          {recommendations.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">Recommendations</h3>
              <div className="anime-grid">
                {recommendations.slice(0, 12).map(rec => (
                  <AnimeCard
                    key={rec.id}
                    item={{
                      ...rec,
                      description: rec.description || '' // Ensure description field exists for AnimeCard
                    }}
                    type="anime"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Skeleton ──────────────────────────────────────────────── */
function WatchSkeleton() {
  return (
    <div className="watch-page">
      <div className="watch-breadcrumb" style={{ marginBottom: 20 }}>
        <div className="skeleton-line" style={{ width: 200, height: 14 }} />
      </div>

      <div className="watch-theater-main">
        <div className="watch-theater">
          <div className="watch-theater__player">
            <div className="watch-player-wrap">
              <div className="watch-player-loading">
                <div className="watch-spinner" />
                <div className="skeleton-line" style={{ width: 120, height: 14, marginTop: 12 }} />
              </div>
            </div>
          </div>
          <div className="ep-sidebar">
            <div className="ep-sidebar__head">
              <div className="skeleton-line" style={{ width: 120, height: 18 }} />
            </div>
            <div style={{ padding: '12px' }}>
              <div className="skeleton-line" style={{ width: '100%', height: 34, marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="skeleton-line" style={{ height: 38 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="watch-toolbar" style={{ marginTop: 16 }}>
        <div className="skeleton-line" style={{ width: 300, height: 24 }} />
        <div className="skeleton-line" style={{ width: 150, height: 24 }} />
      </div>

      <div className="watch-server-bar">
        <div className="skeleton-line" style={{ width: '100%', height: 36 }} />
      </div>

      <div className="watch-info-section" style={{ marginTop: 32 }}>
        <div className="skeleton-line" style={{ width: '60%', height: 32, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 24 }}>
          <div className="skeleton-line" style={{ width: 180, height: 260, borderRadius: 12 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-line" style={{ width: 60, height: 24, borderRadius: 12 }} />
              ))}
            </div>
            <div className="skeleton-line" style={{ width: '100%', height: 16, marginBottom: 8 }} />
            <div className="skeleton-line" style={{ width: '100%', height: 16, marginBottom: 8 }} />
            <div className="skeleton-line" style={{ width: '90%', height: 16, marginBottom: 8 }} />
            <div className="skeleton-line" style={{ width: '40%', height: 16 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
