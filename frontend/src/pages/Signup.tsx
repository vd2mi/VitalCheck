import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { handleSignup, SignupPayload } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

const Signup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupPayload>({
    email: '',
    password: '',
    name: '',
    role: 'patient'
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/');
  }, [navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await handleSignup(form);
      navigate('/');
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-xl space-y-6 rounded-xl bg-white p-8 shadow-card">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Create your VitalCheck account</h1>
          <p className="text-sm text-slate-500">Choose a role to tailor your dashboard.</p>
        </div>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
            Full name
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
            Password
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </label>
          <fieldset className="space-y-2 rounded-md border border-slate-200 p-4">
            <legend className="text-sm font-medium text-slate-700">Role</legend>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="patient"
                  checked={form.role === 'patient'}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as SignupPayload['role'] }))}
                  className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Patient
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="doctor"
                  checked={form.role === 'doctor'}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as SignupPayload['role'] }))}
                  className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Doctor
              </label>
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        {feedback && (
          <p className="text-sm text-slate-500" role="status">
            {feedback}
          </p>
        )}
        <p className="text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Signup;

