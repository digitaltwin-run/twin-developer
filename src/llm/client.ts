import type { DeveloperTwinDsl, EvidenceRecord, Guidelines, IntentCandidateResponse, PromptEvent } from '../types.js';

export class LlmServiceError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'LlmServiceError';
    this.status = status;
  }
}

async function postJson<T>(baseUrl: string, path: string, body: unknown, timeoutMs = 90_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      throw new LlmServiceError(`LLM service returned non-JSON response: ${text.slice(0, 300)}`, response.status);
    }
    if (!response.ok) {
      const detail = parsed && typeof parsed === 'object' && 'detail' in parsed ? String((parsed as Record<string, unknown>).detail) : text;
      throw new LlmServiceError(`LLM service ${response.status}: ${detail}`, response.status);
    }
    return parsed as T;
  } catch (error) {
    if (error instanceof LlmServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new LlmServiceError(`LLM service timeout after ${timeoutMs} ms.`);
    throw new LlmServiceError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }
}

export async function serviceHealth(baseUrl: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/healthz`);
  if (!response.ok) throw new LlmServiceError(`LLM health failed with ${response.status}.`, response.status);
  return await response.json() as Record<string, unknown>;
}

export async function extractIntentCandidatesWithLlm(input: {
  baseUrl: string;
  events: PromptEvent[];
  evidence: EvidenceRecord[];
  existingRuleIds: string[];
}): Promise<IntentCandidateResponse> {
  return postJson<IntentCandidateResponse>(input.baseUrl, '/v1/intents/extract', {
    schemaVersion: 'subactor.developer-twin.intent-request/v1',
    events: input.events
      .filter((event) => event.actor === 'human')
      .slice(-160)
      .map((event) => ({ id: event.id, sequence: event.sequence, sourceClass: event.sourceClass, text: event.redactedText.slice(0, 1200) })),
    evidence: input.evidence.filter((item) => item.actor === 'human').map((item) => ({ id: item.id, excerpt: item.excerpt, sourceClass: item.sourceClass, topicHints: item.topicHints })),
    existingRuleIds: input.existingRuleIds
  });
}

export async function generateGuidelinesWithLlm(input: {
  baseUrl: string;
  task: string;
  twin: DeveloperTwinDsl;
  deterministic: Guidelines;
  allowedCommands: string[];
}): Promise<Guidelines> {
  return postJson<Guidelines>(input.baseUrl, '/v1/guidelines/generate', {
    schemaVersion: 'subactor.developer-twin.guidelines-request/v1',
    task: input.task,
    twin: {
      id: input.twin.twin.id,
      rules: input.twin.rules.filter((rule) => rule.status !== 'superseded'),
      workflow: input.twin.workflow,
      autonomy: input.twin.autonomy,
      diagnostics: input.twin.diagnostics
    },
    deterministicBaseline: input.deterministic,
    allowedCommands: input.allowedCommands
  });
}
