<div align="center">

# EduAgent AI

**An AI study tutor that connects to your virtual classroom, learns your course materials and helps you study.**

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org)
[![Agent](https://img.shields.io/badge/agent-LangGraph-1C3C3C?logo=langchain&logoColor=white)](https://github.com/langchain-ai/langgraph)
[![LLM](https://img.shields.io/badge/LLM-Claude%20%2F%20Gemini-D97757?logo=anthropic&logoColor=white)](https://anthropic.com)
[![DB](https://img.shields.io/badge/database-Supabase%20%2B%20pgvector-3ECF8E?logo=supabase)](https://supabase.com)
[![Deploy](https://img.shields.io/badge/deploy-Railway%20%2B%20Vercel-black)](https://railway.app)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

<!-- TODO: screenshot — chat window answering from course materials with citations -->

*🇪🇸 A Spanish version of this document is available on request.*

---

## What EduAgent AI is

EduAgent AI is a study tutor that adapts to the student's level. It connects to a virtual classroom
(Moodle, Google Classroom), ingests the course materials, and answers using **those materials as the
source of truth** (retrieval-augmented generation) — with citations, not hallucinations.

## Key features

- **Adaptive tutoring** — tone and vocabulary adjust automatically to the learner's age band
  (child / teen / adult), each with its own system prompt.
- **RAG over your own notes** — upload PDFs, DOCX or videos; the agent indexes them and answers
  precisely, citing the source.
- **Homework management** — syncs pending tasks from Moodle or Google Classroom with due dates and
  priority.
- **Anti-cheating mode** — on exercises the agent guides with progressive hints and never hands over
  the direct answer.
- **Real-time streaming** — responses over Server-Sent Events, no waiting for full generation.
- **Bring-your-own-key, multi-LLM** — each user supplies their own Anthropic or Google Gemini key,
  stored encrypted at rest (Fernet).

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 · TypeScript · Tailwind CSS · Zustand · TanStack Query |
| **Backend** | Python 3.12 · FastAPI · LangGraph · LlamaIndex |
| **LLM** | Anthropic Claude / Google Gemini (per-user key) |
| **Embeddings** | Cohere `embed-multilingual-v3.0` |
| **Database** | Supabase PostgreSQL 16 + pgvector |
| **Auth** | Supabase Auth (email + Google OAuth) |
| **Storage** | Supabase Storage |
| **Cache / sessions** | Upstash Redis |
| **Deploy** | Railway (backend) · Vercel (frontend) |

---

## Architecture

```
┌─────────────────┐        ┌──────────────────────────────────────┐
│   Next.js 15    │  SSE   │           FastAPI Backend             │
│   (Vercel)      │◄──────►│           (Railway)                   │
│                 │  REST  │                                        │
│  - Chat UI      │        │  ┌──────────┐   ┌──────────────────┐  │
│  - Tasks        │        │  │ LangGraph│   │   RAG Pipeline   │  │
│  - Documents    │        │  │  Agent   │──►│ LlamaIndex+Cohere│  │
└─────────────────┘        │  └──────────┘   └──────────────────┘  │
                           │        │                │              │
                           └────────┼────────────────┼─────────────┘
                                    │                │
                           ┌────────▼────────────────▼─────────────┐
                           │   Supabase (PostgreSQL + pgvector,     │
                           │            Storage)                    │
                           └────────────────────────────────────────┘
                                    │
                           ┌────────▼──────────┐
                           │   Upstash Redis   │  (sessions / cache)
                           └───────────────────┘
```

The agent is a **LangGraph** graph: an orchestrator node routes to specialized nodes — `tutor`
(age-adapted), `rag_retriever`, `summarizer` and `task_manager` — backed by tools
(`search_documents`, `create_study_plan`, `explain_concept`, `get_pending_tasks`).

---

## Quick start (local, Docker)

Requires **Docker Desktop**. No cloud accounts needed to run it locally.

```bash
git clone https://github.com/R0b3r7DEV/eduagent.git
cd eduagent
cp .env.example .env
```

Set the minimum values in `.env`:

```bash
# Fernet key (required — encrypts per-user API keys at rest)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# → paste into FERNET_SECRET_KEY=

# Cohere key (required — embeddings)
# COHERE_API_KEY=your-key
```

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
docker compose exec backend alembic upgrade head   # first run only
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| API docs | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

Full environment-variable reference (local and production) and the Supabase / Upstash / Railway /
Vercel deployment steps are documented in [`HOWTO.md`](HOWTO.md). Never commit `.env`.

---

## Project structure

```
backend/app/
├── agent/          # LangGraph graph, nodes (orchestrator, tutor, rag_retriever, summarizer,
│                   #   task_manager), age-band prompts, tools
├── api/v1/         # endpoints: chat, documents, tasks, user, auth, lms
├── models/         # SQLAlchemy ORM (users, documents, tasks, sessions, lms_connection)
├── rag/            # ingestion, Cohere embeddings, retriever, reranker
├── connectors/     # Moodle REST API, Google Classroom API, parser
└── services/       # Supabase client, storage, Fernet crypto, chat/document/task services
backend/alembic/    # database migrations
frontend/src/
├── app/            # routes: /chat, /tasks, /documents, /settings
├── components/     # ChatWindow, MessageBubble, TaskList, Sidebar
├── hooks/          # useChat, useTasks, useDocuments, useSSE
└── lib/            # typed API client, Supabase client
```

---

## Development commands

```bash
docker compose exec backend pytest tests/ -v --cov=app          # tests + coverage
docker compose exec backend ruff check app/                     # lint
docker compose exec backend alembic revision --autogenerate -m "…"   # new migration
```

---

## What I learned building this

- Designing a **multi-node agent** (LangGraph) where an orchestrator routes to specialized tutor /
  retrieval / task nodes, each with its own prompt and tools.
- Building a full **RAG pipeline** end to end: document ingestion → Cohere multilingual embeddings →
  pgvector retrieval → reranking → grounded, cited answers.
- Integrating with **third-party LMS APIs** (Moodle, Google Classroom) behind a common connector
  interface.
- Handling **bring-your-own-key** securely: per-user LLM keys encrypted at rest with Fernet.
- Shipping a real **async FastAPI + Next.js** app with SSE streaming, split across Railway and Vercel.

---

## License

MIT © 2026 R0b3r7DEV
