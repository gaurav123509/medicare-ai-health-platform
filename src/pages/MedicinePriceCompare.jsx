import { useMemo, useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { getApiError, medicineApi } from '../services/api';

const STATUS_STYLES = {
  available: 'bg-emerald-50 text-emerald-700',
  unavailable: 'bg-amber-50 text-amber-700',
  blocked: 'bg-rose-50 text-rose-700',
  error: 'bg-slate-100 text-slate-700',
};

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return 'Not available';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'available':
      return 'Live Price Found';
    case 'blocked':
      return 'Blocked by Site';
    case 'error':
      return 'Lookup Error';
    default:
      return 'No Price Found';
  }
};

const MedicinePriceCompare = () => {
  const [medicineName, setMedicineName] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const providers = result?.comparison?.providers || [];
  const summary = result?.comparison?.summary || {};
  const ocrText = result?.ocr?.text || '';

  const comparedAt = useMemo(() => {
    if (!summary.comparedAt) {
      return '';
    }

    return new Date(summary.comparedAt).toLocaleString();
  }, [summary.comparedAt]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!medicineName.trim() && !image) {
      setError('Enter a medicine name or upload a medicine image to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      if (medicineName.trim()) {
        formData.append('medicineName', medicineName.trim());
      }

      if (image) {
        formData.append('image', image);
      }

      const data = await medicineApi.comparePrices(formData);
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
          title="Medicine Price Compare"
          subtitle="Search by medicine name or upload a strip and compare available pricing across major platforms."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Medicine name
              </span>
              <input
                value={medicineName}
                onChange={(event) => setMedicineName(event.target.value)}
                placeholder="Example: Dolo 650 tablet"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Upload medicine image
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/png,image/jpeg,image/webp"
                onChange={(event) => setImage(event.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-slate-600"
              />
              <p className="mt-2 text-sm text-slate-500">
                JPG, PNG, or WEBP medicine pack image. You can use only text input, only image, or both.
              </p>
              {image && (
                <p className="mt-2 text-sm text-slate-600">
                  Selected image: <span className="font-medium text-slate-800">{image.name}</span>
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
              {loading ? 'Comparing prices...' : 'Compare Medicine Prices'}
            </button>
          </form>
        </Card>

        <Card
          title="Comparison Summary"
          subtitle="Live results appear when a provider page exposes a trustworthy medicine price match."
        >
          {loading && <Loader label="Checking provider pricing pages..." />}

          {!loading && !result && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              Start a lookup to see extracted medicine details, OCR text, and provider-wise comparison here.
            </div>
          )}

          {!loading && result && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-brand-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-700">
                    Medicine
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {result.extractedMedicineName}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Cheapest Match
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {summary.cheapest
                      ? `${summary.cheapest.label || summary.cheapest.provider} · ${formatCurrency(summary.cheapest.price)}`
                      : 'No trusted live price found'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Coverage
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {summary.availableCount || 0} of {summary.checkedCount || providers.length} providers
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Comparison Notes
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                    <p>
                      Some marketplaces block automated requests. When that happens, the page shows a status and a direct search link instead of a guessed price.
                    </p>
                    <p>
                      Compared at: <span className="font-medium text-slate-800">{comparedAt || 'Just now'}</span>
                    </p>
                    <p>
                      Blocked providers: <span className="font-medium text-slate-800">{summary.blockedCount || 0}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    OCR Preview
                  </p>
                  <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-7 text-slate-600">
                    {ocrText || 'No OCR text was needed for this lookup.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      <Card
        title="Provider Results"
        subtitle="Each card shows the provider status, best matched medicine name, and a direct link to continue checking manually."
      >
        {!loading && providers.length === 0 ? (
          <p className="text-sm text-slate-500">
            No comparison results yet. Run a search above to populate provider results.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {providers.map((provider) => (
              <div key={provider.key} className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl font-extrabold text-slate-900">
                      {provider.label}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {provider.productName || result?.extractedMedicineName}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[provider.status] || STATUS_STYLES.unavailable}`}>
                    {getStatusLabel(provider.status)}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Price
                  </p>
                  <p className="mt-2 font-heading text-3xl font-extrabold text-slate-900">
                    {provider.status === 'available' ? formatCurrency(provider.price) : 'N/A'}
                  </p>
                </div>

                {provider.matchedText && (
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    <span className="font-semibold text-slate-700">Matched text:</span> {provider.matchedText}
                  </p>
                )}

                <p className="mt-4 min-h-[56px] text-sm leading-7 text-slate-600">
                  {provider.note || 'Open the provider page to verify the current sale price and delivery availability.'}
                </p>

                <a
                  href={provider.searchUrl || provider.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  Open Provider Search
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MedicinePriceCompare;
