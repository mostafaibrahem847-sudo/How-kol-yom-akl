import { TextStyle } from 'react-native';

export const fontFamily = 'Cairo';
export const fontFamilyFallback = 'Tajawal';

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const typography = {
  display: {
    fontFamily,
    fontSize: 64,
    lineHeight: 64,
    fontWeight: fontWeight.bold,
  } as TextStyle,
  h1: {
    fontFamily,
    fontSize: 36,
    lineHeight: 43,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  h1Mobile: {
    fontFamily,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: fontWeight.bold,
  } as TextStyle,
  h2: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  h3: {
    fontFamily,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: fontWeight.medium,
  } as TextStyle,
  headlineMd: {
    fontFamily,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  headlineSm: {
    fontFamily,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  bodyLarge: {
    fontFamily,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: fontWeight.regular,
  } as TextStyle,
  body: {
    fontFamily,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: fontWeight.regular,
  } as TextStyle,
  bodyMedium: {
    fontFamily,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
  } as TextStyle,
  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: fontWeight.regular,
  } as TextStyle,
  caption: {
    fontFamily,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: fontWeight.regular,
  } as TextStyle,
  label: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  labelSm: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeight.medium,
  } as TextStyle,
  button: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  buttonLarge: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
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
  audioDock: {
    shadowColor: '#784620',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 12,
  },
  primary: {
    shadowColor: '#9E3D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;
