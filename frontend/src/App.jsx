import { useState, useEffect } from 'react';
import './index.css';
import { useToast } from './toast';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Toaster from './components/Toaster';
import Dashboard from './components/Dashboard';
import Beds from './components/Beds';
import Blood from './components/Blood';
import Oxygen from './components/Oxygen';
import Ambulances from './components/Ambulances';
import Staff from './components/Staff';
import Emergencies from './components/Emergencies';
import AdminRegistrations from './components/AdminRegistrations';
import { getEmergencyStats } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [section, setSection] = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(0);
  const toasts = useToast();

  // Restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('caresync_token');
    const savedUser = localStorage.getItem('caresync_user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {}
    }
    setAuthReady(true);
  }, []);

  // Listen for forced logout (401 interceptor)
  useEffect(() => {
    const onLogout = () => { setUser(null); setToken(null); };
    window.addEventListener('caresync:logout', onLogout);
    return () => window.removeEventListener('caresync:logout', onLogout);
  }, []);

  const handleLogin = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('caresync_token');
    localStorage.removeItem('caresync_user');
    setUser(null);
    setToken(null);
    setSection('dashboard');
  };

  // Poll pending emergencies count for navbar badge
  useEffect(() => {
    if (!user) return;
    const fetchPending = async () => {
      try {
        const { data } = await getEmergencyStats();
        setPendingCount(data.pending || 0);
      } catch {}
    };
    fetchPending();
    const t = setInterval(fetchPending, 30000);
    return () => clearInterval(t);
  }, [user]);

  if (!authReady) return null;

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster toasts={toasts} />
      </>
    );
  }

  return (
    <div className="app">
      <Navbar
        active={section}
        onNav={setSection}
        pendingCount={pendingCount}
        user={user}
        onLogout={handleLogout}
      />
      <div className="main-content">
        {section === 'dashboard'      && <Dashboard onNav={setSection} />}
        {section === 'beds'           && <Beds />}
        {section === 'blood'          && <Blood />}
        {section === 'oxygen'         && <Oxygen />}
        {section === 'ambulance'      && <Ambulances />}
        {section === 'staff'          && <Staff />}
        {section === 'emergency'      && <Emergencies />}
        {section === 'registrations'  && <AdminRegistrations />}
      </div>
      <Toaster toasts={toasts} />
    </div>
  );
}
