import React, { useEffect, useState } from 'react';
import { useGuildStore } from '../../store/guildStore';
import { useProfileStore } from '../../store/profileStore';
import { useChatStore } from '../../store/chatStore';
import { supabase } from '../../lib/supabase';

export default function GuildHideout() {
  const profile = useProfileStore((state) => state.profile);
  const userGuild = useGuildStore((state) => state.userGuild);
  const allGuilds = useGuildStore((state) => state.allGuilds);
  const guildDetails = useGuildStore((state) => state.guildDetails);
  const fetchAllGuilds = useGuildStore((state) => state.fetchAllGuilds);
  const fetchUserGuild = useGuildStore((state) => state.fetchUserGuild);
  const fetchGuildDetails = useGuildStore((state) => state.fetchGuildDetails);
  const createGuild = useGuildStore((state) => state.createGuild);
  const joinGuild = useGuildStore((state) => state.joinGuild);
  const leaveGuild = useGuildStore((state) => state.leaveGuild);
  const error = useGuildStore((state) => state.error);

  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showWatchParty, setShowWatchParty] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [watchPartyUrl, setWatchPartyUrl] = useState('');
  const [isPlayingWatchParty, setIsPlayingWatchParty] = useState(false);
  const [watchPartyChannel, setWatchPartyChannel] = useState(null);

  // Calculate user level
  const userLevel = profile?.xp < 500 ? 1 : profile?.xp < 1500 ? 5 : 15;

  useEffect(() => {
    const loadData = async () => {
      await fetchAllGuilds();
      await fetchUserGuild();
      setIsLoading(false);
    };

    loadData();
  }, [fetchAllGuilds, fetchUserGuild]);

  // Subscribe to watch party channel when in guild
  useEffect(() => {
    if (!userGuild) {
      if (watchPartyChannel) {
        supabase.removeChannel(watchPartyChannel);
        setWatchPartyChannel(null);
      }
      return;
    }

    const channel = supabase.channel(`watch-party:${userGuild}`, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on('broadcast', { event: 'sync' }, (payload) => {
        // Handle watch party sync events
        if (payload.payload.isPlaying !== undefined) {
          setIsPlayingWatchParty(payload.payload.isPlaying);
        }
        if (payload.payload.currentTime !== undefined) {
          const videoElement = document.getElementById('watch-party-video');
          if (videoElement && Math.abs(videoElement.currentTime - payload.payload.currentTime) > 1) {
            videoElement.currentTime = payload.payload.currentTime;
          }
        }
      })
      .subscribe();

    setWatchPartyChannel(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userGuild]);

  const handleCreateGuild = async (e) => {
    e.preventDefault();
    await createGuild(newGuildName, newGuildDesc);
    setNewGuildName('');
    setNewGuildDesc('');
    setShowCreateForm(false);
    await fetchUserGuild();
  };

  const handleJoinGuild = async (guildId) => {
    await joinGuild(guildId);
    await fetchUserGuild();
  };

  const handleLeaveGuild = async () => {
    await leaveGuild();
    setShowWatchParty(false);
  };

  const handleWatchPartyPlay = () => {
    if (watchPartyChannel) {
      watchPartyChannel.send({
        type: 'broadcast',
        event: 'sync',
        payload: { isPlaying: true, currentTime: 0 },
      });
      setIsPlayingWatchParty(true);
    }
  };

  const handleWatchPartyPause = () => {
    if (watchPartyChannel) {
      const videoElement = document.getElementById('watch-party-video');
      watchPartyChannel.send({
        type: 'broadcast',
        event: 'sync',
        payload: { isPlaying: false, currentTime: videoElement?.currentTime || 0 },
      });
      setIsPlayingWatchParty(false);
    }
  };

  const handleSetWatchPartyUrl = async () => {
    if (!watchPartyUrl.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    const guildData = guildDetails[userGuild];

    if (guildData?.owner_id !== user.id) {
      alert('Only the guild leader can set the watch party URL');
      return;
    }

    // Update guild with watch party URL (would need to add this field to guilds table)
    // For now, we'll just broadcast it
    if (watchPartyChannel) {
      watchPartyChannel.send({
        type: 'broadcast',
        event: 'url-change',
        payload: { url: watchPartyUrl },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-xl">Loading guilds...</div>
      </div>
    );
  }

  // User has no guild
  if (!userGuild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Guild Hideout</h1>
            <p className="text-slate-300">
              Join a guild or create your own. Guilds are where communities gather!
            </p>
          </div>

          {/* Create Guild Section */}
          {userLevel >= 5 && (
            <div className="bg-slate-800/80 backdrop-blur border border-green-500/20 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Create a New Guild</h2>

              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-bold text-white transition-all"
                >
                  ✨ Create Guild
                </button>
              ) : (
                <form onSubmit={handleCreateGuild} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Guild Name
                    </label>
                    <input
                      type="text"
                      value={newGuildName}
                      onChange={(e) => setNewGuildName(e.target.value)}
                      placeholder="Enter guild name (3-50 characters)"
                      maxLength={50}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-green-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newGuildDesc}
                      onChange={(e) => setNewGuildDesc(e.target.value)}
                      placeholder="Optional guild description"
                      maxLength={500}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-green-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-400 resize-none h-20"
                    />
                  </div>

                  {error && <div className="text-red-400 text-sm">{error}</div>}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-all"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {userLevel < 5 && (
            <div className="bg-slate-800/80 backdrop-blur border border-yellow-500/20 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔒</span>
                <div>
                  <p className="text-white font-bold">Create Guild Locked</p>
                  <p className="text-slate-400 text-sm">
                    You need to reach Level 5 (500 XP) to create a guild
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Browse Guilds Section */}
          <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Browse Active Guilds</h2>

            {allGuilds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No guilds available yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allGuilds.map((guild) => (
                  <div
                    key={guild.id}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-purple-400 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{guild.name}</h3>
                        <p className="text-sm text-slate-400">Level {guild.level}</p>
                      </div>
                      {guild.emblem_url && (
                        <img
                          src={guild.emblem_url}
                          alt={guild.name}
                          className="w-12 h-12 rounded-lg"
                        />
                      )}
                    </div>

                    {guild.description && (
                      <p className="text-sm text-slate-300 mb-3">{guild.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-slate-400">
                        👥 {guild.member_count}/{guild.max_members} members
                      </span>
                      <span className="text-xs text-purple-300">
                        ⭐ {guild.xp} Guild XP
                      </span>
                    </div>

                    <button
                      onClick={() => handleJoinGuild(guild.id)}
                      disabled={guild.member_count >= guild.max_members}
                      className={`w-full py-2 rounded-lg font-bold transition-all ${
                        guild.member_count >= guild.max_members
                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
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

  // User is in a guild
  const currentGuild = guildDetails[userGuild];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {currentGuild?.name || 'Guild Hideout'}
          </h1>
          <p className="text-slate-300">Welcome to your guild sanctuary</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Guild Info & Members */}
          <div className="col-span-2 space-y-6">
            {/* Guild Stats */}
            <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Guild Status</h2>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-slate-400">Level</div>
                  <div className="text-3xl font-bold text-purple-300">
                    {currentGuild?.level}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-slate-400">Members</div>
                  <div className="text-3xl font-bold text-blue-300">
                    {currentGuild?.member_count}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-slate-400">Guild XP</div>
                  <div className="text-3xl font-bold text-yellow-300">
                    {currentGuild?.xp}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-slate-400">Capacity</div>
                  <div className="text-3xl font-bold text-pink-300">
                    {currentGuild?.member_count}/{currentGuild?.max_members}
                  </div>
                </div>
              </div>

              {/* Guild XP Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Guild Progression</span>
                  <span className="text-sm text-slate-300">{currentGuild?.xp} XP</span>
                </div>
                <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: '45%' }}
                  />
                </div>
              </div>
            </div>

            {/* Weekly Quests */}
            <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Weekly Quests</h2>

              {currentGuild?.quests && currentGuild.quests.length > 0 ? (
                <div className="space-y-4">
                  {currentGuild.quests.map((quest) => (
                    <div
                      key={quest.id}
                      className="bg-slate-700/50 border border-slate-600 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-white">{quest.title}</h3>
                          <p className="text-sm text-slate-400">{quest.description}</p>
                        </div>
                        <span className="text-sm font-bold text-yellow-300">
                          +{quest.reward_xp} XP
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{
                              width: `${(quest.current_count / quest.target_count) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {quest.current_count}/{quest.target_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-400">No quests this week. Check back later!</p>
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Members</h2>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentGuild?.members?.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg hover:bg-slate-700/50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm">
                      {member.profiles?.avatar_url ? (
                        <img
                          src={member.profiles.avatar_url}
                          alt={member.profiles?.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">
                        {member.profiles?.username}
                      </div>
                      <div className="text-xs text-slate-400">
                        {member.profiles?.xp} XP
                      </div>
                    </div>
                    {member.profiles?.is_donor && (
                      <span className="text-sm">👑</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Watch Party Widget */}
          <div className="space-y-6">
            <div className="bg-slate-800/80 backdrop-blur border border-pink-500/20 rounded-2xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-white mb-4">🎬 Watch Party</h2>

              {!showWatchParty ? (
                <button
                  onClick={() => setShowWatchParty(true)}
                  className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-lg font-bold text-white transition-all"
                >
                  Start Watch Party
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Video Player */}
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      id="watch-party-video"
                      src={watchPartyUrl}
                      controls
                      className="w-full"
                    />
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Video URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={watchPartyUrl}
                        onChange={(e) => setWatchPartyUrl(e.target.value)}
                        placeholder="Paste anime episode URL"
                        className="flex-1 px-3 py-2 bg-slate-700/50 border border-pink-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 text-sm"
                      />
                      <button
                        onClick={handleSetWatchPartyUrl}
                        className="px-3 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-white font-bold transition-all"
                      >
                        Set
                      </button>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleWatchPartyPlay}
                      disabled={isPlayingWatchParty}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        isPlayingWatchParty
                          ? 'bg-slate-600 text-slate-400'
                          : 'bg-green-600 hover:bg-green-500 text-white'
                      }`}
                    >
                      ▶ Play
                    </button>
                    <button
                      onClick={handleWatchPartyPause}
                      disabled={!isPlayingWatchParty}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        !isPlayingWatchParty
                          ? 'bg-slate-600 text-slate-400'
                          : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                      }`}
                    >
                      ⏸ Pause
                    </button>
                  </div>

                  <button
                    onClick={() => setShowWatchParty(false)}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white transition-all"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Leave Guild Button */}
              <button
                onClick={handleLeaveGuild}
                className="w-full mt-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg font-bold transition-all"
              >
                Leave Guild
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
