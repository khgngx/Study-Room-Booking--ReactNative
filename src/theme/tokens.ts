import { Platform } from 'react-native';

// Type, spacing and shape tokens transcribed from DESIGN.md (Airbnb design analysis).
// Airbnb Cereal VF is proprietary; Inter is the substitute DESIGN.md recommends.

// Colours follow the classic Airbnb brand palette (Rausch, Babu, Hof, Foggy) rather than the
// newer values listed in DESIGN.md; neutrals are tints of the palette's warm light grey.
const light = {
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
  // A Babu fill that white text stays readable on.
  successStrong: '#007a87',
  // Hof.
  ink: '#484848',
  body: '#484848',
  // Foggy, a shade darker than the brand value so it still passes AA on the soft grey surface.
  muted: '#6f6f6f',
  mutedSoft: '#9b9b9b',
  hairline: '#dfe0dd',
  hairlineSoft: '#ecedeb',
  borderStrong: '#cdcfca',
  canvas: '#ffffff',
  surfaceSoft: '#f7f7f6',
  surfaceStrong: '#f0f1ef',
  onPrimary: '#ffffff',
  // Text on an `ink` fill.
  onDark: '#ffffff',
  scrim: 'rgba(72, 72, 72, 0.6)',
  // Frosted panels that let a moving backdrop show through.
  glass: 'rgba(255, 255, 255, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  // The page behind the phone frame when the web build is shown at phone size.
  backdrop: '#e9eae7',
};

export type ColorToken = keyof typeof light;

// The same roles on a near-black canvas. Brand hues keep their identity; what changes is which
// end of each hue carries text ("Ink" tokens go lighter) and how surfaces step up from the canvas
// (lighter, not darker), so borders, inputs and cards stay as easy to see and hit as in light mode.
const dark: Record<ColorToken, string> = {
  primary: '#ff5a5f',
  primaryActive: '#ff7377',
  primaryDisabled: '#6b3134',
  primarySoft: '#3b2123',
  successSoft: '#143936',
  accentSoft: '#3d2619',
  accent: '#fc642d',
  accentInk: '#ff9d73',
  error: '#ff8266',
  success: '#1fbfb2',
  successInk: '#5fd6cb',
  successStrong: '#008f84',
  ink: '#f3f3f1',
  body: '#e3e3e0',
  muted: '#b1b2ae',
  mutedSoft: '#878885',
  hairline: '#3f4045',
  hairlineSoft: '#2e2f33',
  borderStrong: '#5e6066',
  canvas: '#17181a',
  surfaceSoft: '#202124',
  surfaceStrong: '#2b2c30',
  onPrimary: '#ffffff',
  onDark: '#17181a',
  scrim: 'rgba(0, 0, 0, 0.66)',
  glass: 'rgba(32, 33, 36, 0.62)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  backdrop: '#0b0b0c',
};

export type ThemeName = 'light' | 'dark';
const palettes: Record<ThemeName, Record<ColorToken, string>> = { light, dark };

let activeTheme: ThemeName = 'light';

export const getActiveTheme = (): ThemeName => activeTheme;

/** Switches which palette `colors` reads from. The app root calls it, then remounts the tree. */
export function setActiveTheme(theme: ThemeName): void {
  activeTheme = theme;
}

/**
 * The current theme's colours. Reads resolve at the moment of access, so use it inside render or
 * inside a `themed` style sheet; a value copied out at module scope would stay on the first theme.
 */
export const colors: Record<ColorToken, string> = new Proxy(light, {
  get: (_target, token: string) => palettes[activeTheme][token as ColorToken],
});

/** Colours that must not follow the theme: a QR code stays black on white, a highlight stays white. */
export const fixed = { white: '#ffffff', black: '#000000', shade: '#484848', bezel: '#1b1c1f' } as const;

// Page headings are set in a calligraphic hand. The intended face is Altesse, which is commercial
// and not bundled: until its font file is added to the app, each platform falls back to the
// closest script it ships with (Snell Roundhand on Apple devices, the system cursive elsewhere).
const headingFont = Platform.select({
  web: 'Altesse, "Snell Roundhand", "Apple Chancery", cursive',
  ios: 'Snell Roundhand',
  default: 'cursive',
});

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heading: headingFont,
} as const;

// React Native needs absolute line heights; values are fontSize × the DESIGN.md ratio.
export const typography = {
  ratingDisplay: { fontFamily: fonts.bold, fontSize: 64, lineHeight: 70, letterSpacing: -1 },
  // Every page title. Script faces run small, so the size is above `displayXl` for the same visual weight.
  heading: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 44 },
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

/** Height shared by every compact control in a header row, so pills and buttons line up. */
export const CONTROL_HEIGHT = 36;

/** From this width the display controls (theme, language, frame) are shown on the page itself. Narrower screens reach them from the profile tab, or from the toolbar above the phone frame. */
export const WIDE_LAYOUT_WIDTH = 900;
