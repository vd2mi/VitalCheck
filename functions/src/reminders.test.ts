import { describe, expect, it } from 'vitest';
import { mapMedicationNotifications } from './reminders';

describe('mapMedicationNotifications', () => {
  it('returns notifications for daily schedules', () => {
    const notifications = mapMedicationNotifications(
      'med-1',
      {
        patientId: 'patient-1',
        name: 'Medication',
        dose: '5mg',
        schedule: { frequency: 'daily', times: ['08:00', '20:00'] }
      },
      '2025-01-01'
    );
    expect(notifications).toHaveLength(2);
    expect(notifications[0].payload).toMatchObject({ dueAt: '2025-01-01T08:00' });
  });

  it('skips as-needed medications', () => {
    const notifications = mapMedicationNotifications(
      'med-2',
      {
        patientId: 'patient-1',
        name: 'Painkiller',
        dose: '10mg',
        schedule: { frequency: 'as-needed', times: [] }
      },
      '2025-01-01'
    );
    expect(notifications).toHaveLength(0);
  });
});

