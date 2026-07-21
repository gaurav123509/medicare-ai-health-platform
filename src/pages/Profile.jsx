import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { authApi, getApiError } from '../services/api';

const inputClassName = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100';

const createInitialForm = (user) => ({
  name: user?.name || '',
  phone: user?.phone || '',
  age: user?.age ?? '',
  gender: user?.gender || 'prefer_not_to_say',
  bloodGroup: user?.bloodGroup || '',
  emergencyContactName: user?.emergencyContact?.name || '',
  emergencyContactPhone: user?.emergencyContact?.phone || '',
  emergencyContactRelation: user?.emergencyContact?.relation || '',
  specialty: user?.specialty || '',
  hospitalName: user?.hospitalName || '',
  consultationFee: user?.consultationFee ?? '',
  consultationModes: Array.isArray(user?.consultationModes) && user.consultationModes.length > 0
    ? user.consultationModes
    : ['online'],
  bio: user?.bio || '',
});

const Profile = ({ user, onProfileUpdate }) => {
  const [form, setForm] = useState(createInitialForm(user));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setForm(createInitialForm(user));
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleConsultationModeToggle = (mode) => {
    setForm((current) => {
      const exists = current.consultationModes.includes(mode);
      const nextModes = exists
        ? current.consultationModes.filter((item) => item !== mode)
        : [...current.consultationModes, mode];

      return {
        ...current,
        consultationModes: nextModes.length > 0 ? nextModes : ['online'],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        age: form.age === '' ? '' : Number(form.age),
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
          relation: form.emergencyContactRelation,
        },
      };

      if (user?.role === 'doctor') {
        payload.specialty = form.specialty;
        payload.hospitalName = form.hospitalName;
        payload.consultationFee = form.consultationFee === '' ? '' : Number(form.consultationFee);
        payload.consultationModes = form.consultationModes;
        payload.bio = form.bio;
      }

      const data = await authApi.updateProfile(payload);
      onProfileUpdate?.(data.user);
      setSuccess('Profile updated successfully.');
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[32px] bg-slateblue p-8 text-white shadow-soft">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.22),transparent_26%)]" />
          <div className="relative space-y-5">
            <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              Profile details and edit
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-brand-100">Account center</p>
              <h1 className="mt-2 font-heading text-4xl font-extrabold leading-tight">
                Manage your details, emergency contact, and care preferences.
              </h1>
            </div>
            <p className="max-w-2xl text-base leading-8 text-white/85">
              Keep your account information updated so appointments, SOS support, and healthcare workflows stay accurate.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Back to Dashboard
              </Link>
              <div className="inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/90">
                {user?.role === 'doctor' ? 'Doctor account' : 'Patient account'}
              </div>
            </div>
          </div>
        </div>

        <Card title="Current details" subtitle="A quick snapshot of your account information.">
          <div className="grid gap-4">
            {[
              ['Full name', user?.name || 'Not added'],
              ['Email address', user?.email || 'Not available'],
              ['Phone number', user?.phone || 'Not added'],
              ['Role', user?.role || 'patient'],
              ['Blood group', user?.bloodGroup || 'Not added'],
              ['Emergency contact', user?.emergencyContact?.name || 'Not added'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-2 font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card
        title="Edit profile"
        subtitle="Update your account details and save them securely."
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Enter your name"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
              <input
                value={user?.email || ''}
                className={`${inputClassName} bg-slate-50 text-slate-500`}
                disabled
                readOnly
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Enter your phone"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Age</span>
              <input
                name="age"
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Enter your age"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Gender</span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={inputClassName}
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Blood group</span>
              <input
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Example: O+"
              />
            </label>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
            <h3 className="font-heading text-2xl font-extrabold text-slate-900">Emergency contact</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Contact name</span>
                <input
                  name="emergencyContactName"
                  value={form.emergencyContactName}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Who should we contact?"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Contact phone</span>
                <input
                  name="emergencyContactPhone"
                  value={form.emergencyContactPhone}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Enter phone number"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Relation</span>
                <input
                  name="emergencyContactRelation"
                  value={form.emergencyContactRelation}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Example: Brother"
                />
              </label>
            </div>
          </div>

          {user?.role === 'doctor' && (
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <h3 className="font-heading text-2xl font-extrabold text-slate-900">Doctor profile</h3>
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Specialty</span>
                  <input
                    name="specialty"
                    value={form.specialty}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Your specialty"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Hospital name</span>
                  <input
                    name="hospitalName"
                    value={form.hospitalName}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Hospital or clinic"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Consultation fee</span>
                  <input
                    name="consultationFee"
                    type="number"
                    min="0"
                    value={form.consultationFee}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Enter fee"
                  />
                </label>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-slate-700">Consultation modes</p>
                <div className="flex flex-wrap gap-3">
                  {['online', 'offline'].map((mode) => {
                    const active = form.consultationModes.includes(mode);

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleConsultationModeToggle(mode)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? 'bg-brand-600 text-white shadow-soft'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
                        }`}
                      >
                        {mode === 'online' ? 'Online' : 'Offline'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Bio</span>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  className={`${inputClassName} min-h-[140px] resize-y`}
                  placeholder="Add a short doctor bio"
                />
              </label>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-brand-600 px-5 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Saving profile...' : 'Save Changes'}
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3.5 font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
