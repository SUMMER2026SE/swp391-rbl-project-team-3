import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassSelect from '../common/GlassSelect';
import { StaffModel, ROLE_OPTIONS } from '../../models/StaffModel';
import {
  Search,
  UserPlus,
  Edit2,
  ShieldCheck,
  X,
  Mail,
  Phone,
  User,
  Stethoscope,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shield,
  Headset,
  UserCog,
  Lock,
  Unlock
} from 'lucide-react';

// Icon per role for the GlassSelect dropdowns.
const ROLE_ICON = {
  'Bác sĩ': Stethoscope,
  'Kỹ thuật viên': UserCog,
  'Lễ tân': Headset,
  Admin: Shield,
};

// Full role list (used by the table inline picker + edit modal, so existing
// Admin rows still render their role correctly).
const roleNames = ROLE_OPTIONS.map((r) => ({ value: r.vi, label: r.vi, icon: ROLE_ICON[r.vi] }));

// Least-privilege: a regular Admin may only PROVISION Doctors/Technicians/
// Receptionists — never another Admin (role_id 1). Used by the Add modal.
const creatableRoleNames = ROLE_OPTIONS.filter((r) => r.id !== 1).map((r) => ({
  value: r.vi,
  label: r.vi,
  icon: ROLE_ICON[r.vi],
}));

// Tinted glass badge per role — Doctor = emerald, Receptionist = blue, etc.
const ROLE_BADGE = {
  'Bác sĩ': 'bg-emerald-100/70 text-emerald-700 border-emerald-200/80',
  'Lễ tân': 'bg-blue-100/70 text-blue-700 border-blue-200/80',
  'Kỹ thuật viên': 'bg-teal-100/70 text-teal-700 border-teal-200/80',
  Admin: 'bg-violet-100/70 text-violet-700 border-violet-200/80',
};

const generateInitialPassword = () => `Derma@${Math.floor(1000 + Math.random() * 9000)}`;

const emptyForm = { name: '', email: '', phone: '', specialty: '', role: 'Bác sĩ' };

const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load staff from Supabase ──
  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StaffModel.getAll();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load staff:', err);
      notify('Không thể tải danh sách nhân sự.', 'error');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.role?.toLowerCase().includes(q)
    );
  }, [employees, searchTerm]);

  const handleOpenAddModal = () => {
    setForm(emptyForm);
    setGeneratedPassword(generateInitialPassword());
    setIsAddModalOpen(true);
  };

  const handleCreateEmployee = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      notify('Vui lòng nhập đầy đủ họ tên, email và số điện thoại.', 'error');
      return;
    }
    setSaving(true);
    try {
      await StaffModel.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        specialty: form.specialty.trim(),
        roleVi: form.role,
        password: generatedPassword,
      });
      setIsAddModalOpen(false);
      setForm(emptyForm);
      notify('Tạo tài khoản nhân viên thành công.', 'success');
      await loadStaff();
    } catch (err) {
      console.error('Failed to create staff:', err);
      notify(err.message || 'Tạo tài khoản thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      specialty: emp.specialty || '',
      role: emp.role || 'Bác sĩ',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    setSaving(true);
    try {
      await StaffModel.update(editingEmployee.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        roleVi: form.role,
      });
      setIsEditModalOpen(false);
      setEditingEmployee(null);
      setForm(emptyForm);
      notify('Cập nhật nhân viên thành công.', 'success');
      await loadStaff();
    } catch (err) {
      console.error('Failed to update staff:', err);
      notify(err.message || 'Cập nhật thất bại (có thể do quyền RLS).', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickRoleChange = async (emp, role) => {
    const prev = employees;
    setEmployees((list) => list.map((e) => (e.id === emp.id ? { ...e, role } : e))); // optimistic
    try {
      await StaffModel.setRole(emp.id, role);
      notify(`Đã đổi vai trò của ${emp.name} thành ${role}.`, 'success');
    } catch (err) {
      console.error('Failed to change role:', err);
      setEmployees(prev); // rollback
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa';
    try {
      await StaffModel.setStatus(emp.id, newStatus);
      notify(`Đã ${actionLabel.toLowerCase()} tài khoản của ${emp.name}.`, 'success');
      await loadStaff();
    } catch (err) {
      console.error('Failed to toggle staff status:', err);
      notify(`${actionLabel} thất bại (quyền RLS).`, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 relative h-full"
    >
      <div className="backdrop-blur-xl bg-white/60 border border-white/50 shadow-lg rounded-2xl overflow-hidden flex flex-col">
        {/* Header: search + add */}
        <div className="p-6 md:p-8 border-b border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/40">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 transition-all font-semibold text-slate-700 shadow-sm"
              placeholder="Tìm kiếm nhân viên theo tên, email, vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Thêm nhân viên mới
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-sm font-semibold">Đang tải nhân sự...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/40 border-b border-slate-200/50">
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Liên hệ</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100/80">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-semibold text-slate-400">
                        {searchTerm ? 'Không tìm thấy nhân viên phù hợp.' : 'Chưa có nhân viên nào. Hãy thêm thành viên mới.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className={`hover:bg-white/50 transition-colors group ${emp.status !== 'ACTIVE' ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      <td className="px-8 py-5">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center text-indigo-700 font-extrabold text-lg border border-white shadow-sm mr-4 group-hover:scale-105 transition-transform overflow-hidden">
                            {emp.avatar ? (
                              <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              emp.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <div className="text-base md:text-lg font-bold text-slate-800">{emp.name}</div>
                            <span
                              className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${ROLE_BADGE[emp.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {emp.role}
                              {emp.specialty ? ` · ${emp.specialty}` : ''}
                            </span>
                            {emp.status !== 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 mt-1 ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
                                Đã vô hiệu hóa
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <div className="text-sm font-bold text-slate-700 mb-1 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-slate-400" />
                          {emp.email || '—'}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-slate-400" />
                          {emp.phone || '—'}
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <GlassSelect
                          value={emp.role}
                          onChange={(v) => handleQuickRoleChange(emp, v)}
                          options={roleNames}
                          buttonClassName="px-3 py-1.5 text-xs font-bold"
                        />
                      </td>

                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors border border-transparent hover:border-sky-100 shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:cursor-not-allowed"
                            title="Chỉnh sửa"
                            disabled={emp.status !== 'ACTIVE'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {emp.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleToggleStatus(emp)}
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 shadow-sm"
                              title="Vô hiệu hóa"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(emp)}
                              className="p-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-xl transition-colors shadow-sm"
                              title="Kích hoạt"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

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
        roleOptions={creatableRoleNames}
        generatedPassword={generatedPassword}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateEmployee}
        submitLabel="Tạo tài khoản"
        saving={saving}
        showPassword
      />
      <EmployeeModal
        isOpen={isEditModalOpen}
        title="Cập nhật nhân viên"
        subtitle="Cập nhật thông tin và vai trò"
        form={form}
        setForm={setForm}
        roleOptions={roleNames}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateEmployee}
        submitLabel="Lưu thay đổi"
        saving={saving}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-8 right-8 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl ${
              toast.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-sm font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function EmployeeModal({ isOpen, title, subtitle, form, setForm, roleOptions = roleNames, generatedPassword, onClose, onSubmit, submitLabel, saving, showPassword = false, emailLocked = false }) {
  const isClinical = form.role === 'Bác sĩ' || form.role === 'Kỹ thuật viên';

  // Portal to <body> so the overlay escapes the dashboard's `<main z-10>` stacking
  // context — otherwise the fixed Sidebar (root z-40) paints OVER the overlay no
  // matter how high the modal's z-index is.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Dedicated overlay — covers the entire viewport incl. Sidebar & Navbar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal content card — layered above the overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-[10000] w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800">{title}</h2>
                <p className="text-sm font-semibold text-slate-500 mt-1">{subtitle}</p>
              </div>
              <button onClick={onClose} className="p-2.5 text-slate-400 hover:bg-white/60 hover:text-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body — keeps the card bounded on small screens */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* ── Khu vực 1: Thông tin tài khoản ── */}
              <SectionLabel icon={User}>Thông tin tài khoản</SectionLabel>

              <FormInput label="Họ và tên" icon={User} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nhập tên nhân viên" />

              <div className="grid grid-cols-2 gap-5">
                <FormInput label="Email" icon={Mail} type="email" value={form.email} disabled={emailLocked} onChange={(v) => setForm({ ...form, email: v })} placeholder="email@dermasmart.vn" />
                <FormInput label="Số điện thoại" icon={Phone} type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="090..." />
              </div>

              <hr className="border-slate-200/50 my-4" />

              {/* ── Khu vực 2: Phân công công tác ── */}
              <SectionLabel icon={ShieldCheck}>Phân công công tác</SectionLabel>

              <div className="grid grid-cols-2 gap-5">
                <FormSelect label="Vai trò" value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={roleOptions} />
                {isClinical && (
                  <FormInput label="Chuyên môn" icon={Stethoscope} value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} placeholder="VD: Da liễu thẩm mỹ" />
                )}
              </div>

              {showPassword && (
                <div className="p-5 bg-gradient-to-r from-indigo-50/70 to-sky-50/70 border border-indigo-100/60 rounded-2xl shadow-inner">
                  <label className="block text-xs font-extrabold text-indigo-800 uppercase tracking-wider mb-3 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                    Mật khẩu khởi tạo
                  </label>
                  <div className="flex items-center justify-between bg-white/80 px-5 py-3 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="font-mono text-indigo-900 font-extrabold tracking-widest text-lg">{generatedPassword}</span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">Tạo tự động</span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-600/80 mt-3 leading-relaxed">
                    Nhân viên đăng nhập bằng email và mật khẩu này. Khuyến nghị đổi mật khẩu ở lần đăng nhập đầu tiên.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/50 flex justify-end space-x-4 shrink-0">
              <button onClick={onClose} disabled={saving} className="px-6 py-3.5 text-sm font-bold text-slate-600 hover:bg-white/60 rounded-2xl transition-colors border border-transparent hover:border-slate-200 disabled:opacity-50">
                Hủy bỏ
              </button>
              <button onClick={onSubmit} disabled={saving} className="px-8 py-2.5 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-60 disabled:translate-y-0">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {submitLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Group heading for a logical section of the form — distinct tinted glass pill.
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-base md:text-lg font-bold text-indigo-700 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100 mb-4">
      <Icon size={20} className="shrink-0" />
      {children}
    </div>
  );
}

function FormInput({ label, icon: Icon, value, onChange, placeholder, type = 'text', disabled = false }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-800 mb-2">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-4 p-3 bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none text-base font-medium text-slate-900 transition-all shadow-sm disabled:bg-slate-100/70 disabled:text-slate-400 disabled:cursor-not-allowed"
          placeholder={placeholder}
        />
        <Icon size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${disabled ? 'text-slate-300' : 'text-indigo-500'}`} />
      </div>
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-800 mb-2">{label}</label>
      <GlassSelect value={value} onChange={onChange} options={options || []} className="w-full" buttonClassName="px-4 p-3 text-base font-medium text-slate-900" />
    </div>
  );
}

export default EmployeeManagement;
