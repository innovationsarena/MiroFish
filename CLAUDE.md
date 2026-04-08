# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiroFish is a multi-agent swarm intelligence prediction engine. Users upload seed materials (reports, articles), and the system builds a knowledge graph, generates agent personas, runs social simulations via the OASIS platform, and produces prediction reports.

## Common Commands

```bash
# Install all dependencies (Node + Python)
npm run setup:all

# Start both frontend and backend in dev mode
npm run dev

# Start individually
npm run backend    # Flask backend on :5001
npm run frontend   # Vite frontend on :3000

# Build frontend for production
npm run build

# Run backend tests
cd backend && uv run pytest

# Run a single backend test
cd backend && uv run pytest path/to/test.py -k "test_name"

# Docker
docker compose up -d
```

## Environment Variables

Configured in `.env` at project root (copy from `.env.example`):
- `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL_NAME` - LLM provider (OpenAI SDK format)
- `ZEP_API_KEY` - Zep Cloud for graph memory

## Architecture

**Backend** (`backend/`) - Python 3.11+, Flask, managed with `uv`

- `app/__init__.py` - Flask app factory with CORS, blueprint registration
- `app/config.py` - All configuration via env vars, loads `.env` from project root
- `app/api/` - Three Flask blueprints:
  - `graph` (`/api/graph`) - Knowledge graph building and retrieval
  - `simulation` (`/api/simulation`) - Simulation lifecycle management
  - `report` (`/api/report`) - Report generation and agent chat
- `app/services/` - Core business logic:
  - `graph_builder.py` - Builds Zep standalone graphs from uploaded text
  - `text_processor.py` - File parsing and text chunking
  - `ontology_generator.py` - LLM-based ontology extraction
  - `zep_entity_reader.py` - Reads entities/relationships from Zep graphs
  - `oasis_profile_generator.py` - Generates agent personas from graph entities
  - `simulation_config_generator.py` - LLM-generated simulation parameters
  - `simulation_runner.py` - Runs OASIS simulations in subprocess with IPC
  - `simulation_ipc.py` - IPC protocol between Flask and simulation subprocess
  - `simulation_manager.py` - Simulation state tracking
  - `zep_graph_memory_updater.py` - Updates Zep graph with simulation results
  - `report_agent.py` - ReACT-pattern report generation with tool use
  - `zep_tools.py` - Zep search/insight tools used by report agent
- `app/utils/` - LLM client wrapper, file parser, logger, retry, locale
- `scripts/` - Standalone simulation runners (Twitter/Reddit/parallel)

**Frontend** (`frontend/`) - Vue 3 + Vite + Vue Router + vue-i18n

- Views follow the 5-step workflow: Home -> MainView (step-based process) -> SimulationView -> SimulationRunView -> ReportView -> InteractionView
- Components map to workflow steps: `Step1GraphBuild`, `Step2EnvSetup`, `Step3Simulation`, `Step4Report`, `Step5Interaction`
- `api/` - Axios API clients matching backend blueprints
- `GraphPanel.vue` - D3-based knowledge graph visualization

**Localization** (`locales/`) - i18n JSON files (en, zh), used by both backend (`utils/locale.py`) and frontend (`vue-i18n`)

## Key Dependencies

- **OASIS** (`camel-oasis`, `camel-ai`) - Social media simulation engine (Twitter/Reddit platforms)
- **Zep Cloud** (`zep-cloud`) - Graph memory storage and retrieval
- **OpenAI SDK** - LLM calls (compatible with any OpenAI-format API)
- **D3.js** - Frontend graph visualization

## Workflow Pipeline

1. **Graph Building** - Upload files -> parse/chunk text -> send to Zep as episodes -> Zep builds knowledge graph
2. **Environment Setup** - Read entities from graph -> LLM generates agent personas -> LLM generates simulation config
3. **Simulation** - OASIS runs in subprocess (Twitter or Reddit platform) -> agents interact over rounds -> results streamed via IPC -> graph memory updated per round
4. **Report** - ReACT agent generates structured report using Zep tools (search, insights, interviews)
5. **Interaction** - Chat with report agent or individual simulation agents
