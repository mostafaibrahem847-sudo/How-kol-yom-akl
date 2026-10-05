# PROJECT_CONTEXT

Stable facts about this repo. Read this first before changing anything.

## Project

- Name: `howa-kol-yom-akl` (Arabic: هو كل يوم أكل — "How Kol Yom Akl").
- Purpose: Egyptian Arabic home-recipe app (وصفات بيتي) with voice narration.
- Platform: React Native / Expo (SDK 57, RN 0.86, React 19).
- Testing: Android-first via Expo Go; web supported through react-native-web.
- Entry: `index.js` → `src/app/App.tsx`.

## Language and direction

- UI language is Arabic (Egyptian dialect), defined in `src/i18n/strings.ts`.
- Layout is RTL throughout.
- Font: Cairo, shipped as static per-weight files. Use `fontFamilyFor(weight)`
  from `src/theme/typography.ts`; never rely on synthetic bold.

## Navigation

- `src/navigation/RootNavigator.tsx`: native stack + bottom tab bar.
- Three tabs: Home (الرئيسية), Favorites (المفضلة), Profile (حسابي).
- Search lives on Home. Extra stack screens: Welcome, SignIn, SignUp, RecipeDetail.

## Backend

- Supabase project ID: `lawoormzqfeyafjrptwc`.
- Tables: `recipes`, `ingredients`, `steps`, `tips`, `audio_urls`.
- Storage bucket: `recipe-audio` (public).
- Images are hosted on Cloudinary (cloud name `decj37mm0`).
- Schema lives in `src/db/schema.sql`; queries in `src/data/queries.ts`.

## Auth

- Clerk (`@clerk/expo`), email + password and Google SSO.

## Audio

- Narration MP3s live in the `recipe-audio` bucket, one file per recipe,
  named exactly after the recipe id.
- `audio_urls` holds one row per recipe; recipes with real audio have
  `audio_available = true`.

## Recipe catalog

- 50 recipes. Ids are lowercase slugs with hyphens (e.g. `shrimp-scampi`).
- Source of truth is the live DB; ids also listed in `src/db/seed-recipe-md.sql`.

## Rules for future changes

- Never commit secrets. `.env` and `.work/` are gitignored.
- Do not push without a secret check.
- Verify UI changes on a device (Expo Go), not only by reading code.

## Known open items

- About 20 recipes still have no narration audio.
- `shrimp-scampi` has no image.
- The featured hero picks a random recipe each app launch.
