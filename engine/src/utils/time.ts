// Get start of the minute timestamp (ms)
export function getMinuteKey(timestamp: number): string {
  const date = new Date(timestamp);
  date.setSeconds(0, 0); // zero seconds and milliseconds
  return date.getTime().toString(36);
}

// Get start of the hour timestamp (ms)
export function getHourKey(timestamp: number): string {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0); // zero minutes, seconds, ms
  return date.getTime().toString(36);
}

// Get start of the week timestamp (ms), week starts Monday
export function getWeekKey(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day); // Sunday -> Monday = -6 days else Monday offset
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0); // zero time
  return date.getTime().toString(36);
}
