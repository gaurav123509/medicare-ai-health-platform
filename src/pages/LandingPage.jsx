import { Link } from 'react-router-dom';

const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: 'Services', href: '#services' },
];

const serviceCards = [
  {
    tag: 'AI assistant',
    title: 'Symptom Checker',
    copy: 'Users can describe symptoms, get a structured triage response, and move into the next best care action.',
  },
  {
    tag: 'Clinical workflow',
    title: 'Report Analysis',
    copy: 'Upload medical reports and transform them into OCR-backed, AI-guided summaries that are easier to understand.',
  },
  {
    tag: 'Consultation',
    title: 'Doctors & Appointments',
    copy: 'Browse doctors, see consultation fees, book appointments, pay, and join the online consultation room.',
  },
  {
    tag: 'Medicine layer',
    title: 'Medicine Intelligence',
    copy: 'Verify medicines, compare prices across providers, and build reminders from the same product flow.',
  },
  {
    tag: 'Daily care',
    title: 'Reminder System',
    copy: 'Create medicine reminders with dosage and timing details so follow-up care is not lost after the consult.',
  },
  {
    tag: 'Emergency',
    title: 'SOS Support',
    copy: 'Keep emergency escalation visible and fast, instead of hiding it deep inside the product.',
  },
];

const LandingPage = ({ isAuthenticated }) => {
  const primaryAction = isAuthenticated
    ? { label: 'Open Dashboard', to: '/dashboard' }
    : { label: 'Get Started', to: '/signup' };

  return (
    <div className="landing-shell relative isolate min-h-screen overflow-hidden text-slate-900">
      <div className="landing-glow landing-glow-left" />
      <div className="landing-glow landing-glow-right" />
      <div className="landing-grid-overlay" />
      <div className="landing-curve landing-curve-left" />
      <div className="landing-curve landing-curve-right" />

      <header className="relative z-40 px-4 pt-6 lg:px-6 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="landing-header-pill flex items-center justify-between gap-4 rounded-full px-4 py-3 shadow-soft sm:px-5 lg:px-7">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-slateblue font-heading text-lg font-extrabold text-white">
                M
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-lg font-extrabold text-slate-950">MediCare AI</p>
                <p className="truncate text-[10px] uppercase tracking-[0.28em] text-brand-700">
                  Telemedicine Platform
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 xl:flex">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="transition hover:text-slate-950">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="hidden rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
                >
                  Login
                </Link>
              )}
              <Link
                to={primaryAction.to}
                className="inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                {primaryAction.label}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section id="overview" className="mx-auto max-w-7xl px-4 pb-14 pt-10 lg:px-6 lg:pb-24 lg:pt-14">
          <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative space-y-8">
              <div className="animate-rise inline-flex rounded-full border border-brand-200 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-brand-700 shadow-soft">
                Connected care, designed for trust
              </div>

              <div className="space-y-6">
                <h1
                  className="animate-rise font-heading text-5xl font-extrabold leading-[0.95] text-slate-950 md:text-6xl xl:text-7xl"
                  style={{ animationDelay: '90ms' }}
                >
                  Modern telemedicine
                  <span className="mt-2 block text-slateblue">with AI guidance,</span>
                  <span className="mt-2 block text-slate-950/82">doctor booking, and medicine support.</span>
                </h1>

                <p
                  className="animate-rise max-w-2xl text-lg leading-8 text-slate-600 md:text-xl"
                  style={{ animationDelay: '180ms' }}
                >
                  MediCare AI brings symptom analysis, report understanding, medicine intelligence, reminders, SOS,
                  and online consultations into one professional healthcare experience.
                </p>
              </div>

              <div className="animate-rise flex flex-col gap-4 sm:flex-row" style={{ animationDelay: '280ms' }}>
                <Link
                  to={primaryAction.to}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  {primaryAction.label}
                </Link>

                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-7 py-3.5 text-base font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    Sign In
                  </Link>
                )}
              </div>

            </div>

            <div className="relative">
              <div className="landing-hero-stage animate-rise" style={{ animationDelay: '140ms' }}>
                <div className="landing-hero-arc landing-hero-arc-one" />
                <div className="landing-hero-arc landing-hero-arc-two" />

                <div className="landing-hero-photo-shell">
                  <div className="landing-hero-photo" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-10">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="rounded-[34px] border border-white/70 bg-white/74 px-4 py-5 shadow-soft backdrop-blur-xl sm:px-6">
              <div className="landing-marquee">
                <div className="landing-marquee-track">
                  {['AI triage guidance', 'Secure authentication', 'Doctor fee visibility', 'Medicine price compare', 'Reminder management', 'SOS support'].map((item, index) => (
                    <div key={`${item}-${index}`} className="landing-marquee-item">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                      {item}
                    </div>
                  ))}
                  {['AI triage guidance', 'Secure authentication', 'Doctor fee visibility', 'Medicine price compare', 'Reminder management', 'SOS support'].map((item, index) => (
                    <div key={`${item}-repeat-${index}`} className="landing-marquee-item">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-brand-100 bg-white/85 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-brand-700 shadow-soft">
              Best premium quality healthcare workflows
            </div>
            <h2 className="mt-5 font-heading text-4xl font-extrabold text-slate-950 md:text-5xl">
              A polished landing page for a platform that actually does real healthcare work.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Every section below maps to the real product modules already present in the app, so the landing page
              looks premium without feeling fake or generic.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {serviceCards.map((card, index) => (
              <article
                key={card.title}
                className={`group rounded-[32px] border border-white/75 p-6 shadow-soft transition duration-300 hover:-translate-y-1 ${
                  index === 0 ? 'bg-slateblue text-white xl:col-span-2' : 'bg-white/86 text-slate-950'
                }`}
              >
                <p className={`text-xs uppercase tracking-[0.24em] ${index === 0 ? 'text-brand-100' : 'text-brand-700'}`}>
                  {card.tag}
                </p>
                <h3 className="mt-4 font-heading text-3xl font-extrabold leading-tight">{card.title}</h3>
                <p className={`mt-4 leading-8 ${index === 0 ? 'text-white/80' : 'text-slate-600'}`}>{card.copy}</p>
                <div className={`mt-6 h-1.5 w-20 rounded-full transition duration-300 group-hover:w-28 ${index === 0 ? 'bg-white/70' : 'bg-brand-400'}`} />
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
