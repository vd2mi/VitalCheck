import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppUser } from '../types/models';
import { handleLogout, onAuthUserChanged } from '../services/auth';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error?: string;
  signOut: () => Promise<void>;
  isDoctor: boolean;
  isPatient: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = onAuthUserChanged((nextUser, nextError) => {
      setUser(nextUser);
      setError(nextError?.message);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      error,
      signOut: () => handleLogout(),
      isDoctor: user?.role === 'doctor',
      isPatient: user?.role === 'patient'
    }),
    [error, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

