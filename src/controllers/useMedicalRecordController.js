import { MedicalRecordModel } from '../models/MedicalRecordModel';

/**
 * Controller hook cho chức năng hồ sơ bệnh án
 * @param {string|null} patientId - ID bệnh nhân (lọc hồ sơ theo bệnh nhân)
 */
export function useMedicalRecordController(patientId = null) {
  const getRecords = () => {
    if (patientId) {
      return MedicalRecordModel.getByPatientId(patientId);
    }
    return MedicalRecordModel.getAll();
  };

  const getRecordById = (recordId) => {
    return MedicalRecordModel.getWithPatientInfo(recordId);
  };

  const getPatientAge = (dob) => {
    return MedicalRecordModel.calculateAge(dob);
  };

  return {
    getRecords,
    getRecordById,
    getPatientAge,
  };
}
