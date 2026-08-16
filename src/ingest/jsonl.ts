import { readFile } from 'node:fs/promises';
import type { PromptEvent } from '../types.js';
import { createEvent } from './common.js';

export async function ingestJsonl(path: string, startSequence = 0): Promise<PromptEvent[]> {
  const lines = (await readFile(path, 'utf8')).split(/\r?\n/).filter((line) => line.trim());
  const events: PromptEvent[] = [];
  let sequence = startSequence;
  for (const [lineIndex, line] of lines.entries()) {
    const parsed = JSON.parse(line) as Partial<PromptEvent> & { text?: string };
    const event = createEvent({
      sourceFile: path,
      sourceFormat: 'jsonl',
      sourceClass: parsed.sourceClass ?? 'human_instruction',
      actor: parsed.actor ?? 'human',
      sequence: parsed.sequence ?? sequence++,
      text: parsed.text ?? parsed.redactedText ?? '',
      metadata: { line: lineIndex + 1, ...(parsed.metadata ?? {}) }
    });
    if (event) events.push(event);
  }
  return events;
}
