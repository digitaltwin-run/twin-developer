% ── Project Metadata ─────────────────────────────────────
project_metadata('twin-developer', '0.1.0', 'javascript').

% ── Project Files ────────────────────────────────────────
project_file('app.doql.less', 132, 'less').
project_file('llm_service/__init__.py', 4, 'python').
project_file('llm_service/__main__.py', 4, 'python').
project_file('llm_service/app.py', 71, 'python').
project_file('llm_service/audit.py', 47, 'python').
project_file('llm_service/cli.py', 100, 'python').
project_file('llm_service/core.py', 369, 'python').
project_file('llm_service/models.py', 52, 'python').
project_file('project2.sh', 56, 'shell').
project_file('scripts/check-flag-parity.py', 71, 'python').
project_file('scripts/check-schema-identity.py', 102, 'python').
project_file('scripts/llmctl.sh', 6, 'shell').
project_file('scripts/render-litellm-config.py', 81, 'python').
project_file('scripts/run-aider.sh', 38, 'shell').
project_file('scripts/run-fake-llm-demo.sh', 25, 'shell').
project_file('scripts/run-litellm-proxy.sh', 11, 'shell').
project_file('scripts/validate-schema.py', 57, 'python').
project_file('scripts/verify-artifacts.sh', 58, 'shell').
project_file('src/aider/prompt.ts', 46, 'typescript').
project_file('src/cli.ts', 330, 'typescript').
project_file('src/extract/deterministic.ts', 147, 'typescript').
project_file('src/ingest/common.ts', 36, 'typescript').
project_file('src/ingest/cursor.ts', 66, 'typescript').
project_file('src/ingest/index.ts', 33, 'typescript').
project_file('src/ingest/jsonl.ts', 28, 'typescript').
project_file('src/ingest/markdown.ts', 67, 'typescript').
project_file('src/ingest/plain.ts', 23, 'typescript').
project_file('src/ingest/shell.ts', 28, 'typescript').
project_file('src/llm/client.ts', 139, 'typescript').
project_file('src/node-shims.d.ts', 46, 'typescript').
project_file('src/reality/offer.ts', 145, 'typescript').
project_file('src/twin/aggregate.ts', 200, 'typescript').
project_file('src/twin/guidelines.ts', 72, 'typescript').
project_file('src/twin/render.ts', 56, 'typescript').
project_file('src/twin/validate.ts', 137, 'typescript').
project_file('src/types.ts', 233, 'typescript').
project_file('src/util/command.ts', 66, 'typescript').
project_file('src/util/files.ts', 30, 'typescript').
project_file('src/util/hash.ts', 10, 'typescript').
project_file('src/util/text.ts', 48, 'typescript').
project_file('tests/command.test.ts', 105, 'typescript').
project_file('tests/runtime.test.ts', 90, 'typescript').
project_file('tests/test_llm_service.py', 189, 'python').

% ── Python Functions ─────────────────────────────────────
python_function('llm_service/app.py', 'require_token', 1, 4, 5).
python_function('llm_service/app.py', 'healthz', 0, 1, 2).
python_function('llm_service/app.py', 'extract_intents', 1, 2, 8).
python_function('llm_service/app.py', 'generate_guidelines', 1, 2, 8).
python_function('llm_service/app.py', 'chat_completions', 1, 3, 8).
python_function('llm_service/audit.py', '_path', 0, 2, 3).
python_function('llm_service/audit.py', 'audit_ref', 1, 1, 4).
python_function('llm_service/audit.py', 'append_audit', 1, 3, 9).
python_function('llm_service/cli.py', '_guard_bind', 1, 4, 4).
python_function('llm_service/cli.py', '_read', 1, 3, 4).
python_function('llm_service/cli.py', '_write', 2, 3, 5).
python_function('llm_service/cli.py', 'parser', 0, 2, 4).
python_function('llm_service/cli.py', 'main', 1, 11, 14).
python_function('llm_service/core.py', '_sha', 1, 1, 4).
python_function('llm_service/core.py', '_root', 0, 1, 2).
python_function('llm_service/core.py', '_routing', 0, 1, 3).
python_function('llm_service/core.py', 'flag_enabled', 2, 4, 4).
python_function('llm_service/core.py', '_route_enabled', 1, 5, 6).
python_function('llm_service/core.py', '_registry', 0, 1, 3).
python_function('llm_service/core.py', '_stage_entry', 1, 3, 4).
python_function('llm_service/core.py', '_schema', 1, 1, 3).
python_function('llm_service/core.py', '_prefixed', 2, 5, 1).
python_function('llm_service/core.py', 'resolve_route', 2, 11, 9).
python_function('llm_service/core.py', '_fake_intents', 1, 6, 3).
python_function('llm_service/core.py', '_fake_guidelines', 1, 2, 6).
python_function('llm_service/core.py', '_extract_text', 1, 6, 4).
python_function('llm_service/core.py', '_real_structured', 4, 7, 14).
python_function('llm_service/core.py', 'fake_mode', 0, 1, 1).
python_function('llm_service/core.py', '_provenance', 2, 4, 3).
python_function('llm_service/core.py', '_run_stage', 5, 3, 8).
python_function('llm_service/core.py', 'complete_intents', 1, 1, 1).
python_function('llm_service/core.py', 'complete_guidelines', 1, 1, 1).
python_function('llm_service/core.py', 'complete_chat', 4, 9, 11).
python_function('llm_service/core.py', 'health', 0, 5, 7).
python_function('scripts/check-flag-parity.py', 'routing_flags', 0, 3, 4).
python_function('scripts/check-flag-parity.py', 'env_example_values', 0, 5, 5).
python_function('scripts/check-flag-parity.py', 'main', 0, 11, 12).
python_function('scripts/check-schema-identity.py', 'walk', 2, 7, 4).
python_function('scripts/check-schema-identity.py', 'owned', 1, 2, 1).
python_function('scripts/check-schema-identity.py', 'main', 0, 11, 14).
python_function('scripts/render-litellm-config.py', 'litellm_openrouter_model', 1, 2, 1).
python_function('scripts/render-litellm-config.py', 'render', 1, 4, 8).
python_function('scripts/render-litellm-config.py', 'main', 0, 5, 14).
python_function('scripts/validate-schema.py', 'validate', 2, 4, 12).
python_function('scripts/validate-schema.py', 'validate_tickets', 0, 2, 5).

% ── Python Classes ───────────────────────────────────────
python_class('llm_service/core.py', 'LlmConfigurationError').
python_class('llm_service/core.py', 'LlmResponseError').
python_class('llm_service/core.py', 'Route').
python_class('llm_service/core.py', 'Provenance').
python_method('Provenance', 'headers', 0, 2, 0).
python_class('llm_service/models.py', 'StrictModel').
python_class('llm_service/models.py', 'EventInput').
python_class('llm_service/models.py', 'EvidenceInput').
python_class('llm_service/models.py', 'IntentRequest').
python_class('llm_service/models.py', 'GuidelinesRequest').
python_class('llm_service/models.py', 'ChatMessage').
python_class('llm_service/models.py', 'ChatRequest').
python_class('tests/test_llm_service.py', 'FakeLlmServiceTest').
python_method('FakeLlmServiceTest', 'setUp', 0, 1, 4).
python_method('FakeLlmServiceTest', 'tearDown', 0, 3, 2).
python_method('FakeLlmServiceTest', 'test_fake_intent_and_guidelines_are_structured', 0, 1, 7).
python_method('FakeLlmServiceTest', 'test_fixture_provenance_is_recorded_and_distinguishable', 0, 5, 11).
python_method('FakeLlmServiceTest', 'test_fake_chat_and_health', 0, 1, 5).
python_method('FakeLlmServiceTest', 'test_route_priority_and_registry_aliases', 0, 1, 3).
python_class('tests/test_llm_service.py', 'FailClosedRoutingTest').
python_method('FailClosedRoutingTest', 'test_empty_environment_refuses_to_route', 0, 1, 3).
python_method('FailClosedRoutingTest', 'test_provider_key_alone_does_not_enable_route', 0, 1, 3).
python_method('FailClosedRoutingTest', 'test_local_endpoint_alone_does_not_enable_route', 0, 1, 3).
python_method('FailClosedRoutingTest', 'test_flag_parsing_is_strict', 0, 2, 5).
python_class('tests/test_llm_service.py', 'BindGuardTest').
python_method('BindGuardTest', 'test_loopback_is_allowed_without_token', 0, 2, 2).
python_method('BindGuardTest', 'test_remote_bind_requires_opt_in', 0, 1, 3).
python_method('BindGuardTest', 'test_remote_bind_requires_token', 0, 1, 3).
python_method('BindGuardTest', 'test_remote_bind_with_opt_in_and_token', 0, 1, 2).
python_class('tests/test_llm_service.py', 'AuditPathTest').
python_method('AuditPathTest', 'test_relative_path_is_project_rooted', 0, 1, 7).

% ── Dependencies ─────────────────────────────────────────
project_dependency('fastapi>=0.115,<1', 'requirements.txt').
project_dependency('uvicorn>=0.30,<1', 'requirements.txt').
project_dependency('pydantic>=2.8,<3', 'requirements.txt').
project_dependency('litellm[proxy]>=1.60,<2', 'requirements.txt').
project_dependency('jsonschema>=4.23,<5', 'requirements.txt').

% ── Makefile Targets ─────────────────────────────────────
makefile_target('SHELL', '').
makefile_target('help', '').
makefile_target('setup', '').
makefile_target('build', '').
makefile_target('demo', '').
makefile_target('validate', '').
makefile_target('verify-artifacts', '').
makefile_target('test-ts', '').
makefile_target('test-py', '').
makefile_target('test', '').
makefile_target('guidelines', '').
makefile_target('reality', '').
makefile_target('aider-context', '').
makefile_target('llm-health', '').
makefile_target('llm-api', '').
makefile_target('llm-fake-demo', '').
makefile_target('litellm-proxy', '').
makefile_target('aider', '').
makefile_target('clean', '').

% ── Taskfile Tasks ───────────────────────────────────────

% ── Environment Variables ────────────────────────────────
env_variable('TWIN_LLM_URL', 'http://127.0.0.1:8099', 'TypeScript -> local Python gateway').
env_variable('TWIN_LLM_AUDIT_PATH', 'data/output/llm-audit.jsonl', '').
env_variable('TWIN_LLM_EVENT_WINDOW', '160', 'Przekroczenie zgłasza diagnostykę DT_LLM_INPUT_TRUNCATED.').
env_variable('TWIN_API_TOKEN', '*(not set)*', 'endpointach poza /healthz. Bind spoza loopbacku wymaga obu zmiennych.').
env_variable('TWIN_ALLOW_REMOTE', 'false', '').
env_variable('LITELLM_PROXY_URL', 'http://127.0.0.1:4000/v1', 'Option A: central LiteLLM proxy (preferred for shared policy/routing)').
env_variable('LITELLM_MASTER_KEY', 'change-me', '').
env_variable('OPENROUTER_API_KEY', '*(not set)*', 'LiteLLM proxy -> OpenRouter').
env_variable('OPENROUTER_INTENT_MODEL', 'openrouter/auto', '').
env_variable('OPENROUTER_GUIDELINES_MODEL', 'openrouter/auto', '').
env_variable('OPENROUTER_CODE_MODEL', 'openrouter/auto', '').
env_variable('OPENROUTER_VALIDATION_MODEL', 'openrouter/auto', '').
env_variable('LOCAL_LLM_API_BASE', '*(not set)*', 'Option B: private OpenAI-compatible endpoint (Ollama/vLLM/LM Studio/custom proxy)').
env_variable('LOCAL_LLM_MODEL', '*(not set)*', '').
env_variable('LOCAL_LLM_API_KEY', 'local-not-required', '').
env_variable('LOCAL_LLM_ENABLED', 'false', 'Routing switches used by the DSL metadata').
env_variable('LITELLM_PROXY_ENABLED', 'true', '').
env_variable('OPENROUTER_DIRECT_ENABLED', 'false', '').
env_variable('AIDER_MODEL', 'openai/twin-code', 'Aider defaults to the same LiteLLM alias as the developer-twin router').
env_variable('AIDER_APPLY', '0', '').

% ── TestQL Scenarios ─────────────────────────────────────
testql_scenario('generated-from-pytests.testql.toon.yaml', 'integration').

% ── Semantic Facts from SUMD.md ──────────────────────────
sumd_declared_file('app.doql.less', 'doql').
sumd_declared_file('testql-scenarios/generated-from-pytests.testql.toon.yaml', 'testql').
sumd_declared_file('project/map.toon.yaml', 'analysis').
sumd_declared_file('project/logic.pl', 'analysis').
sumd_declared_file('project/calls.toon.yaml', 'analysis').
sumd_interface('api', '').
sumd_workflow('setup', 'manual').
sumd_workflow_step('setup', 1, '$(NPM) install').
sumd_workflow_step('setup', 2, '$(PYTHON) -m venv .venv').
sumd_workflow_step('setup', 3, '.venv/bin/python -m pip install --upgrade pip').
sumd_workflow_step('setup', 4, '.venv/bin/python -m pip install -r requirements.txt').
sumd_workflow('build', 'manual').
sumd_workflow_step('build', 1, '$(PYTHON) scripts/render-litellm-config.py --check').
sumd_workflow_step('build', 2, '$(NPM) run build').
sumd_workflow('demo', 'manual').
sumd_workflow_step('demo', 1, 'TWIN_NOW=2026-08-16T12:00:00Z $(NODE) dist/src/cli.js demo --mode deterministic').
sumd_workflow('validate', 'manual').
sumd_workflow_step('validate', 1, '$(NODE) dist/src/cli.js validate').
sumd_workflow_step('validate', 2, '$(PYTHON) scripts/validate-schema.py').
sumd_workflow_step('validate', 3, '$(PYTHON) scripts/check-schema-identity.py').
sumd_workflow_step('validate', 4, '$(PYTHON) scripts/check-flag-parity.py').
sumd_workflow_step('validate', 5, '$(MAKE) verify-artifacts').
sumd_workflow('verify-artifacts', 'manual').
sumd_workflow_step('verify-artifacts', 1, 'scripts/verify-artifacts.sh').
sumd_workflow('test-ts', 'manual').
sumd_workflow_step('test-ts', 1, '$(NODE) --test dist/tests/*.test.js').
sumd_workflow('test-py', 'manual').
sumd_workflow_step('test-py', 1, '$(PYTHON) -m unittest discover -s tests -p \'test_*.py\'').
sumd_workflow('test', 'manual').
sumd_workflow('guidelines', 'manual').
sumd_workflow_step('guidelines', 1, '$(NODE) dist/src/cli.js guidelines --mode deterministic').
sumd_workflow('reality', 'manual').
sumd_workflow_step('reality', 1, '$(NODE) dist/src/cli.js reality-offer').
sumd_workflow('aider-context', 'manual').
sumd_workflow_step('aider-context', 1, '$(NODE) dist/src/cli.js aider-context').
sumd_workflow('llm-health', 'manual').
sumd_workflow_step('llm-health', 1, '$(PYTHON) -m llm_service.cli health').
sumd_workflow('llm-api', 'manual').
sumd_workflow_step('llm-api', 1, '$(PYTHON) -m llm_service.cli serve --host 127.0.0.1 --port $(TWIN_LLM_PORT)').
sumd_workflow('llm-fake-demo', 'manual').
sumd_workflow_step('llm-fake-demo', 1, 'TWIN_LLM_PORT=$(TWIN_LLM_PORT) scripts/run-fake-llm-demo.sh').
sumd_workflow('litellm-proxy', 'manual').
sumd_workflow_step('litellm-proxy', 1, 'scripts/run-litellm-proxy.sh').
sumd_workflow('aider', 'manual').
sumd_workflow_step('aider', 1, 'scripts/run-aider.sh $(AIDER_ARGS)').
sumd_workflow('clean', 'manual').
sumd_workflow_step('clean', 1, 'rm -rf dist __pycache__ llm_service/__pycache__ tests/__pycache__').
sumd_workflow_step('clean', 2, 'rm -f data/output/*.json data/output/*.md data/output/*.jsonl data/output/*.log data/output/*.yaml').
sumd_workflow_step('clean', 3, 'rm -f data/normalized/*.json data/normalized/*.jsonl').

