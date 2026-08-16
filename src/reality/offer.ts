import type { PromptEvent } from '../types.js';
import { normalizeForMatch } from '../util/text.js';

interface OfferPlan {
  plan_id: string;
  canonical_display_name?: string;
  name: string;
  public: boolean;
  amount_monthly_minor: number;
  currency: string;
}

interface OfferCatalog {
  schema: string;
  id: string;
  version: number;
  status: string;
  plans: OfferPlan[];
}

export interface OfferRealityReport {
  schemaVersion: 'subactor.developer-twin.offer-reality/v1';
  sourceOfTruth: { path: string; schema: string; id: string; version: number; status: string };
  currentPlans: Array<{ planId: string; name: string; public: boolean; monthly: number; currency: string }>;
  promptClaims: Array<{
    eventId: string;
    actor: string;
    sourceClass: string;
    sequence: number;
    planId: string;
    claimedMonthly: number;
    currency: string;
    matchesCurrent: boolean;
    excerpt: string;
  }>;
  diagnostics: Array<{ code: string; severity: string; detail: string; eventId?: string; planId?: string }>;
  publication: { allowed: boolean; reasonCodes: string[] };
}

const aliases: Array<{ planId: string; names: string[] }> = [
  { planId: 'saas-start', names: ['Basic'] },
  { planId: 'saas-business', names: ['Operations Plus', 'Actions Plus', 'Pro'] },
  { planId: 'prepaid-actions', names: ['Twin Plus', 'PrePaid', 'Prepaid'] },
  { planId: 'on-premise', names: ['On-Premise', 'On-premise'] }
];

function price(value: string): number {
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  return Number(cleaned);
}

function extractPlanPrice(text: string, names: string[]): number | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const forward = new RegExp(`${escaped}[\\s\\S]{0,900}?(\\d{1,5}(?:[\\s.,]\\d{2})?)\\s*zł`, 'i').exec(text);
    if (forward) return price(forward[1]);
    const backward = new RegExp(`(\\d{1,5}(?:[\\s.,]\\d{2})?)\\s*zł[\\s\\S]{0,250}?${escaped}`, 'i').exec(text);
    if (backward) return price(backward[1]);
  }
  return null;
}

export function reconcileOfferHistory(events: PromptEvent[], catalog: OfferCatalog, catalogPath: string): OfferRealityReport {
  const currentPlans = catalog.plans.map((plan) => ({
    planId: plan.plan_id,
    name: plan.canonical_display_name ?? plan.name,
    public: plan.public,
    monthly: plan.amount_monthly_minor / 100,
    currency: plan.currency
  }));
  const currentById = new Map(currentPlans.map((plan) => [plan.planId, plan]));
  const promptClaims: OfferRealityReport['promptClaims'] = [];
  const diagnostics: OfferRealityReport['diagnostics'] = [];

  for (const event of events) {
    const normalized = normalizeForMatch(event.redactedText);
    if (!normalized.includes('zł') && !normalized.includes('pln') && !normalized.includes('ceny') && !normalized.includes('cennik')) continue;
    for (const alias of aliases) {
      const claimed = extractPlanPrice(event.redactedText, alias.names);
      if (claimed === null || !Number.isFinite(claimed)) continue;
      const current = currentById.get(alias.planId);
      if (!current || current.currency !== 'PLN') continue;
      const matchesCurrent = Math.abs(current.monthly - claimed) < 0.001;
      promptClaims.push({
        eventId: event.id,
        actor: event.actor,
        sourceClass: event.sourceClass,
        sequence: event.sequence,
        planId: alias.planId,
        claimedMonthly: claimed,
        currency: 'PLN',
        matchesCurrent,
        excerpt: event.redactedText.slice(0, 380)
      });
      if (!matchesCurrent) diagnostics.push({
        code: 'PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME',
        severity: event.actor === 'human' ? 'review_required' : 'info',
        detail: `Historia podaje ${claimed.toFixed(2)} PLN dla ${alias.planId}, a wersjonowany HOME v${catalog.version} podaje ${current.monthly.toFixed(2)} PLN.`,
        eventId: event.id,
        planId: alias.planId
      });
    }
  }

  diagnostics.unshift({
    code: 'PROMPT_HISTORY_NOT_OFFER_SSOT',
    severity: 'info',
    detail: 'Historia promptów jest dowodem oczekiwań i korekt, ale bieżące ceny pochodzą wyłącznie z wersjonowanego katalogu HOME.'
  });
  const blocking = diagnostics.filter((item) => item.severity === 'blocking');
  return {
    schemaVersion: 'subactor.developer-twin.offer-reality/v1',
    sourceOfTruth: { path: catalogPath, schema: catalog.schema, id: catalog.id, version: catalog.version, status: catalog.status },
    currentPlans,
    promptClaims,
    diagnostics,
    publication: { allowed: blocking.length === 0, reasonCodes: blocking.map((item) => item.code) }
  };
}

export function renderOfferRealityMarkdown(report: OfferRealityReport): string {
  const lines = [
    '# Offer Reality — historia kontra HOME',
    '',
    `Źródło prawdy: \`${report.sourceOfTruth.path}\` (${report.sourceOfTruth.id} v${report.sourceOfTruth.version}, ${report.sourceOfTruth.status}).`,
    '',
    '## Aktualny katalog',
    '',
    '| Plan | Nazwa | Publiczny | Cena miesięczna |',
    '|---|---|---|---:|',
    ...report.currentPlans.map((plan) => `| \`${plan.planId}\` | ${plan.name} | ${plan.public ? 'tak' : 'nie'} | ${plan.monthly.toFixed(2)} ${plan.currency} |`),
    '',
    '## Claimy znalezione w historii',
    '',
    '| Event | Aktor | Plan | Claim | Zgodny z HOME |',
    '|---|---|---|---:|---|',
    ...report.promptClaims.map((claim) => `| \`${claim.eventId}\` | ${claim.actor} | \`${claim.planId}\` | ${claim.claimedMonthly.toFixed(2)} ${claim.currency} | ${claim.matchesCurrent ? 'tak' : 'nie'} |`),
    '',
    '## Diagnostyki',
    '',
    ...report.diagnostics.map((item) => `- **${item.severity} / ${item.code}:** ${item.detail}`)
  ];
  return `${lines.join('\n')}\n`;
}
