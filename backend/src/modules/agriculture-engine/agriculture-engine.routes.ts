import express, { Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { FarmOsClient } from './farmos.client';
import { OpenMeteoClient } from './open-meteo.client';
import { evaluateIrrigation } from './irrigation-rules.service';
import { PRIME_SOURCES_HATTIES_PILOT } from './pilot-profile';
import pool from '../../config/database';
import { assertIncidentTransition, IncidentStatus } from './incident-workflow.service';

const router = express.Router();
const farmOs = new FarmOsClient();
const weather = new OpenMeteoClient();

// Public health/capability probe (no auth, no tenant data) — used for deployment verification.
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      engine: 'masaphokati-agriculture-os',
      status: 'ok',
      pilot: PRIME_SOURCES_HATTIES_PILOT.farm.code,
      capabilities: {
        farmOS: { configured: Boolean(process.env.FARMOS_BASE_URL) },
        openMeteo: { configured: true, mode: process.env.OPEN_METEO_API_KEY ? 'commercial' : 'development-only' },
        agroMonitoring: { configured: Boolean(process.env.AGROMONITORING_API_KEY) },
        leaf: { configured: Boolean(process.env.LEAF_API_KEY), mode: 'deferred' },
      },
      time: new Date().toISOString(),
    },
  });
});

router.use(authenticateToken);
router.use(tenantMiddleware);

router.get('/status', async (_req: Request, res: Response) => {
  const farmOsStatus = await farmOs.status();
  res.json({
    success: true,
    data: {
      farmOS: farmOsStatus,
      openMeteo: { configured: true, mode: process.env.OPEN_METEO_API_KEY ? 'commercial' : 'development-only' },
      agroMonitoring: { configured: Boolean(process.env.AGROMONITORING_API_KEY), mode: 'satellite-provider' },
      leaf: { configured: Boolean(process.env.LEAF_API_KEY), mode: 'deferred' },
    },
  });
});

router.get('/pilot', (_req: Request, res: Response) => {
  res.json({ success: true, data: PRIME_SOURCES_HATTIES_PILOT });
});

router.post('/pilot/irrigation-scenario', (_req: Request, res: Response) => {
  const pilot = PRIME_SOURCES_HATTIES_PILOT;
  const observedAt = new Date().toISOString();
  const data = evaluateIrrigation({
    farmId: pilot.farm.code,
    fieldId: pilot.field.code,
    deviceId: pilot.irrigation.pressureSensorCode,
    observedAt,
    receivedAt: observedAt,
    pressureBar: pilot.pilotScenario.simulatedPressureBar,
    flowLitresPerMinute: pilot.pilotScenario.simulatedFlowLitresPerMinute,
    pumpRunning: pilot.pilotScenario.pumpRunning,
    irrigationScheduled: pilot.pilotScenario.irrigationScheduled,
    consecutiveLowReadings: pilot.pilotScenario.consecutiveLowReadings,
    lowPressureDurationMinutes: pilot.pilotScenario.lowPressureDurationMinutes,
    targetPressureMinBar: pilot.irrigation.targetPressureMinBar,
    targetPressureMaxBar: pilot.irrigation.targetPressureMaxBar,
    expectedFlowMinLitresPerMinute: pilot.irrigation.expectedFlowMinLitresPerMinute,
  });
  res.json({ success: true, data: { pilot: pilot.pilotScenario.title, evaluation: data } });
});

router.get('/weather', async (req: Request, res: Response) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const data = await weather.getWeather(latitude, longitude);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Unable to retrieve weather' });
  }
});

router.post('/irrigation/evaluate', (req: Request, res: Response) => {
  try {
    const data = evaluateIrrigation(req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Unable to evaluate irrigation evidence' });
  }
});

router.post('/telemetry/irrigation', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const client = await pool.connect();
  try {
    const evaluation = evaluateIrrigation(req.body);
    const input = req.body;
    await client.query('BEGIN');

    const readings = [
      { signalType: 'pressure', value: input.pressureBar, unit: 'bar', deviceId: input.deviceId },
      ...(input.flowLitresPerMinute === undefined ? [] : [{
        signalType: 'flow', value: input.flowLitresPerMinute, unit: 'L/min',
        deviceId: input.flowDeviceId || input.deviceId,
      }]),
    ];

    for (const reading of readings) {
      await client.query(
        `INSERT INTO agriculture_telemetry_readings
          (tenant_id, farm_id, field_id, device_id, signal_type, value, unit, observed_at, received_at, quality, raw_payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), $10, $11)
         ON CONFLICT (tenant_id, device_id, signal_type, observed_at) DO NOTHING`,
        [tenantId, input.farmId, input.fieldId || null, reading.deviceId, reading.signalType,
          reading.value, reading.unit, input.observedAt, input.receivedAt || null,
          input.sensorHealth === 'degraded' ? 'degraded' : 'good', JSON.stringify(input)]
      );
    }

    let incident = null;
    if (evaluation.state === 'incident') {
      const result = await client.query(
        `INSERT INTO agriculture_incidents
          (tenant_id, farm_id, field_id, incident_type, severity, title, explanation,
           confidence_percent, evidence, recommended_action)
         VALUES ($1, $2, $3, 'irrigation_delivery', $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [tenantId, input.farmId, input.fieldId || null, evaluation.severity, evaluation.title,
          evaluation.explanation, evaluation.confidencePercent, JSON.stringify(evaluation.evidence),
          evaluation.recommendedAction || null]
      );
      incident = result.rows[0];
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { evaluation, incident } });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, error: error.message || 'Unable to ingest irrigation telemetry' });
  } finally {
    client.release();
  }
});

router.get('/incidents', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const status = typeof req.query.status === 'string' ? req.query.status : null;
  const result = await pool.query(
    `SELECT id, farm_id, field_id, incident_type, status, severity, title, explanation,
       confidence_percent, evidence, recommended_action, assigned_to, acknowledged_at,
       resolved_at, created_at, updated_at
     FROM agriculture_incidents
     WHERE tenant_id = $1 AND ($2::varchar IS NULL OR status = $2)
     ORDER BY CASE severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC`,
    [tenantId, status]
  );
  res.json({ success: true, data: result.rows });
});

router.patch('/incidents/:id', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const incidentId = req.params.id;
  const nextStatus = req.body.status as IncidentStatus;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      'SELECT status FROM agriculture_incidents WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [incidentId, tenantId]
    );
    if (current.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    assertIncidentTransition(current.rows[0].status, nextStatus);
    const updated = await client.query(
      `UPDATE agriculture_incidents SET
         status = $3,
         assigned_to = COALESCE($4, assigned_to),
         acknowledged_at = CASE WHEN $3 = 'acknowledged' THEN NOW() ELSE acknowledged_at END,
         resolved_at = CASE WHEN $3 = 'resolved' THEN NOW() ELSE resolved_at END,
         updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [incidentId, tenantId, nextStatus, req.body.assignedTo || null]
    );
    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, error: error.message || 'Unable to update incident' });
  } finally {
    client.release();
  }
});

router.get('/farmos/assets/:assetType', async (req: Request, res: Response) => {
  try {
    const data = await farmOs.listAssets(req.params.assetType);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message || 'farmOS request failed' });
  }
});

export default router;
