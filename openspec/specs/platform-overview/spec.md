# Platform Overview Specification

## Purpose

This specification defines the baseline mission, actors, and operating principles for Hogar para Venezuela.

## Requirements

### Requirement: Nonprofit emergency-response purpose

The system SHALL support nonprofit humanitarian coordination for the rescue and traceability of children and adolescents (`NNA`) during the June 25, 2026 Venezuela seismic emergency response.

#### Scenario: Public collaborator reviews project purpose
- WHEN a collaborator reads the root documentation
- THEN the project SHALL be presented as nonprofit, humanitarian, and emergency-response oriented
- AND it SHALL NOT be presented as a commercial product

### Requirement: Child-protection sensitivity

The system SHALL treat NNA rescue records as sensitive operational and child-protection data.

#### Scenario: Sensitive data is handled
- WHEN the system stores or exposes NNA rescue information
- THEN access SHALL be limited through documented authentication, account status, and role rules
- AND public documentation SHALL warn against unauthorized disclosure or unauthorized transfers

### Requirement: Authorized operational actors

The system SHALL model the following operational roles: `RESCATISTA_CIVIL`, `PROTECCION_CIVIL`, `PERSONAL_MEDICO`, `CONSEJERO_CPNNA`, and `ADMINISTRADOR`.

#### Scenario: Role-dependent action is requested
- WHEN an authenticated user attempts an operational action
- THEN the system SHALL evaluate the user's role against the documented permission matrix

### Requirement: Documentation baseline

The system SHALL preserve the original `docs/` documentation as frontend and developer-facing reference while using `openspec/specs/` as the baseline requirements catalog.

#### Scenario: A new change is proposed
- WHEN a contributor proposes a change
- THEN the contributor SHALL evaluate it against the relevant OpenSpec baseline capability
- AND SHALL preserve compatibility with the original docs unless a spec change is proposed
