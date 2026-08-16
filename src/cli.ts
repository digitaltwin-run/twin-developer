#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { buildAiderMessage } from './aider/prompt.js';
import { extractDeterministicRules } from './extract/deterministic.js';
import { ingestFiles } from './ingest/index.js';
import { extractIntentCandidatesWithLlm, generateGuidelinesWithLlm, serviceHealth } from './llm/client.js';
import { reconcileOfferHistory, renderOfferRealityMarkdown } from './reality/offer.js';
import type {
  DeveloperTwinDsl,
  Guidelines,
  LlmRoutingConfig,
  ModelRegistry,
  PromptEvent,
  RuleCatalogEntry,
  SourcePolicy
} from './types.js';
import { buildDeveloperTwin } from './twin/aggregate.js';
import { generateDeterministicGuidelines, type ProjectContext } from './twin/guidelines.js';
import { renderGuidelinesMarkdown, renderTwinMarkdown } from './twin/render.js';
import { validateGuidelines, validateIntentCandidates, validateTwin } from './twin/validate.js';
import { nowIso, readJson, writeJson, writeText } from './util/files.js';
import { sha256 } from './util/hash.js';

interface RuleCatalogFile { rules: RuleCatalogEntry[] }
interface OfferCatalog {
  schema: string;
  id: string;
  version: number;
  status: string;
  plans: Array<{ plan_id: string; canonical_display_name?: string; name: string; public: boolean; amount_monthly_minor: number; currency: string }>;
}

type Mode = 'deterministic' | 'prefer-llm' | 'require-llm';

function flag(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function flags(name: string): string[] {
  const output: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) output.push(process.argv[index + 1]);
  }
  return output;
}

function rootPath(): string {
  return resolve(flag('--root', '.') ?? '.');
}

function rel(root: string, path: string): string {
  return relative(root, path).replace(/\\/g, '/');
}

function modeFromArgs(): Mode {
  const mode = flag('--mode', 'deterministic');
  if (!['deterministic', 'prefer-llm', 'require-llm'].includes(String(mode))) throw new Error(`Invalid --mode: ${mode}`);
  return mode as Mode;
}

function defaultInputPaths(root: string): string[] {
  const provided = flags('--input');
  const values = provided.length ? provided.flatMap((value) => value.split(',').map((item) => item.trim()).filter(Boolean)) : [
    'data/raw/history-portal.md',
    'data/raw/history-cursor.json'
  ];
  return values.map((value) => resolve(root, value));
}

async function readEventsJsonl(path: string): Promise<PromptEvent[]> {
  const text = await readFile(path, 'utf8');
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as PromptEvent);
}

async function writeEventsJsonl(path: string, events: PromptEvent[]): Promise<void> {
  await writeText(path, events.map((event) => JSON.stringify(event)).join('\n'));
}

async function loadCore(root: string): Promise<{
  sourcePolicy: SourcePolicy;
  catalog: RuleCatalogEntry[];
  routing: LlmRoutingConfig;
  project: ProjectContext;
  modelRegistry: ModelRegistry;
}> {
  const [sourcePolicy, catalogFile, routing, project, modelRegistry] = await Promise.all([
    readJson<SourcePolicy>(resolve(root, 'config/source-policy.json')),
    readJson<RuleCatalogFile>(resolve(root, 'config/rule-catalog.json')),
    readJson<LlmRoutingConfig>(resolve(root, 'config/llm-routing.json')),
    readJson<ProjectContext>(resolve(root, 'data/context/project.json')),
    readJson<ModelRegistry>(resolve(root, 'config/model-registry.json'))
  ]);
  return { sourcePolicy, catalog: catalogFile.rules, routing, project, modelRegistry };
}

export async function buildArtifacts(options: { root: string; mode: Mode; llmUrl: string }): Promise<{ twin: DeveloperTwinDsl; events: PromptEvent[] }> {
  const { root, mode, llmUrl } = options;
  const { sourcePolicy, catalog, routing, modelRegistry } = await loadCore(root);
  const absoluteInputs = defaultInputPaths(root);
  const rawEvents = await ingestFiles(absoluteInputs);
  const events = rawEvents.map((event) => ({ ...event, sourceFile: rel(root, resolve(event.sourceFile)) }));
  const sourceManifest = {
    schemaVersion: 'subactor.developer-twin.source-manifest/v1',
    generatedAt: nowIso(),
    sources: await Promise.all(absoluteInputs.map(async (path) => {
      const content = await readFile(path, 'utf8');
      const sourceFile = rel(root, path);
      return {
        sourceFile,
        contentHash: sha256(content),
        byteLength: new TextEncoder().encode(content).byteLength,
        eventCount: events.filter((event) => event.sourceFile === sourceFile).length,
        sourceFormats: [...new Set(events.filter((event) => event.sourceFile === sourceFile).map((event) => event.sourceFormat))]
      };
    }))
  };
  const extraction = extractDeterministicRules(events, sourcePolicy, catalog);
  let llmCandidates = undefined;
  let llmUsed = false;
  let degraded = false;
  const diagnostics = [...extraction.diagnostics];

  if (mode !== 'deterministic') {
    try {
      await serviceHealth(llmUrl);
      const raw = await extractIntentCandidatesWithLlm({
        baseUrl: llmUrl,
        events,
        evidence: extraction.evidence,
        existingRuleIds: extraction.rules.map((rule) => rule.id)
      });
      llmCandidates = validateIntentCandidates(raw, new Set(extraction.evidence.map((item) => item.id))).candidates;
      llmUsed = true;
    } catch (error) {
      if (mode === 'require-llm') throw error;
      degraded = true;
      diagnostics.push({
        code: 'DT_LLM_DEGRADED_TO_DETERMINISTIC',
        severity: 'warning',
        message: `LLM niedostępny lub odrzucony; użyto deterministycznego wyniku: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  } else {
    diagnostics.push({ code: 'DT_LLM_DISABLED', severity: 'info', message: 'Ekstrakcję wykonano deterministycznie; LLM nie był wywoływany.' });
  }

  const twin = buildDeveloperTwin({
    sourcePolicy,
    routing,
    modelRegistry,
    deterministicRules: extraction.rules,
    evidence: extraction.evidence,
    diagnostics,
    llmCandidates,
    mode,
    llmUsed,
    degraded
  });
  validateTwin(twin, true);

  await writeJson(resolve(root, 'data/normalized/source-manifest.json'), sourceManifest);
  await writeEventsJsonl(resolve(root, 'data/normalized/events.jsonl'), events);
  await writeJson(resolve(root, 'data/normalized/extraction-map.json'), extraction.matchesByRule);
  await writeJson(resolve(root, 'data/output/developer-twin.dsl.json'), twin);
  await writeText(resolve(root, 'data/output/developer-twin.md'), renderTwinMarkdown(twin));
  return { twin, events };
}

export async function buildGuidelineArtifacts(options: { root: string; mode: Mode; llmUrl: string }): Promise<Guidelines> {
  const { root, mode, llmUrl } = options;
  const { catalog, project } = await loadCore(root);
  const twin = await readJson<DeveloperTwinDsl>(resolve(root, 'data/output/developer-twin.dsl.json'));
  validateTwin(twin, true);
  const task = await readFile(resolve(root, flag('--task', 'data/context/example-task.md') ?? 'data/context/example-task.md'), 'utf8');
  const deterministic = generateDeterministicGuidelines({ twin, task, project, catalog });
  const allowedCommands = ['git status', 'git diff', ...(project.validationCommands ?? [])];
  let guidelines = deterministic;
  let audit: Record<string, unknown> = { requestedMode: mode, effectiveMode: 'deterministic', degraded: false, reason: null };

  if (mode !== 'deterministic') {
    try {
      const raw = await generateGuidelinesWithLlm({ baseUrl: llmUrl, task, twin, deterministic, allowedCommands });
      guidelines = validateGuidelines(raw, twin, allowedCommands);
      audit = { requestedMode: mode, effectiveMode: 'llm', degraded: false, reason: null };
    } catch (error) {
      if (mode === 'require-llm') throw error;
      audit = { requestedMode: mode, effectiveMode: 'deterministic', degraded: true, reason: error instanceof Error ? error.message : String(error) };
    }
  }

  validateGuidelines(guidelines, twin, allowedCommands);
  await writeJson(resolve(root, 'data/output/guidelines.json'), guidelines);
  await writeText(resolve(root, 'data/output/guidelines.md'), renderGuidelinesMarkdown(guidelines));
  await writeJson(resolve(root, 'data/output/guidelines.audit.json'), audit);
  return guidelines;
}

export async function buildOfferRealityArtifacts(root: string): Promise<void> {
  const eventsPath = resolve(root, 'data/normalized/events.jsonl');
  const events = await readEventsJsonl(eventsPath);
  const catalogPath = 'data/context/subactor-cloud-v1.offer.json';
  const catalog = await readJson<OfferCatalog>(resolve(root, catalogPath));
  const report = reconcileOfferHistory(events, catalog, catalogPath);
  await writeJson(resolve(root, 'data/output/offer-reality.json'), report);
  await writeText(resolve(root, 'data/output/offer-reality.md'), renderOfferRealityMarkdown(report));
}

export async function buildAiderArtifacts(root: string): Promise<void> {
  const twin = await readJson<DeveloperTwinDsl>(resolve(root, 'data/output/developer-twin.dsl.json'));
  const guidelines = await readJson<Guidelines>(resolve(root, 'data/output/guidelines.json'));
  const project = await readJson<ProjectContext>(resolve(root, 'data/context/project.json'));
  const task = await readFile(resolve(root, flag('--task', 'data/context/example-task.md') ?? 'data/context/example-task.md'), 'utf8');
  validateTwin(twin, true);
  validateGuidelines(guidelines, twin, ['git status', 'git diff', ...(project.validationCommands ?? [])]);
  await writeText(resolve(root, 'data/output/aider-message.md'), buildAiderMessage({
    task,
    twin,
    guidelines,
    projectId: project.projectId,
    activeTicket: project.activeTicket
  }));
}

async function commandBuild(): Promise<void> {
  const root = rootPath();
  const mode = modeFromArgs();
  const llmUrl = flag('--llm-url', process.env.TWIN_LLM_URL ?? 'http://127.0.0.1:8099') ?? 'http://127.0.0.1:8099';
  const result = await buildArtifacts({ root, mode, llmUrl });
  console.log(JSON.stringify({ ok: true, command: 'build', events: result.events.length, rules: result.twin.rules.length, evidence: result.twin.evidenceCatalog.length, mode: result.twin.generator.mode, llmUsed: result.twin.generator.llmUsed, degraded: result.twin.generator.degraded }, null, 2));
}

async function commandValidate(): Promise<void> {
  const root = rootPath();
  const path = resolve(root, flag('--dsl', 'data/output/developer-twin.dsl.json') ?? 'data/output/developer-twin.dsl.json');
  const twin = await readJson<DeveloperTwinDsl>(path);
  const diagnostics = validateTwin(twin, true);
  console.log(JSON.stringify({ ok: true, command: 'validate', rules: twin.rules.length, evidence: twin.evidenceCatalog.length, diagnostics: diagnostics.length }, null, 2));
}

async function commandGuidelines(): Promise<void> {
  const root = rootPath();
  const mode = modeFromArgs();
  const llmUrl = flag('--llm-url', process.env.TWIN_LLM_URL ?? 'http://127.0.0.1:8099') ?? 'http://127.0.0.1:8099';
  const result = await buildGuidelineArtifacts({ root, mode, llmUrl });
  console.log(JSON.stringify({ ok: true, command: 'guidelines', steps: result.steps.length, rules: result.ruleRefs.length, mode }, null, 2));
}

async function commandReality(): Promise<void> {
  const root = rootPath();
  await buildOfferRealityArtifacts(root);
  console.log(JSON.stringify({ ok: true, command: 'reality-offer', output: 'data/output/offer-reality.json' }, null, 2));
}

async function commandAider(): Promise<void> {
  const root = rootPath();
  await buildAiderArtifacts(root);
  console.log(JSON.stringify({ ok: true, command: 'aider-context', output: 'data/output/aider-message.md' }, null, 2));
}

async function commandDemo(): Promise<void> {
  const root = rootPath();
  const mode = modeFromArgs();
  const llmUrl = flag('--llm-url', process.env.TWIN_LLM_URL ?? 'http://127.0.0.1:8099') ?? 'http://127.0.0.1:8099';
  const { twin, events } = await buildArtifacts({ root, mode, llmUrl });
  const guidelines = await buildGuidelineArtifacts({ root, mode, llmUrl });
  await buildOfferRealityArtifacts(root);
  await buildAiderArtifacts(root);
  console.log(JSON.stringify({
    ok: true,
    command: 'demo',
    events: events.length,
    deterministicRules: twin.rules.filter((rule) => rule.status !== 'candidate').length,
    candidateRules: twin.rules.filter((rule) => rule.status === 'candidate').length,
    guidelineSteps: guidelines.steps.length,
    llmUsed: twin.generator.llmUsed,
    degraded: twin.generator.degraded,
    outputs: ['data/output/developer-twin.dsl.json', 'data/output/developer-twin.md', 'data/output/guidelines.json', 'data/output/offer-reality.json', 'data/output/aider-message.md']
  }, null, 2));
}

function usage(): string {
  return `developer-twin commands:\n  build [--mode deterministic|prefer-llm|require-llm] [--input path]\n  validate [--dsl path]\n  guidelines [--task path] [--mode ...]\n  reality-offer\n  aider-context [--task path]\n  demo [--mode ...]\n`;
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === 'build') return commandBuild();
  if (command === 'validate') return commandValidate();
  if (command === 'guidelines') return commandGuidelines();
  if (command === 'reality-offer') return commandReality();
  if (command === 'aider-context') return commandAider();
  if (command === 'demo') return commandDemo();
  console.error(usage());
  process.exitCode = command ? 2 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
