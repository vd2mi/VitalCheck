import { FormEvent, useMemo, useState } from 'react';
import { orderBy, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Appointment, AppUser } from '../types/models';
import { requestAppointment } from '../services/appointmentService';
import { formatDateTime } from '../utils/format';

const Appointments = () => {
  const { user } = useAuth();
  const doctorConstraints = useMemo(() => [where('role', '==', 'doctor')], []);
  const { data: doctors } = useFirestoreCollection<AppUser>('users', doctorConstraints, 'doctors');
  const appointmentConstraints = useMemo(
    () => (user ? [where('patientId', '==', user.uid), orderBy('createdAt', 'desc')] : []),
    [user]
  );
  const { data: appointments } = useFirestoreCollection<Appointment>('appointments', appointmentConstraints, user?.uid ?? '');

  const [form, setForm] = useState({
    doctorId: '',
    preferredTime: '',
    reason: ''
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (!form.preferredTime) {
      setFeedback('Choose a preferred time.');
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await requestAppointment({
        patientId: user.uid,
        doctorId: form.doctorId,
        preferredTime: new Date(form.preferredTime).toISOString(),
        reason: form.reason
      });
      setFeedback('Appointment requested. We will notify you once your doctor responds.');
      setForm({ doctorId: '', preferredTime: '', reason: '' });
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-slate-100 pb-16">
      <div className="mx-auto max-w-4xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-xl bg-white p-6 shadow-card">
          <h1 className="text-2xl font-semibold text-slate-900">Request an appointment</h1>
          <p className="text-sm text-slate-500">
            Choose your doctor, preferred time, and let them know the reason for the visit.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Doctor
              <select
                required
                value={form.doctorId}
                onChange={(event) => setForm((prev) => ({ ...prev, doctorId: event.target.value }))}
                className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.uid} value={doctor.uid}>
                    Dr. {doctor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Preferred time
              <input
                required
                type="datetime-local"
                value={form.preferredTime}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(event) => setForm((prev) => ({ ...prev, preferredTime: event.target.value }))}
                className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Reason
              <textarea
                required
                rows={4}
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? 'Sending…' : 'Request appointment'}
            </button>
          </form>
          {feedback && (
            <p className="mt-4 text-sm text-slate-500" role="status">
              {feedback}
            </p>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Your requests</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            {appointments.length === 0 && <p>No appointments yet.</p>}
            {appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {doctors.find((doctor) => doctor.uid === appointment.doctorId)?.name ?? 'Unknown doctor'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                    {appointment.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Preferred time: {formatDateTime(appointment.preferredTime)}
                </p>
                <p className="text-xs text-slate-500">Requested: {formatDateTime(appointment.createdAt)}</p>
                <p className="mt-2 text-sm text-slate-600">{appointment.reason}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Appointments;

