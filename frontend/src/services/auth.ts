import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  FirestoreError
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppUser, UserRole } from '../types/models';

const USERS_COLLECTION = 'users';

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export const mapFirebaseUser = async (user: User | null): Promise<AppUser | null> => {
  if (!user) return null;
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    const fallback: AppUser = {
      uid: user.uid,
      email: user.email ?? '',
      name: user.displayName ?? '',
      role: 'patient'
    };
    await setDoc(userRef, { ...fallback, createdAt: serverTimestamp() }, { merge: true });
    return fallback;
  }
  const data = snapshot.data();
  // Ensure uid is always present in the returned data
  if (!data.uid) {
    await updateDoc(userRef, { uid: user.uid });
    // Re-fetch after update to get the latest data
    const updatedSnapshot = await getDoc(userRef);
    const updatedData = updatedSnapshot.data() as Omit<AppUser, 'uid'>;
    return {
      uid: user.uid,
      ...updatedData
    };
  }
  const userData = data as Omit<AppUser, 'uid'>;
  return {
    uid: user.uid,
    ...userData
  };
};

export const handleSignup = async ({ email, password, name, role }: SignupPayload) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const userRef = doc(db, USERS_COLLECTION, credential.user.uid);
  await setDoc(userRef, {
    uid: credential.user.uid,
    email,
    name,
    role,
    createdAt: serverTimestamp()
  });
  // Wait a bit for the Cloud Function to set custom claims, then refresh token
  await new Promise(resolve => setTimeout(resolve, 1000));
  await credential.user.getIdToken(true);
  return mapFirebaseUser(credential.user);
};

export const handleLogin = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await credential.user.getIdToken(true);
  return mapFirebaseUser(credential.user);
};

export const handleLogout = () => signOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const updateUserRole = async (uid: string, role: UserRole) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, { role });
};

export const onAuthUserChanged = (callback: (user: AppUser | null, error?: FirestoreError) => void) => {
  const unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      try {
        const mapped = await mapFirebaseUser(user);
        callback(mapped ?? null);
      } catch (error) {
        callback(null, error as FirestoreError);
      }
    },
    (error) => callback(null, error as FirestoreError)
  );
  return unsubscribe;
};

export const usersCollection = () => collection(db, USERS_COLLECTION);

