import React from 'react';
import ShiftCalendarView from '../common/ShiftCalendarView';

// Doctor work schedule — thin wrapper over the shared shift calendar so
// Doctor & Technician portals render the exact same week/month calendar UX.
export default function WorkSchedule({ doctorId }) {
    return <ShiftCalendarView staffId={doctorId} />;
}
