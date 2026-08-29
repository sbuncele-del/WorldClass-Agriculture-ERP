import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CloudSun,
  Droplets,
  Gauge,
  Leaf,
  MapPin,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sprout,
  ThermometerSun,
  Waves,
} from 'lucide-react';
import apiClient from '../../services/api';
import './AgricultureCommandCentre.css';

type SourceState = 'connected' | 'simulated' | 'pending' | 'deferred';

interface PilotProfile {
  dataStatus: string;
  organisation: { name: string; role: string };
  farm: {
    code: string; name: string; country: string; region: string; locality: string;
    latitude: number; longitude: number; sizeHectares: number;
  };
  field: { code: string; name: string; sizeHectares: number; irrigationType: string; crop: string };
  irrigation: {
    targetPressureMinBar: number; targetPressureMaxBar: number;
    expectedFlowMinLitresPerMinute: number;
  };
  pilotScenario: {
    title: string; simulatedPressureBar: number; simulatedFlowLitresPerMinute: number;
    lowPressureDurationMinutes: number;
  };
  evidenceNotice: string;
}

interface Evaluation {
  state: 'normal' | 'expected_off' | 'watch' | 'incident' | 'unavailable';
  severity: 'none' | 'low' | 'medium' | 'high';
  title: string;
  explanation: string;
  confidencePercent: number;
  evidence: Array<{ label: string; value: string | number | boolean; kind: string }>;
  recommendedAction?: string;
}

interface WeatherSnapshot {
  current: { temperatureC: number | null; relativeHumidityPercent: number | null; windSpeedKph: number | null };
  daily: Array<{ date: string; precipitationProbabilityMaxPercent: number | null; precipitationSumMm: number | null }>;
}

const pilotFallback: PilotProfile = {
  dataStatus: 'demonstration_assumptions',
  organisation: { name: 'Prime Sources', role: 'Agricultural consulting and pilot operator' },
  farm: {
    code: 'PS-HATTIES-001', name: 'Hatties Pilot Farm', country: 'Eswatini', region: 'Manzini',
    locality: 'Mankayane', latitude: -26.6833, longitude: 31.0833, sizeHectares: 6,
  },
  field: { code: 'VEG-A1', name: 'Vegetable Block A1', sizeHectares: 1.2, irrigationType: 'drip', crop: 'Cabbage' },
  irrigation: { targetPressureMinBar: 2.2, targetPressureMaxBar: 2.8, expectedFlowMinLitresPerMinute: 90 },
  pilotScenario: {
    title: 'Low irrigation delivery to Vegetable Block A1', simulatedPressureBar: 1.7,
    simulatedFlowLitresPerMinute: 68, lowPressureDurationMinutes: 12,
  },
  evidenceNotice: 'Farm size, crop, block and irrigation values are pilot assumptions. Replace them with measured or manager-approved data before production use.',
};

const simulatedEvaluation: Evaluation = {
  state: 'incident', severity: 'high', title: 'Irrigation delivery below target',
  explanation: 'Pressure and flow remain below their approved operating thresholds while the pump is running and irrigation is scheduled.',
  confidencePercent: 92,
  evidence: [
    { label: 'Pressure', value: '1.7 bar', kind: 'measured' },
    { label: 'Flow', value: '68 L/min', kind: 'measured' },
    { label: 'Pump', value: 'Running', kind: 'manual' },
    { label: 'Duration', value: '12 minutes', kind: 'calculated' },
  ],
  recommendedAction: 'Inspect the pump, filter and mainline for a blockage or leak, then verify pressure at Block A1.',
};

const SourceBadge = ({ label, state }: { label: string; state: SourceState }) => (
  <div className={`ag-source ag-source--${state}`}>
    <span className="ag-source__dot" />
    <span>{label}</span>
    <small>{state}</small>
  </div>
);

export default function AgricultureCommandCentre() {
  const [pilot, setPilot] = useState<PilotProfile>(pilotFallback);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [apiMode, setApiMode] = useState<'live' | 'preview'>('preview');
  const [running, setRunning] = useState(false);
  const [resolved, setResolved] = useState(false);

  const hasSession = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    if (!hasSession) return;
    const load = async () => {
      try {
        const pilotResponse = await apiClient.get('/api/v1/agriculture-engine/pilot');
        const nextPilot = pilotResponse.data.data as PilotProfile;
        setPilot(nextPilot);
        setApiMode('live');
        try {
          const weatherResponse = await apiClient.get('/api/v1/agriculture-engine/weather', {
            params: { latitude: nextPilot.farm.latitude, longitude: nextPilot.farm.longitude },
          });
          setWeather(weatherResponse.data.data);
        } catch { /* Weather remains explicitly unavailable. */ }
      } catch { setApiMode('preview'); }
    };
    void load();
  }, [hasSession]);

  const rain = useMemo(() => weather?.daily?.[0]?.precipitationProbabilityMaxPercent ?? null, [weather]);

  const runScenario = async () => {
    setRunning(true);
    setResolved(false);
    if (hasSession) {
      try {
        const response = await apiClient.post('/api/v1/agriculture-engine/pilot/irrigation-scenario');
        setEvaluation(response.data.data.evaluation);
        setRunning(false);
        return;
      } catch { /* Preserve the demonstrable pilot when the API is sleeping. */ }
    }
    window.setTimeout(() => {
      setEvaluation(simulatedEvaluation);
      setRunning(false);
    }, 650);
  };

  return (
    <main className="ag-shell">
      <header className="ag-header">
        <div>
          <div className="ag-eyebrow"><Sprout size={15} /> Masaphokati Agriculture OS <span>Pilot</span></div>
          <h1>Farm Command Centre</h1>
          <p><MapPin size={15} /> {pilot.organisation.name} · {pilot.farm.locality}, {pilot.farm.region}, {pilot.farm.country}</p>
        </div>
        <div className="ag-header__right">
          <div className={`ag-mode ag-mode--${apiMode}`}><Radio size={14} /> {apiMode === 'live' ? 'Engine connected' : 'Guided pilot mode'}</div>
          <button className="ag-avatar" aria-label="Farm manager profile">PS</button>
        </div>
      </header>

      <section className="ag-notice">
        <ShieldCheck size={18} />
        <div><strong>Evidence-first pilot</strong><span>{pilot.evidenceNotice}</span></div>
      </section>

      <section className="ag-summary">
        <article><span>Farm footprint</span><strong>{pilot.farm.sizeHectares.toFixed(1)} ha</strong><small>{pilot.farm.code}</small></article>
        <article><span>Active pilot block</span><strong>{pilot.field.sizeHectares.toFixed(1)} ha</strong><small>{pilot.field.crop} · {pilot.field.irrigationType}</small></article>
        <article><span>Irrigation target</span><strong>{pilot.irrigation.targetPressureMinBar}–{pilot.irrigation.targetPressureMaxBar} bar</strong><small>≥ {pilot.irrigation.expectedFlowMinLitresPerMinute} L/min</small></article>
        <article><span>Local weather</span><strong>{weather?.current.temperatureC != null ? `${weather.current.temperatureC}°C` : 'Unavailable'}</strong><small>{rain != null ? `${rain}% chance of rain` : 'Connect Open-Meteo through engine'}</small></article>
      </section>

      <section className="ag-grid">
        <article className="ag-work">
          <div className="ag-cardhead">
            <div><span className="ag-kicker">Priority work</span><h2>What needs attention now</h2></div>
            <span className="ag-count">{resolved ? 0 : 1} open</span>
          </div>

          {!evaluation && !resolved && (
            <div className="ag-empty-action">
              <div className="ag-empty-action__icon"><Gauge size={28} /></div>
              <div><h3>Validate irrigation delivery</h3><p>Run the approved Hatties scenario to test evidence, alert logic and the manager response.</p></div>
              <button className="ag-primary" onClick={runScenario} disabled={running}>
                {running ? <RefreshCw className="ag-spin" size={16} /> : <Waves size={16} />}
                {running ? 'Evaluating…' : 'Run pilot scenario'}
              </button>
            </div>
          )}

          {evaluation && !resolved && (
            <div className="ag-incident">
              <div className="ag-incident__bar" />
              <div className="ag-incident__top">
                <div className="ag-alert-icon"><AlertTriangle size={22} /></div>
                <div><span className="ag-severity">High priority · simulated telemetry</span><h3>{evaluation.title}</h3><p>{pilot.field.name} · detected moments ago</p></div>
                <div className="ag-confidence"><strong>{evaluation.confidencePercent}%</strong><span>confidence</span></div>
              </div>
              <p className="ag-explanation">{evaluation.explanation}</p>
              <div className="ag-evidence">
                {evaluation.evidence.map((item) => (
                  <div key={item.label}><span>{item.label}<em>{item.kind}</em></span><strong>{String(item.value)}</strong></div>
                ))}
              </div>
              <div className="ag-recommendation"><strong>Recommended next action</strong><p>{evaluation.recommendedAction}</p></div>
              <div className="ag-actions">
                <button className="ag-primary" onClick={() => setResolved(true)}><Check size={16} /> Mark field check complete</button>
                <button className="ag-secondary" onClick={runScenario}><RefreshCw size={15} /> Re-run evidence</button>
              </div>
            </div>
          )}

          {resolved && (
            <div className="ag-resolved"><Check size={24} /><div><h3>Field check recorded</h3><p>The preview work item is closed. Production will preserve the operator, time, notes and corrective action.</p></div><button className="ag-link" onClick={runScenario}>Run again <ArrowRight size={15} /></button></div>
          )}
        </article>

        <aside className="ag-context">
          <div className="ag-cardhead"><div><span className="ag-kicker">Operating context</span><h2>{pilot.field.name}</h2></div><Leaf size={20} /></div>
          <div className="ag-block-visual">
            <div className="ag-block-visual__rings"><Droplets size={26} /><span>{pilot.field.code}</span></div>
            <div><strong>{pilot.field.crop}</strong><span>{pilot.field.sizeHectares} hectares under {pilot.field.irrigationType} irrigation</span></div>
          </div>
          <div className="ag-reading"><Gauge /><div><span>Pressure</span><strong>{evaluation ? `${pilot.pilotScenario.simulatedPressureBar} bar` : 'Awaiting reading'}</strong></div><small className={evaluation ? 'bad' : ''}>{evaluation ? 'below target' : 'unavailable'}</small></div>
          <div className="ag-reading"><Droplets /><div><span>Flow rate</span><strong>{evaluation ? `${pilot.pilotScenario.simulatedFlowLitresPerMinute} L/min` : 'Awaiting reading'}</strong></div><small className={evaluation ? 'bad' : ''}>{evaluation ? 'below target' : 'unavailable'}</small></div>
          <div className="ag-reading"><ThermometerSun /><div><span>Air temperature</span><strong>{weather?.current.temperatureC != null ? `${weather.current.temperatureC}°C` : 'Unavailable'}</strong></div><small>{weather ? 'forecast source' : 'not fetched'}</small></div>
        </aside>
      </section>

      <section className="ag-providers">
        <div><span className="ag-kicker">Engine readiness</span><h2>Data sources</h2></div>
        <div className="ag-providers__list">
          <SourceBadge label="Agriculture API + Neon" state={apiMode === 'live' ? 'connected' : 'simulated'} />
          <SourceBadge label="Open-Meteo" state={weather ? 'connected' : 'pending'} />
          <SourceBadge label="AgroMonitoring" state="pending" />
          <SourceBadge label="farmOS" state="deferred" />
        </div>
        <div className="ag-cost"><CloudSun size={18} /><div><strong>R0 infrastructure target</strong><span>Vercel + existing Render + Neon during pilot</span></div></div>
      </section>
    </main>
  );
}
