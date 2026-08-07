# API Contract - Adaptive Cyber Defense Framework

This API contract details the authentication flow, Moving Target Defense (MTD) mechanism, and the endpoints provided by the backend foundation.

---

## Global Headers & Authentication

All protected endpoints require a Bearer JWT Token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 1. User Registration

Creates a new user account.

* **Endpoint**: `POST /api/v1/auth/register`
* **Authentication**: None
* **Request Schema (`UserRegister`)**:
  * `email`: string (valid email format, required)
  * `password`: string (min length 6, required)
  * `role`: string (optional, default `"user"`, valid options: `"user"`, `"admin"`, `"analyst"`)

* **Request Example**:
  ```json
  {
    "email": "analyst@defense.local",
    "password": "SecurePassword123",
    "role": "analyst"
  }
  ```

* **Response Schema (`UserResponse`)**:
  * `id`: integer
  * `email`: string
  * `role`: string
  * `is_active`: boolean
  * `created_at`: string (ISO datetime)
  * `updated_at`: string (ISO datetime)

* **Success Response (201 Created)**:
  ```json
  {
    "id": 1,
    "email": "analyst@defense.local",
    "role": "analyst",
    "is_active": true,
    "created_at": "2026-08-07T10:43:00Z",
    "updated_at": "2026-08-07T10:43:00Z"
  }
  ```

* **Error Responses**:
  * **400 Bad Request** (Email already exists or invalid payload):
    ```json
    {
      "detail": "Email already registered"
    }
    ```

---

## 2. User Login

Authenticates credentials and issues access and refresh tokens.

* **Endpoint**: `POST /api/v1/auth/login`
* **Authentication**: None
* **Request Schema (`UserLogin`)**:
  * `email`: string (required)
  * `password`: string (required)

* **Request Example**:
  ```json
  {
    "email": "analyst@defense.local",
    "password": "SecurePassword123"
  }
  ```

* **Response Schema (`TokenResponse`)**:
  * `access_token`: string
  * `refresh_token`: string
  * `token_type`: string (`"bearer"`)

* **Success Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

* **Error Responses**:
  * **401 Unauthorized** (Invalid credentials):
    ```json
    {
      "detail": "Incorrect email or password"
    }
    ```

---

## 3. Token Refresh

Generates a new access token using a valid refresh token.

* **Endpoint**: `POST /api/v1/auth/refresh`
* **Authentication**: None (accepts refresh token in request body)
* **Request Schema (`RefreshTokenRequest`)**:
  * `refresh_token`: string (required)

* **Request Example**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

* **Response Schema (`TokenResponse`)**:
  * `access_token`: string
  * `refresh_token`: string (same or updated)
  * `token_type`: string

* **Success Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_new...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

* **Error Responses**:
  * **401 Unauthorized** (Invalid or blacklisted refresh token):
    ```json
    {
      "detail": "Refresh token has been revoked"
    }
    ```

---

## 4. User Logout

Invalidates user access and refresh tokens by blacklisting them.

* **Endpoint**: `POST /api/v1/auth/logout`
* **Authentication**: Access Token in Authorization header
* **Request Schema (`RefreshTokenRequest`)**:
  * `refresh_token`: string (required in body to blacklist)

* **Request Example**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

* **Response Schema (`LogoutResponse`)**:
  * `message`: string

* **Success Response (200 OK)**:
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

* **Error Responses**:
  * **401 Unauthorized** (Invalid access token or missing header)

---

## 5. Get Current User Profile

Retrieves the profile of the currently authenticated user.

* **Endpoint**: `GET /api/v1/auth/me`
* **Authentication**: Access Token in Authorization header (Note: subject to MTD path rotation)
* **Success Response (200 OK)**:
  ```json
  {
    "id": 1,
    "email": "analyst@defense.local",
    "role": "analyst",
    "is_active": true,
    "created_at": "2026-08-07T10:43:00Z",
    "updated_at": "2026-08-07T10:43:00Z"
  }
  ```

* **Error Responses**:
  * **401 Unauthorized** (Expired or missing token)
  * **404 Not Found** (Directly requested without dynamic translation when MTD is enabled)

---

## 6. Get MTD Status

Retrieves the current MTD registry status, metrics, and active path maps.

* **Endpoint**: `GET /api/v1/mtd/status`
* **Authentication**: Access Token in Authorization header
* **Response Schema (`MTDStatusResponse`)**:
  * `mtd_enabled`: boolean
  * `current_seed`: string
  * `active_routes`: object (mapping dynamic routes to internal paths)
  * `decoy_paths`: array of strings (configured honeypots)
  * `rotation_interval_seconds`: integer
  * `last_rotation`: string (ISO datetime)
  * `next_rotation_in_seconds`: float
  * `rotation_history`: array of objects (`PathRotationInfo`)

* **Success Response (200 OK)**:
  ```json
  {
    "mtd_enabled": true,
    "current_seed": "adaptive-defense-framework-seed",
    "active_routes": {
      "/api/v1/d/c9f80a42": "/api/v1/auth/me",
      "/api/v1/d/12e8bfa0": "/api/v1/auth/logout"
    },
    "decoy_paths": [
      "/api/v1/admin/debug",
      "/api/v1/system/env",
      "/api/v1/auth/keys"
    ],
    "rotation_interval_seconds": 60,
    "last_rotation": "2026-08-07T10:50:00.000Z",
    "next_rotation_in_seconds": 45.2,
    "rotation_history": [
      {
        "dynamic_path": "/api/v1/d/c9f80a42",
        "target_handler": "/api/v1/auth/me",
        "created_at": "2026-08-07T10:50:00.000Z",
        "status": "active"
      }
    ]
  }
  ```

---

## 7. Honeypot Decoy Traps

Decoy paths that automatically log security intrusion telemetry and trigger alerts.

* **Endpoints**: Configured decoy paths (e.g. `GET/POST/PUT/DELETE /api/v1/admin/debug`, `GET /api/v1/system/env`, etc.)
* **Response**: Hardcoded fake error response to deter attackers.
* **Honeypot Response (404 Not Found)**:
  ```json
  {
    "detail": "Not Found"
  }
  ```
