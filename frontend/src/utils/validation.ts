import { differenceInMinutes, isBefore, parseISO } from 'date-fns';
import { AppointmentStatus, MedicationSchedule } from '../types/models';

export const VITAL_RANGES = {
  temperature: { min: 30, max: 45, label: 'Temperature (°C)' },
  heartRate: { min: 30, max: 220, label: 'Heart Rate (bpm)' },
  bpSys: { min: 40, max: 250, label: 'Systolic BP (mmHg)' },
  bpDia: { min: 30, max: 150, label: 'Diastolic BP (mmHg)' },
  spo2: { min: 50, max: 100, label: 'SpO₂ (%)' }
} as const;

export type VitalSeverity = 'low' | 'medium' | 'high';

export interface VitalFormValues {
  temperature: number | '';
  heartRate: number | '';
  bpSys: number | '';
  bpDia: number | '';
  spo2: number | '';
  notes?: string;
}

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export const isWithinRange = (value: number, min: number, max: number) =>
  Number.isFinite(value) && value >= min && value <= max;

export function validateVitalForm(values: VitalFormValues): ValidationErrors<VitalFormValues> {
  const errors: ValidationErrors<VitalFormValues> = {};

  (Object.keys(VITAL_RANGES) as Array<keyof typeof VITAL_RANGES>).forEach((key) => {
    const range = VITAL_RANGES[key];
    const rawValue = values[key as keyof VitalFormValues];

    if (rawValue === '' || rawValue === undefined) {
      errors[key as keyof VitalFormValues] = `${range.label} is required`;
      return;
    }

    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) {
      errors[key as keyof VitalFormValues] = `${range.label} must be a number`;
      return;
    }

    if (!isWithinRange(numericValue, range.min, range.max)) {
      errors[key as keyof VitalFormValues] = `${range.label} must be between ${range.min} and ${range.max}`;
    }
  });

  if (values.bpSys !== '' && values.bpDia !== '' && Number(values.bpSys) <= Number(values.bpDia)) {
    errors.bpSys = 'Systolic pressure must be higher than diastolic pressure';
    errors.bpDia = 'Diastolic pressure must be lower than systolic pressure';
  }

  return errors;
}

export const sanitizeText = (value: string) =>
  value.trim().replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ');

/**
 * Very simple, hard-coded severity logic.
 * This is intentionally rule-based (not medical grade) to satisfy the SDS requirement.
 */
export function getVitalSeverity(input: {
  temperature: number;
  heartRate: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
}): VitalSeverity {
  const { temperature, heartRate, bpSys, bpDia, spo2 } = input;

  const isHigh =
    temperature >= 38.5 ||
    spo2 < 92 ||
    bpSys >= 180 ||
    bpDia >= 110 ||
    heartRate >= 120 ||
    heartRate <= 45;

  if (isHigh) return 'high';

  const isMedium =
    (temperature >= 37.5 && temperature < 38.5) ||
    (spo2 >= 92 && spo2 < 95) ||
    (bpSys >= 140 && bpSys < 180) ||
    (bpDia >= 90 && bpDia < 110) ||
    (heartRate >= 100 && heartRate < 120) ||
    (heartRate > 45 && heartRate < 55);

  if (isMedium) return 'medium';

  return 'low';
}

export function validateAppointmentDate(preferredTimeIso: string, now = new Date()): string | undefined {
  try {
    const preferred = parseISO(preferredTimeIso);
    if (!preferred || Number.isNaN(preferred.getTime())) {
      return 'Preferred time is invalid';
    }
    if (isBefore(preferred, now)) {
      return 'Appointments cannot be scheduled in the past';
    }
    return undefined;
  } catch {
    return 'Preferred time is invalid';
  }
}

export interface AppointmentOverlapParams {
  existingAppointments: Array<{ preferredTime: string; status: AppointmentStatus }>;
  newPreferredTime: string;
  windowMinutes?: number;
}

export function hasAppointmentConflict({
  existingAppointments,
  newPreferredTime,
  windowMinutes = 30
}: AppointmentOverlapParams): boolean {
  const target = parseISO(newPreferredTime);
  if (Number.isNaN(target.getTime())) return false;

  return existingAppointments.some((appointment) => {
    if (appointment.status !== 'approved' && appointment.status !== 'pending') {
      return false;
    }
    const existing = parseISO(appointment.preferredTime);
    if (Number.isNaN(existing.getTime())) {
      return false;
    }
    return Math.abs(differenceInMinutes(existing, target)) < windowMinutes;
  });
}

export const isValidMedicationSchedule = (schedule: MedicationSchedule) => {
  if (!schedule || !schedule.frequency) return false;
  const allowedFrequencies: MedicationSchedule['frequency'][] = ['daily', 'weekly', 'monthly', 'as-needed'];
  if (!allowedFrequencies.includes(schedule.frequency)) return false;

  if (schedule.frequency !== 'as-needed' && (!schedule.times || schedule.times.length === 0)) {
    return false;
  }

  if ((schedule.times ?? []).some((time) => !/^\d{2}:\d{2}$/.test(time))) {
    return false;
  }

  return true;
};

export function validateMedicationInput({
  name,
  dose,
  schedule,
  startDate,
  endDate
}: {
  name: string;
  dose: string;
  schedule: MedicationSchedule;
  startDate: string;
  endDate?: string;
}): string[] {
  const errors: string[] = [];
  if (!name.trim()) errors.push('Medication name is required');
  if (!dose.trim()) errors.push('Dose is required');
  if (!isValidMedicationSchedule(schedule)) errors.push('Schedule is invalid');
  if (!startDate) errors.push('Start date is required');
  if (startDate && endDate && isBefore(new Date(endDate), new Date(startDate))) {
    errors.push('End date must be after start date');
  }
  return errors;
}

