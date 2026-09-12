/**
 * Format milliseconds remaining into human-readable countdown
 * e.g. "3h 32m" or "1d 4h" or "45s"
 */
export function formatCountdown(targetTimestampMs: number, nowMs: number = Date.now()): string {
  const diff = targetTimestampMs - nowMs;
  if (diff <= 0) {
    return 'LIVE';
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }

  if (hours > 0) {
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
  }

  if (minutes > 0) {
    const remSeconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}m ${remSeconds}s`;
  }

  const seconds = Math.floor(diff / 1000);
  return `${seconds}s`;
}

/**
 * Format date in canonical financial format
 * e.g. "Monday, 24 Aug 2026"
 */
export function formatHeaderDate(d: Date = new Date()): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[d.getUTCDay()];
  const dateNum = d.getUTCDate();
  const monthName = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();

  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

/**
 * Format live UTC clock string: HH:mm:ss (UTC)
 */
export function formatUtcTime(d: Date = new Date()): string {
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds} (UTC)`;
}
