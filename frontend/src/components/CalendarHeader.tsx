interface Props {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  /** undefined — у пользователя нет прав на создание */
  onCreate?: () => void;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function CalendarHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  onCreate,
  onChangeMonth,
  onChangeYear,
}: Props) {
  const currentYear = currentDate.getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 5; y++) years.push(y);

  return (
    <header className="calendar-header">
      <div className="calendar-header__nav">
        <button onClick={onToday} className="btn btn--secondary">Сегодня</button>
        <button onClick={onPrev} className="btn btn--icon" aria-label="Предыдущий месяц">‹</button>
        <button onClick={onNext} className="btn btn--icon" aria-label="Следующий месяц">›</button>

        <select
          className="calendar-header__select"
          value={currentDate.getMonth()}
          onChange={(e) => onChangeMonth(Number(e.target.value))}
          aria-label="Месяц"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>

        <select
          className="calendar-header__select"
          value={currentYear}
          onChange={(e) => onChangeYear(Number(e.target.value))}
          aria-label="Год"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      {onCreate && <button onClick={onCreate} className="btn btn--primary">+ Событие</button>}
    </header>
  );
}