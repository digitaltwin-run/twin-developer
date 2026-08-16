import { resolve } from 'node:path';
import { readJson } from './files.js';

export interface RedactionPattern {
  id: string;
  pattern: string;
  replacement: string;
  ignoreCase?: boolean;
  note?: string;
}

export interface RedactionConfig {
  schemaVersion: string;
  patterns: RedactionPattern[];
  fixtures: { mustRedact: string[]; mustSurvive: string[] };
}

/** Funkcja redagująca. Wstrzykiwana, żeby nie było drugiego HOME wzorców. */
export type Redactor = (input: string) => string;

export function compileRedactor(config: RedactionConfig): Redactor {
  const compiled = config.patterns.map((entry) => ({
    id: entry.id,
    regex: new RegExp(entry.pattern, entry.ignoreCase ? 'gi' : 'g'),
    replacement: entry.replacement
  }));
  return (input: string): string => {
    let output = input;
    for (const { regex, replacement } of compiled) {
      regex.lastIndex = 0;
      output = output.replace(regex, replacement);
    }
    return output;
  };
}

export async function loadRedactionConfig(root: string): Promise<RedactionConfig> {
  const config = await readJson<RedactionConfig>(resolve(root, 'config/redaction-patterns.json'));
  if (config.schemaVersion !== 'subactor.developer-twin.redaction/v1') {
    throw new Error(`Unsupported redaction schemaVersion: ${config.schemaVersion}`);
  }
  if (!Array.isArray(config.patterns) || config.patterns.length === 0) {
    throw new Error('Redaction config carries no patterns; refusing to run unredacted.');
  }
  return config;
}

export async function loadRedactor(root: string): Promise<Redactor> {
  return compileRedactor(await loadRedactionConfig(root));
}
