import { useMemo } from 'react';
import { orderBy, where, limit } from 'firebase/firestore';
import VitalsForm from '../components/VitalsForm';
import SymptomForm from '../components/SymptomForm';
import MedicationsList from '../components/MedicationsList';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDateTime } from '../utils/format';
import { VitalRecord, Medication } from '../types/models';

const PatientDashboard = () => {
  const { user } = useAuth();

  const vitalConstraints = useMemo(
    () =>
      user
        ? [where('patientId', '==', user.uid), orderBy('timestamp', 'desc'), limit(3)]
        : [],
    [user]
  );
  const { data: recentVitals } = useFirestoreCollection<VitalRecord>('vitals', vitalConstraints, user?.uid ?? '');

  const medicationConstraints = useMemo(
    () => (user ? [where('patientId', '==', user.uid), orderBy('startDate', 'desc')] : []),
    [user]
  );
  const { data: medications } = useFirestoreCollection<Medication>('medications', medicationConstraints, user?.uid ?? '');

  const reminders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return medications
      .filter(
        (med) =>
          med.schedule.frequency === 'daily' && (!med.endDate || med.endDate >= today) && med.startDate <= today
      )
      .map((med) => ({
        id: med.id,
        label: `${med.name} (${med.dose})`,
        dueAt: med.schedule.times.join(', ')
      }));
  }, [medications]);

  return (
    <main className="bg-slate-100 pb-16">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white shadow-card">
          <h1 className="text-2xl font-semibold">Hi {user?.name ?? 'there'}, ready to stay on top of your health?</h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-100">
            Record vitals, track symptoms, and never miss a medication dose with your personalized reminders.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <VitalsForm />
            <SymptomForm />
            <MedicationsList />
          </div>
          <aside className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Recent vitals</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {recentVitals.length === 0 && <p>No vitals recorded yet.</p>}
                {recentVitals.map((vital) => (
                  <div key={vital.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-400">{formatDateTime(vital.timestamp)}</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {vital.temperature}°C · {vital.heartRate} bpm
                    </p>
                    <p className="text-xs text-slate-500">
                      BP {vital.bpSys}/{vital.bpDia} · SpO₂ {vital.spo2}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Today&apos;s reminders</h2>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                {reminders.length === 0 && <p>You are all caught up!</p>}
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2">
                    <p className="font-semibold text-brand-700">{reminder.label}</p>
                    <p className="text-xs text-brand-600">Take at: {reminder.dueAt}</p>
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

