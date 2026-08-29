import { PRIME_SOURCES_HATTIES_PILOT } from '../../src/modules/agriculture-engine/pilot-profile';
import { evaluateIrrigation } from '../../src/modules/agriculture-engine/irrigation-rules.service';

describe('Prime Sources Hatties pilot', () => {
  it('is explicitly identified as demonstration data', () => {
    expect(PRIME_SOURCES_HATTIES_PILOT.dataStatus).toBe('demonstration_assumptions');
    expect(PRIME_SOURCES_HATTIES_PILOT.evidenceNotice).toContain('pilot assumptions');
  });

  it('produces the intended corroborated irrigation incident', () => {
    const pilot = PRIME_SOURCES_HATTIES_PILOT;
    const now = new Date('2026-08-29T10:05:00.000Z');
    const result = evaluateIrrigation({
      farmId: pilot.farm.code,
      fieldId: pilot.field.code,
      deviceId: pilot.irrigation.pressureSensorCode,
      observedAt: '2026-08-29T10:00:00.000Z',
      pressureBar: pilot.pilotScenario.simulatedPressureBar,
      flowLitresPerMinute: pilot.pilotScenario.simulatedFlowLitresPerMinute,
      pumpRunning: pilot.pilotScenario.pumpRunning,
      irrigationScheduled: pilot.pilotScenario.irrigationScheduled,
      consecutiveLowReadings: pilot.pilotScenario.consecutiveLowReadings,
      lowPressureDurationMinutes: pilot.pilotScenario.lowPressureDurationMinutes,
      targetPressureMinBar: pilot.irrigation.targetPressureMinBar,
      targetPressureMaxBar: pilot.irrigation.targetPressureMaxBar,
      expectedFlowMinLitresPerMinute: pilot.irrigation.expectedFlowMinLitresPerMinute,
    }, now);
    expect(result.state).toBe('incident');
    expect(result.severity).toBe('high');
  });
});
