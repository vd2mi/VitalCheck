import { format, isToday, parseISO } from 'date-fns';

export const formatDate = (value: string) => {
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'PP');
};

export const formatDateTime = (value: string) => {
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'PPpp');
};

export const formatRelativeDay = (value: string) => {
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return value;
  if (isToday(date)) return 'Today';
  return format(date, 'EEEE, MMM d');
};

export const anonymizeEmail = (email: string) => {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user.slice(-1)}@${domain}`;
};

