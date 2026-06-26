/**
 * useProfileData.js
 * ───────────────────────────────────────────────────────────────────────────
 * Custom React hook that fetches the authenticated user's real profile from Supabase
 * and transforms it into a stable, presentation-ready view-model.
 *
 * Employs strict ZERO MOCK DATA policy. Uses empty states for missing values.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { ProfileModel } from '../../models/ProfileModel';
import { ROLE_DISPLAY_NAMES } from './profileConfig';

export function normalizeProfileData(realData, userRole, metricsInput = null) {
  if (!realData) return null;
  
  let visitsCount = 0;
  let staffMetrics = null;
  if (typeof metricsInput === 'number') {
    visitsCount = metricsInput;
  } else if (metricsInput && typeof metricsInput === 'object') {
    visitsCount = metricsInput.visits || 0;
    staffMetrics = metricsInput;
  }
  
  const base = {
    id: realData.id,
    role: userRole,
    roleLabel: ROLE_DISPLAY_NAMES[userRole] || userRole,
    name: realData.name || '',
    email: realData.email || '',
    phone: realData.phone || '',
    avatar: realData.avatar || null,
    initials: (realData.name || 'U').trim().charAt(0).toUpperCase(),
    status: realData.status === 'ACTIVE' || realData.status === 'Hoạt động' ? 'Hoạt động' : (realData.status || ''),
    code: realData.id ? realData.id.split('-')[0].toUpperCase() : '',
    memberSince: realData.created_at ? new Date(realData.created_at).toLocaleDateString('vi-VN') : '',
  };

  if (realData.kind === 'staff') {
    return {
      ...base,
      kind: 'staff',
      employeeId: realData.id ? realData.id.split('-')[0].toUpperCase() : '',
      department: realData.department || '',
      specialization: realData.specialization || '',
      schedule: realData.schedule || '',
      metrics: staffMetrics || {},
    };
  } else {
    const vitals = {
      bloodType: realData.bloodType || null,
      height: realData.height || null,
      weight: realData.weight || null,
      allergies: realData.allergies || (realData.allergyNote ? realData.allergyNote.split(',')?.map?.(s => s.trim()) : null),
    };

    let medicalHistory = [];
    if (realData.medicalHistory) {
      const conditions = Array.isArray(realData.medicalHistory)
        ? realData.medicalHistory
        : realData.medicalHistory.split(',')?.map?.(s => s.trim());
      
      medicalHistory = conditions?.filter(Boolean)?.map?.((condition) => {
        const match = /nặng|vảy nến|mãn/i.test(condition);
        return {
          condition,
          severity: match ? 'Nặng' : 'Đang theo dõi',
          tone: match ? 'rose' : 'sky',
          note: 'Ghi nhận trong hồ sơ bệnh án hệ thống.'
        };
      });
    }

    return {
      ...base,
      kind: 'patient',
      gender: realData.gender || '',
      dob: realData.dob || '',
      address: realData.address || '',
      medical: {
        vitals,
        medicalHistory,
        clinicalHistory: [],
        activeTreatments: [],
      },
      metrics: {
        visits: visitsCount
      }
    };
  }
}

export function useProfileData(authUser) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    if (!authUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Get the active user's UUID and Role from Supabase Auth session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user found');

      const userRole = authUser?.role || 'PATIENT';
      
      // 2. Fetch the real profile using ProfileModel
      const realData = await ProfileModel.getProfile(user.id, userRole);

      // 3. Fetch real metrics from Supabase (e.g., patient or staff stats)
      let metricsData = {};
      if (userRole === 'PATIENT') {
        const { count, error: countError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id)
          .in('status', ['Đã khám', 'Reviewed', 'Đã thanh toán']);
        if (!countError && count !== null) {
          metricsData.visits = count;
        }
      } else if (userRole === 'DOCTOR') {
        // Ca khám thành công
        const { count: successCount, error: err1 } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', user.id)
          .in('status', ['Đã khám', 'Reviewed']);

        // Đánh giá trung bình
        const { data: feedbacks, error: err2 } = await supabase
          .from('feedbacks')
          .select('rating')
          .eq('doctor_id', user.id);
        
        let avgRating = 0;
        if (!err2 && feedbacks && feedbacks.length > 0) {
          const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
          avgRating = (sum / feedbacks.length).toFixed(1);
        }

        // Giờ làm việc thực tế (Confirmed shifts in the past or today)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const { data: shifts, error: err3 } = await supabase
          .from('doctor_shifts')
          .select('start_time, end_time')
          .eq('doctor_id', user.id)
          .eq('status', 'Đã xác nhận')
          .lte('work_date', todayStr);
        
        let workHours = 0;
        if (!err3 && shifts && shifts.length > 0) {
          const parseTimeToHours = (t) => {
            if (!t) return 0;
            const [h, m] = t.split(':').map(Number);
            return h + (m || 0) / 60;
          };
          workHours = shifts.reduce((acc, s) => {
            const diff = parseTimeToHours(s.end_time) - parseTimeToHours(s.start_time);
            return acc + (diff > 0 ? diff : 0);
          }, 0);
        }

        metricsData = {
          successVisits: successCount || 0,
          avgRating: avgRating > 0 ? `${avgRating}/5` : 'Chưa có',
          workHours: workHours > 0 ? `${Math.round(workHours)} giờ` : '0 giờ',
        };
      } else if (userRole === 'TECHNICIAN') {
        // Thủ thuật hoàn tất & Giờ làm việc thực tế
        // Tính dựa trên các service_tickets đã hoàn thành (TECH_COMPLETED)
        const { data: completedTickets, error: errTech } = await supabase
          .from('service_tickets')
          .select('created_at, updated_at')
          .eq('technician_id', user.id)
          .eq('status', 'TECH_COMPLETED');

        let workHours = 0;
        let successCount = 0;

        if (!errTech && completedTickets) {
          successCount = completedTickets.length;
          
          workHours = completedTickets.reduce((acc, t) => {
            if (t.created_at && t.updated_at) {
              const start = new Date(t.created_at).getTime();
              const end = new Date(t.updated_at).getTime();
              const diffHours = (end - start) / (1000 * 60 * 60);
              return acc + (diffHours > 0 ? diffHours : 0);
            }
            return acc;
          }, 0);
        }

        // Round to 1 decimal place if needed, or Math.round
        const formattedHours = workHours > 0 
          ? `${workHours < 1 ? workHours.toFixed(1) : Math.round(workHours)} giờ` 
          : '0 giờ';

        metricsData = {
          successVisits: successCount,
          workHours: formattedHours,
        };
      }

      // 4. Transform raw database profile into UI view-model
      const transformed = normalizeProfileData(realData, userRole, metricsData);

      // 5. Fetch clinical history and prescriptions for patient
      if (userRole === 'PATIENT' && transformed?.medical) {
        try {
          const { data: recordsData, error: recordsError } = await supabase
            .from('medical_records')
            .select(`
              record_id,
              appointment_id,
              diagnosis,
              symptoms,
              doctor_note,
              created_at,
              doctor:users!medical_records_doctor_id_users_fkey (
                full_name
              )
            `)
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false });

          if (!recordsError && recordsData) {
            const clinicalHistory = recordsData.map(rec => ({
              id: rec.record_id,
              date: new Date(rec.created_at).toLocaleDateString('vi-VN'),
              specialty: 'Da liễu',
              doctor: rec.doctor?.full_name || 'Bác sĩ',
              diagnosis: rec.diagnosis || 'Chưa ghi nhận',
              diagnosisCode: '',
              prescriptions: [],
              record: {
                id: rec.record_id,
                appointmentId: rec.appointment_id,
                date: new Date(rec.created_at).toLocaleDateString('vi-VN'),
                specialty: 'Da liễu',
                doctor: rec.doctor?.full_name || 'Bác sĩ',
                doctorName: rec.doctor?.full_name || 'Bác sĩ',
                diagnosis: rec.diagnosis || 'Chưa ghi nhận',
                symptoms: rec.symptoms || 'Chưa ghi nhận',
                doctorNote: rec.doctor_note || 'Chưa ghi nhận',
                notes: rec.doctor_note || '',
                vitalSigns: {
                  weight: transformed.medical?.vitals?.weight ? `${transformed.medical.vitals.weight} kg` : '—',
                  height: transformed.medical?.vitals?.height ? `${transformed.medical.vitals.height} cm` : '—',
                  bloodPressure: '—',
                  pulse: '—',
                  temperature: '—',
                  spo2: '—'
                },
                paymentStatus: 'Đã thanh toán',
                patient: {
                  id: transformed.id,
                  fullName: transformed.name,
                  gender: transformed.gender,
                  dob: transformed.dob,
                  phone: transformed.phone,
                  email: transformed.email,
                  address: transformed.address,
                  avatar: transformed.avatar
                },
                prescriptions: [],
                followUps: [],
                treatmentHistory: []
              }
            }));

            // Fetch prescriptions for these records
            if (clinicalHistory.length > 0) {
              const recordIds = clinicalHistory.map(c => c.id);
              const { data: presData, error: presError } = await supabase
                .from('prescriptions')
                .select(`
                  record_id,
                  prescription_details (
                    dosage,
                    frequency,
                    duration,
                    instruction,
                    quantity,
                    medicine:medicines (medicine_name)
                  )
                `)
                .in('record_id', recordIds);

              if (!presError && presData) {
                presData.forEach(p => {
                  const historyItem = clinicalHistory.find(c => c.id === p.record_id);
                  if (historyItem) {
                    const mappedPres = (p.prescription_details || []).map(d => ({
                      name: d.medicine?.medicine_name || 'Thuốc',
                      type: 'Thuốc',
                      dosage: d.dosage || '',
                      frequency: d.frequency || '',
                      duration: d.duration || '',
                      instructions: d.instruction || '',
                      quantity: d.quantity || ''
                    }));
                    historyItem.prescriptions = mappedPres;
                    historyItem.record.prescriptions = mappedPres;
                  }
                });
              }
            }

            // Fetch service tickets (indications/procedures) for these appointments
            const appointmentIds = clinicalHistory.map(c => c.record.appointmentId).filter(Boolean);
            if (appointmentIds.length > 0) {
              const { data: ticketsData, error: ticketsError } = await supabase
                .from('service_tickets')
                .select(`
                  id,
                  appointment_id,
                  service_name,
                  status,
                  doctor_note,
                  result_notes,
                  updated_at,
                  technician_id
                `)
                .in('appointment_id', appointmentIds);

              if (!ticketsError && ticketsData) {
                // Fetch unique technicians
                const techIds = Array.from(new Set(ticketsData.map(t => t.technician_id).filter(Boolean)));
                let techMap = {};
                if (techIds.length > 0) {
                  const { data: usersData } = await supabase
                    .from('users')
                    .select('user_id, full_name')
                    .in('user_id', techIds);
                  if (usersData) {
                    usersData.forEach(u => {
                      techMap[u.user_id] = u.full_name;
                    });
                  }
                }

                // Map tickets to each clinicalHistory item's record
                ticketsData.forEach(t => {
                  const historyItem = clinicalHistory.find(c => String(c.record.appointmentId) === String(t.appointment_id));
                  if (historyItem) {
                    if (!historyItem.record.treatmentHistory) {
                      historyItem.record.treatmentHistory = [];
                    }
                    // Prevent duplicate ticket inserts
                    const exists = historyItem.record.treatmentHistory.some(existingT => String(existingT.id) === String(t.id));
                    if (!exists) {
                      historyItem.record.treatmentHistory.push({
                        id: t.id,
                        procedure: t.service_name || 'Liệu trình điều trị',
                        duration: t.status === 'TECH_COMPLETED' && t.updated_at 
                          ? new Date(t.updated_at).toLocaleDateString('vi-VN') 
                          : (t.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Đang chờ thực hiện'),
                        performedBy: t.technician_id ? (techMap[t.technician_id] || 'Kỹ thuật viên') : 'Chưa phân công',
                        role: 'Kỹ thuật viên',
                        result: t.result_notes || t.doctor_note || 'Chưa ghi nhận kết quả.'
                      });
                    }
                  }
                });
              }
            }

            // Fetch follow-up appointments (Tái khám) for patient
            const { data: followUpsData, error: followUpsError } = await supabase
              .from('appointments')
              .select(`
                appointment_id,
                appointment_date,
                start_time,
                status,
                service,
                reason,
                doctor_id
              `)
              .eq('patient_id', user.id)
              .ilike('service', 'tái khám');

            if (!followUpsError && followUpsData) {
              // Fetch unique doctors for followups
              const docIds = Array.from(new Set(followUpsData.map(f => f.doctor_id).filter(Boolean)));
              let docMap = {};
              if (docIds.length > 0) {
                const { data: usersData } = await supabase
                  .from('users')
                  .select('user_id, full_name')
                  .in('user_id', docIds);
                if (usersData) {
                  usersData.forEach(u => {
                    docMap[u.user_id] = u.full_name;
                  });
                }
              }

              // Map each follow-up to the format expected by FollowUpTab in MedicalRecordDetailModal:
              const mappedFollowUps = followUpsData.map(f => ({
                id: f.appointment_id,
                type: 'Tái khám',
                date: f.appointment_date ? new Date(f.appointment_date).toLocaleDateString('vi-VN') : '—',
                doctor: f.doctor_id ? (docMap[f.doctor_id] || 'Bác sĩ') : 'Bác sĩ',
                status: f.status === 'Đã khám' || f.status === 'Reviewed' || f.status === 'Đã thanh toán' 
                  ? 'Hoàn thành' 
                  : (f.status === 'Đã hủy' ? 'Đã hủy' : 'Sắp tới'),
                notes: f.reason || 'Tái khám định kỳ.'
              }));

              // Associate each follow-up with the closest medical record that happened on or before its date
              mappedFollowUps.forEach(fu => {
                const rawFu = followUpsData.find(f => f.appointment_id === fu.id);
                if (!rawFu || !rawFu.appointment_date) return;
                const fuDate = new Date(rawFu.appointment_date);
                
                let closestRecord = null;
                let minDiff = Infinity;
                
                clinicalHistory.forEach(ch => {
                  const [d, m, y] = ch.date.split('/').map(Number);
                  const chDate = new Date(y, m - 1, d);
                  
                  const diff = fuDate.getTime() - chDate.getTime();
                  if (diff >= 0 && diff < minDiff) {
                    minDiff = diff;
                    closestRecord = ch;
                  }
                });

                if (closestRecord) {
                  if (!closestRecord.record.followUps) {
                    closestRecord.record.followUps = [];
                  }
                  const exists = closestRecord.record.followUps.some(existingFu => String(existingFu.id) === String(fu.id));
                  if (!exists) {
                    closestRecord.record.followUps.push(fu);
                  }
                }
              });
            }

            transformed.medical.clinicalHistory = clinicalHistory;
          }
        } catch (fetchErr) {
          console.warn('Error fetching clinical history:', fetchErr);
        }
      }

      setProfile(transformed);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [authUser?.id]);

  return { profile, isLoading, error, setProfile, refresh: fetchProfile };
}
