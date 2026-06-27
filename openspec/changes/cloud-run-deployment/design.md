## Context

`hogarparavenezuela-back` is an Express/Mongoose API with `npm start` mapped to `node src/server.js`. The server already reads `process.env.PORT` through `src/config/env.js`, which matches Cloud Run's container contract. The repository does not yet include a Dockerfile, Cloud Run service definition, or GitHub Actions workflow for production deployment.

The deployment target is Google Cloud project `hogarparavenezuela`, region `us-central1`, service `hogarparavenezuela-back`. Authentication from GitHub Actions will use Workload Identity Federation / OIDC to avoid storing long-lived Google service account JSON keys.

## Goals / Non-Goals

**Goals:**

- Provide a production container definition for the Node.js API.
- Provide a repeatable Cloud Run service YAML template.
- Provide a GitHub Actions workflow that builds, pushes, and deploys the service from `main`.
- Document required Google Cloud and GitHub setup.
- Keep production secrets out of committed files.

**Non-Goals:**

- Provision Google Cloud resources from the repository.
- Add Terraform or another infrastructure-as-code layer.
- Change API behavior or database models.
- Commit production secrets, service account keys, or environment-specific credentials.

## Decisions

### Use a repository Dockerfile instead of Google Cloud buildpacks

A Dockerfile makes the runtime explicit and portable. It can install production dependencies with `npm ci --omit=dev`, copy application files, expose the Cloud Run port, and run `npm start`.

Alternative considered: buildpacks. Buildpacks reduce Dockerfile maintenance, but make the runtime less explicit for this repository's first deployment path.

### Use Cloud Run service YAML as the deployment contract

The workflow will render an image placeholder in `cloudrun/service.yaml` and apply it during deployment. This keeps Cloud Run configuration reviewable in the repository while still allowing each workflow run to deploy an immutable image tag.

Alternative considered: only use `gcloud run deploy` flags. That is simpler initially, but scatters service configuration into workflow flags and makes future service changes harder to review.

### Use GitHub OIDC / Workload Identity Federation

The deployment workflow will request `id-token: write` and authenticate to Google Cloud using a configured Workload Identity Provider and deployer service account. This avoids storing long-lived service account JSON keys in GitHub.

Alternative considered: service account JSON key secret. That is easier to set up manually, but creates a persistent credential rotation and leakage risk.

### Keep secrets outside committed YAML

The service YAML will include only non-secret defaults. Production values such as `MONGODB_URI`, `JWT_SECRET`, cloud storage credentials, and webhook secrets must be configured through Cloud Run settings or Secret Manager bindings outside the repository.

Alternative considered: include environment variable placeholders for every runtime setting. That can imply secrets are expected in source-controlled YAML, so the docs will instead explain how to configure them safely.

## Risks / Trade-offs

- Cloud Run startup fails if MongoDB is unreachable -> Document that `MONGODB_URI` must point to a reachable production database before deployment verification.
- Local file uploads are ephemeral on Cloud Run -> Document that production deployments should use GCS or another external storage provider.
- GitHub Actions deployment fails if Workload Identity Federation is not configured correctly -> Document exact setup commands and required GitHub variables/secrets.
- Service YAML can overwrite manually changed Cloud Run settings -> Keep the YAML focused and document that repository configuration is the source of truth for managed service settings.

## Migration Plan

1. Add container, Cloud Run YAML, workflow, and deployment docs.
2. User creates required Google Cloud resources and GitHub variables/secrets.
3. First deployment runs manually through `workflow_dispatch` or by pushing to `main`.
4. Verify `/api/health` after deployment.
5. If deployment fails, roll back by redeploying the previous Cloud Run revision or disabling traffic to the failed revision in Cloud Run.

## Open Questions

- The final production values for `MONGODB_URI`, `JWT_SECRET`, CORS, storage provider, and webhook secrets must be supplied outside source control before a production deployment is healthy.
