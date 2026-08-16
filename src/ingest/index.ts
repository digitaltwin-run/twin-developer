import { extname } from 'node:path';
import type { PromptEvent } from '../types.js';
import type { Redactor } from '../util/redaction.js';
import { ingestCursorExport } from './cursor.js';
import { ingestJsonl } from './jsonl.js';
import { ingestMarkdownTranscript } from './markdown.js';
import { ingestPlainText } from './plain.js';
import { ingestShellHistory } from './shell.js';

export async function ingestFiles(paths: string[], redact: Redactor): Promise<PromptEvent[]> {
  const events: PromptEvent[] = [];
  let sequence = 0;
  for (const path of paths) {
    const lower = path.toLowerCase();
    let chunk: PromptEvent[];
    if (lower.includes('shell') || lower.endsWith('.history') || lower.endsWith('.bash_history') || lower.endsWith('.zsh_history')) {
      chunk = await ingestShellHistory(path, redact, sequence);
    } else if (lower.endsWith('.jsonl')) {
      chunk = await ingestJsonl(path, redact, sequence);
    } else if (lower.endsWith('.json') && lower.includes('cursor')) {
      chunk = await ingestCursorExport(path, redact, sequence);
    } else if (extname(lower) === '.md') {
      chunk = await ingestMarkdownTranscript(path, redact, sequence);
    } else {
      chunk = await ingestPlainText(path, redact, sequence);
    }
    events.push(...chunk);
    // Licznik trzymany przyrostowo. `Math.max(...events)` rzuca RangeError
    // powyżej ~200 tys. zdarzeń, a realna historia powłoki to przekracza.
    for (const event of chunk) if (event.sequence >= sequence) sequence = event.sequence + 1;
  }
  return events.sort((a, b) => a.sequence - b.sequence);
}
