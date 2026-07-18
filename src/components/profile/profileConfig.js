/**
 * profileConfig.js
 * ───────────────────────────────────────────────────────────────────────────
 * Static, declarative configuration that drives the entire Profile system:
 *  - role display names + accent palettes (aligned to the Liquid Glass tokens)
 *  - the role → quick-metric mapping shown in the summary card
 *  - the role → editable-field list
 *
 * Keeping this data-driven means adding a new actor or KPI is a config edit,
 * not a component rewrite.
 */
import {
  Stethoscope,
  ClipboardCheck,
  Cpu,
  ShieldCheck,
  HeartPulse,
  CalendarCheck,
  Clock,
  Star,
  Users,
  Activity,
  FlaskConical,
} from 'lucide-react';

export const STAFF_ROLES = ['ADMIN', 'DOCTOR', 'TECHNICIAN', 'RECEPTIONIST'];

export const ROLE_DISPLAY_NAMES = {
  ADMIN: 'Quản trị viên / Admin',
  DOCTOR: 'Bác sĩ / Chuyên gia',
  RECEPTIONIST: 'Lễ tân / Tiếp đón',
  TECHNICIAN: 'Kỹ thuật viên',
  PATIENT: 'Bệnh nhân',
};

/**
 * Each accent maps to soft frosted card colors using Tailwind utility classes.
 * Kept as plain class strings so they survive the JIT purge (no dynamic interp).
 */
export const ROLE_THEME = {
  ADMIN: {
    icon: ShieldCheck,
    tag: 'bg-violet-100/80 text-violet-700 border-violet-200',
    ring: 'from-violet-400 to-fuchsia-500',
    soft: 'text-violet-600',
  },
  DOCTOR: {
    icon: Stethoscope,
    tag: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
    ring: 'from-emerald-400 to-teal-500',
    soft: 'text-emerald-600',
  },
  TECHNICIAN: {
    icon: Cpu,
    tag: 'bg-sky-100/80 text-sky-700 border-sky-200',
    ring: 'from-sky-400 to-indigo-500',
    soft: 'text-sky-600',
  },
  RECEPTIONIST: {
    icon: ClipboardCheck,
    tag: 'bg-amber-100/80 text-amber-700 border-amber-200',
    ring: 'from-amber-400 to-orange-500',
    soft: 'text-amber-600',
  },
  PATIENT: {
    icon: HeartPulse,
    tag: 'bg-teal-100/80 text-teal-700 border-teal-200',
    ring: 'from-teal-400 to-sky-500',
    soft: 'text-teal-600',
  },
};

/**
 * Quick metrics rendered as frosted mini-cards in the summary column.
 * Values are illustrative KPIs per actor (the spec's "Stats Highlight").
 */
export const ROLE_METRICS = {
  ADMIN: [
    { icon: Users, label: 'Nhân sự quản lý', value: null, accent: 'text-violet-600' },
    { icon: Activity, label: 'Phiên hệ thống', value: null, accent: 'text-fuchsia-600' },
  ],
  DOCTOR: [
    { icon: Stethoscope, label: 'Ca khám thành công', value: null, accent: 'text-emerald-600' },
    { icon: Clock, label: 'Giờ làm việc', value: null, accent: 'text-teal-600' },
    { icon: Star, label: 'Đánh giá trung bình', value: null, accent: 'text-amber-500' },
  ],
  TECHNICIAN: [
    { icon: FlaskConical, label: 'Thủ thuật hoàn tất', value: null, accent: 'text-sky-600' },
    { icon: Clock, label: 'Giờ làm việc', value: null, accent: 'text-indigo-600' },
  ],
  RECEPTIONIST: [
    { icon: CalendarCheck, label: 'Lịch hẹn đã tiếp nhận', value: null, accent: 'text-amber-600' },
    { icon: Users, label: 'Số khách tiếp nhận', value: null, accent: 'text-orange-600' },
  ],
  PATIENT: [
    { icon: CalendarCheck, label: 'Lượt khám', value: null, accent: 'text-teal-600' },
  ],
};

/**
 * Editable personal fields per actor group.
 * `key` matches both formData and the validator switch in profileValidation.
 */
export const STAFF_FIELDS = [
  { key: 'name', label: 'Họ và tên', icon: 'User', type: 'text', editable: true },
  { key: 'email', label: 'Email', icon: 'Mail', type: 'email', editable: true },
  { key: 'phone', label: 'Số điện thoại', icon: 'Phone', type: 'tel', editable: true },
  { key: 'employeeId', label: 'Mã nhân viên', icon: 'BadgeCheck', type: 'text', editable: false },
  { key: 'department', label: 'Phòng ban', icon: 'Building2', type: 'text', editable: true },
  { key: 'specialization', label: 'Chuyên môn / Nghiệp vụ', icon: 'Sparkles', type: 'text', editable: true },
  { key: 'degree', label: 'Bằng cấp', icon: 'Award', type: 'text', editable: true },
  { key: 'experienceYears', label: 'Kinh nghiệm (năm)', icon: 'Clock', type: 'number', editable: true },
  { key: 'schedule', label: 'Lịch làm việc', icon: 'CalendarDays', type: 'text', editable: true },
];

export const PATIENT_FIELDS = [
  { key: 'name', label: 'Họ và tên', icon: 'User', type: 'text', editable: true },
  { key: 'email', label: 'Email', icon: 'Mail', type: 'email', editable: true },
  { key: 'phone', label: 'Số điện thoại', icon: 'Phone', type: 'tel', editable: true },
  { key: 'gender', label: 'Giới tính', icon: 'User', type: 'text', editable: true },
  { key: 'dob', label: 'Ngày sinh', icon: 'Calendar', type: 'text', editable: false },
  { key: 'address', label: 'Địa chỉ', icon: 'MapPin', type: 'text', editable: true },
];

export const isStaffRole = (role) => STAFF_ROLES.includes(role);
