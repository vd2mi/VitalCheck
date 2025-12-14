import { describe, expect, it } from 'vitest';
import {
  validateVitalForm,
  VITAL_RANGES,
  validateAppointmentDate,
  hasAppointmentConflict,
  validateMedicationInput
} from '../utils/validation';

describe('validation utils', () => {
  it('validates vitals within range', () => {
    const result = validateVitalForm({
      temperature: 37.2,
      heartRate: 80,
      bpSys: 120,
      bpDia: 80,
      spo2: 98
    });
    expect(result).toEqual({});
  });

  it('fails when vitals are outside range', () => {
    const result = validateVitalForm({
      temperature: VITAL_RANGES.temperature.max + 5,
      heartRate: '',
      bpSys: 90,
      bpDia: 100,
      spo2: 20
    });
    expect(result.temperature).toBeDefined();
    expect(result.heartRate).toBeDefined();
    expect(result.bpSys).toBeDefined();
    expect(result.bpDia).toBeDefined();
    expect(result.spo2).toBeDefined();
  });

  it('prevents appointments in the past', () => {
    const message = validateAppointmentDate('2000-01-01T09:00:00Z', new Date());
    expect(message).toMatch(/cannot be scheduled in the past/i);
  });

  it('detects appointment conflicts', () => {
    const conflict = hasAppointmentConflict({
      existingAppointments: [
        { preferredTime: '2025-01-01T09:00:00.000Z', status: 'approved' },
        { preferredTime: '2025-01-01T10:00:00.000Z', status: 'pending' }
      ],
      newPreferredTime: '2025-01-01T09:15:00.000Z'
    });
    expect(conflict).toBe(true);
  });

  it('validates medication input', () => {
    const errors = validateMedicationInput({
      name: '',
      dose: '',
      schedule: { frequency: 'daily', times: [] },
      startDate: '',
      endDate: undefined
    });
    expect(errors).toHaveLength(4);
  });
});

