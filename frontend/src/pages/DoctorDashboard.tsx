import { FormEvent, useEffect, useMemo, useState } from 'react';
import { orderBy, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { AppointmentWithPatient } from '../types/models';
import AppointmentCard from '../components/AppointmentCard';
import { formatDate } from '../utils/format';
import { searchPatientsByContact } from '../services/appointmentService';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const ready = !!user;
  const navigate = useNavigate();

  const constraints = useMemo(() => {
    if (!user) return null;
    return [where('doctorId', '==', user.uid), orderBy('createdAt', 'desc')];
  }, [user]);

  const { data: appointments } =
    useFirestoreCollection<AppointmentWithPatient>('appointments', constraints, ready);

  const [selectedStatus, setSelectedStatus] =
    useState<'all' | 'pending' | 'approved'>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] =
    useState<{ name: string; email: string; userId: string }[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const t = setTimeout(async () => {
      const results = await searchPatientsByContact(searchTerm);
      if (!cancelled) setSearchResults(results);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchTerm]);

  const filtered = appointments.filter(a =>
    selectedStatus === 'all' ? true : a.status === selectedStatus
  );

  return (
    <main className="bg-slate-100 pb-16">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8">

        <section className="bg-white p-6 rounded-xl shadow-card">
          <h1 className="text-2xl font-semibold">Appointment Inbox</h1>
          <p className="text-sm text-slate-500">
            Last sync: {formatDate(new Date().toISOString())}
          </p>

          <div className="mt-4 flex gap-2">
            {(['all', 'pending', 'approved'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-4 py-2 rounded-full text-xs font-semibold ${
                  selectedStatus === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {filtered.length === 0 ? (
              <p>No appointments.</p>
            ) : (
              filtered.map(a => (
                <AppointmentCard key={a.id} appointment={a} />
              ))
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-card">
          <h2 className="text-lg font-semibold">Search Patients</h2>

          <form className="mt-4 flex gap-3" onSubmit={(e: FormEvent) => e.preventDefault()}>
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="flex-1 border rounded-md px-3 py-2 shadow-sm"
            />

            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="border px-3 py-2 rounded-md text-sm shadow-sm bg-slate-100"
            >
              Clear
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {searchTerm && searchResults.length === 0 && <p>No results.</p>}
            {searchResults.map(r => (
              <div
                key={r.userId}
                className="flex items-center justify-between border rounded-md px-3 py-2"
              >
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/doctor/patient/${r.userId}`)}
                  className="bg-brand-600 text-white px-3 py-1 rounded text-xs shadow-sm"
                >
                  View history
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