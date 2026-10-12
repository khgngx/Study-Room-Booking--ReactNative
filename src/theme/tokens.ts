// Type, spacing and shape tokens transcribed from DESIGN.md (Airbnb design analysis).
// Airbnb Cereal VF is proprietary; Inter is the substitute DESIGN.md recommends.

// Colours follow the classic Airbnb brand palette (Rausch, Babu, Hof, Foggy) rather than the
// newer values listed in DESIGN.md; neutrals are tints of the palette's warm light grey.
export const colors = {
  // Rausch.
  primary: '#ff5a5f',
  primaryActive: '#e61e4d',
  primaryDisabled: '#ffcfd0',
  // Tints of Rausch, Babu and Arches: fills that carry a state without shouting.
  primarySoft: '#fff0f1',
  successSoft: '#e3f6f4',
  accentSoft: '#fff1ea',
  // Arches: the palette's warm accent, for highlights that are neither an action nor a state.
  accent: '#fc642d',
  accentInk: '#b8400f',
  error: '#c13515',
  // Babu: the positive signal (free rooms, presence) that Rausch and Hof cannot carry.
  success: '#00a699',
  // Kazan: Babu is too light for small text on white.
  successInk: '#007a87',
  // Hof.
  ink: '#484848',
  body: '#484848',
  // Foggy.
  muted: '#767676',
  mutedSoft: '#9b9b9b',
  hairline: '#dfe0dd',
  hairlineSoft: '#ecedeb',
  borderStrong: '#cdcfca',
  canvas: '#ffffff',
  surfaceSoft: '#f7f7f6',
  surfaceStrong: '#f0f1ef',
  onPrimary: '#ffffff',
  onDark: '#ffffff',
  scrim: 'rgba(72, 72, 72, 0.6)',
  // Frosted panels that let a moving backdrop show through.
  glass: 'rgba(255, 255, 255, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
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
  // Door-code plates: the room code set like signage.
  plateLg: { fontFamily: fonts.bold, fontSize: 44, lineHeight: 48, letterSpacing: -0.5 },
  plate: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 22 },
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
