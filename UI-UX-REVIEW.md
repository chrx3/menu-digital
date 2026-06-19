# UI/UX Design Review — MC Tommy Menú Digital
## Framework: Airbnb Design System (Photography-First, Warm, Rounded)

**Date:** 2026-06-19
**Stack:** Next.js 16 + Tailwind v4 + shadcn/ui + Framer Motion
**Fonts:** Fredoka (display) + Poppins (body) — ✅ good choices, warm and friendly

---

## 🔴 Critical Issues Found

### 1. Card Shadows — Too Flat / Inconsistent
- Current: single `boxShadow` via framer-motion animation (`0 4px 6px rgba(0,0,0,0.05)`)
- Problem: feels flat, no depth hierarchy. Hover state uses orange shadow which is distracting
- **Fix:** Airbnb-style 3-layer shadow system (border ring + soft blur + stronger blur)

### 2. Text Colors — Using Pure Hex Values
- Current: hardcoded `#3D1F00`, `#F5821F` scattered in components
- Problem: inconsistent with CSS variable system, hard to maintain
- **Fix:** Use CSS variables consistently (`var(--marron-oscuro)`, `var(--naranja-mc)`)

### 3. Card Image Treatment — Floating Image is Distracting
- Current: `CardFloatingImage` floats above the card with absolute positioning
- Problem: overlaps text on small cards, inconsistent image sizing
- **Fix:** Dedicated image area at top of card (Airbnb listing pattern)

### 4. Category Pills — Active State Too Heavy
- Current: gradient background with shadow on active pill
- Problem: competes with product cards for attention
- **Fix:** Subtle underline or minimal fill, consistent with Airbnb category bar

### 5. Search Bar — Border Style Inconsistent
- Current: 2px orange border, heavy styling
- Problem: draws too much attention in header
- **Fix:** Airbnb-style: no visible border, subtle shadow on focus, pill shape

---

## 🟡 Moderate Issues

### 6. Spacing — Inconsistent Vertical Rhythm
- Mixed use of `mb-3`, `mb-4`, `gap-2`, `gap-3` without clear scale
- **Fix:** Adopt 8px base unit spacing scale

### 7. Button Radius — Mixed Values
- Cards: `rounded-2xl`, buttons: `rounded-lg`, pills: `rounded-full`
- **Fix:** Consistent radius scale: 8px buttons, 12px cards, full pills

### 8. Price Typography — Could Be Stronger
- Price uses Fredoka but competes with product name
- **Fix:** Clear hierarchy: name > price > description

### 9. Hover States — Scale Animation is Distracting
- Current: `scale: 1.02` on card hover
- Problem: causes layout shift, feels "bouncy" for a food menu
- **Fix:** Subtle shadow lift only, no scale

### 10. Mobile Touch Targets — Some Too Small
- Quantity buttons (minus/plus) are 44px — borderline
- **Fix:** Minimum 44px touch targets everywhere

---

## 🟢 What's Working Well

- ✅ Warm color palette (orange/brown/cream) — perfect for food
- ✅ Fredoka + Poppins font pairing — friendly and readable
- ✅ Framer Motion animations — smooth and professional
- ✅ Horizontal category scroll — good mobile pattern
- ✅ Cart fly animation — delightful micro-interaction
- ✅ WhatsApp ordering — smart for Chilean market
- ✅ Particle background — unique personality
- ✅ shadcn/ui foundation — solid component primitives

---

## 📐 Design System Changes (Airbnb-Inspired)

### Shadows (3-Layer System)
```css
--shadow-card: 0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06);
--shadow-card-hover: 0 0 0 1px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.08);
--shadow-elevated: 0 0 0 1px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.1), 0 16px 48px rgba(0,0,0,0.1);
```

### Typography (Airbnb Weight Range)
- Headings: weight 600-700, negative letter-spacing (-0.2px to -0.4px)
- Body: weight 400-500
- Warm near-brown instead of pure values

### Radius Scale
- Buttons: 8px → 12px
- Cards: 16px → 20px  
- Pills: full
- Inputs: 12px

### Spacing (8px base)
- Card padding: 16px → 20px
- Section gaps: 24px → 32px
- Element gaps: 8px → 12px

---

## 🎯 Implementation Plan

1. **globals.css** — Add shadow tokens, refine radius/spacing
2. **ProductCard** — 3-layer shadow, remove scale hover, better image area
3. **Header** — Pill search bar, cleaner styling
4. **CategoryTabs** — Refined pills, subtle active state
5. **Cart** — Better floating button, smoother checkout flow
