import { useMemo } from 'react';
import { orderBy, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDate, formatDateTime } from '../utils/format';
import { SymptomEntry, Visit, VitalRecord } from '../types/models';

const History = () => {
  const { user } = useAuth();
  const patientConstraints = useMemo(
    () => (user ? [where('patientId', '==', user.uid), orderBy('timestamp', 'desc')] : []),
    [user]
  );
  const symptoms = useFirestoreCollection<SymptomEntry>('symptoms', patientConstraints, user?.uid ?? '').data;
  const vitals = useFirestoreCollection<VitalRecord>('vitals', patientConstraints, user?.uid ?? '').data;
  const visitsConstraints = useMemo(
    () => (user ? [where('patientId', '==', user.uid), orderBy('date', 'desc')] : []),
    [user]
  );
  const visits = useFirestoreCollection<Visit>('visits', visitsConstraints, user?.uid ?? '').data;

  return (
    <main className="bg-slate-100 pb-16">
      <div className="mx-auto max-w-5xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-xl bg-white p-6 shadow-card">
          <h1 className="text-2xl font-semibold text-slate-900">Health history</h1>
          <p className="text-sm text-slate-500">
            A timeline of vitals, symptoms, and visits to help you and your care team stay aligned.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="space-y-4 rounded-xl bg-white p-6 shadow-card">
            <header>
              <h2 className="text-lg font-semibold text-slate-900">Vitals timeline</h2>
              <p className="text-sm text-slate-500">Most recent first</p>
            </header>
            <div className="space-y-3 text-sm text-slate-600">
              {vitals.length === 0 && <p>No vitals recorded yet.</p>}
              {vitals.map((vital) => (
                <div key={vital.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-400">{formatDateTime(vital.timestamp)}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {vital.temperature}°C · {vital.heartRate} bpm · {vital.spo2}% SpO₂
                  </p>
                  <p className="text-xs text-slate-500">BP {vital.bpSys}/{vital.bpDia}</p>
                  {vital.notes && <p className="mt-1 text-xs text-slate-500">{vital.notes}</p>}
                </div>
              ))}
            </div>
          </article>

          <article className="space-y-4 rounded-xl bg-white p-6 shadow-card">
            <header>
              <h2 className="text-lg font-semibold text-slate-900">Logged symptoms</h2>
              <p className="text-sm text-slate-500">Track patterns over time.</p>
            </header>
            <div className="space-y-3 text-sm text-slate-600">
              {symptoms.length === 0 && <p>No symptoms logged yet.</p>}
              {symptoms.map((symptom) => (
                <div key={symptom.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-400">{formatDateTime(symptom.timestamp)}</p>
                  <p className="text-sm text-slate-700">{symptom.text}</p>
                  {symptom.tags?.length ? (
                    <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                      {symptom.tags.map((tag) => (
                        <li key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                          #{tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-card">
          <header>
            <h2 className="text-lg font-semibold text-slate-900">Visit notes</h2>
            <p className="text-sm text-slate-500">Documented consultations with your doctor.</p>
          </header>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {visits.length === 0 && <p>No visits recorded yet.</p>}
            {visits.map((visit) => (
              <div key={visit.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-400">{formatDate(visit.date)}</p>
                <p className="font-semibold text-slate-900">Doctor: {visit.doctorId}</p>
                <p className="mt-1 text-slate-600">{visit.notes}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default History;

