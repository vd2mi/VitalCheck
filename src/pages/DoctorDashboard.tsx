import { FormEvent, useEffect, useMemo, useState } from 'react';
import { orderBy, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { AppointmentWithPatient } from '../types/models';
import AppointmentCard from '../components/AppointmentCard';
import { formatDate } from '../utils/format';
import { searchPatientsByContact } from '../services/appointmentService';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const constraints = useMemo(
    () => (user ? [where('doctorId', '==', user.uid), orderBy('createdAt', 'desc')] : []),
    [user]
  );
  const { data: appointments } = useFirestoreCollection<AppointmentWithPatient>('appointments', constraints, user?.uid ?? '');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ name: string; email: string; userId: string }[]>([]);

  useEffect(() => {
    let ignore = false;
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const result = await searchPatientsByContact(searchTerm);
      if (!ignore) setSearchResults(result);
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  const filtered = appointments.filter((appointment) =>
    selectedStatus === 'all' ? true : appointment.status === selectedStatus
  );

  return (
    <main className="bg-slate-100 pb-16">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-xl bg-white p-6 shadow-card">
          <h1 className="text-2xl font-semibold text-slate-900">Appointment inbox</h1>
          <p className="text-sm text-slate-500">
            Review new requests and monitor upcoming consultations. Last sync {formatDate(new Date().toISOString())}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(['all', 'pending', 'approved'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedStatus(option)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  selectedStatus === option ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-4">
            {filtered.length === 0 && <p className="text-sm text-slate-500">No appointments yet.</p>}
            {filtered.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Patient search</h2>
          <p className="text-sm text-slate-500">Look up patients by name or email to open their timeline.</p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(event: FormEvent) => event.preventDefault()}>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search patients"
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          </form>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {searchTerm && searchResults.length === 0 && <p>No matching patients.</p>}
            {searchResults.map((result) => (
              <div
                key={result.userId}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-slate-900">{result.name}</p>
                  <p className="text-xs text-slate-500">{result.email}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  View timeline
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default DoctorDashboard;

