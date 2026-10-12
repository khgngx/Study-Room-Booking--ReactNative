import { themed } from '../themed';
import { colors, setActiveTheme } from '../tokens';

afterEach(() => setActiveTheme('light'));

describe('theme', () => {
  it('reads colours from the active palette at the moment of access', () => {
    const light = colors.canvas;
    setActiveTheme('dark');
    expect(colors.canvas).not.toBe(light);
    setActiveTheme('light');
    expect(colors.canvas).toBe(light);
  });

  it('keeps text readable against its surface in both themes', () => {
    // WCAG relative luminance contrast; 4.5 is the AA floor for body text.
    const channel = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((index) => channel(parseInt(hex.slice(index, index + 2), 16) / 255));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: string, b: string) => {
      const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (high + 0.05) / (low + 0.05);
    };
    for (const theme of ['light', 'dark'] as const) {
      setActiveTheme(theme);
      for (const text of ['ink', 'body', 'muted', 'successInk', 'accentInk', 'error'] as const) {
        for (const surface of ['canvas', 'surfaceSoft'] as const) {
          expect({ theme, text, surface, ok: contrast(colors[text], colors[surface]) >= 4.5 }).toEqual({ theme, text, surface, ok: true });
        }
      }
      expect(contrast(colors.onDark, colors.ink)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('builds a style sheet once per theme and switches with it', () => {
    const build = jest.fn(() => ({ box: { backgroundColor: colors.canvas } }));
    const styles = themed(build);
    const light = styles.box;
    expect(styles.box).toBe(light);
    setActiveTheme('dark');
    expect(styles.box).not.toEqual(light);
    setActiveTheme('light');
    expect(styles.box).toBe(light);
    expect(build).toHaveBeenCalledTimes(2);
  });
});
