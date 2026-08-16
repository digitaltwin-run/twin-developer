import { basename } from 'node:path';
import type { Actor, PromptEvent, SourceClass } from '../types.js';
import { sha256, stableId } from '../util/hash.js';
import type { Redactor } from '../util/redaction.js';
import { compactWhitespace, isLikelyCorrection } from '../util/text.js';

export function createEvent(input: {
  sourceFile: string;
  sourceFormat: PromptEvent['sourceFormat'];
  sourceClass: SourceClass;
  actor: Actor;
  sequence: number;
  text: string;
  redact: Redactor;
  metadata?: Record<string, unknown>;
}): PromptEvent | null {
  const text = compactWhitespace(input.text);
  if (!text || text.length < 2) return null;
  const redactedText = input.redact(text);
  const isCorrection = input.actor === 'human' && isLikelyCorrection(redactedText);
  const sourceClass = isCorrection ? 'human_correction' : input.sourceClass;
  const contentHash = sha256(redactedText);
  const id = stableId('event', `${basename(input.sourceFile)}\n${input.sequence}\n${contentHash}`);
  return {
    id,
    sourceFile: input.sourceFile,
    sourceFormat: input.sourceFormat,
    sourceClass,
    actor: input.actor,
    sequence: input.sequence,
    redactedText,
    contentHash,
    isCorrection,
    metadata: input.metadata ?? {}
  };
}
