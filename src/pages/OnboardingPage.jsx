import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FACTIONS } from '../store/rpgStore'
import { CrownIcon, IconCheck } from '../components/Icons'

const FACTION_DESCS = {
  shonen:  'Pure power, never-give-up spirit',
  seinen:  'Complex stories, strategic minds',
  shoujo:  'Romance, bonds, emotional depth',
  cyber:   'Technology rules the new world',
  fantasy: 'Magic, quests, epic adventure',
  mecha:   'Iron giants, tactical combat',
  sol:     'Chill vibes, cozy moments',
  horror:  'Fear is your power',
  isekai:  'Transported to another world',
  mystic:  'Ancient arts, hidden knowledge',
}

const GENRES = [
  'Action', 'Romance', 'Horror', 'Comedy', 'Isekai', 'Sports',
  'Slice of Life', 'Mecha', 'Fantasy', 'Sci-Fi', 'Mystery',
  'Psychological', 'Drama', 'Supernatural', 'Music', 'Thriller',
]

function ProgressBar({ step, total }) {
  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i < step ? 'var(--gold)' : i === step - 1 ? 'var(--gold)' : 'var(--bg-surface)',
              border: `2px solid ${i < step ? 'var(--gold)' : 'var(--border-default)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: i < step ? 'var(--bg-primary)' : 'var(--text-muted)',
              boxShadow: i === step - 1 ? 'var(--shadow-gold)' : 'none',
              transition: 'all var(--transition-base)',
            }}>
              {i < step - 1 ? <IconCheck size={13} color="var(--bg-primary)" /> : i + 1}
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
          width: `${((step - 1) / (total - 1)) * 100}%`,
          transition: 'width var(--transition-base)',
          boxShadow: '0 0 8px var(--gold-glow)',
        }} />
      </div>
    </div>
  )
}

// Step 1 — Welcome
function StepWelcome({ onNext }) {
  return (
    <div className="ob-step">
      <div className="ob-crown-wrap">
        <CrownIcon size={80} color="var(--gold)" style={{ filter: 'drop-shadow(0 0 24px rgba(212,168,67,0.55))' }} />
      </div>
      <h1 className="ob-brand-title gradient-text">Welcome to the Empire</h1>
      <p className="ob-subtitle">Your anime journey begins here. Build your legacy, find your faction, and rise through the ranks of AniEmpire.</p>
      <button className="btn btn-primary ob-cta" onClick={onNext}>
        Begin Your Journey →
      </button>
    </div>
  )
}

// Step 2 — Choose Faction
function StepFaction({ onNext }) {
  const [selected, setSelected] = useState(null)
  return (
    <div className="ob-step">
      <h2 className="ob-heading">Choose Your Faction</h2>
      <p className="ob-subtitle">Your faction shapes your identity in the Empire. Choose wisely — this defines your house.</p>
      <div className="ob-faction-grid">
        {Object.values(FACTIONS).map(f => (
          <button key={f.id} onClick={() => setSelected(f.id)}
            className={`ob-faction-card${selected === f.id ? ' selected' : ''}`}
            style={{
              '--fc': f.color,
              borderColor: selected === f.id ? f.color : 'var(--border-default)',
              background: selected === f.id ? `${f.color}14` : 'var(--bg-surface)',
              boxShadow: selected === f.id ? `0 0 18px ${f.color}44` : 'none',
            }}>
            <span className="ob-faction-icon">{f.icon}</span>
            <span className="ob-faction-label" style={{ color: selected === f.id ? f.color : 'var(--text-primary)' }}>{f.label}</span>
            <span className="ob-faction-desc">{FACTION_DESCS[f.id]}</span>
          </button>
        ))}
      </div>
      <button className="btn btn-primary ob-cta" disabled={!selected} onClick={onNext}
        style={{ opacity: selected ? 1 : 0.45, cursor: selected ? 'pointer' : 'not-allowed' }}>
        Continue →
      </button>
    </div>
  )
}

// Step 3 — Profile Setup
function StepProfile({ onNext }) {
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')

  const validate = (v) => {
    if (v.length < 3) return 'Minimum 3 characters'
    if (v.length > 20) return 'Maximum 20 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Only letters, numbers, underscore'
    return ''
  }

  const handleChange = (v) => {
    setUsername(v)
    setError(validate(v))
  }

  const valid = username.length >= 3 && !error

  return (
    <div className="ob-step">
      <h2 className="ob-heading">Set Up Your Profile</h2>
      <p className="ob-subtitle">This is how the Empire will know you. Choose a name worthy of your legacy.</p>

      <div className="ob-avatar-circle" style={{ margin: '0 auto 28px', cursor: 'pointer' }}>
        <span style={{ fontSize: 36, fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)' }}>
          {username ? username[0].toUpperCase() : '?'}
        </span>
        <span className="ob-avatar-overlay">📷</span>
      </div>

      <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>Username *</label>
        <input
          value={username} onChange={e => handleChange(e.target.value)}
          placeholder="your_username" maxLength={20}
          style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-surface)', border: `1.5px solid ${error ? 'var(--red)' : valid ? 'var(--green)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 15, outline: 'none', marginBottom: 4, transition: 'border-color var(--transition-fast)' }}
        />
        {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}
        {valid && <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 8 }}>✓ Looks good!</div>}
        {!error && !valid && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>3–20 chars, letters/numbers/underscore</div>}

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0 6px', fontWeight: 600 }}>Bio <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
        <div style={{ position: 'relative' }}>
          <textarea
            value={bio} onChange={e => setBio(e.target.value.slice(0, 160))}
            maxLength={160} rows={3}
            placeholder="A few words about your anime journey..."
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'var(--font-body)' }}
          />
          <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: 'var(--text-muted)' }}>{bio.length}/160</span>
        </div>
      </div>

      <button className="btn btn-primary ob-cta" disabled={!valid} onClick={onNext}
        style={{ opacity: valid ? 1 : 0.45, cursor: valid ? 'pointer' : 'not-allowed', marginTop: 28 }}>
        Continue →
      </button>
    </div>
  )
}

// Step 4 — Genre Interests
function StepInterests({ onNext }) {
  const [selected, setSelected] = useState([])
  const toggle = (g) => setSelected(s => s.includes(g) ? s.filter(x => x !== g) : [...s, g])
  const valid = selected.length >= 3

  return (
    <div className="ob-step">
      <h2 className="ob-heading">What Kind of Anime Do You Love?</h2>
      <p className="ob-subtitle">Pick your favourites so we can tailor your experience. Select at least 3.</p>
      <div className="ob-genre-grid">
        {GENRES.map(g => (
          <button key={g} onClick={() => toggle(g)}
            className={`ob-genre-pill${selected.includes(g) ? ' selected' : ''}`}>
            {selected.includes(g) && <IconCheck size={12} />}
            {g}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: selected.length < 3 ? 'var(--text-muted)' : 'var(--green)', marginBottom: 24, transition: 'color var(--transition-fast)' }}>
        {selected.length < 3 ? `Select at least ${3 - selected.length} more` : `${selected.length} selected — nice taste!`}
      </div>
      <button className="btn btn-primary ob-cta" disabled={!valid} onClick={onNext}
        style={{ opacity: valid ? 1 : 0.45, cursor: valid ? 'pointer' : 'not-allowed' }}>
        Continue →
      </button>
    </div>
  )
}

// Step 5 — Ready!
function StepReady({ faction }) {
  const navigate = useNavigate()
  const f = FACTIONS[faction] || FACTIONS.shonen

  return (
    <div className="ob-step">
      <div className="ob-crown-pulse">
        <CrownIcon size={80} color="var(--gold)" />
      </div>
      <h1 className="ob-brand-title gradient-text">You're in the Empire!</h1>
      <p className="ob-subtitle">Your legend starts now. The Empire awaits your mark.</p>

      <div className="ob-ready-cards">
        <div className="ob-ready-card">
          <span style={{ fontSize: 24 }}>{f.icon}</span>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Your Faction</div>
            <div style={{ fontWeight: 700, color: f.color }}>{f.label}</div>
          </div>
        </div>
        <div className="ob-ready-card">
          <span style={{ fontSize: 24 }}>⚔️</span>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Status</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>First quests unlocked</div>
          </div>
        </div>
        <div className="ob-ready-card">
          <span style={{ fontSize: 24 }}>✨</span>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Bonus XP</div>
            <div style={{ fontWeight: 700, color: 'var(--gold)' }}>+25 XP just for joining</div>
          </div>
        </div>
      </div>

      <button className="btn btn-primary ob-cta" onClick={() => navigate('/')}>
        Enter the Empire →
      </button>
    </div>
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [faction, setFaction] = useState(null)
  const TOTAL = 5

  const next = () => setStep(s => Math.min(s + 1, TOTAL))

  const handleFactionNext = () => {
    // faction state passed separately — just advance
    next()
  }

  return (
    <>
      <style>{`
        .ob-page {
          min-height: 100vh; background: var(--bg-primary);
          display: flex; flex-direction: column; align-items: center;
          justify-content: flex-start; padding: 40px 20px 80px;
          position: relative; overflow: hidden;
        }
        .ob-bg-gradient {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 10%, rgba(212,168,67,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 80% 80%, rgba(139,82,196,0.06) 0%, transparent 70%);
          animation: ob-bg-pulse 8s ease-in-out infinite alternate;
        }
        @keyframes ob-bg-pulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        .ob-content {
          position: relative; z-index: 1;
          width: 100%; max-width: 640px;
          display: flex; flex-direction: column; align-items: center;
        }
        .ob-step {
          width: 100%; display: flex; flex-direction: column;
          align-items: center; text-align: center;
          animation: ob-fade-in 0.35s ease;
        }
        @keyframes ob-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ob-brand-title {
          font-family: var(--font-brand); font-size: clamp(22px, 5vw, 34px);
          font-weight: 700; margin-bottom: 14px; margin-top: 20px;
          line-height: 1.2;
        }
        .ob-heading {
          font-family: var(--font-heading); font-size: clamp(20px, 4vw, 28px);
          font-weight: 700; color: var(--text-primary); margin-bottom: 10px;
        }
        .ob-subtitle {
          font-size: 15px; color: var(--text-secondary); max-width: 440px;
          line-height: 1.6; margin-bottom: 32px;
        }
        .ob-cta {
          width: 100%; max-width: 340px; padding: 14px 28px;
          font-size: 16px; font-weight: 700; border-radius: var(--radius-full) !important;
        }
        .ob-crown-wrap {
          animation: ob-float 3s ease-in-out infinite;
        }
        @keyframes ob-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .ob-crown-pulse {
          animation: ob-pulse 2s ease-in-out infinite;
        }
        @keyframes ob-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 14px rgba(212,168,67,0.4)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 28px rgba(212,168,67,0.7)); }
        }

        /* Faction grid */
        .ob-faction-grid {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 10px; width: 100%; margin-bottom: 28px;
        }
        .ob-faction-card {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          padding: 12px 6px; border-radius: var(--radius-md);
          border: 2px solid var(--border-default);
          cursor: pointer; transition: all var(--transition-fast);
          font-family: var(--font-body);
        }
        .ob-faction-card:hover { border-color: var(--fc, var(--gold)); }
        .ob-faction-icon { font-size: 26px; }
        .ob-faction-label { font-size: 10px; font-weight: 700; line-height: 1.2; }
        .ob-faction-desc { font-size: 9px; color: var(--text-muted); line-height: 1.3; }

        /* Genre pills */
        .ob-genre-grid {
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
          max-width: 520px; margin-bottom: 20px;
        }
        .ob-genre-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 16px; border-radius: var(--radius-full);
          border: 1.5px solid var(--border-default);
          background: var(--bg-surface); color: var(--text-secondary);
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all var(--transition-fast); font-family: var(--font-body);
        }
        .ob-genre-pill:hover { border-color: var(--gold); color: var(--text-primary); }
        .ob-genre-pill.selected {
          border-color: var(--gold); background: var(--gold-glow-soft);
          color: var(--gold); box-shadow: 0 0 10px var(--gold-glow);
        }

        /* Avatar circle */
        .ob-avatar-circle {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--bg-surface); border: 2px solid var(--gold);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .ob-avatar-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; opacity: 0; transition: opacity var(--transition-fast);
        }
        .ob-avatar-circle:hover .ob-avatar-overlay { opacity: 1; }

        /* Ready cards */
        .ob-ready-cards {
          display: flex; flex-direction: column; gap: 12px;
          width: 100%; max-width: 380px; margin-bottom: 32px;
        }
        .ob-ready-card {
          display: flex; align-items: center; gap: 16px;
          padding: 14px 18px; background: var(--bg-elevated);
          border: 1px solid var(--border-default); border-radius: var(--radius-md);
          text-align: left;
        }

        /* Logo / brand */
        .ob-logo {
          font-family: var(--font-brand); font-size: 13px;
          color: var(--gold); letter-spacing: 0.05em; margin-bottom: 32px;
        }

        @media (max-width: 540px) {
          .ob-faction-grid { grid-template-columns: repeat(2, 1fr); }
          .ob-page { padding: 24px 16px 60px; }
        }
      `}</style>

      <div className="ob-page">
        <div className="ob-bg-gradient" />
        <div className="ob-content">
          <div className="ob-logo">⚔ AniEmpire</div>
          <ProgressBar step={step} total={TOTAL} />

          {step === 1 && <StepWelcome onNext={next} />}
          {step === 2 && <StepFaction onNext={next} onFaction={setFaction} />}
          {step === 3 && <StepProfile onNext={next} />}
          {step === 4 && <StepInterests onNext={next} />}
          {step === 5 && <StepReady faction={faction} />}
        </div>
      </div>
    </>
  )
}
