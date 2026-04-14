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

There is no linter or type checker configured for either frontend or backend.

## Environment Variables

Configured in `.env` at project root (copy from `.env.example`). The backend loads this via `python-dotenv` in `app/config.py`, resolving the path relative to `backend/`'s parent directory.

- `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL_NAME` — LLM provider (OpenAI SDK format). Default model: `gpt-4o-mini`, default base URL: OpenAI's API.
- `ZEP_API_KEY` — Zep Cloud for graph memory
- `OASIS_DEFAULT_MAX_ROUNDS` — Default simulation rounds (default: 10)
- `REPORT_AGENT_MAX_TOOL_CALLS` / `REPORT_AGENT_MAX_REFLECTION_ROUNDS` / `REPORT_AGENT_TEMPERATURE` — ReACT agent tuning (defaults: 5, 2, 0.5)

## Architecture

### Backend (`backend/`) — Python >=3.11 <=3.12, Flask, managed with `uv`

Python version is constrained to <=3.12 due to OASIS/camel-ai compatibility.

Three Flask blueprints under `app/api/`: `graph` (`/api/graph`), `simulation` (`/api/simulation`), `report` (`/api/report`). Business logic lives in `app/services/`, utilities in `app/utils/`.

### Frontend (`frontend/`) — Vue 3 + Vite + Vue Router + vue-i18n

Vite dev server runs on port 3000 and proxies `/api/*` to `http://127.0.0.1:5001`. Path aliases: `@` → `src/`, `@locales` → `../locales`.

No global state manager (Pinia/Vuex). State is component-local `ref()`s, with one small `reactive()` store in `src/store/pendingUpload.js` for bridging file uploads between Home and MainView.

Routes follow the 5-step workflow:
- `/` → Home (project listing)
- `/process/:projectId` → MainView (Steps 1-2: graph build + env setup)
- `/simulation/:simulationId` → SimulationView (Step 3 config)
- `/simulation/:simulationId/start` → SimulationRunView (active simulation)
- `/report/:reportId` → ReportView (Step 4)
- `/interaction/:reportId` → InteractionView (Step 5)

### Shared Localization (`locales/`)

i18n JSON files (zh, en, es, fr, pt, ru, de) live at project root, shared between backend (`app/utils/locale.py`) and frontend (`vue-i18n`). Default locale is `zh`. The frontend sends `Accept-Language` headers; the backend uses these for localized responses.

## Key Architectural Patterns

### Simulation Subprocess + Filesystem IPC

Simulations run OASIS in a separate Python subprocess (`subprocess.Popen`). Communication between Flask and the subprocess uses **filesystem-based IPC** — not sockets or queues. Commands are written as JSON files to `{simulation_dir}/ipc_commands/`, and the subprocess writes responses to `{simulation_dir}/ipc_responses/`. The Flask side polls for responses (0.5s interval, 60-120s timeout). An `env_status.json` file serves as the subprocess health check. This is implemented across `simulation_runner.py`, `simulation_ipc.py`, and the scripts in `backend/scripts/`.

### Dual-Platform Parallel Simulation

Simulations can run on Twitter and Reddit platforms simultaneously. Each platform has independent round tracking, action logging, and progress. Actions are written to `actions.jsonl` and parsed in real-time by a background monitor thread. Completion is detected via a `simulation_end` event in the JSONL stream.

### Async Task Polling Pattern

Long-running operations (graph building, simulation prep, report generation) follow a consistent pattern: the API returns a task/resource ID immediately, and the frontend polls for status at intervals (typically 2s for tasks, 10s for graph data). The frontend uses `requestWithRetry(fn, maxRetries=3, delay=1000)` with exponential backoff for transient failures.

### ReACT Report Agent

`report_agent.py` implements a multi-stage LLM agent: planning (outline generation) → per-section ReACT loops (think → tool call → reflect). Tool calls use XML format: `<tool_call>{"name": "...", "parameters": ...}</tool_call>` with fallback to bare JSON parsing. Available tools query Zep (semantic search, entity search, insights) and interview simulation agents via IPC. Logging goes to both `agent_log.jsonl` (structured) and `console_log.txt` (human-readable).

### LLM Client Quirks

`app/utils/llm_client.py` wraps the OpenAI SDK. It strips `<think>...</think>` tags from responses (MiniMax M2.5 compatibility) and cleans markdown code fences from JSON responses. `chat_json()` uses `response_format: json_object` for structured output. `ensure_ascii=False` is used throughout for direct Chinese character output.

## Key Dependencies

- **OASIS** (`camel-oasis`, `camel-ai`) — Social simulation engine (Twitter/Reddit platforms)
- **Zep Cloud** (`zep-cloud`) — Graph memory storage, semantic search, and entity relationships
- **OpenAI SDK** — LLM calls (compatible with any OpenAI-format API)
- **D3.js** — Frontend graph visualization with force-directed layout

## Workflow Pipeline

1. **Graph Building** — Upload files → parse/chunk text → extract ontology via LLM → send to Zep as episodes → Zep builds knowledge graph
2. **Environment Setup** — Read entities from graph → LLM generates agent personas (Twitter CSV / Reddit JSON format) → LLM generates simulation config
3. **Simulation** — OASIS runs in subprocess → agents interact over rounds on Twitter/Reddit → results streamed via filesystem IPC → graph memory updated per round
4. **Report** — ReACT agent generates structured prediction report using Zep tools (search, insights, agent interviews)
5. **Interaction** — Chat with report agent or individual simulation agents via IPC interview commands
