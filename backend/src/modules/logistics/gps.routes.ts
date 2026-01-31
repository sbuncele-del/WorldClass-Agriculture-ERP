import { Router, Request, Response } from 'express';
import { processCartrackData } from './gps.service';

const router = Router();

// Webhook endpoint for Cartrack
router.post('/cartrack', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // It's crucial to validate the incoming data structure and authenticate the request
    // For now, we'll assume the data is valid
    await processCartrackData(data);
    res.status(200).json({ status: 'success', message: 'Data received' });
  } catch (error) {
    console.error('Error processing Cartrack data:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

// Placeholder for MiX Telematics
router.post('/mixtelematics', async (req: Request, res: Response) => {
  res.status(501).json({ status: 'info', message: 'MiX Telematics integration not yet implemented' });
});

// Placeholder for Ctrack
router.post('/ctrack', async (req: Request, res: Response) => {
  res.status(501).json({ status: 'info', message: 'Ctrack integration not yet implemented' });
});

export default router;
