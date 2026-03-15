import { startOfISOWeek, endOfISOWeek, getISOWeek, getISOWeekYear, format, subWeeks } from 'date-fns';

export function getWeekKey(date: Date): string {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function getWeekLabel(date: Date): string {
  const start = startOfISOWeek(date);
  const end = endOfISOWeek(date);
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfISOWeek(date),
    end: endOfISOWeek(date),
  };
}

export function getDefaultDateRange(): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: subWeeks(now, 4),
    to: now,
  };
}

export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
