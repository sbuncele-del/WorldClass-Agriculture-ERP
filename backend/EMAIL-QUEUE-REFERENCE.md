# Email Queue System - Developer Quick Reference

## Import
```typescript
import EmailQueueService from './services/email-queue.service';
```

## Common Operations

### Queue Email Verification (High Priority)
```typescript
await EmailQueueService.queueEmailVerification(
  email, userId, tenantId,
  { verificationUrl, frontendUrl }
);
```

### Queue Password Reset (High Priority)
```typescript
await EmailQueueService.queuePasswordReset(
  email, userId, tenantId,
  { resetUrl, frontendUrl }
);
```

### Queue Welcome Email (Normal Priority)
```typescript
await EmailQueueService.queueWelcomeEmail(
  email, userId, tenantId,
  { userName, email, dashboardUrl, frontendUrl }
);
```

### Queue Payment Success (High Priority)
```typescript
await EmailQueueService.queuePaymentSuccess(
  email, userId, tenantId,
  { userName, amount, currency, planName, invoiceNumber, paymentDate, dashboardUrl, frontendUrl }
);
```

### Queue Security Alert (High Priority)
```typescript
await EmailQueueService.queueSecurityAlert(
  email, userId, tenantId,
  { userName, alertType, description, timestamp, ipAddress, location, securityUrl, frontendUrl }
);
```

### Queue Custom Email
```typescript
// High priority
await EmailQueueService.queueHighPriority({
  to: 'user@example.com',
  subject: 'Subject',
  template: 'template-name',
  variables: { key: 'value' },
  userId, tenantId,
  category: 'category_name'
});

// Normal priority
await EmailQueueService.queueNormalPriority({ ... });

// Low priority
await EmailQueueService.queueLowPriority({ ... });
```

### Schedule Email
```typescript
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
await EmailQueueService.queueScheduled(
  { to, subject, template, variables, userId, tenantId, category },
  tomorrow,
  'normal'
);
```

### Drip Campaign
```typescript
// Send in 24 hours (1440 minutes)
await EmailQueueService.queueDripCampaign(
  { to, subject, template, variables, userId, tenantId, category },
  1440
);
```

### Batch Emails
```typescript
const recipients = ['user1@example.com', 'user2@example.com'];
await EmailQueueService.queueBatch(
  recipients,
  { subject, template, variables, category },
  'low'
);
```

## Monitoring Endpoints

```bash
# Get stats
curl http://localhost:3000/api/admin/email-queue/stats

# Health check
curl http://localhost:3000/api/admin/email-queue/health

# Failed jobs
curl http://localhost:3000/api/admin/email-queue/failed

# Retry job
curl -X POST http://localhost:3000/api/admin/email-queue/retry/JOB_ID

# Pause queue
curl -X POST http://localhost:3000/api/admin/email-queue/pause

# Resume queue
curl -X POST http://localhost:3000/api/admin/email-queue/resume

# Clear completed
curl -X DELETE http://localhost:3000/api/admin/email-queue/completed

# Clear failed
curl -X DELETE http://localhost:3000/api/admin/email-queue/failed
```

## Priority Guidelines

| Priority | Use For | Examples |
|----------|---------|----------|
| **High** | Critical, time-sensitive | Password reset, email verification, payment confirmations |
| **Normal** | Important notifications | Team invites, security alerts, low stock warnings |
| **Low** | Non-urgent communications | Marketing emails, newsletters, product updates |

## Email Categories

- `security_alerts` - Cannot be disabled
- `payment_notifications`
- `subscription_notifications`
- `inventory_alerts`
- `team_notifications`
- `system_notifications`
- `product_updates`
- `marketing_emails`

## Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false
```

## Troubleshooting

### Queue not processing?
```bash
# Check Redis
redis-cli ping

# Check queue stats
curl http://localhost:3000/api/admin/email-queue/stats

# Restart queue
curl -X POST http://localhost:3000/api/admin/email-queue/pause
curl -X POST http://localhost:3000/api/admin/email-queue/resume
```

### High failed rate?
```bash
# View failed jobs
curl http://localhost:3000/api/admin/email-queue/failed

# Retry specific job
curl -X POST http://localhost:3000/api/admin/email-queue/retry/JOB_ID
```

### Memory issues?
```bash
# Clear old jobs
curl -X DELETE http://localhost:3000/api/admin/email-queue/completed
```

## Best Practices

1. ✅ Use appropriate priority (high = critical only)
2. ✅ Include userId/tenantId for preference checking
3. ✅ Always specify email category
4. ✅ Use batch queuing for multiple recipients
5. ✅ Monitor queue health regularly
6. ✅ Clean up completed jobs periodically

## Example Integration

```typescript
// In your controller
import EmailQueueService from '../services/email-queue.service';

export async function signup(req: Request, res: Response) {
  // ... create user ...
  
  // Queue welcome email (non-blocking)
  await EmailQueueService.queueWelcomeEmail(
    user.email,
    user.id,
    user.tenant_id,
    {
      userName: user.name,
      email: user.email,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      frontendUrl: process.env.FRONTEND_URL!,
    }
  );
  
  res.json({ success: true, user });
}
```

---

**Full Documentation**: `EMAIL-QUEUE-SYSTEM.md`  
**Setup Guide**: `EMAIL-QUEUE-QUICK-START.md`
