/**
 * profileValidation.js
 * ───────────────────────────────────────────────────────────────────────────
 * Field-level validators for the Profile module.
 *
 * The EMAIL / VN_PHONE regex below are intentionally kept byte-for-byte
 * identical to the enterprise patterns defined in our auth module
 * (`src/controllers/useAuthController.jsx`). Keeping them in one shared place
 * means the Profile edit form enforces exactly the same contract a user had to
 * pass at sign-up — no drift between "register" and "edit profile".
 */

// ─── Enterprise regex (sourced from useAuthController) ───────────────────────
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const VN_PHONE_REGEX = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;

// A name must not contain digits, and should be a couple of real characters.
const NAME_HAS_DIGIT = /\d/;

// ─── Normalizers ─────────────────────────────────────────────────────────────
export const normalizeEmail = (email) => (email ? email.toLowerCase().trim() : '');
export const normalizePhone = (phone) => (phone ? phone.trim().replace(/\s+/g, '') : '');

/**
 * Validate a single field by key.
 * @returns {string} a localized error message, or '' when the value is valid.
 */
export function validateField(key, rawValue) {
  const value = (rawValue ?? '').toString();
  const trimmed = value.trim();

  switch (key) {
    case 'name': {
      if (!trimmed) return 'Vui lòng nhập họ và tên.';
      if (NAME_HAS_DIGIT.test(trimmed)) return 'Họ và tên không được chứa chữ số.';
      if (trimmed.length < 2) return 'Họ và tên quá ngắn.';
      return '';
    }
    case 'email': {
      if (!trimmed) return 'Vui lòng nhập email.';
      if (!EMAIL_REGEX.test(normalizeEmail(trimmed))) return 'Email không đúng định dạng.';
      return '';
    }
    case 'phone': {
      if (!trimmed) return 'Vui lòng nhập số điện thoại.';
      if (!VN_PHONE_REGEX.test(normalizePhone(trimmed)))
        return 'Số điện thoại không đúng định dạng Việt Nam.';
      return '';
    }
    default:
      return '';
  }
}

/**
 * Validate a whole form object against a list of field keys.
 * @returns {{ isValid: boolean, errors: Record<string,string> }}
 */
export function validateForm(formData, fieldKeys) {
  const errors = {};
  for (const key of fieldKeys) {
    const msg = validateField(key, formData[key]);
    if (msg) errors[key] = msg;
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
