import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Edit2, Shield, X, Mail, Phone, User, CheckCircle2, MoreVertical
} from 'lucide-react';
import { mockEmployees } from '../../mockData';

const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generateInitialPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `Derma@${randomDigits}`;
  };

  const handleOpenAddModal = () => {
    setGeneratedPassword(generateInitialPassword());
    setIsAddModalOpen(true);
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'Bác sĩ': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Lễ tân': return 'bg-sky-50 text-sky-700 border-sky-200';
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
          <p className="text-slate-500 text-sm font-medium mt-1">Quản lý thông tin, phân quyền và tài khoản của đội ngũ nhân viên.</p>
        </div>
      </div>

      {/* Massive Glass Card Container for Table */}
      <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden flex flex-col">
        
        {/* Table Header / Actions */}
        <div className="p-6 md:p-8 border-b border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/40">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all font-semibold text-slate-700 shadow-sm"
              placeholder="Tìm kiếm nhân viên theo tên..."
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

        {/* Data Table */}
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
              {mockEmployees?.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center text-indigo-700 font-extrabold text-lg border border-white shadow-sm mr-4 group-hover:scale-105 transition-transform">
                        {emp.name.charAt(0)}
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
                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl border ${getRoleBadgeColor(emp.role)} shadow-sm`}>
                      {emp.role}
                    </span>
                    <div className="text-xs font-semibold text-slate-500 mt-2">{emp.department}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl border ${getStatusBadgeColor(emp.status)} shadow-sm`}>
                      {emp.status === 'Hoạt động' && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end space-x-2">
                      <button className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors border border-transparent hover:border-sky-100 shadow-sm" title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100 shadow-sm" title="Phân quyền">
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-6 border-t border-slate-200/50 bg-white/40 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-500">Hiển thị <strong className="text-slate-800">{mockEmployees.length}</strong> nhân viên</span>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Trước</button>
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Sau</button>
          </div>
        </div>
      </div>

      {/* Add Employee Sliding Drawer / Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-xl bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800">Thêm nhân viên mới</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Khởi tạo tài khoản nhân sự hệ thống</p>
                  </div>
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="text" className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm font-semibold transition-all shadow-sm" placeholder="Nhập tên nhân viên" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="email" className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm font-semibold transition-all shadow-sm" placeholder="email@pristine.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Số điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="tel" className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm font-semibold transition-all shadow-sm" placeholder="090..." />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Vai trò (Role)</label>
                    <select className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm font-semibold transition-all appearance-none shadow-sm cursor-pointer">
                      <option value="doctor">Bác sĩ</option>
                      <option value="receptionist">Lễ tân</option>
                      <option value="technician">Kỹ thuật viên</option>
                    </select>
                  </div>

                  {/* Auto Password Field */}
                  <div className="p-5 bg-gradient-to-r from-indigo-50/80 to-sky-50/80 border border-indigo-100/60 rounded-2xl shadow-inner">
                    <label className="block text-xs font-extrabold text-indigo-800 uppercase tracking-wider mb-3 flex items-center">
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      Mật khẩu khởi tạo
                    </label>
                    <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-indigo-100 shadow-sm">
                      <span className="font-mono text-indigo-900 font-extrabold tracking-widest text-lg">{generatedPassword}</span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">Tạo tự động</span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-600/80 mt-3 leading-relaxed">Mật khẩu này sẽ được gửi qua email cho nhân viên. Họ phải đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
                  </div>
                </div>

                <div className="mt-10 flex justify-end space-x-4">
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors border border-transparent hover:border-slate-200"
                  >
                    Hủy bỏ
                  </button>
                  <button className="px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5">
                    Tạo tài khoản
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeManagement;
