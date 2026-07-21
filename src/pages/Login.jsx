import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { authApi, getApiError } from '../services/api';

const Login = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authApi.login(form);
      onAuthSuccess(data);
      navigate('/dashboard');
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-mesh">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-6">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/" className="inline-flex rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
              Back to Home
            </Link>
            <div className="inline-flex rounded-full border border-brand-100 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 shadow-soft">
              AI-powered Telemedicine & Health Assistant
            </div>
          </div>

          <div className="max-w-2xl space-y-5">
            <h1 className="font-heading text-4xl font-extrabold leading-tight text-slate-900 md:text-6xl">
              Secure care journeys for online consultation, health insights, and emergency support.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Access smart symptom triage, upload medical reports, manage medicine reminders, and book online consultations from one connected care dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Telemedicine Booking', value: '10+ specialist profiles' },
              { label: 'AI Symptom Review', value: 'Fast risk guidance' },
              { label: 'Emergency SOS', value: 'Priority response support' },
            ].map((item) => (
              <div
                key={item.label}
                className="glass-card rounded-[24px] border border-white/70 p-4 shadow-soft"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 font-heading text-lg font-extrabold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Card
          title="Welcome back"
          subtitle="Sign in to continue your care journey."
          className="mx-auto w-full max-w-lg"
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Enter your email"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Enter your password"
                required
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-600 px-4 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            New to the platform?{' '}
            <Link to="/signup" className="font-semibold text-brand-700">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
