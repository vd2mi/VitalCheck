import { format, isToday, parseISO } from 'date-fns';

export const normalizeDate = (value: any): Date | null => {
  if (!value) return null;

  // Firestore timestamp
  if (typeof value === 'object' && value.seconds) {
    return new Date(value.seconds * 1000);
  }

  // Already ISO string
  if (typeof value === 'string') {
    const d = parseISO(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
};

export const formatDate = (value: any) => {
  const date = normalizeDate(value);
  return date ? format(date, 'PP') : '';
};

export const formatDateTime = (value: any) => {
  const date = normalizeDate(value);
  return date ? format(date, 'PPpp') : '';
};

export const formatRelativeDay = (value: any) => {
  const date = normalizeDate(value);
  if (!date) return '';
  if (isToday(date)) return 'Today';
  return format(date, 'EEEE, MMM d');
};
