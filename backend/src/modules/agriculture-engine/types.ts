export type EvidenceKind = 'measured' | 'calculated' | 'forecast' | 'manual' | 'unavailable';

export interface Evidence<T> {
  kind: EvidenceKind;
  source: string;
  observedAt: string;
  receivedAt: string;
  freshnessSeconds: number;
  quality: 'good' | 'degraded' | 'stale';
  value: T;
}

export interface WeatherSnapshot {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperatureC: number | null;
    relativeHumidityPercent: number | null;
    precipitationMm: number | null;
    windSpeedKph: number | null;
  };
  daily: Array<{
    date: string;
    precipitationProbabilityMaxPercent: number | null;
    precipitationSumMm: number | null;
    et0FaoEvapotranspirationMm: number | null;
  }>;
}

export interface IrrigationTelemetryInput {
  farmId: string;
  fieldId?: string;
  deviceId: string;
  observedAt: string;
  receivedAt?: string;
  pressureBar: number;
  flowLitresPerMinute?: number;
  pumpRunning: boolean;
  irrigationScheduled: boolean;
  maintenanceActive?: boolean;
  sensorHealth?: 'good' | 'degraded' | 'fault';
  consecutiveLowReadings?: number;
  lowPressureDurationMinutes?: number;
  targetPressureMinBar: number;
  targetPressureMaxBar: number;
  expectedFlowMinLitresPerMinute?: number;
}

export interface IrrigationEvaluation {
  state: 'normal' | 'expected_off' | 'watch' | 'incident' | 'unavailable';
  severity: 'none' | 'low' | 'medium' | 'high';
  title: string;
  explanation: string;
  confidencePercent: number;
  evidence: Array<{ label: string; value: string | number | boolean; kind: EvidenceKind }>;
  recommendedAction?: string;
}
