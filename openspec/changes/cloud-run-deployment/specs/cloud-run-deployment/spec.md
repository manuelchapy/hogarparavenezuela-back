## ADDED Requirements

### Requirement: Production container image
The system SHALL define a production Docker container for the backend API that installs production dependencies and starts the existing Node.js server entrypoint.

#### Scenario: Build container image
- **WHEN** a container image is built from the repository root
- **THEN** the image contains the backend application and can start with `npm start`

#### Scenario: Listen on Cloud Run port
- **WHEN** the container runs with `PORT=8080`
- **THEN** the Express server listens on the configured port

### Requirement: Cloud Run service template
The system SHALL provide a Cloud Run service YAML template for service `hogarparavenezuela-back` in project region `us-central1`.

#### Scenario: Render deployable service YAML
- **WHEN** the deployment workflow provides a concrete container image
- **THEN** the service YAML can be rendered with that image and applied to Cloud Run

#### Scenario: Avoid committing production secrets
- **WHEN** reviewing the Cloud Run service YAML
- **THEN** no production secret values or long-lived service account credentials are present in the repository

### Requirement: GitHub Actions deployment
The system SHALL provide a GitHub Actions workflow that builds the backend image, pushes it to Artifact Registry, and deploys it to Cloud Run using OIDC authentication.

#### Scenario: Deploy from main
- **WHEN** code is pushed to `main`
- **THEN** GitHub Actions builds an image tagged with the commit SHA and deploys it to Cloud Run

#### Scenario: Manual deployment
- **WHEN** a maintainer runs the workflow manually
- **THEN** GitHub Actions performs the same build, push, and deploy process

#### Scenario: Authenticate without JSON key
- **WHEN** the workflow authenticates to Google Cloud
- **THEN** it uses Workload Identity Federation / OIDC rather than a long-lived service account JSON key

### Requirement: Deployment documentation
The system SHALL document the Google Cloud setup, GitHub configuration, deployment flow, and verification steps needed to operate the Cloud Run deployment.

#### Scenario: Prepare cloud resources
- **WHEN** a maintainer follows the deployment documentation
- **THEN** they can create or verify the required APIs, Artifact Registry repository, deployer service account, and Workload Identity Federation binding

#### Scenario: Configure GitHub repository
- **WHEN** a maintainer follows the deployment documentation
- **THEN** they know which GitHub variables and secrets are required by the workflow
