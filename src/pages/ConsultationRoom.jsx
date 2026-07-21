import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { appointmentApi, getApiError } from '../services/api';

const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString();
};

const ConsultationRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinDetails, setJoinDetails] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadJoinDetails = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await appointmentApi.join(id);
        if (isMounted) {
          setJoinDetails(data.joinDetails);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getApiError(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadJoinDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const availabilityState = useMemo(() => {
    if (!joinDetails) {
      return {
        title: '',
        message: '',
      };
    }

    const now = Date.now();
    const availableFrom = new Date(joinDetails.availableFrom).getTime();
    const availableUntil = new Date(joinDetails.availableUntil).getTime();

    if (joinDetails.canJoinNow) {
      return {
        title: 'Consultation live now',
        message: 'Doctor is available right now. You can continue inside the consultation room.',
      };
    }

    if (now < availableFrom) {
      return {
        title: 'Doctor not available right now',
        message: `This consultation will open at ${formatDateTime(joinDetails.availableFrom)}. Please join at the booked time.`,
      };
    }

    return {
      title: 'Doctor not available right now',
      message: `This consultation window closed at ${formatDateTime(joinDetails.availableUntil)}. Please book or reschedule if needed.`,
    };
  }, [joinDetails]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-5xl items-center justify-center px-4 py-10 lg:px-6">
        <Loader label="Preparing your consultation room..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
        <Card title="Consultation Room" subtitle="We could not open this consultation right now.">
          <div className="space-y-5">
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
              {error}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/appointment')}
                className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Back to Appointments
              </button>
              <Link
                to="/dashboard"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card
          title="Consultation Room"
          subtitle="Booking-time controlled access for online doctor meetings."
        >
          <div className="space-y-5">
            <div className={`rounded-3xl px-5 py-4 ${joinDetails?.canJoinNow ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <p className="text-xs uppercase tracking-[0.18em]">
                Access Status
              </p>
              <p className="mt-2 font-heading text-2xl font-extrabold">
                {availabilityState.title}
              </p>
              <p className="mt-3 text-sm leading-7">
                {availabilityState.message}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Doctor
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {joinDetails?.doctorName}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Specialty
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {joinDetails?.specialty}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Appointment Time
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {formatDateTime(joinDetails?.appointmentDate)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Available Until
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {formatDateTime(joinDetails?.availableUntil)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/appointment')}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                Back to Appointments
              </button>

              {joinDetails?.canJoinNow && joinDetails?.meetingLink && (
                <a
                  href={joinDetails.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Open in New Tab
                </a>
              )}
            </div>
          </div>
        </Card>

        <Card
          title={joinDetails?.canJoinNow ? 'Live Meeting' : 'Doctor Not Available'}
          subtitle={joinDetails?.canJoinNow ? 'Your consultation room is open.' : 'The meeting room stays locked outside the booked slot.'}
        >
          {joinDetails?.canJoinNow && joinDetails?.meetingLink ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-soft">
                <iframe
                  src={joinDetails.meetingLink}
                  title="Consultation Meeting"
                  className="h-[68vh] w-full border-0 bg-slate-950"
                  allow="camera; microphone; fullscreen; display-capture; clipboard-read; clipboard-write"
                />
              </div>
              <p className="text-sm leading-7 text-slate-500">
                If the embedded room does not load well on your browser, use the "Open in New Tab" button.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <div className="max-w-xl space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
                  !
                </div>
                <h2 className="font-heading text-3xl font-extrabold text-slate-900">
                  Doctor not available
                </h2>
                <p className="text-base leading-8 text-slate-600">
                  This room opens only during the booked consultation slot. Please return at the scheduled time or book another appointment.
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default ConsultationRoom;
