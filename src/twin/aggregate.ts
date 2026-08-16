import type {
  DeveloperTwinDsl,
  Diagnostic,
  EvidenceRecord,
  IntentCandidate,
  LlmRoutingConfig,
  ModelRegistry,
  SourcePolicy,
  TwinRule
} from '../types.js';
import { nowIso } from '../util/files.js';
import { stableId } from '../util/hash.js';
import { uniqueStrings } from '../util/text.js';

const VERSION = '0.1.0';

export function candidateRules(candidates: IntentCandidate[], evidence: EvidenceRecord[]): { rules: TwinRule[]; diagnostics: Diagnostic[] } {
  const known = new Set(evidence.map((item) => item.id));
  const rules: TwinRule[] = [];
  const diagnostics: Diagnostic[] = [];
  let index = 101;

  for (const candidate of candidates) {
    const missing = candidate.evidenceRefs.filter((ref) => !known.has(ref));
    if (missing.length > 0 || candidate.evidenceRefs.length === 0) {
      diagnostics.push({
        code: 'DT_LLM_CANDIDATE_UNKNOWN_EVIDENCE',
        severity: 'warning',
        message: `Odrzucono kandydata ${candidate.candidateId}: nieznane albo puste evidenceRefs.`,
        evidenceRefs: candidate.evidenceRefs
      });
      continue;
    }
    if (candidate.generalizationRisk === 'high' || candidate.confidence < 0.65) {
      diagnostics.push({
        code: 'DT_LLM_CANDIDATE_LOW_TRUST',
        severity: 'review_required',
        message: `Odrzucono kandydata ${candidate.candidateId}: confidence=${candidate.confidence}, risk=${candidate.generalizationRisk}.`,
        evidenceRefs: candidate.evidenceRefs
      });
      continue;
    }
    const id = `DT-LLM-${String(index++).padStart(3, '0')}`;
    rules.push({
      id,
      title: candidate.title,
      kind: candidate.kind,
      scope: candidate.scope,
      status: 'candidate',
      description: candidate.description,
      triggers: [],
      must: candidate.must ?? [],
      should: candidate.should ?? [],
      mustNot: candidate.mustNot ?? [],
      evidenceRefs: uniqueStrings(candidate.evidenceRefs),
      supportCount: uniqueStrings(candidate.evidenceRefs).length,
      confidence: candidate.confidence,
      conflictPolicy: 'LLM_PROPOSE_ONLY_REQUIRES_HUMAN_REVIEW'
    });
  }

  if (rules.length > 0) {
    diagnostics.push({
      code: 'DT_LLM_CANDIDATES_REVIEW_REQUIRED',
      severity: 'review_required',
      message: `${rules.length} kandydatów LLM dodano ze statusem candidate; nie sterują wykonaniem bez promocji w ticket/intent.`,
      evidenceRefs: rules.flatMap((rule) => rule.evidenceRefs)
    });
  }
  return { rules, diagnostics };
}

function buildWorkflow(): DeveloperTwinDsl['workflow'] {
  return [
    {
      order: 1,
      id: 'observe',
      name: 'Zbierz i znormalizuj dowody',
      requiredWhen: ['always'],
      actions: ['Wczytaj historię IDE/shell/chat.', 'Zredaguj sekrety.', 'Zachowaj hash, źródło, kolejność i aktora.'],
      evidenceRequired: ['normalized-event-log']
    },
    {
      order: 2,
      id: 'resolve-intent',
      name: 'Rozstrzygnij intencję człowieka',
      requiredWhen: ['new_task', 'conflicting_prompts', 'continue_request'],
      actions: ['Zastosuj ranking humanIntent.', 'Nowszą korektę traktuj jako supersession w tym samym zakresie.', 'Nie globalizuj incydentu.'],
      evidenceRequired: ['human evidenceRefs', 'conflict-resolution receipt']
    },
    {
      order: 3,
      id: 'reconcile-reality',
      name: 'Porównaj intencję z bieżącą rzeczywistością',
      requiredWhen: ['claim_about_current_state', 'code_change', 'production_readiness'],
      actions: ['Znajdź HOME właściwy dla claimu.', 'Sprawdź kod, Git, testy i runtime.', 'Oznacz unknown lub disagreement zamiast zgadywać.'],
      evidenceRequired: ['versioned SSOT or code revision', 'test/runtime receipt']
    },
    {
      order: 4,
      id: 'govern',
      name: 'Zwiąż pracę z ticketem i zakresem',
      requiredWhen: ['multi_step_change', 'cross_file_change'],
      actions: ['Odczytaj lub utwórz project/ticket-*.', 'Sprawdź allowed paths i acceptance criteria.', 'Zapisuj decyzje i changelog.'],
      evidenceRequired: ['ticket intent', 'scope validation']
    },
    {
      order: 5,
      id: 'propose',
      name: 'Wygeneruj plan i kontekst wykonawczy',
      requiredWhen: ['implementation_requested'],
      actions: ['Preferuj istniejące API i komponenty.', 'Przekaż do LLM tylko zwalidowany DSL oraz minimalny kontekst.', 'Kandydaci LLM pozostają propose-only.'],
      evidenceRequired: ['validated DSL', 'guideline artifact']
    },
    {
      order: 6,
      id: 'execute-and-verify',
      name: 'Wykonaj w ograniczonym zakresie i zweryfikuj',
      requiredWhen: ['source_mutation_approved'],
      actions: ['Wykonaj zmianę w allowed paths.', 'Uruchom build, TestQL/kontrakty i pełne testy.', 'Sprawdź health/live behavior i zapisz receipty.'],
      evidenceRequired: ['diff', 'command receipts', 'runtime observations']
    }
  ];
}

function buildModelStages(routing: LlmRoutingConfig, registry: ModelRegistry): DeveloperTwinDsl['modelRouting']['stages'] {
  const stages: DeveloperTwinDsl['modelRouting']['stages'] = [
    { stage: 'intent-extraction', purposeTags: registry.stages['intent-extraction'].tags, modelAlias: registry.stages['intent-extraction'].alias, routeOrder: [], structuredOutputRequired: true },
    { stage: 'guideline-generation', purposeTags: registry.stages['guideline-generation'].tags, modelAlias: registry.stages['guideline-generation'].alias, routeOrder: [], structuredOutputRequired: true },
    { stage: 'code-editing', purposeTags: registry.stages['code-editing'].tags, modelAlias: registry.stages['code-editing'].alias, routeOrder: [], structuredOutputRequired: false },
    { stage: 'validation', purposeTags: registry.stages.validation.tags, modelAlias: registry.stages.validation.alias, routeOrder: [], structuredOutputRequired: true }
  ];
  const sorted = [...routing.routes].sort((a, b) => a.priority - b.priority);
  for (const stage of stages) {
    stage.routeOrder = sorted.filter((route) => route.purposes.includes(stage.stage)).map((route) => route.id);
  }
  return stages;
}

export function buildDeveloperTwin(input: {
  sourcePolicy: SourcePolicy;
  routing: LlmRoutingConfig;
  modelRegistry: ModelRegistry;
  deterministicRules: TwinRule[];
  evidence: EvidenceRecord[];
  diagnostics?: Diagnostic[];
  llmCandidates?: IntentCandidate[];
  mode?: 'deterministic' | 'prefer-llm' | 'require-llm';
  llmUsed?: boolean;
  degraded?: boolean;
}): DeveloperTwinDsl {
  const candidateResult = candidateRules(input.llmCandidates ?? [], input.evidence);
  const rules = [...input.deterministicRules, ...candidateResult.rules].sort((a, b) => a.id.localeCompare(b.id));
  const id = stableId('developer-twin', rules.map((rule) => `${rule.id}:${rule.confidence}:${rule.evidenceRefs.join(',')}`).join('\n'));
  return {
    $schema: '../schemas/developer-twin.schema.json',
    schemaVersion: 'subactor.developer-twin/v1',
    generatedAt: nowIso(),
    generator: {
      name: 'developer-twin-runtime',
      version: VERSION,
      mode: input.mode ?? 'deterministic',
      llmUsed: input.llmUsed ?? false,
      degraded: input.degraded ?? false
    },
    twin: {
      id,
      kind: 'behavioral-execution-policy',
      purpose: 'Kontynuowanie rozwoju Subactor zgodnie z udokumentowanym sposobem pracy człowieka, bez imitowania jego tożsamości lub cech osobowości.',
      scope: ['software-development', 'subactor', 'ticket-governance', 'validation', 'ssot', 'llm-routing'],
      consent: {
        basis: 'Jawne przekazanie historii promptów w celu utworzenia projektu developer digital twin.',
        allowedUses: ['generowanie planów i wytycznych projektowych', 'kontrola zgodności LLM/Aider z ticketem, SSOT i testami', 'wykrywanie konfliktów intencji'],
        forbiddenUses: ['ocena zatrudnienia lub wydajności człowieka', 'wnioskowanie o zdrowiu, poglądach lub cechach osobowości', 'podszywanie się pod człowieka', 'publikacja surowych promptów lub sekretów'],
        expiresAt: null
      }
    },
    sourcePolicy: input.sourcePolicy,
    rules,
    workflow: buildWorkflow(),
    autonomy: {
      allowed: ['czytanie lokalnych źródeł', 'redakcja sekretów', 'deterministyczna ekstrakcja i walidacja', 'proponowanie planu', 'uruchamianie jawnie dozwolonych testów w bieżącym ticket scope'],
      approvalRequired: ['modyfikacja kodu źródłowego przez Aider', 'commit, push, merge lub deployment', 'zmiana produkcyjnej konfiguracji, DNS, SMTP lub sekretów', 'promocja rule.status=candidate do active'],
      forbidden: ['ujawnianie sekretów', 'nadawanie sobie uprawnień przez LLM', 'twierdzenie PASS/DONE bez receiptów', 'zmiana HOME produktu z samej historii promptów', 'profilowanie człowieka poza jego sposobem realizacji pracy'],
      failClosedOn: ['brak aktywnego ticketu dla wieloetapowej zmiany', 'nieznane evidenceRefs', 'sprzeczność równorzędnych źródeł autorytatywnych', 'niepoprawny structured output', 'nieudane testy lub brak wymaganych receiptów']
    },
    modelRouting: {
      policy: input.routing.policy,
      stages: buildModelStages(input.routing, input.modelRegistry)
    },
    evidenceCatalog: input.evidence,
    diagnostics: [...(input.diagnostics ?? []), ...candidateResult.diagnostics]
  };
}
