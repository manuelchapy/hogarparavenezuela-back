# API Contract Specification

## Purpose

This specification defines global API conventions, response formats, authentication headers, error handling, and offline idempotency behavior.

## Requirements

### Requirement: API base path

All business routes SHALL live under the `/api` prefix.

#### Scenario: A client calls a documented route
- WHEN the client calls a business endpoint
- THEN the route SHALL be mounted under `/api`

### Requirement: Standard success response

Successful responses SHALL use a JSON envelope with `success: true` and a `data` object.

#### Scenario: Request succeeds
- WHEN an API operation completes successfully
- THEN the response body SHALL include `success: true`
- AND the response body SHALL include `data`

### Requirement: Standard error response

Error responses SHALL use a JSON envelope with `success: false`, a human-readable `message`, and optional `data` details.

#### Scenario: Validation fails
- WHEN request body, query, or params validation fails
- THEN the system SHALL respond with HTTP 400
- AND the response body SHALL include `success: false`, `message`, and validation details under `data.errors`

### Requirement: JWT authorization header

Protected routes SHALL use JWT authentication with the `Authorization: Bearer <token>` header.

#### Scenario: Token is missing
- WHEN a protected route receives no bearer token
- THEN the system SHALL respond with HTTP 401

### Requirement: Offline NNA registration idempotency

NNA registration SHALL support offline retry through `idOfflineFallback`.

#### Scenario: Registration is retried with same offline fallback ID
- WHEN `POST /api/nna` receives an existing `idOfflineFallback`
- THEN the system SHALL respond with HTTP 200
- AND `data.created` SHALL be `false`

### Requirement: Timeline event idempotency

Timeline events SHALL support retry through UUID `eventoId`.

#### Scenario: Timeline event is retried with same event ID
- WHEN `PATCH /api/nna/:id/timeline` receives an existing `eventoId`
- THEN the system SHALL respond with HTTP 200
- AND `data.duplicated` SHALL be `true`

### Requirement: Health check

The system SHALL expose `GET /api/health` without authentication.

#### Scenario: Service health is checked
- WHEN a client calls `GET /api/health`
- THEN the system SHALL respond with HTTP 200
- AND the response SHALL identify the service and current status
