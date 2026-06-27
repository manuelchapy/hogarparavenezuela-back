# Authentication And Users Specification

## Purpose

This specification defines operator onboarding, authentication, roles, account lifecycle, user profile operations, and administrative user management.

## Requirements

### Requirement: Public operator request

The system SHALL allow unauthenticated public account requests only for operational roles: `RESCATISTA_CIVIL`, `PROTECCION_CIVIL`, and `PERSONAL_MEDICO`.

#### Scenario: Public operator submits valid request
- WHEN `POST /api/auth/solicitud` receives valid operator data and verification evidence
- THEN the system SHALL create a user with `estadoCuenta: PENDIENTE`
- AND respond with HTTP 202
- AND SHALL NOT issue an operational token

#### Scenario: Public request uses non-operational role
- WHEN `POST /api/auth/solicitud` requests `CONSEJERO_CPNNA` or `ADMINISTRADOR`
- THEN the system SHALL reject the request with HTTP 400

### Requirement: Verification evidence

The system SHALL require identity verification evidence during user creation.

#### Scenario: User has no official credential ID
- WHEN a user request does not include `credencialOficialId`
- THEN `fotoCedulaUrl` SHALL be required

#### Scenario: User has an official credential ID
- WHEN a user request includes `credencialOficialId`
- THEN `fotoCredencialUrl` SHALL be required

### Requirement: Admin approval lifecycle

The system SHALL require administrator approval before public operator accounts can operate.

#### Scenario: Admin approves pending user
- WHEN an `ADMINISTRADOR` calls `PATCH /api/admin/usuarios/:id/aprobar` for a pending user
- THEN the user SHALL become `ACTIVO`
- AND the system SHALL record verifier metadata

#### Scenario: Admin rejects pending user
- WHEN an `ADMINISTRADOR` calls `PATCH /api/admin/usuarios/:id/rechazar` with a valid rejection reason
- THEN the user SHALL become `RECHAZADO`
- AND the rejection reason SHALL be stored

### Requirement: Login restrictions

The system SHALL allow login only for active accounts with valid credentials.

#### Scenario: Active user logs in
- WHEN `POST /api/auth/login` receives valid `cedula` and matching credential data if required
- THEN the system SHALL return a JWT and user profile data

#### Scenario: Non-active user attempts login
- WHEN a `PENDIENTE`, `RECHAZADO`, or `SUSPENDIDO` user attempts login
- THEN the system SHALL respond with HTTP 403

### Requirement: Admin-created users

The system SHALL allow administrators to create users directly through `POST /api/auth/register`.

#### Scenario: Admin creates authority user
- WHEN an authenticated `ADMINISTRADOR` creates a `CONSEJERO_CPNNA`
- THEN the system SHALL create the account as active immediately

### Requirement: Bootstrap administrator

The system SHALL allow creation of the first administrator only when no active administrator exists and `BOOTSTRAP_SECRET` is valid.

#### Scenario: Bootstrap succeeds
- WHEN `POST /api/auth/bootstrap-admin` receives valid admin data and secret before any active admin exists
- THEN the system SHALL create the first active administrator

#### Scenario: Active admin already exists
- WHEN bootstrap is attempted after an active admin exists
- THEN the system SHALL reject the request with HTTP 409

### Requirement: Authenticated profile

The system SHALL expose authenticated profile retrieval and limited profile update through `/api/auth/me`.

#### Scenario: User updates profile
- WHEN an authenticated user calls `PATCH /api/auth/me` with at least one allowed field
- THEN the system SHALL update the profile and return the updated user data
