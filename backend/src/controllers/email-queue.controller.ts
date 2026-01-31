import { Request, Response } from 'express';
import {
  getQueueStats,
  getFailedJobs,
  retryFailedJob,
  clearCompletedJobs,
  clearFailedJobs,
  pauseQueue,
  resumeQueue,
  emailQueue,
} from '../queues/email.queue';

/**
 * Email Queue Monitoring Controller
 * 
 * Admin endpoints for monitoring and managing the email queue.
 */

/**
 * Get queue statistics
 * 
 * GET /api/admin/email-queue/stats
 */
export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await getQueueStats();

    // Get additional metrics
    const isPaused = await emailQueue.isPaused();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        isPaused,
      },
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue statistics',
    });
  }
}

/**
 * Get failed jobs (dead letter queue)
 * 
 * GET /api/admin/email-queue/failed?limit=50
 */
export async function getFailedJobsList(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const failed = await getFailedJobs(limit);

    res.json({
      success: true,
      count: failed.length,
      jobs: failed,
    });
  } catch (error) {
    console.error('Error fetching failed jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch failed jobs',
    });
  }
}

/**
 * Retry a failed job
 * 
 * POST /api/admin/email-queue/retry/:jobId
 */
export async function retryJob(req: Request, res: Response) {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required',
      });
    }

    const success = await retryFailedJob(jobId);

    if (success) {
      res.json({
        success: true,
        message: `Job ${jobId} queued for retry`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }
    return;
  } catch (error) {
    console.error('Error retrying job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry job',
    });
    return;
  }
}
/**
 * Clear completed jobs
 * 
 * DELETE /api/admin/email-queue/completed
 */
export async function clearCompleted(_req: Request, res: Response) {
  try {
    await clearCompletedJobs();

    res.json({
      success: true,
      message: 'Completed jobs cleared',
    });
  } catch (error) {
    console.error('Error clearing completed jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear completed jobs',
    });
  }
}

/**
 * Clear failed jobs
 * 
 * DELETE /api/admin/email-queue/failed
 */
export async function clearFailed(_req: Request, res: Response) {
  try {
    await clearFailedJobs();

    res.json({
      success: true,
      message: 'Failed jobs cleared',
    });
  } catch (error) {
    console.error('Error clearing failed jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear failed jobs',
    });
  }
}

/**
 * Pause queue processing
 * 
 * POST /api/admin/email-queue/pause
 */
export async function pause(_req: Request, res: Response) {
  try {
    await pauseQueue();

    res.json({
      success: true,
      message: 'Queue paused',
    });
  } catch (error) {
    console.error('Error pausing queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause queue',
    });
  }
}

/**
 * Resume queue processing
 * 
 * POST /api/admin/email-queue/resume
 */
export async function resume(_req: Request, res: Response) {
  try {
    await resumeQueue();

    res.json({
      success: true,
      message: 'Queue resumed',
    });
  } catch (error) {
    console.error('Error resuming queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume queue',
    });
  }
}

/**
 * Get job details by ID
 * 
 * GET /api/admin/email-queue/jobs/:jobId
 */
export async function getJobDetails(req: Request, res: Response) {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required',
      });
    }

    const job = await emailQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Get job state
    const state = await job.getState();

    res.json({
      success: true,
      job: {
        id: job.id,
        data: job.data,
        state,
        progress: job.progress(),
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        returnvalue: job.returnvalue,
      },
    });
    return;
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job details',
    });
    return;
  }
}

/**
 * Get queue health check
 * 
 * GET /api/admin/email-queue/health
 */
export async function healthCheck(_req: Request, res: Response) {
  try {
    const stats = await getQueueStats();
    const isPaused = await emailQueue.isPaused();

    // Determine health status
    const isHealthy = stats.failed < 100 && !isPaused && stats.active < 1000;

    res.json({
      success: true,
      healthy: isHealthy,
      status: isPaused ? 'paused' : isHealthy ? 'healthy' : 'degraded',
      stats,
    });
  } catch (error) {
    console.error('Error checking queue health:', error);
    res.status(500).json({
      success: false,
      healthy: false,
      status: 'error',
      error: 'Failed to check queue health',
    });
  }
}