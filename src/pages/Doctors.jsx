import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import DoctorCard from '../components/DoctorCard';
import doctors from '../services/doctorsData';

const Doctors = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');

  const filteredDoctors = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesSearch = !searchValue
        || doctor.name.toLowerCase().includes(searchValue)
        || doctor.specialization.toLowerCase().includes(searchValue);
      const matchesMode = modeFilter === 'all'
        || doctor.mode === modeFilter
        || (modeFilter === 'online' && doctor.mode === 'both')
        || (modeFilter === 'offline' && doctor.mode === 'both');

      return matchesSearch && matchesMode;
    });
  }, [modeFilter, search]);

  const handleBook = (doctor) => {
    navigate(`/appointment?doctor=${doctor.id}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            Specialist Directory
          </span>
          <div>
            <h1 className="font-heading text-4xl font-extrabold text-slate-900">
              Choose the right doctor for your next consultation.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Browse specialist profiles, compare consultation fees, review care modes, and move straight into appointment booking with a single click.
            </p>
          </div>
        </div>

        <Card title="Refine your search" subtitle="Narrow the list by specialty or consultation mode.">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Search by doctor or specialization
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Search doctors"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Consultation Mode
              </span>
              <select
                value={modeFilter}
                onChange={(event) => setModeFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="both">Both</option>
              </select>
            </label>

            <div className="flex items-end">
              <div className="w-full rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Doctors shown
                </p>
                <p className="mt-1 font-heading text-2xl font-extrabold text-slate-900">
                  {filteredDoctors.length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredDoctors.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} onBook={handleBook} />
        ))}
      </section>

      {filteredDoctors.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500">
            No doctors match your current filters. Try changing the search or consultation mode.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Doctors;
