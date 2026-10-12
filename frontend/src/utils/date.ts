export function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(year, month, 1 - startWeekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Локальная календарная дата как 'YYYY-MM-DD' */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// All-day событие хранит «плавающую» дату: UTC-полночь первого дня … 23:59:59.999Z последнего.
// Даты берутся из строки как есть, без перевода в местное время, — одинаково в любом поясе.
export const allDayBounds = (startDate: string, endDate: string) => ({
  startTime: `${startDate}T00:00:00.000Z`,
  endTime: `${endDate}T23:59:59.999Z`,
});

export const allDayDates = (e: { startTime: string; endTime: string }) => ({
  startDate: e.startTime.slice(0, 10),
  endDate: e.endTime.slice(0, 10),
});
