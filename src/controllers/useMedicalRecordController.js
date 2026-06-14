import { useState, useEffect, useRef } from 'react';
import { MedicalRecordModel } from '../models/MedicalRecordModel';

/**
 * Controller hook cho chức năng hồ sơ bệnh án
 * @param {string|null} patientId - ID bệnh nhân (lọc hồ sơ theo bệnh nhân)
 */
export function useMedicalRecordController(patientId = null) {
  const patientIdRef = useRef(patientId);
  patientIdRef.current = patientId;

  const [records, setRecords] = useState([]);
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

  useEffect(() => {
    fetchRecords();
  }, [patientId]);

  const getRecords = async () => {
    if (patientId) {
      return await MedicalRecordModel.getByPatientId(patientId);
    }
    return await MedicalRecordModel.getAll();
  };

  const getRecordById = async (recordId) => {
    return await MedicalRecordModel.getById(recordId);
  };

  const getPatientAge = (dob) => {
    if (!dob) return null;
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  return {
    records,
    isLoading,
    error,
    refresh: fetchRecords,
    getRecords,
    getRecordById,
    getPatientAge,
  };
}
