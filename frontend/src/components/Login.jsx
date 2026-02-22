// frontend/src/components/Login.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.auth-root{min-height:100vh;background:#0c0c14;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;padding:20px;position:relative;overflow:hidden;}
.auth-root::before{content:'';position:fixed;top:-30%;right:-20%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,0.06) 0%,transparent 70%);pointer-events:none;}
.auth-root::after{content:'';position:fixed;bottom:-30%;left:-20%;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.05) 0%,transparent 70%);pointer-events:none;}
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
.pw-toggle{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#3a3a5c;font-size:16px;padding:4px;transition:color 0.2s;line-height:1;}
.pw-toggle:hover{color:#94a3b8;}
.auth-btn{width:100%;padding:13px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;margin-top:8px;transition:opacity 0.2s,transform 0.1s;}
.auth-btn:hover{opacity:0.92;}.auth-btn:active{transform:scale(0.99);}.auth-btn:disabled{opacity:0.5;cursor:not-allowed;}
.auth-error{margin-top:14px;padding:10px 14px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;font-size:13px;color:#f87171;text-align:center;}
.auth-footer{text-align:center;margin-top:24px;font-size:14px;color:#64748b;}
.auth-link{color:#f97316;cursor:pointer;font-weight:500;transition:opacity 0.2s;}
.auth-link:hover{opacity:0.8;}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:8px;}
@keyframes spin{to{transform:rotate(360deg)}}
`;

function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = STYLE;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      onLoginSuccess(res.data.username);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span className="auth-logo-text">ConvoSphere</span>
        </div>
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">Sign in to pick up where you left off</p>

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrap">
              <input className="auth-input" type="text" placeholder="Enter your username"
                value={username} onChange={e => setUsername(e.target.value)} required autoFocus style={{ paddingRight: 16 }} />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input className="auth-input" type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(p => !p)} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}

        <p className="auth-footer">
          New to ConvoSphere?{' '}
          <span className="auth-link" onClick={onSwitchToRegister}>Create an account</span>
        </p>
      </div>
    </div>
  );
}

export default Login;