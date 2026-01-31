/**
 * Email Queue Controller V2
 * Tenant-hardened API for email queue monitoring and management
 * 
 * Features:
 * - Queue statistics
 * - Failed job management
 * - Queue pause/resume
 * - Job retry and cleanup
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import {
  getQueueStats,
  getFailedJobs,
  retryFailedJob,
  clearCompletedJobs,
  clearFailedJobs,
  pauseQueue,
  resumeQueue,
  emailQueue
} from '../queues/email.queue';

/**
 * Tenant context helper (admin-only operations)
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

/**
 * Get queue statistics
 */
export const getStats = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access

    const stats = await getQueueStats();
    const isPaused = await emailQueue.isPaused();

    res.json({
      success: true,
      data: {
        ...stats,
        isPaused
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get queue stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch queue statistics' });
  }
};

/**
 * Get failed jobs (dead letter queue)
 */
export const getFailedJobsList = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access
    const limit = parseInt(req.query.limit as string) || 50;

    const failed = await getFailedJobs(limit);

    res.json({
      success: true,
      data: {
        count: failed.length,
        jobs: failed
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get failed jobs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch failed jobs' });
  }
};

/**
 * Retry a failed job
 */
export const retryJob = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'Job ID is required' });
    }

    const success = await retryFailedJob(jobId);

    if (success) {
      res.json({
        success: true,
        message: `Job ${jobId} queued for retry`
      });
    } else {
      res.status(404).json({ success: false, error: 'Job not found' });
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Retry job error:', error);
    res.status(500).json({ success: false, error: 'Failed to retry job' });
  }
};

/**
 * Clear completed jobs
 */
export const clearCompleted = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access

    await clearCompletedJobs();

    res.json({
      success: true,
      message: 'Completed jobs cleared'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Clear completed jobs error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear completed jobs' });
  }
};

/**
 * Clear failed jobs
 */
export const clearFailed = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access

    await clearFailedJobs();

    res.json({
      success: true,
      message: 'Failed jobs cleared'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Clear failed jobs error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear failed jobs' });
  }
};

/**
 * Pause queue processing
 */
export const pause = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access

    await pauseQueue();

    res.json({
      success: true,
      message: 'Queue paused'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Pause queue error:', error);
    res.status(500).json({ success: false, error: 'Failed to pause queue' });
  }
};

/**
 * Resume queue processing
 */
export const resume = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access

    await resumeQueue();

    res.json({
      success: true,
      message: 'Queue resumed'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Resume queue error:', error);
    res.status(500).json({ success: false, error: 'Failed to resume queue' });
  }
};

/**
 * Get job details by ID
 */
export const getJobDetails = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'Job ID is required' });
    }

    const job = await emailQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const state = await job.getState();

    res.json({
      success: true,
      data: {
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
        returnvalue: job.returnvalue
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get job details error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch job details' });
  }
};

/**
 * Get queue health check
 */
export const healthCheck = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant access

    const stats = await getQueueStats();
    const isPaused = await emailQueue.isPaused();

    // Determine health status
    const isHealthy = stats.failed < 100 && !isPaused && stats.active < 1000;

    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        status: isPaused ? 'paused' : isHealthy ? 'healthy' : 'degraded',
        stats
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      data: {
        healthy: false,
        status: 'error'
      },
      error: 'Failed to check queue health'
    });
  }
};

export default {
  getStats,
  getFailedJobsList,
  retryJob,
  clearCompleted,
  clearFailed,
  pause,
  resume,
  getJobDetails,
  healthCheck
};
