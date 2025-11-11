import { useEffect, useMemo, useState } from 'react';
import { collection, DocumentData, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useFirestoreCollection = <T extends DocumentData>(
  collectionPath: string | null,
  constraints: QueryConstraint[] | null,
  ready: boolean
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // ✅ If user is not ready, keep loading but do NOT run query
  useEffect(() => {
    if (!ready || !collectionPath || !constraints) {
      setLoading(true);
      return;
    }

    setLoading(true);

    const q = query(collection(db, collectionPath), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as T) })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionPath, ready, JSON.stringify(constraints)]);

  return { data, loading, error };
};
