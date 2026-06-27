# Cloud Run Deployment

This project deploys `hogarparavenezuela-back` to Google Cloud Run from GitHub Actions using Workload Identity Federation / OIDC.

## Defaults

| Setting | Value |
| --- | --- |
| Google Cloud project | `hogarparavenezuela` |
| Region | `us-central1` |
| Cloud Run service | `hogarparavenezuela-back` |
| Artifact Registry repository | `cloud-run` |
| Image name | `hogarparavenezuela-back` |

## Google Cloud Setup

Run these commands from a terminal authenticated with `gcloud`.

```bash
export PROJECT_ID="hogarparavenezuela"
export REGION="us-central1"
export GITHUB_OWNER="YOUR_GITHUB_ORG_OR_USERNAME"
export GITHUB_REPO="hogarparavenezuela-back"
export SERVICE_NAME="hogarparavenezuela-back"
export GAR_REPOSITORY="cloud-run"
export SERVICE_ACCOUNT="github-cloud-run-deployer"
```

Enable required APIs:

```bash
gcloud config set project "$PROJECT_ID"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
```

Create the Artifact Registry Docker repository:

```bash
gcloud artifacts repositories create "$GAR_REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Docker images for Cloud Run"
```

Create the deployer service account:

```bash
gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
  --display-name="GitHub Cloud Run Deployer"
```

Grant deployment permissions:

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

Create the Workload Identity Federation pool and provider:

```bash
gcloud iam workload-identity-pools create "github-actions" \
  --project="$PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "github" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="attribute.repository == '$GITHUB_OWNER/$GITHUB_REPO'"
```

Allow this GitHub repository to impersonate the deployer service account:

```bash
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

gcloud iam service-accounts add-iam-policy-binding \
  "$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/$GITHUB_OWNER/$GITHUB_REPO"
```

Print the values needed by GitHub:

```bash
echo "GCP_PROJECT_ID=$PROJECT_ID"
echo "GCP_REGION=$REGION"
echo "CLOUD_RUN_SERVICE=$SERVICE_NAME"
echo "GAR_REPOSITORY=$GAR_REPOSITORY"
echo "IMAGE_NAME=$SERVICE_NAME"
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/github"
echo "GCP_SERVICE_ACCOUNT=$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"
```

## GitHub Configuration

Create these repository variables in GitHub Actions:

| Variable | Value |
| --- | --- |
| `GCP_PROJECT_ID` | `hogarparavenezuela` |
| `GCP_REGION` | `us-central1` |
| `CLOUD_RUN_SERVICE` | `hogarparavenezuela-back` |
| `GAR_REPOSITORY` | `cloud-run` |
| `IMAGE_NAME` | `hogarparavenezuela-back` |

Create these repository secrets in GitHub Actions:

| Secret | Value |
| --- | --- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<project-number>/locations/global/workloadIdentityPools/github-actions/providers/github` |
| `GCP_SERVICE_ACCOUNT` | `github-cloud-run-deployer@hogarparavenezuela.iam.gserviceaccount.com` |

## Runtime Configuration

Do not commit production secrets to this repository.

Configure required runtime values in Cloud Run or Secret Manager before treating a deployment as production-ready:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `STORAGE_PROVIDER`
- `PUBLIC_BASE_URL`
- `GCS_PROJECT_ID`, `GCS_BUCKET`, and GCS credentials or service account access when using Google Cloud Storage
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET` when using S3
- `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET`
- `BOOTSTRAP_SECRET`

For production uploads on Cloud Run, prefer `STORAGE_PROVIDER=gcs` or another external storage provider. The container filesystem is ephemeral.

## Deployment Flow

The workflow `.github/workflows/deploy-cloud-run.yml` runs on pushes to `main` and manual `workflow_dispatch` runs.

It performs these steps:

1. Authenticates to Google Cloud using GitHub OIDC.
2. Builds a Docker image tagged with the Git commit SHA.
3. Pushes the image to Artifact Registry.
4. Replaces `IMAGE_PLACEHOLDER` in `cloudrun/service.yaml` with the built image URI.
5. Applies the rendered service YAML to Cloud Run.
6. Sends all traffic to the latest revision.

## Verification

After deployment, get the service URL:

```bash
gcloud run services describe "hogarparavenezuela-back" \
  --project="hogarparavenezuela" \
  --region="us-central1" \
  --format='value(status.url)'
```

Check the health endpoint:

```bash
curl "$(gcloud run services describe "hogarparavenezuela-back" \
  --project="hogarparavenezuela" \
  --region="us-central1" \
  --format='value(status.url)')/api/health"
```

Expected response includes:

```json
{
  "success": true,
  "data": {
    "service": "hogarparavenezuela-back",
    "status": "ok"
  }
}
```

## Rollback

List revisions:

```bash
gcloud run revisions list \
  --service="hogarparavenezuela-back" \
  --project="hogarparavenezuela" \
  --region="us-central1"
```

Route traffic back to a known-good revision:

```bash
gcloud run services update-traffic "hogarparavenezuela-back" \
  --project="hogarparavenezuela" \
  --region="us-central1" \
  --to-revisions="REVISION_NAME=100"
```
