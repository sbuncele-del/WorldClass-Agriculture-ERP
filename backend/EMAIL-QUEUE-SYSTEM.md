# Email Queue System - Complete Documentation

## Overview

The Email Queue System provides reliable, scalable email delivery using **Bull** (job queue) and **Redis** (message broker). This system enables background email processing with automatic retries, priority handling, scheduled delivery, and comprehensive monitoring.

## Architecture

```
┌─────────────────┐
│  Application    │
│  (Controller)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ EmailQueueService│ ◄── High-level service with priority helpers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  email.queue.ts  │ ◄── Bull queue configuration & processors
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Redis       │ ◄── Message broker & job storage
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  email.service  │ ◄── Direct email sending via Nodemailer
└─────────────────┘
```

## Features

### 1. Priority Queues
- **High Priority**: Transactional emails (password reset, email verification, payment confirmations)
- **Normal Priority**: Notifications (team invites, security alerts, low stock)
- **Low Priority**: Marketing emails, newsletters, product updates

### 2. Automatic Retries
- Exponential backoff retry strategy
- Configurable retry attempts (5 for high-priority, 3 for low-priority)
- Dead letter queue for permanently failed emails

### 3. Scheduled Delivery
- Queue emails for future delivery
- Drip campaign support
- Timezone-aware scheduling

### 4. Rate Limiting
- Prevent spam filter triggers
- Domain-specific rate limiting
- Configurable concurrency (10 simultaneous emails)

### 5. Monitoring & Metrics
- Real-time queue statistics
- Failed job tracking
- Performance metrics
- Health check endpoint

## Installation & Setup

### 1. Install Dependencies

Already installed:
```bash
npm install bull @types/bull ioredis @types/ioredis
```

### 2. Redis Setup

**Option A: Local Redis (Development)**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Verify
redis-cli ping
# Should return: PONG
```

**Option B: Redis Cloud (Production)**
- Sign up at [Redis Cloud](https://redis.com/try-free/)
- Get connection details
- Update `.env` with credentials

### 3. Environment Variables

Add to `.env`:
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false
```

### 4. Run Migration

```bash
psql -U username -d worldclass_erp -f src/migrations/010_email_queue_metrics.sql
```

### 5. Start Application

Queue workers start automatically with the application.

## Usage

### Basic Usage

```typescript
import EmailQueueService from './services/email-queue.service';

// Queue a high-priority email (processed immediately)
await EmailQueueService.queueHighPriority({
  to: 'user@example.com',
  subject: 'Password Reset',
  template: 'password-reset',
  variables: { resetUrl: 'https://...' },
  userId: 123,
  tenantId: 1,
  category: 'security_alerts',
});

// Queue a normal-priority email
await EmailQueueService.queueNormalPriority({
  to: 'user@example.com',
  subject: 'Team Invitation',
  template: 'team-invitation',
  variables: { companyName: 'Acme Corp' },
  category: 'team_notifications',
});

// Queue a low-priority marketing email
await EmailQueueService.queueLowPriority({
  to: 'user@example.com',
  subject: 'Newsletter',
  template: 'newsletter',
  variables: { content: '...' },
  userId: 123,
  tenantId: 1,
  category: 'marketing_emails',
});
```

### Scheduled Emails

```typescript
// Send email in 2 hours
const scheduledFor = new Date(Date.now() + 2 * 60 * 60 * 1000);

await EmailQueueService.queueScheduled(
  {
    to: 'user@example.com',
    subject: 'Reminder',
    template: 'reminder',
    variables: { message: 'Meeting in 1 hour' },
  },
  scheduledFor,
  'normal'
);

// Drip campaign: Send welcome series over 3 days
await EmailQueueService.queueDripCampaign(
  {
    to: 'user@example.com',
    subject: 'Day 1: Getting Started',
    template: 'drip-day-1',
    variables: { userName: 'John' },
  },
  0 // Send immediately
);

await EmailQueueService.queueDripCampaign(
  {
    to: 'user@example.com',
    subject: 'Day 2: Advanced Features',
    template: 'drip-day-2',
    variables: { userName: 'John' },
  },
  1440 // Send in 24 hours (1440 minutes)
);
```

### Batch Emails

```typescript
// Send newsletter to multiple recipients
const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

await EmailQueueService.queueBatch(
  recipients,
  {
    subject: 'Monthly Newsletter',
    template: 'newsletter',
    variables: { month: 'November' },
    category: 'marketing_emails',
  },
  'low'
);
```

### Specific Email Type Helpers

```typescript
// Email verification
await EmailQueueService.queueEmailVerification(
  'user@example.com',
  userId,
  tenantId,
  { verificationUrl: 'https://...' }
);

// Password reset
await EmailQueueService.queuePasswordReset(
  'user@example.com',
  userId,
  tenantId,
  { resetUrl: 'https://...' }
);

// Welcome email
await EmailQueueService.queueWelcomeEmail(
  'user@example.com',
  userId,
  tenantId,
  { userName: 'John', dashboardUrl: 'https://...' }
);

// Payment success
await EmailQueueService.queuePaymentSuccess(
  'user@example.com',
  userId,
  tenantId,
  { amount: '99.99', currency: 'ZAR', planName: 'Professional' }
);

// Security alert
await EmailQueueService.queueSecurityAlert(
  'user@example.com',
  userId,
  tenantId,
  { alertType: 'Unusual Login', description: '...' }
);
```

## Monitoring & Administration

### API Endpoints

All admin endpoints require authentication and admin privileges.

**Get Queue Statistics**
```bash
GET /api/admin/email-queue/stats

Response:
{
  "success": true,
  "stats": {
    "waiting": 45,
    "active": 3,
    "completed": 1250,
    "failed": 5,
    "delayed": 12,
    "total": 1315,
    "isPaused": false
  }
}
```

**Get Health Check**
```bash
GET /api/admin/email-queue/health

Response:
{
  "success": true,
  "healthy": true,
  "status": "healthy",
  "stats": { ... }
}
```

**Get Failed Jobs**
```bash
GET /api/admin/email-queue/failed?limit=50

Response:
{
  "success": true,
  "count": 5,
  "jobs": [
    {
      "id": "12345",
      "data": { "to": "user@example.com", ... },
      "failedReason": "Connection timeout",
      "attemptsMade": 5,
      "timestamp": 1699635000000
    }
  ]
}
```

**Retry Failed Job**
```bash
POST /api/admin/email-queue/retry/12345

Response:
{
  "success": true,
  "message": "Job 12345 queued for retry"
}
```

**Pause Queue**
```bash
POST /api/admin/email-queue/pause

Response:
{
  "success": true,
  "message": "Queue paused"
}
```

**Resume Queue**
```bash
POST /api/admin/email-queue/resume

Response:
{
  "success": true,
  "message": "Queue resumed"
}
```

**Clear Completed Jobs**
```bash
DELETE /api/admin/email-queue/completed

Response:
{
  "success": true,
  "message": "Completed jobs cleared"
}
```

**Clear Failed Jobs**
```bash
DELETE /api/admin/email-queue/failed

Response:
{
  "success": true,
  "message": "Failed jobs cleared"
}
```

**Get Job Details**
```bash
GET /api/admin/email-queue/jobs/12345

Response:
{
  "success": true,
  "job": {
    "id": "12345",
    "data": { ... },
    "state": "completed",
    "progress": 100,
    "attemptsMade": 1,
    "timestamp": 1699635000000,
    "processedOn": 1699635001000,
    "finishedOn": 1699635002000
  }
}
```

## Performance Tuning

### Concurrency

Adjust worker concurrency in `email.queue.ts`:
```typescript
// Process up to 20 emails simultaneously
emailQueue.process(20, async (job: Job<EmailJobData>) => {
  // ...
});
```

### Retry Strategy

Customize retry behavior:
```typescript
await queueEmail(emailData, {
  attempts: 10, // More retries
  backoff: {
    type: 'exponential',
    delay: 5000, // Start with 5 second delay
  },
});
```

### Job Expiration

Remove old jobs automatically:
```typescript
defaultJobOptions: {
  removeOnComplete: {
    age: 3600, // Remove after 1 hour
    count: 1000, // Keep last 1000 jobs
  },
  removeOnFail: {
    age: 86400, // Remove after 24 hours
  },
}
```

## Troubleshooting

### Queue Not Processing

1. **Check Redis Connection**
```bash
redis-cli ping
```

2. **Check Queue Stats**
```bash
curl http://localhost:3000/api/admin/email-queue/stats
```

3. **Check Logs**
```bash
# Look for queue errors
grep "Queue error" logs/app.log
```

### High Failed Rate

1. **Check SMTP Configuration**
```bash
# Verify SMTP credentials in .env
echo $SMTP_HOST $SMTP_PORT $SMTP_USER
```

2. **Review Failed Jobs**
```bash
curl http://localhost:3000/api/admin/email-queue/failed
```

3. **Check Email Preferences**
- Users may have unsubscribed
- Category may be disabled

### Queue Stalling

1. **Increase Lock Duration**
```typescript
settings: {
  lockDuration: 120000, // 2 minutes
}
```

2. **Check Worker Health**
```bash
# Ensure workers are running
ps aux | grep node
```

3. **Restart Queue**
```bash
# Application restart
npm restart
```

## Best Practices

### 1. Use Appropriate Priority

- **High**: Only for critical, time-sensitive emails (password reset, payment confirmation)
- **Normal**: Most notifications and alerts
- **Low**: Marketing, newsletters, non-urgent updates

### 2. Implement Graceful Degradation

```typescript
try {
  await EmailQueueService.queueHighPriority(emailData);
} catch (error) {
  console.error('Failed to queue email:', error);
  // Fallback: Try direct send or log for manual retry
}
```

### 3. Monitor Queue Health

- Set up alerts for high failed rate
- Monitor queue size (too many waiting = bottleneck)
- Track processing time trends

### 4. Regular Cleanup

```typescript
// Run daily cleanup job
cron.schedule('0 2 * * *', async () => {
  await clearCompletedJobs();
  console.log('Daily cleanup: Completed jobs cleared');
});
```

### 5. Rate Limiting

For bulk emails, use batch queuing with delays:
```typescript
const recipients = [...]; // 1000 emails
const batchSize = 100;

for (let i = 0; i < recipients.length; i += batchSize) {
  const batch = recipients.slice(i, i + batchSize);
  await EmailQueueService.queueBatch(batch, emailData, 'low');
  
  // Wait 1 minute between batches
  await new Promise(resolve => setTimeout(resolve, 60000));
}
```

## Migration from Direct Send

Replace direct email sends with queue:

**Before:**
```typescript
import { sendEmail } from './services/email.service';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
  variables: { userName: 'John' },
});
```

**After:**
```typescript
import EmailQueueService from './services/email-queue.service';

await EmailQueueService.queueNormalPriority({
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
  variables: { userName: 'John' },
  userId: 123,
  tenantId: 1,
  category: 'system_notifications',
});
```

## Testing

### Unit Tests

```typescript
describe('EmailQueueService', () => {
  it('should queue high-priority email', async () => {
    const job = await EmailQueueService.queueHighPriority({
      to: 'test@example.com',
      subject: 'Test',
      template: 'test',
      variables: {},
    });
    
    expect(job).toBeDefined();
    expect(job.opts.priority).toBe(1);
  });
});
```

### Integration Tests

```bash
# Test queue processing
npm run test:queue
```

## Production Deployment

### Redis Setup

**Recommended: Managed Redis Service**
- AWS ElastiCache
- Redis Cloud
- DigitalOcean Managed Redis
- Heroku Redis

**Configuration:**
```bash
REDIS_HOST=your-redis-host.redis.cloud
REDIS_PORT=16379
REDIS_PASSWORD=your-secure-password
REDIS_TLS=true
```

### Monitoring

Set up monitoring for:
- Queue size (alert if > 1000)
- Failed rate (alert if > 5%)
- Processing time (alert if > 10s average)
- Redis memory usage

### Scaling

**Vertical Scaling:**
- Increase worker concurrency
- More Redis memory

**Horizontal Scaling:**
- Multiple worker instances (Bull automatically distributes)
- Each instance processes from same queue

### Backup Strategy

Redis persistence options:
- RDB: Point-in-time snapshots
- AOF: Append-only file (recommended)

```bash
# redis.conf
appendonly yes
appendfsync everysec
```

## Summary

The Email Queue System provides:
- ✅ Reliable email delivery with automatic retries
- ✅ Priority-based processing
- ✅ Scheduled and drip campaign support
- ✅ Comprehensive monitoring
- ✅ Production-ready with Redis
- ✅ Easy migration from direct sends
- ✅ Scalable for high volume

For questions or issues, check logs and monitoring endpoints first!
