import React, { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { supabase } from '../../lib/supabase';

const FACTIONS = [
  { id: 'shonen', name: 'Shonen', color: '#FF6B6B', desc: 'Action & Adventure' },
  { id: 'seinen', name: 'Seinen', color: '#4ECDC4', desc: 'Mature & Complex' },
  { id: 'shoujo', name: 'Shoujo', color: '#FFB7C5', desc: 'Romance & Drama' },
  { id: 'cyberpunk', name: 'Cyberpunk', color: '#00D9FF', desc: 'Sci-Fi & Tech' },
  { id: 'fantasy', name: 'Fantasy', color: '#9D84B7', desc: 'Magic & Worlds' },
  { id: 'slice-of-life', name: 'Slice of Life', color: '#FFD93D', desc: 'Cozy & Relaxing' },
];

const PROFILE_EFFECTS = [
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    preview: `<style>@keyframes fall{0%{transform:translateY(-10vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(360deg);opacity:0}}.blossom{position:absolute;width:10px;height:10px;background:radial-gradient(circle at 30% 30%, rgba(255,192,203,0.8), rgba(255,105,180,0.4));border-radius:50%;animation:fall 3s linear infinite;}}</style><div style="position:absolute;width:100%;height:100%;overflow:hidden;"><div class="blossom" style="left:10%;animation-delay:0s"></div><div class="blossom" style="left:20%;animation-delay:0.5s"></div><div class="blossom" style="left:30%;animation-delay:1s"></div></div>`,
  },
  {
    id: 'matrix-rain',
    name: 'Matrix Rain',
    preview: `<style>@keyframes matrixfall{0%{transform:translateY(-100%);opacity:1}100%{transform:translateY(100%);opacity:0}}.matrix-char{position:absolute;font-family:monospace;color:#00ff00;text-shadow:0 0 5px #00ff00;animation:matrixfall 2s linear infinite;font-size:12px;font-weight:bold;}</style><div style="position:absolute;width:100%;height:100%;overflow:hidden;background:rgba(0,0,0,0.3)"><div class="matrix-char" style="left:10%;animation-delay:0s">◊</div><div class="matrix-char" style="left:20%;animation-delay:0.3s">▲</div><div class="matrix-char" style="left:30%;animation-delay:0.6s">■</div></div>`,
  },
  {
    id: 'glowing-embers',
    name: 'Glowing Embers',
    preview: `<style>@keyframes ember-float{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-50px) scale(0.5);opacity:0}}.ember{position:absolute;width:8px;height:8px;background:radial-gradient(circle at 40% 40%, #ffff00, #ff8800, #ff0000);border-radius:50%;animation:ember-float 2s ease-out infinite;box-shadow:0 0 8px #ff6600;}}</style><div style="position:absolute;width:100%;height:100%"><div class="ember" style="left:25%;bottom:10%"></div><div class="ember" style="left:50%;bottom:5%;animation-delay:0.5s"></div></div>`,
  },
];

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [genderPref, setGenderPref] = useState('neutral');
  const [selectedFaction, setSelectedFaction] = useState('shonen');
  const [selectedEffect, setSelectedEffect] = useState('cherry-blossom');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const updateProfile = useProfileStore((state) => state.updateProfile);

  const handleNext = () => {
    if (step === 1) {
      if (!username.trim()) {
        setError('Please enter a username');
        return;
      }
      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile with onboarding data
      await updateProfile({
        username,
        gender_title_pref: genderPref,
        faction: selectedFaction,
        profile_effect_iframe_url: PROFILE_EFFECTS.find(e => e.id === selectedEffect)?.preview,
      });

      onComplete?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 mx-2 rounded-full transition-all ${
                s <= step ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Character Setup */}
        {step === 1 && (
          <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-8 space-y-6">
            <h2 className="text-3xl font-bold text-white">Create Your Character</h2>
            <p className="text-slate-300">Let's set up your AniEmpire identity</p>

            {/* Username input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your epic username..."
                className="w-full px-4 py-3 bg-slate-700/50 border border-purple-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              />
            </div>

            {/* Gender Title Preference */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Pronouns & Title Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'male', label: 'Male', icon: '♂️' },
                  { value: 'female', label: 'Female', icon: '♀️' },
                  { value: 'neutral', label: 'Neutral', icon: '⚪' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGenderPref(option.value)}
                    className={`py-3 px-4 rounded-lg font-medium transition-all border ${
                      genderPref === option.value
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                This affects your title (e.g., King/Queen/Sovereign)
              </p>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              onClick={handleNext}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-white transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Faction Alignment */}
        {step === 2 && (
          <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-8 space-y-6">
            <h2 className="text-3xl font-bold text-white">Choose Your Faction</h2>
            <p className="text-slate-300">Select your favorite anime genre</p>

            <div className="grid grid-cols-2 gap-4">
              {FACTIONS.map((faction) => (
                <button
                  key={faction.id}
                  onClick={() => setSelectedFaction(faction.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedFaction === faction.id
                      ? 'border-2 bg-slate-700/80'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  style={{
                    borderColor: selectedFaction === faction.id ? faction.color : undefined,
                    backgroundColor:
                      selectedFaction === faction.id ? `${faction.color}20` : undefined,
                  }}
                >
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="font-bold text-white">{faction.name}</div>
                  <div className="text-xs text-slate-400">{faction.desc}</div>
                </button>
              ))}
            </div>

            {/* Faction preview */}
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <p className="text-sm text-slate-400 mb-2">Profile accent color:</p>
              <div
                className="h-16 rounded-lg border-2 border-slate-500 transition-all"
                style={{
                  backgroundColor:
                    FACTIONS.find((f) => f.id === selectedFaction)?.color + '40',
                  borderColor: FACTIONS.find((f) => f.id === selectedFaction)?.color,
                }}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white transition-all"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Profile Effect Sandbox */}
        {step === 3 && (
          <div className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-8 space-y-6">
            <h2 className="text-3xl font-bold text-white">Profile Effect</h2>
            <p className="text-slate-300">Preview your profile decoration</p>

            {/* Preview card */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-8 border border-purple-500/20 overflow-hidden">
              <div className="relative w-full h-48 bg-slate-800 rounded-lg border-2 border-purple-400/30 overflow-hidden">
                {/* Avatar placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-4xl">
                    👤
                  </div>
                </div>

                {/* Effect overlay */}
                <iframe
                  srcDoc={PROFILE_EFFECTS.find((e) => e.id === selectedEffect)?.preview}
                  className="absolute inset-0 w-full h-full pointer-events-none border-none"
                  style={{ mixBlendMode: 'screen' }}
                />
              </div>
              <p className="text-center text-sm text-slate-400 mt-4">Preview</p>
            </div>

            {/* Effect selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Choose Effect
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PROFILE_EFFECTS.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => setSelectedEffect(effect.id)}
                    className={`p-3 rounded-lg font-medium transition-all border ${
                      selectedEffect === effect.id
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-purple-400'
                    }`}
                  >
                    {effect.name}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white transition-all"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 rounded-lg font-bold text-white transition-all"
              >
                {isLoading ? 'Creating...' : 'Create Character'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
