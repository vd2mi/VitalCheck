import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { handleLogin, resetPassword } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await handleLogin(email, password);
      navigate('/');
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setFeedback('Enter your email to receive a reset link.');
      return;
    }
    try {
      await resetPassword(email);
      setFeedback('Password reset email sent.');
    } catch (error) {
      setFeedback((error as Error).message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-card">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500">Log in to manage your health insights.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <button
          type="button"
          onClick={handleResetPassword}
          className="text-sm text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          Forgot password?
        </button>
        {feedback && (
          <p className="text-sm text-slate-500" role="status">
            {feedback}
          </p>
        )}
        <p className="text-sm text-slate-500">
          Need an account?{' '}
          <Link to="/signup" className="text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Login;

