import { useState, useEffect, useRef, useCallback } from 'react';
import { MedicalRecordModel } from '../models/MedicalRecordModel';
import { PatientModel } from '../models/PatientModel';

function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|ã|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Combine diacritics
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return str;
}

/**
 * Controller hook cho chức năng hồ sơ bệnh án & bệnh nhân
 * @param {string|null} patientId - ID bệnh nhân (lọc hồ sơ theo bệnh nhân)
 */
export function useMedicalRecordController(patientId = null) {
  const patientIdRef = useRef(patientId);
  patientIdRef.current = patientId;

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState(() => PatientModel.getAll());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data = [];
      if (patientIdRef.current) {
        data = await MedicalRecordModel.getByPatientId(patientIdRef.current);
      } else {
        data = await MedicalRecordModel.getAll();
      }
      setRecords(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshState = useCallback(() => {
    fetchRecords();
    setPatients(PatientModel.getAll());
  }, []);

  useEffect(() => {
    fetchRecords();
    setPatients(PatientModel.getAll());
  }, [patientId]);

  useEffect(() => {
    const handleRecordsUpdate = () => {
      refreshState();
    };
    const handlePatientsUpdate = () => {
      refreshState();
    };

    window.addEventListener('medical-records-updated', handleRecordsUpdate);
    window.addEventListener('patients-updated', handlePatientsUpdate);

    return () => {
      window.removeEventListener('medical-records-updated', handleRecordsUpdate);
      window.removeEventListener('patients-updated', handlePatientsUpdate);
    };
  }, [refreshState]);

  const getRecords = useCallback(async () => {
    if (patientId) {
      return await MedicalRecordModel.getByPatientId(patientId);
    }
    return await MedicalRecordModel.getAll();
  }, [patientId]);

  const getRecordById = useCallback(async (recordId) => {
    return await MedicalRecordModel.getById(recordId);
  }, []);

  const getPatientAge = useCallback((dob) => {
    return MedicalRecordModel.calculateAge(dob);
  }, []);

  const addPatient = useCallback((patientData) => {
    return PatientModel.addPatient(patientData);
  }, []);

  const addRecord = useCallback((recordData) => {
    return MedicalRecordModel.addRecord(recordData);
  }, []);

  const updateRecord = useCallback((recordId, recordData) => {
    return MedicalRecordModel.updateRecord(recordId, recordData);
  }, []);

  const updatePatient = useCallback((id, patientData) => {
    return PatientModel.updatePatient(id, patientData);
  }, []);

  const validatePatient = useCallback((patientData) => {
    return PatientModel.validate(patientData);
  }, []);

  const validateRecord = useCallback((recordData) => {
    return MedicalRecordModel.validateRecord(recordData);
  }, []);

  const getPatientRecords = useCallback((id) => {
    // Falls back to sync filtering if offline, otherwise relies on records state
    const all = MedicalRecordModel.getAllSync();
    return all.filter(r => r.patientId === id);
  }, []);

  const searchPatients = useCallback((query) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return PatientModel.getAll();

    const qNoTone = removeVietnameseTones(q);

    let phoneQuery = q.replace(/[\s.-]/g, '');
    if (phoneQuery.startsWith('+84')) {
      phoneQuery = '0' + phoneQuery.slice(3);
    } else if (phoneQuery.startsWith('84') && phoneQuery.length > 9) {
      phoneQuery = '0' + phoneQuery.slice(2);
    }
    const phoneQueryDigits = phoneQuery.replace(/\D/g, '');

    const digitsOnly = q.replace(/\D/g, '');
    let parsedDobParts = null;
    const dateDotted = q.replace(/[-\s.]/g, '/');
    const dobRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const dobMatch = dateDotted.match(dobRegex);
    if (dobMatch) {
      const day = dobMatch[1].padStart(2, '0');
      const month = dobMatch[2].padStart(2, '0');
      const year = dobMatch[3];
      parsedDobParts = `${year}-${month}-${day}`;
    } else if (digitsOnly.length === 8) {
      const day = digitsOnly.slice(0, 2);
      const month = digitsOnly.slice(2, 4);
      const year = digitsOnly.slice(4, 8);
      parsedDobParts = `${year}-${month}-${day}`;
    }

    return PatientModel.getAll().filter(p => {
      const nameLower = p.fullName.toLowerCase();
      const nameNoTone = removeVietnameseTones(nameLower);
      const emailLower = (p.email || '').toLowerCase();
      const idLower = p.id.toLowerCase();
      
      const patientPhoneClean = p.phone.replace(/[\s.-]/g, '');
      
      const dobStr = p.dob || '';
      const dobFormatted = dobStr.split('-').reverse().join('/');
      const dobDigits = dobStr.replace(/-/g, '');
      const dobFormattedDigits = dobFormatted.replace(/\//g, '');

      const queryWords = qNoTone.split(/\s+/).filter(w => w.length > 0);
      const isNameMatch = queryWords.length > 0 && queryWords.every(word => nameNoTone.includes(word));

      const isPhoneMatch = phoneQueryDigits.length > 0 && patientPhoneClean.includes(phoneQueryDigits);

      const isDobMatch = 
        dobStr.includes(q) || 
        dobFormatted.includes(q) || 
        (parsedDobParts && dobStr === parsedDobParts) ||
        (q.length === 4 && dobStr.startsWith(q)) ||
        (digitsOnly.length > 0 && (dobDigits.includes(digitsOnly) || dobFormattedDigits.includes(digitsOnly)));

      return (
        nameLower.includes(q) ||
        nameNoTone.includes(qNoTone) ||
        isNameMatch ||
        isPhoneMatch ||
        idLower.includes(q) ||
        emailLower.includes(q) ||
        isDobMatch
      );
    });
  }, []);

  return {
    records,
    patients,
    isLoading,
    error,
    refresh: refreshState,
    getRecords,
    getRecordById,
    getPatientAge,
    addPatient,
    updatePatient,
    addRecord,
    updateRecord,
    validatePatient,
    validateRecord,
    getPatientRecords,
    searchPatients,
    refreshState
  };
}
