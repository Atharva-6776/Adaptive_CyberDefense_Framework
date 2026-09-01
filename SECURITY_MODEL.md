# Adaptive Cyber Defense Framework - Security Model

This document outlines the security architecture and active defense mechanisms employed by the Adaptive Cyber Defense Framework.

## 1. Authentication & Zero-Trust Identity
The framework implements a strict Zero-Trust approach:
- **JWT (JSON Web Tokens)**: All authenticated sessions utilize short-lived Access Tokens (15m) and long-lived Refresh Tokens (7d).
- **Refresh Token Rotation**: Refresh tokens are rotated automatically upon usage to detect and mitigate token theft.
- **Session Revocation**: A Token Blacklist and `ActiveSession` tracking ensure compromised sessions can be forcefully terminated immediately.
- **Strict Role-Based Access Control (RBAC)**: All sensitive actions are governed by fine-grained permissions. Missing or insufficient permissions instantly trigger alerts and auditing.

## 2. Moving Target Defense (MTD)
MTD shifts the attack surface constantly, making enumeration and exploitation significantly more difficult:
- **Dynamic Path Shuffling**: Sensitive API endpoints (e.g., authentication, settings) are dynamically mapped to cryptographic hashes that rotate continuously (every 15 minutes).
- **Stale Route Traps**: Accessing an expired or deprecated dynamic route triggers a 410 Gone response and flags the client for suspicion.
- **Direct Access Blocks**: Any attempt to bypass the dynamic routing and directly hit protected inner routes (e.g., `/api/v1/auth/me`) is intercepted and logged as a honeypot trigger.

## 3. Decoys & Honeypots
Active deception is deployed across the API surface:
- **Artificial Attack Surface**: Dozens of decoy endpoints (e.g., `/api/v1/admin/debug`, `/.env`, `/wp-admin`) simulate vulnerable legacy endpoints.
- **Instant Triage**: Touching any decoy endpoint instantly triggers a High-severity threat event, logging the payload, headers, and IP address.
- **Data Persistence**: Telemetry is persisted in the PostgreSQL database for security analysis.

## 4. Threat Correlation & Mitigation Engine
The Risk Engine correlates telemetry in real-time to detect sophisticated attacks:
- **Risk Scoring Algorithm**: Correlates authentication failures, rate limit breaches, decoy interactions, and unauthorized access attempts.
- **Automated IP Mitigation**: Threat actors crossing risk thresholds (Low, Medium, High, Critical) face progressive penalties, up to a complete multi-worker distributed IP block utilizing Redis.
- **Alerting**: Critical threats immediately dispatch alerts to external systems (Slack/Email).

## 5. Defense-in-Depth Measures
- **Rate Limiting**: Configured globally to stymie brute-force and DoS attacks.
- **Audit Logging**: Comprehensive, immutable logging tracks all sensitive administrative actions (e.g., rotating paths, manual IP blocks) with full pagination and filtering support.
- **Data Integrity**: Using PostgreSQL constraints and backend validation, ensuring persistent security logs are immune to tampering via standard API usage.
