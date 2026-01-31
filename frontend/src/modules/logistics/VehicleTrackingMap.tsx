/**
 * Vehicle Tracking Map Component
 * Real-time vehicle tracking with Leaflet and WebSocket integration
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, Tag, Spin, Button, Space, Select, Badge, Statistic, Row, Col } from 'antd';
import {
  EnvironmentOutlined,
  CarOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
  FullscreenOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import useLogisticsWebSocket from '../../hooks/useLogisticsWebSocket';
import './logistics-enterprise.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface VehicleMarkerData {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  ignition: boolean;
  driver?: string;
  tripId?: string;
  vehicleNumber?: string;
  status?: string;
  fuelLevel?: number;
  destination?: string;
  eta?: string;
}

interface VehicleTrackingMapProps {
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  showStats?: boolean;
  filterByStatus?: string[];
}

// Custom vehicle marker icons
const createVehicleIcon = (status: string, heading: number = 0) => {
  const colors: Record<string, string> = {
    'active': '#10b981',
    'idle': '#f59e0b',
    'stopped': '#ef4444',
    'offline': '#94a3b8'
  };

  const color = colors[(status || '').toLowerCase()] || '#667eea';

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 36px;
          height: 36px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: rotate(${heading}deg);
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        ${status.toLowerCase() === 'active' ? `
          <div style="
            position: absolute;
            top: 0;
            right: 0;
            width: 12px;
            height: 12px;
            background: #10b981;
            border: 2px solid white;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
    `,
    className: 'vehicle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Component to update map center when vehicles update
const MapUpdater: React.FC<{ center?: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
};

const VehicleTrackingMap: React.FC<VehicleTrackingMapProps> = ({
  height = '600px',
  initialCenter = [-26.2041, 28.0473], // Johannesburg, South Africa
  initialZoom = 11,
  showStats = true,
  filterByStatus = []
}) => {
  const [vehicles, setVehicles] = useState<Map<string, VehicleMarkerData>>(new Map());
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom, setMapZoom] = useState<number>(initialZoom);
  const [showRoutes, setShowRoutes] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Clean up the Leaflet instance when the component unmounts to prevent container re-init errors
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const {
    connected,
    connecting,
    vehiclePositions,
    alerts,
    connect,
    disconnect
  } = useLogisticsWebSocket({ autoConnect: true });

  // Update vehicles from WebSocket positions
  useEffect(() => {
    const updatedVehicles = new Map<string, VehicleMarkerData>();

    vehiclePositions.forEach((position, vehicleId) => {
      const status = position.ignition 
        ? (position.speed > 5 ? 'active' : 'idle')
        : 'stopped';

      updatedVehicles.set(vehicleId, {
        vehicleId: position.vehicleId,
        lat: position.lat,
        lng: position.lng,
        speed: position.speed,
        heading: position.heading,
        ignition: position.ignition,
        driver: position.driver,
        tripId: position.tripId,
        fuelLevel: position.fuelLevel,
        status: status,
        vehicleNumber: vehicleId // Will be enriched from API
      });
    });

    setVehicles(updatedVehicles);
  }, [vehiclePositions]);

  const getFilteredVehicles = (): VehicleMarkerData[] => {
    let filtered = Array.from(vehicles.values());

    if (filterByStatus.length > 0) {
      filtered = filtered.filter(v => v.status && filterByStatus.includes(v.status));
    }

    return filtered;
  };

  const focusOnVehicle = (vehicleId: string) => {
    const vehicle = vehicles.get(vehicleId);
    if (vehicle) {
      setMapCenter([vehicle.lat, vehicle.lng]);
      setMapZoom(15);
      setSelectedVehicle(vehicleId);
    }
  };

  const fitAllVehicles = () => {
    const filteredVehicles = getFilteredVehicles();
    if (filteredVehicles.length === 0) return;

    const bounds = L.latLngBounds(
      filteredVehicles.map(v => [v.lat, v.lng] as [number, number])
    );

    if (mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const getStatusStats = () => {
    const vehiclesArray = Array.from(vehicles.values());
    return {
      total: vehiclesArray.length,
      active: vehiclesArray.filter(v => v.status === 'active').length,
      idle: vehiclesArray.filter(v => v.status === 'idle').length,
      stopped: vehiclesArray.filter(v => v.status === 'stopped').length,
      offline: vehiclesArray.filter(v => v.status === 'offline').length
    };
  };

  const stats = getStatusStats();
  const filteredVehicles = getFilteredVehicles();

  return (
    <div>
      {showStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Vehicles"
                value={stats.total}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#667eea' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active"
                value={stats.active}
                prefix={<Badge status="success" />}
                valueStyle={{ color: '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Idle"
                value={stats.idle}
                prefix={<Badge status="warning" />}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Stopped"
                value={stats.stopped}
                prefix={<Badge status="error" />}
                valueStyle={{ color: '#ef4444' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Badge status={connected ? 'success' : connecting ? 'processing' : 'error'} />
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {connected ? 'Live Updates Active' : connecting ? 'Connecting...' : 'Disconnected'}
            </span>
            {!connected && !connecting && (
              <Button size="small" type="link" onClick={connect}>
                Reconnect
              </Button>
            )}
          </Space>

          <Space>
            <Select
              placeholder="Jump to vehicle"
              style={{ width: 200 }}
              showSearch
              allowClear
              onChange={(value) => value && focusOnVehicle(value)}
              options={filteredVehicles.map(v => ({
                label: `${v.vehicleNumber || v.vehicleId} - ${v.status}`,
                value: v.vehicleId
              }))}
            />
            <Button icon={<FullscreenOutlined />} onClick={fitAllVehicles}>
              Fit All
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </Space>
        </div>

        <div className="vehicle-map-container" style={{ height, position: 'relative' }}>
          {filteredVehicles.length === 0 ? (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 1000
            }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#64748b' }}>
                Waiting for vehicle data...
              </div>
            </div>
          ) : null}

          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater center={mapCenter} zoom={mapZoom} />

            {filteredVehicles.map(vehicle => (
              <Marker
                key={vehicle.vehicleId}
                position={[vehicle.lat, vehicle.lng]}
                icon={createVehicleIcon(vehicle.status || 'active', vehicle.heading)}
                eventHandlers={{
                  click: () => setSelectedVehicle(vehicle.vehicleId)
                }}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#1e293b' }}>
                      {vehicle.vehicleNumber || vehicle.vehicleId}
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <Tag color={vehicle.status === 'active' ? 'success' : vehicle.status === 'idle' ? 'warning' : 'error'}>
                        {vehicle.status?.toUpperCase()}
                      </Tag>
                    </div>

                    {vehicle.driver && (
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <strong>Driver:</strong> {vehicle.driver}
                      </div>
                    )}

                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <DashboardOutlined /> <strong>Speed:</strong> {vehicle.speed.toFixed(0)} km/h
                    </div>

                    {vehicle.fuelLevel !== undefined && (
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        ⛽ <strong>Fuel:</strong> {vehicle.fuelLevel}%
                      </div>
                    )}

                    {vehicle.tripId && (
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        🚚 <strong>Trip:</strong> {vehicle.tripId}
                      </div>
                    )}

                    {vehicle.destination && (
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <EnvironmentOutlined /> <strong>To:</strong> {vehicle.destination}
                      </div>
                    )}

                    {vehicle.eta && (
                      <div style={{ fontSize: '12px' }}>
                        <ClockCircleOutlined /> <strong>ETA:</strong> {vehicle.eta}
                      </div>
                    )}

                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                      Position: {vehicle.lat.toFixed(5)}, {vehicle.lng.toFixed(5)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Alert Banner */}
        {alerts.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            maxWidth: '300px',
            zIndex: 1000
          }}>
            {alerts.slice(0, 3).map((alert, index) => (
              <Card
                key={alert.alertId}
                size="small"
                style={{
                  marginBottom: '8px',
                  borderLeft: `4px solid ${alert.severity === 'HIGH' ? '#ef4444' : alert.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6'}`
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  {alert.type.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {alert.message}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        .vehicle-marker {
          background: transparent !important;
          border: none !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default VehicleTrackingMap;
