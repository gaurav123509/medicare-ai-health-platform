import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { authApi, getApiError } from '../services/api';

const Signup = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: 'prefer_not_to_say',
    bloodGroup: '',
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
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
      };
      const data = await authApi.signup(payload);
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
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1fr_1fr] lg:px-6">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/" className="inline-flex rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
              Back to Home
            </Link>
            <div className="inline-flex rounded-full border border-brand-100 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 shadow-soft">
              Join MediCare AI
            </div>
          </div>
          <div className="max-w-2xl space-y-4">
            <h1 className="font-heading text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Create a patient account built for faster access to care.
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              Sign up once to unlock AI-driven symptom support, medical report insights, reminders, SOS assistance, and online doctor appointments.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Protected patient profile and login',
              'Health reminders with upcoming alerts',
              'Report and symptom history in one place',
              'Simple online consultation booking',
            ].map((item) => (
              <div
                key={item}
                className="glass-card rounded-[22px] border border-white/70 px-5 py-4 text-sm font-medium text-slate-700 shadow-soft"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card
          title="Create your account"
          subtitle="Use your patient details to get started."
          className="mx-auto w-full max-w-2xl"
        >
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Full name
              </span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Enter your full name"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Phone
              </span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="+91..."
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
                placeholder="Minimum 8 characters"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Age
              </span>
              <input
                name="age"
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Optional"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Gender
              </span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Blood group
              </span>
              <input
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Optional"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 md:col-span-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-brand-600 px-4 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700">
              Sign in here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
