import { useEffect, useState } from 'react';
import { collection, DocumentData, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useFirestoreCollection = <T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] | null,
  ready: boolean
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!ready || !constraints) {
      setData([]);
      setLoading(false);
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
  }, [collectionPath, ready, constraints]);

  return { data, loading, error };
};
