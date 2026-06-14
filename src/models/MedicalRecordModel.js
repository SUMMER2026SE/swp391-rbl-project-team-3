import { supabase } from '../supabaseClient';
import { mockMedicalRecords } from '../mockData';
import { PatientModel } from './PatientModel';

const STORAGE_KEY = 'dermasmart_medical_records';
const VERSION_KEY = 'dermasmart_medical_records_version';
const CURRENT_VERSION = 'v1';

export const MedicalRecordModel = {
  init() {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored || storedVersion !== CURRENT_VERSION) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockMedicalRecords));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
  },

  getAllSync() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      console.error('Error reading medical records from localStorage', e);
      return mockMedicalRecords;
    }
  },

  save(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('medical-records-updated'));
  },

  // Asynchronous Database-backed methods (for main branch compatibility)
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, patient:patient_profiles(*), doctor:doctor_profiles(*)');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (medical_records):', e.message);
      // Fallback to local storage
      return this.getAllSync();
    }
  },

  async getByPatientId(patientId) {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, doctor:doctor_profiles(*)')
        .eq('patient_id', patientId);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (medical_records by patient):', e.message);
      // Fallback to local storage
      const list = this.getAllSync();
      const found = list.filter(r => r.patientId === patientId);
      if (found.length > 0) return found;
      return list.filter(r => r.patientId === 'pat-01');
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, patient:patient_profiles(*), doctor:doctor_profiles(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase fetch error (medical_record by id):', e.message);
      // Fallback to local storage
      return this.getAllSync().find(r => r.id === id) || null;
    }
  },

  async create(recordData) {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert([recordData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (medical_records):', e.message);
      return null;
    }
  },

  // Synchronous and hybrid check-in methods (for feature/receptionist compatibility)
  getWithPatientInfo(recordId) {
    const list = this.getAllSync();
    const record = list.find(r => r.id === recordId) || null;
    if (!record) return null;

    const patient = PatientModel.getById(record.patientId);
    return {
      ...record,
      patientInfo: patient || record.patient || null,
    };
  },

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

  validateRecord(recordData) {
    const { symptoms, vitalSigns } = recordData;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 5) {
      return { valid: false, error: 'Lý do khám/Triệu chứng ban đầu phải dài từ 5 ký tự trở lên.' };
    }

    if (!vitalSigns) {
      return { valid: false, error: 'Thiếu thông tin chỉ số sinh tồn (vitals).' };
    }

    const { weight, height, bloodPressure, pulse, temperature, spo2 } = vitalSigns;

    const hVal = parseFloat(height);
    if (isNaN(hVal) || hVal < 50 || hVal > 250) {
      return { valid: false, error: 'Chiều cao không hợp lệ. Phải từ 50cm đến 250cm.' };
    }

    const wVal = parseFloat(weight);
    if (isNaN(wVal) || wVal < 3 || wVal > 250) {
      return { valid: false, error: 'Cân nặng không hợp lệ. Phải từ 3kg đến 250kg.' };
    }

    const tVal = parseFloat(temperature);
    if (isNaN(tVal) || tVal < 35.0 || tVal > 42.0) {
      return { valid: false, error: 'Nhiệt độ cơ thể không hợp lệ. Phải từ 35°C đến 42°C.' };
    }

    if (!bloodPressure || typeof bloodPressure !== 'string') {
      return { valid: false, error: 'Chỉ số huyết áp là bắt buộc.' };
    }
    const bpClean = bloodPressure.replace(/\s/g, '');
    const bpParts = bpClean.split('/');
    if (bpParts.length !== 2) {
      return { valid: false, error: 'Huyết áp phải đúng định dạng Tâm thu/Tâm trương (VD: 120/80).' };
    }
    const sys = parseInt(bpParts[0], 10);
    const dia = parseInt(bpParts[1], 10);
    if (isNaN(sys) || sys < 70 || sys > 200) {
      return { valid: false, error: 'Chỉ số huyết áp tâm thu không hợp lệ. Phải từ 70 đến 200 mmHg.' };
    }
    if (isNaN(dia) || dia < 40 || dia > 130) {
      return { valid: false, error: 'Chỉ số huyết áp tâm trương không hợp lệ. Phải từ 40 đến 130 mmHg.' };
    }
    if (sys - dia < 20) {
      return { valid: false, error: 'Chênh lệch huyết áp tâm thu và tâm trương phải lớn hơn hoặc bằng 20 mmHg.' };
    }

    const pVal = parseInt(pulse, 10);
    if (isNaN(pVal) || pVal < 40 || pVal > 180) {
      return { valid: false, error: 'Nhịp tim không hợp lệ. Phải từ 40 đến 180 lần/phút.' };
    }

    const sVal = parseInt(spo2, 10);
    if (isNaN(sVal) || sVal < 80 || sVal > 100) {
      return { valid: false, error: 'Chỉ số SpO2 không hợp lệ. Phải từ 80% đến 100%.' };
    }

    return { valid: true };
  },

  addRecord(recordData) {
    const validation = this.validateRecord(recordData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const list = this.getAllSync();
    const patient = PatientModel.getById(recordData.patientId);
    if (!patient) {
      throw new Error('Bệnh nhân không tồn tại.');
    }

    const newRecord = {
      id: recordData.id || `rec-${Date.now()}`,
      patientId: recordData.patientId,
      appointmentId: recordData.appointmentId || '',

      date: recordData.date || new Date().toLocaleDateString('vi-VN'),
      time: recordData.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      doctorId: recordData.doctorId || 'doc-01',
      doctor: recordData.doctorName || 'BS. CKII. Trần Văn A',
      specialty: recordData.specialty || 'Da liễu lâm sàng',
      service: recordData.serviceName || 'Khám Da Liễu Tổng Quát',
      fee: recordData.fee || '300,000 VNĐ',
      paymentStatus: 'Đã thanh toán',
      status: 'pending_doctor',

      patient: {
        id: patient.id,
        fullName: patient.fullName,
        dob: patient.dob,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        avatar: patient.avatar,
      },

      symptoms: recordData.symptoms.trim(),
      vitalSigns: {
        weight: `${parseFloat(recordData.vitalSigns.weight)} kg`,
        height: `${parseFloat(recordData.vitalSigns.height)} cm`,
        bloodPressure: `${recordData.vitalSigns.bloodPressure.replace(/\s/g, '')} mmHg`,
        pulse: `${parseInt(recordData.vitalSigns.pulse, 10)} lần/phút`,
        temperature: `${parseFloat(recordData.vitalSigns.temperature)}°C`,
        spo2: `${parseInt(recordData.vitalSigns.spo2, 10)}%`,
      },

      diagnosis: '',
      diagnosisCode: '',
      diagnosisDetail: '',
      aiAnalysis: null,
      treatmentPlan: null,
      prescriptions: [],
      treatmentHistory: [
        {
          id: `th-${Date.now()}`,
          date: recordData.date || new Date().toLocaleDateString('vi-VN'),
          procedure: 'Tiếp nhận khám & Đo chỉ số sinh tồn',
          performedBy: 'Lễ tân Hoàng Anh',
          role: 'Lễ tân',
          result: `Sinh hiệu: HA ${recordData.vitalSigns.bloodPressure.replace(/\s/g, '')}, NT ${recordData.vitalSigns.temperature}°C, SpO2 ${recordData.vitalSigns.spo2}%, Nhịp tim ${recordData.vitalSigns.pulse} l/p`,
          duration: '5 phút',
        }
      ],
      beforeAfterImages: [],
      followUps: [],
      notes: recordData.notes || '',
      technicianNotes: '',
    };

    list.unshift(newRecord);
    this.save(list);

    // Hybrid Sync to Supabase in the background
    const dbPayload = {
      id: newRecord.id,
      patient_id: newRecord.patientId,
      appointment_id: newRecord.appointmentId || null,
      date: newRecord.date,
      time: newRecord.time,
      doctor_id: newRecord.doctorId,
      doctor: newRecord.doctor,
      specialty: newRecord.specialty,
      service: newRecord.service,
      fee: newRecord.fee,
      payment_status: newRecord.paymentStatus,
      status: newRecord.status,
      symptoms: newRecord.symptoms,
      vital_signs: newRecord.vitalSigns,
      notes: newRecord.notes
    };
    this.create(dbPayload).catch(e => console.warn('Background Supabase sync failed (addRecord):', e.message));

    return newRecord;
  },

  updateRecord(recordId, recordData) {
    const list = this.getAllSync();
    const idx = list.findIndex(r => r.id === recordId);
    if (idx === -1) {
      throw new Error('Không tìm thấy bệnh án cần cập nhật.');
    }

    const record = list[idx];
    if (record.status !== 'pending_doctor') {
      throw new Error('Bệnh án này đã được bác sĩ khám xong, không thể chỉnh sửa chỉ số sinh hiệu hoặc tiếp nhận.');
    }

    const validation = this.validateRecord(recordData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    list[idx] = {
      ...record,
      doctorId: recordData.doctorId || record.doctorId,
      doctor: recordData.doctorName || record.doctor,
      service: recordData.serviceName || record.service,
      symptoms: recordData.symptoms.trim(),
      notes: recordData.notes || '',
      vitalSigns: {
        weight: `${parseFloat(recordData.vitalSigns.weight)} kg`,
        height: `${parseFloat(recordData.vitalSigns.height)} cm`,
        bloodPressure: `${recordData.vitalSigns.bloodPressure.replace(/\s/g, '')} mmHg`,
        pulse: `${parseInt(recordData.vitalSigns.pulse, 10)} lần/phút`,
        temperature: `${parseFloat(recordData.vitalSigns.temperature)}°C`,
        spo2: `${parseInt(recordData.vitalSigns.spo2, 10)}%`,
      },
      treatmentHistory: [
        ...record.treatmentHistory,
        {
          id: `th-${Date.now()}`,
          date: new Date().toLocaleDateString('vi-VN'),
          procedure: 'Chỉnh sửa chỉ số sinh tồn & tiếp nhận',
          performedBy: 'Lễ tân Hoàng Anh',
          role: 'Lễ tân',
          result: `Cập nhật: HA ${recordData.vitalSigns.bloodPressure.replace(/\s/g, '')}, NT ${recordData.vitalSigns.temperature}°C, SpO2 ${recordData.vitalSigns.spo2}%, Nhịp tim ${recordData.vitalSigns.pulse} l/p`,
          duration: '5 phút',
        }
      ]
    };

    this.save(list);

    // Hybrid Sync to Supabase in the background
    supabase
      .from('medical_records')
      .update({
        doctor_id: list[idx].doctorId,
        doctor: list[idx].doctor,
        service: list[idx].service,
        symptoms: list[idx].symptoms,
        notes: list[idx].notes,
        vital_signs: list[idx].vitalSigns
      })
      .eq('id', recordId)
      .then(({ error }) => {
        if (error) console.warn('Background Supabase sync failed (updateRecord):', error.message);
      });

    return list[idx];
  }
};
