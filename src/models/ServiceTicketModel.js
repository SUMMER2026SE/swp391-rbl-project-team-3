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

  // Pending + in-progress + completed tickets, so the Technician portal can render
  // its claimed ("Đang tiến hành") work AND the "Đã hoàn thành" rows for review
  // alongside the open queue. IN_PROGRESS is what makes a claim survive a refresh.
  async getActiveTickets() {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*, appointment:appointments(patient_id, patient_name, doctor_id, appointment_date, start_time)')
        .in('status', ['PENDING', 'IN_PROGRESS', 'TECH_COMPLETED'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return await this.populateDetails(data || []);
    } catch (e) {
      console.error('Supabase fetch error (active service_tickets):', e.message);
      return [];
    }
  },

  // Atomically claim a ticket for a technician. The `.eq('status','PENDING')`
  // guard makes this a single conditional UPDATE: if two technicians race, only
  // the first matches a PENDING row — the loser gets an empty result (null) and
  // is told the ticket was already taken. Persists technician_id so the claim
  // (status IN_PROGRESS) is owned and survives a page refresh.
  async claim(id, technicianId) {
    const { data, error } = await supabase
      .from('service_tickets')
      .update({
        status: 'IN_PROGRESS',
        technician_id: technicianId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'PENDING')
      .select();
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null; // null → already claimed by someone else
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

  // Throws on failure. Swallowing the error here used to let the Technician see
  // "Kết quả thủ thuật đã được ghi nhận!" while nothing was written and the
  // doctor kept waiting on a result that never arrived.
  async update(id, updates) {
    const { data, error } = await supabase
      .from('service_tickets')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(`Không cập nhật được chỉ định #${id} (không có dòng nào được ghi).`);
    }
    return data[0];
  }
};
