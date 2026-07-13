import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconMail, IconLock, CrownIcon } from '../components/Icons'

function CastleSVG() {
  return (
    <svg viewBox="0 0 400 350" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 130, height: 'auto', filter: 'drop-shadow(0 4px 20px rgba(212,168,67,0.18))', animation: 'float 5s ease-in-out infinite' }}>
      <ellipse cx="200" cy="325" rx="170" ry="25" fill="#3D3420" />
      <rect x="90" y="180" width="220" height="148" rx="3" fill="#B8941F" stroke="#7A6410" strokeWidth="2" />
      {[90, 118, 146, 174, 202, 230, 258, 286].map((x, i) => <rect key={i} x={x} y="168" width="20" height="16" fill="#B8941F" stroke="#7A6410" strokeWidth="1.5" />)}
      <rect x="60" y="115" width="55" height="213" rx="3" fill="#C9A825" stroke="#7A6410" strokeWidth="2" />
      <rect x="53" y="100" width="69" height="18" rx="2" fill="#B8941F" stroke="#7A6410" strokeWidth="1.5" />
      {[53, 66, 79, 92, 105].map((x, i) => <rect key={i} x={x} y="86" width="10" height="15" fill="#B8941F" stroke="#7A6410" strokeWidth="1" />)}
      <rect x="76" y="140" width="14" height="24" rx="7" fill="#1a1400" /><rect x="76" y="140" width="14" height="24" rx="7" fill="rgba(212,168,67,0.25)" />
      <rect x="285" y="115" width="55" height="213" rx="3" fill="#C9A825" stroke="#7A6410" strokeWidth="2" />
      <rect x="278" y="100" width="69" height="18" rx="2" fill="#B8941F" stroke="#7A6410" strokeWidth="1.5" />
      {[278, 291, 304, 317, 330].map((x, i) => <rect key={i} x={x} y="86" width="10" height="15" fill="#B8941F" stroke="#7A6410" strokeWidth="1" />)}
      <rect x="302" y="140" width="14" height="24" rx="7" fill="#1a1400" /><rect x="302" y="140" width="14" height="24" rx="7" fill="rgba(212,168,67,0.25)" />
      <rect x="160" y="65" width="80" height="120" rx="3" fill="#D4A843" stroke="#7A6410" strokeWidth="2" />
      <polygon points="155,67 200,14 245,67" fill="#7A6410" stroke="#5C4A00" strokeWidth="1.5" />
      <circle cx="200" cy="18" r="4" fill="#D4A843" />
      <rect x="186" y="92" width="28" height="38" rx="14" fill="#1a1400" /><rect x="186" y="92" width="28" height="38" rx="14" fill="rgba(212,168,67,0.3)" />
      <line x1="200" y1="92" x2="200" y2="130" stroke="#7A6410" strokeWidth="2" />
      <line x1="186" y1="111" x2="214" y2="111" stroke="#7A6410" strokeWidth="2" />
      <rect x="175" y="260" width="50" height="68" rx="25" fill="#1a1400" /><rect x="175" y="260" width="50" height="68" rx="25" fill="rgba(212,168,67,0.12)" />
      <line x1="200" y1="260" x2="200" y2="328" stroke="#7A6410" strokeWidth="2" />
      <line x1="85" y1="86" x2="85" y2="62" stroke="#7A6410" strokeWidth="2" />
      <polygon points="85,62 102,68 85,74" fill="#D93B3B" opacity="0.75" />
      <line x1="315" y1="86" x2="315" y2="62" stroke="#7A6410" strokeWidth="2" />
      <polygon points="315,62 332,68 315,74" fill="#D93B3B" opacity="0.75" />
    </svg>
  )
}

function Particles() {
  const p = Array.from({ length: 12 }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 7, dur: 7 + Math.random() * 9, size: 1.5 + Math.random() * 3, op: 0.15 + Math.random() * 0.35 }))
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
    {p.map(x => <div key={x.id} style={{ position: 'absolute', bottom: -10, left: `${x.left}%`, width: x.size, height: x.size, opacity: x.op, background: 'var(--gold)', borderRadius: '50%', animation: `particleDrift ${x.dur}s linear ${x.delay}s infinite` }} />)}
  </div>
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="auth-page">
      <Particles />
      <div className="auth-card anim-fade-up">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><Link to="/" style={{ display: 'inline-flex' }}><CastleSVG /></Link></div>
        <h1 className="auth-title">Enter the Empire</h1>
        <p className="auth-sub">Welcome back</p>
        <form onSubmit={e => e.preventDefault()} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">EMAIL</label>
            <div style={{ position: 'relative' }}>
              <IconMail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="input" style={{ paddingLeft: 42 }} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <IconLock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="input" style={{ paddingLeft: 42 }} type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><a href="#" style={{ fontSize: '0.72rem', color: 'var(--gold)', opacity: 0.7 }}>Forgot password?</a></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: '0.84rem' }}>Log In</button>
        </form>
        <div className="divider" />
        <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No account yet? <Link to="/signup" style={{ color: 'var(--gold)', fontWeight: 600 }}>Sign up →</Link>
        </p>
      </div>

      <style>{`
        .auth-card {
          position:relative; z-index:2; width:100%; max-width:380px;
          padding:24px 26px; margin:16px;
          background:rgba(14,13,10,0.9); border:1px solid var(--border-default);
          border-radius:var(--radius-xl); backdrop-filter:blur(20px);
          box-shadow:var(--shadow-card), 0 0 60px rgba(212,168,67,0.05);
        }
        .auth-title { font-family:var(--font-brand); font-size:1.45rem; color:var(--gold); text-align:center; margin-bottom:2px; }
        .auth-sub { color:var(--text-muted); font-size:0.78rem; text-align:center; margin-bottom:18px; }
        .auth-form { display:flex; flex-direction:column; gap:10px; }
        .auth-field { display:flex; flex-direction:column; gap:4px; }
        .auth-label { font-size:0.68rem; color:var(--text-secondary); font-weight:700; letter-spacing:0.05em; }
      `}</style>
    </div>
  )
}
