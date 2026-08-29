import { assertIncidentTransition, incidentTimestamps } from '../../src/modules/agriculture-engine/incident-workflow.service';

describe('incident workflow', () => {
  it('allows the controlled operational path', () => {
    expect(() => assertIncidentTransition('open', 'acknowledged')).not.toThrow();
    expect(() => assertIncidentTransition('acknowledged', 'in_progress')).not.toThrow();
    expect(() => assertIncidentTransition('in_progress', 'resolved')).not.toThrow();
  });

  it('prevents reopening a resolved incident', () => {
    expect(() => assertIncidentTransition('resolved', 'open')).toThrow('Invalid incident transition');
  });

  it('records lifecycle timestamps', () => {
    const now = new Date('2026-08-29T10:00:00.000Z');
    expect(incidentTimestamps('acknowledged', now).acknowledgedAt).toBe(now.toISOString());
    expect(incidentTimestamps('resolved', now).resolvedAt).toBe(now.toISOString());
  });
});
