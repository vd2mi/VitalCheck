import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Firestore,
  QueryConstraint,
  DocumentData,
  CollectionReference
} from 'firebase/firestore';
import { db } from './firebase';

export const createDocument = async <T extends DocumentData>(
  collectionPath: string,
  payload: T,
  id?: string
) => {
  if (id) {
    const ref = doc(db, collectionPath, id);
    await setDoc(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return id;
  }
  const newRef = await addDoc(collection(db, collectionPath), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return newRef.id;
};

export const updateDocument = async <T extends DocumentData>(
  collectionPath: string,
  id: string,
  payload: Partial<T>
) => {
  const ref = doc(db, collectionPath, id);
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
};

export const getDocument = async <T extends DocumentData>(collectionPath: string, id: string) => {
  const ref = doc(db, collectionPath, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as T) };
};

export const listenToCollection = <T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[],
  callback: (items: T[]) => void
) => {
  const q = query(collection(db, collectionPath), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...(docSnapshot.data() as T)
    }));
    callback(items);
  });
};

export const fetchCollection = async <T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
) => {
  const q = query(collection(db, collectionPath), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as T)
  }));
};

export const orderedCollection = (
  path: string,
  field: string,
  direction: 'asc' | 'desc' = 'desc'
) => query(collection(db, path), orderBy(field, direction));

export const filterBy = (field: string, value: string) => where(field, '==', value);

export const collectionRef = (path: string): CollectionReference<DocumentData, DocumentData> => collection(db, path);

export interface FirestoreServiceConfig {
  dbInstance?: Firestore;
}

