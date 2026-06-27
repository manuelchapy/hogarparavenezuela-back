# Catalog Specification

## Purpose

This specification defines public normalized catalogs for frontend, PWA, Postman, and operational clients.

## Requirements

### Requirement: Public catalog access

The system SHALL expose catalog endpoints without authentication.

#### Scenario: Client loads catalogs at startup
- WHEN a client calls `GET /api/catalog/all`
- THEN the system SHALL return all catalog domains in one response

### Requirement: Catalog domain index

The system SHALL expose `GET /api/catalog` as an index of available catalog domains.

#### Scenario: Client requests catalog index
- WHEN a client calls `GET /api/catalog`
- THEN the response SHALL include module metadata, route hints, count, and domain summaries

### Requirement: Catalog by key

The system SHALL expose `GET /api/catalog/:key` for valid catalog keys.

#### Scenario: Client requests NNA status catalog
- WHEN a client calls `GET /api/catalog/nna-status`
- THEN the system SHALL return status items and event-to-status transitions

#### Scenario: Client requests invalid key
- WHEN a client calls `GET /api/catalog/:key` with an invalid key
- THEN the system SHALL reject the request with HTTP 400 or 404 according to validation outcome

### Requirement: Baseline catalog keys

The system SHALL support these catalog keys: `nna-status`, `timeline-events`, `estado-salud`, `roles`, `account-status`, `institution-types`, `entidad-atencion-types`, `edad-aparente`, and `sexo-nna`.

#### Scenario: Frontend renders selects and badges
- WHEN frontend code needs labels or valid enum values
- THEN it SHALL use catalog items instead of hardcoding display strings

### Requirement: NNA status transitions

The `nna-status` catalog SHALL document status transitions from timeline events.

#### Scenario: Transition metadata is read
- WHEN clients inspect `nna-status.transitions`
- THEN `TRASLADO` SHALL map to `EN_TRANSITO`
- AND `INGRESO_REFUGIO` SHALL map to `RESGUARDADO`
- AND `ENTREGA_OFICIAL` SHALL map to `ENTREGADO_AUTORIDAD`
