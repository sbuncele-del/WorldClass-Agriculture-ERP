-- Migration: Email Queue Metrics
-- Description: Track email queue performance and delivery metrics

-- Email queue metrics table
CREATE TABLE IF NOT EXISTS email_queue_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  emails_queued INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  emails_retried INTEGER DEFAULT 0,
  avg_processing_time_ms INTEGER,
  peak_queue_size INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date)
);

-- Email queue performance log (for detailed tracking)
CREATE TABLE IF NOT EXISTS email_queue_performance (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  template VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  priority VARCHAR(20),
  queued_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  attempts INTEGER DEFAULT 1,
  processing_time_ms INTEGER,
  status VARCHAR(20) NOT NULL, -- 'queued', 'processing', 'completed', 'failed', 'retried'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_metrics_date ON email_queue_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_performance_job_id ON email_queue_performance(job_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_performance_status ON email_queue_performance(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_performance_template ON email_queue_performance(template);
CREATE INDEX IF NOT EXISTS idx_email_queue_performance_created_at ON email_queue_performance(created_at DESC);

-- Function to update metrics
CREATE OR REPLACE FUNCTION update_email_queue_metrics()
RETURNS void AS $$
BEGIN
  INSERT INTO email_queue_metrics (
    date,
    emails_queued,
    emails_sent,
    emails_failed,
    emails_retried,
    avg_processing_time_ms,
    peak_queue_size,
    updated_at
  )
  SELECT
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE status = 'queued'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*) FILTER (WHERE status = 'retried'),
    AVG(processing_time_ms)::INTEGER,
    (SELECT COUNT(*) FROM email_queue_performance WHERE DATE(created_at) = CURRENT_DATE AND status IN ('queued', 'processing')),
    CURRENT_TIMESTAMP
  FROM email_queue_performance
  WHERE DATE(created_at) = CURRENT_DATE
  ON CONFLICT (date) DO UPDATE
  SET
    emails_queued = EXCLUDED.emails_queued,
    emails_sent = EXCLUDED.emails_sent,
    emails_failed = EXCLUDED.emails_failed,
    emails_retried = EXCLUDED.emails_retried,
    avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
    peak_queue_size = GREATEST(email_queue_metrics.peak_queue_size, EXCLUDED.peak_queue_size),
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE email_queue_metrics IS 'Daily aggregated metrics for email queue performance';
COMMENT ON TABLE email_queue_performance IS 'Detailed performance tracking for each queued email job';
COMMENT ON FUNCTION update_email_queue_metrics() IS 'Updates daily email queue metrics from performance log';
