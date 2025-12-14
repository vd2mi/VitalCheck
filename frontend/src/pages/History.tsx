import { useMemo } from 'react';
import { orderBy, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDate, formatDateTime } from '../utils/format';
import { SymptomEntry, Visit, VitalRecord } from '../types/models';

const History = () => {
  const { user } = useAuth();
  const ready = !!user;

  const symptomConstraints = useMemo(() => {
    if (!user) return null;
    return [where('patientId', '==', user.uid), orderBy('timestamp', 'desc')];
  }, [user]);

  const vitalConstraints = useMemo(() => {
    if (!user) return null;
    return [where('patientId', '==', user.uid), orderBy('timestamp', 'desc')];
  }, [user]);

  const visitConstraints = useMemo(() => {
    if (!user) return null;
    return [where('patientId', '==', user.uid), orderBy('date', 'desc')];
  }, [user]);

  const { data: symptoms } =
    useFirestoreCollection<SymptomEntry>('symptoms', symptomConstraints, ready);

  const { data: vitals } =
    useFirestoreCollection<VitalRecord>('vitals', vitalConstraints, ready);

  const { data: visits } =
    useFirestoreCollection<Visit>('visits', visitConstraints, ready);

  return (
    <main className="bg-slate-100 pb-16">
      <div className="mx-auto max-w-5xl space-y-8 px-4 pt-8">

        <section className="bg-white p-6 rounded-xl shadow-card">
          <h1 className="text-2xl font-semibold">Health history</h1>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="bg-white p-6 rounded-xl space-y-4 shadow-card">
            <h2 className="font-semibold text-lg">Vitals timeline</h2>
            {vitals.length === 0 && <p>No vitals recorded.</p>}
            {vitals.map(v => (
              <div key={v.id} className="border rounded-lg p-3">
                <p className="text-xs text-slate-500">{formatDateTime(v.timestamp)}</p>
                <p className="font-semibold">
                  {v.temperature}°C • {v.heartRate} bpm
                </p>
                <p className="text-xs">BP {v.bpSys}/{v.bpDia} • SpO₂ {v.spo2}%</p>
                {v.notes && <p className="text-xs mt-1">{v.notes}</p>}
              </div>
            ))}
          </article>

          <article className="bg-white p-6 rounded-xl space-y-4 shadow-card">
            <h2 className="font-semibold text-lg">Logged symptoms</h2>
            {symptoms.length === 0 && <p>No symptoms recorded.</p>}
            {symptoms.map(s => (
              <div key={s.id} className="border rounded-lg p-3">
                <p className="text-xs text-slate-500">{formatDateTime(s.timestamp)}</p>
                <p>{s.text}</p>

                {s.tags?.length > 0 && (
                  <ul className="mt-2 flex gap-2 flex-wrap text-xs">
                    {s.tags.map(t => (
                      <li key={t} className="bg-slate-200 px-2 py-1 rounded">
                        #{t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </article>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-card space-y-4">
          <h2 className="font-semibold text-lg">Visit notes</h2>
          {visits.length === 0 && <p>No visits recorded.</p>}
          {visits.map(v => (
            <div key={v.id} className="border rounded-lg p-3">
              <p className="text-xs text-slate-500">{formatDate(v.date)}</p>
              <p className="font-semibold">Doctor: {v.doctorId}</p>
              <p className="mt-1">{v.notes}</p>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
};

export default History;