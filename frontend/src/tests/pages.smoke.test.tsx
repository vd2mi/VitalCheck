import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import PatientDashboard from '../pages/PatientDashboard';
import DoctorDashboard from '../pages/DoctorDashboard';

vi.mock('../services/firebase', () => ({
  db: {},
  auth: {}
}));

const authMock = vi.hoisted(() =>
  vi.fn(() => ({
    user: { uid: 'user-1', name: 'Test User', role: 'patient', email: 'test@example.com' },
    loading: false,
    error: undefined,
    signOut: vi.fn(),
    isDoctor: false,
    isPatient: true
  }))
);

vi.mock('../hooks/useAuth', () => ({
  useAuth: authMock,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../hooks/useFirestoreCollection', () => ({
  useFirestoreCollection: () => ({ data: [], loading: false, error: undefined })
}));

const renderWithRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('page smoke tests', () => {
  beforeEach(() => {
    authMock.mockClear();
    authMock.mockReturnValue({
      user: { uid: 'user-1', name: 'Test User', role: 'patient', email: 'test@example.com' },
      loading: false,
      error: undefined,
      signOut: vi.fn(),
      isDoctor: false,
      isPatient: true
    });
  });

  it('renders login form headers', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('renders signup form headers', () => {
    renderWithRouter(<Signup />);
    expect(screen.getByText(/create your vitalcheck account/i)).toBeInTheDocument();
  });

  it('renders patient dashboard sections', () => {
    authMock.mockReturnValueOnce({
      user: { uid: 'user-1', name: 'Test User', role: 'patient', email: 'test@example.com' },
      loading: false,
      error: undefined,
      signOut: vi.fn(),
      isDoctor: false,
      isPatient: true
    });
    renderWithRouter(<PatientDashboard />);
    expect(screen.getAllByText(/record vitals/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/today's reminders/i)).toBeInTheDocument();
  });

  it('renders doctor dashboard sections', () => {
    authMock.mockReturnValueOnce({
      user: { uid: 'doctor-1', name: 'Doctor Who', role: 'doctor', email: 'doc@example.com' },
      loading: false,
      error: undefined,
      signOut: vi.fn(),
      isDoctor: true,
      isPatient: false
    });
    renderWithRouter(<DoctorDashboard />);
    expect(screen.getByText(/appointment inbox/i)).toBeInTheDocument();
    expect(screen.getByText(/patient search/i)).toBeInTheDocument();
  });
});

