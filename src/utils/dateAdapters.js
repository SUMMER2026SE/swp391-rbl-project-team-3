// Adapters between react-datepicker <Date> objects and the app's string data
// contracts ('yyyy-MM-dd' for dates, 'HH:mm' for times).
//
// Keeping component state on the string contract means backend payloads, filters
// and string comparisons stay untouched — we convert ONLY at the picker boundary
// (`selected={...}` reads a Date, `onChange` writes back the string).

export const ymdToDate = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d); // local midnight — mirrors native <input type="date">
};

export const dateToYmd = (d) => {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const hmToDate = (s) => {
  if (!s) return null;
  const [h, mi] = String(s).split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, mi || 0, 0, 0);
  return d;
};

export const dateToHm = (d) => {
  if (!d) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${mi}`;
};
