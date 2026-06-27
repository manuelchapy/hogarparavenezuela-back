## Why

The backend needs a repeatable production deployment path for Google Cloud Run. The repository currently has a Node.js start script and Cloud Run-compatible port handling, but lacks container, service, and CI/CD artifacts.

## What Changes

- Add a production Docker container definition for the Express API.
- Add a Cloud Run service YAML template for project `hogarparavenezuela`, region `us-central1`, and service `hogarparavenezuela-back`.
- Add a GitHub Actions deployment workflow that builds the image, pushes it to Artifact Registry, and deploys to Cloud Run using OIDC / Workload Identity Federation.
- Add deployment documentation for required Google Cloud setup, GitHub configuration, and verification.
- Do not commit production secrets or long-lived Google service account keys.

## Capabilities

### New Capabilities

- `cloud-run-deployment`: Defines containerized Cloud Run deployment, CI/CD, and operational setup requirements for the backend service.

### Modified Capabilities

- None.

## Impact

- Adds deployment infrastructure files: `Dockerfile`, `.dockerignore`, `cloudrun/service.yaml`, `.github/workflows/deploy-cloud-run.yml`, and `docs/deployment/cloud-run.md`.
- Uses existing `npm start` and `src/server.js` entrypoint without changing API behavior.
- Requires Google Cloud resources outside the repository: Artifact Registry, Cloud Run, a deployer service account, and Workload Identity Federation.
- Requires GitHub repository variables/secrets for project, region, service, Artifact Registry repository, WIF provider, and deployer service account.
