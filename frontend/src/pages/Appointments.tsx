import { FormEvent, useEffect, useMemo, useState } from 'react';
import { orderBy, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Appointment, AppUser } from '../types/models';
import { requestAppointment } from '../services/appointmentService';
import { formatDateTime } from '../utils/format';
import { db } from '../services/firebase';

const Appointments = () => {
  const { user } = useAuth();

  const ready = !!user;

  const doctorConstraints = useMemo(() => {
    return [where('role', '==', 'doctor')];
  }, []);

  const { data: doctors } =
    useFirestoreCollection<AppUser>('users', doctorConstraints, true);

  const appointmentConstraints = useMemo(() => {
    if (!user) return null;
    return [where('patientId', '==', user.uid), orderBy('createdAt', 'desc')];
  }, [user]);

  const { data: appointments } =
    useFirestoreCollection<Appointment>('appointments', appointmentConstraints, ready);

  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    doctorId: '',
    preferredTime: '',
    reason: ''
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch doctor names for appointments
  useEffect(() => {
    if (!appointments.length) return;

    const fetchDoctorNames = async () => {
      const uniqueDoctorIds = [...new Set(appointments.map(a => a.doctorId))];
      const names: Record<string, string> = {};

      await Promise.all(
        uniqueDoctorIds.map(async (doctorId) => {
          if (doctorNames[doctorId]) {
            names[doctorId] = doctorNames[doctorId];
            return;
          }
          try {
            const doctorDoc = await getDoc(doc(db, 'users', doctorId));
            if (doctorDoc.exists()) {
              names[doctorId] = doctorDoc.data().name || 'Unknown doctor';
            } else {
              names[doctorId] = 'Unknown doctor';
            }
          } catch {
            names[doctorId] = 'Unknown doctor';
          }
        })
      );

      setDoctorNames(prev => ({ ...prev, ...names }));
    };

    fetchDoctorNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    if (!form.doctorId) {
      setFeedback('Select a doctor.');
      return;
    }

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

      setFeedback('Appointment requested.');
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Doctor
              <select
                required
                value={form.doctorId}
                onChange={(e) => setForm(prev => ({ ...prev, doctorId: e.target.value }))}
                className="rounded-md border border-slate-200 px-3 py-2 shadow-sm"
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
                onChange={(e) => setForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                className="rounded-md border border-slate-200 px-3 py-2 shadow-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Reason
              <textarea
                required
                rows={4}
                value={form.reason}
                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                className="rounded-md border border-slate-200 px-3 py-2 shadow-sm"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm text-white font-semibold hover:bg-brand-700 disabled:bg-slate-300"
            >
              {submitting ? 'Sending…' : 'Request appointment'}
            </button>
          </form>

          {feedback && (
            <p className="mt-4 text-sm text-slate-500">{feedback}</p>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Your requests</h2>

          <div className="mt-4 space-y-4 text-sm">
            {appointments.length === 0 && <p>No appointments yet.</p>}
            {appointments.map((a) => (
              <div key={a.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {doctorNames[a.doctorId] || doctors.find(d => d.uid === a.doctorId)?.name || 'Unknown doctor'}
                  </span>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold">
                    {a.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Preferred time: {formatDateTime(a.preferredTime)}
                </p>

                <p className="text-xs text-slate-500">
                  Requested: {formatDateTime(a.createdAt)}
                </p>

                <p className="mt-2">{a.reason}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Appointments;