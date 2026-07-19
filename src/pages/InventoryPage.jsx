import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconPackage, IconCheck, IconImage, IconPalette, IconSparkles,
  IconZap, IconTag, IconMusic, IconShoppingBag
} from '../components/Icons'

// ── Mock owned items ─────────────────────────────────────────────────────────
const INITIAL_ITEMS = [
  { id:'oi1',  name:'Dragon Scale Border',     category:'borders',     rarity:'Epic',      equipped: true,  preview:'border',     previewColor:'#8B52C4' },
  { id:'oi2',  name:'Cherry Blossom',           category:'borders',     rarity:'Rare',      equipped: false, preview:'border',     previewColor:'#FFB7C5' },
  { id:'oi3',  name:'Cyber Grid Background',    category:'backgrounds', rarity:'Rare',      equipped: true,  preview:'background', previewColor:'#00D9FF' },
  { id:'oi4',  name:'Star Burst Particles',     category:'particles',   rarity:'Rare',      equipped: true,  preview:'particles',  previewColor:'#D4A843' },
  { id:'oi5',  name:'Chibi Pack Vol.1',         category:'stickers',    rarity:'Common',    equipped: false, preview:'sticker',    emoji:'🌸' },
  { id:'oi6',  name:'Lo-fi Anime Music',        category:'music',       rarity:'Common',    equipped: true,  preview:'music' },
  { id:'oi7',  name:'Neon Pulse Border',        category:'borders',     rarity:'Rare',      equipped: false, preview:'border',     previewColor:'#4A8FCC' },
  { id:'oi8',  name:'Sakura Rain Background',   category:'backgrounds', rarity:'Common',    equipped: false, preview:'background', previewColor:'#ff9ecd' },
  { id:'oi9',  name:'Void Black Name Color',    category:'namecolors',  rarity:'Common',    equipped: false, preview:'namecolor',  nameGradient:'#665C46,#A89878' },
  { id:'oi10', name:'Rainbow Text Chat',        category:'chat',        rarity:'Rare',      equipped: false, preview:'chat' },
  { id:'oi11', name:'Reaction Emotes',          category:'stickers',    rarity:'Rare',      equipped: false, preview:'sticker',    emoji:'😂' },
  { id:'oi12', name:'Shonen OST Pack',          category:'music',       rarity:'Rare',      equipped: true,  preview:'music' },
]

const FILTER_TABS = [
  { id:'all',         label:'All',         icon:<IconShoppingBag size={14}/> },
  { id:'borders',     label:'Borders',     icon:<IconImage size={14}/> },
  { id:'backgrounds', label:'Backgrounds', icon:<IconPalette size={14}/> },
  { id:'particles',   label:'Particles',   icon:<IconSparkles size={14}/> },
  { id:'chat',        label:'Chat',        icon:<IconZap size={14}/> },
  { id:'namecolors',  label:'Name Colors', icon:<IconTag size={14}/> },
  { id:'music',       label:'Music',       icon:<IconMusic size={14}/> },
  { id:'stickers',    label:'Stickers',    icon:<IconPackage size={14}/> },
]

const SLOT_DEFS = [
  { id:'borders',     label:'Border',      icon:'🖼️' },
  { id:'backgrounds', label:'Background',  icon:'🌌' },
  { id:'particles',   label:'Particles',   icon:'✨' },
  { id:'chat',        label:'Chat Effect', icon:'💬' },
  { id:'namecolors',  label:'Name Color',  icon:'🎨' },
]

const RARITY_COLORS = {
  Common:    'var(--text-muted)',
  Rare:      'var(--blue)',
  Epic:      'var(--purple)',
  Legendary: 'var(--gold)',
}
const RARITY_STRIPE = {
  Common:    '#665C46',
  Rare:      '#4A8FCC',
  Epic:      '#8B52C4',
  Legendary: '#D4A843',
}

// ── Preview ──────────────────────────────────────────────────────────────────
function InvPreview({ item }) {
  const stripe = RARITY_STRIPE[item.rarity]

  if (item.preview === 'border') {
    const c = item.previewColor || stripe
    return (
      <div className="inv-preview inv-preview-border">
        <div className="inv-avatar-ring" style={{ border: `3px solid ${c}`, boxShadow: `0 0 12px ${c}55` }}>
          <div className="inv-avatar-inner"><span style={{ fontSize: 22 }}>👤</span></div>
        </div>
      </div>
    )
  }
  if (item.preview === 'background') {
    const c = item.previewColor || '#4A8FCC'
    return (
      <div className="inv-preview inv-preview-bg" style={{
        background: `radial-gradient(circle at 30% 40%, ${c}66 0%, transparent 60%), radial-gradient(circle at 70% 70%, ${c}44 0%, transparent 50%), var(--bg-card)`
      }}>
        <span style={{ fontSize: 28, opacity: 0.7 }}>🌌</span>
      </div>
    )
  }
  if (item.preview === 'particles') {
    const c = item.previewColor || '#D4A843'
    return (
      <div className="inv-preview inv-preview-particles">
        <div className="inv-particle" style={{ background: c, top:'20%', left:'20%', animationDelay:'0s' }} />
        <div className="inv-particle" style={{ background: c, top:'55%', left:'65%', animationDelay:'0.6s' }} />
        <div className="inv-particle" style={{ background: c, top:'70%', left:'35%', animationDelay:'1.2s' }} />
        <span style={{ fontSize: 24, position:'relative', zIndex:1 }}>✨</span>
      </div>
    )
  }
  if (item.preview === 'namecolor') {
    const [c1, c2] = (item.nameGradient || 'var(--gold),#fff').split(',')
    return (
      <div className="inv-preview inv-preview-namecolor">
        <span style={{ background:`linear-gradient(90deg,${c1},${c2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800, fontSize:18, fontFamily:'var(--font-heading)' }}>AniUser</span>
      </div>
    )
  }
  if (item.preview === 'chat') {
    return (
      <div className="inv-preview inv-preview-chat">
        <div className="inv-chat-bubble">
          <span style={{ background:'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700 }}>Hello! ✨</span>
        </div>
      </div>
    )
  }
  if (item.preview === 'music') {
    return (
      <div className="inv-preview inv-preview-music">
        <span style={{ fontSize:28 }}>🎵</span>
        <div className="inv-waveform">
          {[4,7,5,9,6,8,5,7,4].map((h,i) => (
            <div key={i} className="inv-wave-bar" style={{ height: h*3, animationDelay:`${i*0.1}s` }} />
          ))}
        </div>
      </div>
    )
  }
  if (item.preview === 'sticker') {
    return (
      <div className="inv-preview inv-preview-sticker">
        <span style={{ fontSize:38 }}>{item.emoji || '🎁'}</span>
      </div>
    )
  }
  return <div className="inv-preview" />
}

// ── Inventory Card ────────────────────────────────────────────────────────────
function InvCard({ item, onEquip, onUnequip }) {
  const stripe = RARITY_STRIPE[item.rarity]
  const rarityColor = RARITY_COLORS[item.rarity]

  return (
    <div className={`inv-card glass-panel ${item.equipped ? 'inv-card--equipped' : ''}`}>
      <div className="card-rarity-stripe" style={{ background: stripe }} />
      {item.equipped && (
        <div className="inv-equipped-badge">
          <IconCheck size={10}/> EQUIPPED
        </div>
      )}
      <InvPreview item={item} />
      <div className="inv-card-body">
        <p className="inv-card-name">{item.name}</p>
        <div className="inv-card-meta">
          <span className="inv-card-category">{item.category}</span>
          <span className="inv-card-rarity" style={{ color: rarityColor, borderColor: rarityColor+'55', background: rarityColor+'18' }}>{item.rarity}</span>
        </div>
        <button
          className={`btn btn-sm ${item.equipped ? 'inv-btn-unequip' : 'btn-primary'}`}
          style={{ width:'100%' }}
          onClick={() => item.equipped ? onUnequip(item.id) : onEquip(item.id)}
        >
          {item.equipped ? 'Unequip' : 'Equip'}
        </button>
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="inv-empty">
      <span className="inv-empty-icon">🪙</span>
      <p className="inv-empty-title">Nothing here yet</p>
      <p className="inv-empty-sub">You haven't collected any items in this category.</p>
      <Link to="/shop" className="btn btn-primary btn-sm">Visit the Shop</Link>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [items, setItems]       = useState(INITIAL_ITEMS)
  const [activeTab, setActiveTab] = useState('all')

  const handleEquip = (id) => {
    setItems(prev => {
      const target = prev.find(i => i.id === id)
      if (!target) return prev
      // Unequip any other item in same category
      return prev.map(i => {
        if (i.id === id) return { ...i, equipped: true }
        if (i.category === target.category && i.equipped) return { ...i, equipped: false }
        return i
      })
    })
  }

  const handleUnequip = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, equipped: false } : i))
  }

  const filtered = items.filter(i => activeTab === 'all' || i.category === activeTab)

  // Equipped items by slot
  const equippedMap = {}
  items.forEach(i => { if (i.equipped) equippedMap[i.category] = i })

  return (
    <div className="inv-page">
      {/* ── Header ── */}
      <div className="inv-header">
        <div>
          <h1 className="inv-title">
            <IconPackage size={26} color="var(--gold)"/> My Inventory
            <span className="inv-count-badge">{items.length}</span>
          </h1>
          <p className="inv-subtitle">Manage and equip your collected cosmetics</p>
        </div>
        <Link to="/shop" className="btn btn-primary btn-sm">
          <IconShoppingBag size={14}/> Shop More
        </Link>
      </div>

      {/* ── Equipped Slots ── */}
      <section className="inv-equipped-section glass-panel">
        <h2 className="inv-section-label">⚡ Currently Equipped</h2>
        <div className="inv-slots-row">
          {SLOT_DEFS.map(slot => {
            const eq = equippedMap[slot.id]
            return (
              <div key={slot.id} className={`inv-slot ${eq ? 'inv-slot--active' : ''}`}>
                <div className="inv-slot-icon">{slot.icon}</div>
                <div className="inv-slot-label">{slot.label}</div>
                <div className="inv-slot-name">
                  {eq ? eq.name : <span className="inv-slot-empty">None equipped</span>}
                </div>
                {eq && (
                  <button className="inv-slot-remove" onClick={() => handleUnequip(eq.id)} title="Unequip">✕</button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Filter Tabs ── */}
      <div className="inv-tabs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            className={`inv-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
            {tab.id === 'all' && <span className="inv-tab-count">{items.length}</span>}
            {tab.id !== 'all' && (
              <span className="inv-tab-count">{items.filter(i => i.category === tab.id).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Grid or Empty ── */}
      {filtered.length === 0
        ? <EmptyState />
        : (
          <div className="inv-grid">
            {filtered.map(item => (
              <InvCard key={item.id} item={item} onEquip={handleEquip} onUnequip={handleUnequip} />
            ))}
          </div>
        )
      }

      <style>{`
        .inv-page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 20px 60px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── Header ── */
        .inv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .inv-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.8rem;
          font-family: var(--font-heading);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px;
        }
        .inv-count-badge {
          font-size: 13px;
          background: var(--gold)22;
          color: var(--gold);
          border: 1px solid var(--gold)55;
          border-radius: var(--radius-full);
          padding: 2px 10px;
          font-weight: 700;
          font-family: var(--font-body);
        }
        .inv-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        /* ── Equipped Section ── */
        .inv-equipped-section {
          padding: 18px 20px;
        }
        .inv-section-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          margin: 0 0 14px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .inv-slots-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .inv-slot {
          flex: 1;
          min-width: 130px;
          max-width: 200px;
          background: var(--bg-surface);
          border: 1.5px dashed var(--border-default);
          border-radius: var(--radius-lg);
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
          position: relative;
          transition: all var(--transition-fast);
        }
        .inv-slot--active {
          border-style: solid;
          border-color: var(--gold)66;
          background: var(--gold)0a;
        }
        .inv-slot-icon { font-size: 22px; }
        .inv-slot-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          font-weight: 700;
        }
        .inv-slot-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .inv-slot-empty { color: var(--text-muted); font-style: italic; font-weight: 400; }
        .inv-slot-remove {
          position: absolute;
          top: 6px; right: 6px;
          width: 18px; height: 18px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 50%;
          font-size: 9px;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: all var(--transition-fast);
        }
        .inv-slot-remove:hover {
          background: var(--red);
          color: #fff;
          border-color: var(--red);
        }

        /* ── Filter Tabs ── */
        .inv-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .inv-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .inv-tab:hover {
          border-color: var(--border-hover);
          color: var(--text-primary);
        }
        .inv-tab.active {
          background: var(--gold)22;
          border-color: var(--gold);
          color: var(--gold);
        }
        .inv-tab-count {
          font-size: 11px;
          background: var(--bg-surface);
          color: var(--text-muted);
          padding: 1px 6px;
          border-radius: var(--radius-full);
        }
        .inv-tab.active .inv-tab-count {
          background: var(--gold)33;
          color: var(--gold);
        }

        /* ── Inventory Grid ── */
        .inv-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        /* ── Inventory Card ── */
        .inv-card {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-lg);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .inv-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        }
        .inv-card--equipped {
          border-color: var(--green)66 !important;
          box-shadow: 0 0 14px var(--green)1a;
        }
        .card-rarity-stripe {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          z-index: 2;
        }
        .inv-equipped-badge {
          position: absolute;
          top: 8px; right: 8px;
          background: var(--green);
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: var(--radius-full);
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 3px;
          letter-spacing: 0.05em;
        }

        /* ── Preview ── */
        .inv-preview {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          overflow: hidden;
          flex-direction: column;
          gap: 6px;
        }
        .inv-preview-border { position: relative; }
        .inv-avatar-ring {
          width: 58px; height: 58px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .inv-avatar-inner {
          width: 46px; height: 46px;
          border-radius: 50%;
          background: var(--bg-elevated);
          display: flex; align-items: center; justify-content: center;
        }
        .inv-preview-particles { position: relative; }
        .inv-particle {
          position: absolute;
          width: 7px; height: 7px;
          border-radius: 50%;
          animation: inv-float 2.5s ease-in-out infinite;
          opacity: 0.85;
        }
        @keyframes inv-float {
          0%   { transform: translateY(0) scale(1); opacity: 0.85; }
          50%  { transform: translateY(-14px) scale(1.3); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 0.85; }
        }
        .inv-preview-namecolor, .inv-preview-chat, .inv-preview-sticker { background: #0d0b09; }
        .inv-chat-bubble {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 6px 12px;
          font-size: 13px;
        }
        .inv-preview-music { background: #0d0b09; }
        .inv-waveform { display: flex; align-items: flex-end; gap: 2px; height: 26px; }
        .inv-wave-bar {
          width: 3px;
          background: var(--gold);
          border-radius: 2px;
          animation: inv-wave 0.8s ease-in-out infinite alternate;
        }
        @keyframes inv-wave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }

        /* ── Card Body ── */
        .inv-card-body { padding: 10px 12px 12px; }
        .inv-card-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .inv-card-meta { display: flex; align-items: center; gap: 5px; margin-bottom: 8px; flex-wrap: wrap; }
        .inv-card-category { font-size: 10px; color: var(--text-muted); text-transform: capitalize; }
        .inv-card-rarity {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .inv-btn-unequip {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          padding: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .inv-btn-unequip:hover {
          border-color: var(--red);
          color: var(--red);
          background: var(--red)11;
        }

        /* ── Empty State ── */
        .inv-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          gap: 12px;
          color: var(--text-muted);
          text-align: center;
        }
        .inv-empty-icon { font-size: 56px; }
        .inv-empty-title { font-size: 1.1rem; font-weight: 700; color: var(--text-secondary); margin: 0; }
        .inv-empty-sub { font-size: 13px; margin: 0; }

        /* ── Responsive ── */
        @media (max-width: 1100px) { .inv-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 860px)  { .inv-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) {
          .inv-grid { grid-template-columns: repeat(2, 1fr); }
          .inv-slots-row { gap: 8px; }
          .inv-slot { min-width: 100px; padding: 10px 8px; }
          .inv-title { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  )
}
