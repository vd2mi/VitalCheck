import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAppointment, updateAppointmentStatus } from '../services/appointmentService';

const firestoreMocks = vi.hoisted(() => ({
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn()
}));

const { setDoc: setDocMock, updateDoc: updateDocMock, getDocs: getDocsMock } = firestoreMocks;

vi.mock('../services/firebase', () => ({
  db: {},
  auth: {}
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<object>('firebase/firestore');
  return {
    ...actual,
    doc: (...args: unknown[]) => {
      firestoreMocks.doc(...args);
      return { id: 'new-id' };
    },
    collection: (...args: unknown[]) => {
      firestoreMocks.collection(...args);
      return {};
    },
    getDocs: firestoreMocks.getDocs,
    setDoc: firestoreMocks.setDoc,
    updateDoc: firestoreMocks.updateDoc,
    where: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: () => 'timestamp',
    query: vi.fn()
  };
});

describe('appointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates appointments when no conflicts exist', async () => {
    getDocsMock.mockResolvedValueOnce({
      docs: []
    });

    await requestAppointment({
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      preferredTime: new Date(Date.now() + 3_600_000).toISOString(),
      reason: 'General checkup'
    });

    expect(setDocMock).toHaveBeenCalled();
  });

  it('prevents appointments in the past', async () => {
    const pending = requestAppointment({
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      preferredTime: '2000-01-01T09:00:00.000Z',
      reason: 'Follow-up'
    });
    await expect(pending).rejects.toThrow(/past/i);
  });

  it('updates appointment status', async () => {
    await updateAppointmentStatus('appointment-1', 'approved');
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: 'approved' }));
  });
});

