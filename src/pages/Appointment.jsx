import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import DoctorCard from '../components/DoctorCard';
import Loader from '../components/Loader';
import { appointmentApi, getApiError } from '../services/api';
import doctors from '../services/doctorsData';

const DEMO_PAYMENT_METHODS = [
  { value: 'demo_upi', label: 'UPI' },
  { value: 'demo_card', label: 'Card' },
  { value: 'demo_wallet', label: 'Wallet' },
];

const PAYMENT_BADGE_STYLES = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-rose-50 text-rose-700',
  refunded: 'bg-slate-100 text-slate-700',
};

const getModeChoices = (doctor) => {
  if (!doctor) {
    return ['online'];
  }

  if (doctor.mode === 'both') {
    return ['online', 'offline'];
  }

  return [doctor.mode];
};

const slugify = (value) => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
};

const buildMeetingLink = (doctor, appointmentDate) => {
  const roomId = `medicare-${slugify(doctor.name)}-${appointmentDate
    .replace(/[^0-9]/g, '')
    .slice(0, 12)}`;

  return `https://meet.jit.si/${roomId}`;
};

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;

const getPaymentLabel = (status = 'pending') => {
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
};

const Appointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = Number(searchParams.get('doctor'));

  const initialDoctor = doctors.find((doctor) => doctor.id === preselectedDoctorId) || doctors[0];

  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctor.id);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [mode, setMode] = useState(initialDoctor.mode === 'offline' ? 'offline' : 'online');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentPreference, setPaymentPreference] = useState('pay_now_demo');
  const [paymentMethod, setPaymentMethod] = useState('demo_upi');
  const [loading, setLoading] = useState(false);
  const [payingAppointmentId, setPayingAppointmentId] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [latestBooking, setLatestBooking] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId) || doctors[0],
    [selectedDoctorId],
  );

  const modeChoices = useMemo(() => getModeChoices(selectedDoctor), [selectedDoctor]);

  useEffect(() => {
    if (preselectedDoctorId) {
      const matchingDoctor = doctors.find((doctor) => doctor.id === preselectedDoctorId);
      if (matchingDoctor) {
        setSelectedDoctorId(matchingDoctor.id);
      }
    }
  }, [preselectedDoctorId]);

  useEffect(() => {
    if (!modeChoices.includes(mode)) {
      setMode(modeChoices[0]);
    }
  }, [modeChoices, mode]);

  const loadAppointments = async () => {
    setListLoading(true);
    try {
      const data = await appointmentApi.list();
      setAppointments(data.appointments || []);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const syncAppointmentInState = (nextAppointment) => {
    setAppointments((current) => current.map((item) => (
      item._id === nextAppointment._id ? nextAppointment : item
    )));
    setLatestBooking((current) => {
      if (!current || current._id !== nextAppointment._id) {
        return current;
      }

      return nextAppointment;
    });
  };

  const handleDemoPayment = async ({ appointmentId, amount }) => {
    setError('');
    setSuccess('');
    setPayingAppointmentId(appointmentId);

    try {
      const data = await appointmentApi.payDemo(appointmentId, {
        amount,
        paymentMethod,
      });

      syncAppointmentInState(data.appointment);
      setSuccess(`Payment completed successfully via ${DEMO_PAYMENT_METHODS.find((item) => item.value === paymentMethod)?.label || 'UPI'}.`);
      await loadAppointments();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setPayingAppointmentId('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!date || !time) {
        throw new Error('Please choose both appointment date and time.');
      }

      const appointmentDate = new Date(`${date}T${time}:00`);
      const modeValue = mode || modeChoices[0];
      const meetingLink = modeValue === 'online'
        ? buildMeetingLink(selectedDoctor, appointmentDate.toISOString())
        : '';

      const payload = {
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialization,
        hospitalName: `${selectedDoctor.specialization} Care Unit`,
        appointmentDate: appointmentDate.toISOString(),
        mode: modeValue,
        symptoms,
        notes,
        meetingLink,
        fee: selectedDoctor.consultationFee,
      };

      const data = await appointmentApi.book(payload);
      let nextAppointment = data.appointment;

      if (paymentPreference === 'pay_now_demo' && nextAppointment?.fee > 0) {
        const paymentData = await appointmentApi.payDemo(nextAppointment._id, {
          amount: nextAppointment.fee,
          paymentMethod,
        });

        nextAppointment = paymentData.appointment;
        setSuccess('Appointment booked and payment completed successfully.');
      } else {
        setSuccess('Appointment booked successfully. You can complete payment anytime from this page.');
      }

      setLatestBooking(nextAppointment);
      setDate('');
      setTime('10:00');
      setSymptoms('');
      setNotes('');
      setPaymentPreference('pay_now_demo');
      setPaymentMethod('demo_upi');
      await loadAppointments();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const openConsultationRoom = (appointmentId) => {
    if (!appointmentId) {
      return;
    }

    navigate(`/appointment/${appointmentId}/consultation`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card
          title="Book Appointment"
          subtitle="Select a specialist, choose a time, and create your consultation booking."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Select doctor
              </span>
              <select
                value={selectedDoctorId}
                onChange={(event) => setSelectedDoctorId(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              >
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} | {doctor.specialization}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Consultation mode
                </span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                >
                  {modeChoices.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Time
                </span>
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Symptoms
              </span>
              <textarea
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                rows="3"
                placeholder="Example: body ache, fever, fatigue"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows="3"
                placeholder="Share consultation context or special concerns."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Specialist
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {selectedDoctor.specialization}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Rating
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {selectedDoctor.rating} / 5
                </p>
              </div>
              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-700">
                  Fee
                </p>
                <p className="mt-2 font-heading text-2xl font-extrabold text-brand-700">
                  Rs. {selectedDoctor.consultationFee}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-700">
                    Payment Preference
                  </p>
                  <div className="mt-3 grid gap-3">
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/70 bg-white px-4 py-3">
                      <input
                        type="radio"
                        name="paymentPreference"
                        value="pay_now_demo"
                        checked={paymentPreference === 'pay_now_demo'}
                        onChange={(event) => setPaymentPreference(event.target.value)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold text-slate-900">Pay now</span>
                        <span className="mt-1 block text-sm text-slate-500">
                          Complete the consultation payment during booking.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/70 bg-white px-4 py-3">
                      <input
                        type="radio"
                        name="paymentPreference"
                        value="pay_later"
                        checked={paymentPreference === 'pay_later'}
                        onChange={(event) => setPaymentPreference(event.target.value)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold text-slate-900">Book first, pay later</span>
                        <span className="mt-1 block text-sm text-slate-500">
                          Save the appointment now and complete payment later from booking history.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Payment method
                    </span>
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    >
                      {DEMO_PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Payable now
                    </p>
                    <p className="mt-2 font-heading text-2xl font-extrabold text-slate-900">
                      {formatCurrency(selectedDoctor.consultationFee)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {paymentPreference === 'pay_now_demo'
                        ? 'Payment will be completed automatically after booking.'
                        : 'Payment will stay pending until you use the pay button.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-600 px-4 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? (paymentPreference === 'pay_now_demo' ? 'Booking and processing payment...' : 'Booking appointment...')
                : (paymentPreference === 'pay_now_demo' ? 'Book Appointment and Pay Now' : 'Book Appointment')}
            </button>
          </form>
        </Card>

        <div className="space-y-6">
          <DoctorCard doctor={selectedDoctor} />

          <Card
            title="Latest Booking"
            subtitle="Use the meeting link for online consultations."
          >
            {!latestBooking ? (
              <p className="text-sm text-slate-500">
                Your most recent booking will appear here after a successful appointment request.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Doctor
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {latestBooking.doctorName}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Appointment Time
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {new Date(latestBooking.appointmentDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Payment Status
                    </p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_BADGE_STYLES[latestBooking.paymentStatus] || PAYMENT_BADGE_STYLES.pending}`}>
                      {getPaymentLabel(latestBooking.paymentStatus)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {latestBooking.paymentStatus === 'paid'
                      ? `${formatCurrency(latestBooking.paymentAmount || latestBooking.fee)} received`
                      : `Pending payment of ${formatCurrency(latestBooking.fee)}`}
                  </p>
                  {latestBooking.paymentReference && (
                    <p className="mt-2 break-all text-xs uppercase tracking-[0.18em] text-slate-400">
                      Ref: {latestBooking.paymentReference}
                    </p>
                  )}
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Meeting Link
                  </p>
                  <p className="mt-3 break-all text-sm leading-7 text-slate-700">
                    {latestBooking.meetingLink || 'Offline consultation selected.'}
                  </p>
                </div>

                {latestBooking.paymentStatus !== 'paid' && latestBooking.fee > 0 && (
                  <button
                    type="button"
                    onClick={() => handleDemoPayment({
                      appointmentId: latestBooking._id,
                      amount: latestBooking.fee,
                    })}
                    disabled={payingAppointmentId === latestBooking._id}
                    className="w-full rounded-2xl border border-brand-200 bg-white px-4 py-3.5 font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {payingAppointmentId === latestBooking._id ? 'Processing payment...' : 'Pay Now'}
                  </button>
                )}

                {latestBooking.meetingLink && (
                  <button
                    type="button"
                    onClick={() => openConsultationRoom(latestBooking._id)}
                    className="w-full rounded-2xl bg-brand-600 px-4 py-3.5 font-semibold text-white transition hover:bg-brand-700"
                  >
                    Open Consultation Room
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      </section>

      <Card title="Appointment History" subtitle="Review your saved consultation bookings and re-open meeting links.">
        {listLoading ? (
          <Loader label="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No appointments have been booked yet.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="rounded-3xl bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{appointment.doctorName}</p>
                    <p className="mt-1 text-sm text-slate-500">{appointment.specialty}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    {appointment.mode}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Appointment
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {new Date(appointment.appointmentDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Fee
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {formatCurrency(appointment.fee)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Payment
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_BADGE_STYLES[appointment.paymentStatus] || PAYMENT_BADGE_STYLES.pending}`}>
                        {getPaymentLabel(appointment.paymentStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                {appointment.paymentReference && (
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-400">
                    Payment Ref: {appointment.paymentReference}
                  </p>
                )}

                {appointment.paymentStatus !== 'paid' && appointment.fee > 0 && appointment.status === 'booked' && (
                  <button
                    type="button"
                    onClick={() => handleDemoPayment({
                      appointmentId: appointment._id,
                      amount: appointment.fee,
                    })}
                    disabled={payingAppointmentId === appointment._id}
                    className="mt-4 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {payingAppointmentId === appointment._id ? 'Processing payment...' : 'Pay for Booking'}
                  </button>
                )}

                {appointment.meetingLink && (
                  <button
                    type="button"
                    onClick={() => openConsultationRoom(appointment._id)}
                    className="mt-4 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Open Consultation Room
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Appointment;
