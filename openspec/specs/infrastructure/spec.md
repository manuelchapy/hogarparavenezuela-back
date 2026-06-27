# Infrastructure Specification

## Purpose

This specification defines runtime services, environment variables, storage, webhooks, and deployment expectations.

## Requirements

### Requirement: MongoDB persistence

The system SHALL use MongoDB through Mongoose for users, NNA records, geography, institutions, attention entities, and audit logs.

#### Scenario: API starts successfully
- WHEN the backend starts
- THEN it SHALL connect to the configured `MONGODB_URI`

### Requirement: Environment configuration

The system SHALL configure runtime behavior through environment variables.

#### Scenario: Deployment configures runtime
- WHEN deploying the API
- THEN `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `STORAGE_PROVIDER`, storage credentials, `CORS_ORIGIN`, and optional n8n variables SHALL be configured as needed

### Requirement: Object storage abstraction

The system SHALL support object storage through the configured `STORAGE_PROVIDER`.

#### Scenario: GCS is configured
- WHEN `STORAGE_PROVIDER=gcs`
- THEN the system SHALL use `GCS_PROJECT_ID`, `GCS_BUCKET`, and available Google credentials to upload files

#### Scenario: S3 is configured
- WHEN `STORAGE_PROVIDER=s3`
- THEN the system SHALL use AWS region, access key, secret key, and bucket configuration to upload files

### Requirement: Upload constraints

The system SHALL limit uploads to the documented multipart field and allowed MIME types.

#### Scenario: Unsupported file type is uploaded
- WHEN a file MIME type is not `image/jpeg`, `image/png`, `image/webp`, or `application/pdf`
- THEN the system SHALL reject the upload with HTTP 400

### Requirement: Storage paths

The system SHALL use stable object path conventions for NNA photos and legal acts.

#### Scenario: Previous photo is uploaded
- WHEN `POST /api/nna/subir-foto` stores an image
- THEN the storage path SHALL follow `nna/previa/{cedula}-{uuid}.{ext}`

#### Scenario: NNA file is uploaded
- WHEN `POST /api/nna/:id/archivos` stores a face photo or act
- THEN the storage path SHALL be scoped under `nna/{nnaId}/`

### Requirement: n8n webhook degradation

The system SHALL treat n8n webhooks as optional and non-blocking.

#### Scenario: Webhook URL is not configured
- WHEN an NNA event occurs and `N8N_WEBHOOK_URL` is empty
- THEN the API operation SHALL still succeed

### Requirement: Local development checklist

The system SHALL document local startup steps including dependency install, MongoDB configuration, geography seed, API start, and test execution.

#### Scenario: New collaborator starts locally
- WHEN a collaborator follows the README and infrastructure docs
- THEN they SHALL be able to identify `npm install`, `.env`, `npm run seed:geo`, `npm run dev`, and `npm test` as the baseline workflow
