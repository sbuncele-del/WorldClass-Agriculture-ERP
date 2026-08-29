import { Evidence, WeatherSnapshot } from './types';

const DEFAULT_TIMEOUT_MS = 10_000;

export class OpenMeteoClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor() {
    this.apiKey = process.env.OPEN_METEO_API_KEY;
    this.baseUrl = process.env.OPEN_METEO_BASE_URL ||
      (this.apiKey ? 'https://customer-api.open-meteo.com' : 'https://api.open-meteo.com');
  }

  async getWeather(latitude: number, longitude: number): Promise<Evidence<WeatherSnapshot>> {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    const url = new URL('/v1/forecast', this.baseUrl);
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m');
    url.searchParams.set('daily', 'precipitation_probability_max,precipitation_sum,et0_fao_evapotranspiration');
    if (this.apiKey) url.searchParams.set('apikey', this.apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Open-Meteo request failed with ${response.status}`);
      const raw: any = await response.json();
      const observedAt = raw.current?.time ? new Date(raw.current.time).toISOString() : new Date().toISOString();
      const receivedAt = new Date().toISOString();
      const freshnessSeconds = Math.max(0, Math.floor((Date.parse(receivedAt) - Date.parse(observedAt)) / 1000));
      const dates: string[] = raw.daily?.time || [];

      return {
        kind: 'forecast',
        source: 'Open-Meteo',
        observedAt,
        receivedAt,
        freshnessSeconds,
        quality: freshnessSeconds > 10_800 ? 'stale' : 'good',
        value: {
          latitude: raw.latitude,
          longitude: raw.longitude,
          timezone: raw.timezone,
          current: {
            temperatureC: raw.current?.temperature_2m ?? null,
            relativeHumidityPercent: raw.current?.relative_humidity_2m ?? null,
            precipitationMm: raw.current?.precipitation ?? null,
            windSpeedKph: raw.current?.wind_speed_10m ?? null,
          },
          daily: dates.map((date, index) => ({
            date,
            precipitationProbabilityMaxPercent: raw.daily?.precipitation_probability_max?.[index] ?? null,
            precipitationSumMm: raw.daily?.precipitation_sum?.[index] ?? null,
            et0FaoEvapotranspirationMm: raw.daily?.et0_fao_evapotranspiration?.[index] ?? null,
          })),
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
