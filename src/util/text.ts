export function compactWhitespace(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function normalizeForMatch(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/[^a-z0-9ąćęłńóśźż/_:.-]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Wejściem jest już zredagowany tekst; ta funkcja wyłącznie skraca. */
export function excerpt(input: string, max = 360): string {
  const normalized = compactWhitespace(input);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function isLikelyCorrection(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return /^(nie\b|nie,|popraw\b|zamiast\b|to nie\b|blad\b|nie dziala\b|ceny sie nie zgadzaja\b)/.test(normalized)
    || normalized.includes('musi byc inny')
    || normalized.includes('powinno byc')
    || normalized.includes('caly czas mowimy');
}

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
