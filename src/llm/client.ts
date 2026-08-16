import type { DeveloperTwinDsl, EvidenceRecord, Guidelines, IntentCandidateResponse, PromptEvent } from '../types.js';

export class LlmServiceError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'LlmServiceError';
    this.status = status;
  }
}

export interface LlmProvenance {
  provider: string;
  model: string;
  responseId: string | null;
  auditRef: string | null;
}

export interface LlmResult<T> {
  value: T;
  provenance: LlmProvenance;
}

function readProvenance(headers: { get(name: string): string | null }): LlmProvenance {
  const provider = headers.get('x-twin-provider');
  const model = headers.get('x-twin-model');
  if (!provider || !model) {
    throw new LlmServiceError('LLM service response is missing provenance headers (x-twin-provider, x-twin-model).');
  }
  return {
    provider,
    model,
    responseId: headers.get('x-twin-response-id'),
    auditRef: headers.get('x-twin-audit-ref')
  };
}

function authHeaders(): Record<string, string> {
  const token = process.env.TWIN_API_TOKEN;
  return token ? { 'x-twin-token': token } : {};
}

async function postJson<T>(baseUrl: string, path: string, body: unknown, timeoutMs = 90_000): Promise<LlmResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
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
    return { value: parsed as T, provenance: readProvenance(response.headers) };
  } catch (error) {
    if (error instanceof LlmServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new LlmServiceError(`LLM service timeout after ${timeoutMs} ms.`);
    throw new LlmServiceError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }
}

export async function serviceHealth(baseUrl: string, timeoutMs = 10_000): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/healthz`, { signal: controller.signal });
    if (!response.ok) throw new LlmServiceError(`LLM health failed with ${response.status}.`, response.status);
    return await response.json() as Record<string, unknown>;
  } catch (error) {
    if (error instanceof LlmServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new LlmServiceError(`LLM health timeout after ${timeoutMs} ms.`);
    throw new LlmServiceError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }
}

export const DEFAULT_EVENT_WINDOW = 160;

export function eventWindowSize(): number {
  const raw = process.env.TWIN_LLM_EVENT_WINDOW;
  if (!raw) return DEFAULT_EVENT_WINDOW;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) throw new LlmServiceError(`Invalid TWIN_LLM_EVENT_WINDOW: ${raw}`);
  return parsed;
}

export async function extractIntentCandidatesWithLlm(input: {
  baseUrl: string;
  events: PromptEvent[];
  evidence: EvidenceRecord[];
  existingRuleIds: string[];
}): Promise<LlmResult<IntentCandidateResponse> & { truncatedEvents: number; windowSize: number }> {
  const humanEvents = input.events.filter((event) => event.actor === 'human');
  const windowSize = eventWindowSize();
  const window = humanEvents.slice(-windowSize);
  const result = await postJson<IntentCandidateResponse>(input.baseUrl, '/v1/intents/extract', {
    schemaVersion: 'subactor.developer-twin.intent-request/v1',
    events: window.map((event) => ({ id: event.id, sequence: event.sequence, sourceClass: event.sourceClass, text: event.redactedText.slice(0, 1200) })),
    evidence: input.evidence.filter((item) => item.actor === 'human').map((item) => ({ id: item.id, excerpt: item.excerpt, sourceClass: item.sourceClass, topicHints: item.topicHints })),
    existingRuleIds: input.existingRuleIds
  });
  return { ...result, truncatedEvents: humanEvents.length - window.length, windowSize };
}

export async function generateGuidelinesWithLlm(input: {
  baseUrl: string;
  task: string;
  twin: DeveloperTwinDsl;
  deterministic: Guidelines;
  allowedCommands: string[];
}): Promise<LlmResult<Guidelines>> {
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
