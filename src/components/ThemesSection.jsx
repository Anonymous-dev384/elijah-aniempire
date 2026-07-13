import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlay, IconPlus, IconCheck } from './Icons';
import { useMusic } from '../context/MusicContext';
import { generateDetailUrl } from '../services/api';

export default function ThemesSection({ themesData, animeData }) {
  const [expanded, setExpanded] = useState(false);
  const { playTrack, setIsMinimized, addToPlaylist, playlist } = useMusic();

  if (!themesData) return null;

  // Determine format
  const isRichFormat = Array.isArray(themesData);

  let openings = [];
  let endings = [];

  if (isRichFormat) {
    if (themesData.length === 0) return null;
    openings = themesData.filter(t => t.type === 'OP');
    endings = themesData.filter(t => t.type === 'ED');
  } else {
    // Jikan fallback format
    openings = themesData.openings || [];
    endings = themesData.endings || [];
    if (openings.length === 0 && endings.length === 0) return null;
  }

  const renderRichTheme = (theme) => {
    const title = theme.song?.title || 'Unknown Title';
    const artists = theme.song?.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
    const sequenceStr = theme.sequence ? `(V${theme.sequence})` : '';
    
    // Normalize anime entry for context
    const animeEntry = {
      name: animeData?.title_english || animeData?.title || 'Unknown Anime',
      malId: animeData?.mal_id || 0,
      slug: animeData?.slug || '',
      coverImage: animeData?.images?.webp?.large_image_url || animeData?.images?.jpg?.large_image_url || 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=200&auto=format&fit=crop'
    };

    const inPlaylist = playlist.some(item => item.theme.id === theme.id);

    // Ensure theme has song title, artists and artistsData for the player/playlist
    const normalizedTheme = {
      ...theme,
      songTitle: title,
      artists: artists,
      artistsData: theme.song?.artists || theme.artistsData || null,
      audioLink: theme.audio?.link || null,
      videoLink: theme.video?.link || null
    };

    return (
      <div key={theme.id || Math.random()} className="theme-item rich-theme">
        <div className="theme-info">
          <p className="theme-title">{title} <span className="theme-sequence">{sequenceStr}</span></p>
          <div className="theme-artist">
            {normalizedTheme.artistsData?.map((a, i) => (
              <React.Fragment key={a.id || i}>
                <Link to={generateDetailUrl('artist', a.name, a)} className="hover-link" onClick={e => e.stopPropagation()}>{a.name}</Link>
                {i < normalizedTheme.artistsData.length - 1 ? ', ' : ''}
              </React.Fragment>
            )) || artists}
          </div>
        </div>
        <div className="theme-actions">
          {theme.audio?.link && (
            <button 
              onClick={() => {
                console.log('[ThemesSection] Playing Audio:', title);
                setIsMinimized(true);
                playTrack(animeEntry, normalizedTheme, 'audio');
              }} 
              className="theme-video-link btn btn-secondary btn-sm cursor-pointer"
              title="Play Audio"
            >
              <IconPlay size={14} /> Audio
            </button>
          )}
          {theme.video?.link && (
            <button 
              onClick={() => {
                console.log('[ThemesSection] Playing Video:', title);
                setIsMinimized(true);
                playTrack(animeEntry, normalizedTheme, 'video');
              }} 
              className="theme-video-link btn btn-secondary btn-sm cursor-pointer"
              title="Play Video"
            >
              <IconPlay size={14} /> Video
            </button>
          )}
          <button 
            onClick={() => { if (!inPlaylist) addToPlaylist(animeEntry, normalizedTheme) }}
            className={`theme-video-link btn btn-sm cursor-pointer ${inPlaylist ? 'btn-ghost' : 'btn-secondary'}`}
            title={inPlaylist ? "In Queue" : "Add to Queue"}
            disabled={inPlaylist}
          >
            {inPlaylist ? <><IconCheck size={14} /> Added</> : <><IconPlus size={14} /> Queue</>}
          </button>
        </div>
      </div>
    );
  };

  const renderSimpleTheme = (themeStr, idx) => {
    return (
      <div key={idx} className="theme-item simple-theme">
        <p className="theme-title">{themeStr}</p>
      </div>
    );
  };

  const visibleOpenings = expanded ? openings : openings.slice(0, 3);
  const visibleEndings = expanded ? endings : (openings.length < 3 ? endings.slice(0, 3 - openings.length) : []);
  
  const totalThemesCount = openings.length + endings.length;
  const isExpandable = totalThemesCount > 3;

  return (
    <section className="detail-section">
      <h3 className="detail-section-title">Themes</h3>
      <div className="themes-container">
        {openings.length > 0 && (
          <div className="themes-group">
            <h4 className="themes-group-title">Openings</h4>
            <div className="themes-list">
              {visibleOpenings.map((theme, idx) => isRichFormat ? renderRichTheme(theme) : renderSimpleTheme(theme, idx))}
            </div>
          </div>
        )}

        {endings.length > 0 && (!expanded && openings.length >= 3 ? null : (
          <div className="themes-group" style={{ marginTop: '16px' }}>
            <h4 className="themes-group-title">Endings</h4>
            <div className="themes-list">
              {visibleEndings.map((theme, idx) => isRichFormat ? renderRichTheme(theme) : renderSimpleTheme(theme, idx))}
            </div>
          </div>
        ))}

        {isExpandable && (
          <button 
            className="btn-show-more" 
            style={{ marginTop: '16px' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '− Show Less' : `+ Show ${totalThemesCount - 3} More Themes`}
          </button>
        )}
      </div>
    </section>
  );
}

