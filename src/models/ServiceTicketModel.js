import { supabase } from '../supabaseClient';

export const ServiceTicketModel = {
  async getByAppointmentId(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (service_tickets):', e.message);
      return [];
    }
  },

  async populateDetails(tickets) {
    if (!tickets || tickets.length === 0) return tickets;

    const patientIds = Array.from(new Set(tickets.map(t => t.appointment?.patient_id).filter(Boolean)));
    const doctorIds = Array.from(new Set(tickets.map(t => t.appointment?.doctor_id).filter(Boolean)));

    let patientMap = {};
    if (patientIds.length > 0) {
      try {
        const { data: patientsData } = await supabase
          .from('users')
          .select('user_id, gender, date_of_birth')
          .in('user_id', patientIds);
        if (patientsData) {
          patientsData.forEach(p => {
            patientMap[p.user_id] = p;
          });
        }
      } catch (e) {
        console.error('Error populating patient details for tickets:', e);
      }
    }

    let doctorMap = {};
    if (doctorIds.length > 0) {
      try {
        const { data: doctorsData } = await supabase
          .from('users')
          .select('user_id, full_name')
          .in('user_id', doctorIds);
        if (doctorsData) {
          doctorsData.forEach(d => {
            doctorMap[d.user_id] = d.full_name;
          });
        }
      } catch (e) {
        console.error('Error populating doctor details for tickets:', e);
      }
    }

    tickets.forEach(t => {
      if (t.appointment) {
        const pId = t.appointment.patient_id;
        if (pId && patientMap[pId]) {
          t.appointment.patient_gender = patientMap[pId].gender;
          t.appointment.patient_dob = patientMap[pId].date_of_birth;
        }
        
        const dId = t.appointment.doctor_id;
        if (dId && doctorMap[dId]) {
          t.appointment.doctor_name = doctorMap[dId];
        }
      }
    });

    return tickets;
  },

  // Tickets the Technician still has to act on. The patient name lives directly
  // on the appointments row (patient_name), so we embed that instead of the
  // non-existent patient_profiles.full_name column.
  async getPendingTickets() {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*, appointment:appointments(patient_id, patient_name, doctor_id, appointment_date, start_time)')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return await this.populateDetails(data || []);
    } catch (e) {
      console.error('Supabase fetch error (pending service_tickets):', e.message);
      return [];
    }
  },

  // Pending + completed tickets, so the Technician portal can also render the
  // "Đã hoàn thành" rows for review (read-only) alongside the active queue.
  async getActiveTickets() {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*, appointment:appointments(patient_id, patient_name, doctor_id, appointment_date, start_time)')
        .in('status', ['PENDING', 'TECH_COMPLETED'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return await this.populateDetails(data || []);
    } catch (e) {
      console.error('Supabase fetch error (active service_tickets):', e.message);
      return [];
    }
  },

  async create(ticketData) {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .insert([ticketData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (service_tickets):', e.message);
      return null;
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase update error (service_tickets):', e.message);
      return null;
    }
  }
};
