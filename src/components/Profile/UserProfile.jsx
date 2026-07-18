import React, { useEffect, useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { supabase } from '../../lib/supabase';

export default function UserProfile({ userId = null }) {
  const profile = useProfileStore((state) => state.profile);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const getHierarchyTitle = useProfileStore((state) => state.getHierarchyTitle);
  const getEquippedEffect = useProfileStore((state) => state.getEquippedEffect);
  const [title, setTitle] = useState('Peasant');
  const [isLoading, setIsLoading] = useState(true);
  const [externalProfile, setExternalProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (userId) {
        // Fetch external user's profile
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            user_achievements(achievement_id, achievements(*)),
            user_inventory(id, shop_item_id, is_equipped, shop_items(*))
          `)
          .eq('id', userId)
          .single();

        if (!error) {
          setExternalProfile(data);
        }
      } else {
        // Fetch current user's profile
        await fetchProfile();
      }

      setIsLoading(false);
    };

    loadProfile();
  }, [userId, fetchProfile]);

  useEffect(() => {
    const loadTitle = async () => {
      const displayProfile = externalProfile || profile;
      if (displayProfile) {
        const t = await getHierarchyTitle(displayProfile.id);
        setTitle(t);
      }
    };

    loadTitle();
  }, [profile, externalProfile, getHierarchyTitle]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  const displayProfile = externalProfile || profile;

  if (!displayProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-xl">Profile not found</div>
      </div>
    );
  }

  // Calculate XP progress to next level
  const xpThresholds = [0, 500, 1500, 3000, 4500, 6000];
  const currentLevelIndex = xpThresholds.findIndex((t) => displayProfile.xp < t) - 1 || 5;
  const currentLevelXp = xpThresholds[currentLevelIndex];
  const nextLevelXp = xpThresholds[currentLevelIndex + 1] || 6000;
  const xpInLevel = displayProfile.xp - currentLevelXp;
  const xpForLevel = nextLevelXp - currentLevelXp;
  const xpProgress = (xpInLevel / xpForLevel) * 100;

  const equippedEffect = getEquippedEffect();
  const factionColor = {
    shonen: '#FF6B6B',
    seinen: '#4ECDC4',
    shoujo: '#FFB7C5',
    cyberpunk: '#00D9FF',
    fantasy: '#9D84B7',
    'slice-of-life': '#FFD93D',
  }[displayProfile.faction] || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Main Profile Card */}
        <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl overflow-hidden mb-8">
          {/* Cover area with faction accent */}
          <div
            className="h-32 bg-gradient-to-r opacity-30"
            style={{
              backgroundImage: `linear-gradient(135deg, ${factionColor}, ${factionColor}99)`,
            }}
          />

          <div className="px-8 pb-8 -mt-16 relative z-10">
            {/* Avatar and Title Section */}
            <div className="flex gap-6 mb-8">
              {/* Avatar with equipped effect overlay */}
              <div className="relative">
                <div
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-4 flex items-center justify-center text-6xl overflow-hidden"
                  style={{
                    borderColor: factionColor,
                    boxShadow: `0 0 20px ${factionColor}80`,
                  }}
                >
                  {displayProfile.avatar_url ? (
                    <img
                      src={displayProfile.avatar_url}
                      alt={displayProfile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '👤'
                  )}

                  {/* Profile effect overlay */}
                  {equippedEffect && (
                    <iframe
                      srcDoc={equippedEffect.iframe_template}
                      className="absolute inset-0 w-full h-full pointer-events-none border-none rounded-full"
                      style={{ mixBlendMode: 'screen' }}
                    />
                  )}
                </div>

                {/* Donor badge */}
                {displayProfile.is_donor && (
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-2 border-2 border-slate-800">
                    <span className="text-xl">👑</span>
                  </div>
                )}
              </div>

              {/* User info */}
              <div className="flex-1 pt-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">{displayProfile.username}</h1>
                  <span
                    className="text-xl font-bold px-3 py-1 rounded-full"
                    style={{
                      color: factionColor,
                      backgroundColor: `${factionColor}20`,
                      border: `2px solid ${factionColor}`,
                    }}
                  >
                    {displayProfile.faction?.toUpperCase() || 'UNALIGNED'}
                  </span>
                </div>

                <div className="text-3xl font-bold text-purple-300 mb-4">{title}</div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">EXPERIENCE</div>
                    <div className="text-2xl font-bold text-purple-300">{displayProfile.xp}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">CREDITS</div>
                    <div className="text-2xl font-bold text-yellow-300">{displayProfile.credits}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">GUILD</div>
                    <div className="text-2xl font-bold text-pink-300">
                      {displayProfile.guild_id ? '✓' : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">LEVEL PROGRESS</span>
                <span className="text-sm text-slate-300">
                  {xpInLevel} / {xpForLevel} XP
                </span>
              </div>
              <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Bio/About */}
            {displayProfile.about && (
              <div className="bg-slate-700/30 rounded-lg p-4 mb-8 border border-slate-600">
                <p className="text-slate-300">{displayProfile.about}</p>
              </div>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Achievements */}
          <div className="col-span-2">
            <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>

              {displayProfile.user_achievements && displayProfile.user_achievements.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {displayProfile.user_achievements.map((ua) => (
                    <div
                      key={ua.achievement_id}
                      className="bg-slate-700/50 border border-purple-500/30 rounded-lg p-4 text-center hover:border-purple-400 transition-all group cursor-pointer"
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                        {ua.achievements?.icon_url ? (
                          <img
                            src={ua.achievements.icon_url}
                            alt={ua.achievements.name}
                            className="w-12 h-12 mx-auto"
                          />
                        ) : (
                          '🏆'
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-300 group-hover:text-purple-300">
                        {ua.achievements?.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">No achievements yet. Keep playing!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Equipped Items */}
          <div>
            <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Equipped</h2>

              <div className="space-y-4">
                {/* Profile Effect */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="text-xs text-slate-400 mb-2">Profile Effect</div>
                  <div className="text-sm font-semibold text-purple-300">
                    {equippedEffect?.name || 'None'}
                  </div>
                </div>

                {/* Avatar Border */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="text-xs text-slate-400 mb-2">Avatar Border</div>
                  <div className="text-sm font-semibold text-cyan-300">
                    {displayProfile.user_inventory?.find(
                      (i) =>
                        i.is_equipped &&
                        i.shop_items?.category === 'avatar_border'
                    )?.shop_items?.name || 'Default'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
