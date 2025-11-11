import { useEffect, useMemo, useState } from 'react';
import { collection, DocumentData, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useFirestoreCollection = <T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  dependencyKey = ''
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // ✅ FIX: stabilize constraints so React won't infinite-resubscribe
  const stableConstraints = useMemo(() => constraints, [dependencyKey]);

  useEffect(() => {
    setLoading(true);

    const q = query(collection(db, collectionPath), ...stableConstraints);

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
  }, [collectionPath, stableConstraints]);

  return { data, loading, error };
};
