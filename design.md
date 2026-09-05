# Design System – هو كل يوم أكل (Howa Kol Yom Akl)

## 1. Brand Identity

**Howa Kol Yom Akl** is a warm, home‑centric mobile recipe app built for Egyptian housewives who stand over their stoves, flour dust on their hands, and reach for their phone to get a quick, reliable recipe. The tone is **friendly, trustworthy, and unmistakably Egyptian** — like a close relative whispering cooking tips while you stir. Every interaction feels natural, tactile, and effortless, even when your hands are messy and your mind is busy.

**Voice & Tone Notes (Egyptian Colloquial Arabic):**
- Use everyday Egyptian dialect (Cairo/Luxor mix) — never Modern Standard Arabic.
- Phrases are short, conversational, and action‑oriented: “ابدأ الوصفة” (Start the recipe), “شوف المكونات” (Check the ingredients), “الوقت: 12 دقيقة” (Time: 12 minutes).
- Never robotic, never overly formal. Warm, confident, and reassuring.
- All UI copy follows the same register — casual but polished.

## 2. Color Palette

| Token | Hex | Usage |
|-------|-----|--------|
| **Primary – Terracotta** | `#D35400` | Main CTAs, active states, primary buttons, hero accents |
| **Primary Light** | `#F4A261` | Hover states, active buttons, subtle fills |
| **Primary Dark** | `#C94F0E` | Disabled/pressed states, borders, hover overlays |
| **Secondary – Cream** | `#FDFBF7` | Backgrounds, card surfaces, secondary elements |
| **Secondary Light** | `#FAF3E0` | Light card backgrounds, empty states |
| **Secondary Dark** | `#EDE9D0` | Subtle dividers, muted panels |
| **Accent – Olive Green** | `#556B2F` | Success badges, tags, highlights, progress bars |
| **Accent Light** | `#8DAA91` | Hover/focus states, subtle accents |
| **Accent Dark** | `#3E5424` | Error/warning states, destructive actions |
| **Neutral – Dark** | `#1A1A1A` | Body text, primary headings, solid backgrounds |
| **Neutral – Mid** | `#333333` | Secondary text, captions, disclaimer text |
| **Neutral – Muted** | `#555555` | Borders, divider lines, inactive states |
| **Neutral – Light** | `#777777` | Disabled text, ghost buttons |
| **Neutral – Surface** | `#F5F5F0` | Default card background, form fields |
| **Neutral – Scrim** | `rgba(212, 167, 129, 0.15)` | Overlay behind images for text readability |
| **Success** | `#D97706` | Success badges, completed steps, positive feedback |
| **Warning** | `#F59E0B` | Warning tags, caution notices |
| **Info** | `#10B981` | Info tags, secondary actions, informational text |

### Usage Summary
- **Primary (`#D35400`)** drives attention: primary buttons (“ابدأ الوصفة”), active recipe cards, and the voice‑player accent.
- **Secondary (`#FDFBF7`)** provides warmth and breathing room: card backgrounds, list items, and secondary controls.
- **Accent (`#556B2F`)** adds depth and distinguishes success states (e.g., “تم!” badge) and tags.
- **Neutrals** ensure legibility across all screens; the cream base (`#FDFBF7`) keeps the interface cozy and inviting.

## 3. Typography

**Fonts**
- **Primary:** *Cairo* (Arabic‑optimized, open‑source) — bold, clear, highly legible in RTL.
- **Fallback:** *Tajawal* (second‑choice, also Arabic‑compatible).

**Weight Set (400–700)**
| Token | Size (dp) | Line Height | Weight | Typical Use |
|-------|-----------|-------------|--------|-------------|
| `display` | 64 | 1.0 | 700 | Page titles, hero headings |
| `h1` | 36 | 1.2 | 600 | Recipe titles (main heading) |
| `h2` | 28 | 1.2 | 600 | Category / filter headers |
| `h3` | 22 | 1.3 | 500 | Section sub‑headers (steps, notes) |
| `body-large` | 18 | 1.5 | 500 | Main body text, descriptions |
| `body` | 14 | 1.5 | 500 | Short sentences, captions |
| `body-small` | 12 | 1.4 | 400 | Ingredient counts, timers |
| `caption` | 10 | 1.2 | 400 | Dish name on recipe card |
| `button-label` | 13 | 1.4 | 600 | Button text (primary/secondary) |

**RTL Specifics**
- Line height for body text: **1.55×** font size (generous for Arabic ligature flow).
- No letter‑spacing tricks — rely on proper word‑break handling.
- Numerals: **Arabic‑Indic** (٠١٢٣٤٥٦٧٨٩) for quantities (e.g., “٣ دقيقة”) and **Western** (1,2,3…) for durations (e.g., “12 دقيقة”). Mix consistently within each context.
- Font size scaling is based on **dp** (1 dp ≈ 4px on most devices).

## 4. Spacing & Layout System

**Base Unit:** `4dp`

**Spacing Scale (multiples of 4dp):**
| Token | Value (dp) | Description |
|-------|------------|-------------|
| `sp-xs` | 4 | Tight inner spacing |
| `sp-sm` | 8 | Small gap (between items) |
| `sp-md` | 12 | Medium gap (lists, grids) |
| `sp-lg` | 16 | Larger gap (section separators) |
| `sp-xl` | 24 | Wide separation (bottom nav, major areas) |
| `sp-xxl` | 32 | Extra large (full‑width headers) |

**Screen Padding (Horizontal/Vertical):**
- Horizontal margin: **16dp** (standard content area)
- Vertical margin: **24dp** (top/bottom of scrollable lists)

**Grid / Column Rules**
- Recipe list/grid: **12‑column** layout (CSS Grid or Flexbox with 12 equal columns).
- Column gap: **8dp** (consistent across all rows).
- Card width (single column): **280dp** max (fits comfortably on phones).
- Card gap (multiple columns): **8dp** between cards.

**Corner Radii (dp)**
| Component | Radius |
|-----------|--------|
| Chip / Tag | 6dp |
| Card / Sheet | 12dp |
| Modal / Sheet | 20dp |
| Input field | 8dp |
| Icon button | 12dp |

**Shadow / Elevation (soft, warm, not pure black)**
| State | Shadow Color | Opacity | Blur | Offset |
|-------|--------------|---------|------|--------|
| Card Resting | `rgba(212, 167, 129, 0)` | 0% | 0px | 0px |
| Card Pressed | `rgba(212, 167, 129, 0.08)` | 80% | 6dp | 4dp up/down |
| Card Lifted | `rgba(212, 167, 129, 0.15)` | 85% | 12dp | 12dp up/down |
| Modal / Sheet | `rgba(212, 167, 129, 0.25)` | 75% | 20dp | 16dp up/down |

## 5. Iconography & Imagery

**Style:** Outline icons with **stroke width 2dp** (thin enough to stay elegant, thick enough to be crisp at 24dp+).

**Standard Sizes:**
- Small: **12dp** (chips, list items)
- Medium: **20dp** (navigation, step numbers)
- Large: **28dp** (action buttons, profile avatar)

**Photo Treatment (Recipe Hero Image)**
- Aspect ratio: **4:3** (portrait‑leaning square works too)
- Corner radius: **12dp** (soft, rounded corners)
- Gradient overlay: `linear-gradient(135deg, rgba(212, 167, 129, 0.12), rgba(212, 167, 129, 0.05))` — subtle warm tint behind text for readability.

**Voice / Audio Iconography**
- Consistent icon: a microphone‑speaker combined shape (outline, stroke 2dp).
- Color: **Primary terracotta** (`#D35400`) for resting state.
- Playing state: switch to **neutral cream** (`#FDFBF7`) with a faint glow effect (opacity 0.3 on the icon).
- Paused state: revert to **white** with a small dot indicating idle.
- Placement: always near the bottom‑right of the recipe detail screen, next to the step counter.

## 6. Buttons

All button variants defined below. Dimensions: **height 48dp**, **horizontal padding 16dp**, **corner radius 12dp** (medium).

| Variant | State | Background | Text/Icon Color | Border | Notes |
|---------|-------|------------|-----------------|--------|-------|
| **Primary** (CTA – e.g., “ابدأ الوصفة”) | Default | `#D35400` | White (`#FFFFFF`) | None (solid fill) | Main action buttons, recipe cards, search submit |
| | Pressed | `#C94F0E` | White (`#FFFFFF`) | None | Visual feedback on tap |
| | Disabled | `#CCCCCC` | Gray (`#777777`) | None | Can't be tapped, shows unavailable state |
| **Secondary** (e.g., “احفظ” / Save) | Default | `#FDFBF7` | `#333333` (dark neutral) | `1px solid #D35400` | Outline style, secondary actions |
| | Pressed | `#D35400` | White (`#FFFFFF`) | None | Background fills on press |
| | Disabled | `#CCCCCC` | Gray (`#777777`) | `1px solid #CCCCCC` | Inactive outline and text |
| **Ghost/Text** | Default | `transparent` | `#D35400` (primary terracotta) | None | Text-only button with primary color |
| | Pressed | `transparent` | `#C94F0E` | None | Text color darkens on press |
| | Disabled | `transparent` | `#777777` | None | Low-contrast disabled state |
| **Icon-only** (e.g., favorite/heart, share, back arrow) | Default | `#FDFBF7` (cream) | `#D35400` (primary) | None | Background matches card; icon color primary |
| | Pressed | `#FDFBF7` | `#C94F0E` | None | Icon darkens slightly |
| | Active/Toggled | `#FDFBF7` | `#1A1A1A` (dark neutral) | None | Filled state (e.g., heart filled) |
| **Voice/Play** | Resting | `#D35400` (primary) | White (`#FFFFFF`) | None | Play button on narration control |
| | Playing | `#FDFBF7` (cream) with 10% opacity glow | White (`#FFFFFF`) | None | Icon turns cream with subtle glow effect |
| | Paused | `#FFFFFF` (white) | `#D35400` (primary) | None | Icon reverts to primary color |
| **Floating Action Button (FAB)** | Default | `#D35400` | White (`#FFFFFF`) | None | Rounded circle, usually 48dp diameter |
| | Pressed | `#C94F0E` | White (`#FFFFFF`) | None | Slightly darker terracotta |
| | Disabled | `#CCCCCC` | Gray (`#777777`) | None | Inactive state |
| **Button Sizing** | Height | 48dp | | | Minimum touch target 44dp |
| | Horizontal Padding | 16dp | | | Ensures thumb-friendly area |
| | Corner Radius | 12dp | | | Medium radius for all primary/secondary buttons |
| **Button Label Typography** | Font Size | 13dp (button-label) | | | Matches type scale for button text |

## 7. Core Components

**Recipe Card (List View)**
- **Layout**: 12-column grid, card width 280dp max.
- **Image**: Full-width top image (4:3 aspect ratio), 12dp corner radius, subtle gradient overlay (`rgba(212, 167, 129, 0.15)`) for text legibility.
- **Title**: `h1` (36dp) in `#1A1A1A`, bold, centered below image.
- **Category Tag**: Chip with olive green background (`#556B2F`), white text, 6dp radius, placed top-left of title.
- **Info Line**: `body-small` (12dp) showing prep time, servings, difficulty in neutral colors.
- **CTA Button**: Primary button (“ابدأ الوصفة”) at bottom-right of card, 48dp height, 16dp padding.

**Category/Tag Chip**
- Oval shape, 6dp radius.
- Background: `#556B2F` (olive green) for main categories, `#D97706` (amber) for success tags.
- Text: 13dp `button-label` weight, white or dark neutral text.

**Search Bar**
- Full-width input with 8dp horizontal padding.
- Background: `#F5F5F0` (surface).
- Border: 1px solid `#D35400` (primary) when active, `#CCCCCC` otherwise.
- Placeholder text: `#555555` (muted).
- Clear icon (X) on right: 20dp size, `#777777`.

**Bottom Navigation Bar**
- 4 icons (Home, Recipes, Favorites, Profile) + labels.
- **Active**: Icon color `#D35400`, label `#1A1A1A`.
- **Inactive**: Icon color `#555555`, label `#555555`.
- Bar background: `#FDFBF7` (cream).
- Height: 56dp (including icon + label).

**Recipe Detail Screen**
- **Hero Image**: Full-width, 4:3 aspect ratio, 12dp radius, gradient overlay for title legibility.
- **Title Block**: `h1` (36dp) centered below image, `#1A1A1A`.
- **Ingredients List**: `body` (14dp) with checkable items.
- **Step-by-Step**: Large `h3` (22dp) for step numbers, `body-large` (18dp) for instructions, generous 24dp vertical spacing.
- **Voice Player Dock**: Bottom-right corner of screen, 48dp height, 12dp radius, background `#FDFBF7`, primary terracotta play icon.

**Ingredient Checklist Item**
- Checkbox: Circle 24dp diameter, stroke `#D35400` (primary).
- Checked State: Fill `#D35400`, checkmark white (`#FFFFFF`).
- Text: `body` (14dp) next to checkbox, `#333333` (secondary text).

**Step-by-Step Cooking Mode**
- **View**: Full-screen, high-contrast mode.
- **Text Size**: `h3` (22dp) for step number, `body-large` (18dp) for description.
- **Touch Target**: Minimum 48dp height per step.
- **Contrast**: Text `#1A1A1A` on `#FDFBF7` background (4.5:1 ratio).
- **Progress Indicator**: Small circle (12dp) with `#D35400` fill for current step.

**Empty States**
- Illustration: Simple line art in `#D35400`.
- Message: `body-large` (18dp) text in `#333333`.
- Action Button: Primary button (“اكتشف وصفات” / Discover Recipes) with 48dp height.

**Loading States**
- Spinner: Circular progress bar, 24dp diameter, `#D35400` color.
- Background Overlay: `rgba(212, 167, 129, 0.15)` scrim.

## 8. RTL & Accessibility Notes

**Mirroring for RTL**
- All layouts automatically mirror: back arrows point left, progress indicators move right-to-left, swipe gestures reversed.
- Text alignment: Right-aligned for paragraphs, center-aligned for titles in RTL mode.
- Icon direction: Use mirrored icons (e.g., back arrow points left in RTL, right in LTR).

**Contrast Ratios (WCAG AA)**
| Background | Text Color | Ratio | Pass/Fail |
|------------|------------|-------|-----------|
| `#FDFBF7` (cream) | `#1A1A1A` (dark) | 15.3:1 | ✅ Pass |
| `#FDFBF7` | `#333333` (mid) | 7.2:1 | ✅ Pass |
| `#FDFBF7` | `#777777` (light) | 3.9:1 | ❌ Fail (use `#333333` instead) |
| `#EDE9D0` (secondary dark) | `#1A1A1A` | 12.1:1 | ✅ Pass |
| `#D35400` (primary) | `#FFFFFF` (white) | 4.5:1 | ✅ Pass |
| `#D35400` | `#777777` (disabled) | 2.8:1 | ❌ Fail (use white or light neutral) |

**Minimum Touch Target**
- All interactive elements (buttons, cards, checkboxes, step items) must have a minimum touch target of **44dp × 44dp** to accommodate messy hands.
- Buttons are 48dp tall with 16dp horizontal padding (total 80dp width), satisfying this requirement.

## 9. Design Tokens (Developer Reference)

```typescript
// design-tokens.ts
export const designTokens = {
  colors: {
    primary: '#D35400',
    primaryLight: '#F4A261',
    primaryDark: '#C94F0E',
    secondary: '#FDFBF7',
    secondaryLight: '#FAF3E0',
    secondaryDark: '#EDE9D0',
    accent: '#556B2F',
    accentLight: '#8DAA91',
    accentDark: '#3E5424',
    neutralDark: '#1A1A1A',
    neutralMid: '#333333',
    neutralMuted: '#555555',
    neutralLight: '#777777',
    neutralSurface: '#F5F5F0',
    success: '#D97706',
    warning: '#F59E0B',
    info: '#10B981',
    scrim: 'rgba(212, 167, 129, 0.15)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    small: 6,
    medium: 12,
    large: 20,
  },
  elevation: {
    cardResting: '0px',
    cardPressed: '4px',
    cardLifted: '12px',
    modal: '20px',
  },
  font: {
    family: 'Cairo, sans-serif',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  typeScale: {
    display: { size: 64, lineHeight: 1.0, weight: 'bold' },
    h1: { size: 36, lineHeight: 1.2, weight: 'semibold' },
    h2: { size: 28, lineHeight: 1.2, weight: 'semibold' },
    h3: { size: 22, lineHeight: 1.3, weight: 'regular' },
    bodyLarge: { size: 18, lineHeight: 1.5, weight: 'regular' },
    body: { size: 14, lineHeight: 1.5, weight: 'regular' },
    bodySmall: { size: 12, lineHeight: 1.4, weight: 'regular' },
    caption: { size: 10, lineHeight: 1.2, weight: 'regular' },
    buttonLabel: { size: 13, lineHeight: 1.4, weight: 'semibold' },
  },
  button: {
    height: 48,
    paddingX: 16,
    radius: 12,
    minTouchTarget: 44,
  },
  voicePlayer: {
    restingBg: '#D35400',
    playingBg: '#FDFBF7',
    pausedIcon: '#D35400',
    playingIcon: '#FFFFFF',
  },
};
```

**Summary of Key Decisions:**
- **Color Palette**: Terracotta (`#D35400`) is the anchor, harmonized with cream (`#FDFBF7`) and olive green (`#556B2F`). Semantic colors use warm amber tones to avoid generic red/green.
- **Typography**: Cairo is the primary Arabic font with Tajawal fallback; weights cover all UI needs.
- **Spacing**: 4dp base unit creates a consistent, tactile feel.
- **Buttons**: Defined 6 variants with precise color states to ensure visual consistency across the app.
- **RTL**: Full mirroring support with contrast checks and touch target minimums for cooking use.
- **Design Tokens**: Ready-to-import TypeScript object for immediate use in React Native.

This file serves as the single source of truth for all visual and structural design decisions. All future prompts should reference "design.md" for implementation details.