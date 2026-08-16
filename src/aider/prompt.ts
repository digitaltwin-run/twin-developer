import type { DeveloperTwinDsl, Guidelines } from '../types.js';

export function buildAiderMessage(input: {
  task: string;
  twin: DeveloperTwinDsl;
  guidelines: Guidelines;
  projectId: string;
  activeTicket?: string;
}): string {
  const selected = input.twin.rules.filter((rule) => input.guidelines.ruleRefs.includes(rule.id));
  const lines = [
    '# Subactor developer-twin execution context',
    '',
    `Project: ${input.projectId}`,
    `Active ticket: ${input.activeTicket ?? 'MISSING — do not modify source until a ticket is established'}`,
    '',
    '## User task',
    '',
    input.task.trim(),
    '',
    '## Binding execution rules',
    ''
  ];
  for (const rule of selected) {
    lines.push(`### ${rule.id} — ${rule.title}`, rule.description, ...rule.must.map((item) => `- MUST: ${item}`), ...rule.mustNot.map((item) => `- MUST NOT: ${item}`), '');
  }
  lines.push(
    '## Ordered plan',
    '',
    ...input.guidelines.steps.map((step) => `${step.order}. ${step.action} [${step.ruleRefs.join(', ')}]`),
    '',
    '## Safety and completion contract',
    '',
    '- Read the active ticket, existing APIs and current code before editing.',
    '- Treat this file and the DSL as constraints, not evidence that the implementation already exists.',
    '- Never print or commit secrets. Do not edit outside ticket scope.',
    '- Do not commit, push, merge or deploy unless separately authorized.',
    '- After edits, run only the commands listed in the validated guidelines.',
    '- Report exact commands, exit codes, changed files, unresolved unknowns and runtime observations.',
    '- Never claim PASS/DONE from your own narrative; PASS requires command receipts.',
    '',
    'Full validated DSL is available as a read-only context file: data/output/developer-twin.dsl.json.'
  );
  return `${lines.join('\n')}\n`;
}
