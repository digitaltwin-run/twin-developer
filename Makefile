SHELL := /usr/bin/env bash
PYTHON ?= python3
NODE ?= node
NPM ?= npm
TWIN_LLM_PORT ?= 8099

# Konfiguracja prywatna ładowana jawnie. Bez tego posture zależała od tego,
# czy operator pamiętał o `set -a; source .env` — a brak flagi znaczył
# "trasa włączona", więc zapomnienie otwierało wyjście do zewnętrznego dostawcy.
ifneq (,$(wildcard .env))
include .env
export
endif

.PHONY: help setup build demo validate verify-artifacts test test-ts test-py guidelines reality aider-context llm-health llm-api llm-fake-demo litellm-proxy aider clean

help:
	@printf '%s\n' \
	  'make setup          - install Node/Python dependencies' \
	  'make build          - compile TypeScript' \
	  'make demo           - deterministic end-to-end run on data/raw' \
	  'make llm-fake-demo  - end-to-end run through Python REST with fake structured LLM' \
	  'make validate       - runtime validation + JSON Schema + reproducibility gate' \
	  'make verify-artifacts - regenerate and compare committed artifacts' \
	  'make test           - TypeScript and Python tests' \
	  'make llm-api        - start Python REST service on 127.0.0.1:8099' \
	  'make litellm-proxy  - start LiteLLM proxy on 127.0.0.1:4000' \
	  'make aider-context  - regenerate validated Aider message' \
	  'make aider          - run Aider (dry-run unless AIDER_APPLY=1)'

setup:
	$(NPM) install
	$(PYTHON) -m venv .venv
	.venv/bin/python -m pip install --upgrade pip
	.venv/bin/python -m pip install -r requirements.txt

build:
	$(PYTHON) scripts/render-litellm-config.py --check
	$(NPM) run build

demo: build
	TWIN_NOW=2026-08-16T12:00:00Z $(NODE) dist/src/cli.js demo --mode deterministic

validate: build
	$(NODE) dist/src/cli.js validate
	$(PYTHON) scripts/validate-schema.py
	$(PYTHON) scripts/check-schema-identity.py
	$(PYTHON) scripts/check-flag-parity.py
	$(MAKE) verify-artifacts

verify-artifacts: build
	scripts/verify-artifacts.sh

test-ts: build
	$(NODE) --test dist/tests/*.test.js

test-py:
	$(PYTHON) -m unittest discover -s tests -p 'test_*.py'

test: test-ts test-py

guidelines: build
	$(NODE) dist/src/cli.js guidelines --mode deterministic

reality: build
	$(NODE) dist/src/cli.js reality-offer

aider-context: build
	$(NODE) dist/src/cli.js aider-context

llm-health:
	$(PYTHON) -m llm_service.cli health

llm-api:
	$(PYTHON) -m llm_service.cli serve --host 127.0.0.1 --port $(TWIN_LLM_PORT)

llm-fake-demo: build
	TWIN_LLM_PORT=$(TWIN_LLM_PORT) scripts/run-fake-llm-demo.sh

litellm-proxy:
	scripts/run-litellm-proxy.sh

aider: aider-context
	scripts/run-aider.sh $(AIDER_ARGS)

clean:
	rm -rf dist __pycache__ llm_service/__pycache__ tests/__pycache__
	rm -f data/output/*.json data/output/*.md data/output/*.jsonl data/output/*.log data/output/*.yaml
	rm -f data/normalized/*.json data/normalized/*.jsonl
