import type { DeveloperTwinDsl, Diagnostic, Guidelines, IntentCandidateResponse } from '../types.js';
import { checkCommand } from '../util/command.js';

const secretPattern = /(sk-[A-Za-z0-9_-]{12,}|subactor_usr_(?:live|test)_[A-Za-z0-9_-]+|Bearer\s+[A-Za-z0-9._~+/=-]{12,})/i;

export class TwinValidationError extends Error {
  readonly diagnostics: Diagnostic[];
  constructor(diagnostics: Diagnostic[]) {
    super(diagnostics.map((item) => `${item.code}: ${item.message}`).join('\n'));
    this.name = 'TwinValidationError';
    this.diagnostics = diagnostics;
  }
}

function validateGenerator(twin: DeveloperTwinDsl, issues: Diagnostic[]): void {
  if (twin.schemaVersion !== 'subactor.developer-twin/v1') {
    issues.push({ code: 'DT_SCHEMA_VERSION', severity: 'blocking', message: 'Nieobsługiwana schemaVersion.' });
  }
  if (!twin.generator || twin.generator.name !== 'developer-twin-runtime') {
    issues.push({ code: 'DT_GENERATOR_MISSING', severity: 'blocking', message: 'Brak poprawnej metadanej generatora.' });
  }
  if (twin.generator?.llmUsed !== true) return;
  if (!twin.generator.provider || !twin.generator.model) {
    issues.push({
      code: 'DT_PROVENANCE_MISSING',
      severity: 'blocking',
      message: 'generator.llmUsed=true bez generator.provider/model: nie da się odróżnić wyniku modelu od fixture.'
    });
  } else if (twin.generator.provider === 'fake') {
    issues.push({
      code: 'DT_FIXTURE_PROVENANCE',
      severity: 'review_required',
      message: `Kandydaci pochodzą z fixture (${twin.generator.provider}/${twin.generator.model}), nie z modelu. Artefakt nie jest dowodem zachowania LLM.`
    });
  }
}

function evidenceIndex(twin: DeveloperTwinDsl, issues: Diagnostic[]): Set<string> {
  const evidenceIds = twin.evidenceCatalog.map((item) => item.id);
  const evidenceSet = new Set(evidenceIds);
  if (evidenceSet.size !== evidenceIds.length) {
    issues.push({ code: 'DT_DUPLICATE_EVIDENCE', severity: 'blocking', message: 'Evidence IDs nie są unikalne.' });
  }
  return evidenceSet;
}

function validateRules(twin: DeveloperTwinDsl, evidenceSet: Set<string>, issues: Diagnostic[]): void {
  const ruleIds = twin.rules.map((rule) => rule.id);
  if (new Set(ruleIds).size !== ruleIds.length) {
    issues.push({ code: 'DT_DUPLICATE_RULE', severity: 'blocking', message: 'Rule IDs nie są unikalne.' });
  }
  const evidenceActors = new Map<string, string>();
  for (const item of twin.evidenceCatalog) {
    if (!evidenceActors.has(item.id)) evidenceActors.set(item.id, item.actor);
  }
  for (const rule of twin.rules) {
    if (!/^DT-[A-Z]+-[0-9]{3}$/.test(rule.id)) {
      issues.push({ code: 'DT_RULE_ID', severity: 'blocking', message: `Niepoprawne ID reguły: ${rule.id}.` });
    }
    const missing = rule.evidenceRefs.filter((ref) => !evidenceSet.has(ref));
    if (missing.length > 0) {
      issues.push({ code: 'DT_RULE_EVIDENCE_MISSING', severity: 'blocking', message: `${rule.id} odwołuje się do nieznanych dowodów.`, evidenceRefs: missing });
    }
    if (rule.status === 'active' && rule.evidenceRefs.length === 0) {
      issues.push({ code: 'DT_ACTIVE_RULE_WITHOUT_EVIDENCE', severity: 'blocking', message: `${rule.id} jest active bez evidenceRefs.` });
    }
    if (rule.supportCount !== rule.evidenceRefs.length) {
      issues.push({ code: 'DT_SUPPORT_COUNT_DRIFT', severity: 'warning', message: `${rule.id}: supportCount różni się od liczby unikalnych evidenceRefs.` });
    }
    const agentOnly = rule.status === 'active'
      && rule.evidenceRefs.length > 0
      && rule.evidenceRefs.every((ref) => evidenceActors.get(ref) === 'agent');
    if (agentOnly) {
      issues.push({ code: 'DT_AGENT_ONLY_ACTIVE_RULE', severity: 'blocking', message: `${rule.id} opiera się wyłącznie na claimach agenta.` });
    }
  }
}

function validateWorkflow(twin: DeveloperTwinDsl, issues: Diagnostic[]): void {
  const orders = twin.workflow.map((step) => step.order);
  if (new Set(orders).size !== orders.length) {
    issues.push({ code: 'DT_WORKFLOW_ORDER', severity: 'blocking', message: 'Kolejność workflow nie jest unikalna.' });
  }
}

export function validateTwin(twin: DeveloperTwinDsl, strict = true): Diagnostic[] {
  const issues: Diagnostic[] = [];
  validateGenerator(twin, issues);
  const evidenceSet = evidenceIndex(twin, issues);
  validateRules(twin, evidenceSet, issues);
  validateWorkflow(twin, issues);
  if (secretPattern.test(JSON.stringify(twin))) {
    issues.push({ code: 'DT_SECRET_LEAK', severity: 'blocking', message: 'Artefakt DSL zawiera materiał przypominający sekret.' });
  }
  const all = [...twin.diagnostics, ...issues];
  if (strict && all.some((item) => item.severity === 'blocking')) throw new TwinValidationError(all);
  return all;
}

export function validateIntentCandidates(value: unknown, knownEvidence: Set<string>): IntentCandidateResponse {
  if (!value || typeof value !== 'object') throw new Error('Intent candidate response must be an object.');
  const row = value as Record<string, unknown>;
  if (row.schemaVersion !== 'subactor.developer-twin.intent-candidates/v1' || !Array.isArray(row.candidates)) {
    throw new Error('Invalid intent candidate schemaVersion or candidates.');
  }
  for (const raw of row.candidates) {
    if (!raw || typeof raw !== 'object') throw new Error('Candidate must be an object.');
    const candidate = raw as Record<string, unknown>;
    if (!Array.isArray(candidate.evidenceRefs) || candidate.evidenceRefs.length === 0) throw new Error('Candidate requires evidenceRefs.');
    for (const ref of candidate.evidenceRefs) if (typeof ref !== 'string' || !knownEvidence.has(ref)) throw new Error(`Unknown evidenceRef: ${String(ref)}`);
    if (typeof candidate.confidence !== 'number' || candidate.confidence < 0 || candidate.confidence > 1) throw new Error('Invalid candidate confidence.');
    if (!['low', 'medium', 'high'].includes(String(candidate.generalizationRisk))) throw new Error('Invalid generalizationRisk.');
  }
  return value as IntentCandidateResponse;
}

export function validateGuidelines(value: unknown, twin: DeveloperTwinDsl, allowedCommands: string[]): Guidelines {
  if (!value || typeof value !== 'object') throw new Error('Guidelines must be an object.');
  const row = value as Record<string, unknown>;
  if (row.schemaVersion !== 'subactor.developer-twin.guidelines/v1' || !Array.isArray(row.steps) || !Array.isArray(row.ruleRefs)) {
    throw new Error('Invalid guidelines schema.');
  }
  const knownRules = new Set(twin.rules.map((rule) => rule.id));
  for (const ref of row.ruleRefs as unknown[]) if (typeof ref !== 'string' || !knownRules.has(ref)) throw new Error(`Unknown guideline ruleRef: ${String(ref)}`);
  for (const raw of row.steps as unknown[]) {
    if (!raw || typeof raw !== 'object') throw new Error('Guideline step must be an object.');
    const step = raw as Record<string, unknown>;
    if (!Array.isArray(step.ruleRefs)) throw new Error('Guideline step requires ruleRefs.');
    for (const ref of step.ruleRefs) if (typeof ref !== 'string' || !knownRules.has(ref)) throw new Error(`Unknown step ruleRef: ${String(ref)}`);
    if (Array.isArray(step.commands)) {
      for (const command of step.commands) {
        const verdict = checkCommand(command, allowedCommands);
        if (!verdict.ok) throw new Error(`Command rejected [${verdict.code}]: ${verdict.reason}`);
      }
    }
  }
  if (secretPattern.test(JSON.stringify(value))) throw new Error('Guidelines contain secret-like material.');
  return value as Guidelines;
}
