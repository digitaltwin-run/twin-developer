const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\b(sk-[A-Za-z0-9_-]{12,})\b/g, '[REDACTED_API_KEY]'],
  [/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{12,}\b/gi, '$1[REDACTED_TOKEN]'],
  [/\b((?:API|ACCESS|AUTH|SECRET|TOKEN|PASSWORD|PASS|KEY)[A-Z0-9_]*\s*[=:]\s*)[^\s"']+/gi, '$1[REDACTED]'],
  [/\b(subactor_usr_(?:live|test)_[A-Za-z0-9_-]+)\b/g, '[REDACTED_SUBACTOR_TOKEN]'],
  [/\b([A-Fa-f0-9]{40,64})\b/g, '[REDACTED_LONG_HEX]']
];

export function redactSecrets(input: string): string {
  let output = input;
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

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

export function excerpt(input: string, max = 360): string {
  const normalized = compactWhitespace(redactSecrets(input));
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
