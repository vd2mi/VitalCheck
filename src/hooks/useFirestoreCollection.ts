import { useEffect, useState, useMemo } from 'react';
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

  // Stabilize constraints so useEffect doesn't loop
  const constraintsKey = useMemo(() => {
    return JSON.stringify(
      constraints.map((c: any) => ({
        f: c.fieldPath?.canonicalString,
        o: c.opStr,
        v: c._value
      }))
    );
  }, [constraints]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionPath), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs.map((doc) => {
          const raw = doc.data() as any;
          return {
            ...raw,
            id: doc.id,
            uid: raw.uid ?? doc.id   // ✅ Ensure UID is ALWAYS correct
          } as T;
        });

        setData(rows);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionPath, dependencyKey, constraintsKey]);

  return { data, loading, error };
};
