import express, { Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { FarmOsClient } from './farmos.client';
import { OpenMeteoClient } from './open-meteo.client';
import { evaluateIrrigation } from './irrigation-rules.service';

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
