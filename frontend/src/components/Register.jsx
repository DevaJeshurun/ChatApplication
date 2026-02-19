// frontend/src/components/Register.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.auth-root{min-height:100vh;background:#0c0c14;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;padding:20px;position:relative;overflow:hidden;}
.auth-root::before{content:'';position:fixed;top:-30%;right:-20%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,0.06) 0%,transparent 70%);pointer-events:none;}
.auth-card{background:#13131f;border:1px solid #252538;border-radius:20px;padding:48px 44px;width:100%;max-width:420px;position:relative;animation:slideUp 0.4s ease;}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:32px;}
.auth-logo-icon{width:38px;height:38px;background:linear-gradient(135deg,#f97316,#fb923c);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;}
.auth-logo-text{font-size:20px;font-weight:700;color:#f1f5f9;letter-spacing:-0.3px;}
.auth-heading{font-size:26px;font-weight:700;color:#f1f5f9;margin-bottom:6px;letter-spacing:-0.5px;}
.auth-subheading{font-size:14px;color:#64748b;margin-bottom:32px;}
.auth-field{margin-bottom:16px;}
.auth-label{display:block;font-size:13px;font-weight:500;color:#94a3b8;margin-bottom:7px;}
.auth-input-wrap{position:relative;}
.auth-input{width:100%;padding:12px 42px 12px 16px;background:#0c0c14;border:1px solid #252538;border-radius:10px;font-size:15px;font-family:'Outfit',sans-serif;color:#f1f5f9;outline:none;transition:border-color 0.2s,box-shadow 0.2s;}
.auth-input::placeholder{color:#3a3a5c;}
.auth-input:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,0.12);}
.auth-hint{font-size:12px;color:#3a3a5c;margin-top:5px;}
.pw-toggle{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#3a3a5c;font-size:16px;padding:4px;transition:color 0.2s;line-height:1;}
.pw-toggle:hover{color:#94a3b8;}
.strength-bar{height:3px;border-radius:2px;margin-top:8px;background:#252538;overflow:hidden;}
.strength-fill{height:100%;border-radius:2px;transition:width 0.3s,background 0.3s;}
.auth-btn{width:100%;padding:13px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;margin-top:8px;transition:opacity 0.2s,transform 0.1s;}
.auth-btn:hover{opacity:0.92;}.auth-btn:active{transform:scale(0.99);}.auth-btn:disabled{opacity:0.5;cursor:not-allowed;}
.auth-error{margin-top:14px;padding:10px 14px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;font-size:13px;color:#f87171;text-align:center;}
.auth-success{margin-top:14px;padding:10px 14px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:8px;font-size:13px;color:#4ade80;text-align:center;}
.auth-footer{text-align:center;margin-top:24px;font-size:14px;color:#64748b;}
.auth-link{color:#f97316;cursor:pointer;font-weight:500;transition:opacity 0.2s;}
.auth-link:hover{opacity:0.8;}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:8px;}
@keyframes spin{to{transform:rotate(360deg)}}
`;

function getStrength(pwd) {
  if (!pwd) return { pct: 0, color: '#252538', label: '' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { pct: 20, color: '#ef4444', label: 'Weak' };
  if (score <= 2) return { pct: 40, color: '#f97316', label: 'Fair' };
  if (score <= 3) return { pct: 65, color: '#eab308', label: 'Good' };
  return { pct: 100, color: '#22c55e', label: 'Strong' };
}

function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = STYLE;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const strength = getStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setIsError(true); setMessage('Password must be at least 6 characters.'); return; }
    setLoading(true); setMessage('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', { username, password });
      setIsError(false); setMessage('Account created! Redirecting to login...');
      setTimeout(() => onSwitchToLogin(), 1500);
    } catch (err) {
      setIsError(true); setMessage(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span className="auth-logo-text">Ripple</span>
        </div>
        <h1 className="auth-heading">Create account</h1>
        <p className="auth-subheading">Join the conversation in seconds</p>

        <form onSubmit={handleRegister}>
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrap">
              <input className="auth-input" type="text" placeholder="Pick a username"
                value={username} onChange={e => setUsername(e.target.value)}
                required autoFocus minLength={3} maxLength={20} style={{ paddingRight: 16 }} />
            </div>
            <p className="auth-hint">3–20 characters, no spaces</p>
          </div>

          <div className="auth-field">
            <label className="auth-label">
              Password
              {strength.label && <span style={{ marginLeft: 8, color: strength.color, fontSize: 11 }}>— {strength.label}</span>}
            </label>
            <div className="auth-input-wrap">
              <input className="auth-input" type={showPassword ? 'text' : 'password'}
                placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(p => !p)} title={showPassword ? 'Hide' : 'Show'}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="strength-bar">
              <div className="strength-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
            </div>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {message && <div className={isError ? 'auth-error' : 'auth-success'}>{message}</div>}

        <p className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={onSwitchToLogin}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

export default Register;