# Subactor Developer Digital Twin

SUMD - Structured Unified Markdown Descriptor for AI-aware project refactorization

## Contents

- [Metadata](#metadata)
- [Architecture](#architecture)
- [Workflows](#workflows)
- [Call Graph](#call-graph)
- [Test Contracts](#test-contracts)
- [Refactoring Analysis](#refactoring-analysis)
- [Intent](#intent)

## Metadata

- **name**: `twin-developer`
- **version**: `0.0.0`
- **ecosystem**: SUMD + DOQL + testql + taskfile
- **generated_from**: requirements.txt, Makefile, testql(1), app.doql.less, .env.example, package.json, project/(5 analysis files)

## Architecture

```
SUMD (description) → DOQL/source (code) → taskfile (automation) → testql (verification)
```

### DOQL Application Declaration (`app.doql.less`)

```less markpact:doql path=app.doql.less
// LESS format — define @variables here as needed

app {
  name: twin-developer;
  version: 0.1.0;
}

entity[name="StrictModel"] {

}

interface[type="api"] {
  type: rest;
  framework: fastapi;
}

workflow[name="setup"] {
  trigger: manual;
  step-1: run cmd=$(NPM) install;
  step-2: run cmd=$(PYTHON) -m venv .venv;
  step-3: run cmd=.venv/bin/python -m pip install --upgrade pip;
  step-4: run cmd=.venv/bin/python -m pip install -r requirements.txt;
}

workflow[name="build"] {
  trigger: manual;
  step-1: run cmd=$(PYTHON) scripts/render-litellm-config.py --check;
  step-2: run cmd=$(NPM) run build;
}

workflow[name="demo"] {
  trigger: manual;
  step-1: run cmd=TWIN_NOW=2026-08-16T12:00:00Z $(NODE) dist/src/cli.js demo --mode deterministic;
}

workflow[name="validate"] {
  trigger: manual;
  step-1: run cmd=$(NODE) dist/src/cli.js validate;
  step-2: run cmd=$(PYTHON) scripts/validate-schema.py;
  step-3: run cmd=$(PYTHON) scripts/check-schema-identity.py;
  step-4: run cmd=$(PYTHON) scripts/check-flag-parity.py;
  step-5: run cmd=$(MAKE) verify-artifacts;
}

workflow[name="verify-artifacts"] {
  trigger: manual;
  step-1: run cmd=scripts/verify-artifacts.sh;
}

workflow[name="test-ts"] {
  trigger: manual;
  step-1: run cmd=$(NODE) --test dist/tests/*.test.js;
}

workflow[name="test-py"] {
  trigger: manual;
  step-1: run cmd=$(PYTHON) -m unittest discover -s tests -p 'test_*.py';
}

workflow[name="test"] {
  trigger: manual;
  step-1: depend target=test-ts;
  step-2: depend target=test-py;
}

workflow[name="guidelines"] {
  trigger: manual;
  step-1: run cmd=$(NODE) dist/src/cli.js guidelines --mode deterministic;
}

workflow[name="reality"] {
  trigger: manual;
  step-1: run cmd=$(NODE) dist/src/cli.js reality-offer;
}

workflow[name="aider-context"] {
  trigger: manual;
  step-1: run cmd=$(NODE) dist/src/cli.js aider-context;
}

workflow[name="llm-health"] {
  trigger: manual;
  step-1: run cmd=$(PYTHON) -m llm_service.cli health;
}

workflow[name="llm-api"] {
  trigger: manual;
  step-1: run cmd=$(PYTHON) -m llm_service.cli serve --host 127.0.0.1 --port $(TWIN_LLM_PORT);
}

workflow[name="llm-fake-demo"] {
  trigger: manual;
  step-1: run cmd=TWIN_LLM_PORT=$(TWIN_LLM_PORT) scripts/run-fake-llm-demo.sh;
}

workflow[name="litellm-proxy"] {
  trigger: manual;
  step-1: run cmd=scripts/run-litellm-proxy.sh;
}

workflow[name="aider"] {
  trigger: manual;
  step-1: run cmd=scripts/run-aider.sh $(AIDER_ARGS);
}

workflow[name="clean"] {
  trigger: manual;
  step-1: run cmd=rm -rf dist __pycache__ llm_service/__pycache__ tests/__pycache__;
  step-2: run cmd=rm -f data/output/*.json data/output/*.md data/output/*.jsonl data/output/*.log data/output/*.yaml;
  step-3: run cmd=rm -f data/normalized/*.json data/normalized/*.jsonl;
}

tests {
  import: testql-scenarios/**/*.testql.toon.yaml;
}

env_vars {
  keys: TWIN_LLM_URL, TWIN_LLM_AUDIT_PATH, TWIN_LLM_EVENT_WINDOW, TWIN_API_TOKEN, TWIN_ALLOW_REMOTE, LITELLM_PROXY_URL, LITELLM_MASTER_KEY, OPENROUTER_API_KEY, OPENROUTER_INTENT_MODEL, OPENROUTER_GUIDELINES_MODEL, OPENROUTER_CODE_MODEL, OPENROUTER_VALIDATION_MODEL, LOCAL_LLM_API_BASE, LOCAL_LLM_MODEL, LOCAL_LLM_API_KEY, LOCAL_LLM_ENABLED, LITELLM_PROXY_ENABLED, OPENROUTER_DIRECT_ENABLED, AIDER_MODEL, AIDER_APPLY;
}

deploy {
  target: makefile;
}

environment[name="local"] {
  runtime: python;
  env_file: .env.example;
  template_file: .env.example;
  vars: AIDER_APPLY, AIDER_MODEL, LITELLM_MASTER_KEY, LITELLM_PROXY_ENABLED, LITELLM_PROXY_URL, LOCAL_LLM_API_BASE, LOCAL_LLM_API_KEY, LOCAL_LLM_ENABLED, LOCAL_LLM_MODEL, OPENROUTER_API_KEY, OPENROUTER_CODE_MODEL, OPENROUTER_DIRECT_ENABLED, OPENROUTER_GUIDELINES_MODEL, OPENROUTER_INTENT_MODEL, OPENROUTER_VALIDATION_MODEL, TWIN_ALLOW_REMOTE, TWIN_API_TOKEN, TWIN_LLM_AUDIT_PATH, TWIN_LLM_EVENT_WINDOW, TWIN_LLM_URL;
  runtime_llm: OPENROUTER_API_KEY, OPENROUTER_CODE_MODEL, OPENROUTER_DIRECT_ENABLED, OPENROUTER_GUIDELINES_MODEL, OPENROUTER_INTENT_MODEL, OPENROUTER_VALIDATION_MODEL;
}
```

## Workflows

## Call Graph

*133 nodes · 142 edges · 21 modules · CC̄=3.5*

### Hubs (by degree)

| Function | CC | in | out | total |
|----------|----|----|-----|-------|
| `buildArtifacts` *(in src.cli)* | 7 | 5 | 27 | **32** |
| `resolve_route` *(in llm_service.core)* | 11 ⚠ | 2 | 26 | **28** |
| `main` *(in scripts.check-schema-identity)* | 11 ⚠ | 0 | 23 | **23** |
| `extractDeterministicRules` *(in src.extract.deterministic)* | 25 ⚠ | 0 | 22 | **22** |
| `main` *(in llm_service.cli)* | 11 ⚠ | 0 | 22 | **22** |
| `main` *(in scripts.check-flag-parity)* | 11 ⚠ | 0 | 21 | **21** |
| `complete_chat` *(in llm_service.core)* | 9 | 3 | 16 | **19** |
| `health` *(in llm_service.core)* | 5 | 2 | 15 | **17** |

```toon markpact:analysis path=project/calls.toon.yaml
# code2llm call graph | /home/tom/github/subactor/twin-developer
# generated in 0.06s
# nodes: 133 | edges: 142 | modules: 21
# CC̄=3.5

HUBS[20]:
  src.cli.buildArtifacts
    CC=7  in:5  out:27  total:32
  llm_service.core.resolve_route
    CC=11  in:2  out:26  total:28
  scripts.check-schema-identity.main
    CC=11  in:0  out:23  total:23
  src.extract.deterministic.extractDeterministicRules
    CC=25  in:0  out:22  total:22
  llm_service.cli.main
    CC=11  in:0  out:22  total:22
  scripts.check-flag-parity.main
    CC=11  in:0  out:21  total:21
  llm_service.core.complete_chat
    CC=9  in:3  out:16  total:19
  llm_service.core.health
    CC=5  in:2  out:15  total:17
  llm_service.core._real_structured
    CC=7  in:1  out:16  total:17
  scripts.render-litellm-config.main
    CC=5  in:0  out:17  total:17
  scripts.validate-schema.validate
    CC=4  in:1  out:15  total:16
  llm_service.core._run_stage
    CC=3  in:2  out:14  total:16
  src.cli.buildGuidelineArtifacts
    CC=7  in:4  out:12  total:16
  llm_service.audit.append_audit
    CC=3  in:6  out:9  total:15
  llm_service.cli.parser
    CC=2  in:1  out:14  total:15
  src.llm.client.LlmServiceError.postJson
    CC=12  in:0  out:14  total:14
  llm_service.core._route_enabled
    CC=5  in:6  out:8  total:14
  src.reality.offer.reconcileOfferHistory
    CC=14  in:0  out:13  total:13
  llm_service.core._sha
    CC=1  in:8  out:4  total:12
  src.ingest.markdown.cleanHumanBlock
    CC=3  in:10  out:2  total:12

MODULES:
  llm_service.app  [4 funcs]
    chat_completions  CC=3  out:8
    extract_intents  CC=2  out:8
    generate_guidelines  CC=2  out:8
    healthz  CC=1  out:2
  llm_service.audit  [3 funcs]
    _path  CC=2  out:3
    append_audit  CC=3  out:9
    audit_ref  CC=1  out:4
  llm_service.cli  [5 funcs]
    _guard_bind  CC=4  out:5
    _read  CC=3  out:4
    _write  CC=3  out:6
    main  CC=11  out:22
    parser  CC=2  out:14
  llm_service.core  [18 funcs]
    _extract_text  CC=6  out:7
    _provenance  CC=4  out:7
    _real_structured  CC=7  out:16
    _registry  CC=1  out:3
    _root  CC=1  out:2
    _route_enabled  CC=5  out:8
    _routing  CC=1  out:3
    _run_stage  CC=3  out:14
    _schema  CC=1  out:3
    _sha  CC=1  out:4
  scripts.check-flag-parity  [3 funcs]
    env_example_values  CC=5  out:7
    main  CC=11  out:21
    routing_flags  CC=3  out:4
  scripts.check-schema-identity  [2 funcs]
    main  CC=11  out:23
    walk  CC=7  out:7
  scripts.render-litellm-config  [3 funcs]
    litellm_openrouter_model  CC=2  out:1
    main  CC=5  out:17
    render  CC=4  out:10
  scripts.validate-schema  [2 funcs]
    validate  CC=4  out:15
    validate_tickets  CC=2  out:5
  src.cli  [28 funcs]
    absoluteInputs  CC=1  out:3
    buildAiderArtifacts  CC=3  out:7
    buildArtifacts  CC=7  out:27
    buildGuidelineArtifacts  CC=7  out:12
    buildOfferRealityArtifacts  CC=1  out:6
    command  CC=2  out:1
    commandAider  CC=1  out:4
    commandBuild  CC=3  out:6
    commandDemo  CC=3  out:10
    commandGuidelines  CC=3  out:6
  src.extract.deterministic  [10 funcs]
    effectiveClass  CC=3  out:0
    entries  CC=1  out:6
    eventMatches  CC=1  out:3
    evidenceByEvent  CC=5  out:11
    extractDeterministicRules  CC=25  out:22
    matchedEntriesByEvent  CC=4  out:5
    matches  CC=4  out:5
    rankingWeight  CC=3  out:1
    repeated  CC=1  out:6
    sourceClass  CC=1  out:6
  src.ingest.cursor  [6 funcs]
    blobIndex  CC=8  out:6
    decodeJsonString  CC=2  out:2
    extractTipTapText  CC=6  out:7
    ingestCursorExport  CC=8  out:8
    parsed  CC=8  out:6
    sequence  CC=8  out:6
  src.ingest.markdown  [11 funcs]
    block  CC=6  out:4
    cleanHumanBlock  CC=3  out:2
    current  CC=6  out:4
    end  CC=6  out:4
    human  CC=1  out:2
    ingestMarkdownTranscript  CC=10  out:7
    next  CC=6  out:4
    role  CC=6  out:4
    sequence  CC=10  out:6
    start  CC=6  out:4
  src.llm.client  [9 funcs]
    authHeaders  CC=2  out:0
    clearTimeout  CC=1  out:0
    controller  CC=7  out:6
    eventWindowSize  CC=4  out:3
    extractIntentCandidatesWithLlm  CC=1  out:4
    postJson  CC=12  out:14
    serviceHealth  CC=7  out:9
    text  CC=3  out:3
    timer  CC=7  out:6
  src.reality.offer  [5 funcs]
    currentById  CC=13  out:9
    extractPlanPrice  CC=5  out:4
    normalized  CC=8  out:7
    price  CC=1  out:2
    reconcileOfferHistory  CC=14  out:13
  src.twin.aggregate  [4 funcs]
    buildDeveloperTwin  CC=21  out:9
    buildModelStages  CC=2  out:4
    buildWorkflow  CC=2  out:0
    candidateRules  CC=10  out:9
  src.twin.guidelines  [2 funcs]
    generateDeterministicGuidelines  CC=9  out:4
    selectRules  CC=8  out:10
  src.twin.render  [2 funcs]
    escapeCell  CC=1  out:1
    renderTwinMarkdown  CC=12  out:6
  src.twin.validate  [5 funcs]
    evidenceIndex  CC=2  out:3
    validateGenerator  CC=2  out:3
    validateRules  CC=2  out:3
    validateTwin  CC=4  out:9
    validateWorkflow  CC=2  out:3
  src.util.command  [4 funcs]
    checkCommand  CC=11  out:8
    isAllowedCommand  CC=1  out:1
    tokenizeCommand  CC=1  out:3
    tokens  CC=6  out:6
  src.util.hash  [2 funcs]
    sha256  CC=1  out:3
    stableId  CC=1  out:2
  src.util.text  [5 funcs]
    compactWhitespace  CC=1  out:2
    excerpt  CC=2  out:4
    isLikelyCorrection  CC=4  out:3
    normalizeForMatch  CC=1  out:4
    redactSecrets  CC=2  out:1

EDGES:
  llm_service.cli._guard_bind → llm_service.core.flag_enabled
  llm_service.cli.main → llm_service.cli._write
  llm_service.cli.main → llm_service.cli.parser
  llm_service.cli.main → llm_service.core.health
  llm_service.cli.main → llm_service.core.complete_intents
  llm_service.cli.main → llm_service.cli._read
  llm_service.cli.main → llm_service.core.complete_guidelines
  llm_service.app.healthz → llm_service.core.health
  llm_service.app.extract_intents → llm_service.core.complete_intents
  llm_service.app.generate_guidelines → llm_service.core.complete_guidelines
  llm_service.app.chat_completions → llm_service.core.complete_chat
  llm_service.core._routing → llm_service.core._root
  llm_service.core._route_enabled → src.ingest.markdown.next
  llm_service.core._route_enabled → llm_service.core.flag_enabled
  llm_service.core._route_enabled → llm_service.core._routing
  llm_service.core._registry → llm_service.core._root
  llm_service.core._stage_entry → llm_service.core._registry
  llm_service.core._schema → llm_service.core._root
  llm_service.core.resolve_route → llm_service.core._stage_entry
  llm_service.core.resolve_route → llm_service.core._route_enabled
  llm_service.core._real_structured → llm_service.core.resolve_route
  llm_service.core._real_structured → llm_service.core._extract_text
  llm_service.core._real_structured → llm_service.core._sha
  llm_service.core.fake_mode → llm_service.core.flag_enabled
  llm_service.core._run_stage → llm_service.core.fake_mode
  llm_service.core._run_stage → llm_service.core._real_structured
  llm_service.core._run_stage → llm_service.core._provenance
  llm_service.core._run_stage → llm_service.core._sha
  llm_service.core._run_stage → llm_service.core._schema
  llm_service.core._run_stage → llm_service.audit.append_audit
  llm_service.core.complete_intents → llm_service.core._run_stage
  llm_service.core.complete_guidelines → llm_service.core._run_stage
  llm_service.core.complete_chat → llm_service.core.fake_mode
  llm_service.core.complete_chat → llm_service.core.resolve_route
  llm_service.core.complete_chat → llm_service.core._sha
  llm_service.core.complete_chat → llm_service.core._provenance
  llm_service.core.health → llm_service.core.fake_mode
  llm_service.core.health → llm_service.core._route_enabled
  llm_service.audit.append_audit → llm_service.audit._path
  llm_service.audit.append_audit → llm_service.audit.audit_ref
  src.cli.rootPath → src.cli.flag
  src.cli.modeFromArgs → src.cli.flag
  src.cli.mode → src.cli.buildArtifacts
  src.cli.defaultInputPaths → src.cli.flags
  src.cli.buildArtifacts → src.cli.loadCore
  src.cli.buildArtifacts → src.cli.defaultInputPaths
  src.cli.buildArtifacts → src.cli.rel
  src.cli.absoluteInputs → src.cli.rel
  src.cli.rawEvents → src.cli.rel
  src.cli.buildGuidelineArtifacts → src.cli.loadCore
```

## Test Contracts

*Scenarios as contract signatures — what the system guarantees.*

### Integration (1)

**`Auto-generated from Python Tests`**

## Refactoring Analysis

*Pre-refactoring snapshot — use this section to identify targets. Generated from `project/` toon files.*

### Call Graph & Complexity (`project/calls.toon.yaml`)

```toon markpact:analysis path=project/calls.toon.yaml
# code2llm call graph | /home/tom/github/subactor/twin-developer
# generated in 0.06s
# nodes: 133 | edges: 142 | modules: 21
# CC̄=3.5

HUBS[20]:
  src.cli.buildArtifacts
    CC=7  in:5  out:27  total:32
  llm_service.core.resolve_route
    CC=11  in:2  out:26  total:28
  scripts.check-schema-identity.main
    CC=11  in:0  out:23  total:23
  src.extract.deterministic.extractDeterministicRules
    CC=25  in:0  out:22  total:22
  llm_service.cli.main
    CC=11  in:0  out:22  total:22
  scripts.check-flag-parity.main
    CC=11  in:0  out:21  total:21
  llm_service.core.complete_chat
    CC=9  in:3  out:16  total:19
  llm_service.core.health
    CC=5  in:2  out:15  total:17
  llm_service.core._real_structured
    CC=7  in:1  out:16  total:17
  scripts.render-litellm-config.main
    CC=5  in:0  out:17  total:17
  scripts.validate-schema.validate
    CC=4  in:1  out:15  total:16
  llm_service.core._run_stage
    CC=3  in:2  out:14  total:16
  src.cli.buildGuidelineArtifacts
    CC=7  in:4  out:12  total:16
  llm_service.audit.append_audit
    CC=3  in:6  out:9  total:15
  llm_service.cli.parser
    CC=2  in:1  out:14  total:15
  src.llm.client.LlmServiceError.postJson
    CC=12  in:0  out:14  total:14
  llm_service.core._route_enabled
    CC=5  in:6  out:8  total:14
  src.reality.offer.reconcileOfferHistory
    CC=14  in:0  out:13  total:13
  llm_service.core._sha
    CC=1  in:8  out:4  total:12
  src.ingest.markdown.cleanHumanBlock
    CC=3  in:10  out:2  total:12

MODULES:
  llm_service.app  [4 funcs]
    chat_completions  CC=3  out:8
    extract_intents  CC=2  out:8
    generate_guidelines  CC=2  out:8
    healthz  CC=1  out:2
  llm_service.audit  [3 funcs]
    _path  CC=2  out:3
    append_audit  CC=3  out:9
    audit_ref  CC=1  out:4
  llm_service.cli  [5 funcs]
    _guard_bind  CC=4  out:5
    _read  CC=3  out:4
    _write  CC=3  out:6
    main  CC=11  out:22
    parser  CC=2  out:14
  llm_service.core  [18 funcs]
    _extract_text  CC=6  out:7
    _provenance  CC=4  out:7
    _real_structured  CC=7  out:16
    _registry  CC=1  out:3
    _root  CC=1  out:2
    _route_enabled  CC=5  out:8
    _routing  CC=1  out:3
    _run_stage  CC=3  out:14
    _schema  CC=1  out:3
    _sha  CC=1  out:4
  scripts.check-flag-parity  [3 funcs]
    env_example_values  CC=5  out:7
    main  CC=11  out:21
    routing_flags  CC=3  out:4
  scripts.check-schema-identity  [2 funcs]
    main  CC=11  out:23
    walk  CC=7  out:7
  scripts.render-litellm-config  [3 funcs]
    litellm_openrouter_model  CC=2  out:1
    main  CC=5  out:17
    render  CC=4  out:10
  scripts.validate-schema  [2 funcs]
    validate  CC=4  out:15
    validate_tickets  CC=2  out:5
  src.cli  [28 funcs]
    absoluteInputs  CC=1  out:3
    buildAiderArtifacts  CC=3  out:7
    buildArtifacts  CC=7  out:27
    buildGuidelineArtifacts  CC=7  out:12
    buildOfferRealityArtifacts  CC=1  out:6
    command  CC=2  out:1
    commandAider  CC=1  out:4
    commandBuild  CC=3  out:6
    commandDemo  CC=3  out:10
    commandGuidelines  CC=3  out:6
  src.extract.deterministic  [10 funcs]
    effectiveClass  CC=3  out:0
    entries  CC=1  out:6
    eventMatches  CC=1  out:3
    evidenceByEvent  CC=5  out:11
    extractDeterministicRules  CC=25  out:22
    matchedEntriesByEvent  CC=4  out:5
    matches  CC=4  out:5
    rankingWeight  CC=3  out:1
    repeated  CC=1  out:6
    sourceClass  CC=1  out:6
  src.ingest.cursor  [6 funcs]
    blobIndex  CC=8  out:6
    decodeJsonString  CC=2  out:2
    extractTipTapText  CC=6  out:7
    ingestCursorExport  CC=8  out:8
    parsed  CC=8  out:6
    sequence  CC=8  out:6
  src.ingest.markdown  [11 funcs]
    block  CC=6  out:4
    cleanHumanBlock  CC=3  out:2
    current  CC=6  out:4
    end  CC=6  out:4
    human  CC=1  out:2
    ingestMarkdownTranscript  CC=10  out:7
    next  CC=6  out:4
    role  CC=6  out:4
    sequence  CC=10  out:6
    start  CC=6  out:4
  src.llm.client  [9 funcs]
    authHeaders  CC=2  out:0
    clearTimeout  CC=1  out:0
    controller  CC=7  out:6
    eventWindowSize  CC=4  out:3
    extractIntentCandidatesWithLlm  CC=1  out:4
    postJson  CC=12  out:14
    serviceHealth  CC=7  out:9
    text  CC=3  out:3
    timer  CC=7  out:6
  src.reality.offer  [5 funcs]
    currentById  CC=13  out:9
    extractPlanPrice  CC=5  out:4
    normalized  CC=8  out:7
    price  CC=1  out:2
    reconcileOfferHistory  CC=14  out:13
  src.twin.aggregate  [4 funcs]
    buildDeveloperTwin  CC=21  out:9
    buildModelStages  CC=2  out:4
    buildWorkflow  CC=2  out:0
    candidateRules  CC=10  out:9
  src.twin.guidelines  [2 funcs]
    generateDeterministicGuidelines  CC=9  out:4
    selectRules  CC=8  out:10
  src.twin.render  [2 funcs]
    escapeCell  CC=1  out:1
    renderTwinMarkdown  CC=12  out:6
  src.twin.validate  [5 funcs]
    evidenceIndex  CC=2  out:3
    validateGenerator  CC=2  out:3
    validateRules  CC=2  out:3
    validateTwin  CC=4  out:9
    validateWorkflow  CC=2  out:3
  src.util.command  [4 funcs]
    checkCommand  CC=11  out:8
    isAllowedCommand  CC=1  out:1
    tokenizeCommand  CC=1  out:3
    tokens  CC=6  out:6
  src.util.hash  [2 funcs]
    sha256  CC=1  out:3
    stableId  CC=1  out:2
  src.util.text  [5 funcs]
    compactWhitespace  CC=1  out:2
    excerpt  CC=2  out:4
    isLikelyCorrection  CC=4  out:3
    normalizeForMatch  CC=1  out:4
    redactSecrets  CC=2  out:1

EDGES:
  llm_service.cli._guard_bind → llm_service.core.flag_enabled
  llm_service.cli.main → llm_service.cli._write
  llm_service.cli.main → llm_service.cli.parser
  llm_service.cli.main → llm_service.core.health
  llm_service.cli.main → llm_service.core.complete_intents
  llm_service.cli.main → llm_service.cli._read
  llm_service.cli.main → llm_service.core.complete_guidelines
  llm_service.app.healthz → llm_service.core.health
  llm_service.app.extract_intents → llm_service.core.complete_intents
  llm_service.app.generate_guidelines → llm_service.core.complete_guidelines
  llm_service.app.chat_completions → llm_service.core.complete_chat
  llm_service.core._routing → llm_service.core._root
  llm_service.core._route_enabled → src.ingest.markdown.next
  llm_service.core._route_enabled → llm_service.core.flag_enabled
  llm_service.core._route_enabled → llm_service.core._routing
  llm_service.core._registry → llm_service.core._root
  llm_service.core._stage_entry → llm_service.core._registry
  llm_service.core._schema → llm_service.core._root
  llm_service.core.resolve_route → llm_service.core._stage_entry
  llm_service.core.resolve_route → llm_service.core._route_enabled
  llm_service.core._real_structured → llm_service.core.resolve_route
  llm_service.core._real_structured → llm_service.core._extract_text
  llm_service.core._real_structured → llm_service.core._sha
  llm_service.core.fake_mode → llm_service.core.flag_enabled
  llm_service.core._run_stage → llm_service.core.fake_mode
  llm_service.core._run_stage → llm_service.core._real_structured
  llm_service.core._run_stage → llm_service.core._provenance
  llm_service.core._run_stage → llm_service.core._sha
  llm_service.core._run_stage → llm_service.core._schema
  llm_service.core._run_stage → llm_service.audit.append_audit
  llm_service.core.complete_intents → llm_service.core._run_stage
  llm_service.core.complete_guidelines → llm_service.core._run_stage
  llm_service.core.complete_chat → llm_service.core.fake_mode
  llm_service.core.complete_chat → llm_service.core.resolve_route
  llm_service.core.complete_chat → llm_service.core._sha
  llm_service.core.complete_chat → llm_service.core._provenance
  llm_service.core.health → llm_service.core.fake_mode
  llm_service.core.health → llm_service.core._route_enabled
  llm_service.audit.append_audit → llm_service.audit._path
  llm_service.audit.append_audit → llm_service.audit.audit_ref
  src.cli.rootPath → src.cli.flag
  src.cli.modeFromArgs → src.cli.flag
  src.cli.mode → src.cli.buildArtifacts
  src.cli.defaultInputPaths → src.cli.flags
  src.cli.buildArtifacts → src.cli.loadCore
  src.cli.buildArtifacts → src.cli.defaultInputPaths
  src.cli.buildArtifacts → src.cli.rel
  src.cli.absoluteInputs → src.cli.rel
  src.cli.rawEvents → src.cli.rel
  src.cli.buildGuidelineArtifacts → src.cli.loadCore
```

### Code Analysis (`project/analysis.toon.yaml`)

```toon markpact:analysis path=project/analysis.toon.yaml
# code2llm | 93f 18066L | json:28,typescript:22,md:19,python:11,shell:6,yaml:4,txt:2 | 2026-08-16
# generated in 0.05s
# CC̅=3.5 | critical:4/294 | dups:0 | cycles:1

HEALTH[4]:
  🟡 CC    extractDeterministicRules CC=25 (limit:15)
  🟡 CC    buildDeveloperTwin CC=21 (limit:15)
  🟡 CC    validateIntentCandidates CC=17 (limit:15)
  🟡 CC    validateGuidelines CC=20 (limit:15)

REFACTOR[2]:
  1. split 4 high-CC methods  (CC>15)
  2. break 1 circular dependencies

PIPELINES[171]:
  [1] Src [main]: main → _write
      PURITY: 100% pure
  [2] Src [require_token]: require_token
      PURITY: 100% pure
  [3] Src [healthz]: healthz → health → fake_mode → flag_enabled
      PURITY: 100% pure
  [4] Src [extract_intents]: extract_intents → complete_intents → _run_stage → fake_mode → ...(1 more)
      PURITY: 100% pure
  [5] Src [generate_guidelines]: generate_guidelines → complete_guidelines → _run_stage → fake_mode → ...(1 more)
      PURITY: 100% pure
  [6] Src [chat_completions]: chat_completions → complete_chat → fake_mode → flag_enabled
      PURITY: 100% pure
  [7] Src [_fake_intents]: _fake_intents
      PURITY: 100% pure
  [8] Src [_fake_guidelines]: _fake_guidelines
      PURITY: 100% pure
  [9] Src [mode]: mode → buildArtifacts → loadCore
      PURITY: 100% pure
  [10] Src [absoluteInputs]: absoluteInputs → rel
      PURITY: 100% pure
  [11] Src [rawEvents]: rawEvents → rel
      PURITY: 100% pure
  [12] Src [content]: content
      PURITY: 100% pure
  [13] Src [sourceFile]: sourceFile
      PURITY: 100% pure
  [14] Src [response]: response
      PURITY: 100% pure
  [15] Src [twin]: twin
      PURITY: 100% pure
  [16] Src [task]: task
      PURITY: 100% pure
  [17] Src [deterministic]: deterministic
      PURITY: 100% pure
  [18] Src [guidelines]: guidelines → buildGuidelineArtifacts → loadCore
      PURITY: 100% pure
  [19] Src [project]: project
      PURITY: 100% pure
  [20] Src [root]: root → buildArtifacts → loadCore
      PURITY: 100% pure
  [21] Src [llmUrl]: llmUrl → buildArtifacts → loadCore
      PURITY: 100% pure
  [22] Src [result]: result → buildGuidelineArtifacts → loadCore
      PURITY: 100% pure
  [23] Src [path]: path
      PURITY: 100% pure
  [24] Src [diagnostics]: diagnostics
      PURITY: 100% pure
  [25] Src [command]: command → main → commandBuild → rootPath → ...(1 more)
      PURITY: 100% pure
  [26] Src [createHash]: createHash
      PURITY: 100% pure
  [27] Src [supportingEvent]: supportingEvent
      PURITY: 100% pure
  [28] Src [extractDeterministicRules]: extractDeterministicRules → eventMatches
      PURITY: 100% pure
  [29] Src [matches]: matches → eventMatches
      PURITY: 100% pure
  [30] Src [matchedEntriesByEvent]: matchedEntriesByEvent → eventMatches
      PURITY: 100% pure
  [31] Src [rows]: rows
      PURITY: 100% pure
  [32] Src [evidenceByEvent]: evidenceByEvent → effectiveClass
      PURITY: 100% pure
  [33] Src [entries]: entries → rankingWeight
      PURITY: 100% pure
  [34] Src [repeated]: repeated → rankingWeight
      PURITY: 100% pure
  [35] Src [sourceClass]: sourceClass → rankingWeight
      PURITY: 100% pure
  [36] Src [refs]: refs
      PURITY: 100% pure
  [37] Src [correctionBoost]: correctionBoost
      PURITY: 100% pure
  [38] Src [repetitionBoost]: repetitionBoost
      PURITY: 100% pure
  [39] Src [avgIntentWeight]: avgIntentWeight
      PURITY: 100% pure
  [40] Src [confidence]: confidence
      PURITY: 100% pure
  [41] Src [dockerRule]: dockerRule
      PURITY: 100% pure
  [42] Src [escaped]: escaped
      PURITY: 100% pure
  [43] Src [forward]: forward
      PURITY: 100% pure
  [44] Src [backward]: backward
      PURITY: 100% pure
  [45] Src [reconcileOfferHistory]: reconcileOfferHistory → extractPlanPrice → price
      PURITY: 100% pure
  [46] Src [currentPlans]: currentPlans
      PURITY: 100% pure
  [47] Src [currentById]: currentById → extractPlanPrice → price
      PURITY: 100% pure
  [48] Src [normalized]: normalized → extractPlanPrice → price
      PURITY: 100% pure
  [49] Src [claimed]: claimed
      PURITY: 100% pure
  [50] Src [current]: current
      PURITY: 100% pure

LAYERS:
  scripts/                        CC̄=4.7    ←in:0  →out:0
  │ check-schema-identity      101L  0C    3m  CC=11     ←0
  │ render-litellm-config       80L  0C    3m  CC=5      ←0
  │ check-flag-parity           70L  0C    3m  CC=11     ←0
  │ verify-artifacts.sh         57L  0C    0m  CC=0.0    ←0
  │ validate-schema             56L  0C    2m  CC=4      ←0
  │ run-aider.sh                37L  0C    0m  CC=0.0    ←0
  │ run-fake-llm-demo.sh        24L  0C    1m  CC=0.0    ←0
  │ run-litellm-proxy.sh        10L  0C    0m  CC=0.0    ←0
  │ llmctl.sh                    5L  0C    0m  CC=0.0    ←0
  │
  llm_service/                    CC̄=3.5    ←in:0  →out:1
  │ core                       368L  4C   22m  CC=11     ←2
  │ cli                         99L  0C    5m  CC=11     ←0
  │ app                         70L  0C    5m  CC=4      ←0
  │ models                      51L  7C    0m  CC=0.0    ←0
  │ audit                       46L  0C    3m  CC=3      ←1
  │ __init__                     3L  0C    0m  CC=0.0    ←0
  │ __main__                     3L  0C    0m  CC=0.0    ←0
  │
  src/                            CC̄=3.5    ←in:0  →out:0
  │ cli.ts                     329L  2C   50m  CC=8      ←0
  │ types.ts                   232L  16C    0m  CC=0.0    ←0
  │ !! aggregate.ts               199L  0C    9m  CC=21     ←0
  │ !! deterministic.ts           146L  1C   20m  CC=25     ←0
  │ offer.ts                   144L  3C   15m  CC=14     ←0
  │ client.ts                  138L  3C   24m  CC=12     ←0
  │ !! validate.ts                136L  1C   20m  CC=20     ←0
  │ guidelines.ts               71L  1C   15m  CC=9      ←0
  │ markdown.ts                 66L  0C   14m  CC=10     ←1
  │ cursor.ts                   65L  1C    9m  CC=8      ←0
  │ command.ts                  65L  1C    9m  CC=11     ←0
  │ render.ts                   55L  0C    3m  CC=12     ←0
  │ text.ts                     47L  0C    8m  CC=4      ←0
  │ node-shims.d.ts             45L  0C   13m  CC=4      ←0
  │ prompt.ts                   45L  0C    2m  CC=5      ←0
  │ common.ts                   35L  0C    7m  CC=7      ←0
  │ index.ts                    32L  0C    3m  CC=12     ←0
  │ files.ts                    29L  0C    8m  CC=3      ←0
  │ jsonl.ts                    27L  0C    6m  CC=11     ←0
  │ shell.ts                    27L  0C    5m  CC=6      ←0
  │ plain.ts                    22L  0C    5m  CC=3      ←0
  │ hash.ts                      9L  0C    2m  CC=1      ←0
  │
  ./                              CC̄=0.0    ←in:0  →out:0
  │ !! planfile.yaml              630L  0C    0m  CC=0.0    ←0
  │ README.md                  446L  0C    0m  CC=0.0    ←0
  │ prefact.yaml                94L  0C    0m  CC=0.0    ←0
  │ Makefile                    89L  0C    0m  CC=0.0    ←0
  │ TODO.md                     78L  0C    0m  CC=0.0    ←0
  │ project2.sh                 55L  0C    0m  CC=0.0    ←0
  │ CHANGELOG.md                52L  0C    0m  CC=0.0    ←0
  │ package.json                25L  0C    0m  CC=0.0    ←0
  │ tsconfig.json               18L  0C    0m  CC=0.0    ←0
  │ requirements.txt             5L  0C    0m  CC=0.0    ←0
  │
  schemas/                        CC̄=0.0    ←in:0  →out:0
  │ !! developer-twin.schema.json   609L  0C    0m  CC=0.0    ←0
  │ source-policy.schema.json    64L  0C    0m  CC=0.0    ←0
  │ rule-catalog.schema.json    53L  0C    0m  CC=0.0    ←0
  │ llm-routing.schema.json     44L  0C    0m  CC=0.0    ←0
  │ model-registry.schema.json    38L  0C    0m  CC=0.0    ←0
  │ project-context.schema.json    36L  0C    0m  CC=0.0    ←0
  │ local-ticket-intent.schema.json    35L  0C    0m  CC=0.0    ←0
  │ llm-intent-extraction.schema.json    33L  0C    0m  CC=0.0    ←0
  │ guidelines.schema.json      29L  0C    0m  CC=0.0    ←0
  │
  docs/                           CC̄=0.0    ←in:0  →out:0
  │ !! AUDIT_AND_AUTONOMY_PLAN.md   784L  0C    0m  CC=0.0    ←0
  │ !! README.md                  512L  0C    0m  CC=0.0    ←0
  │ SECURITY.md                 51L  0C    0m  CC=0.0    ←0
  │ NEXT_STEPS.md               49L  0C    0m  CC=0.0    ←0
  │ ARCHITECTURE.md             35L  0C    0m  CC=0.0    ←0
  │ DSL.md                      18L  0C    0m  CC=0.0    ←0
  │ SOURCE_TRUTH.md             17L  0C    0m  CC=0.0    ←0
  │
  testql-scenarios/               CC̄=0.0    ←in:0  →out:0
  │ generated-from-pytests.testql.toon.yaml    10L  0C    0m  CC=0.0    ←0
  │
  config/                         CC̄=0.0    ←in:0  →out:0
  │ rule-catalog.json          346L  0C    0m  CC=0.0    ←0
  │ llm-routing.json            71L  0C    0m  CC=0.0    ←0
  │ source-policy.json          61L  0C    0m  CC=0.0    ←0
  │ litellm-proxy.yaml          34L  0C    0m  CC=0.0    ←0
  │ model-registry.json         34L  0C    0m  CC=0.0    ←0
  │
  data/                           CC̄=0.0    ←in:0  →out:0
  │ !! developer-twin.dsl.json   2701L  0C    0m  CC=0.0    ←0
  │ !! developer-twin.dsl.json   2680L  0C    0m  CC=0.0    ←0
  │ !! history-portal.md         1569L  0C    0m  CC=0.0    ←0
  │ !! history-cursor.json       1404L  0C    0m  CC=0.0    ←0
  │ !! todo2code.README.md        927L  0C    0m  CC=0.0    ←0
  │ developer-twin.md          246L  0C    0m  CC=0.0    ←0
  │ developer-twin.md          236L  0C    0m  CC=0.0    ←0
  │ subactor-cloud-v1.offer.json    97L  0C    0m  CC=0.0    ←0
  │ extraction-map.json         91L  0C    0m  CC=0.0    ←0
  │ guidelines.json             89L  0C    0m  CC=0.0    ←0
  │ guidelines.json             89L  0C    0m  CC=0.0    ←0
  │ aider-message.md            80L  0C    0m  CC=0.0    ←0
  │ validation-receipt.json     67L  0C    0m  CC=0.0    ←0
  │ project.json                62L  0C    0m  CC=0.0    ←0
  │ VALIDATION.md               54L  0C    0m  CC=0.0    ←0
  │ minimal-twin.json           54L  0C    0m  CC=0.0    ←0
  │ offer-reality.md            39L  0C    0m  CC=0.0    ←0
  │ policy-dsl.README.md        35L  0C    0m  CC=0.0    ←0
  │ source-manifest.json        24L  0C    0m  CC=0.0    ←0
  │ guidelines.audit.json       10L  0C    0m  CC=0.0    ←0
  │ guidelines.audit.json        6L  0C    0m  CC=0.0    ←0
  │ shell-history.txt            4L  0C    0m  CC=0.0    ←0
  │ example-task.md              3L  0C    0m  CC=0.0    ←0
  │

COUPLING:
               llm_service   src.ingest
  llm_service           ──            1
   src.ingest           ←1           ──
  CYCLES: 1

EXTERNAL:
  validation: run `vallm batch .` → validation.toon
  duplication: run `redup scan .` → duplication.toon
```

### Duplication (`project/duplication.toon.yaml`)

```toon markpact:analysis path=project/duplication.toon.yaml
# redup/duplication | 2 groups | 41f 3842L | 2026-08-16

SUMMARY:
  files_scanned: 41
  total_lines:   3842
  dup_groups:    2
  actionable:    1
  review:        1
  generated:     0
  actionable_L:  6
  review_L:      9
  generated_L:   0
  dup_fragments: 4
  saved_lines:   15
  scan_ms:       262

HOTSPOTS[2] (files with most duplication):
  llm_service/core.py  dup=18L  groups=1  frags=2  (0.5%)
  llm_service/app.py  dup=12L  groups=1  frags=2  (0.3%)

DUPLICATES[2] (ranked by impact):
  [96e14f4f9b6bf52f]   STRU  complete_intents  L=9 N=2 saved=9 sim=1.00
      provenance=delegating_wrappers action=review
      llm_service/core.py:293-301  (complete_intents)
      llm_service/core.py:304-312  (complete_guidelines)
  [286bc8ae3b9f4015]   STRU  extract_intents  L=6 N=2 saved=6 sim=1.00
      provenance=same_file action=refactor
      llm_service/app.py:42-47  (extract_intents)
      llm_service/app.py:51-56  (generate_guidelines)

REFACTOR[1] (ranked by priority):
  [2] ○ extract_function   → llm_service/utils/extract_intents.py
      WHY: 2 occurrences of 6-line block across 1 files — saves 6 lines
      FILES: llm_service/app.py

QUICK_WINS[1] (low risk, high savings — do first):
  [2] extract_function   saved=6L  → llm_service/utils/extract_intents.py
      FILES: app.py

EFFORT_ESTIMATE (total ≈ 0.5h):
  easy   complete_intents                    saved=9L  ~18min
  easy   extract_intents                     saved=6L  ~12min

METRICS-TARGET:
  dup_groups:  2 → 0
  saved_lines: 15 lines recoverable
```

### Evolution / Churn (`project/evolution.toon.yaml`)

```toon markpact:analysis path=project/evolution.toon.yaml
# code2llm/evolution | 282 func | 25f | 2026-08-16
# generated in 0.00s

NEXT[7] (ranked by impact):
  [1] !! SPLIT-FUNC      extractDeterministicRules  CC=25  fan=22
      WHY: CC=25 exceeds 15
      EFFORT: ~1h  IMPACT: 550

  [2] !  SPLIT-FUNC      buildDeveloperTwin  CC=21  fan=9
      WHY: CC=21 exceeds 15
      EFFORT: ~1h  IMPACT: 189

  [3] !  SPLIT-FUNC      TwinValidationError.validateGuidelines  CC=20  fan=9
      WHY: CC=20 exceeds 15
      EFFORT: ~1h  IMPACT: 180

  [4] !  SPLIT-FUNC      TwinValidationError.validateIntentCandidates  CC=17  fan=5
      WHY: CC=17 exceeds 15
      EFFORT: ~1h  IMPACT: 85

  [5] !! SPLIT           data/output/developer-twin.dsl.json
      WHY: 2680L, 0 classes, max CC=0
      EFFORT: ~4h  IMPACT: 0

  [6] !! SPLIT           data/raw/history-portal.md
      WHY: 1569L, 0 classes, max CC=0
      EFFORT: ~4h  IMPACT: 0

  [7] !! SPLIT           data/raw/history-cursor.json
      WHY: 1404L, 0 classes, max CC=0
      EFFORT: ~4h  IMPACT: 0


RISKS[3]:
  ⚠ Splitting data/output/developer-twin.dsl.json may break 0 import paths
  ⚠ Splitting data/raw/history-portal.md may break 0 import paths
  ⚠ Splitting data/raw/history-cursor.json may break 0 import paths

METRICS-TARGET:
  CC̄:          3.5 → ≤2.4
  max-CC:      25 → ≤12
  god-modules: 8 → 0
  high-CC(≥15): 4 → ≤2
  hub-types:   0 → ≤0

PATTERNS (language parser shared logic):
  _extract_declarations() in base.py — unified extraction for:
    - TypeScript: interfaces, types, classes, functions, arrow funcs
    - PHP: namespaces, traits, classes, functions, includes
    - Ruby: modules, classes, methods, requires
    - C++: classes, structs, functions, #includes
    - C#: classes, interfaces, methods, usings
    - Java: classes, interfaces, methods, imports
    - Go: packages, functions, structs
    - Rust: modules, functions, traits, use statements

  Shared regex patterns per language:
    - import: language-specific import/require/using patterns
    - class: class/struct/trait declarations with inheritance
    - function: function/method signatures with visibility
    - brace_tracking: for C-family languages ({ })
    - end_keyword_tracking: for Ruby (module/class/def...end)

  Benefits:
    - Consistent extraction logic across all languages
    - Reduced code duplication (~70% reduction in parser LOC)
    - Easier maintenance: fix once, apply everywhere
    - Standardized FunctionInfo/ClassInfo models

HISTORY:
  prev CC̄=3.6 → now CC̄=3.5
```

## Intent

Subactor Developer Digital Twin
