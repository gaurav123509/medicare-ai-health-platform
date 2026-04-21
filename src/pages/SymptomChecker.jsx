import { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { getApiError, symptomApi } from '../services/api';

const severityOptions = ['mild', 'moderate', 'severe'];

const SymptomChecker = () => {
  const [form, setForm] = useState({
    symptoms: '',
    duration: '',
    severity: 'mild',
    age: '',
    gender: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const issue = useMemo(() => {
    if (!result) {
      return '';
    }

    return result.possibleConditions?.[0]?.name || result.summary || 'General health review needed';
  }, [result]);

  const doctorSuggestion = useMemo(() => {
    if (!result) {
      return '';
    }

    if (result.redFlags?.length) {
      return result.redFlags[0];
    }

    return result.recommendations?.[0] || 'Consult a physician if symptoms persist.';
  }, [result]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await symptomApi.history();
      setHistory(data.history || []);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        ...form,
        symptoms: form.symptoms,
        age: form.age ? Number(form.age) : undefined,
      };

      const data = await symptomApi.check(payload);
      setResult(data.result);
      await loadHistory();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card
          title="Symptom Checker"
          subtitle="Describe your symptoms to receive AI-guided risk context and next-step suggestions."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Symptoms
              </span>
              <textarea
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                rows="4"
                placeholder="Example: fever, dry cough, headache"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Duration
                </span>
                <input
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="2 days"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Severity
                </span>
                <select
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                >
                  {severityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Age
                </span>
                <input
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Additional notes
              </span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Add anything relevant such as existing conditions or trigger factors."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-600 px-4 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Analyzing symptoms...' : 'Check Symptoms'}
            </button>
          </form>
        </Card>

        <Card
          title="Assessment Result"
          subtitle="AI summary, risk context, and recommended next steps."
        >
          {!result && !loading && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              Submit your symptoms to see the AI assessment here.
            </div>
          )}

          {loading && <Loader label="Reviewing your symptoms..." />}

          {result && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-brand-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-700">
                    Issue
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">{issue}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Risk Level
                  </p>
                  <p className="mt-2 font-semibold capitalize text-slate-900">
                    {result.triageLevel}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Doctor Suggestion
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">{doctorSuggestion}</p>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Summary
                </p>
                <p className="mt-3 leading-7 text-slate-700">{result.summary}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Possible Conditions
                  </p>
                  <div className="mt-3 space-y-3">
                    {(result.possibleConditions || []).map((condition) => (
                      <div key={condition.name} className="rounded-2xl bg-white p-4">
                        <p className="font-semibold text-slate-900">{condition.name}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Probability: {Math.round((condition.probability || 0) * 100)}%
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {condition.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Recommendations
                  </p>
                  <ul className="mt-3 space-y-3">
                    {(result.recommendations || []).map((item) => (
                      <li key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                        {item}
                      </li>
                    ))}
                    {(result.redFlags || []).map((item) => (
                      <li key={item} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      <Card title="Recent Symptom History" subtitle="Review earlier checks saved to your account.">
        {historyLoading ? (
          <Loader label="Loading symptom history..." />
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">
            No symptom checks have been recorded yet.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {history.map((entry) => (
              <div key={entry._id} className="rounded-3xl bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">
                    {(entry.symptoms || []).join(', ')}
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    {entry.aiResponse?.triageLevel || entry.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {entry.aiResponse?.summary || entry.notes || 'No summary available.'}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SymptomChecker;
