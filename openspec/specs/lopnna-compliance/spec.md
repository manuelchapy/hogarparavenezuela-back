# LOPNNA-Oriented Compliance Specification

## Purpose

This specification defines the baseline child-protection operating rules documented for LOPNNA-oriented workflows.

## Requirements

### Requirement: Role permission matrix

The system SHALL enforce role permissions for NNA actions and timeline events.

#### Scenario: Registration action is requested
- WHEN `POST /api/nna` is called
- THEN only `RESCATISTA_CIVIL`, `PROTECCION_CIVIL`, `PERSONAL_MEDICO`, and `ADMINISTRADOR` SHALL be allowed

#### Scenario: Official delivery event is requested
- WHEN a user submits `ENTREGA_OFICIAL`
- THEN only `CONSEJERO_CPNNA` and `ADMINISTRADOR` SHALL be allowed

### Requirement: Protección Civil cannot close legally

The system SHALL prevent `PROTECCION_CIVIL` from performing legal closure.

#### Scenario: Protección Civil attempts legal closure
- WHEN a `PROTECCION_CIVIL` user calls `POST /api/nna/:id/cierre-legal`
- THEN the system SHALL respond with HTTP 403

### Requirement: Voice of adolescent NNA

The system SHALL require voice documentation for adolescent NNA records.

#### Scenario: Adolescent is heard
- WHEN `vozDelNna.fueEscuchado` is `true`
- THEN `manifestacion` SHALL document the adolescent's expressed will or relevant statement

#### Scenario: Adolescent is not heard
- WHEN `vozDelNna.fueEscuchado` is `false`
- THEN `justificacionNoEscucha` SHALL be required

### Requirement: Institutional transfer destination

Transfers and shelter admission SHALL require an authorized institutional destination.

#### Scenario: Transfer has no authorized destination
- WHEN `TRASLADO` or `INGRESO_REFUGIO` is submitted without `entidadAtencionId`
- THEN the system SHALL reject the request with HTTP 400

#### Scenario: Destination is not authorized
- WHEN `entidadAtencionId` references an inactive or unauthorized destination
- THEN the system SHALL reject the request with HTTP 403

### Requirement: Legal closure evidence

Legal closure SHALL require official act metadata and scanned evidence.

#### Scenario: Closure lacks scanned act URL
- WHEN legal closure is submitted without `scannedActaUrl`
- THEN the system SHALL respond with HTTP 400

### Requirement: Audit log

The system SHALL record audit logs for critical mutations.

#### Scenario: Critical mutation occurs
- WHEN user request, approval, rejection, admin registration, NNA registration, timeline update, location update, or legal closure occurs
- THEN the system SHALL create an audit log entry with entity, action, actor, metadata, and IP context when available
