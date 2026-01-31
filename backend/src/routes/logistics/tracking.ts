/**
 * Vehicle Tracking Routes
 * 
 * API endpoints for vehicle tracking and provider management
 */

import express, { Request, Response } from 'express';
import { trackingProvidersService, TrackingProviderConfig } from '../../services/tracking/tracking-providers.service';

const router = express.Router();

/**
 * GET /api/logistics/tracking/positions
 * Get all current vehicle positions
 */
router.get('/positions', async (_req: Request, res: Response) => {
  try {
    const positions = trackingProvidersService.getAllPositions();
    res.json({
      success: true,
      count: positions.length,
      positions
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get positions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/logistics/tracking/positions/:vehicleId
 * Get position for a specific vehicle
 */
router.get('/positions/:vehicleId', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const position = trackingProvidersService.getPosition(vehicleId);

    if (!position) {
      return res.status(404).json({ 
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      position
    });
  } catch (error) {
    console.error('Error getting position:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get position',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/logistics/tracking/refresh
 * Force refresh positions from all providers
 */
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    const positions = await trackingProvidersService.fetchAllPositions();
    res.json({
      success: true,
      message: 'Positions refreshed',
      count: positions.length
    });
  } catch (error) {
    console.error('Error refreshing positions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to refresh positions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/logistics/tracking/providers
 * Get all configured tracking providers
 */
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const providers = await trackingProvidersService.getProviderStatus();
    res.json({
      success: true,
      providers
    });
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/logistics/tracking/providers
 * Add or update tracking provider configuration
 */
router.post('/providers', async (req: Request, res: Response) => {
  try {
    const config: Partial<TrackingProviderConfig> = req.body;

    if (!config.name || !config.type || !config.apiUrl) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: name, type, apiUrl'
      });
    }

    // Generate ID if not provided
    if (!config.id) {
      config.id = `provider_${Date.now()}`;
    }

    const provider = await trackingProvidersService.upsertProvider(config);

    if (!provider) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save provider'
      });
    }

    res.json({
      success: true,
      message: 'Provider saved successfully',
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        enabled: provider.enabled
      }
    });
  } catch (error) {
    console.error('Error saving provider:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/logistics/tracking/providers/:providerId
 * Delete a tracking provider
 */
router.delete('/providers/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const success = await trackingProvidersService.deleteProvider(providerId);

    if (!success) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete provider'
      });
    }

    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/logistics/tracking/webhooks/:providerId
 * Webhook endpoint for tracking providers to push data
 */
router.post('/webhooks/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const data = req.body;

    // Process webhook data
    const position = await trackingProvidersService.processWebhook(providerId, data);

    if (!position) {
      return res.status(400).json({ 
        success: false,
        error: 'Failed to process webhook data'
      });
    }

    res.json({
      success: true,
      vehicleId: position.vehicleId
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/logistics/tracking/webhooks/mix-telematics
 * Dedicated webhook for MiX Telematics
 */
router.post('/webhooks/mix-telematics', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Find MiX provider
    const providers = await trackingProvidersService.getProviderStatus();
    const mixProvider = providers.find(p => p.name.toLowerCase().includes('mix'));

    if (!mixProvider) {
      return res.status(400).json({ 
        success: false,
        error: 'MiX Telematics provider not configured'
      });
    }

    const position = await trackingProvidersService.processWebhook(mixProvider.id, data);

    res.json({
      success: true,
      vehicleId: position?.vehicleId
    });
  } catch (error) {
    console.error('Error processing MiX webhook:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

/**
 * POST /api/logistics/tracking/webhooks/netstar
 * Dedicated webhook for Netstar
 */
router.post('/webhooks/netstar', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    const providers = await trackingProvidersService.getProviderStatus();
    const netstarProvider = providers.find(p => p.name.toLowerCase().includes('netstar'));

    if (!netstarProvider) {
      return res.status(400).json({ 
        success: false,
        error: 'Netstar provider not configured'
      });
    }

    const position = await trackingProvidersService.processWebhook(netstarProvider.id, data);

    res.json({
      success: true,
      vehicleId: position?.vehicleId
    });
  } catch (error) {
    console.error('Error processing Netstar webhook:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

/**
 * GET /api/logistics/tracking/alerts
 * Get tracking alerts (speeding, geofence violations, etc.)
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { type, status, from, to } = req.query;

    // TODO: Implement alerts query from database
    res.json({
      success: true,
      alerts: [
        {
          id: 'ALT-001',
          type: 'speeding',
          vehicleId: 'TRK-015',
          registration: 'GP 123 ABC',
          message: 'Vehicle exceeded 120 km/h speed limit',
          speed: 135,
          limit: 120,
          location: { lat: -26.2041, lng: 28.0473 },
          timestamp: new Date(),
          status: 'active'
        },
        {
          id: 'ALT-002',
          type: 'geofence',
          vehicleId: 'TRK-022',
          registration: 'GP 456 DEF',
          message: 'Vehicle entered restricted zone',
          geofenceName: 'Depot B - No Entry Area',
          location: { lat: -26.1847, lng: 28.0247 },
          timestamp: new Date(Date.now() - 300000),
          status: 'resolved'
        }
      ]
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

export default router;
