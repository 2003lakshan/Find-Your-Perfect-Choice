import React, { useState, useEffect } from 'react';
import { PlusCircle, User, LogIn, Compass, Shield, LogOut, List, Menu, X, Sun, Moon, Sparkles, ChevronRight, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function Header({ currentPage, setCurrentPage, user, setUser, theme, setTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notificationsCtx = useNotifications();
  const notifications = notificationsCtx?.notifications || [];
  const unreadCount = notificationsCtx?.unreadCount || 0;
  const markAsRead = notificationsCtx?.markAsRead || (() => {});
  const markAllAsRead = notificationsCtx?.markAllAsRead || (() => {});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Discover', icon: Compass, always: true },
    { id: 'upload', label: 'Upload', icon: PlusCircle, auth: true },
    { id: 'my-listings', label: 'My Listings', icon: List, auth: true },
    { id: 'admin', label: 'Admin', icon: Shield, admin: true },
  ].filter(item => {
    if (item.admin) return user?.role === 'admin';
    if (item.auth) return !!user;
    return item.always;
  });

  return (
    <>
      <style>{`
        /* ── Header Shell ── */
        .hdr {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hdr-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          transition: height 0.3s ease;
        }
        .hdr.scrolled .hdr-inner { height: 58px; }

        /* ── Glass Background ── */
        .hdr::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0a1e4a 0%, #0f2d6b 40%, #162f65 100%);
          transition: all 0.4s ease;
        }
        .hdr.scrolled::before {
          background: rgba(10, 30, 74, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .hdr::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.3), transparent);
        }

        /* ── Logo ── */
        .hdr-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          position: relative;
          z-index: 2;
          text-decoration: none;
        }
        .hdr-logo:hover .logo-img { transform: scale(1.08) rotate(-2deg); }
        .logo-img {
          height: 40px;
          width: 40px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(99, 102, 241, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
        }
        .logo-text {
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #fff 0%, #c7d2fe 50%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Desktop Nav ── */
        .hdr-nav {
          display: none;
          align-items: center;
          gap: 4px;
          padding: 5px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          z-index: 2;
        }
        @media (min-width: 1024px) { .hdr-nav { display: flex; } }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          white-space: nowrap;
          color: rgba(148, 163, 184, 0.9);
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          opacity: 0;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05));
          transition: opacity 0.3s ease;
        }
        .nav-btn:hover {
          color: #e2e8f0;
        }
        .nav-btn:hover::before { opacity: 1; }
        .nav-btn:active { transform: scale(0.96); }

        .nav-btn.active {
          color: #fff;
          background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.2) inset;
        }
        .nav-btn.active::before { display: none; }
        .nav-btn .nav-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .nav-btn:hover .nav-icon { transform: scale(1.15); }

        /* active dot indicator */
        .nav-btn.active .nav-dot {
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          border-radius: 3px;
          background: #fff;
          opacity: 0.8;
        }

        /* ── Right Actions ── */
        .hdr-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .theme-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
          transform: rotate(15deg);
        }

        /* Sign In CTA */
        .signin-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 22px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          white-space: nowrap;
          color: #fff;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .signin-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .signin-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(99, 102, 241, 0.45);
        }
        .signin-btn:hover::before { opacity: 1; }
        .signin-btn span, .signin-btn svg { position: relative; z-index: 1; }
        .signin-btn:active { transform: translateY(0) scale(0.97); }

        /* User Pill */
        .user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 6px 5px 16px;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }
        .user-pill:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.18);
        }
        .user-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
        }
        .user-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2));
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #a5b4fc;
        }
        .user-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.12);
          margin: 0 2px;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .logout-btn:hover {
          color: #f87171;
          background: rgba(248, 113, 113, 0.1);
        }

        /* ── Mobile Toggle ── */
        .mobile-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .mobile-toggle:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        @media (min-width: 1024px) { .mobile-toggle { display: none; } }

        /* ── Mobile Drawer ── */
        .mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 90;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          opacity: 0;
          animation: overlayIn 0.3s ease forwards;
        }
        @keyframes overlayIn {
          to { opacity: 1; }
        }

        .mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 95;
          width: min(320px, 85vw);
          background: linear-gradient(180deg, #0a1e4a 0%, #0c2454 100%);
          border-left: 1px solid rgba(99, 102, 241, 0.15);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          animation: drawerSlide 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes drawerSlide {
          to { transform: translateX(0); }
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .drawer-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.6);
        }
        .drawer-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .drawer-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .drawer-nav {
          flex: 1;
          padding: 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .drawer-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          border: none;
          background: transparent;
          color: rgba(203, 213, 225, 0.8);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
        }
        .drawer-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }
        .drawer-btn.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08));
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
        .drawer-btn .drawer-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          flex-shrink: 0;
        }
        .drawer-btn.active .drawer-icon {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.15));
        }
        .drawer-btn .drawer-arrow {
          margin-left: auto;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.25s ease;
          color: rgba(148, 163, 184, 0.5);
        }
        .drawer-btn:hover .drawer-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .drawer-footer {
          padding: 16px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .drawer-footer-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: none;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .drawer-signin {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: #fff;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        .drawer-signin:hover {
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }
        .drawer-logout {
          background: rgba(248, 113, 113, 0.1);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.15);
        }
        .drawer-logout:hover {
          background: rgba(248, 113, 113, 0.15);
        }

        /* ── Notifications ── */
        .notif-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .notif-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: bold;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #0f2d6b;
        }
        .notif-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          width: 320px;
          max-height: 400px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 100;
          animation: dropIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notif-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .notif-header h4 { margin: 0; font-size: 0.95rem; color: #fff; }
        .notif-mark-all { font-size: 0.75rem; color: #a5b4fc; background: none; border: none; cursor: pointer; }
        .notif-mark-all:hover { color: #fff; text-decoration: underline; }
        .notif-list {
          overflow-y: auto;
          flex: 1;
        }
        .notif-item {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .notif-item:hover { background: rgba(255, 255, 255, 0.05); }
        .notif-item.unread { background: rgba(99, 102, 241, 0.1); }
        .notif-item-text {
          font-size: 0.85rem;
          color: #e2e8f0;
          margin-bottom: 4px;
        }
        .notif-item-time {
          font-size: 0.7rem;
          color: rgba(148, 163, 184, 0.8);
        }

        /* ── Ambient glow on header ── */
        .hdr-glow {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 100px;
          background: radial-gradient(ellipse, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }
      `}</style>

      <header className={`hdr${scrolled ? ' scrolled' : ''}`}>
        <div className="hdr-glow" />
        <div className="hdr-inner">

          {/* ── Logo ── */}
          <div className="hdr-logo" onClick={() => setCurrentPage('home')}>
            <img src="/logo.png" alt="FindLK" className="logo-img" />
            <span className="logo-text">FindLK</span>
          </div>

          {/* ── Desktop Navigation ── */}
          <nav className="hdr-nav">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`nav-btn${currentPage === id ? ' active' : ''}`}
              >
                <span className="nav-icon"><Icon size={15} strokeWidth={2.2} /></span>
                {label}
                {currentPage === id && <span className="nav-dot" />}
              </button>
            ))}
          </nav>

          {/* ── Right Actions ── */}
          <div className="hdr-actions">
            {user && (
              <div style={{ position: 'relative' }}>
                <button 
                  className="notif-btn" 
                  onClick={() => setNotifOpen(!notifOpen)}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <button className="notif-mark-all" onClick={() => markAllAsRead()}>Mark all as read</button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                            onClick={() => {
                              if (!n.is_read) markAsRead(n.id);
                              setNotifOpen(false);
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div className="notif-item-text">{n.message}</div>
                              <div className="notif-item-time">{new Date(n.created_at).toLocaleString()}</div>
                            </div>
                            {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', marginTop: 4 }} />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="theme-btn"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user ? (
              <div className="user-pill">
                <span className="user-name">{user.name}</span>
                <div className="user-avatar">
                  <User size={15} />
                </div>
                <div className="user-divider" />
                <button onClick={() => setUser(null)} className="logout-btn" title="Logout">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button onClick={() => setCurrentPage('auth')} className="signin-btn">
                <span><LogIn size={16} /></span>
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-drawer">
            <div className="drawer-header">
              <span className="drawer-title">Navigation</span>
              <button className="drawer-close" onClick={() => setMobileMenuOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-nav">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setCurrentPage(id); setMobileMenuOpen(false); }}
                  className={`drawer-btn${currentPage === id ? ' active' : ''}`}
                >
                  <span className="drawer-icon"><Icon size={18} /></span>
                  {label}
                  <ChevronRight size={16} className="drawer-arrow" />
                </button>
              ))}
            </div>

            <div className="drawer-footer">
              {user ? (
                <button className="drawer-footer-btn drawer-logout" onClick={() => { setUser(null); setMobileMenuOpen(false); }}>
                  <LogOut size={16} /> Log Out
                </button>
              ) : (
                <button className="drawer-footer-btn drawer-signin" onClick={() => { setCurrentPage('auth'); setMobileMenuOpen(false); }}>
                  <Sparkles size={16} /> Sign In to Get Started
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
