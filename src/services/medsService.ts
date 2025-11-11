import { addDoc, collection, deleteDoc, doc, getDoc, orderBy, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { Medication } from '../types/models';
import { validateMedicationInput } from '../utils/validation';
import { fetchCollection } from './firestore';

const MEDICATIONS_COLLECTION = 'medications';

export type MedicationInput = Omit<Medication, 'id'>;

export const createMedication = async (payload: MedicationInput) => {
  const errors = validateMedicationInput(payload);
  if (errors.length) {
    throw new Error(errors[0]);
  }
  await addDoc(collection(db, MEDICATIONS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateMedication = async (id: string, payload: Partial<MedicationInput>) => {
  const ref = doc(db, MEDICATIONS_COLLECTION, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error('Medication not found');
  }
  const nextValue = { ...(snapshot.data() as MedicationInput), ...payload };
  const errors = validateMedicationInput(nextValue);
  if (errors.length) throw new Error(errors[0]);

  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
};

export const deleteMedication = (id: string) => deleteDoc(doc(db, MEDICATIONS_COLLECTION, id));

export const listMedicationsForPatient = (patientId: string) =>
  fetchCollection<Medication>(MEDICATIONS_COLLECTION, [where('patientId', '==', patientId), orderBy('name')]);

