/**
 * Service categories — stable reference data shared by the booking forms and by
 * every place that renders a practitioner's specialities.
 *
 * `employee_profiles.specialization` stores either these `cat-NN` codes
 * (comma-separated) or free text typed in the profile editor, so `specialtyLabel`
 * maps a code to its Vietnamese name and passes anything else through unchanged.
 * Before this existed the landing page printed the raw codes — a visitor saw
 * "cat-03  cat-06  cat-01" on the public doctor profile.
 */
export const SERVICE_CATEGORIES = [
  { id: 'cat-01', name: 'Khám da liễu tổng quát' },
  { id: 'cat-02', name: 'Điều trị mụn & sẹo rỗ' },
  { id: 'cat-03', name: 'Trị nám, tàn nhang & đốm nâu' },
  { id: 'cat-04', name: 'Trẻ hóa & chống lão hóa da' },
  { id: 'cat-05', name: 'Điều trị viêm da, vảy nến, eczema' },
  { id: 'cat-06', name: 'Thẩm mỹ & chăm sóc da chuyên sâu' },
  { id: 'cat-07', name: 'Soi da & tư vấn AI' },
];

const BY_ID = Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c.id, c.name]));

/** 'cat-03' → 'Trị nám, tàn nhang & đốm nâu'; free text → itself. */
export const specialtyLabel = (value) => BY_ID[String(value).trim()] || String(value).trim();

/**
 * Parse an `employee_profiles.specialization` cell into display labels.
 * Returns [] when the practitioner has not filled it in — callers render nothing
 * rather than inventing a speciality.
 */
export const parseSpecialties = (specialization) => {
  if (!specialization || typeof specialization !== 'string') return [];
  return specialization
    .split(',')
    .map((s) => specialtyLabel(s))
    .filter(Boolean);
};
