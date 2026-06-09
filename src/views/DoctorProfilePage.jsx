import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDoctorController } from '../controllers/useDoctorController';
import { useAuth } from '../context/AuthContext';
import BookAppointmentForm from '../components/PatientPortal/BookAppointmentForm';
import '../index.css';

function DoctorProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getDoctorDetails } = useDoctorController();
    const doctor = getDoctorDetails(id);
    const { user } = useAuth();
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    const handleBookClick = () => {
        if (!user) {
            navigate('/login');
        } else {
            setIsBookingOpen(true);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);

        // 3D Tilt Effect
        const tiltCards = document.querySelectorAll('.tilt-card');
        const handleTiltMove = (e) => {
            const el = e.currentTarget;
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10; 
            const rotateY = ((x - centerX) / centerX) * 10;
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        };
        const handleTiltLeave = (e) => {
            const el = e.currentTarget;
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        };

        tiltCards.forEach(el => {
            el.addEventListener('mousemove', handleTiltMove);
            el.addEventListener('mouseleave', handleTiltLeave);
        });

        return () => {
            tiltCards.forEach(el => {
                el.removeEventListener('mousemove', handleTiltMove);
                el.removeEventListener('mouseleave', handleTiltLeave);
            });
        };
    }, [id]);

    if (!doctor) {
        return (
            <div className="login-page-container">
                <div className="bg-orbs"><div className="orb-1"></div><div className="orb-2"></div></div>
                <div style={{ color: 'white', textAlign: 'center', zIndex: 10, position: 'relative' }}>
                    <h2>Không tìm thấy thông tin Bác sĩ</h2>
                    <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Về trang chủ</button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page-container" style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '2rem 1rem', display: 'block', height: '100vh', boxSizing: 'border-box' }}>
            {/* Background */}
            <div className="bg-orbs" style={{ position: 'fixed' }}>
                <div className="orb-1"></div>
                <div className="orb-2"></div>
                <div className="orb-3"></div>
            </div>
            <div className="hero-overlay" style={{ position: 'fixed', inset: 0, background: '#0f172a', opacity: 0.85, zIndex: 0 }}></div>
            
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                {/* Header Nav */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '99px', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Trở về
                    </button>
                </div>

                <div className="profile-grid">
                    {/* Left Sidebar */}
                    <div className="profile-sidebar glass-panel tilt-card" style={{ padding: '2.5rem 2rem', textAlign: 'center', alignSelf: 'start' }}>
                        <div className="profile-image-container" style={{ width: '160px', height: '160px', margin: '0 auto 1.5rem', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(20, 184, 166, 0.5)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                            <img src={doctor.image} alt={doctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h1 className="text-shimmer" style={{ fontSize: '1.75rem', color: 'white', marginBottom: '0.5rem', fontWeight: 700 }}>{doctor.name}</h1>
                        <p style={{ color: '#5eead4', fontWeight: 600, marginBottom: '1.5rem', fontSize: '1.1rem' }}>{doctor.title}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.8)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '12px' }}>
                                <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>star</span>
                                <span style={{ fontWeight: 600 }}>{doctor.rating}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({doctor.reviewsCount})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '12px' }}>
                                <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>work</span>
                                <span style={{ fontWeight: 600 }}>{doctor.experience}</span>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Phí khám ban đầu</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#14b8a6' }}>{doctor.consultationFee}</p>
                        </div>

                        <button
                            onClick={handleBookClick}
                            className="btn-primary btn-pulse"
                            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none' }}
                        >
                            <span className="material-symbols-outlined">event_available</span>
                            Đặt lịch khám ngay
                        </button>
                    </div>

                    {/* Right Content */}
                    <div className="profile-content">
                        {/* Bio Section */}
                        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                <div style={{ background: 'rgba(20, 184, 166, 0.2)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#14b8a6' }}>person</span>
                                </div>
                                Tổng quan
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontSize: '1.05rem' }}>{doctor.bio}</p>
                        </div>

                        {/* Specialties */}
                        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>medical_services</span>
                                </div>
                                Chuyên môn điều trị
                            </h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {doctor.specialties.map((spec, idx) => (
                                    <span key={idx} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '99px', fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: '#14b8a6' }}>check_circle</span>
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>calendar_month</span>
                                </div>
                                Lịch khám bệnh tuần này
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {doctor.schedule.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                                                {item.day.split(' ')[1]}
                                            </div>
                                            <span style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>{item.day}</span>
                                        </div>
                                        <span style={{ color: '#5eead4', fontWeight: 600, fontSize: '1.1rem', background: 'rgba(20, 184, 166, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px' }}>{item.hours}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <BookAppointmentForm
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                preselectedDoctorId={doctor.id}
            />
        </div>
    );
}

export default DoctorProfilePage;
