import pool from '../../config/database';

interface CartrackData {
  // This is a simplified interface. The actual payload will be more complex.
  vehicle_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  engine_status: 'on' | 'off';
}

export async function processCartrackData(data: any): Promise<void> {
  // In a real scenario, you would validate the data object here
  const { vehicle_id, timestamp, latitude, longitude, speed_kmh, engine_status } = data as CartrackData;

  // Here you would look up your internal vehicle ID based on the telematics provider's vehicle_id
  // For now, we'll assume a direct mapping is possible or the ID is already correct.

  try {
    await pool.query(
      `INSERT INTO logistics_gps_tracking (vehicle_id, timestamp, latitude, longitude, speed_kmh, engine_status, provider)
       VALUES ($1, $2, $3, $4, $5, $6, 'Cartrack')`,
      [vehicle_id, timestamp, latitude, longitude, speed_kmh, engine_status]
    );
    console.log(`Logged GPS data for vehicle ${vehicle_id}`);
  } catch (error) {
    console.error('Error inserting GPS data into database:', error);
    throw error;
  }
}
