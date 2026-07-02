import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

const GOOGLE_CLIENT_ID = '900186992458-u5g7q60tfq2aj233vee4nb7e56ec7nsb.apps.googleusercontent.com';

// Floating particle component
function Particle({ style }) {
  return <div className="particle" style={style} />;
}

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState('');
  
  // 2FA states
  const [twoFAState, setTwoFAState] = useState(null); // 'setup' | 'verify'
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFAToken, setTwoFAToken] = useState('');
  const [twoFAEmail, setTwoFAEmail] = useState('');
  const [particles, setParticles] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const cardRef = useRef(null);

  // Handle Google credential response
  const handleGoogleResponse = useCallback(async (response) => {
    setGoogleLoading(true);
    setError('');
    try {
      const data = await api.googleLogin(response.credential);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [onLogin]);

  useEffect(() => {
    setMounted(true);
    const pts = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${4 + Math.random() * 8}px`,
      duration: `${6 + Math.random() * 10}s`,
      delay: `${Math.random() * 6}s`,
      opacity: 0.08 + Math.random() * 0.18,
    }));
    setParticles(pts);
  }, []);

  // Load Google Identity Services script
  useEffect(() => {
    // Check if script already loaded
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      setGsiReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      setGsiReady(true);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: don't remove script to avoid re-loading
    };
  }, [handleGoogleResponse]);

  // 3D tilt effect
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(900px) rotateY(${dx * 5}deg) rotateX(${-dy * 5}deg) scale(1.01)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await api.login(formData.email, formData.password);
        if (data.requires2FASetup) {
          setTwoFAState('setup');
          setQrCodeUrl(data.qrCode);
          setTwoFAEmail(data.email);
          return;
        } else if (data.requires2FA) {
          setTwoFAState('verify');
          setTwoFAEmail(data.email);
          return;
        }
      } else {
        data = await api.register(formData.name, formData.email, formData.password);
      }
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.verify2FA(twoFAEmail, twoFAToken);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .auth-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080b14;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
          padding: 2rem 1.5rem;
        }

        /* Ambient background orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          will-change: transform;
        }
        .orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%);
          top: -160px; left: -140px;
          animation: drift1 14s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(236,72,153,0.16) 0%, transparent 70%);
          bottom: -120px; right: -100px;
          animation: drift2 11s ease-in-out infinite alternate;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%);
          top: 50%; left: 55%;
          animation: drift3 17s ease-in-out infinite alternate;
        }

        @keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px, 50px) scale(1.08); } }
        @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px, -40px) scale(1.06); } }
        @keyframes drift3 { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-40%,-60%) scale(1.1); } }

        /* Grid overlay */
        .grid-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* Particles */
        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(139,92,246,0.7);
          pointer-events: none;
          animation: floatUp var(--dur) var(--delay) ease-in-out infinite alternate;
        }
        @keyframes floatUp {
          from { transform: translateY(0px) scale(1); opacity: var(--op); }
          to   { transform: translateY(-28px) scale(1.3); opacity: calc(var(--op) * 0.4); }
        }

        /* Card */
        .auth-card {
          position: relative;
          width: 100%; max-width: 440px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 28px;
          padding: 44px 40px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 24px 80px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.12);
          transition: transform 0.2s ease;
          animation: cardIn 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: perspective(900px) translateY(36px) scale(0.97); }
          to   { opacity: 1; transform: perspective(900px) translateY(0) scale(1); }
        }

        /* Card inner shimmer line */
        .card-shimmer {
          position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          border-radius: 999px;
        }

        /* Logo mark */
        .logo-mark {
          display: flex; align-items: center; justify-content: center;
          width: 54px; height: 54px; border-radius: 16px; margin: 0 auto 20px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          box-shadow: 0 8px 32px rgba(99,102,241,0.45);
          position: relative; overflow: hidden;
        }
        .logo-mark::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%);
        }
        .logo-mark svg { position: relative; z-index: 1; }

        /* Headings */
        .auth-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem; font-weight: 800;
          color: #fff; text-align: center; line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }
        .auth-sub {
          text-align: center; color: rgba(255,255,255,0.42);
          font-size: 0.875rem; font-weight: 300; margin-bottom: 32px;
        }

        /* Mode toggle pills */
        .mode-toggle {
          display: flex; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 4px; margin-bottom: 30px; gap: 4px;
        }
        .mode-pill {
          flex: 1; text-align: center; padding: 9px 0;
          border-radius: 10px; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; border: none; background: transparent;
          color: rgba(255,255,255,0.4); transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.01em;
        }
        .mode-pill.active {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #fff;
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
        }
        .mode-pill:not(.active):hover { color: rgba(255,255,255,0.75); }

        /* Input group */
        .field-group { margin-bottom: 18px; }
        .field-label {
          display: block; font-size: 0.78rem; font-weight: 600;
          color: rgba(255,255,255,0.55); margin-bottom: 8px;
          letter-spacing: 0.07em; text-transform: uppercase;
        }
        .field-wrap {
          position: relative;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          overflow: hidden;
        }
        .field-wrap.focused {
          border-color: rgba(139,92,246,0.7);
          background: rgba(139,92,246,0.07);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12), 0 2px 16px rgba(99,102,241,0.15);
        }
        .field-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.28); pointer-events: none; transition: color 0.2s;
        }
        .field-wrap.focused .field-icon { color: rgba(139,92,246,0.85); }
        .field-input {
          width: 100%; background: transparent; border: none; outline: none;
          color: #fff; font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem; font-weight: 400;
          padding: 14px 16px 14px 48px;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input.has-toggle { padding-right: 48px; }
        .pw-toggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.28); padding: 4px;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .pw-toggle:hover { color: rgba(139,92,246,0.85); }

        /* Error */
        .auth-error {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          color: #f87171; border-radius: 12px; padding: 11px 16px;
          font-size: 0.84rem; font-weight: 500; text-align: center; margin-bottom: 20px;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)}
        }

        /* Submit button */
        .auth-btn {
          width: 100%; border: none; cursor: pointer;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          background-size: 200% 200%;
          color: #fff; font-family: 'Syne', sans-serif;
          font-size: 1rem; font-weight: 700;
          padding: 15px 0; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 32px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.3);
          transition: box-shadow 0.2s, transform 0.15s, opacity 0.2s, background-position 0.5s;
          animation: gradMove 4s ease infinite;
          margin-top: 6px;
          letter-spacing: 0.02em;
        }
        @keyframes gradMove {
          0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
        }
        .auth-btn:hover:not(:disabled) {
          box-shadow: 0 12px 40px rgba(99,102,241,0.55), 0 2px 8px rgba(0,0,0,0.3);
          transform: translateY(-2px);
        }
        .auth-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Loading spinner */
        .spinner {
          width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Arrow pulse */
        .arrow-icon { transition: transform 0.2s; }
        .auth-btn:hover .arrow-icon { transform: translateX(4px); }

        /* Footer text */
        .auth-footer {
          text-align: center; margin-top: 26px;
          font-size: 0.85rem; color: rgba(255,255,255,0.35);
        }
        .auth-footer-link {
          color: #a78bfa; font-weight: 600; background: none; border: none;
          cursor: pointer; margin-left: 6px; font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; text-decoration: none; transition: color 0.2s;
        }
        .auth-footer-link:hover { color: #c4b5fd; text-decoration: underline; }

        /* Slide transition for name field */
        .field-slide {
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease, margin-bottom 0.3s;
        }
        .field-slide.open { max-height: 100px; opacity: 1; margin-bottom: 18px; }
        .field-slide.closed { max-height: 0; opacity: 0; margin-bottom: 0; }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 12px; margin: 22px 0 0;
          color: rgba(255,255,255,0.18); font-size: 0.78rem;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,0.09);
        }

        /* Google Sign-In Button */
        .google-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 24px 0 20px; color: rgba(255,255,255,0.28);
          font-size: 0.78rem; font-weight: 500; text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .google-divider::before, .google-divider::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
        }

        .google-btn {
          width: 100%; border: 1.5px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.85); font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem; font-weight: 500;
          padding: 13px 0; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          backdrop-filter: blur(8px);
          position: relative; overflow: hidden;
        }
        .google-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(66,133,244,0.08), rgba(234,67,53,0.06), rgba(251,188,4,0.06), rgba(52,168,83,0.08));
          opacity: 0; transition: opacity 0.3s;
        }
        .google-btn:hover {
          border-color: rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.09);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .google-btn:hover::before { opacity: 1; }
        .google-btn:active { transform: translateY(0) scale(0.99); }
        .google-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .google-logo {
          width: 20px; height: 20px; position: relative; z-index: 1;
        }
        .google-btn span { position: relative; z-index: 1; }
      `}</style>

      <div className="auth-root">
        {/* Ambient orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />

        {/* Floating particles */}
        {particles.map(p => (
          <Particle key={p.id} style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            '--dur': p.duration, '--delay': p.delay, '--op': p.opacity,
          }} />
        ))}

        <div
          className="auth-card"
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-shimmer" />

          {/* Logo */}
          <div className="logo-mark">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M13 3L22 8.5V17.5L13 23L4 17.5V8.5L13 3Z" fill="white" fillOpacity="0.9"/>
              <path d="M13 9L18 12V18L13 21L8 18V12L13 9Z" fill="white" fillOpacity="0.25"/>
            </svg>
          </div>

          {twoFAState ? (
            <>
              <h1 className="auth-title">
                {twoFAState === 'setup' ? 'Set up 2FA' : 'Two-Factor Auth'}
              </h1>
              <p className="auth-sub">
                {twoFAState === 'setup'
                  ? 'Scan the QR code with Google Authenticator and enter the code below.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </p>

              {error && <div className="auth-error">{error}</div>}

              {twoFAState === 'setup' && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <div style={{ background: 'white', padding: '10px', borderRadius: '12px' }}>
                    <img src={qrCodeUrl} alt="2FA QR Code" width="160" height="160" />
                  </div>
                </div>
              )}

              <form onSubmit={handle2FASubmit} autoComplete="off">
                <div className="field-group">
                  <label className="field-label">Authentication Code</label>
                  <div className={`field-wrap${focused === 'token' ? ' focused' : ''}`}>
                    <span className="field-icon"><Lock size={17} /></span>
                    <input
                      className="field-input"
                      type="text" placeholder="123456" required
                      value={twoFAToken}
                      maxLength={6}
                      onFocus={() => setFocused('token')}
                      onBlur={() => setFocused('')}
                      onChange={(e) => setTwoFAToken(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading
                    ? <><div className="spinner" /><span>Verifying…</span></>
                    : <><span>Verify Code</span><ArrowRight size={18} className="arrow-icon" /></>
                  }
                </button>

                <p className="auth-footer">
                  <button
                    className="auth-footer-link"
                    onClick={() => { setTwoFAState(null); setError(''); }}
                    type="button"
                  >
                    Back to login
                  </button>
                </p>
              </form>
            </>
          ) : (
            <>
              <h1 className="auth-title">
                {isLogin ? 'Welcome back' : 'Join us today'}
              </h1>
              <p className="auth-sub">
                {isLogin
                  ? 'Sign in to your boarding dashboard'
                  : 'Start finding or listing boardings in minutes'}
              </p>

              {/* Mode Toggle */}
              <div className="mode-toggle" role="tablist">
                <button
                  className={`mode-pill${isLogin ? ' active' : ''}`}
                  onClick={() => { setIsLogin(true); setError(''); }}
                  role="tab" type="button"
                >
                  Sign In
                </button>
                <button
                  className={`mode-pill${!isLogin ? ' active' : ''}`}
                  onClick={() => { setIsLogin(false); setError(''); }}
                  role="tab" type="button"
                >
                  Sign Up
                </button>
              </div>

              {/* Error */}
              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} autoComplete="off">
                {/* Name field — animated slide */}
                <div className={`field-slide${!isLogin ? ' open' : ' closed'}`}>
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    <div className={`field-wrap${focused === 'name' ? ' focused' : ''}`}>
                      <span className="field-icon"><User size={17} /></span>
                      <input
                        className="field-input"
                        type="text" placeholder="Jane Doe"
                        value={formData.name}
                        required={!isLogin}
                        onFocus={() => setFocused('name')}
                        onBlur={() => setFocused('')}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <div className={`field-wrap${focused === 'email' ? ' focused' : ''}`}>
                    <span className="field-icon"><Mail size={17} /></span>
                    <input
                      className="field-input"
                      type="email" placeholder="hello@example.com" required
                      value={formData.email}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className={`field-wrap${focused === 'password' ? ' focused' : ''}`}>
                    <span className="field-icon"><Lock size={17} /></span>
                    <input
                      className={`field-input has-toggle`}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••" required
                      value={formData.password}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused('')}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button" className="pw-toggle"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {isLogin && (
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading
                    ? <><div className="spinner" /><span>Please wait…</span></>
                    : <><span>{isLogin ? 'Sign In' : 'Create Account'}</span><ArrowRight size={18} className="arrow-icon" /></>
                  }
                </button>
              </form>

              {/* Google OAuth divider + button */}
              <div className="google-divider">or continue with</div>

              {/* Hidden div for Google's rendered button */}
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <div ref={(el) => {
                  if (el && gsiReady && !el.dataset.rendered) {
                    el.dataset.rendered = 'true';
                    window.google.accounts.id.renderButton(el, {
                      type: 'standard',
                      theme: 'filled_black',
                      size: 'large',
                      width: '360', // Matches inner width of auth-card (440 - 80 padding)
                      text: 'continue_with',
                    });
                  }
                }} style={{
                  borderRadius: '14px', overflow: 'hidden',
                  opacity: gsiReady ? 1 : 0.5,
                  pointerEvents: gsiReady ? 'auto' : 'none',
                  transition: 'opacity 0.3s',
                }} />
              </div>

              {!gsiReady && (
                <button type="button" className="google-btn" disabled>
                  <div className="spinner" /><span>Loading Google…</span>
                </button>
              )}

              <p className="auth-footer">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  className="auth-footer-link"
                  onClick={() => { setIsLogin(v => !v); setError(''); }}
                  type="button"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}