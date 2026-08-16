import { readFile } from 'node:fs/promises';
import type { PromptEvent } from '../types.js';
import { createEvent } from './common.js';

interface CursorExport {
  version?: number;
  name?: string;
  exportedAt?: number;
  blobs?: Record<string, string>;
}

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
}

function extractTipTapText(decoded: string): string | null {
  if (!decoded.includes('"type":"doc"') && !decoded.includes('"type": "doc"')) return null;
  const values: string[] = [];
  const regex = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of decoded.matchAll(regex)) values.push(decodeJsonString(match[1]));
  const combined = values.join(' ').replace(/\s+/g, ' ').trim();
  return combined || null;
}

export async function ingestCursorExport(path: string, startSequence = 0): Promise<PromptEvent[]> {
  const parsed = JSON.parse(await readFile(path, 'utf8')) as CursorExport;
  const events: PromptEvent[] = [];
  let sequence = startSequence;
  let blobIndex = 0;

  for (const [blobId, encoded] of Object.entries(parsed.blobs ?? {})) {
    let decoded: string;
    try {
      decoded = Buffer.from(encoded, 'base64').toString('utf8');
    } catch {
      blobIndex += 1;
      continue;
    }
    const message = extractTipTapText(decoded);
    if (message) {
      const event = createEvent({
        sourceFile: path,
        sourceFormat: 'cursor-export',
        sourceClass: 'human_instruction',
        actor: 'human',
        sequence: sequence++,
        text: message,
        metadata: {
          conversationName: parsed.name ?? null,
          exportedAt: parsed.exportedAt ?? null,
          blobId,
          blobIndex
        }
      });
      if (event) events.push(event);
    }
    blobIndex += 1;
  }

  return events;
}
