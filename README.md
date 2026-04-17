<div align="center">

# EduAgent AI

**Agente educativo con IA que se conecta a tu aula virtual, aprende tu temario y te ayuda a estudiar.**

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org)
[![LLM](https://img.shields.io/badge/LLM-Claude%20Sonnet%204.6-orange?logo=anthropic)](https://anthropic.com)
[![DB](https://img.shields.io/badge/database-Supabase%20%2B%20pgvector-3ECF8E?logo=supabase)](https://supabase.com)
[![Deploy](https://img.shields.io/badge/deploy-Railway%20%2B%20Vercel-black)](https://railway.app)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[Demo](#) · [Documentación](#variables-de-entorno) · [Reportar un bug](https://github.com/R0b3r7DEV/eduagent/issues)

</div>

---

## Qué es EduAgent AI

EduAgent AI es un tutor inteligente que se adapta a tu nivel educativo. Se conecta a tu aula virtual (Moodle, Google Classroom), ingesta los materiales del curso y responde usando esos contenidos como fuente de verdad.

**Características principales:**

- **Chat adaptativo** — tono y vocabulario ajustados automáticamente según tu edad (infantil, adolescente, adulto)
- **RAG sobre tus apuntes** — sube PDFs, DOCX o vídeos y el agente los indexa para responder con precisión y citar la fuente
- **Gestión de deberes** — sincroniza tareas pendientes desde Moodle o Google Classroom con fechas de entrega y prioridad
- **Modo anti-trampa** — en ejercicios el agente guía con pistas progresivas, nunca da la respuesta directa
- **Streaming en tiempo real** — respuestas via Server-Sent Events sin esperar a que termine de generar
- **Multi-LLM** — cada usuario aporta su propia API key de Anthropic o Google Gemini

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 15 · TypeScript · Tailwind CSS · Zustand · TanStack Query |
| **Backend** | Python 3.12 · FastAPI · LangGraph 0.2 · LlamaIndex |
| **LLM** | Anthropic Claude Sonnet 4.6 / Google Gemini (key por usuario) |
| **Embeddings** | Cohere `embed-multilingual-v3.0` |
| **Base de datos** | Supabase PostgreSQL 16 + pgvector |
| **Auth** | Supabase Auth (email + Google OAuth) |
| **Almacenamiento** | Supabase Storage |
| **Caché / sesiones** | Upstash Redis |
| **Deploy backend** | Railway |
| **Deploy frontend** | Vercel |

---

## Inicio rápido (local con Docker)

Requiere **Docker Desktop** instalado. No necesitas cuentas en la nube.

```bash
# 1. Clonar el repositorio
git clone https://github.com/R0b3r7DEV/eduagent.git
cd eduagent

# 2. Crear el fichero de variables de entorno
cp .env.example .env
```

Edita `.env` con los valores mínimos:

```bash
# Genera la clave Fernet (obligatoria)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Pega el resultado en FERNET_SECRET_KEY=

# Añade tu clave de Cohere (obligatoria para embeddings)
# COHERE_API_KEY=tu-clave
```

```bash
# 3. Arrancar todos los servicios
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 4. Aplicar migraciones (solo la primera vez)
docker compose exec backend alembic upgrade head
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost |
| API docs | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores. **Nunca subas `.env` a Git.**

### Desarrollo local

| Variable | Descripción | Cómo obtenerla |
|---|---|---|
| `FERNET_SECRET_KEY` | Cifra las API keys de usuario en BD | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `COHERE_API_KEY` | Embeddings multilingüe | [cohere.com](https://cohere.com) → API Keys |
| `ANTHROPIC_API_KEY` | Fallback LLM en dev (opcional) | [console.anthropic.com](https://console.anthropic.com) |

### Producción (cloud)

| Variable | Descripción | Dónde conseguirla |
|---|---|---|
| `DATABASE_URL` | PostgreSQL con asyncpg | Supabase → Connect → Session pooler (puerto 5432) |
| `SUPABASE_URL` | URL del proyecto | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Clave pública | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada (solo backend) | Supabase → Settings → API |
| `SUPABASE_JWT_SECRET` | Verificación de tokens | Supabase → Settings → API → JWT Settings |
| `REDIS_URL` | Caché y sesiones | [upstash.com](https://upstash.com) → Redis |
| `NEXT_PUBLIC_SUPABASE_URL` | Igual que `SUPABASE_URL` | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Igual que `SUPABASE_ANON_KEY` | — |
| `NEXT_PUBLIC_API_URL` | URL pública del backend | Railway → tu servicio → Networking |

---

## Despliegue en producción

### 1 — Supabase

1. Crea un nuevo proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el script de migraciones en `backend/alembic/versions/`
3. Crea el bucket `documents` en **Storage**
4. Copia las keys desde **Settings → API**

### 2 — Upstash Redis

1. Crea una base de datos en [upstash.com](https://upstash.com)
2. Copia la URL `rediss://...` como `REDIS_URL`

### 3 — Railway (backend)

1. Nuevo proyecto → conecta el repo → selecciona la carpeta `backend`
2. Añade todas las variables de entorno del apartado anterior
3. Railway detecta el `Dockerfile` y despliega automáticamente

### 4 — Vercel (frontend)

1. Nuevo proyecto → importa el repo → **Root Directory:** `frontend`
2. Añade las variables `NEXT_PUBLIC_*`
3. Deploy

---

## Arquitectura

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
                           │         Supabase                       │
                           │  PostgreSQL + pgvector  │  Storage     │
                           └────────────────────────────────────────┘
                                    │
                           ┌────────▼──────────┐
                           │   Upstash Redis   │
                           │  (sesiones/caché) │
                           └───────────────────┘
```

---

## Estructura del proyecto

```
eduagent/
├── backend/
│   ├── app/
│   │   ├── agent/          # Grafo LangGraph, nodos, prompts, tools
│   │   ├── api/v1/         # Endpoints: chat, documents, tasks, user, auth, lms
│   │   ├── models/         # SQLAlchemy ORM (users, documents, tasks, sessions)
│   │   ├── rag/            # Ingesta, embeddings Cohere, retriever, reranker
│   │   ├── connectors/     # Moodle REST API, Google Classroom API
│   │   └── services/       # Supabase client, storage, cifrado Fernet
│   ├── alembic/            # Migraciones de base de datos
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   └── src/
│       ├── app/            # Rutas: /chat, /tasks, /documents, /settings
│       ├── components/     # ChatWindow, MessageBubble, TaskList, Sidebar
│       ├── hooks/          # useChat, useTasks, useDocuments, useSSE
│       └── lib/            # API client tipado, Supabase client
├── docker-compose.yml
└── .env.example
```

---

## Comandos de desarrollo

```bash
# Ejecutar tests con cobertura
docker compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing

# Linting y formato
docker compose exec backend ruff check app/ && black --check app/

# Nueva migración de base de datos
docker compose exec backend alembic revision --autogenerate -m "descripcion"

# Logs del agente en tiempo real
docker compose logs -f backend | grep -E "agent|rag|lms|error"

# Shell de base de datos
docker compose exec db psql -U eduagent -d eduagent
```

---

## Licencia

MIT © 2026 R0b3r7DEV
