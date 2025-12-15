import { useMemo } from 'react';
import { orderBy, where, limit } from 'firebase/firestore';
import VitalsForm from '../components/VitalsForm';
import SymptomForm from '../components/SymptomForm';
import MedicationsList from '../components/MedicationsList';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDateTime } from '../utils/format';
import { VitalRecord, Medication } from '../types/models';
import { getVitalSeverity } from '../utils/validation';

const PatientDashboard = () => {
  const { user } = useAuth();
  const ready = !!user;

  const vitalConstraints = useMemo(() => {
    if (!user) return null;
    return [
      where('patientId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(3)
    ];
  }, [user]);

  const { data: recentVitals } =
    useFirestoreCollection<VitalRecord>('vitals', vitalConstraints, ready);

  const medicationConstraints = useMemo(() => {
    if (!user) return null;
    return [
      where('patientId', '==', user.uid),
      orderBy('startDate', 'desc')
    ];
  }, [user]);

  const { data: medications } =
    useFirestoreCollection<Medication>('medications', medicationConstraints, ready);

  const reminders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return medications
      .filter(m =>
        m.schedule.frequency === 'daily' &&
        (!m.endDate || m.endDate >= today) &&
        m.startDate <= today
      )
      .map(m => ({
        id: m.id,
        label: `${m.name} (${m.dose})`,
        dueAt: m.schedule.times.join(', ')
      }));
  }, [medications]);

  return (
    <main className="bg-slate-100 pb-16">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8">

        <section className="bg-gradient-to-r from-brand-500 to-brand-600 p-6 rounded-xl text-white shadow-card">
          <h1 className="text-2xl font-semibold">
            Hi {user?.name ?? 'there'}, ready to stay on top of your health?
          </h1>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <VitalsForm />
            <SymptomForm />
            <MedicationsList />
          </div>

          <aside className="space-y-6">

            <div className="bg-white p-6 rounded-xl shadow-card">
              <h2 className="text-lg font-semibold">Recent vitals</h2>

              <div className="mt-4 space-y-3 text-sm">
                {recentVitals.length === 0 && <p>No vitals yet.</p>}

                {recentVitals.map(v => {
                  const severity = getVitalSeverity({
                    temperature: v.temperature,
                    heartRate: v.heartRate,
                    bpSys: v.bpSys,
                    bpDia: v.bpDia,
                    spo2: v.spo2
                  });

                  const severityLabel =
                    severity === 'high' ? 'HIGH' : severity === 'medium' ? 'MED' : 'LOW';
                  const severityClass =
                    severity === 'high'
                      ? 'bg-red-100 text-red-800'
                      : severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800';

                  return (
                    <div key={v.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">
                          {formatDateTime(v.timestamp)}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${severityClass}`}>
                          {severityLabel}
                        </span>
                      </div>
                      <p className="font-semibold">
                        {v.temperature}°C • {v.heartRate} bpm
                      </p>
                      <p className="text-xs">
                        BP {v.bpSys}/{v.bpDia} • SpO₂ {v.spo2}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-card">
              <h2 className="text-lg font-semibold">Today's reminders</h2>

              <div className="mt-3 space-y-3 text-sm">
                {reminders.length === 0 && <p>You are all caught up!</p>}

                {reminders.map(r => (
                  <div
                    key={r.id}
                    className="border border-brand-200 rounded-md bg-brand-50 px-3 py-2"
                  >
                    <p className="font-semibold text-brand-700">
                      {r.label}
                    </p>
                    <p className="text-xs text-brand-600">
                      Take at: {r.dueAt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </section>

      </div>
    </main>
  );
};

export default PatientDashboard;