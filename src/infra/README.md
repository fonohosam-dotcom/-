# Takaful Infrastructure (IaC)

This directory contains the Terraform configuration for provisioning the GCP infrastructure for the Takaful project.

## Components:
1. **Cloud SQL (PostgreSQL)** - `takaful-db-instance`
2. **Cloud KMS** - `takaful-keyring` / `takaful-pii-key` for PII Encryption

## Deployment:
To deploy, initialize Terraform and apply:
\`\`\`bash
terraform init
terraform apply -var="project_id=YOUR_PROJECT_ID"
\`\`\`
