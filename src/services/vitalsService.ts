import { addDoc, collection, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';
import { VitalRecord } from '../types/models';
import { VITAL_RANGES, VitalFormValues, ValidationErrors, validateVitalForm } from '../utils/validation';
import { fetchCollection } from './firestore';

const VITALS_COLLECTION = 'vitals';

export interface LogVitalInput extends VitalFormValues {
  patientId: string;
  timestamp?: string;
}

export const logVitals = async (input: LogVitalInput) => {
  const { patientId, timestamp = new Date().toISOString(), ...values } = input;
  const errors: ValidationErrors<VitalFormValues> = validateVitalForm(values);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0] ?? 'Invalid vitals input');
  }
  await addDoc(collection(db, VITALS_COLLECTION), {
    patientId,
    timestamp,
    ...values
  });
};

export const fetchRecentVitals = async (patientId: string, limit = 10): Promise<VitalRecord[]> => {
  const records = await fetchCollection<VitalRecord>(VITALS_COLLECTION, [
    where('patientId', '==', patientId),
    orderBy('timestamp', 'desc')
  ]);
  return records.slice(0, limit);
};

export const VITAL_HELPERS = VITAL_RANGES;

