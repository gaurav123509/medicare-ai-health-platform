import { startTransition, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import {
  appointmentApi,
  getApiError,
  reminderApi,
  reportApi,
} from '../services/api';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

const dayFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
});

const fullDateFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const commandBlueprints = [
  {
    code: 'AI',
    title: 'Symptom Review',
    description: 'Refresh triage and care direction.',
    to: '/symptom-checker',
    tone: 'dark',
  },
  {
    code: 'MD',
    title: 'Consultation',
    description: 'Book or manage doctor sessions.',
    to: '/appointment',
    tone: 'light',
  },
  {
    code: 'LAB',
    title: 'Report Analysis',
    description: 'Review uploaded reports and AI summaries.',
    to: '/report-analysis',
    tone: 'light',
  },
  {
    code: 'DOC',
    title: 'Specialists',
    description: 'Browse doctor profiles and care options.',
    to: '/doctors',
    tone: 'light',
  },
  {
    code: 'RX',
    title: 'Reminder Plan',
    description: 'Keep medicine adherence on track.',
    to: '/reminder',
    tone: 'light',
  },
  {
    code: 'SOS',
    title: 'Emergency Desk',
    description: 'Open live location SOS workflow.',
    to: '/sos',
    tone: 'alert',
  },
];

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDayKey = (value) => {
  const date = normalizeDate(value);

  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  const date = normalizeDate(value);
  return date ? dateFormatter.format(date) : 'Not scheduled';
};

const formatDateTime = (value) => {
  const date = normalizeDate(value);
  return date ? dateTimeFormatter.format(date) : 'Not scheduled';
};

const formatFullDate = (value) => {
  const date = normalizeDate(value);
  return date ? fullDateFormatter.format(date) : 'No date available';
};

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const buildActivitySeries = (appointments, reminders, reports) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 6 + index);

    return {
      key: toDayKey(date),
      label: dayFormatter.format(date),
      dayLabel: dateFormatter.format(date),
      appointments: 0,
      reminders: 0,
      reports: 0,
      total: 0,
    };
  });

  const lookup = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]));

  appointments.forEach((item) => {
    const key = toDayKey(item.createdAt || item.appointmentDate);

    if (lookup[key]) {
      lookup[key].appointments += 1;
      lookup[key].total += 3;
    }
  });

  reminders.forEach((item) => {
    const key = toDayKey(item.createdAt || item.startDate);

    if (lookup[key]) {
      lookup[key].reminders += 1;
      lookup[key].total += 1;
    }
  });

  reports.forEach((item) => {
    const key = toDayKey(item.createdAt);

    if (lookup[key]) {
      lookup[key].reports += 1;
      lookup[key].total += 2;
    }
  });

  return buckets;
};

const buildModeSegments = (appointments) => {
  const counts = {
    online: 0,
    offline: 0,
  };

  appointments.forEach((item) => {
    if (item.mode === 'offline') {
      counts.offline += 1;
    } else {
      counts.online += 1;
    }
  });

  return [
    {
      label: 'Online',
      value: counts.online,
      color: '#bd5c33',
      accent: 'bg-brand-500',
    },
    {
      label: 'Offline',
      value: counts.offline,
      color: '#2f332d',
      accent: 'bg-slateblue',
    },
  ];
};

const buildReportSegments = (reports) => {
  const counts = {
    general: 0,
    blood: 0,
    scan: 0,
    prescription: 0,
  };

  reports.forEach((item) => {
    const type = String(item.reportType || 'general').toLowerCase();
    if (counts[type] !== undefined) {
      counts[type] += 1;
    } else {
      counts.general += 1;
    }
  });

  return [
    { label: 'Blood', value: counts.blood, colorClass: 'bg-rose-500' },
    { label: 'Scan', value: counts.scan, colorClass: 'bg-brand-500' },
    { label: 'Prescription', value: counts.prescription, colorClass: 'bg-slateblue' },
    { label: 'General', value: counts.general, colorClass: 'bg-amber-500' },
  ];
};

const buildReminderSegments = (reminders) => {
  const counts = {
    daily: 0,
    weekly: 0,
    custom: 0,
  };

  reminders.forEach((item) => {
    const type = String(item.scheduleType || 'daily').toLowerCase();
    if (counts[type] !== undefined) {
      counts[type] += 1;
    }
  });

  return [
    { label: 'Daily', value: counts.daily, colorClass: 'bg-brand-500' },
    { label: 'Weekly', value: counts.weekly, colorClass: 'bg-emerald-500' },
    { label: 'Custom', value: counts.custom, colorClass: 'bg-slateblue' },
  ];
};

const buildReadiness = ({
  user,
  appointments,
  upcomingAppointments,
  reminders,
  activeReminders,
  reports,
}) => {
  const items = [
    {
      label: 'Phone number on file',
      done: Boolean(user?.phone),
      hint: user?.phone || 'Add phone in profile',
    },
    {
      label: 'Blood group saved',
      done: Boolean(user?.bloodGroup),
      hint: user?.bloodGroup || 'Missing from profile',
    },
    {
      label: 'Emergency contact ready',
      done: Boolean(user?.emergencyContact?.phone),
      hint: user?.emergencyContact?.phone || 'Add emergency contact',
    },
    {
      label: 'Consultation history started',
      done: appointments.length > 0,
      hint: appointments.length > 0 ? `${appointments.length} records` : 'No appointment history yet',
    },
    {
      label: 'Reminder workflow active',
      done: activeReminders.length > 0,
      hint: activeReminders.length > 0 ? `${activeReminders.length} active reminders` : 'No active reminder plan',
    },
    {
      label: 'Report history available',
      done: reports.length > 0,
      hint: reports.length > 0 ? `${reports.length} uploaded reports` : 'No report uploads yet',
    },
    {
      label: 'Future consultation secured',
      done: upcomingAppointments.length > 0,
      hint: upcomingAppointments.length > 0 ? formatDateTime(upcomingAppointments[0].appointmentDate) : 'Nothing upcoming',
    },
    {
      label: 'Medication catalog started',
      done: reminders.length > 0,
      hint: reminders.length > 0 ? `${reminders.length} total reminders` : 'No reminder history yet',
    },
  ];

  const completed = items.filter((item) => item.done).length;
  const score = Math.round((completed / items.length) * 100);

  return {
    score,
    completed,
    total: items.length,
    items,
  };
};

const getUpcomingAppointments = (appointments) => {
  const now = Date.now();

  return appointments
    .filter((item) => {
      const appointmentDate = normalizeDate(item.appointmentDate);
      return item.status === 'booked' && appointmentDate && appointmentDate.getTime() >= now;
    })
    .sort((left, right) => new Date(left.appointmentDate) - new Date(right.appointmentDate));
};

const getNextReminder = (reminders) => {
  return reminders
    .filter((item) => item.isActive !== false)
    .map((item) => {
      const sortDate = normalizeDate(item.nextTriggerAt) || normalizeDate(item.startDate);
      return {
        ...item,
        sortDate,
      };
    })
    .filter((item) => item.sortDate)
    .sort((left, right) => left.sortDate - right.sortDate)[0] || null;
};

const getPrimaryAction = ({ user, reports, activeReminders, upcomingAppointments }) => {
  if (!user?.emergencyContact?.phone) {
    return {
      title: 'Complete emergency readiness',
      description: 'Add an emergency contact to strengthen SOS response and care continuity.',
      to: '/profile',
      actionLabel: 'Open Profile',
    };
  }

  if (upcomingAppointments.length === 0) {
    return {
      title: 'Schedule the next consultation',
      description: 'No future appointment is booked right now. Lock in the next clinical touchpoint.',
      to: '/appointment',
      actionLabel: 'Book Consultation',
    };
  }

  if (reports.length === 0) {
    return {
      title: 'Upload the first report',
      description: 'Bring lab work or prescription history into the workspace for stronger follow-up.',
      to: '/report-analysis',
      actionLabel: 'Add Report',
    };
  }

  if (activeReminders.length === 0) {
    return {
      title: 'Activate a reminder schedule',
      description: 'Turn treatment plans into a repeatable daily rhythm with medicine reminders.',
      to: '/reminder',
      actionLabel: 'Create Reminder',
    };
  }

  return {
    title: 'Refresh health triage',
    description: 'The workspace is ready. Run a fresh symptom review to update current care priority.',
    to: '/symptom-checker',
    actionLabel: 'Start Triage',
  };
};

const getReminderWindowLabel = (reminder) => {
  if (!reminder) {
    return 'No active reminder scheduled';
  }

  const timeText = Array.isArray(reminder.times) && reminder.times.length > 0
    ? reminder.times.join(', ')
    : 'Time not set';

  return `${formatDate(reminder.sortDate || reminder.startDate)} · ${timeText}`;
};

const Panel = ({
  eyebrow,
  title,
  action,
  className = '',
  dark = false,
  children,
}) => {
  return (
    <section
      className={`rounded-[30px] border p-5 shadow-soft backdrop-blur-xl md:p-6 ${
        dark
          ? 'border-[#364138] bg-[#1c2420] text-white'
          : 'border-white/70 bg-white/82 text-slate-900'
      } ${className}`}
    >
      {(eyebrow || title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow && (
              <p className={`text-xs uppercase tracking-[0.22em] ${dark ? 'text-brand-100' : 'text-brand-700'}`}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className={`mt-2 font-heading text-2xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
};

const MetricTile = ({
  label,
  value,
  detail,
  emphasis = 'light',
}) => {
  const toneClasses = {
    dark: 'border-white/10 bg-white/6 text-white',
    brand: 'border-brand-200 bg-brand-50 text-slate-900',
    light: 'border-[#ebdfd2] bg-[#fbf7f2] text-slate-900',
  };

  return (
    <div className={`rounded-[24px] border p-4 ${toneClasses[emphasis] || toneClasses.light}`}>
      <p className={`text-xs uppercase tracking-[0.18em] ${emphasis === 'dark' ? 'text-white/56' : 'text-slate-400'}`}>
        {label}
      </p>
      <p className={`mt-3 font-heading text-3xl font-extrabold leading-none ${emphasis === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className={`mt-3 text-sm leading-6 ${emphasis === 'dark' ? 'text-white/72' : 'text-slate-600'}`}>
        {detail}
      </p>
    </div>
  );
};

const ActivityChart = ({ points }) => {
  const width = 620;
  const height = 230;
  const paddingX = 26;
  const baseY = 182;
  const maxValue = Math.max(...points.map((point) => point.total), 1);
  const step = points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => ({
    ...point,
    x: paddingX + (index * step),
    y: baseY - ((point.total / maxValue) * 120),
  }));

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = coordinates.length > 0
    ? `${linePath} L ${coordinates[coordinates.length - 1].x} ${baseY} L ${coordinates[0].x} ${baseY} Z`
    : '';

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border border-[#efe5da] bg-[#fffaf4] p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[230px] w-full">
          <defs>
            <linearGradient id="dashboard-area-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#bd5c33" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#bd5c33" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((index) => {
            const y = baseY - ((index / 3) * 120);

            return (
              <line
                key={index}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#eadbcd"
                strokeDasharray="4 6"
              />
            );
          })}

          <path d={areaPath} fill="url(#dashboard-area-fill)" />
          <path d={linePath} fill="none" stroke="#bd5c33" strokeWidth="4" strokeLinecap="round" />

          {coordinates.map((point) => (
            <g key={point.key}>
              <circle cx={point.x} cy={point.y} r="5" fill="#fffaf4" stroke="#bd5c33" strokeWidth="3" />
              <text
                x={point.x}
                y={height - 20}
                textAnchor="middle"
                className="fill-slate-500 text-[12px] font-semibold"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] bg-brand-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Appointments</p>
          <p className="mt-2 font-semibold text-slate-900">
            {points.reduce((sum, point) => sum + point.appointments, 0)} activity hits
          </p>
        </div>
        <div className="rounded-[22px] bg-[#f7f1ea] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reports</p>
          <p className="mt-2 font-semibold text-slate-900">
            {points.reduce((sum, point) => sum + point.reports, 0)} analysis events
          </p>
        </div>
        <div className="rounded-[22px] bg-[#eef2ee] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slateblue">Reminders</p>
          <p className="mt-2 font-semibold text-slate-900">
            {points.reduce((sum, point) => sum + point.reminders, 0)} routine updates
          </p>
        </div>
      </div>
    </div>
  );
};

const DonutChart = ({
  segments,
  total,
  centerLabel,
  centerValue,
}) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="18"
          />

          {segments.map((segment) => {
            const segmentLength = total > 0
              ? (segment.value / total) * circumference
              : 0;
            const circle = (
              <circle
                key={segment.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="18"
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-runningOffset}
                strokeLinecap="round"
              />
            );

            runningOffset += segmentLength;
            return circle;
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-white/56">{centerLabel}</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-white">{centerValue}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {segments.map((segment) => {
          const ratio = total > 0 ? Math.round((segment.value / total) * 100) : 0;

          return (
            <div key={segment.label} className="rounded-[20px] border border-white/10 bg-white/6 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <p className="text-sm font-semibold text-white">{segment.label}</p>
                </div>
                <p className="text-sm text-white/72">
                  {segment.value} <span className="text-white/40">({ratio}%)</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProgressList = ({
  items,
  emptyLabel,
}) => {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  if (items.every((item) => item.value === 0)) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#eadfd3] bg-[#fbf7f2] px-4 py-8 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="text-sm text-slate-500">{item.value}</p>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-[#efe5da]">
            <div
              className={`h-2.5 rounded-full ${item.colorClass}`}
              style={{
                width: item.value === 0
                  ? '0%'
                  : `${Math.max(8, (item.value / maxValue) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = ({ user }) => {
  const [dashboardState, setDashboardState] = useState({
    loading: true,
    error: '',
    appointments: [],
    reminders: [],
    reports: [],
  });

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const results = await Promise.allSettled([
        appointmentApi.list(),
        reminderApi.list(),
        reportApi.history(),
      ]);

      if (!isMounted) {
        return;
      }

      const appointmentResult = results[0];
      const reminderResult = results[1];
      const reportResult = results[2];

      const appointments = appointmentResult.status === 'fulfilled'
        ? appointmentResult.value.appointments || []
        : [];
      const reminders = reminderResult.status === 'fulfilled'
        ? reminderResult.value.reminders || []
        : [];
      const reports = reportResult.status === 'fulfilled'
        ? reportResult.value.reports || []
        : [];

      const errors = results
        .filter((result) => result.status === 'rejected')
        .map((result) => getApiError(result.reason))
        .filter(Boolean);

      startTransition(() => {
        setDashboardState({
          loading: false,
          error: errors.length > 0 ? 'Some dashboard analytics could not be synced. Showing the sections that loaded successfully.' : '',
          appointments,
          reminders,
          reports,
        });
      });
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const { loading, error, appointments, reminders, reports } = dashboardState;
  const firstName = user?.name?.trim()?.split(' ')?.[0] || 'Care member';
  const upcomingAppointments = getUpcomingAppointments(appointments);
  const nextAppointment = upcomingAppointments[0] || null;
  const activeReminders = reminders.filter((item) => item.isActive !== false);
  const nextReminder = getNextReminder(reminders);
  const latestReport = reports
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] || null;
  const readiness = buildReadiness({
    user,
    appointments,
    upcomingAppointments,
    reminders,
    activeReminders,
    reports,
  });
  const activitySeries = buildActivitySeries(appointments, reminders, reports);
  const modeSegments = buildModeSegments(appointments);
  const modeTotal = modeSegments.reduce((sum, item) => sum + item.value, 0);
  const reportSegments = buildReportSegments(reports);
  const reminderSegments = buildReminderSegments(reminders);
  const primaryAction = getPrimaryAction({
    user,
    reports,
    activeReminders,
    upcomingAppointments,
  });
  const commandCards = commandBlueprints.map((item) => {
    if (item.to === '/symptom-checker') {
      return {
        ...item,
        value: `${activitySeries.reduce((sum, point) => sum + point.total, 0)}`,
        meta: 'weekly activity score',
      };
    }

    if (item.to === '/appointment') {
      return {
        ...item,
        value: `${upcomingAppointments.length}`,
        meta: upcomingAppointments.length > 0 ? 'upcoming' : 'no bookings',
      };
    }

    if (item.to === '/report-analysis') {
      return {
        ...item,
        value: `${reports.length}`,
        meta: reports.length > 0 ? 'health records' : 'start flow',
      };
    }

    if (item.to === '/doctors') {
      return {
        ...item,
        value: 'Browse',
        meta: 'specialists',
      };
    }

    if (item.to === '/reminder') {
      return {
        ...item,
        value: `${activeReminders.length}`,
        meta: activeReminders.length > 0 ? 'active plans' : 'inactive',
      };
    }

    if (item.to === '/sos') {
      return {
        ...item,
        value: user?.emergencyContact?.phone ? 'Ready' : 'Setup',
        meta: user?.emergencyContact?.phone ? 'emergency linked' : 'contact missing',
      };
    }

    return item;
  });

  const totalPendingPayments = appointments.filter((item) => item.paymentStatus === 'pending').length;
  const completedAppointments = appointments.filter((item) => item.status === 'completed').length;
  const estimatedConsultationValue = appointments.reduce((sum, item) => sum + Number(item.fee || 0), 0);
  const initialLoad = loading && appointments.length === 0 && reminders.length === 0 && reports.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-6">
      <section className="relative overflow-hidden rounded-[36px] border border-[#313c35] bg-[#1b231f] px-6 py-6 text-white shadow-[0_28px_80px_-36px_rgba(14,20,17,0.72)] md:px-7 md:py-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(189,92,51,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.07),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">
                Care Operations
              </span>
              <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/68">
                {loading ? 'Syncing live care data' : 'Live dashboard ready'}
              </span>
            </div>

            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.22em] text-white/46">
                {user?.role === 'doctor' ? 'Doctor workspace' : 'Patient workspace'}
              </p>
              <h1 className="mt-3 font-heading text-4xl font-extrabold leading-tight md:text-[3.35rem]">
                {firstName}, your health operations dashboard is now built to monitor, decide, and act.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
                Track upcoming care, active medication plans, report flow, and emergency readiness from one compact command surface.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="Upcoming Consultations"
                value={upcomingAppointments.length}
                detail={nextAppointment ? formatDateTime(nextAppointment.appointmentDate) : 'No consultation booked yet'}
                emphasis="dark"
              />
              <MetricTile
                label="Active Reminders"
                value={activeReminders.length}
                detail={nextReminder ? getReminderWindowLabel(nextReminder) : 'No medicine routine scheduled'}
                emphasis="dark"
              />
              <MetricTile
                label="Report Records"
                value={reports.length}
                detail={latestReport ? `${latestReport.title} · ${formatDate(latestReport.createdAt)}` : 'No uploaded report history'}
                emphasis="dark"
              />
              <MetricTile
                label="Completed Sessions"
                value={completedAppointments}
                detail={estimatedConsultationValue > 0 ? `${formatCurrency(estimatedConsultationValue)} total consultation value tracked` : 'No completed consultation yet'}
                emphasis="dark"
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/50">Readiness Score</p>
                  <h2 className="mt-2 font-heading text-2xl font-extrabold text-white">Profile and care setup</h2>
                </div>
                <div className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-sm text-white/72">
                  {readiness.completed}/{readiness.total}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-5">
                <div className="relative h-28 w-28 shrink-0">
                  <svg viewBox="0 0 120 120" className="-rotate-90">
                    <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      fill="none"
                      stroke="#edccb1"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${(readiness.score / 100) * (2 * Math.PI * 44)} ${2 * Math.PI * 44}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="font-heading text-3xl font-extrabold text-white">{readiness.score}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">score</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {readiness.items.slice(0, 4).map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${item.done ? 'bg-emerald-400' : 'bg-white/22'}`} />
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="text-sm text-white/58">{item.hint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-brand-300/20 bg-gradient-to-br from-brand-500/22 via-brand-500/10 to-transparent p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-100">Priority Action</p>
              <h3 className="mt-3 font-heading text-2xl font-extrabold text-white">{primaryAction.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/72">{primaryAction.description}</p>
              <Link
                to={primaryAction.to}
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slateblue transition hover:bg-brand-50"
              >
                {primaryAction.actionLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Panel
          eyebrow="Analytics"
          title="7-day care pulse"
          action={(
            <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              {activitySeries.reduce((sum, point) => sum + point.total, 0)} weighted events
            </div>
          )}
        >
          {initialLoad ? (
            <div className="py-14">
              <Loader label="Syncing dashboard analytics..." />
            </div>
          ) : (
            <ActivityChart points={activitySeries} />
          )}
        </Panel>

        <div className="grid gap-6">
          <Panel eyebrow="Consultation Mix" title="How care is being delivered" dark>
            <DonutChart
              segments={modeSegments}
              total={modeTotal}
              centerLabel="Sessions"
              centerValue={modeTotal}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/50">Completed</p>
                <p className="mt-2 font-heading text-3xl font-extrabold text-white">{completedAppointments}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/50">Booked Next</p>
                <p className="mt-2 font-heading text-3xl font-extrabold text-white">{upcomingAppointments.length}</p>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Clinical Intake" title="Report distribution">
            <ProgressList
              items={reportSegments}
              emptyLabel="Upload reports to unlock clinical distribution analytics."
            />
          </Panel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Agenda" title="Next care checkpoints">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-[#ece1d5] bg-[#fbf7f2] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Next consultation</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {nextAppointment ? nextAppointment.doctorName : 'No consultation scheduled'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {nextAppointment
                      ? `${formatFullDate(nextAppointment.appointmentDate)} · ${nextAppointment.mode}`
                      : 'Book a doctor visit to anchor the next care step.'}
                  </p>
                </div>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                  {nextAppointment ? nextAppointment.status : 'open'}
                </span>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#ece1d5] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Medication window</p>
              <p className="mt-2 font-semibold text-slate-900">
                {nextReminder ? nextReminder.medicineName : 'No active reminder'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {nextReminder ? getReminderWindowLabel(nextReminder) : 'Create a reminder plan to establish routine follow-through.'}
              </p>
            </div>

            <div className="rounded-[24px] border border-[#ece1d5] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest report</p>
              <p className="mt-2 font-semibold text-slate-900">
                {latestReport ? latestReport.title : 'No report on file'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {latestReport
                  ? `${formatDate(latestReport.createdAt)} · ${String(latestReport.reportType || 'general').toUpperCase()}`
                  : 'Upload lab work, imaging, or prescriptions to enrich follow-up context.'}
              </p>
            </div>

            <div className="rounded-[24px] border border-[#ece1d5] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Emergency readiness</p>
              <p className="mt-2 font-semibold text-slate-900">
                {user?.emergencyContact?.name || 'Emergency contact missing'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {user?.emergencyContact?.phone
                  ? `${user.emergencyContact.phone} · SOS can route faster with this contact attached.`
                  : 'Add an emergency contact from profile to complete critical response setup.'}
              </p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel
            eyebrow="Action Board"
            title="Move without hunting through menus"
            action={(
              <div className="rounded-full bg-[#eff3ef] px-4 py-2 text-sm font-semibold text-slateblue">
                {user?.role === 'doctor' ? 'Consultation console' : 'Patient command flow'}
              </div>
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {commandCards.map((card) => (
                <Link
                  key={card.title}
                  to={card.to}
                  className={`group rounded-[28px] border p-5 shadow-soft transition duration-300 hover:-translate-y-1 ${
                    card.tone === 'dark'
                      ? 'border-[#39443d] bg-[#24302a] text-white'
                      : card.tone === 'alert'
                        ? 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50 text-slate-900'
                        : 'border-white/70 bg-white text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      card.tone === 'dark'
                        ? 'bg-white/10 text-brand-100'
                        : card.tone === 'alert'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-brand-100 text-brand-700'
                    }`}
                    >
                      {card.code}
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      card.tone === 'dark'
                        ? 'bg-white/10 text-white/78'
                        : card.tone === 'alert'
                          ? 'bg-white text-rose-700 ring-1 ring-rose-100'
                          : 'bg-slate-50 text-slate-600'
                    }`}
                    >
                      {card.value} {card.meta}
                    </div>
                  </div>

                  <h3 className="mt-5 font-heading text-2xl font-extrabold">{card.title}</h3>
                  <p className={`mt-3 text-sm leading-7 ${
                    card.tone === 'dark' ? 'text-white/70' : 'text-slate-600'
                  }`}
                  >
                    {card.description}
                  </p>
                </Link>
              ))}
            </div>
          </Panel>

          <section className="grid gap-6 lg:grid-cols-2">
            <Panel eyebrow="Medication Cadence" title="Reminder schedule profile">
              <ProgressList
                items={reminderSegments}
                emptyLabel="Create reminders to see medication cadence analytics."
              />
            </Panel>

            <Panel eyebrow="Financial Signal" title="Consultation value track" dark>
              <div className="space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/50">Tracked consultation value</p>
                  <p className="mt-3 font-heading text-4xl font-extrabold text-white">
                    {estimatedConsultationValue > 0 ? formatCurrency(estimatedConsultationValue) : 'Rs. 0'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Paid</p>
                    <p className="mt-2 font-semibold text-white">
                      {appointments.filter((item) => item.paymentStatus === 'paid').length} sessions
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Pending</p>
                    <p className="mt-2 font-semibold text-white">
                      {totalPendingPayments} sessions
                    </p>
                  </div>
                </div>
              </div>
            </Panel>
          </section>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
