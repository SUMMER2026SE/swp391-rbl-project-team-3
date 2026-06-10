import { mockPatients } from '../mockData';

const STORAGE_KEY = 'dermasmart_patients';
const VERSION_KEY = 'dermasmart_patients_version';
const CURRENT_VERSION = 'v1';

export const PatientModel = {
  init() {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored || storedVersion !== CURRENT_VERSION) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPatients));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
  },

  getAll() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      console.error('Error reading patients from localStorage', e);
      return mockPatients;
    }
  },

  save(patients) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    window.dispatchEvent(new CustomEvent('patients-updated'));
  },

  getById(id) {
    const list = this.getAll();
    return list.find(p => p.id === id) || null;
  },

  getByPhone(phone) {
    const list = this.getAll();
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    return list.find(p => p.phone.replace(/[\s.-]/g, '') === cleanPhone) || null;
  },

  validate(patientData) {
    const { fullName, phone, dob, email, address } = patientData;

    // 1. Validate Full Name
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 4) {
      return { valid: false, error: 'Họ và tên phải dài từ 4 ký tự trở lên.' };
    }
    const nameRegex = /^[a-zA-Z\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+$/;
    if (!nameRegex.test(fullName.trim())) {
      return { valid: false, error: 'Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng.' };
    }
    const words = fullName.trim().split(/\s+/);
    if (words.length < 2) {
      return { valid: false, error: 'Họ và tên phải bao gồm ít nhất 2 từ (Họ và Tên).' };
    }

    // 2. Validate Phone Number (VN format)
    if (!phone || typeof phone !== 'string') {
      return { valid: false, error: 'Số điện thoại là bắt buộc.' };
    }
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { valid: false, error: 'Số điện thoại không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng đầu số di động Việt Nam (03, 05, 07, 08, 09).' };
    }

    // Check Uniqueness
    const existing = this.getByPhone(phone);
    if (existing && existing.id !== patientData.id) {
      return { valid: false, error: `Số điện thoại này đã được đăng ký cho bệnh nhân: ${existing.fullName} (ID: ${existing.id}).`, duplicatePatient: existing };
    }

    // 3. Validate Date of Birth
    if (!dob) {
      return { valid: false, error: 'Ngày sinh là bắt buộc.' };
    }
    const birthDate = new Date(dob);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow registration today
    if (birthDate > today) {
      return { valid: false, error: 'Ngày sinh không thể ở tương lai.' };
    }
    
    // Calculate precise age
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age > 120) {
      return { valid: false, error: 'Tuổi của bệnh nhân không thể lớn hơn 120.' };
    }

    // Enforce Guardian if minor
    if (age < 18) {
      const { guardianName, guardianPhone, guardianRelation } = patientData;
      if (!guardianName || typeof guardianName !== 'string' || guardianName.trim().length < 4) {
        return { valid: false, error: 'Bệnh nhân dưới 18 tuổi. Họ tên người giám hộ là bắt buộc và phải từ 4 ký tự trở lên.' };
      }
      if (!nameRegex.test(guardianName.trim())) {
        return { valid: false, error: 'Họ và tên người giám hộ chỉ được chứa chữ cái tiếng Việt và khoảng trắng.' };
      }
      const gWords = guardianName.trim().split(/\s+/);
      if (gWords.length < 2) {
        return { valid: false, error: 'Họ và tên người giám hộ phải bao gồm ít nhất 2 từ.' };
      }

      if (!guardianPhone || typeof guardianPhone !== 'string') {
        return { valid: false, error: 'Bệnh nhân dưới 18 tuổi. Số điện thoại người giám hộ là bắt buộc.' };
      }
      const cleanGPhone = guardianPhone.replace(/[\s.-]/g, '');
      if (!phoneRegex.test(cleanGPhone)) {
        return { valid: false, error: 'Số điện thoại người giám hộ không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng các đầu số Việt Nam di động.' };
      }

      if (!guardianRelation || typeof guardianRelation !== 'string' || guardianRelation.trim() === '') {
        return { valid: false, error: 'Bệnh nhân dưới 18 tuổi. Mối quan hệ của người giám hộ với bệnh nhân là bắt buộc.' };
      }
    }

    // 4. Validate Email (Optional)
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return { valid: false, error: 'Định dạng Email không hợp lệ.' };
      }
    }

    // 5. Validate Address
    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return { valid: false, error: 'Địa chỉ là bắt buộc và phải dài từ 5 ký tự trở lên.' };
    }

    return { valid: true };
  },

  addPatient(patientData) {
    const validation = this.validate(patientData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const birthDate = new Date(patientData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const patients = this.getAll();
    const newId = patientData.id || `pat-${Date.now()}`;
    const newPatient = {
      id: newId,
      fullName: patientData.fullName.trim(),
      phone: patientData.phone.replace(/[\s.-]/g, ''),
      email: patientData.email ? patientData.email.trim() : '',
      gender: patientData.gender || 'Khác',
      dob: patientData.dob,
      address: patientData.address.trim(),
      avatar: patientData.avatar || `https://i.pravatar.cc/150?u=${newId}`,
      medicalHistory: patientData.medicalHistory || [],
      created_at: new Date().toISOString(),
      ...(age < 18 ? {
        guardianName: patientData.guardianName.trim(),
        guardianPhone: patientData.guardianPhone.replace(/[\s.-]/g, ''),
        guardianRelation: patientData.guardianRelation.trim()
      } : {})
    };

    patients.push(newPatient);
    this.save(patients);
    return newPatient;
  },

  updatePatient(id, patientData) {
    const validation = this.validate({ ...patientData, id });
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const birthDate = new Date(patientData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const patients = this.getAll();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy bệnh nhân cần cập nhật.');
    }

    const updatedPatient = {
      ...patients[index],
      fullName: patientData.fullName.trim(),
      phone: patientData.phone.replace(/[\s.-]/g, ''),
      email: patientData.email ? patientData.email.trim() : '',
      gender: patientData.gender || 'Khác',
      dob: patientData.dob,
      address: patientData.address.trim(),
      medicalHistory: patientData.medicalHistory || [],
      updated_at: new Date().toISOString(),
      ...(age < 18 ? {
        guardianName: patientData.guardianName.trim(),
        guardianPhone: patientData.guardianPhone.replace(/[\s.-]/g, ''),
        guardianRelation: patientData.guardianRelation.trim()
      } : {
        guardianName: undefined,
        guardianPhone: undefined,
        guardianRelation: undefined
      })
    };

    if (age >= 18) {
      delete updatedPatient.guardianName;
      delete updatedPatient.guardianPhone;
      delete updatedPatient.guardianRelation;
    }

    patients[index] = updatedPatient;
    this.save(patients);
    return updatedPatient;
  }
};
