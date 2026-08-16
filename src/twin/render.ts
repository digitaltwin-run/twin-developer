import type { DeveloperTwinDsl, Guidelines } from '../types.js';

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function renderTwinMarkdown(twin: DeveloperTwinDsl): string {
  const lines: string[] = [
    '# Developer Digital Twin — execution policy',
    '',
    `- ID: \`${twin.twin.id}\``,
    `- Wygenerowano: ${twin.generatedAt}`,
    `- Tryb: \`${twin.generator.mode}\`, LLM: ${twin.generator.llmUsed ? 'tak' : 'nie'}, degraded: ${twin.generator.degraded ? 'tak' : 'nie'}`,
    `- Cel: ${twin.twin.purpose}`,
    '',
    '## Granica modelu',
    '',
    'To jest bliźniak **polityki wykonawczej**, a nie klon osobowości ani tożsamości człowieka. Historia promptów opisuje preferencje i korekty; stan kodu i produkcji pochodzi z osobnego rankingu Project Reality.',
    '',
    '## Rankingi źródeł',
    ''
  ];
  for (const [name, domain] of Object.entries(twin.sourcePolicy.truthDomains)) {
    lines.push(`### ${name}`, '', domain.description, '', '| Źródło | Waga |', '|---|---:|');
    for (const row of domain.ranking) lines.push(`| \`${row.sourceClass}\` | ${row.weight} |`);
    lines.push('');
  }
  lines.push('## Reguły', '', '| ID | Status | Zakres | Confidence | Wsparcie | Tytuł |', '|---|---|---|---:|---:|---|');
  for (const rule of twin.rules) {
    lines.push(`| \`${rule.id}\` | ${rule.status} | ${rule.scope} | ${rule.confidence.toFixed(3)} | ${rule.supportCount} | ${escapeCell(rule.title)} |`);
  }
  for (const rule of twin.rules) {
    lines.push('', `### ${rule.id} — ${rule.title}`, '', rule.description, '');
    if (rule.must.length) lines.push('**MUST**', ...rule.must.map((item) => `- ${item}`), '');
    if (rule.should.length) lines.push('**SHOULD**', ...rule.should.map((item) => `- ${item}`), '');
    if (rule.mustNot.length) lines.push('**MUST NOT**', ...rule.mustNot.map((item) => `- ${item}`), '');
    lines.push(`Dowody: ${rule.evidenceRefs.map((ref) => `\`${ref}\``).join(', ')}`);
  }
  lines.push('', '## Workflow', '');
  for (const step of twin.workflow) lines.push(`${step.order}. **${step.name}** — ${step.actions.join(' ')}`);
  lines.push('', '## Diagnostyki', '');
  for (const item of twin.diagnostics) lines.push(`- **${item.severity} / ${item.code}:** ${item.message}`);
  return `${lines.join('\n')}\n`;
}

export function renderGuidelinesMarkdown(guidelines: Guidelines): string {
  const lines = ['# Wytyczne wykonawcze', '', guidelines.summary, '', '## Kroki', ''];
  for (const step of guidelines.steps) {
    lines.push(`${step.order}. **${step.action}**`, `   - Powód: ${step.reason}`, `   - Reguły: ${step.ruleRefs.map((ref) => `\`${ref}\``).join(', ')}`);
    for (const command of step.commands ?? []) lines.push(`   - Komenda: \`${command}\``);
  }
  lines.push('', '## Bramki', '', ...guidelines.gates.map((item) => `- ${item}`));
  lines.push('', '## Niewiadome', '', ...(guidelines.unknowns.length ? guidelines.unknowns.map((item) => `- ${item}`) : ['- Brak zgłoszonych niewiadomych.']));
  return `${lines.join('\n')}\n`;
}
