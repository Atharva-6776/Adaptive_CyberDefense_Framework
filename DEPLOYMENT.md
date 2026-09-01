# Adaptive Cyber Defense Framework - Deployment Guide

This guide describes the procedures for deploying the framework into a production environment utilizing Docker Compose.

## 1. System Architecture
The application runs as a multi-container stack:
1. **Backend API**: Python FastAPI application serving the core logic, MTD translation, and Risk Engine.
2. **Frontend UI**: React + Vite dashboard for Threat Analytics and Administration.
3. **Database (PostgreSQL)**: Primary storage for persistent entities (Users, Audit Logs, Threat Events, Threat Blocks).
4. **Cache/KV Store (Redis)**: Distributed in-memory data store providing:
   - Resilient multi-worker rate limiting.
   - Centralized caching of the Blocked IP list for instantaneous edge blocking.
   - Distributed Locks for MTD background rotation tasks to prevent race conditions.

## 2. Prerequisites
- Docker Engine & Docker Compose
- Environment file configurations (`.env` for backend)

## 3. Configuration
Ensure the backend `.env` file (or docker environment variables) contains the required settings:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/cyberdefense

# Redis (Critical for multi-worker deployments)
REDIS_URL=redis://redis:6379/0

# Security Keys
JWT_SECRET_KEY=<your-very-secure-random-key>
JWT_REFRESH_SECRET_KEY=<your-very-secure-random-refresh-key>

# Administration
ADMIN_EMAIL=admin@defense.com
ADMIN_PASSWORD=securepassword123

# Integrations
SLACK_WEBHOOK_URL=<your-slack-webhook>
```

## 4. Launching the Stack
1. Build and start the infrastructure:
   ```bash
   docker-compose up -d --build
   ```
2. The services will bind to the following ports:
   - **Frontend UI**: `http://localhost:5173`
   - **Backend API**: `http://localhost:8000`
   - **Database**: `5432` (Internal)
   - **Redis**: `6379` (Internal)

## 5. First-Time Setup
On the first boot, the backend automatically performs the following Initialization routines:
- Creates all Database tables using SQLAlchemy metadata.
- Pre-populates the RBAC (Role-Based Access Control) matrix (`admin`, `analyst`, `user`) and standard permissions.
- Boots the Moving Target Defense (MTD) background rotation scheduler using an async context manager.

## 6. Maintenance & Troubleshooting
- **Scaling Workers**: If deploying with Gunicorn behind a reverse proxy (e.g., Nginx), you can scale out the ASGI workers. The architecture guarantees state consistency because MTD routes and IP blocks are synchronized centrally in Redis.
- **Viewing Logs**: `docker-compose logs -f backend` will stream the real-time active defense logs, including Honeypot triggers, Risk Engine calculations, and alert dispatches.
- **Fallback Mode**: In the event of an unanticipated Redis outage, the backend gracefully falls back to local in-memory dictionaries for blocking and path resolution, ensuring continuous uptime with slight trade-offs in distributed consistency.
