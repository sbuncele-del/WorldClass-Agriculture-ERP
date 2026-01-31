import { Response } from 'express';
import { TenantRequest } from '../../../types';
import { query } from '../../../config/database';

/**
 * Helper to extract tenant ID with type safety
 */
function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * Logistics Workspace Controller
 * Provides aggregated data for the Logistics & Transport dashboard
 */

/**
 * GET /api/logistics/workspace
 * Returns all data needed for the Logistics & Transport workspace dashboard
 */
export const getLogisticsWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found',
      });
    }

    // Parallel queries for performance
    const [
      activeShipments,
      fleetStatus,
      deliverySchedule,
      routeOptimization,
      driverPerformance,
      logisticsSummary,
    ] = await Promise.all([
      getActiveShipments(tenantId),
      getFleetStatus(tenantId),
      getDeliverySchedule(tenantId),
      getRouteOptimization(tenantId),
      getDriverPerformance(tenantId),
      getLogisticsSummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: logisticsSummary,
        active_shipments: activeShipments,
        fleet_status: fleetStatus,
        delivery_schedule: deliverySchedule,
        route_optimization: routeOptimization,
        driver_performance: driverPerformance,
      },
    });
  } catch (error: any) {
    console.error('Logistics workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch logistics workspace data',
    });
  }
};

/**
 * Get active shipments in transit
 */
async function getActiveShipments(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      shipment_number,
      origin,
      destination,
      status,
      estimated_delivery,
      driver_id,
      vehicle_id,
      cargo_weight,
      cargo_value
    FROM shipments
    WHERE tenant_id = $1 AND status IN ('in_transit', 'loading', 'unloading')
    ORDER BY estimated_delivery ASC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get fleet status overview
 */
async function getFleetStatus(tenantId: string) {
  const result = await query(
    `
    SELECT 
      v.id,
      v.vehicle_number,
      v.vehicle_type,
      v.status,
      v.current_location,
      v.last_maintenance_date,
      v.next_maintenance_due,
      v.mileage,
      d.first_name || ' ' || d.last_name as driver_name
    FROM vehicles v
    LEFT JOIN drivers d ON v.current_driver_id = d.id
    WHERE v.tenant_id = $1
    ORDER BY v.status, v.vehicle_number
    LIMIT 20
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get delivery schedule (next 7 days)
 */
async function getDeliverySchedule(tenantId: string) {
  const result = await query(
    `
    SELECT 
      DATE(estimated_delivery) as delivery_date,
      COUNT(*) as shipment_count,
      SUM(cargo_weight) as total_weight,
      STRING_AGG(DISTINCT destination, ', ') as destinations
    FROM shipments
    WHERE tenant_id = $1 
      AND status NOT IN ('delivered', 'cancelled')
      AND estimated_delivery BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    GROUP BY DATE(estimated_delivery)
    ORDER BY delivery_date ASC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get route optimization recommendations
 */
async function getRouteOptimization(tenantId: string) {
  const result = await query(
    `
    SELECT 
      r.id,
      r.route_name,
      r.origin,
      r.destination,
      r.distance_km,
      r.estimated_duration_hours,
      r.fuel_cost_estimate,
      COUNT(s.id) as active_shipments
    FROM routes r
    LEFT JOIN shipments s ON r.id = s.route_id AND s.status IN ('in_transit', 'loading')
    WHERE r.tenant_id = $1 AND r.is_active = true
    GROUP BY r.id, r.route_name, r.origin, r.destination, r.distance_km, r.estimated_duration_hours, r.fuel_cost_estimate
    ORDER BY active_shipments DESC, r.distance_km ASC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get driver performance metrics
 */
async function getDriverPerformance(tenantId: string) {
  const result = await query(
    `
    SELECT 
      d.id,
      d.driver_number,
      d.first_name || ' ' || d.last_name as driver_name,
      COUNT(s.id) as total_deliveries,
      COUNT(CASE WHEN s.status = 'delivered' AND s.actual_delivery <= s.estimated_delivery THEN 1 END) as on_time_deliveries,
      AVG(EXTRACT(EPOCH FROM (s.actual_delivery - s.estimated_delivery))/3600) as avg_delay_hours
    FROM drivers d
    LEFT JOIN shipments s ON d.id = s.driver_id
    WHERE d.tenant_id = $1 
      AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY d.id, d.driver_number, d.first_name, d.last_name
    ORDER BY on_time_deliveries DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get logistics summary metrics
 */
async function getLogisticsSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(DISTINCT v.id) as total_vehicles,
      COUNT(CASE WHEN v.status = 'active' THEN 1 END) as active_vehicles,
      COUNT(DISTINCT d.id) as total_drivers,
      COUNT(CASE WHEN s.status IN ('in_transit', 'loading', 'unloading') THEN 1 END) as shipments_in_transit,
      COUNT(CASE WHEN s.status = 'delivered' AND s.actual_delivery >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as deliveries_last_7_days,
      COUNT(CASE WHEN v.next_maintenance_due <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as maintenance_due_soon
    FROM vehicles v
    LEFT JOIN drivers d ON d.tenant_id = $1
    LEFT JOIN shipments s ON s.tenant_id = $1
    WHERE v.tenant_id = $1
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_vehicles: 0,
    active_vehicles: 0,
    total_drivers: 0,
    shipments_in_transit: 0,
    deliveries_last_7_days: 0,
    maintenance_due_soon: 0,
  };
}
