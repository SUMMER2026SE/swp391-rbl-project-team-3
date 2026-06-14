import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit2,
  Shield,
  X,
  Mail,
  Phone,
  User,
  CheckCircle2,
  Save,
  Lock,
} from 'lucide-react';

const roles = ['Bác sĩ', 'Lễ tân', 'Kỹ thuật viên', 'Admin'];
const departments = ['Da liễu', 'Lễ tân', 'Kỹ thuật', 'Quản trị'];
const statuses = ['Hoạt động', 'Tạm khóa'];

const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('admin-employees');
    return saved ? JSON.parse(saved) : (([]) || []);
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Bác sĩ',
    department: 'Da liễu',
    status: 'Hoạt động',
  });

  const [editingEmployee, setEditingEmployee] = useState(null);

  const filteredEmployees = useMemo(() => {
    return employees?.filter?.((emp) =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, searchTerm]);

  const saveEmployees = (nextEmployees) => {
    setEmployees(nextEmployees);
    localStorage.setItem('admin-employees', JSON.stringify(nextEmployees));
  };

  const generateInitialPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `Derma@${randomDigits}`;
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'Bác sĩ',
      department: 'Da liễu',
      status: 'Hoạt động',
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setGeneratedPassword(generateInitialPassword());
    setIsAddModalOpen(true);
  };

  const handleCreateEmployee = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      alert('Vui lòng nhập đầy đủ họ tên, email và số điện thoại.');
      return;
    }

    const newEmployee = {
      id: `EMP-${Date.now()}`,
      ...form,
      initialPassword: generatedPassword,
    };

    saveEmployees([newEmployee, ...employees]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      role: emp.role || 'Bác sĩ',
      department: emp.department || 'Da liễu',
      status: emp.status || 'Hoạt động',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return;

    const nextEmployees = employees?.map?.((emp) =>
        emp.id === editingEmployee.id
            ? { ...emp, ...form }
            : emp);

    saveEmployees(nextEmployees);
    setIsEditModalOpen(false);
    setEditingEmployee(null);
    resetForm();
  };

  const handleQuickRoleChange = (employeeId, role) => {
    const nextEmployees = employees?.map?.((emp) =>
        emp.id === employeeId ? { ...emp, role } : emp);
    saveEmployees(nextEmployees);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Bác sĩ': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Lễ tân': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Kỹ thuật viên': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Admin': return 'bg-violet-50 text-violet-700 border-violet-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'Hoạt động') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-8 relative h-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Quản lý Nhân sự</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Tạo nhân viên, cập nhật thông tin, phân quyền và trạng thái tài khoản.
          </p>
        </div>
      </div>
      <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden flex flex-col">
        <div className="p-6 md:p-8 border-b border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/40">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
                type="text"
                className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all font-semibold text-slate-700 shadow-sm"
                placeholder="Tìm kiếm nhân viên theo tên, email, vai trò..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
              onClick={handleOpenAddModal}
              className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm nhân viên mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-slate-100/50 border-b border-slate-200/50">
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nhân viên</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Liên hệ</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
            {filteredEmployees?.map?.((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center text-indigo-700 font-extrabold text-lg border border-white shadow-sm mr-4 group-hover:scale-105 transition-transform">
                        {emp.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-base">{emp.name}</div>
                        <div className="text-xs font-semibold text-slate-400 mt-0.5">{emp.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-slate-700 mb-1 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-slate-400" />
                      {emp.email}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-slate-400" />
                      {emp.phone}
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <select
                        value={emp.role}
                        onChange={(e) => handleQuickRoleChange(emp.id, e.target.value)}
                        className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl border ${getRoleBadgeColor(emp.role)} shadow-sm outline-none cursor-pointer`}
                    >
                      {roles?.map?.((role) => <option key={role}>{role}</option>)}
                    </select>
                    <div className="text-xs font-semibold text-slate-500 mt-2">{emp.department}</div>
                  </td>

                  <td className="px-8 py-5">
                  <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl border ${getStatusBadgeColor(emp.status)} shadow-sm`}>
                    {emp.status === 'Hoạt động' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <Lock className="w-3.5 h-3.5 mr-1.5" />}
                    {emp.status}
                  </span>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors border border-transparent hover:border-sky-100 shadow-sm"
                          title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100 shadow-sm"
                          title="Phân quyền"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-200/50 bg-white/40 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-500">
          Hiển thị <strong className="text-slate-800">{filteredEmployees.length}</strong> nhân viên
        </span>
        </div>
      </div>
      <EmployeeModal
          isOpen={isAddModalOpen}
          title="Thêm nhân viên mới"
          subtitle="Khởi tạo tài khoản nhân sự hệ thống"
          form={form}
          setForm={setForm}
          generatedPassword={generatedPassword}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateEmployee}
          submitLabel="Tạo tài khoản"
          showPassword
      />
      <EmployeeModal
          isOpen={isEditModalOpen}
          title="Cập nhật nhân viên"
          subtitle="Cập nhật thông tin, phòng ban, vai trò và trạng thái làm việc"
          form={form}
          setForm={setForm}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateEmployee}
          submitLabel="Lưu thay đổi"
      />
    </div>
  );
};

function EmployeeModal({ isOpen, title, subtitle, form, setForm, generatedPassword, onClose, onSubmit, submitLabel, showPassword = false }) {
  return (
      <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
              />

              <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative w-full max-w-xl bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-2xl overflow-hidden"
              >
                <div className="p-10">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-800">{title}</h2>
                      <p className="text-sm font-semibold text-slate-500 mt-1">{subtitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <FormInput label="Họ và tên" icon={User} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nhập tên nhân viên" />

                    <div className="grid grid-cols-2 gap-5">
                      <FormInput label="Email" icon={Mail} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="email@dermasmart.com" />
                      <FormInput label="Số điện thoại" icon={Phone} type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="090..." />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <FormSelect label="Vai trò" value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={roles} />
                      <FormSelect label="Phòng ban" value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={departments} />
                    </div>

                    <FormSelect label="Trạng thái" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={statuses} />

                    {showPassword && (
                        <div className="p-5 bg-gradient-to-r from-indigo-50/80 to-sky-50/80 border border-indigo-100/60 rounded-2xl shadow-inner">
                          <label className="block text-xs font-extrabold text-indigo-800 uppercase tracking-wider mb-3 flex items-center">
                            <Shield className="w-3.5 h-3.5 mr-1.5" />
                            Mật khẩu khởi tạo
                          </label>
                          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-indigo-100 shadow-sm">
                            <span className="font-mono text-indigo-900 font-extrabold tracking-widest text-lg">{generatedPassword}</span>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">Tạo tự động</span>
                          </div>
                          <p className="text-xs font-semibold text-indigo-600/80 mt-3 leading-relaxed">
                            Mật khẩu này sẽ được gửi qua email cho nhân viên. Họ phải đổi mật khẩu ở lần đăng nhập đầu tiên.
                          </p>
                        </div>
                    )}
                  </div>

                  <div className="mt-10 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-6 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors border border-transparent hover:border-slate-200">
                      Hủy bỏ
                    </button>
                    <button onClick={onSubmit} className="px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {submitLabel}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
        )}
      </AnimatePresence>
  );
}

function FormInput({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) {
  return (
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
        <div className="relative">
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm font-semibold transition-all shadow-sm"
              placeholder={placeholder}
          />
        </div>
      </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm font-semibold transition-all appearance-none shadow-sm cursor-pointer"
      >
        {options?.map?.((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

export default EmployeeManagement;
