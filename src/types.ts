export type Actor = 'human' | 'agent' | 'system';
export type SourceClass =
  | 'human_correction'
  | 'human_instruction'
  | 'human_instruction_repeated'
  | 'accepted_command'
  | 'ticket_intent'
  | 'agent_claim'
  | 'test_receipt'
  | 'live_runtime_observation'
  | 'versioned_ssot'
  | 'code_or_config'
  | 'git_history'
  | 'documentation'
  | 'human_prompt_fact';

export interface PromptEvent {
  id: string;
  sourceFile: string;
  sourceFormat: 'markdown-transcript' | 'cursor-export' | 'jsonl' | 'shell-history' | 'plain-text';
  sourceClass: SourceClass;
  actor: Actor;
  sequence: number;
  text: string;
  redactedText: string;
  contentHash: string;
  isCorrection: boolean;
  metadata: Record<string, unknown>;
}

export interface EvidenceRecord {
  id: string;
  eventId: string;
  sourceFile: string;
  sourceClass: string;
  actor: Actor;
  sequence: number;
  excerpt: string;
  contentHash: string;
  intentWeight: number;
  realityWeight: number;
  isCorrection: boolean;
  topicHints: string[];
}

export type RuleKind = 'obligation' | 'prohibition' | 'preference' | 'decision-rule';
export type RuleScope = 'global' | 'subactor' | 'project' | 'contextual';
export type RuleStatus = 'active' | 'contextual' | 'superseded' | 'candidate';

export interface TwinRule {
  id: string;
  title: string;
  kind: RuleKind;
  scope: RuleScope;
  status: RuleStatus;
  description: string;
  triggers: string[];
  must: string[];
  should: string[];
  mustNot: string[];
  evidenceRefs: string[];
  supportCount: number;
  confidence: number;
  conflictPolicy?: string;
}

export interface RuleCatalogEntry {
  id: string;
  title: string;
  kind: RuleKind;
  scope: RuleScope;
  description: string;
  matchAny: string[];
  triggers: string[];
  must: string[];
  should: string[];
  mustNot: string[];
  minSupport: number;
  baseConfidence: number;
  forceContextual?: boolean;
}

export interface Diagnostic {
  code: string;
  severity: 'info' | 'warning' | 'review_required' | 'blocking';
  message: string;
  evidenceRefs?: string[];
}

export interface TruthRanking {
  description: string;
  ranking: Array<{ sourceClass: string; weight: number; note?: string }>;
}

export interface SourcePolicy {
  truthDomains: {
    humanIntent: TruthRanking;
    projectReality: TruthRanking;
  };
  conflictResolution: Array<{ id: string; when: string; winner: string; reason: string }>;
  epistemicRules: string[];
}

export interface LlmRouteConfig {
  id: string;
  priority: number;
  enabledEnv: string;
  transport: string;
  tags: string[];
  purposes: string[];
  modelAliases?: Record<string, string>;
  modelEnvs?: Record<string, string>;
  modelEnv?: string;
  apiBaseEnv?: string;
  apiKeyEnv?: string;
}

export interface ModelRegistryStage {
  alias: string;
  openrouterModelEnv: string;
  defaultOpenRouterModel: string;
  temperature: number | null;
  tags: string[];
}

export interface ModelRegistry {
  schemaVersion: string;
  home: string;
  stages: Record<'intent-extraction' | 'guideline-generation' | 'code-editing' | 'validation', ModelRegistryStage>;
}

export interface LlmRoutingConfig {
  schemaVersion: string;
  policy: string;
  modelRegistry?: string;
  routes: LlmRouteConfig[];
}

export interface DeveloperTwinDsl {
  $schema: string;
  schemaVersion: 'subactor.developer-twin/v1';
  generatedAt: string;
  generator: {
    name: 'developer-twin-runtime';
    version: string;
    mode: 'deterministic' | 'prefer-llm' | 'require-llm';
    llmUsed: boolean;
    degraded: boolean;
    /** Kto wyprodukował kandydatów. `null` tylko przy `llmUsed: false`. */
    provider: string | null;
    model: string | null;
    responseId: string | null;
    auditRef: string | null;
  };
  twin: {
    id: string;
    kind: 'behavioral-execution-policy';
    purpose: string;
    scope: string[];
    consent: {
      basis: string;
      allowedUses: string[];
      forbiddenUses: string[];
      expiresAt: string | null;
    };
  };
  sourcePolicy: SourcePolicy;
  rules: TwinRule[];
  workflow: Array<{
    order: number;
    id: string;
    name: string;
    requiredWhen: string[];
    actions: string[];
    evidenceRequired: string[];
  }>;
  autonomy: {
    allowed: string[];
    approvalRequired: string[];
    forbidden: string[];
    failClosedOn: string[];
  };
  modelRouting: {
    policy: string;
    stages: Array<{
      stage: 'intent-extraction' | 'guideline-generation' | 'code-editing' | 'validation';
      purposeTags: string[];
      modelAlias: string;
      routeOrder: string[];
      structuredOutputRequired: boolean;
    }>;
  };
  evidenceCatalog: EvidenceRecord[];
  diagnostics: Diagnostic[];
}

export interface IntentCandidate {
  candidateId: string;
  title: string;
  description: string;
  scope: RuleScope;
  kind: RuleKind;
  must?: string[];
  should?: string[];
  mustNot?: string[];
  evidenceRefs: string[];
  confidence: number;
  generalizationRisk: 'low' | 'medium' | 'high';
  conflictsWith?: string[];
}

export interface IntentCandidateResponse {
  schemaVersion: 'subactor.developer-twin.intent-candidates/v1';
  candidates: IntentCandidate[];
}

export interface GuidelineStep {
  order: number;
  action: string;
  reason: string;
  ruleRefs: string[];
  commands?: string[];
}

export interface Guidelines {
  schemaVersion: 'subactor.developer-twin.guidelines/v1';
  summary: string;
  steps: GuidelineStep[];
  gates: string[];
  unknowns: string[];
  ruleRefs: string[];
}
