import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import {
  LogOut,
  Search,
  Bell,
  Settings,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import LiquidSidebarMenu from './LiquidSidebarMenu';
import logo from '../../assets/logo.png';
import { GLASS_INPUT } from '../common/GlassCard';

/**
 * DashboardShell — the shared premium "Liquid Glass" chrome extracted from the
 * Doctor/Technician dashboards so every actor portal renders an identical shell:
 *  - transparent canvas with animated emerald/sky mesh blobs
 *  - compact hover-expand glass sidebar (LiquidSidebarMenu)
 *  - scroll-linked morphing pill topbar with gradient title
 *  - glass profile dropdown + logout
 *
 * It is purely presentational chrome; each portal passes its own nav config and
 * page content as `children`, so no business logic or features are lost.
 */
export default function DashboardShell({
  portalName = 'Portal',
  navItems = [],
  activeTab,
  onTabChange,
  pageTitle = 'Tổng quan',
  searchPlaceholder = 'Tìm kiếm...',
  onSearch,
  headerExtras = null,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  /* scroll-linked morphing topbar (matches Doctor/Tech baseline) */
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const springCfg = { stiffness: 220, damping: 32, mass: 0.9 };

  const widthMV = useSpring(useTransform(scrollY, [0, 120], [100, 90]), springCfg);
  const maxWMV = useSpring(useTransform(scrollY, [0, 120], [1600, 1140]), springCfg);
  const radiusMV = useSpring(useTransform(scrollY, [0, 120], [0, 32]), springCfg);
  const topMV = useSpring(useTransform(scrollY, [0, 120], [0, 16]), springCfg);
  const pxMV = useSpring(useTransform(scrollY, [0, 120], [32, 30]), springCfg);
  const bgMV = useSpring(useTransform(scrollY, [0, 120], [0, 0.72]), springCfg);
  const shadowMV = useSpring(useTransform(scrollY, [0, 120], [0, 0.12]), springCfg);
  const ringMV = useSpring(useTransform(scrollY, [0, 120], [0, 0.7]), springCfg);

  const navWidth = useMotionTemplate`${widthMV}%`;
  const navMaxWidth = useMotionTemplate`${maxWMV}px`;
  const navBorderRadius = useMotionTemplate`${radiusMV}px`;
  const navTop = useMotionTemplate`${topMV}px`;
  const navPaddingX = useMotionTemplate`${pxMV}px`;
  const navBg = useMotionTemplate`rgba(255, 255, 255, ${bgMV})`;
  const navShadow = useMotionTemplate`0 14px 40px rgba(2, 32, 29, ${shadowMV}), inset 0 1px 2px rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,${ringMV})`;

  const safeNavItems = Array.isArray(navItems) ? navItems : [];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-teal-50 via-emerald-100 to-cyan-50 overflow-hidden font-sans text-slate-800">
      {/* Animated mesh blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-400/30 blur-3xl"
          style={{ animation: 'float 18s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-cyan-400/30 blur-3xl"
          style={{ animation: 'float-reverse 20s ease-in-out infinite' }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(0.95); }
          66% { transform: translate(25px, -25px) scale(1.04); }
        }
      `}</style>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarExpanded ? 256 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex backdrop-blur-2xl bg-teal-900/10 border-r border-teal-900/10 fixed h-full z-40 flex-col py-8 px-3 justify-between shadow-[4px_0_24px_rgba(0,0,0,0.03),inset_-1px_0_2px_rgba(255,255,255,0.7)] overflow-hidden"
      >
        <div className="flex flex-col gap-6">
          <div className={`flex items-center ${isSidebarExpanded ? 'justify-between px-1' : 'justify-center'} min-h-[80px]`}>
            {isSidebarExpanded ? (
              <>
                <div className="flex flex-col items-start gap-1">
                  <img src={logo} alt="DermaSmart Logo" className="h-16 w-auto object-contain" />
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">{portalName}</span>
                </div>
                <button
                  onClick={() => setIsSidebarExpanded(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Thu gọn"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarExpanded(true)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
                title="Mở rộng"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
          </div>

          <LiquidSidebarMenu
            items={safeNavItems}
            activeId={activeTab}
            onChange={(id) => onTabChange?.(id)}
            isSidebarExpanded={isSidebarExpanded}
          />
        </div>

        <div className="flex flex-col gap-2">
          <motion.button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50/60 transition-all duration-200 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {isSidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Đăng xuất
                </motion.span>
              )}
            </AnimatePresence>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                Đăng xuất
              </div>
            )}
          </motion.button>
        </div>
      </motion.aside>

      {/* Main content area */}
      <div className={`transition-all duration-300 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
        <div ref={scrollRef} className="h-screen overflow-y-auto relative">
          {/* Morphing pill topbar */}
          <motion.header
            style={{
              width: navWidth,
              maxWidth: navMaxWidth,
              borderRadius: navBorderRadius,
              top: navTop,
              paddingLeft: navPaddingX,
              paddingRight: navPaddingX,
              backgroundColor: navBg,
              boxShadow: navShadow,
            }}
            className="sticky mx-auto z-30 py-4 backdrop-blur-2xl"
          >
            <div className="relative flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-4 flex-1">
                <span className="font-black text-2xl text-gradient-emerald md:hidden tracking-tight">DermaSmart</span>
                <div className="relative flex-1 max-w-md hidden md:block">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    onChange={(e) => onSearch?.(e.target.value)}
                    className={`w-full pl-11 pr-4 py-2.5 text-sm ${GLASS_INPUT}`}
                  />
                </div>
              </div>
              <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 tracking-tight whitespace-nowrap pointer-events-none">
                {pageTitle}
              </h1>

              <div className="flex items-center gap-3">
                {headerExtras}

                <div className="hidden lg:flex flex-col items-end mr-1">
                  <span className="text-sm font-semibold text-gray-900">{user?.name || 'Người dùng'}</span>
                  <span className="text-[11px] text-gray-500">{portalName}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors"
                >
                  <Bell size={18} />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors"
                >
                  <Settings size={18} />
                </motion.button>

                <div className="relative">
                  <motion.button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer transition-transform hover:scale-105 ring-2 ring-transparent hover:ring-emerald-500/50 overflow-hidden"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.name || 'avatar'} className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-white" />
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 origin-top-right text-left"
                        >
                          <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tài khoản</p>
                            <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user?.name || 'Người dùng'}</p>
                            <p className="text-[11px] text-emerald-600 font-medium truncate">{user?.email || ''}</p>
                          </div>

                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/profile');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            Xem hồ sơ cá nhân
                          </button>

                          <button
                            onClick={async () => {
                              setShowProfileMenu(false);
                              await logout();
                              navigate('/login');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4 text-rose-400" />
                            Đăng xuất
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Page content — keyed remount (matches Doctor baseline; avoids the
              AnimatePresence mode="wait" exit-stall that can block tab swaps). */}
          <main className="relative z-10 px-4 md:px-8 py-8 max-w-[1600px] mx-auto">
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
