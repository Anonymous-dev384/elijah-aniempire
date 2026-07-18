import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useProfileStore } from '../../store/profileStore';
import { useGuildStore } from '../../store/guildStore';
import { supabase } from '../../lib/supabase';

export default function ChatInterface({ guildId = null }) {
  const profile = useProfileStore((state) => state.profile);
  const messages = useChatStore((state) =>
    guildId ? state.guildMessages[guildId] || [] : state.globalMessages
  );
  const sendMessage = useChatStore((state) => state.sendMessage);
  const subscribeToChat = useChatStore((state) => state.subscribeToChat);
  const unsubscribeFromChat = useChatStore((state) => state.unsubscribeFromChat);
  const error = useChatStore((state) => state.error);
  const clearError = useChatStore((state) => state.clearError);

  const userGuild = useGuildStore((state) => state.userGuild);
  const guildDetails = useGuildStore((state) => state.guildDetails);

  const [messageText, setMessageText] = useState('');
  const [isThrottled, setIsThrottled] = useState(false);
  const [throttleTimeLeft, setThrottleTimeLeft] = useState(0);
  const messagesEndRef = useRef(null);

  // Subscribe to chat on mount
  useEffect(() => {
    subscribeToChat(guildId);
    return () => unsubscribeFromChat(guildId);
  }, [guildId, subscribeToChat, unsubscribeFromChat]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle throttle countdown
  useEffect(() => {
    if (!isThrottled) return;

    const interval = setInterval(() => {
      setThrottleTimeLeft((prev) => {
        if (prev <= 1) {
          setIsThrottled(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isThrottled]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (isThrottled) return;
    if (!messageText.trim()) return;

    // Apply throttle
    setIsThrottled(true);
    setThrottleTimeLeft(3);

    await sendMessage(messageText, guildId);
    setMessageText('');
  };

  const getTitleColor = (xp) => {
    if (xp < 500) return 'text-gray-400';
    if (xp < 1500) return 'text-blue-400';
    if (xp < 3000) return 'text-purple-400';
    if (xp < 4500) return 'text-yellow-400';
    if (xp < 6000) return 'text-red-400';
    return 'text-red-600';
  };

  const getHierarchyTitleShort = (xp) => {
    if (xp < 500) return 'Peasant';
    if (xp < 1500) return 'Knight';
    if (xp < 3000) return 'Noble';
    if (xp < 4500) return 'High Priest';
    if (xp < 6000) return 'King';
    return 'Overlord';
  };

  const roomName = guildId
    ? guildDetails[guildId]?.name || 'Guild Chat'
    : 'Global Chat';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur border-b border-purple-500/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <h1 className="text-2xl font-bold text-white">{roomName}</h1>
          <span className="text-sm text-slate-400 ml-auto">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-slate-400">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
                title={msg.profiles?.username}
              >
                {msg.profiles?.avatar_url ? (
                  <img
                    src={msg.profiles.avatar_url}
                    alt={msg.profiles.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  '👤'
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                {/* Author info */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-white hover:text-purple-300 cursor-pointer transition-colors">
                    {msg.profiles?.username}
                  </span>

                  {/* Donor badge */}
                  {msg.profiles?.is_donor && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/50">
                      👑 Donor
                    </span>
                  )}

                  {/* Hierarchy title */}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${getTitleColor(
                      msg.profiles?.xp || 0
                    )}`}
                  >
                    {getHierarchyTitleShort(msg.profiles?.xp || 0)}
                  </span>

                  {/* Timestamp */}
                  <span className="text-xs text-slate-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Message text */}
                <div className="bg-slate-700/30 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 break-words hover:bg-slate-700/50 transition-colors">
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-3 mx-6 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-slate-800/80 backdrop-blur border-t border-purple-500/20 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isThrottled}
            placeholder={
              isThrottled
                ? `Please wait ${throttleTimeLeft.toFixed(1)}s...`
                : 'Type a message...'
            }
            maxLength={2000}
            className="flex-1 px-4 py-3 bg-slate-700/50 border border-purple-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />

          <button
            type="submit"
            disabled={isThrottled || !messageText.trim()}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              isThrottled || !messageText.trim()
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
            }`}
          >
            {isThrottled ? '⏳' : '📤'}
          </button>
        </form>

        {/* Character count and credits info */}
        <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
          <span>{messageText.length}/2000</span>
          <span>💰 +1 Credit per message (max 100/day)</span>
        </div>
      </div>
    </div>
  );
}
