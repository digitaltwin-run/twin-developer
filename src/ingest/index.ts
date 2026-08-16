import { extname } from 'node:path';
import type { PromptEvent } from '../types.js';
import { ingestCursorExport } from './cursor.js';
import { ingestJsonl } from './jsonl.js';
import { ingestMarkdownTranscript } from './markdown.js';
import { ingestPlainText } from './plain.js';
import { ingestShellHistory } from './shell.js';

export async function ingestFiles(paths: string[]): Promise<PromptEvent[]> {
  const events: PromptEvent[] = [];
  let sequence = 0;
  for (const path of paths) {
    const lower = path.toLowerCase();
    let chunk: PromptEvent[];
    if (lower.includes('shell') || lower.endsWith('.history') || lower.endsWith('.bash_history') || lower.endsWith('.zsh_history')) {
      chunk = await ingestShellHistory(path, sequence);
    } else if (lower.endsWith('.jsonl')) {
      chunk = await ingestJsonl(path, sequence);
    } else if (lower.endsWith('.json') && lower.includes('cursor')) {
      chunk = await ingestCursorExport(path, sequence);
    } else if (extname(lower) === '.md') {
      chunk = await ingestMarkdownTranscript(path, sequence);
    } else {
      chunk = await ingestPlainText(path, sequence);
    }
    events.push(...chunk);
    sequence = events.length ? Math.max(...events.map((event) => event.sequence)) + 1 : sequence;
  }
  return events.sort((a, b) => a.sequence - b.sequence);
}
