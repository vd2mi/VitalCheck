import { FormEvent, useMemo, useState } from 'react';
import { where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { createMedication, deleteMedication } from '../services/medsService';
import { Medication } from '../types/models';

const frequencyOptions: Medication['schedule']['frequency'][] = [
  'daily',
  'weekly',
  'monthly',
  'as-needed'
];

const MedicationsList = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [form, setForm] = useState({
    name: '',
    dose: '',
    frequency: 'daily' as Medication['schedule']['frequency'],
    times: '08:00',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: ''
  });

  const ready = !!user;

  const constraints = useMemo(() => {
    if (!user) return null;
    return [where('patientId', '==', user.uid)];
  }, [user]);

  const { data: medications, loading } =
    useFirestoreCollection<Medication>('medications', constraints, ready);

  if (!user) return null;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    try {
      await createMedication({
        patientId: user.uid,
        name: form.name,
        dose: form.dose,
        schedule: {
          frequency: form.frequency,
          times:
            form.frequency === 'as-needed'
              ? []
              : form.times.split(',').map(t => t.trim())
        },
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        notes: ''
      });

      setFeedback('Medication added.');
      setForm({
        name: '',
        dose: '',
        frequency: 'daily',
        times: '08:00',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: ''
      });
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedication(id);
      setFeedback('Medication removed.');
    } catch (error) {
      setFeedback((error as Error).message);
    }
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Medications</h2>
          <p className="text-sm text-slate-500">Track prescription schedules and reminders.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading medications…</p>}
        {!loading && medications.length === 0 && (
          <p className="text-sm text-slate-500">No medications added yet.</p>
        )}

        {!loading &&
          medications.map(med => (
            <div
              key={med.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {med.name}{' '}
                  <span className="font-normal text-slate-500">({med.dose})</span>
                </p>
                <p className="text-xs text-slate-500">
                  {med.schedule.frequency}
                  {med.schedule.times?.length ? ` · ${med.schedule.times.join(', ')}` : ''}
                </p>
                <p className="text-xs text-slate-400">
                  {med.startDate} {med.endDate ? `→ ${med.endDate}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(med.id)}
                className="self-start rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
      </div>

      <form onSubmit={handleCreate} className="mt-6 grid gap-3 sm:grid-cols-2" noValidate>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Name
          <input
            required
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Dose
          <input
            required
            value={form.dose}
            onChange={e => setForm(prev => ({ ...prev, dose: e.target.value }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Frequency
          <select
            value={form.frequency}
            onChange={e =>
              setForm(prev => ({ ...prev, frequency: e.target.value as Medication['schedule']['frequency'] }))
            }
            className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm"
          >
            {frequencyOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {form.frequency !== 'as-needed' && (
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
            Times (comma separated HH:mm)
            <input
              value={form.times}
              onChange={e => setForm(prev => ({ ...prev, times: e.target.value }))}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm"
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Start date
          <input
            required
            type="date"
            value={form.startDate}
            onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          End date
          <input
            type="date"
            value={form.endDate}
            onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-slate-300"
          >
            {pending ? 'Saving…' : 'Add Medication'}
          </button>
        </div>
      </form>

      {feedback && <p className="mt-3 text-xs text-slate-500">{feedback}</p>}
    </section>
  );
};

export default MedicationsList;
