import { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { getApiError, reminderApi } from '../services/api';

const weekDays = [
  { label: 'Sun', value: '0' },
  { label: 'Mon', value: '1' },
  { label: 'Tue', value: '2' },
  { label: 'Wed', value: '3' },
  { label: 'Thu', value: '4' },
  { label: 'Fri', value: '5' },
  { label: 'Sat', value: '6' },
];

const emptyForm = {
  medicineName: '',
  dosage: '',
  instructions: '',
  scheduleType: 'daily',
  startDate: '',
  endDate: '',
  notes: '',
};

const Reminder = () => {
  const [form, setForm] = useState(emptyForm);
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState(['08:00']);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reminders, setReminders] = useState([]);

  const scheduleDescription = useMemo(() => {
    if (form.scheduleType === 'daily') {
      return 'Daily reminders run for every selected time.';
    }

    if (form.scheduleType === 'weekly') {
      return 'Weekly reminders use your selected days of the week.';
    }

    return 'Custom reminders can also use the selected days below.';
  }, [form.scheduleType]);

  const loadReminders = async () => {
    setListLoading(true);

    try {
      const data = await reminderApi.list();
      setReminders(data.reminders || []);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateTimeSlot = (index, value) => {
    setTimeSlots((current) =>
      current.map((time, timeIndex) => (timeIndex === index ? value : time)),
    );
  };

  const addTimeSlot = () => {
    setTimeSlots((current) => [...current, '12:00']);
  };

  const removeTimeSlot = (index) => {
    setTimeSlots((current) => current.filter((_, timeIndex) => timeIndex !== index));
  };

  const toggleDay = (value) => {
    setSelectedDays((current) =>
      current.includes(value)
        ? current.filter((day) => day !== value)
        : [...current, value],
    );
  };

  const handleCreateReminder = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await reminderApi.create({
        ...form,
        times: timeSlots.filter(Boolean),
        daysOfWeek: selectedDays,
      });

      setSuccess('Reminder created successfully.');
      setForm(emptyForm);
      setSelectedDays([]);
      setTimeSlots(['08:00']);
      await loadReminders();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    setError('');

    try {
      await reminderApi.remove(reminderId);
      setReminders((current) => current.filter((reminder) => reminder._id !== reminderId));
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card
          title="Create Reminder"
          subtitle="Set medicine schedules with dosage, time slots, and recurring days."
        >
          <form className="space-y-4" onSubmit={handleCreateReminder}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Medicine name
                </span>
                <input
                  name="medicineName"
                  value={form.medicineName}
                  onChange={handleFormChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  placeholder="Paracetamol"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Dosage
                </span>
                <input
                  name="dosage"
                  value={form.dosage}
                  onChange={handleFormChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  placeholder="1 tablet"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Instructions
              </span>
              <input
                name="instructions"
                value={form.instructions}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Take after meals"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Schedule type
                </span>
                <select
                  name="scheduleType"
                  value={form.scheduleType}
                  onChange={handleFormChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Start date
                </span>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleFormChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  End date
                </span>
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleFormChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </label>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Reminder times</p>
                  <p className="text-sm text-slate-500">Add one or more HH:MM time slots.</p>
                </div>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm"
                >
                  Add Time
                </button>
              </div>
              <div className="space-y-3">
                {timeSlots.map((time, index) => (
                  <div key={`${time}-${index}`} className="flex items-center gap-3">
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => updateTimeSlot(index, event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    />
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">Days of week</p>
              <p className="mt-1 text-sm text-slate-500">{scheduleDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {weekDays.map((day) => {
                  const selected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selected
                          ? 'bg-brand-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                rows="3"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Optional reminder note"
              />
            </label>

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
              {loading ? 'Creating reminder...' : 'Create Reminder'}
            </button>
          </form>
        </Card>

        <Card
          title="Reminder List"
          subtitle="Track upcoming schedules and remove reminders you no longer need."
        >
          {listLoading ? (
            <Loader label="Loading your reminders..." />
          ) : reminders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              No reminders created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div key={reminder._id} className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {reminder.medicineName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {reminder.dosage} | {reminder.instructions || 'No extra instruction'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(reminder._id)}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Schedule
                      </p>
                      <p className="mt-2 font-semibold capitalize text-slate-900">
                        {reminder.scheduleType}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Times
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {(reminder.times || []).join(', ')}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Next Trigger
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {reminder.nextTriggerAt
                          ? new Date(reminder.nextTriggerAt).toLocaleString()
                          : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default Reminder;
