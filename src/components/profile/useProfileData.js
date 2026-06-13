/**
 * useProfileData.js
 * ───────────────────────────────────────────────────────────────────────────
 * Builds a stable, presentation-ready view-model from the raw auth `user`.
 *
 *  - Staff actors get sensible defaults for the employee fields the mock auth
 *    object does not carry (department, specialization, schedule, employeeId).
 *  - The Patient actor gets a fully-normalized MEDICAL RECORD assembled from
 *    `mockMedicalRecords` + `mockPatients`: vitals, medical history, a clinical
 *    timeline, and active treatment protocols with progress.
 *
 * Everything is memoized on the user id so child tabs receive referentially
 * stable data and don't thrash on re-render.
 */
import { useMemo } from 'react';
import { MedicalRecordModel } from '../../models/MedicalRecordModel';
import { mockPatients } from '../../mockData';
import { ROLE_DISPLAY_NAMES, isStaffRole } from './profileConfig';

// Per-role default employee metadata (mock auth doesn't store these).
const STAFF_DEFAULTS = {
  DOCTOR: { department: 'Khoa Da liễu', specialization: 'Da liễu thẩm mỹ & Laser', schedule: 'Thứ 2 – Thứ 6, 08:00 – 17:00' },
  TECHNICIAN: { department: 'Khoa Kỹ thuật', specialization: 'Phân tích da & Thiết bị laser', schedule: 'Thứ 2 – Thứ 7, 08:00 – 16:00' },
  RECEPTIONIST: { department: 'Tiếp đón & CSKH', specialization: 'Tiếp nhận & Điều phối lịch hẹn', schedule: 'Xoay ca, 07:30 – 20:00' },
  ADMIN: { department: 'Ban điều hành', specialization: 'Quản trị hệ thống', schedule: 'Thứ 2 – Thứ 6, 08:30 – 17:30' },
};

// Health overview fields that aren't on the mock patient yet. Keyed by patient
// id with a graceful default, so the UI always renders a complete record.
const PATIENT_HEALTH = {
  'pat-01': { bloodType: 'O+', allergies: ['Penicillin', 'Phấn hoa'], familyHistory: 'Bố có tiền sử viêm da cơ địa' },
};
const DEFAULT_HEALTH = { bloodType: 'Chưa cập nhật', allergies: [], familyHistory: 'Không ghi nhận' };

// Heuristic severity tagging for free-text history strings.
const SEVERITY_BY_KEYWORD = [
  { match: /nặng|vảy nến|mãn/i, level: 'Nặng', tone: 'rose' },
  { match: /viêm|rosacea|nấm/i, level: 'Trung bình', tone: 'amber' },
];
const tagSeverity = (condition) => {
  const hit = SEVERITY_BY_KEYWORD.find((s) => s.match.test(condition));
  return hit || { level: 'Đang theo dõi', tone: 'sky' };
};

export function useProfileData(user) {
  const role = user?.role || 'PATIENT';
  const userId = user?.id || null;

  return useMemo(() => {
    const base = {
      id: userId,
      role,
      roleLabel: ROLE_DISPLAY_NAMES[role] || role,
      name: user?.name || 'Người dùng',
      email: user?.email || `${(user?.name || 'user').toLowerCase().replace(/\s+/g, '.')}@dermasmart.vn`,
      phone: user?.phone || '0901 234 567',
      avatar: user?.avatar || null,
      initials: (user?.name || 'U').trim().charAt(0).toUpperCase(),
      // Administrative metadata shown in the identity card.
      status: 'Hoạt động',
      code: userId ? userId.toUpperCase() : '—',
      memberSince: user?.memberSince || '15/03/2024',
    };

    // ── STAFF ────────────────────────────────────────────────────────────────
    if (isStaffRole(role)) {
      const defaults = STAFF_DEFAULTS[role] || {};
      return {
        ...base,
        kind: 'staff',
        employeeId: user?.employeeId || (userId ? userId.toUpperCase() : 'NV-0001'),
        department: user?.department || defaults.department || '—',
        specialization: user?.specialization || defaults.specialization || '—',
        schedule: user?.schedule || defaults.schedule || '—',
      };
    }

    // ── PATIENT ──────────────────────────────────────────────────────────────
    const records = MedicalRecordModel.getByPatientId(userId || 'pat-01');
    const patientInfo =
      mockPatients.find((p) => p.id === userId) ||
      mockPatients.find((p) => p.id === 'pat-01') ||
      {};
    const latest = records[0] || {};
    const health = PATIENT_HEALTH[patientInfo.id] || DEFAULT_HEALTH;

    // Vitals & overview
    const vitals = {
      bloodType: health.bloodType,
      height: latest?.vitalSigns?.height || 'Chưa cập nhật',
      weight: latest?.vitalSigns?.weight || 'Chưa cập nhật',
      bloodPressure: latest?.vitalSigns?.bloodPressure || '—',
      allergies: health.allergies,
      familyHistory: health.familyHistory,
    };

    // Medical history (chronic / skin conditions)
    const medicalHistory = (patientInfo.medicalHistory || []).map((condition) => {
      const sev = tagSeverity(condition);
      const note = records.find((r) => r.diagnosis?.includes(condition.split(' ')[0]))?.diagnosisDetail;
      return {
        condition,
        severity: sev.level,
        tone: sev.tone,
        note: note || 'Theo dõi định kỳ theo chỉ định của bác sĩ.',
      };
    });

    // Clinical history timeline
    const clinicalHistory = records.map((r) => ({
      id: r.id,
      date: r.date,
      doctor: r.doctor,
      specialty: r.specialty,
      diagnosis: r.diagnosis,
      diagnosisCode: r.diagnosisCode,
      prescriptions: r.prescriptions || [],
      record: r,
    }));

    // Active treatment protocols (with progress)
    const activeTreatments = records
      .filter((r) => r.treatmentPlan)
      .map((r) => {
        const tp = r.treatmentPlan;
        const done = tp.sessions || 0;
        const total = tp.totalSessions || tp.sessions || 1;
        return {
          id: `tp-${r.id}`,
          title: tp.title,
          duration: tp.duration,
          done,
          total,
          percent: Math.min(100, Math.round((done / total) * 100)),
          doctor: r.doctor,
          notes: tp.doctorNotes,
        };
      });

    return {
      ...base,
      kind: 'patient',
      gender: user?.gender || patientInfo.gender || 'Nam',
      dob: user?.dob || patientInfo.dob || '',
      address: user?.address || patientInfo.address || '—',
      medical: { vitals, medicalHistory, clinicalHistory, activeTreatments },
      metrics: { visits: records.length },
    };
  }, [userId, role, user?.name, user?.email, user?.phone, user?.avatar]);
}
