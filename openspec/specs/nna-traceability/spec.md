# NNA Traceability Specification

## Purpose

This specification defines NNA record registration, photo handling, timeline events, location updates, legal closure, file uploads, and offline retry behavior.

## Requirements

### Requirement: Active account for NNA operations

Protected NNA routes SHALL require JWT authentication and `estadoCuenta: ACTIVO`, except `GET /api/nna/meta`.

#### Scenario: Pending user attempts NNA operation
- WHEN a `PENDIENTE` user calls a protected `/api/nna/*` route
- THEN the system SHALL respond with HTTP 403

### Requirement: Pre-registration photo upload

The system SHALL support uploading a required NNA photo before creating the record.

#### Scenario: Operator uploads photo
- WHEN an active authenticated operator posts multipart field `archivo` to `POST /api/nna/subir-foto`
- THEN the system SHALL store the file
- AND respond with `fotoUrl` and `storagePath`

### Requirement: NNA creation

The system SHALL allow `RESCATISTA_CIVIL`, `PROTECCION_CIVIL`, `PERSONAL_MEDICO`, and `ADMINISTRADOR` to create NNA records.

#### Scenario: Valid NNA record is created
- WHEN `POST /api/nna` receives valid `fotoUrl`, `datosNna`, `hallazgo`, `ubicacion`, and initial event data
- THEN the system SHALL create an NNA record
- AND set `statusActual` to `EN_SITIO`
- AND include a `REGISTRO_INICIAL` timeline event

### Requirement: Adolescent voice

The system SHALL require `vozDelNna` when `datosNna.edadAparente` is `ADOLESCENTE`.

#### Scenario: Adolescent record lacks voice data
- WHEN `POST /api/nna` receives an adolescent record without valid `vozDelNna`
- THEN the system SHALL respond with HTTP 400

### Requirement: NNA listing and detail

The system SHALL expose paginated NNA listing and individual detail retrieval for active authenticated users.

#### Scenario: Operator lists NNA records
- WHEN an active user calls `GET /api/nna` with optional `page`, `limit`, `status`, `stateId`, or `cityId`
- THEN the system SHALL return matching items and pagination metadata

### Requirement: Administrative location update

The system SHALL allow authorized registration roles to update NNA administrative location.

#### Scenario: Operator updates location
- WHEN an authorized user calls `PATCH /api/nna/:id/ubicacion` with valid geographic references
- THEN the system SHALL update `ubicacion`
- AND preserve geographic integrity

### Requirement: Timeline events

The system SHALL allow appending idempotent timeline events according to the role and event permission matrix.

#### Scenario: Transfer event is registered
- WHEN an authorized user submits `TRASLADO` with valid `eventoId`, `ubicacionNombre`, `estadoSalud`, and `entidadAtencionId`
- THEN the system SHALL append the event
- AND set `statusActual` to `EN_TRANSITO`

#### Scenario: Shelter admission is registered
- WHEN an authorized user submits `INGRESO_REFUGIO` with valid `entidadAtencionId`
- THEN the system SHALL append the event
- AND set `statusActual` to `RESGUARDADO`

#### Scenario: Medical attention is registered
- WHEN an authorized user submits `ATENCION_MEDICA`
- THEN the system SHALL append the event
- AND SHALL NOT automatically change `statusActual`

### Requirement: Legal closure

The system SHALL allow only `CONSEJERO_CPNNA` and `ADMINISTRADOR` to register legal closure.

#### Scenario: Legal closure succeeds
- WHEN an authorized user calls `POST /api/nna/:id/cierre-legal` with act code, receiving authority, and scanned act URL
- THEN the system SHALL store `cierreLegal`
- AND set `statusActual` to `ENTREGADO_AUTORIDAD`

#### Scenario: Adolescent closure lacks prior voice data
- WHEN legal closure is attempted for an adolescent record without `vozDelNna`
- THEN the system SHALL respond with HTTP 400

### Requirement: NNA file attachments

The system SHALL support authenticated multipart uploads for `FOTO_ROSTRO` and `ACTA_ENTREGA`.

#### Scenario: Act file is uploaded
- WHEN an authorized user uploads `tipo=ACTA_ENTREGA` to `POST /api/nna/:id/archivos`
- THEN the system SHALL return a URL that can be used as `scannedActaUrl`
