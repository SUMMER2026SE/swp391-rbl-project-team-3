import { useState, useEffect } from 'react';
import { DoctorModel } from '../models/DoctorModel';

export function useDoctorController() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await DoctorModel.getAllDoctors();
      setDoctors(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const getDoctors = async () => {
    return await DoctorModel.getAllDoctors();
  };

  const getDoctorDetails = async (id) => {
    return await DoctorModel.getDoctorById(id);
  };

  return {
    doctors,
    isLoading,
    error,
    refresh: fetchDoctors,
    getDoctors,
    getDoctorDetails
  };
}
