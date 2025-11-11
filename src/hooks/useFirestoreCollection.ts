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

  // ✅ Stabilize constraints BEFORE useEffect
  const constraintsKey = useMemo(
    () =>
      JSON.stringify(
        constraints.map((c: any) => ({
          type: c.type,
          field: c.fieldPath?.canonicalString,
          op: c.opStr,
          value: c._value,
        }))
      ),
    [constraints]
  );

  useEffect(() => {
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
  }, [collectionPath, dependencyKey, constraintsKey]); // ✅ stable dependencies

  return { data, loading, error };
};
