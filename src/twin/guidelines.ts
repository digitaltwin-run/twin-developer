import type { DeveloperTwinDsl, Guidelines, RuleCatalogEntry, TwinRule } from '../types.js';
import { normalizeForMatch, uniqueStrings } from '../util/text.js';

export interface ProjectContext {
  schemaVersion: string;
  projectId: string;
  activeTicket?: string;
  validationCommands?: string[];
  truthOwners?: Array<{ concern: string; home: string; role: string }>;
  productionConstraints?: string[];
}

const preferredOrder = ['DT-GOV-001', 'DT-REALITY-001', 'DT-SSOT-001', 'DT-REUSE-001', 'DT-UX-001', 'DT-LLM-001', 'DT-PROD-001', 'DT-DOCKER-001', 'DT-CONTINUE-001', 'DT-TEST-001'];

function selectRules(twin: DeveloperTwinDsl, task: string, catalog: RuleCatalogEntry[]): TwinRule[] {
  const normalized = normalizeForMatch(task);
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const selected = twin.rules.filter((rule) => {
    if (rule.status === 'candidate' || rule.status === 'superseded') return false;
    const entry = catalogById.get(rule.id);
    const needles = entry?.matchAny ?? [rule.title, rule.description, ...rule.triggers];
    return needles.some((needle) => normalized.includes(normalizeForMatch(needle)));
  });
  const fallback = selected.length > 0 ? selected : twin.rules.filter((rule) => rule.status === 'active').sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  return fallback.sort((a, b) => {
    const left = preferredOrder.indexOf(a.id);
    const right = preferredOrder.indexOf(b.id);
    return (left === -1 ? 999 : left) - (right === -1 ? 999 : right);
  });
}

export function generateDeterministicGuidelines(input: {
  twin: DeveloperTwinDsl;
  task: string;
  project: ProjectContext;
  catalog: RuleCatalogEntry[];
}): Guidelines {
  const rules = selectRules(input.twin, input.task, input.catalog);
  const validationCommands = input.project.validationCommands ?? [];
  const steps: Guidelines['steps'] = [];
  let order = 1;

  for (const rule of rules) {
    const commands = rule.id === 'DT-TEST-001' ? validationCommands : undefined;
    steps.push({
      order: order++,
      action: rule.must[0] ?? rule.title,
      reason: rule.description,
      ruleRefs: [rule.id],
      ...(commands && commands.length ? { commands } : {})
    });
  }

  const ruleRefs = uniqueStrings(rules.map((rule) => rule.id));
  const unknowns = [
    'Historia promptów nie dowodzi bieżącego stanu kodu, środowiska ani wdrożenia; trzeba je obserwować w repozytorium docelowym.',
    `Aktywny ticket deklarowany przez kontekst: ${input.project.activeTicket ?? 'brak — wieloetapowa zmiana ma zostać zablokowana'}.`
  ];
  return {
    schemaVersion: 'subactor.developer-twin.guidelines/v1',
    summary: `Wykonaj zadanie w ${steps.length} etapach, stosując reguły developer twin jako ograniczenia i wymagając dowodów po zmianie.`,
    steps,
    gates: [
      ...input.twin.autonomy.failClosedOn,
      'Nie promuj kandydatów LLM do active bez jawnej decyzji w ticket/intent.',
      'Nie uznawaj outputu Aider ani opisu agenta za receipt testowy.'
    ],
    unknowns,
    ruleRefs
  };
}
