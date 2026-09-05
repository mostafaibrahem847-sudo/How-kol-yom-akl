# Howa Kol Yom Akl (هو كل يوم أكل) — Project Plan

## Project Name
**Howa Kol Yom Akl** (هو كل يوم أكل)

## Project Idea
A native mobile app (built with React Native) that features popular Egyptian and Western dishes. Each dish has a dedicated detail page containing:
- Ingredients list
- Written preparation steps
- An AI-generated voice recording that narrates the recipe out loud

## Target Audience
Egyptian housewives who:
- Cook daily
- Need quick and reliable recipes
- Are short on time

## Pain Points the App Solves
- Written recipes take too long to read while actively cooking
- YouTube videos are long and full of unnecessary talk before getting to the point
- No single trusted source combines Egyptian and Western food with consistent quality

## Value Proposition
1. **Voice narration instead of text** — practical while cooking when hands are busy
2. **Deep, dedicated focus on Egyptian food** with high quality and detail
3. **Simple, fast-access design** to get to the recipe quickly

## Monetization Model
- **Currently:** Completely free
- **Future:** Monetization (subscription or partnerships) will be decided later after building a user base

## Tech Stack
- **Frontend:** React Native + TypeScript
- **Backend & Database:** Supabase (Auth, Database, Storage)
- **Voice Generation:** ElevenLabs API (Arabic voice, single consistent narrator as the brand's voice identity)
- **Build Method:** Vibe coding tools (Bolt / Cursor / etc.)

## Recipe Data Model
Each recipe record contains:
- Name (Arabic / English)
- Category (Egyptian / Western / Sweet / Savory / etc.)
- Dish image
- Ingredients list
- Preparation steps (text)
- AI-generated voice recording URL
- Prep time
- Servings
- Difficulty level *(optional)*

## MVP Plan
**Priority:** Ship as many recipes as possible (50–100 recipes) with **AI voice narration for every recipe from day one** (not a limited subset).

### Implementation Phases
1. **Prepare the recipe list (text content)** — 1 week
2. **Generate voice recordings via ElevenLabs** — 2–3 days (automated)
3. **Build the app and connect it to Supabase** — 2 weeks
4. **Testing and polish** (search, filtering, favorites) — 1 week

## Branding

### Brand Personality
- Warm and approachable
- Trustworthy
- Simple and practical
- Like a close relative showing you how to cook

### Color Palette — Suggested Direction
- **Primary:** Burnt orange / terracotta — evokes home cooking and traditional ovens
- **Secondary:** Light cream / beige — comfortable backgrounds
- **Accent:** Deep olive green — a fresh touch

**Alternative direction:**
- Primary: warm tomato red
- Secondary: white / cream
- Accent: mustard yellow

### Typography
- **Arabic font:** Cairo or Tajawal — clear, readable, and friendly on mobile

### Tone of Voice
Simple Egyptian colloquial Arabic across all text, buttons, and voice recordings — **not** formal Modern Standard Arabic — to stay consistent with the app's name and brand personality.