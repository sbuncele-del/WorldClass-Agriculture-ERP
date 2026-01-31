# Email Queue System - Quick Start Guide

## Prerequisites

1. **Redis**: Required for job queue
2. **PostgreSQL**: Email metrics tracking
3. **Node.js**: v18+ recommended

## Setup Steps

### 1. Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
redis-cli ping  # Should return PONG
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
redis-cli ping  # Should return PONG
```

**Windows:**
```bash
# Use WSL2 or download from: https://github.com/microsoftarchive/redis/releases
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
docker exec -it redis redis-cli ping  # Should return PONG
```

### 2. Configure Environment

Add to `.env`:
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# Email Configuration (if not already set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourcompany.com
FRONTEND_URL=http://localhost:5173
```

### 3. Run Database Migration

```bash
cd backend
psql -U your_username -d worldclass_erp -f src/migrations/010_email_queue_metrics.sql
```

Or using npm script (if configured):
```bash
npm run migrate:010
```

### 4. Verify Installation

```bash
# Start backend
npm run dev

# You should see:
# ✅ Redis client connected
# ✅ Redis client ready
# ✅ Email queue initialized
```

### 5. Test Email Queue

Create a test script `test-email-queue.ts`:

```typescript
import EmailQueueService from './src/services/email-queue.service';

async function testQueue() {
  try {
    console.log('📧 Queuing test email...');
    
    await EmailQueueService.queueNormalPriority({
      to: 'test@example.com',
      subject: 'Test Email',
      template: 'welcome',
      variables: {
        userName: 'Test User',
        email: 'test@example.com',
        dashboardUrl: 'http://localhost:5173/dashboard',
        frontendUrl: 'http://localhost:5173',
      },
      userId: 1,
      tenantId: 1,
      category: 'system_notifications',
    });
    
    console.log('✅ Email queued successfully');
    
    // Wait a few seconds for processing
    setTimeout(async () => {
      const stats = await getQueueStats();
      console.log('📊 Queue stats:', stats);
      process.exit(0);
    }, 5000);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testQueue();
```

Run test:
```bash
npx ts-node test-email-queue.ts
```

### 6. Monitor Queue

Check queue status:
```bash
# Get stats
curl http://localhost:3000/api/admin/email-queue/stats

# Check health
curl http://localhost:3000/api/admin/email-queue/health

# View failed jobs
curl http://localhost:3000/api/admin/email-queue/failed
```

## Common Issues

### Issue: "Redis connection refused"

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not running:
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker start redis
```

### Issue: "SMTP authentication failed"

**Solution:**
1. For Gmail: Use App Password (not regular password)
2. Enable "Less secure app access" or use OAuth2
3. Verify SMTP credentials in `.env`

### Issue: Jobs stuck in "active" state

**Solution:**
```bash
# Restart queue
curl -X POST http://localhost:3000/api/admin/email-queue/pause
curl -X POST http://localhost:3000/api/admin/email-queue/resume
```

### Issue: High memory usage

**Solution:**
```bash
# Clear completed jobs
curl -X DELETE http://localhost:3000/api/admin/email-queue/completed

# Configure auto-cleanup in email.queue.ts
defaultJobOptions: {
  removeOnComplete: true,
  removeOnFail: { age: 86400 }
}
```

## Production Deployment

### Use Managed Redis

**Recommended Services:**
- AWS ElastiCache: https://aws.amazon.com/elasticache/
- Redis Cloud: https://redis.com/try-free/
- DigitalOcean: https://www.digitalocean.com/products/managed-databases-redis
- Heroku Redis: https://www.heroku.com/redis

**Update .env for production:**
```bash
REDIS_HOST=your-redis-host.cloud.com
REDIS_PORT=16379
REDIS_PASSWORD=your-secure-password
REDIS_TLS=true
```

### Enable Monitoring

Add monitoring endpoints to your infrastructure:
```bash
# Health check (for load balancer)
/api/admin/email-queue/health

# Metrics (for Prometheus/Grafana)
/api/admin/email-queue/stats
```

### Set Up Alerts

Configure alerts for:
- Queue size > 1000 (potential bottleneck)
- Failed rate > 5% (delivery issues)
- Processing time > 10s (performance degradation)

## Next Steps

1. **Replace Direct Sends**: Migrate existing email calls to use queue
2. **Implement Drip Campaigns**: Set up onboarding email sequences
3. **Add Monitoring Dashboard**: Create UI for queue statistics
4. **Configure Batch Jobs**: Schedule daily/weekly email sends

## Resources

- Full Documentation: `EMAIL-QUEUE-SYSTEM.md`
- Bull Documentation: https://github.com/OptimalBits/bull
- Redis Documentation: https://redis.io/docs/

## Support

For issues or questions:
1. Check logs: `logs/app.log`
2. Review queue stats: `/api/admin/email-queue/stats`
3. Consult documentation: `EMAIL-QUEUE-SYSTEM.md`

---

**Status:** ✅ Email Queue System Ready for Production
