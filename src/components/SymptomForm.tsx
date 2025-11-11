import { FormEvent, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { sanitizeText } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';

interface SymptomFormProps {
  onLogged?: () => void;
}

const SymptomForm = ({ onLogged }: SymptomFormProps) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) {
      setFeedback('Describe your symptom before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'symptoms'), {
        patientId: user.uid,
        text: sanitizeText(text),
        tags: tags
          .split(',')
          .map((tag) => sanitizeText(tag))
          .filter(Boolean),
        timestamp: serverTimestamp()
      });
      setText('');
      setTags('');
      setFeedback('Symptom logged. Feel better soon!');
      onLogged?.();
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-card" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Log Symptoms</h2>
        <p className="mt-1 text-sm text-slate-500">Describe what you are experiencing today.</p>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Symptom description
        <textarea
          required
          name="symptom"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Tags (comma separated)
        <input
          name="tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          placeholder="e.g. headache, fatigue"
        />
      </label>
      {feedback && (
        <div
          role="status"
          className={`rounded-md px-3 py-2 text-sm ${feedback.includes('Symptom logged') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
        >
          {feedback}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? 'Submitting…' : 'Log Symptom'}
      </button>
    </form>
  );
};

export default SymptomForm;

