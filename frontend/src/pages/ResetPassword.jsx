import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token');
    if (t) setToken(t);
    else setError("Invalid or missing reset token.");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid token");
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
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
          background: #f8fafc;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-card {
          background: white;
          border-radius: 24px;
          padding: 48px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 4px 40px rgba(0,0,0,0.04);
          position: relative;
        }

        .auth-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .auth-sub {
          color: #64748b;
          font-size: 0.95rem;
          margin-bottom: 32px;
        }

        .field-group { margin-bottom: 20px; }
        .field-label {
          display: block; font-size: 0.75rem; font-weight: 700;
          color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em;
          margin-bottom: 8px;
        }

        .field-wrap {
          position: relative; display: flex; align-items: center;
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 14px; transition: all 0.2s;
        }

        .field-wrap:focus-within {
          border-color: #818cf8; background: white;
          box-shadow: 0 0 0 4px rgba(129,140,248,0.1);
        }

        .field-icon {
          padding-left: 16px; color: #94a3b8; display: flex;
        }
        
        .field-wrap:focus-within .field-icon { color: #818cf8; }

        .field-input {
          flex: 1; border: none; background: transparent;
          padding: 14px 16px; font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem; color: #1e293b; outline: none;
        }

        .field-input.has-toggle { padding-right: 48px; }

        .pw-toggle {
          position: absolute; right: 12px;
          background: none; border: none; color: #94a3b8;
          cursor: pointer; display: flex; padding: 4px;
        }

        .auth-btn {
          width: 100%; padding: 14px; border-radius: 14px;
          border: none; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white; font-family: 'DM Sans', sans-serif;
          font-weight: 600; font-size: 1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(99,102,241,0.25);
          transition: all 0.2s; margin-top: 12px;
        }

        .auth-btn:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.3);
        }

        .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .auth-error {
          background: #fee2e2; color: #ef4444; padding: 12px 16px;
          border-radius: 12px; font-size: 0.85rem; margin-bottom: 24px;
          display: flex; align-items: center; gap: 8px; font-weight: 500;
        }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      
      <div className="auth-root">
        <div className="auth-card">
          <h2 className="auth-title">Set New Password</h2>
          
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#10b981', fontWeight: 600, marginBottom: 16, fontSize: '1.1rem' }}>
                Your password has been successfully reset!
              </p>
              <button className="auth-btn" onClick={() => window.location.href = '/'}>
                Return to Login
              </button>
            </div>
          ) : (
            <>
              <p className="auth-sub">Enter your new password below.</p>
              {error && <div className="auth-error">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="field-group">
                  <label className="field-label">New Password</label>
                  <div className="field-wrap">
                    <span className="field-icon"><Lock size={17} /></span>
                    <input
                      className="field-input has-toggle"
                      type={showPassword ? 'text' : 'password'}
                      required placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Confirm New Password</label>
                  <div className="field-wrap">
                    <span className="field-icon"><Lock size={17} /></span>
                    <input
                      className="field-input"
                      type={showPassword ? 'text' : 'password'}
                      required placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="auth-btn" disabled={loading || !token}>
                  {loading ? <div className="spinner" /> : <span>Reset Password</span>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
