import React, { useState } from 'react';
import { Camera, Activity, Sparkles, Droplet, Check, Search, HelpCircle } from 'lucide-react';

const MOCK_SERVICES = [
  {
    id: 'soi-da',
    name: 'Soi da cắt lớp AI',
    description: 'Phân tích cấu trúc da đa tầng, phát hiện hắc sắc tố ẩn và tổn thương dưới da.',
    icon: Camera,
    category: 'Chẩn đoán hình ảnh',
    duration: '15 phút'
  },
  {
    id: 'xet-nghiem-mau',
    name: 'Xét nghiệm máu (Gan/Thận)',
    description: 'Đánh giá chỉ số men gan (AST/ALT) và chức năng thận trước khi chỉ định Isotretinoin.',
    icon: Activity,
    category: 'Xét nghiệm lâm sàng',
    duration: '30 phút'
  },
  {
    id: 'lay-nhan-mun',
    name: 'Lấy nhân mụn chuẩn y khoa',
    description: 'Làm sạch nhân mụn bọc, mụn ẩn vô khuẩn bằng bộ dụng cụ chuyên dụng chuẩn y khoa.',
    icon: Sparkles,
    category: 'Điều trị mụn',
    duration: '60 phút'
  },
  {
    id: 'dien-di',
    name: 'Điện di Vitamin C',
    description: 'Sử dụng dòng điện ion đẩy tinh chất dưỡng trắng, mờ thâm và kích thích collagen.',
    icon: Droplet,
    category: 'Chăm sóc chuyên sâu',
    duration: '30 phút'
  },
  {
    id: 'peel-da',
    name: 'Peel da điều trị mụn',
    description: 'Sử dụng hoạt chất hóa học để loại bỏ tế bào sừng hóa, thông thoáng lỗ chân lông.',
    icon: Sparkles,
    category: 'Điều trị mụn',
    duration: '45 phút'
  },
  {
    id: 'chieu-den',
    name: 'Chiếu đèn sinh học Omega Light',
    description: 'Ánh sáng sinh học hỗ trợ diệt khuẩn mụn (xanh) và phục hồi tái tạo tế bào (đỏ).',
    icon: Sparkles,
    category: 'Chăm sóc chuyên sâu',
    duration: '20 phút'
  }
];

export default function ServiceSelectionForm({ onSelectionChange }) {
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleToggle = (id) => {
    const isSelected = selectedServices.includes(id);
    let updated;
    if (isSelected) {
      updated = selectedServices.filter(item => item !== id);
    } else {
      updated = [...selectedServices, id];
    }
    setSelectedServices(updated);
    if (onSelectionChange) {
      onSelectionChange(updated);
    }
  };

  const categories = ['All', ...new Set(MOCK_SERVICES.map(s => s.category))];

  const filteredServices = MOCK_SERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="glass-3d water-refract rounded-[2rem] p-6 flex-1 flex flex-col min-h-0">
      {/* Header */}
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
        Chọn các dịch vụ, kỹ thuật hoặc xét nghiệm cần thiết để Technician thực hiện hoặc chuẩn bị cho bệnh nhân.
      </p>

      {/* Filter and Search Bar */}
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

      {/* Services Grid (Scrollable) */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar min-h-0 space-y-3">
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedServices.includes(service.id);

              return (
                <div
                  key={service.id}
                  onClick={() => handleToggle(service.id)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group relative select-none ${
                    isSelected
                      ? 'border-emerald-500/80 bg-emerald-50/40 shadow-[0_8px_20px_rgba(16,185,129,0.08)] ring-2 ring-emerald-500/20'
                      : 'border-slate-200/60 bg-white/50 hover:bg-white hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  {/* Selection Indicator Corner */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
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
                        <h4 className="font-extrabold text-sm text-slate-800 leading-tight">
                          {service.name}
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/40 text-[11px] font-bold text-slate-400">
                    <span>Thời gian thực hiện:</span>
                    <span className={isSelected ? 'text-emerald-600' : 'text-slate-600'}>{service.duration}</span>
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
