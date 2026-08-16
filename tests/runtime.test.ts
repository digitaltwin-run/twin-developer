import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { extractDeterministicRules } from '../src/extract/deterministic.js';
import { ingestFiles } from '../src/ingest/index.js';
import { reconcileOfferHistory } from '../src/reality/offer.js';
import type { LlmRoutingConfig, ModelRegistry, RuleCatalogEntry, SourcePolicy } from '../src/types.js';
import { buildDeveloperTwin } from '../src/twin/aggregate.js';
import { generateDeterministicGuidelines } from '../src/twin/guidelines.js';
import { validateGuidelines, validateTwin } from '../src/twin/validate.js';
import { readJson } from '../src/util/files.js';
import { compileRedactor, loadRedactionConfig } from '../src/util/redaction.js';

const root = resolve('.');

test('histories produce an evidence-grounded policy twin', async () => {
  const [policy, catalogFile, routing, project, offer, modelRegistry] = await Promise.all([
    readJson<SourcePolicy>(resolve(root, 'config/source-policy.json')),
    readJson<{ rules: RuleCatalogEntry[] }>(resolve(root, 'config/rule-catalog.json')),
    readJson<LlmRoutingConfig>(resolve(root, 'config/llm-routing.json')),
    readJson<any>(resolve(root, 'data/context/project.json')),
    readJson<any>(resolve(root, 'data/context/subactor-cloud-v1.offer.json')),
    readJson<ModelRegistry>(resolve(root, 'config/model-registry.json'))
  ]);
  const redact = compileRedactor(await loadRedactionConfig(root));
  const events = await ingestFiles([
    resolve(root, 'data/raw/history-portal.md'),
    resolve(root, 'data/raw/history-cursor.json')
  ], redact);
  assert.ok(events.length >= 40, `expected at least 40 events, got ${events.length}`);
  assert.ok(events.some((event) => event.actor === 'human' && event.isCorrection));
  assert.ok(events.every((event) => !/subactor_usr_live_[A-Za-z0-9_-]+/.test(event.redactedText)));

  const extraction = extractDeterministicRules(events, policy, catalogFile.rules);
  const ids = new Set(extraction.rules.map((rule) => rule.id));
  for (const expected of ['DT-GOV-001', 'DT-TEST-001', 'DT-SSOT-001', 'DT-REALITY-001', 'DT-LLM-001', 'DT-DOCKER-001']) {
    assert.ok(ids.has(expected), `missing ${expected}`);
  }
  assert.equal(extraction.rules.find((rule) => rule.id === 'DT-DOCKER-001')?.status, 'contextual');
  assert.ok(extraction.rules.every((rule) => rule.evidenceRefs.length > 0));

  const twin = buildDeveloperTwin({
    sourcePolicy: policy,
    routing,
    modelRegistry,
    deterministicRules: extraction.rules,
    evidence: extraction.evidence,
    diagnostics: extraction.diagnostics,
    mode: 'deterministic'
  });
  const diagnostics = validateTwin(twin, true);
  assert.ok(!diagnostics.some((item) => item.severity === 'blocking'));
  assert.equal(twin.modelRouting.stages.find((stage) => stage.stage === 'code-editing')?.modelAlias, 'twin-code');
  assert.deepEqual(twin.modelRouting.stages.find((stage) => stage.stage === 'code-editing')?.routeOrder, ['local-private', 'litellm-proxy', 'openrouter-direct']);

  const task = 'Kontynuuj w aktywnym ticket, użyj istniejącego API, dodaj tab w URL i routing LLM, potem restart i TestQL.';
  const guidelines = generateDeterministicGuidelines({ twin, task, project, catalog: catalogFile.rules });
  validateGuidelines(guidelines, twin, ['git status', 'git diff', ...project.validationCommands]);
  assert.ok(guidelines.ruleRefs.includes('DT-LLM-001'));
  assert.ok(guidelines.ruleRefs.includes('DT-TEST-001'));

  const report = reconcileOfferHistory(events, offer, 'data/context/subactor-cloud-v1.offer.json');
  assert.equal(report.currentPlans.find((plan) => plan.planId === 'saas-start')?.monthly, 97);
  assert.equal(report.currentPlans.find((plan) => plan.planId === 'saas-business')?.monthly, 59);
  assert.equal(report.currentPlans.find((plan) => plan.planId === 'on-premise')?.public, false);
  assert.ok(report.diagnostics.some((item) => item.code === 'PROMPT_HISTORY_NOT_OFFER_SSOT'));
});

test('validator rejects an active rule with an unknown evidence reference', async () => {
  const twin = await readJson<any>(resolve(root, 'data/fixtures/minimal-twin.json'));
  twin.rules[0].evidenceRefs = ['evidence:missing'];
  twin.rules[0].supportCount = 1;
  assert.throws(() => validateTwin(twin, true), /DT_RULE_EVIDENCE_MISSING/);
});

test('redakcja pokrywa fixture\'y z HOME wzorców i nie tyka SHA ani prozy', async () => {
  const config = await loadRedactionConfig(root);
  const redact = compileRedactor(config);
  for (const sample of config.fixtures.mustRedact) {
    const output = redact(sample);
    assert.notEqual(output, sample, `nie zredagowano: ${sample.slice(0, 60)}`);
    assert.ok(output.includes('REDACTED'), `brak znacznika: ${sample.slice(0, 60)}`);
  }
  for (const sample of config.fixtures.mustSurvive) {
    assert.equal(redact(sample), sample, `fałszywie dodatni: ${sample.slice(0, 60)}`);
  }
});

test('zdarzenia nie niosą surowego tekstu', async () => {
  const redact = compileRedactor(await loadRedactionConfig(root));
  const events = await ingestFiles([resolve(root, 'data/fixtures/shell-history.txt')], redact);
  for (const event of events) {
    assert.equal((event as unknown as Record<string, unknown>).text, undefined, 'PromptEvent nadal niesie surowy text');
    assert.ok(typeof event.redactedText === 'string' && event.redactedText.length > 0);
  }
});

test('shell history adapter emits accepted-command events', async () => {
  const redact = compileRedactor(await loadRedactionConfig(root));
  const events = await ingestFiles([resolve(root, 'data/fixtures/shell-history.txt')], redact);
  assert.equal(events.length, 3);
  assert.ok(events.every((event) => event.sourceFormat === 'shell-history'));
  assert.ok(events.every((event) => event.sourceClass === 'accepted_command'));
});
