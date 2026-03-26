import { useState } from 'react';
import { authLogin, authSignup } from '../api';
import { toast } from '../toast';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | signup | pending
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Signup form
  const [signupForm, setSignupForm] = useState({
    hospital_name: '', email: '', password: '', confirmPassword: '',
    phone: '', address: '', medical_license_no: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) { toast('Enter email & password', 'error'); return; }
    setLoading(true);
    try {
      const { data } = await authLogin(loginForm);
      localStorage.setItem('caresync_token', data.access_token);
      localStorage.setItem('caresync_user', JSON.stringify(data.user));
      toast(`Welcome, ${data.user.hospital_name}!`, 'success');
      onLogin(data.user, data.access_token);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupForm.hospital_name || !signupForm.email || !signupForm.password || !signupForm.medical_license_no) {
      toast('Fill all required fields', 'error'); return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      toast('Passwords do not match', 'error'); return;
    }
    if (signupForm.password.length < 6) {
      toast('Password must be at least 6 characters', 'error'); return;
    }
    setLoading(true);
    try {
      await authSignup({
        hospital_name: signupForm.hospital_name,
        email: signupForm.email,
        password: signupForm.password,
        phone: signupForm.phone,
        address: signupForm.address,
        medical_license_no: signupForm.medical_license_no,
      });
      setMode('pending');
      toast('Registration submitted!', 'success');
    } catch (err) {
      toast(err.response?.data?.detail || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Pending approval view ──
  if (mode === 'pending') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-pending">
              <div className="auth-pending-icon">⏳</div>
              <h2>Registration Submitted</h2>
              <p>Your hospital registration is pending admin approval. You will be able to login once an administrator reviews and approves your application.</p>
              <div className="auth-pending-info">
                <div className="auth-pending-row">
                  <span>Hospital</span>
                  <strong>{signupForm.hospital_name}</strong>
                </div>
                <div className="auth-pending-row">
                  <span>License No.</span>
                  <strong>{signupForm.medical_license_no}</strong>
                </div>
                <div className="auth-pending-row">
                  <span>Email</span>
                  <strong>{signupForm.email}</strong>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={() => setMode('login')}>
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left: Branding */}
        <div className="auth-brand">
          <div className="auth-brand-icon">🏥</div>
          <h1 className="auth-brand-title">CareSync</h1>
          <p className="auth-brand-sub">Hospital Management Portal</p>
          <div className="auth-brand-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">🛏️</span>
              <span>Real-time Bed Management</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🩸</span>
              <span>Blood Bank Inventory</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🚑</span>
              <span>Ambulance Dispatch</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🚨</span>
              <span>Emergency Response</span>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
            <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Register Hospital</button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <h2 className="auth-form-title">Welcome Back</h2>
              <p className="auth-form-sub">Sign in to your hospital portal</p>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" type="email" placeholder="hospital@example.com"
                  value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" placeholder="••••••••"
                  value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : '🔐 Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="auth-form">
              <h2 className="auth-form-title">Register Hospital</h2>
              <p className="auth-form-sub">Submit your hospital for admin verification</p>
              <div className="form-group">
                <label className="form-label">Hospital Name *</label>
                <input className="form-control" placeholder="City General Hospital"
                  value={signupForm.hospital_name} onChange={e => setSignupForm(f => ({ ...f, hospital_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Medical License No. *</label>
                <input className="form-control" placeholder="MCI-2024-XXXXX"
                  value={signupForm.medical_license_no} onChange={e => setSignupForm(f => ({ ...f, medical_license_no: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-control" type="email" placeholder="admin@hospital.com"
                    value={signupForm.email} onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+91 98100XXXXX"
                    value={signupForm.phone} onChange={e => setSignupForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Hospital Address</label>
                <input className="form-control" placeholder="123 Medical Ave, New Delhi"
                  value={signupForm.address} onChange={e => setSignupForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-control" type="password" placeholder="Min 6 characters"
                    value={signupForm.password} onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input className="form-control" type="password" placeholder="Re-enter password"
                    value={signupForm.confirmPassword} onChange={e => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                </div>
              </div>
              <div className="auth-notice">
                <span>📋</span> Your registration will be reviewed by an admin. You'll receive access once approved.
              </div>
              <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
                {loading ? 'Submitting…' : '📝 Submit Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
