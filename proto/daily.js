// The Daily Dig's calendar runs on the device's LOCAL day (docs/RELEASE_REVIEW.md item 2), so "today" turns at the
// player's midnight and everyone who shares a local date shares the puzzle. Game Center's daily_dig board still resets
// at 00:00 UTC (docs/SETUP.md), so one board can span two local days; accepted.
export const localDate = (d = new Date(), plusDays = 0) => { // YYYY-MM-DD; plusDays walks calendar days (DST-safe)
  d = new Date(d); d.setDate(d.getDate() + plusDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// the streak after selling a daily dig: the same day keeps it, the day after the last dig extends it, any gap starts over
export const streakAfter = (last, streak, todayStr, yesterdayStr) => last === todayStr ? streak : last === yesterdayStr ? streak + 1 : 1;
// time left until local midnight, rounded up to the minute: "3h 12m", or "12m" under an hour
export const untilMidnight = (now = new Date()) => {
  const m = Math.ceil((new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now) / 6e4), h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`; };
