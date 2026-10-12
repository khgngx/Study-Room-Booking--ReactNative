import type { Language } from '../store/usePreferencesStore';
import { EXACT, RULES } from './en';

let activeLanguage: Language = 'vi';

export const getActiveLanguage = (): Language => activeLanguage;

/** Switches the language `translate` renders. The app root calls it, then remounts the tree. */
export function setActiveLanguage(language: Language): void {
  activeLanguage = language;
}

// Section headings are upper-cased in code before they are shown; this lets them reuse the normal entries.
const UPPER: Record<string, string> = Object.fromEntries(
  Object.entries(EXACT).map(([source, english]) => [source.toLocaleUpperCase('vi'), english.toUpperCase()]),
);

const cache = new Map<string, string>();

function toEnglish(text: string): string {
  const core = text.trim();
  if (core.length === 0) return text;
  const wrap = (english: string) => text.replace(core, () => english);

  const exact = EXACT[core] ?? UPPER[core];
  if (exact !== undefined) return wrap(exact);
  for (const [pattern, render] of RULES) {
    const match = pattern.exec(core);
    if (!match) continue;
    const english = render(match, toEnglish);
    if (english !== core) return wrap(english);
  }
  // Compound labels such as "Toà A · Tầng 2 · 6 chỗ" or "Toà A, Toà B" translate part by part.
  for (const separator of [' · ', ', ']) {
    if (core.includes(separator)) return wrap(core.split(separator).map(toEnglish).join(separator));
  }
  return text;
}

/**
 * Renders an interface string in the selected language. Source strings are Vietnamese, so this is
 * the identity for Vietnamese; anything without an English entry is shown as written.
 */
export function translate(text: string): string {
  if (activeLanguage === 'vi') return text;
  let english = cache.get(text);
  if (english === undefined) {
    english = toEnglish(text);
    cache.set(text, english);
  }
  return english;
}
