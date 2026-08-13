# PAHAREKARI — Architecture Specification

This document details the architectural design and system workflows of the integrated PAHAREKARI Adaptive Cyber Security & Surveillance System.

## Architecture Diagram

```text
Frontend
   |
   v
FastAPI Backend
   |
   +---- Authentication (JWT)
   |
   +---- MTD Middleware (Dynamic Routing)
   |
   +---- Alert API
   |
   +---- Camera API
   |
   v
PostgreSQL / SQLite

Camera
   |
   v
Video Ingestion (OpenCV)
   |
   v
YOLO PPE Model (ultralytics)
   |
   v
Violation Detection (helmet/vest check)
   |
   v
Safety Alert Generation
   |
   v
FastAPI API Endpoint
   |
   v
PostgreSQL
   |
   v
Frontend Polling (Live dashboard refresh)
```

---

## 1. Moving Target Defense (MTD) & Security Flow

The system protects sensitive endpoints from targeted scanners and attackers by dynamically translating routing spaces.

### Legitimate Request Flow
```text
Request (Legitimate)
   |
   v
[MTD Middleware] 
   |---> Check if request matches current dynamic path map (e.g. /api/v1/d/c9f80a42)
   |---> Decode dynamic path -> Real endpoint (e.g. /api/v1/auth/me)
   |---> Rewrite ASGI scope path
   |
   v
[FastAPI Routing & Controllers]
   |
   v
Response returned to user
```

### Attacker / Decoy Trigger Flow
```text
Attacker Request (Decoy / Real Endpoint Direct Access)
   |
   v
[MTD Middleware]
   |---> Check if request matches decoy paths (e.g. /api/v1/system/env)
   |---> OR direct check to real protected paths (e.g. /api/v1/auth/me) without translation
   |---> Intercept request
   |---> Extract telemetry: IP, User-Agent, Headers
   |---> Log to DB (HoneypotLog table) & raise security warnings in logs
   |
   v
Response returned: Fake 404 error (No details revealed)
```

---

## 2. Safety Analytics & YOLO Pipeline

The system ingests CCTV video streams (or webcam/test videos) and runs real-time object detection to identify safety compliance violations.

1. **Video Ingestion**: Background threads run OpenCV `VideoCapture` streams for active camera nodes.
2. **YOLO PPE Detection**: Frames are passed to the YOLOv8 model (`best.pt`) configured at `MODEL_PATH`.
3. **Violation Logic**: The pipeline processes bounding boxes to detect if `person` detections exist without matching `helmet` or `vest` detections (or if direct `no-helmet`/`no-vest` labels are detected).
4. **Intrusion Alerts**: Violations are throttled using a 15-second cooldown per camera to avoid database spam.
5. **Dashboard Rendering**: The React frontend polls the backend alerts API, rendering real-time alarms and live streams marked with YOLO detections.
