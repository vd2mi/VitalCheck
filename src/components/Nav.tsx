import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navLinkClass =
  'rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';

const Nav = () => {
  const { user, signOut, isDoctor, isPatient } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <span className="text-xl font-semibold text-brand-600">VitalCheck</span>
        </div>
        <nav className="flex items-center gap-2">
          <NavLink to="/" className={({ isActive }) => `${navLinkClass} ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            Home
          </NavLink>
          {isPatient && (
            <>
              <NavLink
                to="/appointments"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                Appointments
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                History
              </NavLink>
            </>
          )}
          {isDoctor && (
            <NavLink
              to="/doctor"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Doctor Inbox
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline" aria-live="polite">
            {user.name} · {user.role}
          </span>
          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className="rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Nav;

