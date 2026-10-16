/**
 * 在地（本地）日期工具。
 * 之前用 toISOString().slice(0, 10) 取的是 UTC 日期，
 * 台北 = UTC+8 會導致「每日任務早上 8 點才跨日」的怪現象，統一改用在地日曆日。
 */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
