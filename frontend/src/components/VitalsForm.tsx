import { FormEvent, useState } from 'react';
import { logVitals, VITAL_HELPERS } from '../services/vitalsService';
import { useAuth } from '../hooks/useAuth';
import { sanitizeText, validateVitalForm, VitalFormValues } from '../utils/validation';

interface VitalsFormProps {
  onSuccess?: () => void;
}

const initialValues: VitalFormValues = {
  temperature: '',
  heartRate: '',
  bpSys: '',
  bpDia: '',
  spo2: '',
  notes: ''
};

const VitalsForm = ({ onSuccess }: VitalsFormProps) => {
  const { user } = useAuth();
  const [values, setValues] = useState<VitalFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const validation = validateVitalForm(values);
    setErrors(validation as Record<string, string>);
    if (Object.keys(validation).length > 0) {
      setFeedback('Please correct the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      await logVitals({
        ...values,
        notes: values.notes ? sanitizeText(values.notes) : '',
        patientId: user.uid
      });
      setValues(initialValues);
      setFeedback('Vitals recorded successfully.');
      onSuccess?.();
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-card" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Record Vitals</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your latest measurements. Ranges are validated to keep data reliable.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(VITAL_HELPERS) as Array<keyof typeof VITAL_HELPERS>).map((key) => {
          const range = VITAL_HELPERS[key];
          return (
            <label key={key} className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              {range.label}
              <input
                required
                inputMode="decimal"
                name={key}
                type="number"
                step="0.1"
                min={range.min}
                max={range.max}
                value={values[key] ?? ''}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    [key]: event.target.value === '' ? '' : Number(event.target.value)
                  }))
                }
                aria-describedby={`${key}-helper`}
                className={`rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  errors[key] ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              />
              <span id={`${key}-helper`} className="text-xs text-slate-500">
                Range {range.min} – {range.max}
              </span>
              {errors[key] && <span className="text-xs text-red-600">{errors[key]}</span>}
            </label>
          );
        })}
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Notes (optional)
        <textarea
          name="notes"
          value={values.notes ?? ''}
          onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
          rows={3}
          className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      </label>
      {feedback && (
        <div
          role="status"
          className={`rounded-md px-3 py-2 text-sm ${feedback.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
        >
          {feedback}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? 'Saving…' : 'Save Vitals'}
      </button>
    </form>
  );
};

export default VitalsForm;

