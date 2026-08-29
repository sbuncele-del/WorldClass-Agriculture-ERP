export type IncidentStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'cancelled';

const transitions: Record<IncidentStatus, IncidentStatus[]> = {
  open: ['acknowledged', 'cancelled'],
  acknowledged: ['in_progress', 'resolved', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: [],
  cancelled: [],
};

export function assertIncidentTransition(from: IncidentStatus, to: IncidentStatus): void {
  if (!transitions[from]?.includes(to)) {
    throw new Error(`Invalid incident transition from ${from} to ${to}`);
  }
}

export function incidentTimestamps(status: IncidentStatus, now = new Date()): { acknowledgedAt?: string; resolvedAt?: string } {
  if (status === 'acknowledged') return { acknowledgedAt: now.toISOString() };
  if (status === 'resolved') return { resolvedAt: now.toISOString() };
  return {};
}
