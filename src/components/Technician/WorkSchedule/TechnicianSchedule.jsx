import React from 'react';
import ShiftCalendarView from '../../common/ShiftCalendarView';

// Technician work schedule — technicians share the doctor_shifts table, so the
// shared shift calendar handles fetching/confirming with technicianId as staffId.
export default function TechnicianSchedule({ technicianId }) {
    return <ShiftCalendarView staffId={technicianId} />;
}
