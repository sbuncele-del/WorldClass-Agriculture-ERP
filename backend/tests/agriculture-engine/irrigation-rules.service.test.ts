import { evaluateIrrigation } from '../../src/modules/agriculture-engine/irrigation-rules.service';

const base = {
  farmId: 'farm-1', deviceId: 'pressure-1', observedAt: '2026-08-29T10:00:00.000Z',
  pressureBar: 3.1, pumpRunning: true, irrigationScheduled: true,
  targetPressureMinBar: 3.6, targetPressureMaxBar: 4.0,
};

describe('evaluateIrrigation', () => {
  const now = new Date('2026-08-29T10:05:00.000Z');

  it('does not create an incident from one low reading', () => {
    expect(evaluateIrrigation(base, now).state).toBe('watch');
  });

  it('creates a corroborated incident after persistence', () => {
    const result = evaluateIrrigation({ ...base, flowLitresPerMinute: 80, expectedFlowMinLitresPerMinute: 100, consecutiveLowReadings: 3, lowPressureDurationMinutes: 12 }, now);
    expect(result.state).toBe('incident');
    expect(result.severity).toBe('high');
    expect(result.confidencePercent).toBe(92);
  });

  it('treats low pressure as expected when the pump is off', () => {
    expect(evaluateIrrigation({ ...base, pumpRunning: false }, now).state).toBe('expected_off');
  });

  it('marks stale evidence unavailable', () => {
    expect(evaluateIrrigation(base, new Date('2026-08-29T10:31:00.000Z')).state).toBe('unavailable');
  });
});
