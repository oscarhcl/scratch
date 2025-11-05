# Graph Explorer Stack

This repository provides a full-stack scaffold for a 3D graph exploration experience powered by React Three Fiber on the frontend, an Express API backend, Neo4j for graph persistence, and OpenAI for suggestion generation.

## Frontend (`frontend/`)

- **Vite + React** application with React Three Fiber for 3D visualization.
- Auth0-ready provider wrapper (`AuthProvider`) for quick authentication setup.
- Axios API client targeting the backend (`VITE_API_BASE_URL`).
- Scene scaffolding featuring an interactive graph canvas with expandable nodes.

### Frontend commands

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` based on `.env.example` to configure API and Auth0 values.

## Backend (`backend/`)

- Express server exposing REST endpoints for graph querying and node CRUD.
- Neo4j data-access helpers using the official JavaScript driver.
- Auth0 JWT middleware (disabled automatically when not configured).
- OpenAI client integration for contextual suggestion generation.

### Backend commands

```bash
cd backend
npm install
npm run dev
```

Copy `.env.example` to `.env` and adjust values for Neo4j, Auth0, and OpenAI.

## Neo4j provisioning

A lightweight `docker-compose.yml` is provided to bring up a local Neo4j instance:

```bash
docker compose up -d
```

Adjust `NEO4J_USERNAME`/`NEO4J_PASSWORD` environment variables as needed before starting the stack.

## API overview

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/graph` | Retrieve a snapshot of nodes and relationships. |
| POST | `/api/nodes` | Create a new node. |
| GET | `/api/nodes/:id` | Retrieve a single node. |
| PATCH | `/api/nodes/:id` | Update node properties. |
| DELETE | `/api/nodes/:id` | Delete a node and its relationships. |
| POST | `/api/nodes/:id/expand` | Fetch neighboring nodes/edges for expansion. |
| POST | `/api/graph/traverse` | Perform bounded traversal from a start node. |
| POST | `/api/suggestions` | Generate suggestions using the configured LLM. |

## Authentication

Auth0 is used as the default identity provider. Configure the following environment variables:

- `AUTH0_AUDIENCE`
- `AUTH0_ISSUER_BASE_URL`
- (Frontend) `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`

When these values are absent, authentication is bypassed so the scaffold remains usable locally.

## Suggestion generation

The backend integrates the official `openai` SDK. Provide `OPENAI_API_KEY` and optionally `OPENAI_MODEL` to enable the `/api/suggestions` endpoint.

## Directory layout

```
frontend/
  src/
    components/
    hooks/
    services/
backend/
  src/
    config/
    controllers/
    data/
    middleware/
    routes/
    services/
```

This scaffold is intentionally lightweight and ready for further customization, testing, and deployment automation.
