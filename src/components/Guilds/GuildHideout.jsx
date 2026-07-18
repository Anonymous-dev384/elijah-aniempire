import React, { useEffect, useState } from 'react';
import { useGuildStore } from '../../store/guildStore';
import { useProfileStore } from '../../store/profileStore';
import { useChatStore } from '../../store/chatStore';
import { supabase } from '../../lib/supabase';
import {
  IconLock, IconUsers, IconUser, IconStar, IconClapperboard,
  IconSparkles, IconCheck, IconPlay, IconPause, IconPlus, IconShield, CrownIcon
} from '../Icons';

export default function GuildHideout() {
  const profile          = useProfileStore((state) => state.profile);
  const userGuild        = useGuildStore((state) => state.userGuild);
  const allGuilds        = useGuildStore((state) => state.allGuilds);
  const guildDetails     = useGuildStore((state) => state.guildDetails);
  const fetchAllGuilds   = useGuildStore((state) => state.fetchAllGuilds);
  const fetchUserGuild   = useGuildStore((state) => state.fetchUserGuild);
  const fetchGuildDetails = useGuildStore((state) => state.fetchGuildDetails);
  const createGuild      = useGuildStore((state) => state.createGuild);
  const joinGuild        = useGuildStore((state) => state.joinGuild);
  const leaveGuild       = useGuildStore((state) => state.leaveGuild);
  const error            = useGuildStore((state) => state.error);

  const [isLoading, setIsLoading]           = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showWatchParty, setShowWatchParty] = useState(false);
  const [newGuildName, setNewGuildName]     = useState('');
  const [newGuildDesc, setNewGuildDesc]     = useState('');
  const [watchPartyUrl, setWatchPartyUrl]   = useState('');
  const [isPlayingWatchParty, setIsPlayingWatchParty] = useState(false);
  const [watchPartyChannel, setWatchPartyChannel]     = useState(null);

  const userLevel = profile?.xp < 500 ? 1 : profile?.xp < 1500 ? 5 : 15;

  useEffect(() => {
    const loadData = async () => {
      await fetchAllGuilds();
      await fetchUserGuild();
      setIsLoading(false);
    };
    loadData();
  }, [fetchAllGuilds, fetchUserGuild]);

  useEffect(() => {
    if (!userGuild) {
      if (watchPartyChannel) { supabase.removeChannel(watchPartyChannel); setWatchPartyChannel(null); }
      return;
    }
    const channel = supabase.channel(`watch-party:${userGuild}`, { config: { broadcast: { self: true } } });
    channel.on('broadcast', { event: 'sync' }, (payload) => {
      if (payload.payload.isPlaying !== undefined) setIsPlayingWatchParty(payload.payload.isPlaying);
      if (payload.payload.currentTime !== undefined) {
        const v = document.getElementById('watch-party-video');
        if (v && Math.abs(v.currentTime - payload.payload.currentTime) > 1) v.currentTime = payload.payload.currentTime;
      }
    }).subscribe();
    setWatchPartyChannel(channel);
    return () => { supabase.removeChannel(channel); };
  }, [userGuild]);

  const handleCreateGuild = async (e) => {
    e.preventDefault();
    await createGuild(newGuildName, newGuildDesc);
    setNewGuildName(''); setNewGuildDesc(''); setShowCreateForm(false);
    await fetchUserGuild();
  };

  const handleJoinGuild  = async (guildId) => { await joinGuild(guildId); await fetchUserGuild(); };
  const handleLeaveGuild = async () => { await leaveGuild(); setShowWatchParty(false); };

  const handleWatchPartyPlay = () => {
    if (watchPartyChannel) { watchPartyChannel.send({ type: 'broadcast', event: 'sync', payload: { isPlaying: true, currentTime: 0 } }); setIsPlayingWatchParty(true); }
  };
  const handleWatchPartyPause = () => {
    if (watchPartyChannel) {
      const v = document.getElementById('watch-party-video');
      watchPartyChannel.send({ type: 'broadcast', event: 'sync', payload: { isPlaying: false, currentTime: v?.currentTime || 0 } });
      setIsPlayingWatchParty(false);
    }
  };
  const handleSetWatchPartyUrl = async () => {
    if (!watchPartyUrl.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const guildData = guildDetails[userGuild];
    if (guildData?.owner_id !== user.id) { alert('Only the guild leader can set the watch party URL'); return; }
    if (watchPartyChannel) watchPartyChannel.send({ type: 'broadcast', event: 'url-change', payload: { url: watchPartyUrl } });
  };

  const panelStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(16px)',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading guilds…</p>
      </div>
    );
  }

  /* ── No Guild ── */
  if (!userGuild) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconShield size={32} color="var(--gold)" /> Guild Hideout
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Join a guild or create your own. Guilds are where communities gather!</p>
          </div>

          {/* Create Guild */}
          {userLevel >= 5 && (
            <div style={{ ...panelStyle, padding: 24, marginBottom: 20, borderColor: 'rgba(69,163,94,0.2)' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 16 }}>Create a New Guild</h2>
              {!showCreateForm ? (
                <button onClick={() => setShowCreateForm(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconPlus size={16} /> Create Guild
                </button>
              ) : (
                <form onSubmit={handleCreateGuild} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Guild Name</label>
                    <input type="text" value={newGuildName} onChange={(e) => setNewGuildName(e.target.value)} placeholder="Enter guild name (3–50 characters)" maxLength={50} className="input" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
                    <textarea value={newGuildDesc} onChange={(e) => setNewGuildDesc(e.target.value)} placeholder="Optional guild description" maxLength={500} className="input" style={{ height: 80, resize: 'none' }} />
                  </div>
                  {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Create</button>
                    <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Locked */}
          {userLevel < 5 && (
            <div style={{ ...panelStyle, padding: 20, marginBottom: 20, borderColor: 'rgba(212,168,67,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <IconLock size={28} color="var(--gold)" />
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>Create Guild Locked</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>You need to reach Level 5 (500 XP) to create a guild</p>
                </div>
              </div>
            </div>
          )}

          {/* Browse Guilds */}
          <div style={{ ...panelStyle, padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 20 }}>Browse Active Guilds</h2>
            {allGuilds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ color: 'var(--text-muted)' }}>No guilds yet. Be the first to create one!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {allGuilds.map((guild) => (
                  <div key={guild.id} className="guild-card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 18, transition: 'all var(--transition-fast)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: 2 }}>{guild.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Level {guild.level}</p>
                      </div>
                      {guild.emblem_url && <img src={guild.emblem_url} alt={guild.name} style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />}
                    </div>
                    {guild.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{guild.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <IconUsers size={13} /> {guild.member_count}/{guild.max_members} members
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--gold)' }}>
                        <IconStar size={13} fill="var(--gold)" stroke="var(--gold)" /> {guild.xp} XP
                      </span>
                    </div>
                    <button
                      onClick={() => handleJoinGuild(guild.id)}
                      disabled={guild.member_count >= guild.max_members}
                      className={guild.member_count >= guild.max_members ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
                      style={{ width: '100%', justifyContent: 'center', opacity: guild.member_count >= guild.max_members ? 0.5 : 1 }}
                    >
                      {guild.member_count >= guild.max_members ? 'Guild Full' : 'Join Guild'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── In a Guild ── */
  const currentGuild = guildDetails[userGuild];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconShield size={32} color="var(--gold)" />
            {currentGuild?.name || 'Guild Hideout'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to your guild sanctuary</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Guild Stats */}
            <div style={{ ...panelStyle, padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 18 }}>Guild Status</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Level',   value: currentGuild?.level,        color: 'var(--purple)' },
                  { label: 'Members', value: currentGuild?.member_count,  color: 'var(--blue)' },
                  { label: 'Guild XP',value: currentGuild?.xp,           color: 'var(--gold)' },
                  { label: 'Capacity',value: `${currentGuild?.member_count}/${currentGuild?.max_members}`, color: 'var(--pink)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 14px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em' }}>{label.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Guild Progression</span><span>{currentGuild?.xp} XP</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ height: '100%', width: '45%', background: 'linear-gradient(90deg, var(--purple), var(--pink))', boxShadow: '0 0 8px rgba(139,82,196,0.5)' }} />
                </div>
              </div>
            </div>

            {/* Weekly Quests */}
            <div style={{ ...panelStyle, padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 16 }}>Weekly Quests</h2>
              {currentGuild?.quests?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {currentGuild.quests.map((quest) => (
                    <div key={quest.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{quest.title}</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{quest.description}</p>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.85rem', flexShrink: 0, marginLeft: 12 }}>+{quest.reward_xp} XP</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(quest.current_count / quest.target_count) * 100}%`, background: 'linear-gradient(90deg, var(--green), #45a35e)' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{quest.current_count}/{quest.target_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No quests this week. Check back later!</p>
              )}
            </div>

            {/* Members */}
            <div style={{ ...panelStyle, padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconUsers size={18} color="var(--blue)" /> Members
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                {currentGuild?.members?.map((member) => (
                  <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {member.profiles?.avatar_url
                        ? <img src={member.profiles.avatar_url} alt={member.profiles?.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <IconUser size={16} color="rgba(255,255,255,0.7)" />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.profiles?.username}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.profiles?.xp} XP</div>
                    </div>
                    {member.profiles?.is_donor && <CrownIcon size={16} color="var(--gold)" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Watch Party */}
          <div>
            <div style={{ ...panelStyle, padding: 24, position: 'sticky', top: 24, borderColor: 'rgba(217,26,122,0.2)' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconClapperboard size={20} color="var(--pink)" /> Watch Party
              </h2>

              {!showWatchParty ? (
                <button onClick={() => setShowWatchParty(true)} className="btn" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, var(--pink), var(--red))', color: '#fff', border: 'none' }}>
                  <IconPlay size={15} /> Start Watch Party
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <video id="watch-party-video" src={watchPartyUrl} controls style={{ width: '100%', display: 'block' }} />
                  </div>

                  {/* URL Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Video URL</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="url" value={watchPartyUrl} onChange={(e) => setWatchPartyUrl(e.target.value)} placeholder="Paste anime episode URL" className="input" style={{ fontSize: '0.82rem' }} />
                      <button onClick={handleSetWatchPartyUrl} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Set</button>
                    </div>
                  </div>

                  {/* Controls */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleWatchPartyPlay} disabled={isPlayingWatchParty} className={isPlayingWatchParty ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'} style={{ flex: 1, justifyContent: 'center', opacity: isPlayingWatchParty ? 0.45 : 1 }}>
                      <IconPlay size={14} /> Play
                    </button>
                    <button onClick={handleWatchPartyPause} disabled={!isPlayingWatchParty} className={!isPlayingWatchParty ? 'btn btn-ghost btn-sm' : 'btn btn-secondary btn-sm'} style={{ flex: 1, justifyContent: 'center', opacity: !isPlayingWatchParty ? 0.45 : 1 }}>
                      <IconPause size={14} /> Pause
                    </button>
                  </div>

                  <button onClick={() => setShowWatchParty(false)} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Close</button>
                </div>
              )}

              <button onClick={handleLeaveGuild} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 16, background: 'rgba(217,59,59,0.12)', color: 'var(--red)', border: '1px solid rgba(217,59,59,0.35)' }}>
                Leave Guild
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .guild-card:hover { border-color: var(--gold) !important; box-shadow: var(--shadow-gold); transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
