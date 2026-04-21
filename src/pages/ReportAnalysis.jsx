import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { getApiError, reportApi } from '../services/api';

const ReportAnalysis = () => {
  const [form, setForm] = useState({
    title: '',
    reportType: 'general',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await reportApi.history();
      setHistory(data.reports || []);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a report file before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('report', file);
      formData.append('title', form.title || file.name);
      formData.append('reportType', form.reportType);

      const data = await reportApi.analyze(formData);
      setAnalysisData(data);
      setForm({
        title: '',
        reportType: 'general',
      });
      setFile(null);
      await loadHistory();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card
          title="Report Analysis"
          subtitle="Upload a PDF, JPG, PNG, or text report and receive an AI-organized summary."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Report title
              </span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                placeholder="Blood test - March review"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Report type
              </span>
              <select
                value={form.reportType}
                onChange={(event) => setForm((current) => ({ ...current, reportType: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              >
                <option value="general">General</option>
                <option value="blood">Blood Report</option>
                <option value="scan">Scan / Imaging</option>
                <option value="prescription">Prescription</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Upload file
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-slate-600"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-slate-500">
                  Selected file: <span className="font-medium text-slate-700">{file.name}</span>
                </p>
              )}
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
              {loading ? 'Analyzing report...' : 'Analyze Report'}
            </button>
          </form>
        </Card>

        <Card
          title="Latest Result"
          subtitle="Structured report summary, OCR text preview, and follow-up guidance."
        >
          {loading && <Loader label="Running OCR and AI report analysis..." />}

          {!analysisData && !loading && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              Upload a report to view the structured output here.
            </div>
          )}

          {analysisData && !loading && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-brand-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-700">
                    Follow-up Level
                  </p>
                  <p className="mt-2 font-semibold capitalize text-slate-900">
                    {analysisData.analysis?.followUpLevel}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    OCR Method
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {analysisData.ocr?.method}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Title
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {analysisData.report?.title}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Summary
                </p>
                <p className="mt-3 leading-7 text-slate-700">
                  {analysisData.analysis?.summary}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Key Observations
                  </p>
                  <ul className="mt-3 space-y-2">
                    {(analysisData.analysis?.keyObservations || []).map((item) => (
                      <li key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Abnormal Indicators
                  </p>
                  <ul className="mt-3 space-y-2">
                    {(analysisData.analysis?.abnormalIndicators || []).map((item) => (
                      <li key={item} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Recommendations
                </p>
                <ul className="mt-3 space-y-2">
                  {(analysisData.analysis?.recommendations || []).map((item) => (
                    <li key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  OCR Text Preview
                </p>
                <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-7 text-slate-600">
                  {analysisData.ocr?.text || 'No OCR text available.'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>

      <Card title="Report History" subtitle="Previously analyzed reports saved to your profile.">
        {historyLoading ? (
          <Loader label="Loading report history..." />
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">
            No reports have been analyzed yet.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {history.map((report) => (
              <div key={report._id} className="rounded-3xl bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{report.title}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    {report.analysis?.followUpLevel || 'routine'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {report.analysis?.summary}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportAnalysis;
