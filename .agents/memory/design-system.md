---
name: Design system
description: CSS design tokens, utility classes, and component patterns for AniEmpire
---

**All design CSS is appended to `src/index.css`** (do not create a separate file).

**Key CSS variables:**
- `--neon-cyan`, `--neon-purple`, `--neon-pink`, `--neon-green` — glow colors
- `--gold`, `--gold-dark` — brand accent
- `--bg-primary`, `--bg-secondary`, `--bg-elevated`, `--bg-card`, `--bg-surface`
- `--border-subtle`, `--border-default`
- `--font-heading`, `--font-brand`

**Key utility classes:**
- `.glass-panel` — primary card primitive; backdrop-filter blur + semi-transparent bg
- `.glass-panel--cyan/purple/pink` — neon-tinted variants
- `.card-shimmer` — holographic shimmer on hover (::after pseudo, gradient sweep)
- `.gradient-text` — gold-to-cyan gradient text
- `.xp-bar-fill` — animated XP bar fill
- `.icon-btn` — icon button with hover glow
- `.faction--*` — faction color helpers

**Theme switching:** `data-theme="light"`, `data-theme="oled"` on `<html>` override the dark defaults.

**Animations (keyframes in index.css):**
- `neon-pulse` — glowing border/shadow pulse
- `scale-in` — spring entry (used by modals)
- `shimmer-sweep` — card holographic shimmer
- `gradient-shift` — animated gradient backgrounds

**Faction color pattern:** Use `style={{ '--fc': faction.color }}` on the container, then reference `var(--fc)` in CSS. Never hardcode faction colors.
