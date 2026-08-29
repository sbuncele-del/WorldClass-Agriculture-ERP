import { IrrigationEvaluation, IrrigationTelemetryInput } from './types';

export function evaluateIrrigation(input: IrrigationTelemetryInput, now = new Date()): IrrigationEvaluation {
  const observedMs = Date.parse(input.observedAt);
  if (!Number.isFinite(observedMs)) throw new Error('observedAt must be a valid timestamp');
  const freshnessMinutes = Math.max(0, (now.getTime() - observedMs) / 60_000);
  const sensorHealth = input.sensorHealth || 'good';

  const evidence: IrrigationEvaluation['evidence'] = [
    { label: 'Pressure (bar)', value: input.pressureBar, kind: 'measured' },
    { label: 'Pump running', value: input.pumpRunning, kind: 'measured' },
    { label: 'Irrigation scheduled', value: input.irrigationScheduled, kind: 'calculated' },
    { label: 'Reading age (minutes)', value: Math.round(freshnessMinutes), kind: 'calculated' },
  ];
  if (input.flowLitresPerMinute !== undefined) {
    evidence.push({ label: 'Flow (L/min)', value: input.flowLitresPerMinute, kind: 'measured' });
  }

  if (freshnessMinutes > 30 || sensorHealth === 'fault') {
    return {
      state: 'unavailable', severity: 'medium', title: 'Irrigation evidence unavailable',
      explanation: sensorHealth === 'fault' ? 'The pressure sensor reports a fault.' : 'The latest reading is older than 30 minutes.',
      confidencePercent: 100, evidence, recommendedAction: 'Verify the sensor and field gateway before making an irrigation decision.',
    };
  }
  if (input.maintenanceActive) {
    return { state: 'watch', severity: 'low', title: 'Maintenance suppression active', explanation: 'Abnormal readings are expected during approved maintenance.', confidencePercent: 95, evidence };
  }
  if (!input.irrigationScheduled || !input.pumpRunning) {
    return { state: 'expected_off', severity: 'none', title: 'Irrigation is not expected to be pressurised', explanation: 'Low pressure is expected because irrigation is not scheduled or the pump is off.', confidencePercent: 98, evidence };
  }

  const lowPressure = input.pressureBar < input.targetPressureMinBar;
  const persistent = (input.lowPressureDurationMinutes || 0) >= 10 && (input.consecutiveLowReadings || 0) >= 3;
  const lowFlow = input.expectedFlowMinLitresPerMinute !== undefined && input.flowLitresPerMinute !== undefined
    ? input.flowLitresPerMinute < input.expectedFlowMinLitresPerMinute : false;

  if (lowPressure && persistent) {
    const confidence = lowFlow ? 92 : 78;
    return {
      state: 'incident', severity: lowFlow ? 'high' : 'medium', title: 'Probable irrigation delivery problem',
      explanation: lowFlow
        ? 'Pressure and flow remain below target while the pump is running and irrigation is scheduled.'
        : 'Pressure remains below target while the pump is running and irrigation is scheduled. Flow corroboration is unavailable or normal.',
      confidencePercent: confidence, evidence,
      recommendedAction: 'Inspect the pump, mainline, valves and block for a leak, obstruction or equipment fault.',
    };
  }
  if (lowPressure) {
    return { state: 'watch', severity: 'low', title: 'Low pressure under observation', explanation: 'Pressure is below target but has not yet met the persistence rule.', confidencePercent: 70, evidence, recommendedAction: 'Continue monitoring until three readings and ten minutes confirm the condition.' };
  }
  return { state: 'normal', severity: 'none', title: 'Irrigation operating within pressure range', explanation: 'The latest verified pressure is within the approved operating range.', confidencePercent: 95, evidence };
}
