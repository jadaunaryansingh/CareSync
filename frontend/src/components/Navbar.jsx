import { useState, useEffect } from 'react';

export default function Navbar({ active, onNav, pendingCount, user, onLogout }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'beds',      label: 'Beds', icon: '🛏️' },
    { id: 'blood',     label: 'Blood Bank', icon: '🩸' },
    { id: 'oxygen',    label: 'Oxygen', icon: '💨' },
    { id: 'ambulance', label: 'Ambulance', icon: '🚑' },
    { id: 'staff',     label: 'Staff', icon: '👨‍⚕️' },
    { id: 'emergency', label: 'Emergency', icon: '🚨', badge: pendingCount },
  ];

  // Admin-only tab
  if (user?.is_admin) {
    tabs.push({ id: 'registrations', label: 'Approvals', icon: '📋' });
  }

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <span style={{ fontSize: 18 }}>🏥</span> CareSync
      </div>
      <div className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-tab ${active === t.id ? 'active' : ''}`}
            onClick={() => onNav(t.id)}
          >
            <span>{t.icon}</span> {t.label}
            {t.badge > 0 && <span className="nav-badge">{t.badge}</span>}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <span className="nav-clock">{time}</span>
        <div className="nav-user">
          <span className="nav-user-name">{user?.hospital_name || user?.email}</span>
          <span className="nav-user-role">{user?.is_admin ? '🔑 Admin' : '🏥 Hospital'}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout} title="Logout">
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
