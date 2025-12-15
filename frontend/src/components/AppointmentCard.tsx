import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { AppointmentWithPatient, AppointmentStatus } from '../types/models';
import { formatDateTime } from '../utils/format';
import { updateAppointmentStatus } from '../services/appointmentService';
import { db } from '../services/firebase';

interface AppointmentCardProps {
  appointment: AppointmentWithPatient;
  onStatusChange?: (status: AppointmentStatus) => void;
}

const statusStyles: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
};

const AppointmentCard = ({ appointment, onStatusChange }: AppointmentCardProps) => {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState<string | null>(appointment.patient?.name ?? null);

  // Ensure we can always show a patient name for this appointment
  useEffect(() => {
    const loadPatientName = async () => {
      if (!appointment.patientId || patientName) return;
      try {
        const snap = await getDoc(doc(db, 'users', appointment.patientId));
        if (snap.exists()) {
          const data = snap.data() as { name?: string };
          setPatientName(data.name ?? 'Unknown patient');
        } else {
          setPatientName('Unknown patient');
        }
      } catch {
        setPatientName('Unknown patient');
      }
    };

    void loadPatientName();
  }, [appointment.patientId, patientName]);

  const handleStatus = async (status: AppointmentStatus) => {
    setPending(true);
    try {
      await updateAppointmentStatus(appointment.id, status);
      setFeedback(`Appointment ${status}.`);
      onStatusChange?.(status);
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {patientName ?? appointment.patient?.name ?? 'Unknown patient'}
          </p>
          <p className="text-xs text-slate-500">{appointment.reason}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.status]}`}>
          {appointment.status}
        </span>
      </div>
      <div className="text-sm text-slate-600">
        <p>
          Preferred time:{' '}
          <span className="font-medium text-slate-900">{formatDateTime(appointment.preferredTime)}</span>
        </p>
        <p>Requested: {formatDateTime(appointment.createdAt)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {appointment.status === 'pending' && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleStatus('approved')}
              className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleStatus('rejected')}
              className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Reject
            </button>
          </>
        )}
        {appointment.status === 'approved' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => handleStatus('completed')}
            className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Mark Completed
            </button>
        )}
        {appointment.patientId && (
          <button
            type="button"
            onClick={() => navigate(`/doctor/patient/${appointment.patientId}`)}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            View history
          </button>
        )}
      </div>
      {feedback && (
        <p role="status" className="text-xs text-slate-500">
          {feedback}
        </p>
      )}
    </article>
  );
};

export default AppointmentCard;

