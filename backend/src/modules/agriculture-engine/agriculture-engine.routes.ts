import express, { Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { FarmOsClient } from './farmos.client';
import { OpenMeteoClient } from './open-meteo.client';
import { evaluateIrrigation } from './irrigation-rules.service';
import { PRIME_SOURCES_HATTIES_PILOT } from './pilot-profile';

const router = express.Router();
const farmOs = new FarmOsClient();
const weather = new OpenMeteoClient();

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

router.get('/farmos/assets/:assetType', async (req: Request, res: Response) => {
  try {
    const data = await farmOs.listAssets(req.params.assetType);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message || 'farmOS request failed' });
  }
});

export default router;
