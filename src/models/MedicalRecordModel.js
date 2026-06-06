import { mockMedicalRecords, mockPatients } from '../mockData';

export const MedicalRecordModel = {
  /**
   * Lấy tất cả hồ sơ bệnh án
   */
  getAll() {
    return mockMedicalRecords;
  },

  /**
   * Lấy hồ sơ theo bệnh nhân.
   * Fallback về pat-01 nếu không tìm thấy record nào cho patientId đó
   * (phục vụ tài khoản Supabase thực khi chưa có dữ liệu riêng).
   */
  getByPatientId(patientId) {
    const found = mockMedicalRecords.filter(r => r.patientId === patientId);
    if (found.length > 0) return found;
    // Fallback: trả về hồ sơ mẫu của pat-01 để demo
    return mockMedicalRecords.filter(r => r.patientId === 'pat-01');
  },

  /**
   * Lấy hồ sơ theo ID
   */
  getById(recordId) {
    return mockMedicalRecords.find(r => r.id === recordId) || null;
  },

  /**
   * Lấy thông tin bệnh nhân kèm theo hồ sơ
   */
  getWithPatientInfo(recordId) {
    const record = this.getById(recordId);
    if (!record) return null;

    const patient = mockPatients.find(p => p.id === record.patientId);
    return {
      ...record,
      patientInfo: patient || record.patient || null,
    };
  },

  /**
   * Tính tuổi từ ngày sinh
   */
  calculateAge(dob) {
    if (!dob) return '—';
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  },
};
