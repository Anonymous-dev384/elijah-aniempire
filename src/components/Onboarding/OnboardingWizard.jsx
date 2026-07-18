import React, { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { supabase } from '../../lib/supabase';
import { IconMars, IconVenus, IconCircle, IconPalette, IconUser, IconCheck } from '../Icons';

const FACTIONS = [
  { id: 'shonen',       name: 'Shonen',        color: '#FF6B6B', desc: 'Action & Adventure' },
  { id: 'seinen',       name: 'Seinen',        color: '#4ECDC4', desc: 'Mature & Complex' },
  { id: 'shoujo',       name: 'Shoujo',        color: '#FFB7C5', desc: 'Romance & Drama' },
  { id: 'cyberpunk',    name: 'Cyberpunk',     color: '#00D9FF', desc: 'Sci-Fi & Tech' },
  { id: 'fantasy',      name: 'Fantasy',       color: '#9D84B7', desc: 'Magic & Worlds' },
  { id: 'slice-of-life',name: 'Slice of Life', color: '#FFD93D', desc: 'Cozy & Relaxing' },
];

const PROFILE_EFFECTS = [
  {
    id: 'cherry-blossom', name: 'Cherry Blossom',
    preview: `<style>@keyframes fall{0%{transform:translateY(-10vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(360deg);opacity:0}}.blossom{position:absolute;width:10px;height:10px;background:radial-gradient(circle at 30% 30%, rgba(255,192,203,0.8), rgba(255,105,180,0.4));border-radius:50%;animation:fall 3s linear infinite;}}</style><div style="position:absolute;width:100%;height:100%;overflow:hidden;"><div class="blossom" style="left:10%;animation-delay:0s"></div><div class="blossom" style="left:20%;animation-delay:0.5s"></div><div class="blossom" style="left:30%;animation-delay:1s"></div></div>`,
  },
  {
    id: 'matrix-rain', name: 'Matrix Rain',
    preview: `<style>@keyframes matrixfall{0%{transform:translateY(-100%);opacity:1}100%{transform:translateY(100%);opacity:0}}.matrix-char{position:absolute;font-family:monospace;color:#00ff00;text-shadow:0 0 5px #00ff00;animation:matrixfall 2s linear infinite;font-size:12px;font-weight:bold;}</style><div style="position:absolute;width:100%;height:100%;overflow:hidden;background:rgba(0,0,0,0.3)"><div class="matrix-char" style="left:10%;animation-delay:0s">◊</div><div class="matrix-char" style="left:20%;animation-delay:0.3s">▲</div><div class="matrix-char" style="left:30%;animation-delay:0.6s">■</div></div>`,
  },
  {
    id: 'glowing-embers', name: 'Glowing Embers',
    preview: `<style>@keyframes ember-float{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-50px) scale(0.5);opacity:0}}.ember{position:absolute;width:8px;height:8px;background:radial-gradient(circle at 40% 40%, #ffff00, #ff8800, #ff0000);border-radius:50%;animation:ember-float 2s ease-out infinite;box-shadow:0 0 8px #ff6600;}}</style><div style="position:absolute;width:100%;height:100%"><div class="ember" style="left:25%;bottom:10%"></div><div class="ember" style="left:50%;bottom:5%;animation-delay:0.5s"></div></div>`,
  },
];

const PRONOUNS = [
  { value: 'male',    label: 'Male',    Icon: IconMars },
  { value: 'female',  label: 'Female',  Icon: IconVenus },
  { value: 'neutral', label: 'Neutral', Icon: IconCircle },
];

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep]                     = useState(1);
  const [username, setUsername]             = useState('');
  const [genderPref, setGenderPref]         = useState('neutral');
  const [selectedFaction, setSelectedFaction] = useState('shonen');
  const [selectedEffect, setSelectedEffect] = useState('cherry-blossom');
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState(null);
  const updateProfile = useProfileStore((state) => state.updateProfile);

  const handleNext = () => {
    if (step === 1) {
      if (!username.trim())    { setError('Please enter a username'); return; }
      if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    }
    setError(null);
    setStep(step + 1);
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true); setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await updateProfile({
        username, gender_title_pref: genderPref, faction: selectedFaction,
        profile_effect_iframe_url: PROFILE_EFFECTS.find(e => e.id === selectedEffect)?.preview,
      });
      onComplete?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-xl)', padding: 32,
    backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-card)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 'var(--radius-full)', background: s <= step ? 'var(--gold)' : 'var(--bg-elevated)', boxShadow: s <= step ? 'var(--shadow-gold)' : 'none', transition: 'all 0.4s ease' }} />
          ))}
        </div>

        {/* Step 1: Character Setup */}
        {step === 1 && (
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: 6 }}>Create Your Character</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Set up your AniEmpire identity</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Username</label>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Your epic username…" className="input"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pronouns & Title Style</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {PRONOUNS.map(({ value, label, Icon }) => (
                  <button
                    key={value} onClick={() => setGenderPref(value)}
                    style={{
                      padding: '14px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      border: `1px solid ${genderPref === value ? 'var(--gold)' : 'var(--border-default)'}`,
                      background: genderPref === value ? 'var(--gold-glow)' : 'var(--bg-elevated)',
                      color: genderPref === value ? 'var(--gold)' : 'var(--text-secondary)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <Icon size={22} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Affects your title (e.g. King / Queen / Sovereign)
              </p>
            </div>

            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 14 }}>{error}</p>}
            <button onClick={handleNext} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Continue</button>
          </div>
        )}

        {/* Step 2: Faction Alignment */}
        {step === 2 && (
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: 6 }}>Choose Your Faction</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Select your favourite anime genre</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              {FACTIONS.map((faction) => (
                <button
                  key={faction.id} onClick={() => setSelectedFaction(faction.id)}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `2px solid ${selectedFaction === faction.id ? faction.color : 'var(--border-default)'}`,
                    background: selectedFaction === faction.id ? `${faction.color}18` : 'var(--bg-elevated)',
                    color: selectedFaction === faction.id ? faction.color : 'var(--text-secondary)',
                    textAlign: 'left', transition: 'all var(--transition-fast)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <IconPalette size={18} color={selectedFaction === faction.id ? faction.color : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{faction.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>{faction.desc}</div>
                  </div>
                  {selectedFaction === faction.id && <IconCheck size={16} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            {/* Preview swatch */}
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Profile accent preview</p>
              <div style={{
                height: 48, borderRadius: 'var(--radius-md)', transition: 'all 0.3s ease',
                background: `${FACTIONS.find(f => f.id === selectedFaction)?.color}30`,
                border: `2px solid ${FACTIONS.find(f => f.id === selectedFaction)?.color}`,
                boxShadow: `0 0 20px ${FACTIONS.find(f => f.id === selectedFaction)?.color}30`,
              }} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button onClick={handleNext} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Profile Effect */}
        {step === 3 && (
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: 6 }}>Profile Effect</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Preview your profile decoration</p>

            {/* Preview card */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative', width: '100%', height: 180, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconUser size={36} color="rgba(255,255,255,0.7)" />
                  </div>
                </div>
                <iframe
                  srcDoc={PROFILE_EFFECTS.find(e => e.id === selectedEffect)?.preview}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', border: 'none', mixBlendMode: 'screen' }}
                />
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>Preview</p>
            </div>

            {/* Effect selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Choose Effect</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {PROFILE_EFFECTS.map((effect) => (
                  <button
                    key={effect.id} onClick={() => setSelectedEffect(effect.id)}
                    style={{
                      padding: '10px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                      border: `1px solid ${selectedEffect === effect.id ? 'var(--gold)' : 'var(--border-default)'}`,
                      background: selectedEffect === effect.id ? 'var(--gold-glow)' : 'var(--bg-elevated)',
                      color: selectedEffect === effect.id ? 'var(--gold)' : 'var(--text-secondary)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {effect.name}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 14 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button onClick={handleComplete} disabled={isLoading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: isLoading ? 0.6 : 1 }}>
                {isLoading ? 'Creating…' : 'Create Character'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
