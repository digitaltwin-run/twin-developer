import { readFile } from 'node:fs/promises';
import type { PromptEvent } from '../types.js';
import { createEvent } from './common.js';

export async function ingestPlainText(path: string, startSequence = 0): Promise<PromptEvent[]> {
  const text = await readFile(path, 'utf8');
  const blocks = text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const events: PromptEvent[] = [];
  let sequence = startSequence;
  for (const block of blocks) {
    const event = createEvent({
      sourceFile: path,
      sourceFormat: 'plain-text',
      sourceClass: 'human_instruction',
      actor: 'human',
      sequence: sequence++,
      text: block
    });
    if (event) events.push(event);
  }
  return events;
}
