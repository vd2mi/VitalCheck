export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: Date;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  dob?: string;
  gender?: string;
  contact?: string;
}

export interface VitalRecord {
  id: string;
  patientId: string;
  timestamp: string;
  temperature: number;
  heartRate: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
  notes?: string;
}

export interface SymptomEntry {
  id: string;
  patientId: string;
  text: string;
  tags: string[];
  timestamp: string;
}

export interface MedicationSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-needed';
  times: string[];
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  schedule: MedicationSchedule;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  createdAt: string;
  preferredTime: string;
  reason: string;
  status: AppointmentStatus;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  notes: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'medication' | 'visit' | 'general';
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  label: string;
  dueAt: string;
  type: 'medication' | 'visit';
}

export interface AppointmentWithPatient extends Appointment {
  patient?: PatientProfile;
}

