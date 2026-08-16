# Subactor Developer Digital Twin

Subactor Developer Digital Twin

## Contents

- [Metadata](#metadata)
- [Architecture](#architecture)
- [Interfaces](#interfaces)
- [Workflows](#workflows)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Environment Variables (`.env.example`)](#environment-variables-envexample)
- [Makefile Targets](#makefile-targets)
- [Node.js Scripts (`package.json`)](#nodejs-scripts-packagejson)
- [Code Analysis](#code-analysis)
- [Call Graph](#call-graph)
- [Test Contracts](#test-contracts)
- [Intent](#intent)

## Metadata

- **name**: `twin-developer`
- **version**: `0.0.0`
- **ecosystem**: SUMD + DOQL + testql + taskfile
- **generated_from**: requirements.txt, Makefile, testql(1), app.doql.less, .env.example, package.json, project/(3 analysis files)

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

## Interfaces

### testql Scenarios

#### `testql-scenarios/generated-from-pytests.testql.toon.yaml`

```toon markpact:testql path=testql-scenarios/generated-from-pytests.testql.toon.yaml
# SCENARIO: Auto-generated from Python Tests
# TYPE: integration
# GENERATED: true

CONFIG[2]{key, value}:
  base_url, ${api_url:-http://localhost:8101}
  timeout_ms, 10000

# NOTE: Python pytest files were detected but no convertible HTTP calls or assertions were found.
# To run pytest tests directly, use: pytest <test_file>
```

## Workflows

## Configuration

```yaml
project:
  name: twin-developer
  version: 0.0.0
  env: local
```

## Deployment

```bash markpact:run
npm install subactor-developer-digital-twin-example
```

### Requirements Files

#### `requirements.txt`

- `fastapi>=0.115,<1`
- `uvicorn>=0.30,<1`
- `pydantic>=2.8,<3`
- `litellm[proxy]>=1.60,<2`
- `jsonschema>=4.23,<5`

## Environment Variables (`.env.example`)

| Variable | Default | Description |
|----------|---------|-------------|
| `TWIN_LLM_URL` | `http://127.0.0.1:8099` | TypeScript -> local Python gateway |
| `TWIN_LLM_AUDIT_PATH` | `data/output/llm-audit.jsonl` |  |
| `TWIN_LLM_EVENT_WINDOW` | `160` | Przekroczenie zgłasza diagnostykę DT_LLM_INPUT_TRUNCATED. |
| `TWIN_API_TOKEN` | `*(not set)*` | endpointach poza /healthz. Bind spoza loopbacku wymaga obu zmiennych. |
| `TWIN_ALLOW_REMOTE` | `false` |  |
| `LITELLM_PROXY_URL` | `http://127.0.0.1:4000/v1` | Option A: central LiteLLM proxy (preferred for shared policy/routing) |
| `LITELLM_MASTER_KEY` | `change-me` |  |
| `OPENROUTER_API_KEY` | `*(not set)*` | LiteLLM proxy -> OpenRouter |
| `OPENROUTER_INTENT_MODEL` | `openrouter/auto` |  |
| `OPENROUTER_GUIDELINES_MODEL` | `openrouter/auto` |  |
| `OPENROUTER_CODE_MODEL` | `openrouter/auto` |  |
| `OPENROUTER_VALIDATION_MODEL` | `openrouter/auto` |  |
| `LOCAL_LLM_API_BASE` | `*(not set)*` | Option B: private OpenAI-compatible endpoint (Ollama/vLLM/LM Studio/custom proxy) |
| `LOCAL_LLM_MODEL` | `*(not set)*` |  |
| `LOCAL_LLM_API_KEY` | `local-not-required` |  |
| `LOCAL_LLM_ENABLED` | `false` | Routing switches used by the DSL metadata |
| `LITELLM_PROXY_ENABLED` | `true` |  |
| `OPENROUTER_DIRECT_ENABLED` | `false` |  |
| `AIDER_MODEL` | `openai/twin-code` | Aider defaults to the same LiteLLM alias as the developer-twin router |
| `AIDER_APPLY` | `0` |  |

## Makefile Targets

- `SHELL`
- `help`
- `setup`
- `build`
- `demo`
- `validate`
- `verify-artifacts`
- `test-ts`
- `test-py`
- `test`
- `guidelines`
- `reality`
- `aider-context`
- `llm-health`
- `llm-api`
- `llm-fake-demo`
- `litellm-proxy`
- `aider`
- `clean`

## Node.js Scripts (`package.json`)

Evidence-grounded developer execution-policy twin for Subactor histories.

- `npm run build` — `tsc -p tsconfig.json`
- `npm run demo` — `TWIN_NOW=2026-08-16T12:00:00Z node dist/src/cli.js demo --mode deterministic`
- `npm run validate` — `node dist/src/cli.js validate && python3 scripts/validate-schema.py`
- `npm run test:ts` — `node --test dist/tests/*.test.js`
- `npm run test:py` — `python3 -m unittest discover -s tests -p 'test_*.py'`
- `npm run test` — `npm run build && npm run test:ts && npm run test:py`

- **node**: `>=20`
- **python**: `>=3.10`

## Code Analysis

### `project/map.toon.yaml`

```toon markpact:analysis path=project/map.toon.yaml
# twin-developer | 93f 18066L | yaml:4,json:28,txt:2,md:19,shell:6,python:11,typescript:22 | 2026-08-16
# generated in 0.04s
# producer: code2llm | artifact: map.toon.yaml | schema: 1
# stats: 294 func | 0 cls | 93 mod | CC̄=3.5 | critical:4 | cycles:0
# alerts[5]: fan-out buildArtifacts=27; CC extractDeterministicRules=25; fan-out extractDeterministicRules=22; CC buildDeveloperTwin=21; CC TwinValidationError.validateGuidelines=20
# hotspots[5]: buildArtifacts fan=27; extractDeterministicRules fan=22; main fan=17; main fan=14; _real_structured fan=14
# evolution: CC̄ 3.6→3.5 (improved -0.1)
# Keys: M=modules, D=details, i=imports, e=exports, c=classes, f=functions, m=methods
M[93]:
  CHANGELOG.md,52
  Makefile,89
  README.md,446
  TODO.md,78
  config/litellm-proxy.yaml,34
  config/llm-routing.json,71
  config/model-registry.json,34
  config/rule-catalog.json,346
  config/source-policy.json,61
  data/context/example-task.md,3
  data/context/policy-dsl.README.md,35
  data/context/project.json,62
  data/context/subactor-cloud-v1.offer.json,97
  data/context/todo2code.README.md,927
  data/fixtures/minimal-twin.json,54
  data/fixtures/shell-history.txt,4
  data/normalized/extraction-map.json,91
  data/normalized/source-manifest.json,24
  data/output/VALIDATION.md,54
  data/output/aider-message.md,80
  data/output/developer-twin.md,236
  data/output/developer-twin.dsl.json,2680
  data/output/examples/llm-fake/developer-twin.md,246
  data/output/examples/llm-fake/developer-twin.dsl.json,2701
  data/output/examples/llm-fake/guidelines.json,89
  data/output/examples/llm-fake/guidelines.audit.json,6
  data/output/guidelines.json,89
  data/output/guidelines.audit.json,10
  data/output/offer-reality.md,39
  data/output/validation-receipt.json,67
  data/raw/history-cursor.json,1404
  data/raw/history-portal.md,1569
  docs/ARCHITECTURE.md,35
  docs/AUDIT_AND_AUTONOMY_PLAN.md,784
  docs/DSL.md,18
  docs/NEXT_STEPS.md,49
  docs/README.md,512
  docs/SECURITY.md,51
  docs/SOURCE_TRUTH.md,17
  llm_service/__init__.py,3
  llm_service/__main__.py,3
  llm_service/app.py,70
  llm_service/audit.py,46
  llm_service/cli.py,99
  llm_service/core.py,368
  llm_service/models.py,51
  package.json,25
  planfile.yaml,630
  prefact.yaml,94
  project2.sh,55
  requirements.txt,5
  schemas/developer-twin.schema.json,609
  schemas/guidelines.schema.json,29
  schemas/llm-intent-extraction.schema.json,33
  schemas/llm-routing.schema.json,44
  schemas/local-ticket-intent.schema.json,35
  schemas/model-registry.schema.json,38
  schemas/project-context.schema.json,36
  schemas/rule-catalog.schema.json,53
  schemas/source-policy.schema.json,64
  scripts/check-flag-parity.py,70
  scripts/check-schema-identity.py,101
  scripts/llmctl.sh,5
  scripts/render-litellm-config.py,80
  scripts/run-aider.sh,37
  scripts/run-fake-llm-demo.sh,24
  scripts/run-litellm-proxy.sh,10
  scripts/validate-schema.py,56
  scripts/verify-artifacts.sh,57
  src/aider/prompt.ts,45
  src/cli.ts,329
  src/extract/deterministic.ts,146
  src/ingest/index.ts,32
  src/ingest/common.ts,35
  src/ingest/cursor.ts,65
  src/ingest/jsonl.ts,27
  src/ingest/markdown.ts,66
  src/ingest/plain.ts,22
  src/ingest/shell.ts,27
  src/llm/client.ts,138
  src/node-shims.d.ts,45
  src/reality/offer.ts,144
  src/twin/aggregate.ts,199
  src/twin/guidelines.ts,71
  src/twin/render.ts,55
  src/twin/validate.ts,136
  src/types.ts,232
  src/util/command.ts,65
  src/util/files.ts,29
  src/util/hash.ts,9
  src/util/text.ts,47
  testql-scenarios/generated-from-pytests.testql.toon.yaml,10
  tsconfig.json,18
D:
  src/extract/deterministic.ts:
    i: ../util/hash.js,../util/text.js
    e: DeterministicExtraction,rankingWeight,eventMatches,haystack,supportingEvent,effectiveClass,extractDeterministicRules,matches,matchedEntriesByEvent,rows,current,evidenceByEvent,entries,repeated,sourceClass,rows,refs,correctionBoost,repetitionBoost,avgIntentWeight,confidence,dockerRule
    DeterministicExtraction:
    rankingWeight()
    eventMatches()
    haystack()
    supportingEvent()
    effectiveClass()
    extractDeterministicRules()
    matches()
    matchedEntriesByEvent()
    rows()
    current()
    evidenceByEvent()
    entries()
    repeated()
    sourceClass()
    rows()
    refs()
    correctionBoost()
    repetitionBoost()
    avgIntentWeight()
    confidence()
    dockerRule()
  src/twin/aggregate.ts:
    i: ../util/files.js,../util/hash.js,../util/text.js
    e: candidateRules,known,index,missing,buildWorkflow,buildModelStages,buildDeveloperTwin,candidateResult,id
    candidateRules()
    known()
    index()
    missing()
    buildWorkflow()
    buildModelStages()
    buildDeveloperTwin()
    candidateResult()
    id()
  src/twin/validate.ts:
    i: ../types.js,../util/command.js
    e: TwinValidationError
    TwinValidationError: super(-1),validateGenerator(-1),evidenceIndex(-1),evidenceIds(-1),evidenceSet(-1),validateRules(-1),ruleIds(-1),evidenceActors(-1),missing(-1),agentOnly(-1),validateWorkflow(-1),orders(-1),validateTwin(-1),validateGenerator(-1),evidenceSet(-1),validateRules(-1),validateWorkflow(-1),validateIntentCandidates(-1),row(-1),candidate(-1),validateGuidelines(-1),row(-1),knownRules(-1),step(-1),verdict(-1)
  src/reality/offer.ts:
    i: ../types.js,../util/text.js
    e: OfferPlan,OfferCatalog,OfferRealityReport,price,cleaned,extractPlanPrice,escaped,forward,backward,reconcileOfferHistory,currentPlans,currentById,normalized,claimed,current,matchesCurrent,blocking,renderOfferRealityMarkdown
    OfferPlan:
    OfferCatalog:
    OfferRealityReport:
    price()
    cleaned()
    extractPlanPrice()
    escaped()
    forward()
    backward()
    reconcileOfferHistory()
    currentPlans()
    currentById()
    normalized()
    claimed()
    current()
    matchesCurrent()
    blocking()
    renderOfferRealityMarkdown()
  src/twin/render.ts:
    i: ../types.js
    e: escapeCell,renderTwinMarkdown,renderGuidelinesMarkdown
    escapeCell()
    renderTwinMarkdown()
    renderGuidelinesMarkdown()
  src/llm/client.ts:
    i: ../types.js
    e: LlmServiceError,LlmProvenance,LlmResult
    LlmServiceError: super(-1),readProvenance(-1),provider(-1),model(-1),authHeaders(-1),token(-1),postJson(-1),controller(-1),timer(-1),response(-1),text(-1),detail(-1),clearTimeout(-1),serviceHealth(-1),controller(-1),timer(-1),response(-1),clearTimeout(-1),DEFAULT_EVENT_WINDOW(-1),eventWindowSize(-1),raw(-1),parsed(-1),extractIntentCandidatesWithLlm(-1),humanEvents(-1),windowSize(-1),window(-1),result(-1),generateGuidelinesWithLlm(-1)
    LlmProvenance:
    LlmResult:
  src/ingest/index.ts:
    i: ../types.js,./cursor.js,./jsonl.js,./markdown.js,./plain.js,./shell.js,node:path
    e: ingestFiles,sequence,lower
    ingestFiles()
    sequence()
    lower()
  llm_service/cli.py:
    e: _guard_bind,_read,_write,parser,main
    _guard_bind(host)
    _read(path)
    _write(value;path)
    parser()
    main(argv)
  llm_service/core.py:
    e: LlmConfigurationError,LlmResponseError,Route,Provenance,_sha,_root,_routing,flag_enabled,_route_enabled,_registry,_stage_entry,_schema,_prefixed,resolve_route,_fake_intents,_fake_guidelines,_extract_text,_real_structured,fake_mode,_provenance,_run_stage,complete_intents,complete_guidelines,complete_chat,health
    LlmConfigurationError(RuntimeError):
    LlmResponseError(RuntimeError):
    Route:
    Provenance: headers(0)  # Kto faktycznie wyprodukował artefakt.

Bez tego rekordu wyni...
    _sha(value)
    _root()
    _routing()
    flag_enabled(name;default)
    _route_enabled(route_id)
    _registry()
    _stage_entry(stage)
    _schema(name)
    _prefixed(provider;model)
    resolve_route(stage;explicit_model)
    _fake_intents(payload)
    _fake_guidelines(payload)
    _extract_text(response)
    _real_structured(stage;payload;schema;system)
    fake_mode()
    _provenance(audit;ref)
    _run_stage(stage;payload;schema_name;system;fake)
    complete_intents(payload)
    complete_guidelines(payload)
    complete_chat(messages;model;temperature;max_tokens)
    health()
  src/ingest/jsonl.ts:
    i: ../types.js,./common.js,node:fs/promises
    e: ingestJsonl,lines,sequence,parsed,eventSequence,event
    ingestJsonl()
    lines()
    sequence()
    parsed()
    eventSequence()
    event()
  src/util/command.ts:
    e: CommandVerdict,MAX_LENGTH,tokenizeCommand,checkCommand,syntax,tokens,allowedTokens,extra,unsafe,isAllowedCommand
    CommandVerdict:
    MAX_LENGTH()
    tokenizeCommand()
    checkCommand()
    syntax()
    tokens()
    allowedTokens()
    extra()
    unsafe()
    isAllowedCommand()
  scripts/check-schema-identity.py:
    e: walk,owned,main
    walk(node;path)
    owned(value)
    main()
  scripts/check-flag-parity.py:
    e: routing_flags,env_example_values,main
    routing_flags()
    env_example_values()
    main()
  src/ingest/markdown.ts:
    i: ../types.js,./common.js,node:fs/promises
    e: cleanHumanBlock,beforeTrace,ingestMarkdownTranscript,text,sequence,current,next,role,start,end,block,human,event,agent
    cleanHumanBlock()
    beforeTrace()
    ingestMarkdownTranscript()
    text()
    sequence()
    current()
    next()
    role()
    start()
    end()
    block()
    human()
    event()
    agent()
  src/twin/guidelines.ts:
    i: ../types.js,../util/text.js
    e: ProjectContext,selectRules,normalized,catalogById,selected,entry,needles,fallback,left,right,generateDeterministicGuidelines,rules,validationCommands,order,commands,ruleRefs
    ProjectContext:
    selectRules()
    normalized()
    catalogById()
    selected()
    entry()
    needles()
    fallback()
    left()
    right()
    generateDeterministicGuidelines()
    rules()
    validationCommands()
    order()
    commands()
    ruleRefs()
  src/cli.ts:
    i: ./aider/prompt.js,./extract/deterministic.js,./ingest/index.js,./llm/client.js,./reality/offer.js,./twin/aggregate.js,./twin/guidelines.js,./twin/render.js,./twin/validate.js,./util/files.js,./util/hash.js,node:fs/promises,node:path
    e: RuleCatalogFile,OfferCatalog,flag,index,flags,rootPath,rel,modeFromArgs,mode,defaultInputPaths,provided,values,readEventsJsonl,text,writeEventsJsonl,loadCore,buildArtifacts,absoluteInputs,rawEvents,events,content,sourceFile,extraction,llmCandidates,llmUsed,degraded,response,twin,buildGuidelineArtifacts,twin,task,deterministic,guidelines,response,buildOfferRealityArtifacts,eventsPath,events,catalog,report,buildAiderArtifacts,twin,guidelines,project,task,commandBuild,root,mode,llmUrl,result,commandValidate,root,path,twin,diagnostics,commandGuidelines,root,mode,llmUrl,result,commandReality,root,commandAider,root,commandDemo,root,mode,llmUrl,guidelines,usage,main,command
    RuleCatalogFile:
    OfferCatalog:
    flag()
    index()
    flags()
    rootPath()
    rel()
    modeFromArgs()
    mode()
    defaultInputPaths()
    provided()
    values()
    readEventsJsonl()
    text()
    writeEventsJsonl()
    loadCore()
    buildArtifacts()
    absoluteInputs()
    rawEvents()
    events()
    content()
    sourceFile()
    extraction()
    llmCandidates()
    llmUsed()
    degraded()
    response()
    twin()
    buildGuidelineArtifacts()
    twin()
    task()
    deterministic()
    guidelines()
    response()
    buildOfferRealityArtifacts()
    eventsPath()
    events()
    catalog()
    report()
    buildAiderArtifacts()
    twin()
    guidelines()
    project()
    task()
    commandBuild()
    root()
    mode()
    llmUrl()
    result()
    commandValidate()
    root()
    path()
    twin()
    diagnostics()
    commandGuidelines()
    root()
    mode()
    llmUrl()
    result()
    commandReality()
    root()
    commandAider()
    root()
    commandDemo()
    root()
    mode()
    llmUrl()
    guidelines()
    usage()
    main()
    command()
  src/ingest/cursor.ts:
    i: ../types.js,./common.js,node:fs/promises
    e: CursorExport,decodeJsonString,extractTipTapText,combined,ingestCursorExport,parsed,sequence,blobIndex,message,event
    CursorExport:
    decodeJsonString()
    extractTipTapText()
    combined()
    ingestCursorExport()
    parsed()
    sequence()
    blobIndex()
    message()
    event()
  src/ingest/common.ts:
    i: ../types.js,../util/hash.js,../util/text.js,node:path
    e: createEvent,text,redactedText,isCorrection,sourceClass,contentHash,id
    createEvent()
    text()
    redactedText()
    isCorrection()
    sourceClass()
    contentHash()
    id()
  src/ingest/shell.ts:
    i: ../types.js,./common.js,node:fs/promises
    e: ingestShellHistory,lines,sequence,command,event
    ingestShellHistory()
    lines()
    sequence()
    command()
    event()
  src/aider/prompt.ts:
    i: ../types.js
    e: buildAiderMessage,selected
    buildAiderMessage()
    selected()
  scripts/render-litellm-config.py:
    e: litellm_openrouter_model,render,main
    litellm_openrouter_model(model_id)
    render(use_env)
    main()
  llm_service/app.py:
    e: require_token,healthz,extract_intents,generate_guidelines,chat_completions
    require_token(x_twin_token)
    healthz()
    extract_intents(request)
    generate_guidelines(request)
    chat_completions(request)
  src/node-shims.d.ts:
    e: createHash,readFile,writeFile,mkdir,mkdtemp,rm,basename,dirname,extname,relative,resolve,join,tmpdir
    createHash()
    readFile()
    writeFile()
    mkdir()
    mkdtemp()
    rm()
    basename()
    dirname()
    extname()
    relative()
    resolve()
    join()
    tmpdir()
  src/util/text.ts:
    e: redactSecrets,output,compactWhitespace,normalizeForMatch,excerpt,normalized,isLikelyCorrection,normalized,uniqueStrings
    redactSecrets()
    output()
    compactWhitespace()
    normalizeForMatch()
    excerpt()
    normalized()
    isLikelyCorrection()
    normalized()
    uniqueStrings()
  scripts/validate-schema.py:
    e: validate,validate_tickets
    validate(schema_name;document_name)
    validate_tickets()
  llm_service/audit.py:
    e: _path,audit_ref,append_audit
    _path()
    audit_ref(record)
    append_audit(record)
  src/ingest/plain.ts:
    i: ../types.js,./common.js,node:fs/promises
    e: ingestPlainText,text,blocks,sequence,event
    ingestPlainText()
    text()
    blocks()
    sequence()
    event()
  src/util/files.ts:
    i: node:fs/promises,node:path
    e: readJson,text,writeJson,absolute,writeText,absolute,nowIso,forced,parsed
    readJson()
    text()
    writeJson()
    absolute()
    writeText()
    absolute()
    nowIso()
    forced()
    parsed()
  src/util/hash.ts:
    i: node:crypto
    e: sha256,stableId
    sha256()
    stableId()
  planfile.yaml:
  tsconfig.json:
  requirements.txt:
  TODO.md:
  project2.sh:
  package.json:
  prefact.yaml:
  CHANGELOG.md:
  schemas/llm-intent-extraction.schema.json:
  schemas/guidelines.schema.json:
  schemas/rule-catalog.schema.json:
  schemas/developer-twin.schema.json:
  llm_service/__init__.py:
  llm_service/__main__.py:
  llm_service/models.py:
    e: StrictModel,EventInput,EvidenceInput,IntentRequest,GuidelinesRequest,ChatMessage,ChatRequest
    StrictModel(BaseModel):
    EventInput(StrictModel):
    EvidenceInput(StrictModel):
    IntentRequest(StrictModel):
    GuidelinesRequest(StrictModel):
    ChatMessage(StrictModel):
    ChatRequest(BaseModel):
  docs/DSL.md:
  docs/SOURCE_TRUTH.md:
  docs/NEXT_STEPS.md:
  docs/ARCHITECTURE.md:
  src/types.ts:
    e: PromptEvent,EvidenceRecord,TwinRule,RuleCatalogEntry,Diagnostic,TruthRanking,SourcePolicy,LlmRouteConfig,ModelRegistryStage,ModelRegistry,LlmRoutingConfig,DeveloperTwinDsl,IntentCandidate,IntentCandidateResponse,GuidelineStep,Guidelines
    PromptEvent:
    EvidenceRecord:
    TwinRule:
    RuleCatalogEntry:
    Diagnostic:
    TruthRanking:
    SourcePolicy:
    LlmRouteConfig:
    ModelRegistryStage:
    ModelRegistry:
    LlmRoutingConfig:
    DeveloperTwinDsl:
    IntentCandidate:
    IntentCandidateResponse:
    GuidelineStep:
    Guidelines:
  scripts/run-aider.sh:
  scripts/run-litellm-proxy.sh:
  scripts/llmctl.sh:
  scripts/run-fake-llm-demo.sh:
    e: cleanup
    cleanup()
  scripts/verify-artifacts.sh:
  testql-scenarios/generated-from-pytests.testql.toon.yaml:
  config/rule-catalog.json:
  config/litellm-proxy.yaml:
  config/source-policy.json:
  config/llm-routing.json:
  config/model-registry.json:
  data/normalized/extraction-map.json:
  data/normalized/source-manifest.json:
  data/output/developer-twin.md:
  data/output/offer-reality.md:
  data/output/VALIDATION.md:
  data/output/validation-receipt.json:
  data/output/guidelines.audit.json:
  data/output/aider-message.md:
  data/output/guidelines.json:
  data/output/developer-twin.dsl.json:
  data/output/examples/llm-fake/developer-twin.md:
  data/output/examples/llm-fake/guidelines.audit.json:
  data/output/examples/llm-fake/guidelines.json:
  data/output/examples/llm-fake/developer-twin.dsl.json:
  data/fixtures/shell-history.txt:
  data/fixtures/minimal-twin.json:
  data/context/policy-dsl.README.md:
  data/context/example-task.md:
  data/context/subactor-cloud-v1.offer.json:
  data/context/todo2code.README.md:
  data/raw/history-cursor.json:
  data/raw/history-portal.md:
  Makefile:
  README.md:
  schemas/project-context.schema.json:
  schemas/source-policy.schema.json:
  schemas/model-registry.schema.json:
  schemas/local-ticket-intent.schema.json:
  schemas/llm-routing.schema.json:
  docs/AUDIT_AND_AUTONOMY_PLAN.md:
  docs/SECURITY.md:
  docs/README.md:
  data/context/project.json:
```

### `project/logic.pl`

```prolog markpact:analysis path=project/logic.pl
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
```

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

## Intent

Subactor Developer Digital Twin
