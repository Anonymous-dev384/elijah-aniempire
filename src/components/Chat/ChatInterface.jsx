import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useProfileStore } from '../../store/profileStore';
import { useGuildStore } from '../../store/guildStore';
import { supabase } from '../../lib/supabase';
import { IconMessage, IconUser, IconSend, IconClock, IconX, IconCoins, CrownIcon } from '../Icons';

export default function ChatInterface({ guildId = null }) {
  const profile          = useProfileStore((state) => state.profile);
  const messages         = useChatStore((state) => guildId ? state.guildMessages[guildId] || [] : state.globalMessages);
  const sendMessage      = useChatStore((state) => state.sendMessage);
  const subscribeToChat  = useChatStore((state) => state.subscribeToChat);
  const unsubscribeFromChat = useChatStore((state) => state.unsubscribeFromChat);
  const error            = useChatStore((state) => state.error);
  const clearError       = useChatStore((state) => state.clearError);
  const userGuild        = useGuildStore((state) => state.userGuild);
  const guildDetails     = useGuildStore((state) => state.guildDetails);

  const [messageText, setMessageText]       = useState('');
  const [isThrottled, setIsThrottled]       = useState(false);
  const [throttleTimeLeft, setThrottleTimeLeft] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    subscribeToChat(guildId);
    return () => unsubscribeFromChat(guildId);
  }, [guildId, subscribeToChat, unsubscribeFromChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isThrottled) return;
    const interval = setInterval(() => {
      setThrottleTimeLeft((prev) => {
        if (prev <= 1) { setIsThrottled(false); clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isThrottled]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isThrottled || !messageText.trim()) return;
    setIsThrottled(true);
    setThrottleTimeLeft(3);
    await sendMessage(messageText, guildId);
    setMessageText('');
  };

  const getTitleColor = (xp) => {
    if (xp < 500)  return '#9ca3af';
    if (xp < 1500) return '#60a5fa';
    if (xp < 3000) return '#a78bfa';
    if (xp < 4500) return 'var(--gold)';
    if (xp < 6000) return '#f87171';
    return '#dc2626';
  };

  const getHierarchyTitleShort = (xp) => {
    if (xp < 500)  return 'Peasant';
    if (xp < 1500) return 'Knight';
    if (xp < 3000) return 'Noble';
    if (xp < 4500) return 'High Priest';
    if (xp < 6000) return 'King';
    return 'Overlord';
  };

  const roomName = guildId ? guildDetails[guildId]?.name || 'Guild Chat' : 'Global Chat';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 8px var(--green)' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--text-primary)' }}>{roomName}</h1>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{messages.length} messages</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <IconMessage size={40} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-muted)' }}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: 12 }} className="chat-message-row">
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden', border: '2px solid var(--border-subtle)',
              }}>
                {msg.profiles?.avatar_url
                  ? <img src={msg.profiles.avatar_url} alt={msg.profiles.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <IconUser size={18} color="rgba(255,255,255,0.7)" />
                }
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{msg.profiles?.username}</span>
                  {msg.profiles?.is_donor && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', background: 'var(--gold-glow-soft)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-active)' }}>
                      <CrownIcon size={10} color="var(--gold)" /> Donor
                    </span>
                  )}
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: getTitleColor(msg.profiles?.xp || 0) }}>
                    {getHierarchyTitleShort(msg.profiles?.xp || 0)}
                  </span>
                  <span className="chat-timestamp" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', padding: '8px 14px',
                  color: 'var(--text-primary)', fontSize: '0.9rem', wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: '0 24px', padding: '10px 14px', background: 'rgba(217,59,59,0.12)', border: '1px solid var(--red)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--red)', fontSize: '0.85rem' }}>
          <span>{error}</span>
          <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="glass-panel" style={{ borderRadius: 0, borderBottom: 'none', borderLeft: 'none', borderRight: 'none', padding: '14px 24px' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isThrottled}
            placeholder={isThrottled ? `Please wait ${throttleTimeLeft.toFixed(1)}s…` : 'Type a message…'}
            maxLength={2000}
            className="input"
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={isThrottled || !messageText.trim()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 46, height: 46, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
              background: isThrottled || !messageText.trim() ? 'var(--bg-elevated)' : 'var(--gold)',
              color: isThrottled || !messageText.trim() ? 'var(--text-muted)' : 'var(--bg-primary)',
              transition: 'all var(--transition-fast)', flexShrink: 0,
            }}
          >
            {isThrottled ? <IconClock size={18} /> : <IconSend size={18} />}
          </button>
        </form>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>{messageText.length}/2000</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconCoins size={11} /> +1 credit per message (max 100/day)
          </span>
        </div>
      </div>

      <style>{`
        .chat-message-row .chat-timestamp { opacity: 0; transition: opacity 0.2s; }
        .chat-message-row:hover .chat-timestamp { opacity: 1; }
      `}</style>
    </div>
  );
}
