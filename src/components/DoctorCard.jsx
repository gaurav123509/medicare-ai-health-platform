const modeLabelMap = {
  online: 'Online',
  offline: 'Offline',
  both: 'Online + Offline',
};

const DoctorCard = ({ doctor, onBook }) => {
  return (
    <article className="glass-card overflow-hidden rounded-[28px] border border-white/70 shadow-soft transition duration-200 hover:-translate-y-1">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-brand-100 to-white">
        <img
          src={doctor.image}
          alt={doctor.name}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
          {modeLabelMap[doctor.mode]}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="font-heading text-xl font-extrabold text-slate-900">
            {doctor.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {doctor.specialization}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Experience
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {doctor.experience} years
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Rating
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {doctor.rating} / 5
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Consultation Fee
            </p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-brand-700">
              Rs. {doctor.consultationFee}
            </p>
          </div>

          {typeof onBook === 'function' && (
            <button
              type="button"
              onClick={() => onBook(doctor)}
              className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Book Appointment
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default DoctorCard;
