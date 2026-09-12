export interface TimezoneOption {
  id: string;
  label: string;
  abbr: string;
  offsetHours: number;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { id: 'UTC', label: 'UTC (GMT+0)', abbr: 'UTC', offsetHours: 0 },
  { id: 'Local Time', label: 'Local Device Time', abbr: 'Local', offsetHours: 0 },
  { id: 'America/New_York', label: 'New York (EDT / UTC-4)', abbr: 'EDT', offsetHours: -4 },
  { id: 'Europe/London', label: 'London (BST / UTC+1)', abbr: 'BST', offsetHours: 1 },
  { id: 'Europe/Berlin', label: 'Frankfurt / Berlin (CEST / UTC+2)', abbr: 'CEST', offsetHours: 2 },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST / UTC+9)', abbr: 'JST', offsetHours: 9 },
  { id: 'Asia/Singapore', label: 'Singapore (SGT / UTC+8)', abbr: 'SGT', offsetHours: 8 },
  { id: 'Asia/Dubai', label: 'Dubai (GST / UTC+4)', abbr: 'GST', offsetHours: 4 },
  { id: 'Asia/Karachi', label: 'Karachi (PKT / UTC+5)', abbr: 'PKT', offsetHours: 5 }
];

export function convertTimeToTimezone(
  dateStr: string,
  timeUtc: string,
  timezone: string
): { formattedTime: string; formattedDate: string; fullLabel: string } {
  try {
    const isoStr = `${dateStr}T${timeUtc}:00Z`;
    const dateObj = new Date(isoStr);
    if (isNaN(dateObj.getTime())) {
      return { formattedTime: timeUtc, formattedDate: dateStr, fullLabel: `${dateStr}, ${timeUtc} (UTC)` };
    }

    if (timezone === 'UTC') {
      const d = new Date(isoStr);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = days[d.getUTCDay()];
      const dayNum = d.getUTCDate();
      const monthName = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();

      return {
        formattedTime: timeUtc,
        formattedDate: `${dayName}, ${dayNum} ${monthName} ${year}`,
        fullLabel: `${dayName}, ${dayNum} ${monthName} ${year}, ${timeUtc} (UTC)`
      };
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(timezone !== 'Local Time' ? { timeZone: timezone } : {})
    };

    const formattedTime = new Intl.DateTimeFormat('en-GB', timeOptions).format(dateObj);

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(timezone !== 'Local Time' ? { timeZone: timezone } : {})
    };
    const formattedDate = new Intl.DateTimeFormat('en-GB', dateOptions).format(dateObj);

    const tzLabel = timezone === 'Local Time' 
      ? 'Local' 
      : (TIMEZONE_OPTIONS.find(t => t.id === timezone)?.abbr || timezone.split('/').pop() || timezone);

    return {
      formattedTime,
      formattedDate,
      fullLabel: `${formattedDate}, ${formattedTime} (${tzLabel})`
    };
  } catch {
    return { formattedTime: timeUtc, formattedDate: dateStr, fullLabel: `${dateStr}, ${timeUtc} (UTC)` };
  }
}
