# 🚀 Security & Monitoring Deployment Checklist (Week 1)

## 🔐 Security (GAP-011, GAP-018)
- [ ] **SSL Verification**: Ensure `NODE_TLS_REJECT_UNAUTHORIZED` is NOT set to '0'.
- [ ] **RDS CA Bundle**: Verify `global-bundle.pem` is present in the container image.
- [ ] **JWT Secrets**: Ensure `JWT_SECRET` is set in SSM/Secrets Manager. No hardcoded fallbacks.
- [ ] **Environment Validation**: Verify app fails to start if required env vars are missing.

## 💾 Data Protection (GAP-012)
- [ ] **RDS Backups**: Verify automated backups are enabled (30 days retention).
- [ ] **S3 Backups**: Verify S3 bucket exists for manual exports/logs.
- [ ] **Encryption**: Verify RDS storage encryption is enabled.

## 👁️ Monitoring (GAP-013)
- [ ] **Sentry**: Verify Sentry DSN is configured and events are being received.
- [ ] **CloudWatch**: Verify log groups are created and logs are flowing.
- [ ] **Alarms**: Verify CPU/Memory alarms are set.

## 🔌 API (GAP-014)
- [ ] **Versioning**: Verify endpoints are accessible via `/api/v1/...`.
- [ ] **Compatibility**: Verify endpoints are still accessible via `/api/...` (if required).

## 🚀 Infrastructure
- [ ] **Terraform**: Run `terraform plan` and `terraform apply` to provision resources.
- [ ] **CI/CD**: Verify GitHub Actions pipeline passes (Test, Scan, Build).
- [ ] **Docker**: Verify image builds successfully with non-root user.

## 📝 Post-Deployment
- [ ] **Health Check**: `GET /health` returns 200 OK.
- [ ] **DB Connection**: `GET /health/db` returns 200 OK.
- [ ] **Smoke Test**: Login and fetch profile.
