import { doctors } from '../mockData';

export const DoctorModel = {
  getAllDoctors() {
    return doctors;
  },

  getDoctorById(id) {
    const doctor = doctors.find(d => d.id === id);
    return doctor || null;
  }
};
