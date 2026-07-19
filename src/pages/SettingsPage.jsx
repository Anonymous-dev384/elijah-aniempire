import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRPGStore, FACTIONS, TITLES } from '../store/rpgStore'
import { useTheme } from '../context/ThemeContext'
import {
  IconSettings, IconUser, IconShield, IconLock, IconEye, IconBell,
  IconMessage, IconPalette, IconCheck, IconX, IconCamera, IconImage,
  IconUsers, IconMail, IconChevron
} from '../components/Icons'

const NAV_ITEMS = [
  { id: 'account',       label: 'Account',       icon: IconUser },
  { id: 'profile',       label: 'Profile',        icon: IconEye },
  { id: 'appearance',    label: 'Appearance',     icon: IconPalette },
  { id: 'notifications', label: 'Notifications',  icon: IconBell },
  { id: 'privacy',       label: 'Privacy',        icon: IconShield },
  { id: 'security',      label: 'Security',       icon: IconLock },
  { id: 'chat',          label: 'Chat',           icon: IconMessage },
]

function SaveBtn({ onClick, saved }) {
  return (
    <button className="btn btn-primary" style={{ marginTop: 32, gap: 8 }} onClick={onClick}>
      {saved ? <><IconCheck size={16} /> Saved!</> : 'Save Changes'}
    </button>
  )
}

function Toggle({ value, onChange }) {
  return (
    <span
      onClick={() => onChange(!value)}
      style={{
        display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
        width: 44, height: 24, borderRadius: 99, padding: 3,
        background: value ? 'var(--gold)' : 'var(--bg-surface)',
        border: `1.5px solid ${value ? 'var(--gold)' : 'var(--border-default)'}`,
        transition: 'background var(--transition-fast), border-color var(--transition-fast)',
        flexShrink: 0,
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        background: value ? 'var(--bg-primary)' : 'var(--text-muted)',
        transform: value ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform var(--transition-fast), background var(--transition-fast)',
      }} />
    </span>
  )
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, marginTop: 28 }}>{children}</h3>
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>{label}</label>}
      <input style={{
        width: '100%', padding: '10px 14px', background: 'var(--bg-surface)',
        border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)', fontSize: 14, outline: 'none',
        transition: 'border-color var(--transition-fast)',
      }} {...props} />
    </div>
  )
}

// ── Sections ─────────────────────────────────────────────────────────────────

function AccountSection() {
  const [saved, setSaved] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const { username } = useRPGStore()

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div>
      <h2 className="settings-section-heading">Account</h2>

      <SectionTitle>Identity</SectionTitle>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ flex: 1 }}><Input label="Username" defaultValue={username || 'AniUser'} /></div>
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16, whiteSpace: 'nowrap' }}>Check Availability</button>
      </div>
      <Input label="Email Address" type="email" defaultValue="user@aniempire.app" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>aniempire.app/u/</span>
        <input style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13 }} defaultValue={username?.toLowerCase() || 'aniuser'} />
      </div>

      <SectionTitle>Change Password</SectionTitle>
      <Input label="Current Password" type="password" placeholder="••••••••" />
      <Input label="New Password" type="password" placeholder="••••••••" />
      <Input label="Confirm New Password" type="password" placeholder="••••••••" />

      <SaveBtn onClick={save} saved={saved} />

      <SectionTitle>Danger Zone</SectionTitle>
      <div style={{ border: '1.5px solid var(--red)', borderRadius: 'var(--radius-lg)', padding: 20, marginTop: 8 }}>
        <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>Delete Account</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          This action is irreversible. All your data, XP, and guild memberships will be permanently deleted.
        </div>
        <button className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={() => setShowDeleteModal(true)}>
          Delete My Account
        </button>
      </div>

      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: 400, width: '90%', padding: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--red)', marginBottom: 10 }}>Confirm Deletion</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Type <strong style={{ color: 'var(--text-primary)' }}>DELETE</strong> to confirm.</div>
            <input
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 16 }}
              placeholder="Type DELETE"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}>Cancel</button>
              <button className="btn btn-sm" style={{ flex: 1, background: deleteConfirm === 'DELETE' ? 'var(--red)' : 'var(--bg-surface)', color: deleteConfirm === 'DELETE' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed' }} disabled={deleteConfirm !== 'DELETE'}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileSection() {
  const { faction: currentFaction, username } = useRPGStore()
  const [selectedFaction, setSelectedFaction] = useState(currentFaction || 'shonen')
  const [selectedTitle, setSelectedTitle] = useState(TITLES[0].title)
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div>
      <h2 className="settings-section-heading">Profile</h2>

      <SectionTitle>Avatar & Banner</SectionTitle>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} className="avatar-upload-wrap">
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-surface)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--gold)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              {(username || 'A')[0].toUpperCase()}
            </div>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity var(--transition-fast)' }} className="avatar-overlay">
              <IconImage size={22} color="var(--gold)" />
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ height: 60, background: 'var(--bg-surface)', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>
              <IconImage size={18} /> Upload Banner
            </div>
          </div>
        </div>
      </div>

      <SectionTitle>Bio</SectionTitle>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <textarea
          value={bio} onChange={e => setBio(e.target.value.slice(0, 200))}
          maxLength={200} rows={3}
          placeholder="Tell the Empire who you are..."
          style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-body)' }}
        />
        <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 11, color: 'var(--text-muted)' }}>{bio.length}/200</span>
      </div>

      <SectionTitle>Faction</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        {Object.values(FACTIONS).map(f => (
          <button key={f.id} onClick={() => setSelectedFaction(f.id)}
            style={{
              padding: '12px 10px', borderRadius: 'var(--radius-md)', border: `2px solid ${selectedFaction === f.id ? f.color : 'var(--border-default)'}`,
              background: selectedFaction === f.id ? `${f.color}18` : 'var(--bg-surface)',
              boxShadow: selectedFaction === f.id ? `0 0 14px ${f.color}44` : 'none',
              color: selectedFaction === f.id ? f.color : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              transition: 'all var(--transition-fast)', fontFamily: 'var(--font-body)',
            }}>
            <span style={{ fontSize: 22 }}>{f.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{f.label}</span>
          </button>
        ))}
      </div>

      <SectionTitle>Title</SectionTitle>
      <select value={selectedTitle} onChange={e => setSelectedTitle(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 16 }}>
        {TITLES.map(t => <option key={t.title} value={t.title}>Lv{t.minLevel}+ — {t.title}</option>)}
      </select>

      <SectionTitle>Social Links</SectionTitle>
      {['Discord', 'Twitter/X', 'YouTube', 'AniList', 'MyAnimeList'].map(s => (
        <Input key={s} label={s} placeholder={`Your ${s} profile URL`} />
      ))}

      <SectionTitle>Featured Quote</SectionTitle>
      <Input label="Quote" placeholder="A line that defines you..." />

      <SaveBtn onClick={save} saved={saved} />
    </div>
  )
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const [animation, setAnimation] = useState('medium')
  const [fontSize, setFontSize] = useState('M')
  const [accent, setAccent] = useState('gold')
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const themes = [
    { id: 'dark', label: 'Dark', swatches: ['#0A0908', '#141210', '#D4A843'] },
    { id: 'light', label: 'Light', swatches: ['#F5F2EC', '#FFFFFF', '#A88430'] },
    { id: 'oled', label: 'OLED', swatches: ['#000000', '#0D0D0D', '#D4A843'] },
  ]
  const accents = [
    { id: 'gold', color: '#D4A843' }, { id: 'cyan', color: '#00D9FF' },
    { id: 'purple', color: '#8B52C4' }, { id: 'pink', color: '#D91A7A' },
    { id: 'green', color: '#45A35E' }, { id: 'red', color: '#D93B3B' },
  ]

  return (
    <div>
      <h2 className="settings-section-heading">Appearance</h2>

      <SectionTitle>Theme</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {themes.map(t => (
          <button key={t.id} onClick={() => setTheme(t.id)}
            style={{ padding: '14px 10px', borderRadius: 'var(--radius-lg)', border: `2px solid ${theme === t.id ? 'var(--gold)' : 'var(--border-default)'}`, background: theme === t.id ? 'var(--gold-glow-soft)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all var(--transition-fast)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {t.swatches.map((c, i) => <span key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.08)' }} />)}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme === t.id ? 'var(--gold)' : 'var(--text-secondary)' }}>{t.label}</span>
            {theme === t.id && <IconCheck size={14} color="var(--gold)" />}
          </button>
        ))}
      </div>

      <SectionTitle>Animation Intensity</SectionTitle>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['Low', 'Medium', 'High'].map(v => (
          <button key={v} onClick={() => setAnimation(v.toLowerCase())}
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${animation === v.toLowerCase() ? 'var(--gold)' : 'var(--border-default)'}`, background: animation === v.toLowerCase() ? 'var(--gold-glow-soft)' : 'var(--bg-surface)', color: animation === v.toLowerCase() ? 'var(--gold)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
            {v}
          </button>
        ))}
      </div>

      <SectionTitle>Font Size</SectionTitle>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['S', 'M', 'L'].map(v => (
          <button key={v} onClick={() => setFontSize(v)}
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${fontSize === v ? 'var(--gold)' : 'var(--border-default)'}`, background: fontSize === v ? 'var(--gold-glow-soft)' : 'var(--bg-surface)', color: fontSize === v ? 'var(--gold)' : 'var(--text-secondary)', fontSize: v === 'S' ? 12 : v === 'M' ? 15 : 18, fontWeight: 700, cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
            {v}
          </button>
        ))}
      </div>

      <SectionTitle>Accent Color</SectionTitle>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {accents.map(a => (
          <button key={a.id} onClick={() => setAccent(a.id)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: a.color, border: `3px solid ${accent === a.id ? '#fff' : 'transparent'}`, cursor: 'pointer', boxShadow: accent === a.id ? `0 0 12px ${a.color}88` : 'none', transition: 'all var(--transition-fast)' }} />
        ))}
      </div>

      <SaveBtn onClick={save} saved={saved} />
    </div>
  )
}

function NotificationsSection() {
  const makeToggles = (keys) => Object.fromEntries(keys.map(k => [k, true]))
  const [social, setSocial] = useState(makeToggles(['Followers', 'Mentions', 'Likes', 'Comments']))
  const [rpg, setRpg] = useState(makeToggles(['Level Up', 'Quest Complete', 'Achievement', 'Streak Reminder']))
  const [guild, setGuild] = useState(makeToggles(['Guild Events', 'Invites', 'Announcements', 'Member Joined']))
  const [system, setSystem] = useState(makeToggles(['Maintenance', 'New Features', 'Security Alerts', 'Newsletter']))
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const descriptions = {
    'Followers': 'When someone follows you', 'Mentions': 'When you are mentioned in a post',
    'Likes': 'When someone likes your content', 'Comments': 'Replies to your reviews',
    'Level Up': 'XP milestones and level gains', 'Quest Complete': 'Daily quest completions',
    'Achievement': 'New achievements unlocked', 'Streak Reminder': 'Daily login reminder',
    'Guild Events': 'Upcoming guild activities', 'Invites': 'Guild invitations received',
    'Announcements': 'Messages from guild leaders', 'Member Joined': 'New guild members',
    'Maintenance': 'Scheduled downtime notices', 'New Features': 'App updates and changes',
    'Security Alerts': 'Login from new device', 'Newsletter': 'Weekly anime digest',
  }

  const renderGroup = (label, state, setState) => (
    <div style={{ marginBottom: 24 }}>
      <SectionTitle>{label}</SectionTitle>
      {Object.keys(state).map(k => (
        <ToggleRow key={k} label={k} desc={descriptions[k]} value={state[k]}
          onChange={v => setState(prev => ({ ...prev, [k]: v }))} />
      ))}
    </div>
  )

  return (
    <div>
      <h2 className="settings-section-heading">Notifications</h2>
      {renderGroup('Social', social, setSocial)}
      {renderGroup('RPG', rpg, setRpg)}
      {renderGroup('Guild', guild, setGuild)}
      {renderGroup('System', system, setSystem)}
      <SaveBtn onClick={save} saved={saved} />
    </div>
  )
}

function PrivacySection() {
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const selectStyle = { width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 16 }

  const SelectRow = ({ label, children }) => (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )

  return (
    <div>
      <h2 className="settings-section-heading">Privacy</h2>
      <SectionTitle>Visibility</SectionTitle>
      <SelectRow label="Profile Visibility">
        <select style={selectStyle}><option>Everyone</option><option>Members Only</option><option>Private</option></select>
      </SelectRow>
      <SelectRow label="Online Status">
        <select style={selectStyle}><option>Show to Everyone</option><option>Friends Only</option><option>Hidden</option></select>
      </SelectRow>
      <SelectRow label="Anime List Visibility">
        <select style={selectStyle}><option>Public</option><option>Friends Only</option><option>Private</option></select>
      </SelectRow>

      <SectionTitle>Interactions</SectionTitle>
      <SelectRow label="Who Can Message Me">
        <select style={selectStyle}><option>Everyone</option><option>Guild Members</option><option>Nobody</option></select>
      </SelectRow>
      <SelectRow label="Who Can Invite Me to Guilds">
        <select style={selectStyle}><option>Everyone</option><option>Friends</option><option>Nobody</option></select>
      </SelectRow>

      <SectionTitle>Leaderboards</SectionTitle>
      <SelectRow label="Show Me in Leaderboard">
        <select style={selectStyle}><option>Yes, show my rank</option><option>No, stay anonymous</option></select>
      </SelectRow>

      <SaveBtn onClick={save} saved={saved} />
    </div>
  )
}

function SecuritySection() {
  const [twoFA, setTwoFA] = useState(false)
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const sessions = [
    { device: 'Chrome — Windows 11', location: 'Tokyo, Japan', last: '2 minutes ago', current: true },
    { device: 'AniEmpire iOS App', location: 'Tokyo, Japan', last: '1 hour ago' },
    { device: 'Firefox — macOS', location: 'Osaka, Japan', last: '3 days ago' },
  ]
  const loginHistory = [
    { event: 'Successful login', device: 'Chrome — Windows 11', time: '2 min ago' },
    { event: 'Successful login', device: 'iOS App', time: '1h ago' },
    { event: 'Failed attempt', device: 'Unknown', time: '2 days ago' },
    { event: 'Successful login', device: 'Firefox — macOS', time: '3 days ago' },
    { event: 'Password changed', device: 'Chrome — Windows 11', time: '1 week ago' },
  ]

  return (
    <div>
      <h2 className="settings-section-heading">Security</h2>

      <SectionTitle>Two-Factor Authentication</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>2FA {twoFA ? '— Enabled' : '— Disabled'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Secure your account with an authenticator app.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle value={twoFA} onChange={setTwoFA} />
          {twoFA && <button className="btn btn-secondary btn-sm">Setup →</button>}
        </div>
      </div>

      <SectionTitle>Active Sessions</SectionTitle>
      <div style={{ marginBottom: 10 }}>
        {sessions.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.device}
                {s.current && <span style={{ fontSize: 10, background: 'var(--green)', color: '#fff', borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>CURRENT</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.location} · {s.last}</div>
            </div>
            {!s.current && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', fontSize: 12 }}>End</button>}
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', marginTop: 4 }}>End All Sessions</button>
      </div>

      <SectionTitle>Login History</SectionTitle>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {loginHistory.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < loginHistory.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: l.event.includes('Failed') ? 'var(--red)' : 'var(--text-primary)' }}>{l.event}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{l.device}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.time}</span>
          </div>
        ))}
      </div>

      <SaveBtn onClick={save} saved={saved} />
    </div>
  )
}

function ChatSection() {
  const [chatTheme, setChatTheme] = useState('default')
  const [emojiSize, setEmojiSize] = useState('medium')
  const [toggles, setToggles] = useState({ preview: true, compact: false, receipts: true, filter: false })
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const chatThemes = [
    { id: 'default', label: 'Default', bg: '#141210', accent: '#D4A843' },
    { id: 'midnight', label: 'Midnight', bg: '#0D1117', accent: '#7B68EE' },
    { id: 'ember', label: 'Ember', bg: '#140A0A', accent: '#FF6B6B' },
  ]

  return (
    <div>
      <h2 className="settings-section-heading">Chat</h2>

      <SectionTitle>Chat Theme</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {chatThemes.map(t => (
          <button key={t.id} onClick={() => setChatTheme(t.id)}
            style={{ padding: '14px 10px', borderRadius: 'var(--radius-lg)', border: `2px solid ${chatTheme === t.id ? 'var(--gold)' : 'var(--border-default)'}`, background: chatTheme === t.id ? 'var(--gold-glow-soft)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all var(--transition-fast)' }}>
            <div style={{ width: 40, height: 24, borderRadius: 6, background: t.bg, border: `2px solid ${t.accent}` }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: chatTheme === t.id ? 'var(--gold)' : 'var(--text-secondary)' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <SectionTitle>Emoji Size</SectionTitle>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['Small', 'Medium', 'Large'].map(v => (
          <button key={v} onClick={() => setEmojiSize(v.toLowerCase())}
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${emojiSize === v.toLowerCase() ? 'var(--gold)' : 'var(--border-default)'}`, background: emojiSize === v.toLowerCase() ? 'var(--gold-glow-soft)' : 'var(--bg-surface)', color: emojiSize === v.toLowerCase() ? 'var(--gold)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
            {v}
          </button>
        ))}
      </div>

      <SectionTitle>Chat Options</SectionTitle>
      <ToggleRow label="Message Preview" desc="Show message snippets in notifications" value={toggles.preview} onChange={v => setToggles(p => ({ ...p, preview: v }))} />
      <ToggleRow label="Compact Mode" desc="Reduce spacing between messages" value={toggles.compact} onChange={v => setToggles(p => ({ ...p, compact: v }))} />
      <ToggleRow label="Read Receipts" desc="Let others know you've read their messages" value={toggles.receipts} onChange={v => setToggles(p => ({ ...p, receipts: v }))} />
      <ToggleRow label="Profanity Filter" desc="Hide offensive language automatically" value={toggles.filter} onChange={v => setToggles(p => ({ ...p, filter: v }))} />

      <SaveBtn onClick={save} saved={saved} />
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [active, setActive] = useState('account')
  const [mobileOpen, setMobileOpen] = useState(false)

  const sections = {
    account: <AccountSection />,
    profile: <ProfileSection />,
    appearance: <AppearanceSection />,
    notifications: <NotificationsSection />,
    privacy: <PrivacySection />,
    security: <SecuritySection />,
    chat: <ChatSection />,
  }

  const activeLabel = NAV_ITEMS.find(n => n.id === active)?.label

  return (
    <>
      <style>{`
        .settings-page { display: flex; gap: 0; min-height: 100vh; padding-top: 24px; padding-bottom: 60px; max-width: 960px; margin: 0 auto; padding-left: 20px; padding-right: 20px; }
        .settings-nav { width: 200px; flex-shrink: 0; position: sticky; top: 80px; align-self: flex-start; }
        .settings-nav-inner { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 10px; }
        .settings-nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; color: var(--text-secondary); background: none; border: none; cursor: pointer; transition: all var(--transition-fast); text-align: left; }
        .settings-nav-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .settings-nav-btn.active { background: var(--gold-glow-soft); color: var(--gold); border: 1px solid var(--border-default); }
        .settings-content { flex: 1; padding-left: 28px; min-width: 0; }
        .settings-section-heading { font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; padding-bottom: 14px; border-bottom: 1px solid var(--border-subtle); }
        .settings-mobile-header { display: none; }
        .avatar-upload-wrap:hover .avatar-overlay { opacity: 1 !important; }
        @media (max-width: 640px) {
          .settings-page { flex-direction: column; padding-top: 16px; }
          .settings-nav { width: 100%; position: static; }
          .settings-nav-inner { display: none; }
          .settings-nav-inner.open { display: block; }
          .settings-mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); cursor: pointer; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
          .settings-content { padding-left: 0; }
        }
      `}</style>

      <div className="settings-page">
        {/* Left Nav */}
        <nav className="settings-nav">
          <div className="settings-mobile-header" onClick={() => setMobileOpen(o => !o)}>
            <span><IconSettings size={16} style={{ marginRight: 8 }} />{activeLabel}</span>
            <IconChevron size={16} style={{ transform: mobileOpen ? 'rotate(270deg)' : 'rotate(90deg)', transition: 'transform var(--transition-fast)' }} />
          </div>
          <div className={`settings-nav-inner${mobileOpen ? ' open' : ''}`}>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} className={`settings-nav-btn${active === id ? ' active' : ''}`}
                onClick={() => { setActive(id); setMobileOpen(false) }}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="settings-content">
          <div className="glass-panel" style={{ padding: '28px 32px' }}>
            {sections[active]}
          </div>
        </main>
      </div>
    </>
  )
}
