import React, { useEffect, useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { supabase } from '../../lib/supabase';
import { IconUser, IconTrophy, IconCheck, IconZap, IconCoins, IconShield, CrownIcon } from '../Icons';

export default function UserProfile({ userId = null }) {
  const profile          = useProfileStore((state) => state.profile);
  const fetchProfile     = useProfileStore((state) => state.fetchProfile);
  const getHierarchyTitle = useProfileStore((state) => state.getHierarchyTitle);
  const getEquippedEffect = useProfileStore((state) => state.getEquippedEffect);
  const [title, setTitle]             = useState('Peasant');
  const [isLoading, setIsLoading]     = useState(true);
  const [externalProfile, setExternalProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (userId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, user_achievements(achievement_id, achievements(*)), user_inventory(id, shop_item_id, is_equipped, shop_items(*))')
          .eq('id', userId).single();
        if (!error) setExternalProfile(data);
      } else {
        await fetchProfile();
      }
      setIsLoading(false);
    };
    loadProfile();
  }, [userId, fetchProfile]);

  useEffect(() => {
    const loadTitle = async () => {
      const dp = externalProfile || profile;
      if (dp) { const t = await getHierarchyTitle(dp.id); setTitle(t); }
    };
    loadTitle();
  }, [profile, externalProfile, getHierarchyTitle]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading profile…</p>
      </div>
    );
  }

  const displayProfile = externalProfile || profile;
  if (!displayProfile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Profile not found</p>
      </div>
    );
  }

  const xpThresholds     = [0, 500, 1500, 3000, 4500, 6000];
  const currentLevelIndex = Math.max(0, (xpThresholds.findIndex((t) => displayProfile.xp < t) - 1));
  const currentLevelXp   = xpThresholds[currentLevelIndex] || 0;
  const nextLevelXp      = xpThresholds[currentLevelIndex + 1] || 6000;
  const xpInLevel        = displayProfile.xp - currentLevelXp;
  const xpForLevel       = nextLevelXp - currentLevelXp;
  const xpProgress       = Math.min(100, (xpInLevel / xpForLevel) * 100);

  const equippedEffect = getEquippedEffect();
  const factionColors = { shonen: '#FF6B6B', seinen: '#4ECDC4', shoujo: '#FFB7C5', cyberpunk: '#00D9FF', fantasy: '#9D84B7', 'slice-of-life': '#FFD93D' };
  const factionColor  = factionColors[displayProfile.faction] || 'var(--purple)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Main Profile Card */}
        <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: 24 }}>
          {/* Cover */}
          <div style={{ height: 120, background: `linear-gradient(135deg, ${factionColor}33, ${factionColor}11)`, borderBottom: `1px solid ${factionColor}33` }} />

          <div style={{ padding: '0 28px 28px', marginTop: -64, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 112, height: 112, borderRadius: '50%',
                  background: `linear-gradient(135deg, var(--purple), var(--pink))`,
                  border: `3px solid ${factionColor}`, boxShadow: `0 0 24px ${factionColor}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {displayProfile.avatar_url
                    ? <img src={displayProfile.avatar_url} alt={displayProfile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <IconUser size={44} color="rgba(255,255,255,0.6)" />
                  }
                  {equippedEffect && (
                    <iframe srcDoc={equippedEffect.iframe_template} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', border: 'none', borderRadius: '50%', mixBlendMode: 'screen' }} />
                  )}
                </div>
                {displayProfile.is_donor && (
                  <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--gold)', borderRadius: '50%', padding: 5, border: '2px solid var(--bg-primary)' }}>
                    <CrownIcon size={14} color="var(--bg-primary)" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--text-primary)' }}>{displayProfile.username}</h1>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 'var(--radius-full)', color: factionColor, background: `${factionColor}20`, border: `1px solid ${factionColor}` }}>
                    {displayProfile.faction?.toUpperCase() || 'UNALIGNED'}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--purple)', marginBottom: 16 }}>{title}</div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'EXPERIENCE', value: displayProfile.xp,     Icon: IconZap,   color: 'var(--purple)' },
                    { label: 'CREDITS',    value: displayProfile.credits, Icon: IconCoins, color: 'var(--gold)' },
                    { label: 'GUILD',      value: displayProfile.guild_id ? <IconCheck size={20} /> : '—', Icon: IconShield, color: 'var(--blue)' },
                  ].map(({ label, value, Icon, color }) => (
                    <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 14px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                        <Icon size={11} color="var(--text-muted)" /> {label}
                      </div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>LEVEL PROGRESS</span>
                <span>{xpInLevel} / {xpForLevel} XP</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ height: '100%', width: `${xpProgress}%`, background: `linear-gradient(90deg, var(--purple), var(--pink))`, transition: 'width 0.5s ease', boxShadow: '0 0 8px rgba(139,82,196,0.5)' }} />
              </div>
            </div>

            {/* Bio */}
            {displayProfile.about && (
              <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {displayProfile.about}
              </div>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Achievements */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTrophy size={20} color="var(--gold)" /> Achievements
            </h2>
            {displayProfile.user_achievements?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 14 }}>
                {displayProfile.user_achievements.map((ua) => (
                  <div key={ua.achievement_id} className="achievement-card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      {ua.achievements?.icon_url
                        ? <img src={ua.achievements.icon_url} alt={ua.achievements.name} style={{ width: 40, height: 40 }} />
                        : <IconTrophy size={32} color="var(--gold)" />
                      }
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{ua.achievements?.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <IconTrophy size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <p style={{ color: 'var(--text-muted)' }}>No achievements yet. Keep playing!</p>
              </div>
            )}
          </div>

          {/* Equipped Items */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconShield size={20} color="var(--blue)" /> Equipped
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Profile Effect', value: equippedEffect?.name || 'None', color: 'var(--purple)' },
                {
                  label: 'Avatar Border',
                  value: displayProfile.user_inventory?.find((i) => i.is_equipped && i.shop_items?.category === 'avatar_border')?.shop_items?.name || 'Default',
                  color: 'var(--blue)',
                },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .achievement-card:hover { border-color: var(--gold) !important; transform: translateY(-2px); box-shadow: var(--shadow-gold); }
      `}</style>
    </div>
  );
}
