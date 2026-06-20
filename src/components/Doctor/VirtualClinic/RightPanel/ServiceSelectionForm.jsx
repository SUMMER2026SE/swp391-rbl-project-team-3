import React, { useState, useEffect } from 'react';
import { Camera, Activity, Sparkles, Droplet, Check, Search, HelpCircle, Loader2, Clock, UserCog } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';

export default function ServiceSelectionForm({ onSelectionChange, existingTickets = [] }) {
  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // selectedServices is an array of objects: { service_id, name, technician_id }
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: svcData } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'ACTIVE');
        
        const mappedServices = (svcData || []).map(s => {
          let icon = Sparkles;
          if (s.service_name.toLowerCase().includes('soi da')) icon = Camera;
          else if (s.service_name.toLowerCase().includes('xét nghiệm')) icon = Activity;
          else if (s.service_name.toLowerCase().includes('peel') || s.service_name.toLowerCase().includes('điện di')) icon = Droplet;
          
          return {
            ...s,
            icon,
            category: s.service_name.toLowerCase().includes('xét nghiệm') ? 'Xét nghiệm lâm sàng' :
                      s.service_name.toLowerCase().includes('soi da') ? 'Chẩn đoán hình ảnh' :
                      'Điều trị / Chăm sóc',
            duration: s.duration_minutes ? `${s.duration_minutes} phút` : '30 phút'
          };
        });
        setServices(mappedServices);

        const { data: techData } = await supabase
          .from('users')
          .select('user_id, full_name')
          .eq('role_id', 3)
          .eq('status', 'ACTIVE');
        setTechnicians(techData || []);

      } catch (err) {
        console.error('Error fetching data for service selection:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync selectedServices with existing tickets when they load
  useEffect(() => {
    if (Array.isArray(existingTickets) && existingTickets.length > 0 && services.length > 0) {
      const ticketsSvcNames = existingTickets.map(t => t.service_name);
      
      setSelectedServices(prev => {
        const newSel = prev.filter(p => !ticketsSvcNames.includes(p.name));
        const existingSel = existingTickets.map(t => ({
          service_id: services.find(s => s.service_name === t.service_name)?.service_id || null,
          name: t.service_name,
          technician_id: t.technician_id
        }));

        const merged = [...newSel, ...existingSel];
        const unique = [];
        merged.forEach(item => {
          if (!unique.find(u => u.name === item.name)) {
            unique.push(item);
          }
        });
        
        // Only trigger onSelectionChange if the effective selection actually changed
        // We'll let the VirtualClinicWorkspace track it though. 
        return unique;
      });
    }
  }, [existingTickets, services]);

  const handleToggleService = (service) => {
    const hasTicket = (existingTickets || []).some(t => t.service_name === service.service_name);
    if (hasTicket) return;

    const isSelected = selectedServices.some(s => s.name === service.service_name);
    let updated;
    
    if (isSelected) {
      updated = selectedServices.filter(s => s.name !== service.service_name);
    } else {
      updated = [
        ...selectedServices, 
        { 
          service_id: service.service_id, 
          name: service.service_name, 
          technician_id: technicians.length > 0 ? technicians[0].user_id : null 
        }
      ];
    }
    
    setSelectedServices(updated);
    if (onSelectionChange) onSelectionChange(updated);
  };

  const handleTechnicianChange = (serviceName, techId) => {
    const updated = selectedServices.map(s => 
      s.name === serviceName ? { ...s, technician_id: techId } : s
    );
    setSelectedServices(updated);
    if (onSelectionChange) onSelectionChange(updated);
  };

  const categories = ['All', ...new Set(services.map(s => s.category))];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'All' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="glass-3d water-refract rounded-[2rem] p-6 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-200/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
          <h3 className="font-extrabold text-lg text-slate-900">Chỉ định Cận lâm sàng & Dịch vụ</h3>
        </div>
        <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
          Đã chọn: {selectedServices.length}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-5 flex-shrink-0">
        Chọn các dịch vụ, kỹ thuật hoặc xét nghiệm cận lâm sàng cần thiết cho bệnh nhân. Bạn có thể phân công Kỹ thuật viên cụ thể cho từng thủ thuật.
      </p>

      <div className="flex flex-col md:flex-row gap-3 mb-5 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-slate-200/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-800 text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10'
                  : 'bg-white/50 text-slate-600 border-slate-200/60 hover:bg-white hover:text-slate-900'
              }`}
            >
              {cat === 'All' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar min-h-0 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
            <p className="text-sm font-semibold">Đang tải danh sách dịch vụ...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              const selectedSvcObj = selectedServices.find(s => s.name === service.service_name);
              const isSelected = !!selectedSvcObj;
              const ticket = (existingTickets || []).find((t) => t.service_name === service.service_name);
              const hasTicket = !!ticket;

              return (
                <div
                  key={service.service_id}
                  onClick={() => handleToggleService(service)}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between group relative select-none ${
                    hasTicket
                      ? 'border-slate-300 bg-slate-100/50 cursor-not-allowed opacity-80'
                      : isSelected
                        ? 'border-emerald-500/80 bg-emerald-50/40 shadow-[0_8px_20px_rgba(16,185,129,0.08)] ring-2 ring-emerald-500/20 cursor-pointer'
                        : 'border-slate-200/60 bg-white/50 hover:bg-white hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] cursor-pointer'
                  }`}
                >
                  {!hasTicket && (
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded transition-all flex items-center justify-center border-2 ${
                      isSelected 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-white border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  )}

                  {hasTicket && (
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {ticket.status === 'TECH_COMPLETED' ? (
                        <span className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 shrink-0" /> Xong
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                          <Clock className="w-3 h-3 shrink-0" /> Chờ KTV
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isSelected 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600'
                      }`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                          {service.category}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-800 leading-tight pr-6">
                          {service.service_name}
                        </h4>
                      </div>
                    </div>
                    
                    {isSelected && !hasTicket && technicians.length > 0 && (
                      <div className="mt-3 mb-2 flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-200/60 shadow-sm" onClick={(e) => e.stopPropagation()}>
                        <UserCog className="w-4 h-4 text-emerald-600 shrink-0" />
                        <select 
                          className="text-xs bg-transparent border-none outline-none text-slate-700 font-semibold cursor-pointer flex-1 w-full"
                          value={selectedSvcObj?.technician_id || ''}
                          onChange={(e) => handleTechnicianChange(service.service_name, e.target.value)}
                        >
                          <option value="" disabled>-- Phân công Kỹ thuật viên --</option>
                          {technicians.map(t => (
                            <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-2">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/40 text-[11px] font-bold text-slate-400 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span>Thời gian thực hiện:</span>
                      <span className={isSelected ? 'text-emerald-600' : 'text-slate-600'}>{service.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Giá dịch vụ:</span>
                      <span className={isSelected ? 'text-emerald-600 text-[13px] font-extrabold' : 'text-slate-700 text-[13px] font-extrabold'}>
                        {service.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price) : 'Liên hệ'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200/60 rounded-2xl">
            <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Không tìm thấy dịch vụ nào phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}
