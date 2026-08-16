<!-- code2docs:start --># twin-developer

![version](https://img.shields.io/badge/version-0.1.0-blue) ![typescript](https://img.shields.io/badge/typescript-%3E%3D20-3178C6) ![coverage](https://img.shields.io/badge/coverage-unknown-lightgrey) ![functions](https://img.shields.io/badge/functions-294-green)
> **294** functions | **40** classes | **107** files | CC̄ = 3.5

> Auto-generated project documentation from source code analysis.

**Author:** Tom Softreck <tom@sapletta.com>  
**License:** Not specified  
**Repository:** [https://github.com/subactor/twin-developer](https://github.com/subactor/twin-developer)

## Installation

### Requirements

- Node.js >=20
### From Source

```bash
git clone https://github.com/subactor/twin-developer
cd twin-developer
npm install
```

## Quick Start

```bash
npm install
npm start
```




## Architecture

```
twin-developer/
├── Makefile
├── tsconfig
├── requirements
├── project2
├── package
├── prefact
├── README
        ├── schema
        ├── schema
        ├── schema
        ├── schema
        ├── schema
        ├── schema
        ├── schema
        ├── schema
        ├── schema
    ├── cli
    ├── app
├── llm_service/
    ├── __main__
    ├── models
    ├── core
    ├── audit
    ├── DSL
    ├── SOURCE_TRUTH
    ├── NEXT_STEPS
    ├── AUDIT_AND_AUTONOMY_PLAN
    ├── ARCHITECTURE
    ├── SECURITY
    ├── README
    ├── types
    ├── cli
        ├── d
        ├── deterministic
        ├── offer
        ├── prompt
        ├── guidelines
        ├── aggregate
        ├── validate
        ├── render
        ├── client
        ├── jsonl
    ├── ingest/
        ├── markdown
        ├── common
        ├── cursor
        ├── shell
        ├── plain
        ├── files
        ├── hash
        ├── text
        ├── command
    ├── run-aider
    ├── run-litellm-proxy
    ├── validate-schema
    ├── llmctl
    ├── run-fake-llm-demo
    ├── check-schema-identity
    ├── verify-artifacts
    ├── render-litellm-config
    ├── check-flag-parity
            ├── toon
    ├── rule-catalog
    ├── litellm-proxy
    ├── source-policy
    ├── llm-routing
    ├── model-registry
        ├── extraction-map
        ├── source-manifest
        ├── developer-twin
        ├── offer-reality
        ├── VALIDATION
            ├── audit
        ├── aider-message
        ├── guidelines
        ├── validation-receipt
            ├── dsl
                ├── developer-twin
                    ├── audit
                ├── guidelines
                    ├── dsl
        ├── shell-history
        ├── minimal-twin
            ├── README
        ├── example-task
            ├── offer
            ├── README
        ├── project
        ├── history-cursor
        ├── history-portal
├── planfile
├── TODO
├── CHANGELOG
```

## API Overview

### Classes

- **`StrictModel`** — —
- **`EventInput`** — —
- **`EvidenceInput`** — —
- **`IntentRequest`** — —
- **`GuidelinesRequest`** — —
- **`ChatMessage`** — —
- **`ChatRequest`** — —
- **`LlmConfigurationError`** — —
- **`LlmResponseError`** — —
- **`Route`** — —
- **`Provenance`** — Kto faktycznie wyprodukował artefakt.
- **`PromptEvent`** — —
- **`EvidenceRecord`** — —
- **`TwinRule`** — —
- **`RuleCatalogEntry`** — —
- **`Diagnostic`** — —
- **`TruthRanking`** — —
- **`SourcePolicy`** — —
- **`LlmRouteConfig`** — —
- **`ModelRegistryStage`** — —
- **`ModelRegistry`** — —
- **`LlmRoutingConfig`** — —
- **`DeveloperTwinDsl`** — —
- **`IntentCandidate`** — —
- **`IntentCandidateResponse`** — —
- **`GuidelineStep`** — —
- **`Guidelines`** — —
- **`RuleCatalogFile`** — —
- **`OfferCatalog`** — —
- **`DeterministicExtraction`** — —
- **`OfferPlan`** — —
- **`OfferCatalog`** — —
- **`OfferRealityReport`** — —
- **`ProjectContext`** — —
- **`TwinValidationError`** — —
- **`LlmServiceError`** — —
- **`LlmProvenance`** — —
- **`LlmResult`** — —
- **`CursorExport`** — —
- **`CommandVerdict`** — —

### Functions

- `parser()` — —
- `main(argv)` — —
- `require_token(x_twin_token)` — Wymaga tokenu, gdy ``TWIN_API_TOKEN`` jest ustawiony.
- `healthz()` — —
- `extract_intents(request)` — —
- `generate_guidelines(request)` — —
- `chat_completions(request)` — —
- `flag_enabled(name, default)` — Jedna semantyka flag boolowskich dla całego projektu: brak zmiennej = default.
- `resolve_route(stage, explicit_model)` — —
- `fake_mode()` — —
- `complete_intents(payload)` — —
- `complete_guidelines(payload)` — —
- `complete_chat(messages, model, temperature, max_tokens)` — —
- `health()` — —
- `audit_ref(record)` — —
- `append_audit(record)` — Dopisuje rekord i zwraca jego referencję.
- `flag()` — —
- `index()` — —
- `flags()` — —
- `rootPath()` — —
- `rel()` — —
- `modeFromArgs()` — —
- `mode()` — —
- `defaultInputPaths()` — —
- `provided()` — —
- `values()` — —
- `readEventsJsonl()` — —
- `text()` — —
- `writeEventsJsonl()` — —
- `loadCore()` — —
- `buildArtifacts()` — —
- `absoluteInputs()` — —
- `rawEvents()` — —
- `events()` — —
- `content()` — —
- `sourceFile()` — —
- `extraction()` — —
- `llmCandidates()` — —
- `llmUsed()` — —
- `degraded()` — —
- `response()` — —
- `twin()` — —
- `buildGuidelineArtifacts()` — —
- `task()` — —
- `deterministic()` — —
- `guidelines()` — —
- `buildOfferRealityArtifacts()` — —
- `eventsPath()` — —
- `catalog()` — —
- `report()` — —
- `buildAiderArtifacts()` — —
- `project()` — —
- `commandBuild()` — —
- `root()` — —
- `llmUrl()` — —
- `result()` — —
- `commandValidate()` — —
- `path()` — —
- `diagnostics()` — —
- `commandGuidelines()` — —
- `commandReality()` — —
- `commandAider()` — —
- `commandDemo()` — —
- `usage()` — —
- `main()` — —
- `command()` — —
- `createHash()` — —
- `readFile()` — —
- `writeFile()` — —
- `mkdir()` — —
- `mkdtemp()` — —
- `rm()` — —
- `basename()` — —
- `dirname()` — —
- `extname()` — —
- `relative()` — —
- `resolve()` — —
- `join()` — —
- `tmpdir()` — —
- `rankingWeight()` — —
- `eventMatches()` — —
- `haystack()` — —
- `supportingEvent()` — —
- `effectiveClass()` — —
- `extractDeterministicRules()` — —
- `matches()` — —
- `matchedEntriesByEvent()` — —
- `rows()` — —
- `current()` — —
- `evidenceByEvent()` — —
- `entries()` — —
- `repeated()` — —
- `sourceClass()` — —
- `refs()` — —
- `correctionBoost()` — —
- `repetitionBoost()` — —
- `avgIntentWeight()` — —
- `confidence()` — —
- `dockerRule()` — —
- `price()` — —
- `cleaned()` — —
- `extractPlanPrice()` — —
- `escaped()` — —
- `forward()` — —
- `backward()` — —
- `reconcileOfferHistory()` — —
- `currentPlans()` — —
- `currentById()` — —
- `normalized()` — —
- `claimed()` — —
- `current()` — —
- `matchesCurrent()` — —
- `blocking()` — —
- `renderOfferRealityMarkdown()` — —
- `buildAiderMessage()` — —
- `selected()` — —
- `selectRules()` — —
- `normalized()` — —
- `catalogById()` — —
- `selected()` — —
- `entry()` — —
- `needles()` — —
- `fallback()` — —
- `left()` — —
- `right()` — —
- `generateDeterministicGuidelines()` — —
- `rules()` — —
- `validationCommands()` — —
- `order()` — —
- `commands()` — —
- `ruleRefs()` — —
- `candidateRules()` — —
- `known()` — —
- `index()` — —
- `missing()` — —
- `buildWorkflow()` — —
- `buildModelStages()` — —
- `buildDeveloperTwin()` — —
- `candidateResult()` — —
- `id()` — —
- `escapeCell()` — —
- `renderTwinMarkdown()` — —
- `renderGuidelinesMarkdown()` — —
- `ingestJsonl()` — —
- `lines()` — —
- `sequence()` — —
- `parsed()` — —
- `eventSequence()` — —
- `event()` — —
- `ingestFiles()` — —
- `sequence()` — —
- `lower()` — —
- `cleanHumanBlock()` — —
- `beforeTrace()` — —
- `ingestMarkdownTranscript()` — —
- `text()` — —
- `sequence()` — —
- `current()` — —
- `next()` — —
- `role()` — —
- `start()` — —
- `end()` — —
- `block()` — —
- `human()` — —
- `event()` — —
- `agent()` — —
- `createEvent()` — —
- `text()` — —
- `redactedText()` — —
- `isCorrection()` — —
- `sourceClass()` — —
- `contentHash()` — —
- `id()` — —
- `decodeJsonString()` — —
- `extractTipTapText()` — —
- `combined()` — —
- `ingestCursorExport()` — —
- `parsed()` — —
- `sequence()` — —
- `blobIndex()` — —
- `message()` — —
- `event()` — —
- `ingestShellHistory()` — —
- `lines()` — —
- `sequence()` — —
- `command()` — —
- `event()` — —
- `ingestPlainText()` — —
- `text()` — —
- `blocks()` — —
- `sequence()` — —
- `event()` — —
- `readJson()` — —
- `text()` — —
- `writeJson()` — —
- `absolute()` — —
- `writeText()` — —
- `nowIso()` — —
- `forced()` — —
- `parsed()` — —
- `sha256()` — —
- `stableId()` — —
- `redactSecrets()` — —
- `output()` — —
- `compactWhitespace()` — —
- `normalizeForMatch()` — —
- `excerpt()` — —
- `normalized()` — —
- `isLikelyCorrection()` — —
- `uniqueStrings()` — —
- `MAX_LENGTH()` — —
- `tokenizeCommand()` — —
- `checkCommand()` — —
- `syntax()` — —
- `tokens()` — —
- `allowedTokens()` — —
- `extra()` — —
- `unsafe()` — —
- `isAllowedCommand()` — —
- `validate(schema_name, document_name)` — —
- `validate_tickets()` — Waliduje LOKALNY kontrakt ticketów.
- `cleanup()` — —
- `walk(node, path)` — —
- `owned(value)` — —
- `main()` — —
- `litellm_openrouter_model(model_id)` — —
- `render(use_env)` — —
- `main()` — —
- `routing_flags()` — —
- `env_example_values()` — —
- `main()` — —


## Project Structure

📄 `CHANGELOG`
📄 `Makefile`
📄 `README`
📄 `TODO`
📄 `config.litellm-proxy`
📄 `config.llm-routing`
📄 `config.model-registry`
📄 `config.rule-catalog`
📄 `config.source-policy`
📄 `data.context.example-task`
📄 `data.context.policy-dsl.README`
📄 `data.context.project`
📄 `data.context.subactor-cloud-v1.offer`
📄 `data.context.todo2code.README`
📄 `data.fixtures.minimal-twin`
📄 `data.fixtures.shell-history`
📄 `data.normalized.extraction-map`
📄 `data.normalized.source-manifest`
📄 `data.output.VALIDATION`
📄 `data.output.aider-message`
📄 `data.output.developer-twin`
📄 `data.output.developer-twin.dsl`
📄 `data.output.examples.llm-fake.developer-twin`
📄 `data.output.examples.llm-fake.developer-twin.dsl`
📄 `data.output.examples.llm-fake.guidelines`
📄 `data.output.examples.llm-fake.guidelines.audit`
📄 `data.output.guidelines`
📄 `data.output.guidelines.audit`
📄 `data.output.offer-reality`
📄 `data.output.validation-receipt`
📄 `data.raw.history-cursor`
📄 `data.raw.history-portal`
📄 `docs.ARCHITECTURE`
📄 `docs.AUDIT_AND_AUTONOMY_PLAN`
📄 `docs.DSL`
📄 `docs.NEXT_STEPS`
📄 `docs.README`
📄 `docs.SECURITY`
📄 `docs.SOURCE_TRUTH`
📦 `llm_service`
📄 `llm_service.__main__`
📄 `llm_service.app` (5 functions)
📄 `llm_service.audit` (3 functions)
📄 `llm_service.cli` (5 functions)
📄 `llm_service.core` (22 functions, 4 classes)
📄 `llm_service.models` (7 classes)
📄 `package`
📄 `planfile`
📄 `prefact`
📄 `project2`
📄 `requirements`
📄 `schemas.developer-twin.schema`
📄 `schemas.guidelines.schema`
📄 `schemas.llm-intent-extraction.schema`
📄 `schemas.llm-routing.schema`
📄 `schemas.local-ticket-intent.schema`
📄 `schemas.model-registry.schema`
📄 `schemas.project-context.schema`
📄 `schemas.rule-catalog.schema`
📄 `schemas.source-policy.schema`
📄 `scripts.check-flag-parity` (3 functions)
📄 `scripts.check-schema-identity` (3 functions)
📄 `scripts.llmctl`
📄 `scripts.render-litellm-config` (3 functions)
📄 `scripts.run-aider`
📄 `scripts.run-fake-llm-demo` (1 functions)
📄 `scripts.run-litellm-proxy`
📄 `scripts.validate-schema` (2 functions)
📄 `scripts.verify-artifacts`
📄 `src.aider.prompt` (2 functions)
📄 `src.cli` (69 functions, 2 classes)
📄 `src.extract.deterministic` (21 functions, 1 classes)
📦 `src.ingest` (3 functions)
📄 `src.ingest.common` (7 functions)
📄 `src.ingest.cursor` (9 functions, 1 classes)
📄 `src.ingest.jsonl` (6 functions)
📄 `src.ingest.markdown` (14 functions)
📄 `src.ingest.plain` (5 functions)
📄 `src.ingest.shell` (5 functions)
📄 `src.llm.client` (28 functions, 3 classes)
📄 `src.node-shims.d` (13 functions)
📄 `src.reality.offer` (15 functions, 3 classes)
📄 `src.twin.aggregate` (9 functions)
📄 `src.twin.guidelines` (15 functions, 1 classes)
📄 `src.twin.render` (3 functions)
📄 `src.twin.validate` (25 functions, 1 classes)
📄 `src.types` (16 classes)
📄 `src.util.command` (9 functions, 1 classes)
📄 `src.util.files` (9 functions)
📄 `src.util.hash` (2 functions)
📄 `src.util.text` (9 functions)
📄 `testql-scenarios.generated-from-pytests.testql.toon`
📄 `tsconfig`

## Requirements



## Contributing

**Contributors:**
- Tom Softreck <tom@sapletta.com>

We welcome contributions! Open an issue or pull request to get started.
### Development Setup

```bash
# Clone the repository
git clone https://github.com/subactor/twin-developer
cd twin-developer

# Install dependencies
npm install

# Run tests
npm test
```


<!-- code2docs:end -->