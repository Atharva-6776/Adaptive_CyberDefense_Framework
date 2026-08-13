# PAHAREKARI — Adaptive Cyber Defense & PPE Surveillance Framework

PAHAREKARI is a full-stack, enterprise safety surveillance and cyber defense framework. It integrates **Moving Target Defense (MTD)** dynamic API route rotation, **honeypot decoy traps**, and a real-time **YOLOv8 PPE compliance video pipeline**.

---

## 1. System Architecture

For a detailed analysis of workflows, refer to the [ARCHITECTURE.md](docs/ARCHITECTURE.md) document.

* **Frontend**: React, TypeScript, TailwindCSS, Zustand, Lucide icons, and Axios.
* **Backend**: FastAPI, Python 3.10+, SQLAlchemy, Alembic migrations, and Uvicorn.
* **Database**: PostgreSQL (Dockerized) or SQLite (local developer fallback).
* **AI Engine**: YOLOv8 (`ultralytics`) using a pre-trained PPE model (`best.pt`) and OpenCV.

---

## 2. Prerequisites

* **Docker & Docker Compose** (for running the full stack)
* **Python 3.10 or 3.11** (for local backend development)
* **Node.js 18 or 20** (for local frontend development)

---

## 3. Environment Setup

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Review and adjust variables as needed:
* `DATABASE_URL`: PostgreSQL connection string.
* `JWT_SECRET_KEY`: Random secret string for JWT access tokens.
* `JWT_REFRESH_SECRET_KEY`: Random secret string for JWT refresh tokens.
* `MODEL_PATH`: Directory location of the YOLO PPE model `best.pt`.
* `MTD_ENABLED`: Toggle MTD route protection.

---

## 4. YOLO Model Placement

Before starting the system or video streams, place your trained YOLO PPE detection model (`best.pt`) in the designated folder:

* **File Location**: `ai-engine/models/best.pt`

If the model is not found at the location pointed by `MODEL_PATH` when starting a camera feed, the backend will raise a clear configuration error.

---

## 5. Running the System

### Option A: Using Docker Compose (Recommended)

To run the database, backend, and frontend concurrently:

```bash
docker compose up --build
```

Access the applications:
* **Frontend UI**: [http://localhost:8080](http://localhost:8080)
* **Backend API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option B: Local Development Setup

#### 1. Start the Database
Either run a local PostgreSQL service or let the backend automatically fall back to its SQLite database (`backend/app.db`) for developer ease.

#### 2. Run Backend API
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m pytest   # Run tests
uvicorn app.main:app --reload
```

#### 3. Run Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 6. Testing

### Run Backend Tests
Run the pytest suite inside the activated backend virtual environment:

```bash
cd backend
python -m pytest
```

Included test categories:
1. JWT register, login, refresh, logout, token blacklist.
2. Moving Target Defense status query and manual rotations.
3. Honey decoy path interceptions and database persistence.
4. Camera CRUD registries and video metrics.
5. Safety alert generation, cooldown, and status resolution.
6. Model file validation errors.
