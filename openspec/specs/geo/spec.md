# Geography Specification

## Purpose

This specification defines public Venezuela administrative geography endpoints and location validation for users and NNA records.

## Requirements

### Requirement: Public geography catalog

The system SHALL expose Venezuela geography catalog endpoints without authentication.

#### Scenario: Client loads states
- WHEN a client calls `GET /api/geo/states`
- THEN the system SHALL return Venezuelan states with count and item metadata

### Requirement: Geography hierarchy

The system SHALL model the hierarchy country, state, city, optional municipality, and optional parish.

#### Scenario: Client builds a cascading location form
- WHEN a client selects a state
- THEN the client SHALL be able to request cities through `GET /api/geo/states/:stateId/cities`
- AND municipalities through `GET /api/geo/states/:stateId/municipalities`

### Requirement: Parish depends on municipality

The system SHALL expose parishes by municipality.

#### Scenario: Client selects municipality
- WHEN a client calls `GET /api/geo/municipalities/:municipalityId/parishes`
- THEN the system SHALL return parishes belonging to that municipality

### Requirement: Location input references

User and NNA `ubicacion` input SHALL require `state` and `city`, MAY include `country`, `municipality`, and `parish`, and SHALL default country to Venezuela when omitted.

#### Scenario: Valid location is submitted
- WHEN a request includes valid `state` and `city` ObjectIds with consistent parent-child relationships
- THEN the system SHALL accept the location

#### Scenario: Inconsistent location is submitted
- WHEN a request includes a city that does not belong to the provided state
- THEN the system SHALL reject the request with HTTP 400

### Requirement: Geographic filtering

The system SHALL support NNA listing filters by `stateId` and `cityId`.

#### Scenario: Operator filters records by state
- WHEN an active user calls `GET /api/nna?stateId=<id>`
- THEN the system SHALL return NNA records in that state
