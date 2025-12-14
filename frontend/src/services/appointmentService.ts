import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Appointment, AppointmentStatus, AppointmentWithPatient } from '../types/models';
import { fetchCollection } from './firestore';
import { hasAppointmentConflict, validateAppointmentDate } from '../utils/validation';

const APPOINTMENTS_COLLECTION = 'appointments';
const USERS_COLLECTION = 'users';
const PATIENTS_COLLECTION = 'patients';

export interface AppointmentRequestInput {
  patientId: string;
  doctorId: string;
  preferredTime: string;
  reason: string;
}

export const requestAppointment = async (input: AppointmentRequestInput) => {
  const { patientId, doctorId, preferredTime, reason } = input;
  const dateError = validateAppointmentDate(preferredTime);
  if (dateError) throw new Error(dateError);

  const conflictQuery = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where('doctorId', '==', doctorId),
    where('status', 'in', ['approved', 'pending']),
    orderBy('preferredTime')
  );

  const conflictSnapshot = await getDocs(conflictQuery);
  const existing = conflictSnapshot.docs.map(
    (snapshot) => snapshot.data() as Pick<Appointment, 'preferredTime' | 'status'>
  );
  if (hasAppointmentConflict({ existingAppointments: existing, newPreferredTime: preferredTime })) {
    throw new Error('Selected time conflicts with another appointment');
  }

  const newAppointmentRef = doc(collection(db, APPOINTMENTS_COLLECTION));
  await setDoc(newAppointmentRef, {
    patientId,
    doctorId,
    preferredTime,
    reason,
    status: 'pending',
    createdAt: serverTimestamp()
  });
  return newAppointmentRef.id;
};

export const updateAppointmentStatus = async (id: string, status: AppointmentStatus, notes?: string) => {
  const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, id);
  await updateDoc(appointmentRef, {
    status,
    notes: notes ?? null,
    updatedAt: serverTimestamp()
  });
};

export const listAppointmentsForPatient = (patientId: string) =>
  fetchCollection<Appointment>(APPOINTMENTS_COLLECTION, [where('patientId', '==', patientId), orderBy('createdAt', 'desc')]);

export const listAppointmentsForDoctor = (doctorId: string) =>
  fetchCollection<Appointment>(APPOINTMENTS_COLLECTION, [where('doctorId', '==', doctorId), orderBy('createdAt', 'desc')]);

export const getDoctorAppointmentsWithPatient = async (doctorId: string): Promise<AppointmentWithPatient[]> => {
  const appointments = await listAppointmentsForDoctor(doctorId);
  if (!appointments.length) return [];

  const patientSnapshots = await Promise.all(
    appointments.map((appointment) => getDoc(doc(db, PATIENTS_COLLECTION, appointment.patientId)))
  );

  return appointments.map((appointment, index) => {
    const snapshot = patientSnapshots[index];
    return {
      ...appointment,
      patient: snapshot.exists()
        ? ({
            id: snapshot.id,
            ...(snapshot.data() as AppointmentWithPatient['patient'])
          } as AppointmentWithPatient['patient'])
        : undefined
    };
  });
};

export const searchPatientsByContact = async (term: string) => {
  const lower = term.toLowerCase();
  const patients = await fetchCollection<{ name: string; email: string; userId: string }>(USERS_COLLECTION, []);
  return patients.filter(
    (patient) =>
      patient.name?.toLowerCase().includes(lower) ||
      patient.email?.toLowerCase().includes(lower)
  );
};

