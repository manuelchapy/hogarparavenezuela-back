# Cloud Run Deployment Design

## Goal

Deploy `hogarparavenezuela-back` to Google Cloud Run using a repeatable container and GitHub Actions workflow.

## Decisions

- Google Cloud project ID: `hogarparavenezuela`
- Cloud Run region: `us-central1`
- Cloud Run service name: `hogarparavenezuela-back`
- Artifact Registry repository: `cloud-run`
- GitHub Actions authentication: Workload Identity Federation / OIDC
- No long-lived Google service account JSON key will be stored in GitHub secrets.

## Architecture

```text
push to main
   |
   v
GitHub Actions
   |
   +-- checkout repository
   +-- authenticate to Google Cloud with OIDC
   +-- build Docker image
   +-- push image to Artifact Registry
   +-- render/apply Cloud Run service YAML
   |
   v
Cloud Run service: hogarparavenezuela-back
```

Runtime path:

```text
Cloud Run injects PORT
   |
   v
Container runs npm start
   |
   v
node src/server.js
   |
   v
Express app listens on env.port
```

## Files To Add

- `Dockerfile`: production Node.js container using `npm ci --omit=dev` and `npm start`.
- `.dockerignore`: excludes local dependencies, git metadata, tests, generated uploads, credentials, and local env files from the image context.
- `cloudrun/service.yaml`: Cloud Run service template for `hogarparavenezuela-back` in `us-central1`.
- `.github/workflows/deploy-cloud-run.yml`: CI/CD workflow triggered from `main` using GitHub OIDC.
- `docs/deployment/cloud-run.md`: setup and deployment notes, including required Google Cloud commands and GitHub variables/secrets.

## GitHub Actions Design

The workflow will:

1. Run on pushes to `main` and allow manual `workflow_dispatch` runs.
2. Request only the permissions needed for OIDC and checkout:
   - `id-token: write`
   - `contents: read`
3. Authenticate to Google Cloud using `google-github-actions/auth` with Workload Identity Federation.
4. Configure Docker authentication for Artifact Registry.
5. Build and push an image tagged with the Git commit SHA.
6. Replace a placeholder image in `cloudrun/service.yaml` with the built image.
7. Deploy the rendered service YAML to Cloud Run.

## Cloud Run Service Design

The service YAML will define:

- Service name: `hogarparavenezuela-back`
- Region label: `us-central1`
- Ingress: public (`all`) unless restricted later.
- A single application container.
- Container port: `8080`.
- Resource limits suitable for an API baseline.
- Environment variables for non-secret defaults only.

Secrets such as `MONGODB_URI`, `JWT_SECRET`, provider credentials, and webhook secrets will not be committed. They should be configured in Cloud Run directly or through Secret Manager bindings after the service exists.

## Required Google Cloud Setup

The user must prepare:

- Required APIs: Cloud Run, Artifact Registry, IAM, IAM Credentials, Security Token Service, and Cloud Build.
- Artifact Registry repository: `cloud-run` in `us-central1`.
- Deployment service account for GitHub Actions.
- Workload Identity Federation pool/provider restricted to this GitHub repository.
- IAM permissions for the deployer service account:
  - `roles/run.admin`
  - `roles/artifactregistry.writer`
  - `roles/iam.serviceAccountUser`

## Error Handling And Operational Notes

- If Cloud Run cannot connect to MongoDB, startup will fail because `src/server.js` connects before listening.
- Cloud Run requires the app to listen on the injected `PORT`; the current app already reads `process.env.PORT` through `src/config/env.js`.
- Local file storage is not durable on Cloud Run. Production deployments should use GCS or another external storage provider for uploaded media.
- The health endpoint is available under `/api/health`.

## Testing And Verification

Implementation should verify:

- `npm test` passes locally.
- Docker image builds locally.
- Container starts with `PORT=8080`.
- Cloud Run workflow syntax is valid enough for GitHub Actions.
- Deployment docs contain the exact required GitHub variables/secrets.

## Out Of Scope

- Creating Google Cloud resources from GitHub Actions.
- Managing production secrets in repository files.
- Changing application runtime behavior beyond what is required for container deployment.
- Adding Terraform or other infrastructure-as-code tooling.
