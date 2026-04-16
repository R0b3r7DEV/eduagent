# EduAgent AI

Agente de inteligencia artificial educativo que ayuda a estudiantes a estudiar,
planificar deberes y entender temario. Se conecta a aulas virtuales (Moodle,
Google Classroom), ingesta los materiales del curso y responde usando esos
contenidos como fuente de verdad.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| Backend | Python 3.12, FastAPI, LangGraph, LlamaIndex |
| LLM | Anthropic Claude Sonnet 4.6 (key por usuario) |
| Embeddings | Cohere `embed-multilingual-v3.0` |
| Base de datos | Supabase PostgreSQL + pgvector |
| Auth | Supabase Auth (email, Google OAuth) |
| Almacenamiento | Supabase Storage (PDFs, documentos) |
| Caché / sesiones | Upstash Redis |
| Deploy backend | Railway |
| Deploy frontend | Vercel |

---

## Instalación local

Requiere **Docker Desktop** instalado. No necesitas cuentas en la nube.

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd EduAgent

# 2. Crear el fichero de variables de entorno
cp .env.example .env
```

Edita `.env` con los valores mínimos para desarrollo local:

```bash
# Genera la clave Fernet (requerida)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Copia el resultado en FERNET_SECRET_KEY=

# Pon tu clave de Cohere (requerida para embeddings)
# COHERE_API_KEY=...

# Para local, el resto de valores ya están configurados en .env.example
```

```bash
# 3. Arrancar todos los servicios
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 4. Aplicar migraciones de base de datos (solo la primera vez)
docker compose exec backend alembic upgrade head

# 5. Abrir en el navegador
# Frontend  →  http://localhost
# API docs  →  http://localhost:8000/docs
# pgAdmin   →  http://localhost:5050  (admin@eduagent.local / admin)
```

---

## Variables de entorno necesarias

Copia `.env.example` a `.env` y rellena los valores. **Nunca subas `.env` a Git** — ya está en `.gitignore`.

### Mínimas para desarrollo local

| Variable | Descripción | Cómo obtenerla |
|---|---|---|
| `FERNET_SECRET_KEY` | Cifra las API keys de usuario | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `COHERE_API_KEY` | Embeddings multilingüe | [cohere.com](https://cohere.com) → API Keys |
| `ANTHROPIC_API_KEY` | Fallback LLM en dev (opcional) | [console.anthropic.com](https://console.anthropic.com) |

### Requeridas en producción (cloud)

| Variable | Descripción | Dónde conseguirla |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Clave pública | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada (nunca al frontend) | Supabase → Settings → API |
| `SUPABASE_JWT_SECRET` | Para verificar tokens server-side | Supabase → Settings → API → JWT Settings |
| `DATABASE_URL` | Conexión PostgreSQL | Supabase → Settings → Database → URI (Session Pooler) |
| `REDIS_URL` | Caché y sesiones | [upstash.com](https://upstash.com) → Database |
| `NEXT_PUBLIC_SUPABASE_URL` | Igual que `SUPABASE_URL` | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Igual que `SUPABASE_ANON_KEY` | — |
| `NEXT_PUBLIC_API_URL` | URL pública del backend en Railway | Railway → tu servicio → URL |

---

## Comandos de desarrollo

```bash
# Crear una nueva migración de base de datos
docker compose exec backend alembic revision --autogenerate -m "descripcion"

# Ejecutar tests
docker compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing

# Linting y formato
docker compose exec backend ruff check app/ && black --check app/

# Logs del agente en tiempo real
docker compose logs -f backend | grep -E "agent|rag|lms|error"
```

---

## Despliegue en producción

Ver la sección detallada en [`docs/deploy.md`](docs/deploy.md) o el resumen rápido:

1. **Supabase** — crea proyecto, activa `vector` extension, crea bucket `documents`
2. **Upstash** — crea Redis database, copia URL `rediss://…`
3. **Railway** — conecta repo, establece `RAILWAY_ROOT_DIR=backend`, añade variables de entorno
4. **Vercel** — conecta repo, selecciona carpeta `frontend/`, añade `NEXT_PUBLIC_*` vars

---

## Estructura del proyecto

```
EduAgent/
├── backend/          # FastAPI + LangGraph + RAG pipeline
│   ├── app/
│   │   ├── agent/    # Grafo LangGraph, nodos, prompts, tools
│   │   ├── api/      # Endpoints HTTP (chat, docs, tasks, user, auth)
│   │   ├── models/   # SQLAlchemy ORM
│   │   ├── rag/      # Ingesta, embeddings, retriever, reranker
│   │   ├── connectors/ # Moodle, Google Classroom
│   │   └── services/ # Supabase client, storage, crypto
│   └── alembic/      # Migraciones de base de datos
└── frontend/         # Next.js 15 App Router
    └── src/
        ├── app/      # Páginas: chat, tasks, documents, settings
        ├── components/
        └── lib/      # API client, Supabase client
```
