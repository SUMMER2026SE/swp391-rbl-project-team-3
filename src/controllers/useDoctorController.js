import { DoctorModel } from '../models/DoctorModel';

export function useDoctorController() {
  const getDoctors = () => {
    return DoctorModel.getAllDoctors();
  };

  const getDoctorDetails = (id) => {
    return DoctorModel.getDoctorById(id);
  };

  return {
    getDoctors,
    getDoctorDetails
  };
}
