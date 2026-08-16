import type {
  Diagnostic,
  EvidenceRecord,
  PromptEvent,
  RuleCatalogEntry,
  SourcePolicy,
  TwinRule
} from '../types.js';
import { stableId } from '../util/hash.js';
import { excerpt, normalizeForMatch, uniqueStrings } from '../util/text.js';

export interface DeterministicExtraction {
  rules: TwinRule[];
  evidence: EvidenceRecord[];
  diagnostics: Diagnostic[];
  matchesByRule: Record<string, string[]>;
}

function rankingWeight(policy: SourcePolicy, domain: 'humanIntent' | 'projectReality', sourceClass: string): number {
  return policy.truthDomains[domain].ranking.find((row) => row.sourceClass === sourceClass)?.weight ?? 0;
}

function eventMatches(entry: RuleCatalogEntry, event: PromptEvent): boolean {
  const haystack = normalizeForMatch(event.redactedText);
  return entry.matchAny.some((needle) => haystack.includes(normalizeForMatch(needle)));
}

function supportingEvent(event: PromptEvent): boolean {
  return event.actor === 'human' && ['human_instruction', 'human_correction', 'ticket_intent'].includes(event.sourceClass);
}

function effectiveClass(event: PromptEvent, repeated: boolean): string {
  if (event.sourceClass === 'human_instruction' && repeated) return 'human_instruction_repeated';
  return event.sourceClass;
}

export function extractDeterministicRules(
  events: PromptEvent[],
  policy: SourcePolicy,
  catalog: RuleCatalogEntry[]
): DeterministicExtraction {
  const matches = new Map<string, PromptEvent[]>();
  const matchedEntriesByEvent = new Map<string, RuleCatalogEntry[]>();

  for (const entry of catalog) {
    const rows = events.filter((event) => eventMatches(entry, event));
    matches.set(entry.id, rows);
    for (const event of rows) {
      const current = matchedEntriesByEvent.get(event.id) ?? [];
      current.push(entry);
      matchedEntriesByEvent.set(event.id, current);
    }
  }

  const evidenceByEvent = new Map<string, EvidenceRecord>();
  for (const event of events) {
    const entries = matchedEntriesByEvent.get(event.id) ?? [];
    if (entries.length === 0) continue;
    const repeated = entries.some((entry) => (matches.get(entry.id) ?? []).filter(supportingEvent).length >= Math.max(2, entry.minSupport));
    const sourceClass = effectiveClass(event, repeated);
    evidenceByEvent.set(event.id, {
      id: stableId('evidence', event.id),
      eventId: event.id,
      sourceFile: event.sourceFile,
      sourceClass,
      actor: event.actor,
      sequence: event.sequence,
      excerpt: excerpt(event.redactedText),
      contentHash: event.contentHash,
      intentWeight: rankingWeight(policy, 'humanIntent', sourceClass),
      realityWeight: rankingWeight(policy, 'projectReality', sourceClass),
      isCorrection: event.isCorrection,
      topicHints: uniqueStrings(entries.map((entry) => entry.id))
    });
  }

  const rules: TwinRule[] = [];
  const diagnostics: Diagnostic[] = [];
  const matchesByRule: Record<string, string[]> = {};

  for (const entry of catalog) {
    const rows = (matches.get(entry.id) ?? []).filter(supportingEvent);
    const refs = uniqueStrings(rows.map((event) => evidenceByEvent.get(event.id)?.id ?? ''));
    matchesByRule[entry.id] = rows.map((event) => event.id);
    if (rows.length < entry.minSupport) {
      diagnostics.push({
        code: 'DT_RULE_INSUFFICIENT_SUPPORT',
        severity: 'info',
        message: `${entry.id} pominięto: wsparcie ${rows.length}/${entry.minSupport}.`,
        evidenceRefs: refs
      });
      continue;
    }

    const correctionBoost = rows.some((event) => event.isCorrection) ? 0.03 : 0;
    const repetitionBoost = Math.min(0.08, Math.max(0, rows.length - entry.minSupport) * 0.02);
    const avgIntentWeight = refs.length === 0
      ? 0
      : refs.reduce((sum, ref) => sum + ([...evidenceByEvent.values()].find((item) => item.id === ref)?.intentWeight ?? 0), 0) / refs.length;
    const confidence = Math.min(0.99, entry.baseConfidence + correctionBoost + repetitionBoost + (avgIntentWeight / 100) * 0.03);

    rules.push({
      id: entry.id,
      title: entry.title,
      kind: entry.kind,
      scope: entry.forceContextual ? 'contextual' : entry.scope,
      status: entry.forceContextual || entry.scope === 'contextual' ? 'contextual' : 'active',
      description: entry.description,
      triggers: entry.triggers,
      must: entry.must,
      should: entry.should,
      mustNot: entry.mustNot,
      evidenceRefs: refs,
      supportCount: refs.length,
      confidence: Number(confidence.toFixed(3)),
      conflictPolicy: entry.forceContextual ? 'CR-CONTEXT-NOT-GLOBAL' : 'CR-INTENT-NEWER-CORRECTION'
    });
  }

  const agentClaims = [...evidenceByEvent.values()].filter((item) => item.actor === 'agent');
  if (agentClaims.length > 0) {
    diagnostics.push({
      code: 'DT_AGENT_CLAIMS_NON_AUTHORITATIVE',
      severity: 'info',
      message: `${agentClaims.length} wypowiedzi agenta zachowano jako materiał audytowy, ale nie użyto ich do aktywacji reguł.`,
      evidenceRefs: agentClaims.slice(0, 20).map((item) => item.id)
    });
  }

  const dockerRule = rules.find((rule) => rule.id === 'DT-DOCKER-001');
  if (dockerRule) {
    diagnostics.push({
      code: 'DT_CONTEXTUAL_CONFLICT_PRESERVED',
      severity: 'review_required',
      message: 'Historia zawiera polecenia usunięcia konkretnego kontenera i użycia Dockera do parity. Reguła pozostaje kontekstowa.',
      evidenceRefs: dockerRule.evidenceRefs
    });
  }

  return {
    rules: rules.sort((a, b) => a.id.localeCompare(b.id)),
    evidence: [...evidenceByEvent.values()].sort((a, b) => a.sequence - b.sequence),
    diagnostics,
    matchesByRule
  };
}
