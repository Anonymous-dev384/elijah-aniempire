import { useState, useEffect, useCallback } from 'react'
import { useRPGStore } from '../store/rpgStore'
import {
  IconCoins, IconGem, IconShoppingBag, IconTag, IconPackage, IconSparkles,
  IconPalette, IconMusic, IconImage, IconCheck, IconX, IconFire,
  IconStar, IconZap, IconPlay, IconWallet
} from '../components/Icons'

// ── Mock Data ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',       label: 'All',            icon: <IconShoppingBag size={15}/>, count: 148 },
  { id: 'borders',   label: 'Borders',         icon: <IconImage size={15}/>,       count: 24 },
  { id: 'backgrounds',label:'Backgrounds',     icon: <IconPalette size={15}/>,     count: 18 },
  { id: 'particles', label: 'Particle FX',     icon: <IconSparkles size={15}/>,    count: 12 },
  { id: 'chat',      label: 'Chat Effects',    icon: <IconZap size={15}/>,         count: 8  },
  { id: 'themes',    label: 'Profile Themes',  icon: <IconStar size={15}/>,        count: 16 },
  { id: 'namecolors',label: 'Name Colors',     icon: <IconTag size={15}/>,         count: 10 },
  { id: 'music',     label: 'Music Packs',     icon: <IconMusic size={15}/>,       count: 14 },
  { id: 'stickers',  label: 'Sticker Packs',   icon: <IconPackage size={15}/>,     count: 22 },
  { id: 'bundles',   label: 'Bundles',         icon: <IconPackage size={15}/>,     count: 8  },
  { id: 'limited',   label: 'Limited',         icon: <IconFire size={15}/>,        count: 6, limited: true },
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

const ALL_ITEMS = [
  // Borders
  { id:'b1', category:'borders',     name:'Dragon Scale',       rarity:'Epic',      price:800,    currency:'cr',   preview:'border' },
  { id:'b2', category:'borders',     name:'Cherry Blossom',     rarity:'Rare',      price:350,    currency:'cr',   preview:'border' },
  { id:'b3', category:'borders',     name:'Crown Royal',        rarity:'Legendary', price:2500,   currency:'cr',   preview:'border' },
  { id:'b4', category:'borders',     name:'Neon Pulse',         rarity:'Rare',      price:400,    currency:'cr',   preview:'border' },
  { id:'b5', category:'borders',     name:'Void Realm',         rarity:'Epic',      price:750,    currency:'cr',   preview:'border' },
  // Backgrounds
  { id:'bg1',category:'backgrounds', name:'Sakura Rain',        rarity:'Common',    price:150,    currency:'cr',   preview:'background', previewColor:'#ff9ecd' },
  { id:'bg2',category:'backgrounds', name:'Cyber Grid',         rarity:'Rare',      price:320,    currency:'cr',   preview:'background', previewColor:'#00D9FF' },
  { id:'bg3',category:'backgrounds', name:'Cosmic Abyss',       rarity:'Epic',      price:680,    currency:'cr',   preview:'background', previewColor:'#8B52C4' },
  { id:'bg4',category:'backgrounds', name:'Inferno Plains',     rarity:'Rare',      price:280,    currency:'cr',   preview:'background', previewColor:'#D93B3B' },
  // Particles
  { id:'p1', category:'particles',   name:'Star Burst',         rarity:'Rare',      price:500,    currency:'cr',   preview:'particles' },
  { id:'p2', category:'particles',   name:'Cherry Petals',      rarity:'Rare',      price:420,    currency:'cr',   preview:'particles', particleColor:'#ffb7c5' },
  { id:'p3', category:'particles',   name:'Dark Matter',        rarity:'Epic',      price:900,    currency:'cr',   preview:'particles', particleColor:'#8B52C4' },
  // Name Colors
  { id:'nc1',category:'namecolors',  name:'Void Black',         rarity:'Common',    price:100,    currency:'cr',   preview:'namecolor', nameGradient:'#665C46,#A89878' },
  { id:'nc2',category:'namecolors',  name:'Phoenix Flame',      rarity:'Rare',      price:300,    currency:'cr',   preview:'namecolor', nameGradient:'#D93B3B,#D4A843' },
  { id:'nc3',category:'namecolors',  name:'Legendary Gold',     rarity:'Legendary', price:1500,   currency:'gems', preview:'namecolor', nameGradient:'#D4A843,#fff8dc' },
  { id:'nc4',category:'namecolors',  name:'Ocean Wave',         rarity:'Rare',      price:250,    currency:'cr',   preview:'namecolor', nameGradient:'#4A8FCC,#45A35E' },
  // Chat Effects
  { id:'ce1',category:'chat',        name:'Rainbow Text',       rarity:'Rare',      price:250,    currency:'cr',   preview:'chat' },
  { id:'ce2',category:'chat',        name:'Neon Glow',          rarity:'Epic',      price:600,    currency:'cr',   preview:'chat' },
  { id:'ce3',category:'chat',        name:'Sparkle Trail',      rarity:'Rare',      price:350,    currency:'cr',   preview:'chat' },
  // Music Packs
  { id:'m1', category:'music',       name:'Shonen OST Pack',    rarity:'Rare',      price:500,    currency:'cr',   preview:'music' },
  { id:'m2', category:'music',       name:'Lo-fi Anime',        rarity:'Common',    price:200,    currency:'cr',   preview:'music' },
  { id:'m3', category:'music',       name:'Epic Battles',       rarity:'Epic',      price:800,    currency:'cr',   preview:'music' },
  { id:'m4', category:'music',       name:'Chill Vibes',        rarity:'Common',    price:180,    currency:'cr',   preview:'music' },
  // Stickers
  { id:'s1', category:'stickers',    name:'Chibi Pack Vol.1',   rarity:'Common',    price:150,    currency:'cr',   preview:'sticker', emoji:'🌸' },
  { id:'s2', category:'stickers',    name:'Reaction Emotes',    rarity:'Rare',      price:300,    currency:'cr',   preview:'sticker', emoji:'😂' },
  { id:'s3', category:'stickers',    name:'Guild War',          rarity:'Epic',      price:600,    currency:'cr',   preview:'sticker', emoji:'⚔️' },
  // Bundles
  { id:'bu1',category:'bundles',     name:'Starter Pack',       rarity:'Common',    price:500,    currency:'cr',   preview:'bundle', bundleCount:5 },
  { id:'bu2',category:'bundles',     name:'Epic Bundle',        rarity:'Epic',      price:1800,   currency:'cr',   preview:'bundle', bundleCount:8, discount:'30% OFF' },
]

const DAILY_FEATURED = [
  { ...ALL_ITEMS[2], originalPrice: 3500, featured: true },
  { ...ALL_ITEMS[12], originalPrice: 2200, featured: true },
  { ...ALL_ITEMS[22], originalPrice: 850,  featured: true },
]

// ── Preview Components ───────────────────────────────────────────────────────
function ItemPreview({ item }) {
  const color = RARITY_STRIPE[item.rarity]

  if (item.preview === 'border') {
    return (
      <div className="preview-area preview-border">
        <div className="preview-avatar-wrap" style={{ border: `3px solid ${color}`, boxShadow: `0 0 12px ${color}55` }}>
          <div className="preview-avatar-inner">
            <span style={{ fontSize: 22 }}>👤</span>
          </div>
        </div>
        {item.rarity === 'Legendary' && (
          <div className="preview-sparkles">✨</div>
        )}
      </div>
    )
  }

  if (item.preview === 'background') {
    const c = item.previewColor || '#4A8FCC'
    return (
      <div className="preview-area preview-bg-area" style={{
        background: `radial-gradient(circle at 30% 40%, ${c}66 0%, transparent 60%), radial-gradient(circle at 70% 70%, ${c}44 0%, transparent 50%), var(--bg-card)`
      }}>
        <div style={{ fontSize: 28, opacity: 0.7 }}>🌌</div>
      </div>
    )
  }

  if (item.preview === 'particles') {
    const c = item.particleColor || '#D4A843'
    return (
      <div className="preview-area preview-particles">
        <div className="particle" style={{ background: c, top: '20%', left: '20%', animationDelay: '0s' }} />
        <div className="particle" style={{ background: c, top: '50%', left: '65%', animationDelay: '0.6s' }} />
        <div className="particle" style={{ background: c, top: '70%', left: '35%', animationDelay: '1.2s' }} />
        <span style={{ fontSize: 24, position: 'relative', zIndex: 1 }}>✨</span>
      </div>
    )
  }

  if (item.preview === 'namecolor') {
    const [c1, c2] = (item.nameGradient || 'var(--gold),#fff').split(',')
    return (
      <div className="preview-area preview-namecolor">
        <span style={{ background: `linear-gradient(90deg, ${c1}, ${c2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: 20, fontFamily: 'var(--font-heading)' }}>AniUser</span>
      </div>
    )
  }

  if (item.preview === 'chat') {
    return (
      <div className="preview-area preview-chat">
        <div className="chat-bubble">
          {item.name === 'Rainbow Text'
            ? <span style={{ background: 'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>Hello! ✨</span>
            : item.name === 'Neon Glow'
            ? <span style={{ color: '#00D9FF', textShadow: '0 0 8px #00D9FF' }}>Hello! ⚡</span>
            : <span style={{ color: 'var(--gold)' }}>Hello! ✨</span>
          }
        </div>
      </div>
    )
  }

  if (item.preview === 'music') {
    return (
      <div className="preview-area preview-music">
        <IconPlay size={28} color="var(--gold)" />
        <div className="waveform">
          {[4,7,5,9,6,8,5,7,4,6].map((h, i) => (
            <div key={i} className="wave-bar" style={{ height: h * 3, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (item.preview === 'sticker') {
    return (
      <div className="preview-area preview-sticker">
        <span style={{ fontSize: 40 }}>{item.emoji || '🎁'}</span>
      </div>
    )
  }

  if (item.preview === 'bundle') {
    return (
      <div className="preview-area preview-bundle">
        <span style={{ fontSize: 36 }}>🎁</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{item.bundleCount} items</span>
      </div>
    )
  }

  return <div className="preview-area" />
}

// ── Buy Modal ────────────────────────────────────────────────────────────────
function BuyModal({ item, onClose, onConfirm, credits, gems }) {
  const [status, setStatus] = useState(null) // null | 'insufficient' | 'success'
  const balance = item.currency === 'gems' ? gems : credits
  const enough  = balance >= item.price

  const handleConfirm = () => {
    if (!enough) { setStatus('insufficient'); return }
    onConfirm(item)
    setStatus('success')
    setTimeout(onClose, 1400)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box glass-panel">
        <button className="modal-close btn btn-ghost btn-sm" onClick={onClose}><IconX size={16}/></button>
        <h3 className="modal-title">{item.name}</h3>

        <div className="modal-preview">
          <ItemPreview item={item} />
        </div>

        <div className="modal-info">
          <div className="modal-price-row">
            {item.currency === 'gems'
              ? <><IconGem size={18} color="var(--purple)"/><span style={{ color: 'var(--purple)', fontWeight: 700, fontSize: 18 }}>{item.price.toLocaleString()} gems</span></>
              : <><IconCoins size={18} color="var(--gold)"/><span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 18 }}>{item.price.toLocaleString()} cr</span></>
            }
          </div>
          <div className="modal-balance">
            Your balance: {item.currency === 'gems'
              ? <span style={{ color: 'var(--purple)' }}><IconGem size={14} color="var(--purple)"/> {gems.toLocaleString()} gems</span>
              : <span style={{ color: 'var(--gold)' }}><IconCoins size={14} color="var(--gold)"/> {credits.toLocaleString()} cr</span>
            }
          </div>
        </div>

        {status === 'insufficient' && <p className="modal-error">❌ Not enough {item.currency === 'gems' ? 'gems' : 'credits'}!</p>}
        {status === 'success'      && <p className="modal-success">✅ Purchased successfully!</p>}

        {status !== 'success' && (
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={!enough}>
              Confirm Purchase
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Item Card ────────────────────────────────────────────────────────────────
function ShopCard({ item, onBuy }) {
  const stripe = RARITY_STRIPE[item.rarity]
  const rarityColor = RARITY_COLORS[item.rarity]

  return (
    <div className="shop-card glass-panel">
      <div className="card-rarity-stripe" style={{ background: stripe }} />
      <ItemPreview item={item} />
      {item.discount && <div className="card-discount-badge">{item.discount}</div>}
      <div className="card-body">
        <p className="card-name">{item.name}</p>
        <div className="card-meta">
          <span className="card-category">{item.category}</span>
          <span className="card-rarity-pill" style={{ color: rarityColor, borderColor: rarityColor + '55', background: rarityColor + '18' }}>{item.rarity}</span>
        </div>
        <div className="card-price-row">
          {item.currency === 'gems'
            ? <><IconGem size={14} color="var(--purple)"/><span style={{ color: 'var(--purple)', fontWeight: 700 }}>{item.price.toLocaleString()}</span><span className="price-label">gems</span></>
            : <><IconCoins size={14} color="var(--gold)"/><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{item.price.toLocaleString()}</span><span className="price-label">cr</span></>
          }
        </div>
        <div className="card-actions">
          <button className="btn btn-ghost btn-sm">Preview</button>
          <button className="btn btn-primary btn-sm" onClick={() => onBuy(item)}>Buy</button>
        </div>
      </div>
    </div>
  )
}

// ── Featured Card ────────────────────────────────────────────────────────────
function FeaturedCard({ item, onBuy }) {
  const stripe = RARITY_STRIPE[item.rarity]
  return (
    <div className="featured-card glass-panel">
      <div className="featured-badge">⭐ FEATURED</div>
      <div className="card-rarity-stripe" style={{ background: stripe }} />
      <ItemPreview item={item} />
      <div className="card-body">
        <p className="card-name">{item.name}</p>
        <div className="featured-price-row">
          {item.currency === 'gems'
            ? <><IconGem size={16} color="var(--purple)"/><span style={{ color: 'var(--purple)', fontWeight: 700, fontSize: 16 }}>{item.price.toLocaleString()} gems</span></>
            : <><IconCoins size={16} color="var(--gold)"/><span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>{item.price.toLocaleString()} cr</span></>
          }
          <span className="featured-original">{item.originalPrice?.toLocaleString()}</span>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => onBuy(item)}>Buy Now</button>
      </div>
    </div>
  )
}

// ── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.floor((midnight - now) / 1000)
      setTime({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return `${String(time.h).padStart(2,'0')}:${String(time.m).padStart(2,'0')}:${String(time.s).padStart(2,'0')}`
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const { credits, gems, spendCredits } = useRPGStore()
  const [localCredits, setLocalCredits] = useState(credits)
  const [localGems,    setLocalGems]    = useState(gems)
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy,   setSortBy]   = useState('featured')
  const [rarityFilter, setRarityFilter] = useState('All')
  const [buyItem,  setBuyItem]  = useState(null)
  const [toast,    setToast]    = useState(null)
  const countdown = useCountdown()

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handleConfirmPurchase = useCallback((item) => {
    if (item.currency === 'gems') {
      setLocalGems(g => g - item.price)
    } else {
      setLocalCredits(c => c - item.price)
    }
    showToast(`🎉 ${item.name} purchased!`)
  }, [showToast])

  const filtered = ALL_ITEMS.filter(item => {
    const catMatch = activeCategory === 'all' || item.category === activeCategory
    const rarMatch = rarityFilter === 'All' || item.rarity === rarityFilter
    return catMatch && rarMatch
  }).sort((a, b) => {
    if (sortBy === 'price-asc')  return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'rarity') {
      const order = { Legendary:0, Epic:1, Rare:2, Common:3 }
      return order[a.rarity] - order[b.rarity]
    }
    return 0
  })

  return (
    <div className="shop-page">
      {toast && <div className="toast-notification">{toast}</div>}

      <div className="shop-layout">
        {/* ── Sidebar ── */}
        <aside className="shop-sidebar glass-panel">
          <div className="sidebar-title">
            <IconShoppingBag size={16} color="var(--gold)"/> Categories
          </div>
          <nav className="sidebar-nav">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`sidebar-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
                <span className="cat-count">{cat.count}</span>
                {cat.limited && <span className="cat-dot" />}
              </button>
            ))}
          </nav>

          {/* Wallet */}
          <div className="sidebar-wallet">
            <div className="wallet-label"><IconWallet size={13} color="var(--text-muted)"/> Wallet</div>
            <div className="wallet-row">
              <IconCoins size={15} color="var(--gold)"/>
              <span className="wallet-val">{localCredits.toLocaleString()}</span>
              <span className="wallet-unit">cr</span>
            </div>
            <div className="wallet-row">
              <IconGem size={15} color="var(--purple)"/>
              <span className="wallet-val" style={{ color: 'var(--purple)' }}>{localGems.toLocaleString()}</span>
              <span className="wallet-unit">gems</span>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="shop-main">
          {/* Daily Rotation */}
          <section className="daily-section">
            <div className="daily-header">
              <h2 className="section-heading gradient-text">Daily Shop</h2>
              <div className="daily-countdown">
                <span className="countdown-label">Resets in</span>
                <span className="countdown-time">{countdown}</span>
              </div>
            </div>
            <div className="featured-grid">
              {DAILY_FEATURED.map(item => (
                <FeaturedCard key={item.id + '-featured'} item={item} onBuy={setBuyItem} />
              ))}
            </div>
          </section>

          {/* Sort & Filter */}
          <div className="filter-bar">
            <div className="sort-row">
              <label className="sort-label">Sort:</label>
              <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="rarity">Rarity</option>
              </select>
            </div>
            <div className="rarity-pills">
              {['All','Common','Rare','Epic','Legendary'].map(r => (
                <button
                  key={r}
                  className={`rarity-pill ${rarityFilter === r ? 'active' : ''}`}
                  style={rarityFilter === r && r !== 'All' ? { background: RARITY_COLORS[r] + '33', borderColor: RARITY_COLORS[r], color: RARITY_COLORS[r] } : {}}
                  onClick={() => setRarityFilter(r)}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Item Grid */}
          <div className="shop-grid">
            {filtered.map(item => (
              <ShopCard key={item.id} item={item} onBuy={setBuyItem} />
            ))}
            {filtered.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <span style={{ fontSize: 48 }}>🔍</span>
                <p>No items found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Buy Modal */}
      {buyItem && (
        <BuyModal
          item={buyItem}
          credits={localCredits}
          gems={localGems}
          onClose={() => setBuyItem(null)}
          onConfirm={handleConfirmPurchase}
        />
      )}

      <style>{`
        .shop-page {
          min-height: 100vh;
          padding: 24px 20px;
          max-width: 1380px;
          margin: 0 auto;
        }

        /* ── Layout ── */
        .shop-layout {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        /* ── Sidebar ── */
        .shop-sidebar {
          width: 180px;
          flex-shrink: 0;
          position: sticky;
          top: 80px;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          padding: 0 6px 8px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 4px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .sidebar-cat-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          width: 100%;
          padding: 7px 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          position: relative;
        }
        .sidebar-cat-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-subtle);
        }
        .sidebar-cat-btn.active {
          background: var(--gold)1a;
          border-color: var(--gold)55;
          color: var(--gold);
        }
        .cat-icon { display: flex; align-items: center; flex-shrink: 0; }
        .cat-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cat-count {
          font-size: 10px;
          background: var(--bg-surface);
          color: var(--text-muted);
          padding: 1px 5px;
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }
        .cat-dot {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 6px var(--red);
        }
        .sidebar-wallet {
          margin-top: 12px;
          padding: 12px 10px;
          background: var(--bg-surface);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }
        .wallet-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .wallet-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 5px;
        }
        .wallet-val { font-weight: 700; font-size: 14px; color: var(--gold); }
        .wallet-unit { font-size: 11px; color: var(--text-muted); }

        /* ── Main ── */
        .shop-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 28px; }

        /* ── Daily Section ── */
        .daily-section {
          background: linear-gradient(135deg, #1a1410 0%, #12100d 100%);
          border: 1px solid var(--gold)44;
          border-radius: var(--radius-xl);
          padding: 22px;
          box-shadow: 0 0 30px var(--gold)0d;
        }
        .daily-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .section-heading {
          font-size: 1.35rem;
          font-family: var(--font-heading);
          font-weight: 700;
          margin: 0;
        }
        .daily-countdown {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          padding: 6px 14px;
        }
        .countdown-label { font-size: 11px; color: var(--text-muted); }
        .countdown-time { font-size: 14px; font-weight: 700; color: var(--gold); font-variant-numeric: tabular-nums; letter-spacing: 0.05em; }

        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        /* ── Filter Bar ── */
        .filter-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .sort-row { display: flex; align-items: center; gap: 8px; }
        .sort-label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
        .sort-select {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          padding: 6px 10px;
          font-size: 13px;
          cursor: pointer;
          outline: none;
        }
        .sort-select:focus { border-color: var(--gold); }
        .rarity-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .rarity-pill {
          padding: 5px 13px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .rarity-pill:hover { border-color: var(--border-hover); color: var(--text-primary); }
        .rarity-pill.active { background: var(--gold)22; border-color: var(--gold); color: var(--gold); }

        /* ── Shop Grid ── */
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        /* ── Card Shared ── */
        .shop-card, .featured-card {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-lg);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
          cursor: default;
        }
        .shop-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), var(--shadow-gold);
        }
        .featured-card {
          border-color: var(--gold)66 !important;
          box-shadow: 0 0 16px var(--gold)1a;
        }
        .featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), var(--shadow-gold-lg);
        }
        .card-rarity-stripe {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          z-index: 2;
        }
        .featured-badge {
          position: absolute;
          top: 10px; right: 10px;
          background: var(--gold);
          color: var(--bg-primary);
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          z-index: 3;
        }
        .card-discount-badge {
          position: absolute;
          top: 10px; left: 14px;
          background: var(--red);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          z-index: 3;
        }

        /* ── Preview Areas ── */
        .preview-area {
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          overflow: hidden;
          flex-direction: column;
        }
        .preview-border { position: relative; }
        .preview-avatar-wrap {
          width: 64px; height: 64px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .preview-avatar-inner {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: var(--bg-elevated);
          display: flex; align-items: center; justify-content: center;
        }
        .preview-sparkles {
          position: absolute; top: 12px; right: 20px; font-size: 16px;
          animation: sparkle 1.5s ease-in-out infinite alternate;
        }
        @keyframes sparkle {
          from { opacity: 0.4; transform: scale(0.9); }
          to   { opacity: 1;   transform: scale(1.1); }
        }
        .preview-particles { position: relative; background: #0d0b09; }
        .particle {
          position: absolute;
          width: 8px; height: 8px;
          border-radius: 50%;
          animation: float-up 2.5s ease-in-out infinite;
          opacity: 0.85;
        }
        @keyframes float-up {
          0%   { transform: translateY(0) scale(1);   opacity: 0.85; }
          50%  { transform: translateY(-18px) scale(1.3); opacity: 1; }
          100% { transform: translateY(0) scale(1);   opacity: 0.85; }
        }
        .preview-namecolor { background: #0d0b09; }
        .preview-chat { background: #0d0b09; }
        .chat-bubble {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 8px 14px;
          font-size: 14px;
        }
        .preview-music { background: #0d0b09; flex-direction: column; gap: 8px; }
        .waveform { display: flex; align-items: flex-end; gap: 3px; height: 30px; }
        .wave-bar {
          width: 4px;
          background: var(--gold);
          border-radius: 2px;
          animation: wave 0.8s ease-in-out infinite alternate;
        }
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
        .preview-sticker, .preview-bundle { background: #0d0b09; flex-direction: column; gap: 4px; }

        /* ── Card Body ── */
        .card-body { padding: 11px 13px 13px; }
        .card-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
        .card-category {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .card-rarity-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-price-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 10px;
        }
        .price-label { font-size: 11px; color: var(--text-muted); }
        .card-actions { display: flex; gap: 6px; }
        .card-actions .btn { flex: 1; font-size: 12px; padding: 6px 0; }

        /* Featured card */
        .featured-price-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .featured-original {
          font-size: 12px;
          color: var(--text-muted);
          text-decoration: line-through;
        }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          padding: 20px;
        }
        .modal-box {
          width: 340px;
          max-width: 95vw;
          padding: 24px;
          position: relative;
          border-radius: var(--radius-xl) !important;
        }
        .modal-close {
          position: absolute;
          top: 14px; right: 14px;
          padding: 4px 6px;
        }
        .modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0 0 16px;
          font-family: var(--font-heading);
        }
        .modal-preview { margin-bottom: 16px; border-radius: var(--radius-md); overflow: hidden; }
        .modal-info { margin-bottom: 14px; }
        .modal-price-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .modal-balance { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .modal-balance span { display: flex; align-items: center; gap: 3px; }
        .modal-error { color: var(--red); font-size: 13px; margin: 0 0 12px; font-weight: 600; }
        .modal-success { color: var(--green); font-size: 13px; margin: 0 0 12px; font-weight: 600; }
        .modal-actions { display: flex; gap: 10px; }
        .modal-actions .btn { flex: 1; }

        /* ── Toast ── */
        .toast-notification {
          position: fixed;
          bottom: 90px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-elevated);
          border: 1px solid var(--gold);
          color: var(--text-primary);
          padding: 10px 22px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          z-index: 10000;
          box-shadow: var(--shadow-gold);
          animation: toast-in 0.3s ease;
          white-space: nowrap;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Empty State ── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--text-muted);
          gap: 10px;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .shop-grid { grid-template-columns: repeat(3, 1fr); }
          .featured-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 860px) {
          .shop-layout { flex-direction: column; }
          .shop-sidebar { width: 100%; position: static; flex-direction: row; flex-wrap: wrap; }
          .sidebar-nav { flex-direction: row; flex-wrap: wrap; }
          .sidebar-cat-btn { width: auto; }
          .sidebar-wallet { margin-top: 0; }
          .shop-grid { grid-template-columns: repeat(2, 1fr); }
          .featured-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .shop-grid { grid-template-columns: 1fr 1fr; }
          .featured-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
