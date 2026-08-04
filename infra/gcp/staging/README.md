# Gogamdo Cloud SQL PITR staging

This module creates only the isolated Cloud SQL staging database used to prove a Railway-to-GCP logical restore and Cloud SQL point-in-time recovery. It does not deploy the application, change Railway, change DNS, or cut production traffic.

## Fixed safety boundaries

- Project: `gogamdo-staging`
- Region: Seoul `asia-northeast3`
- Database: Cloud SQL for MySQL 8.4 LTS
- Edition/tier: Enterprise `db-f1-micro`, zonal staging only
- Storage: 10 GiB SSD, auto-resize capped at 100 GiB
- Automated backup: 18:00 UTC / 03:00 KST
- Retained automated backups: 8
- PITR transaction logs: 7 days
- Direct public-IP authorized networks: none
- Transport: encrypted only; use Cloud SQL Auth Proxy/connectors
- Deletion protection: Terraform and Cloud SQL API guards enabled
- Credentials: no passwords, tokens, or connection strings in Terraform

`db-f1-micro` is shared-core and has no Cloud SQL SLA. It is intentionally restricted to staging/PITR verification. Do not reuse it as the production sizing decision.

## Current execution gate

The GCP project exists, but Cloud Billing must be created and linked by the account owner before Terraform can enable APIs or create Cloud SQL. The payment method must never be placed in source, terminal history, Terraform variables/state, or chat.

## Apply sequence

```bash
gcloud auth login
gcloud config set project gogamdo-staging

gcloud billing projects describe gogamdo-staging

terraform init
terraform fmt -check
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

Do not apply unless the billing account is active and the plan shows only the expected staging APIs, one Cloud SQL instance, and one database.

## Post-apply verification

Require machine-readable proof:

```bash
gcloud sql instances describe gogamdo-mysql-staging \
  --project=gogamdo-staging \
  --format=json
```

The accepted instance must show:

- region `asia-northeast3`
- database version MySQL 8.4
- `db-f1-micro`, zonal
- automated backups enabled
- binary logging enabled
- seven retained transaction-log days
- eight retained automated backups
- deletion protection enabled
- no authorized public networks

## PITR drill boundary

1. Import the already restore-verified Railway logical dump into this staging instance.
2. Verify all 121 tables, 417 rows, columns, indexes, and schema objects.
3. Record a timestamp, create a staging-only marker transaction, and wait until the latest recoverable time advances past it.
4. Perform PITR into a **new restore instance**, never over Railway or the source staging instance.
5. Prove that data before the selected timestamp exists and the marker written after that timestamp does not.
6. Re-run schema, row-count, index, and application smoke verification.
7. Measure restore completion time as a drill result, not as a guaranteed production RTO.

## Destruction guard

Terraform and Cloud SQL deletion protection are both enabled. Cleanup after the drill requires a separate approved change that disables both protections. Never delete Railway rollback capacity as part of this staging cleanup.
