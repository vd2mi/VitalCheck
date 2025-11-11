import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Appointments from './pages/Appointments';
import History from './pages/History';
import ProtectedRoute from './components/ProtectedRoute';
import Nav from './components/Nav';
import { useAuth } from './hooks/useAuth';

const RoleAwareHome = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'doctor') return <DoctorDashboard />;
  return <PatientDashboard />;
};

const AppLayout = () => (
  <div className="min-h-screen bg-slate-100">
    <Nav />
    <Outlet />
  </div>
);

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<RoleAwareHome />} />
        <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
          <Route path="appointments" element={<Appointments />} />
          <Route path="history" element={<History />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
          <Route path="doctor" element={<DoctorDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Route>
  </Routes>
);

export default App;
