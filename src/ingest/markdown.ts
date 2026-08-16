import { readFile } from 'node:fs/promises';
import type { PromptEvent } from '../types.js';
import type { Redactor } from '../util/redaction.js';
import { createEvent } from './common.js';

const marker = /^### (User Input|Planner Response)\s*$/gm;
const acceptedCommand = /\*User accepted the command `([\s\S]*?)`\*/g;

function cleanHumanBlock(block: string): string {
  const beforeTrace = block.split(/\n\*(?:Viewed|Listed|Grep searched|Edited relevant|Checked command|User accepted)/)[0] ?? block;
  return beforeTrace.trim();
}

export async function ingestMarkdownTranscript(path: string, redact: Redactor, startSequence = 0): Promise<PromptEvent[]> {
  const text = await readFile(path, 'utf8');
  const matches = [...text.matchAll(marker)];
  const events: PromptEvent[] = [];
  let sequence = startSequence;

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const role = current[1];
    const start = (current.index ?? 0) + current[0].length;
    const end = next?.index ?? text.length;
    const block = text.slice(start, end).trim();

    if (role === 'User Input') {
      const human = createEvent({
        redact,
        sourceFile: path,
        sourceFormat: 'markdown-transcript',
        sourceClass: 'human_instruction',
        actor: 'human',
        sequence: sequence++,
        text: cleanHumanBlock(block),
        metadata: { transcriptRole: role }
      });
      if (human) events.push(human);

      for (const command of block.matchAll(acceptedCommand)) {
        const event = createEvent({
          redact,
          sourceFile: path,
          sourceFormat: 'markdown-transcript',
          sourceClass: 'accepted_command',
          actor: 'human',
          sequence: sequence++,
          text: command[1],
          metadata: { accepted: true, transcriptRole: role }
        });
        if (event) events.push(event);
      }
    } else {
      const agent = createEvent({
        redact,
        sourceFile: path,
        sourceFormat: 'markdown-transcript',
        sourceClass: 'agent_claim',
        actor: 'agent',
        sequence: sequence++,
        text: block,
        metadata: { transcriptRole: role }
      });
      if (agent) events.push(agent);
    }
  }

  return events;
}
