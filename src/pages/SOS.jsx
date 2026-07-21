import { useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { emergencyApi, getApiError } from '../services/api';

const requestCurrentPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Geolocation is not available in this browser.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });
});

const getGeolocationErrorMessage = (error, fallbackMessage) => {
  if (error?.code === 1) {
    return 'Location permission denied. SOS bhejne ke liye live location allow kariye.';
  }

  if (error?.code === 2) {
    return 'Current location detect nahi ho pai. Thoda open area me jaake dobara try kariye.';
  }

  if (error?.code === 3) {
    return 'Location request timeout ho gaya. Internet ya GPS on karke dobara try kariye.';
  }

  return fallbackMessage;
};

const buildMapLink = (latitude, longitude) => {
  if (!latitude || !longitude) {
    return '';
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

const SOS = () => {
  const [form, setForm] = useState({
    emergencyType: 'medical emergency',
    message: '',
    symptoms: '',
    contactsNotified: '',
    address: '',
    contactNumber: '',
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const hasLiveCoordinates = Boolean(form.latitude && form.longitude);
  const currentLocationLink = buildMapLink(form.latitude, form.longitude);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const captureCurrentLocation = async ({
    forceRefresh = false,
    fallbackMessage = 'Unable to retrieve your current location.',
  } = {}) => {
    if (hasLiveCoordinates && !forceRefresh) {
      return {
        latitude: form.latitude,
        longitude: form.longitude,
      };
    }

    setLocating(true);
    setError('');

    try {
      const position = await requestCurrentPosition();
      const nextLocation = {
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6),
      };

      setForm((current) => ({
        ...current,
        ...nextLocation,
      }));

      return nextLocation;
    } catch (geolocationError) {
      setError(getGeolocationErrorMessage(geolocationError, fallbackMessage));
      return null;
    } finally {
      setLocating(false);
    }
  };

  const useCurrentLocation = async () => {
    await captureCurrentLocation({
      forceRefresh: true,
      fallbackMessage: 'Unable to retrieve your current location.',
    });
  };

  const handleTriggerSOS = async (event) => {
    event.preventDefault();
    setResult(null);
    setError('');

    const liveLocation = await captureCurrentLocation({
      forceRefresh: true,
      fallbackMessage: 'SOS bhejne se pehle live location allow kariye taaki nearest hospital aur police station ko location ke saath alert queue kiya ja sake.',
    });

    if (!liveLocation) {
      return;
    }

    setLoading(true);

    try {
      const data = await emergencyApi.trigger({
        emergencyType: form.emergencyType,
        message: form.message,
        symptoms: form.symptoms,
        contactsNotified: form.contactsNotified,
        address: form.address,
        contactNumber: form.contactNumber,
        latitude: liveLocation.latitude || form.latitude || undefined,
        longitude: liveLocation.longitude || form.longitude || undefined,
      });

      setResult(data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card
          title="Emergency SOS"
          subtitle="Send a priority emergency request with key context, symptoms, and location details."
          className="border-rose-100"
        >
          <form className="space-y-4" onSubmit={handleTriggerSOS}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Emergency type
              </span>
              <select
                name="emergencyType"
                value={form.emergencyType}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
              >
                <option value="medical emergency">Medical emergency</option>
                <option value="accident">Accident</option>
                <option value="breathing issue">Breathing issue</option>
                <option value="severe pain">Severe pain</option>
                <option value="other">Other urgent issue</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Emergency message
              </span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows="3"
                placeholder="Describe what is happening right now."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Symptoms
                </span>
                <textarea
                  name="symptoms"
                  value={form.symptoms}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Example: chest pain, dizziness"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Contacts notified
                </span>
                <textarea
                  name="contactsNotified"
                  value={form.contactsNotified}
                  onChange={handleChange}
                  rows="3"
                  placeholder="+91..., +91..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Address or location note
                </span>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                  placeholder="House no, area, city"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Contact number
                </span>
                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                  placeholder="+91..."
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Latitude
                  </span>
                  <input
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Longitude
                  </span>
                  <input
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                  />
                </label>
              </div>
            </div>

            {hasLiveCoordinates && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p className="font-semibold">Live location captured</p>
                <p className="mt-1">
                  {form.latitude}, {form.longitude}
                </p>
                {currentLocationLink && (
                  <a
                    href={currentLocationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4"
                  >
                    Open live map
                  </a>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating || loading}
              className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {locating ? 'Fetching location...' : 'Refresh Live Location'}
            </button>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || locating}
              className="w-full rounded-[24px] bg-rose-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading || locating ? 'Sharing live location and sending SOS...' : 'Trigger SOS With Live Location'}
            </button>

            <p className="text-sm leading-6 text-slate-500">
              Trigger SOS par browser aapse live location permission maangega, phir system nearest hospital aur police support ke liye alert queue prepare karega.
            </p>
          </form>
        </Card>

        <Card
          title="Emergency Response Output"
          subtitle="Priority score, next actions, and escalation guidance."
        >
          {loading && <Loader label="Recording emergency request..." />}

          {!result && !loading && (
            <div className="rounded-3xl border border-dashed border-rose-200 bg-rose-50 px-6 py-12 text-center text-rose-700">
              Use the emergency form to generate a priority response plan here.
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-rose-700">
                    Priority
                  </p>
                  <p className="mt-2 font-semibold capitalize text-slate-900">
                    {result.assessment?.priority}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Priority Score
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {result.assessment?.priorityScore}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Emergency Type
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {result.emergency?.emergencyType}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">
                    Live Location
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {result.assessment?.shareableLocation || 'Location captured'}
                  </p>
                </div>
              </div>

              {(result.assessment?.responderAlerts || []).length > 0 && (
                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Responder Alerts
                    </p>
                    <p className="text-sm leading-6 text-slate-700">
                      {result.assessment?.responderSummary}
                    </p>
                    {result.assessment?.locationMapLink && (
                      <a
                        href={result.assessment.locationMapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit text-sm font-semibold text-rose-700 underline decoration-rose-300 underline-offset-4"
                      >
                        Open shared live location
                      </a>
                    )}
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {(result.assessment?.responderAlerts || []).map((alert) => (
                      <div key={alert.responderId} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              {alert.responderTypeLabel}
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {alert.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {alert.city}
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
                            {alert.status}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                          {alert.phone && <p>Phone: {alert.phone}</p>}
                          {alert.address && <p>Address: {alert.address}</p>}
                          <p>Distance: {alert.distanceLabel}</p>
                          <p>{alert.queueNote}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {alert.callLink && (
                            <a
                              href={alert.callLink}
                              className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                              Call Now
                            </a>
                          )}
                          {alert.smsLink && (
                            <a
                              href={alert.smsLink}
                              className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              SMS Alert
                            </a>
                          )}
                          {(alert.responderMapLink || alert.locationMapLink) && (
                            <a
                              href={alert.responderMapLink || alert.locationMapLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Open Map
                            </a>
                          )}
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
                          {alert.alertMessage}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Immediate Actions
                </p>
                <ul className="mt-3 space-y-2">
                  {(result.assessment?.immediateActions || []).map((item) => (
                    <li key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Escalation Advice
                </p>
                <p className="mt-3 leading-7 text-slate-700">
                  {result.assessment?.escalationAdvice}
                </p>
              </div>

              {(result.assessment?.contactsNotified || []).length > 0 && (
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Contacts Notified
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(result.assessment?.contactsNotified || []).map((contact) => (
                      <span
                        key={contact}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
                      >
                        {contact}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default SOS;
