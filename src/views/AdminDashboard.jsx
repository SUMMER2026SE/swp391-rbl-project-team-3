import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Ticket,
  Calendar,
  Clock,
  Star,
  TrendingUp,
} from 'lucide-react';
import AdminOverview from '../components/Admin/AdminOverview';
import EmployeeManagement from '../components/Admin/EmployeeManagement';
import FeedbackDashboard from '../components/Admin/FeedbackDashboard';
import ServiceManagement from '../components/Admin/ServiceManagement';
import DoctorScheduleManagement from '../components/Admin/DoctorScheduleManagement';
import ConsultationTimeManagement from '../components/Admin/ConsultationTimeManagement';
import VoucherManagement from '../components/Admin/VoucherManagement';
import ReportsPage from '../components/Admin/ReportsPage';
import DashboardShell from '../components/ui/DashboardShell';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'employees', label: 'Quản lý Nhân sự', icon: Users },
    { id: 'services', label: 'Quản lý Dịch vụ', icon: Stethoscope },
    { id: 'doctorSchedule', label: 'Lịch bác sĩ', icon: Calendar },
    { id: 'consultationTime', label: 'Khung giờ khám', icon: Clock },
    { id: 'vouchers', label: 'Quản lý Voucher', icon: Ticket },
    { id: 'feedback', label: 'Đánh giá', icon: Star },
    { id: 'reports', label: 'Doanh thu & Báo cáo', icon: TrendingUp },
  ];

  const pageTitles = {
    overview: 'Tổng quan',
    employees: 'Quản lý Nhân sự',
    services: 'Quản lý Dịch vụ',
    doctorSchedule: 'Lịch bác sĩ',
    consultationTime: 'Khung giờ khám',
    vouchers: 'Quản lý Voucher',
    feedback: 'Đánh giá',
    reports: 'Doanh thu & Báo cáo',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview onNavigate={setActiveTab} />;
      case 'employees':
        return <EmployeeManagement />;
      case 'services':
        return <ServiceManagement />;
      case 'doctorSchedule':
        return <DoctorScheduleManagement />;
      case 'consultationTime':
        return <ConsultationTimeManagement />;
      case 'vouchers':
        return <VoucherManagement />;
      case 'feedback':
        return <FeedbackDashboard />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <AdminOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <DashboardShell
      portalName="Admin Portal"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageTitles[activeTab] || 'Tổng quan'}
      searchPlaceholder="Tìm kiếm thông tin, bệnh nhân, nhân viên..."
    >
      {renderContent()}
    </DashboardShell>
  );
};

export default AdminDashboard;
