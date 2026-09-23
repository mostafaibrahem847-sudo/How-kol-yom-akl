import { TextStyle } from 'react-native';

/**
 * Typography — the single source of truth for text on Web AND Native.
 *
 * Cairo ships upstream as ONE variable font (`wght` 200..1000, `slnt` -11..11).
 * Relying on that variable file for weights was the cross-platform font bug:
 *
 *   - expo-font's web loader emits `@font-face { font-family: "Cairo"; src: url(...) }`
 *     with NO `font-weight` descriptor. A missing descriptor means `normal`
 *     (400), so the browser only ever had a 400 face and *synthesised* every
 *     bold with its own faux-bold algorithm.
 *   - On Android the same file is registered once under "Cairo" with no style
 *     variants, so RN could not select 500/600/700 either and applied Android's
 *     (different) fake-bold on top of the default 400 instance.
 *
 * Result: identical `fontWeight` values produced different glyphs, widths and
 * line breaks on Web vs Native, and weights 500/600 were lost entirely.
 *
 * The fix is to stop asking either platform to synthesise or interpolate:
 *
 *   1. `scripts/fonts/build_cairo.py` instantiates one STATIC file per weight
 *      from the variable font (plus one real oblique for the design's italic).
 *   2. Each static file is registered under its OWN family name (FONT_ASSETS).
 *   3. Styles select the family for the weight via `fontFamilyFor(weight)` and
 *      pin `fontWeight: 'normal'`, so no engine can synthesise on top.
 *
 * The same family name resolves to the same static file on every platform, so
 * the glyph outlines, advance widths and metrics are identical.
 */

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export type FontWeight = (typeof fontWeight)[keyof typeof fontWeight];

/** Registered family name for each static weight instance. */
const FAMILY_BY_WEIGHT: Record<FontWeight, string> = {
  '400': 'Cairo-Regular',
  '500': 'Cairo-Medium',
  '600': 'Cairo-SemiBold',
  '700': 'Cairo-Bold',
  '800': 'Cairo-ExtraBold',
};

/**
 * The design's only italic. Cairo has no true italic face, so we ship a real
 * static oblique (instanced from the `slnt` axis) instead of `fontStyle:
 * 'italic'`, which Web synthesises but Android renders upright — a guaranteed
 * platform mismatch.
 */
export const fontFamilyOblique = 'Cairo-Medium-Oblique';

/** Family to use for a given weight. Falls back to Regular for unknown values. */
export function fontFamilyFor(weight: FontWeight = fontWeight.regular): string {
  return FAMILY_BY_WEIGHT[weight] ?? FAMILY_BY_WEIGHT[fontWeight.regular];
}

/** Upright regular family. Prefer `fontFamilyFor(weight)` for weighted text. */
export const fontFamily = fontFamilyFor(fontWeight.regular);

/**
 * Weight -> static font file. Consumed by `Font.loadAsync` in App.tsx so the
 * registered names here can never drift from the files that back them.
 */
export const FONT_ASSETS = {
  [FAMILY_BY_WEIGHT['400']]: require('../../assets/fonts/Cairo-Regular.ttf'),
  [FAMILY_BY_WEIGHT['500']]: require('../../assets/fonts/Cairo-Medium.ttf'),
  [FAMILY_BY_WEIGHT['600']]: require('../../assets/fonts/Cairo-SemiBold.ttf'),
  [FAMILY_BY_WEIGHT['700']]: require('../../assets/fonts/Cairo-Bold.ttf'),
  [FAMILY_BY_WEIGHT['800']]: require('../../assets/fonts/Cairo-ExtraBold.ttf'),
  [fontFamilyOblique]: require('../../assets/fonts/Cairo-Medium-Oblique.ttf'),
} as const;

/**
 * Build a text style from a weight. `fontWeight` is deliberately pinned to
 * 'normal' so neither react-native-web nor Android can apply synthetic bold on
 * top of the already-correct static face.
 */
const text = (weight: FontWeight, fontSize: number, lineHeight: number): TextStyle => ({
  fontFamily: fontFamilyFor(weight),
  fontSize,
  lineHeight,
  fontWeight: 'normal',
});

export const typography = {
  display: text(fontWeight.bold, 64, 64),
  h1: text(fontWeight.semibold, 36, 43),
  h2: text(fontWeight.semibold, 17, 34),
  h3: text(fontWeight.medium, 22, 29),
  headlineMd: text(fontWeight.semibold, 12, 34),
  headlineSm: text(fontWeight.semibold, 20, 28),
  bodyLarge: text(fontWeight.regular, 18, 28),
  body: text(fontWeight.regular, 14, 22),
  bodyMedium: text(fontWeight.regular, 15, 24),
  bodySmall: text(fontWeight.regular, 12, 17),
  caption: text(fontWeight.regular, 10, 12),
  label: text(fontWeight.semibold, 13, 18),
  labelSm: text(fontWeight.medium, 11, 14),
  /** Real oblique instance — the controlled replacement for `fontStyle: 'italic'`. */
  labelSmOblique: {
    fontFamily: fontFamilyOblique,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 'normal',
  } as TextStyle,
  bodySmallOblique: {
    fontFamily: fontFamilyOblique,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: 'normal',
  } as TextStyle,
  button: text(fontWeight.semibold, 15, 18),
  buttonLarge: text(fontWeight.semibold, 15, 20),
} as const;

export const elevation = {
  cardResting: {
    shadowColor: '#D4A781',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLifted: {
    shadowColor: '#D4A781',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: '#9E3D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;
