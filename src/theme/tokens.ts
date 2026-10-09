// Design tokens transcribed from DESIGN.md (Airbnb design analysis).
// Airbnb Cereal VF is proprietary; Inter is the substitute DESIGN.md recommends.

export const colors = {
  primary: '#ff385c',
  primaryActive: '#e00b41',
  primaryDisabled: '#ffd1da',
  error: '#c13515',
  ink: '#222222',
  body: '#3f3f3f',
  muted: '#6a6a6a',
  mutedSoft: '#929292',
  hairline: '#dddddd',
  hairlineSoft: '#ebebeb',
  borderStrong: '#c1c1c1',
  canvas: '#ffffff',
  surfaceSoft: '#f7f7f7',
  surfaceStrong: '#f2f2f2',
  onPrimary: '#ffffff',
  onDark: '#ffffff',
  scrim: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ColorToken = keyof typeof colors;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

// React Native needs absolute line heights; values are fontSize × the DESIGN.md ratio.
export const typography = {
  ratingDisplay: { fontFamily: fonts.bold, fontSize: 64, lineHeight: 70, letterSpacing: -1 },
  displayXl: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 40 },
  displayLg: { fontFamily: fonts.medium, fontSize: 22, lineHeight: 26, letterSpacing: -0.44 },
  displayMd: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 30 },
  displaySm: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 24, letterSpacing: -0.18 },
  titleMd: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  titleSm: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 20 },
  bodyMd: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18 },
  captionSm: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16 },
  badge: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 13 },
  microLabel: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
  buttonMd: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 20 },
  buttonSm: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18 },
} as const;

export type TypographyToken = keyof typeof typography;

export const radius = { none: 0, xs: 4, sm: 8, md: 14, lg: 20, xl: 32, full: 9999 } as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64,
} as const;

// The single elevation tier in the system.
export const shadow = {
  boxShadow:
    '0 0 0 1px rgba(0, 0, 0, 0.02), 0 2px 6px 0 rgba(0, 0, 0, 0.04), 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
} as const;
