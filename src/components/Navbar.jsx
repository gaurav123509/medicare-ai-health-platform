import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Symptom', to: '/symptom-checker' },
  { label: 'Reports', to: '/report-analysis' },
  { label: 'Medicine Price', to: '/medicine-price' },
  { label: 'Doctors', to: '/doctors' },
  { label: 'Reminder', to: '/reminder' },
  { label: 'Appointment', to: '/appointment' },
  { label: 'SOS', to: '/sos' },
];

const Navbar = ({ user, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 font-heading text-lg font-extrabold text-white shadow-soft">
              M
            </div>
            <div>
              <p className="font-heading text-lg font-extrabold text-slate-900">
                MediCare AI
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-700">
                Telemedicine Platform
              </p>
            </div>
          </Link>
          <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 lg:hidden">
            {user?.name || 'Care member'}
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Signed in as
            </p>
            <p className="font-semibold text-slate-800">
              {user?.name || 'Care member'}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="border-t border-white/70 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
