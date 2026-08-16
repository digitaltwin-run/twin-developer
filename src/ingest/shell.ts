import { readFile } from 'node:fs/promises';
import type { PromptEvent } from '../types.js';
import type { Redactor } from '../util/redaction.js';
import { createEvent } from './common.js';

export async function ingestShellHistory(path: string, redact: Redactor, startSequence = 0): Promise<PromptEvent[]> {
  const lines = (await readFile(path, 'utf8')).split(/\r?\n/);
  const events: PromptEvent[] = [];
  let sequence = startSequence;
  for (const [lineIndex, raw] of lines.entries()) {
    const command = raw
      .replace(/^:\s*\d+:\d+;/, '')
      .replace(/^\s*\d+\s+/, '')
      .trim();
    if (!command || command.startsWith('#')) continue;
    const event = createEvent({
      redact,
      sourceFile: path,
      sourceFormat: 'shell-history',
      sourceClass: 'accepted_command',
      actor: 'human',
      sequence: sequence++,
      text: command,
      metadata: { line: lineIndex + 1 }
    });
    if (event) events.push(event);
  }
  return events;
}
