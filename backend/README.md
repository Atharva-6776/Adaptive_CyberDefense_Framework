# Adaptive Cyber Defense Framework - Backend Foundation

Welcome to the backend service for the Adaptive Cyber Defense Framework. This service provides robust JWT-based User Authentication and a complete Moving Target Defense (MTD) dynamic path obfuscation mechanism.

---

## 🚀 Getting Started

### Prerequisites

* Python 3.13 or 3.14 (fully supported with wheels for Windows)
* Docker & Docker Compose (optional for local database)

### Local Development Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   py -3.13 -m venv .venv
   ```

3. **Activate the virtual environment**:
   * **Windows Powershell**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * **Windows CMD**:
     ```cmd
     .venv\Scripts\activate.bat
     ```
   * **Linux/macOS**:
     ```bash
     source .venv/bin/activate
     ```

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Development Server**:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   * *Note*: If PostgreSQL is not running locally, the application will automatically print a warning and fallback to a local SQLite database (`sqlite:///./app.db`) for a zero-configuration developer experience.

---

## 🐳 Docker Deployment

To spin up the production-ready PostgreSQL database and backend service together:

```bash
docker compose up --build
```

This launches:
* **PostgreSQL Database** on port `5432`
* **FastAPI Backend** on port `8000`

---

## 🧪 Running Tests

A complete automated unit testing suite is provided, covering user registration, JWT authentication flow, role checks, token blacklisting, and MTD path rotation services.

To run the test suite locally:
```bash
pytest -v
```

---

## 🛡️ Moving Target Defense (MTD) Guide

This backend implements a sophisticated MTD architecture:

1. **Path Rotation**: High-value/sensitive endpoints (e.g. `/api/v1/auth/me`, `/api/v1/auth/logout`) are dynamically aliased to randomized path hashes (e.g., `/api/v1/d/c9f80a42`) using a seed and salt.
2. **Path Registry**: The server rotates these aliases at a configurable interval (default: `60 seconds`).
3. **Legitimate Access Flow**:
   * Legitimate clients register and login via static public routes (`/api/v1/auth/register` and `/api/v1/auth/login`).
   * Once logged in, the client queries `GET /api/v1/mtd/status` (using their JWT token) to fetch the current `active_routes` mapping.
   * To call a protected endpoint (like fetching their profile), they look up the dynamic alias from the mapping and request that path.
4. **Honeypot Decoy Interception**:
   * If an attacker queries a decoy route (like `/api/v1/admin/debug`), they get a `404 Not Found` and a security alert is logged.
   * If an attacker attempts to request the raw protected paths directly (like `/api/v1/auth/me` bypassing the active dynamic mapping), they are trapped by the MTD middleware, logged, and returned a `404 Not Found`.

---

## 📖 API Documentation

* Detailed API specs: See [docs/API_CONTRACT.md](../docs/API_CONTRACT.md)
* Swagger UI: Available at `http://localhost:8000/docs` when the server is running.
