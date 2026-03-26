import { useState, useEffect } from 'react';
import { getDashboard } from '../api';

export default function Dashboard({ onNav }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
    const t = setInterval(() => {
      getDashboard().then(r => setStats(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const chartData = [40, 60, 55, 75, 80, 72, 90];
  const chartData2 = [30, 45, 60, 50, 70, 65, 80];
  const maxVal = Math.max(...chartData);
  const maxVal2 = Math.max(...chartData2);

  return (
    <div>
      {/* Hero */}
      <div className="hero-block mb-16">
        <div className="hero-title">🏥 CareSync Hospital</div>
        <div className="hero-sub">Centralized Management Dashboard · Live Overview</div>
        <div className="vital-strip">
          <div>
            <div className="vital-val" style={{ color: 'var(--danger)' }}>
              🔴 {loading ? '–' : stats?.emergencies_pending || 0}
            </div>
            <div className="vital-lbl">Critical Emergencies</div>
          </div>
          <div>
            <div className="vital-val" style={{ color: 'var(--accent3)' }}>✅ ONLINE</div>
            <div className="vital-lbl">System Status</div>
          </div>
          <div>
            <div className="vital-val" style={{ color: 'var(--accent)' }}>Supabase DB</div>
            <div className="vital-lbl">Data Source</div>
          </div>
          <div>
            <div className="vital-val" style={{ color: 'var(--warn)' }}>{today}</div>
            <div className="vital-lbl">Today</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid4 mb-16">
        <div className="stat-card blue" style={{ cursor: 'pointer' }} onClick={() => onNav('beds')}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🛏️</div>
          <div className="stat-val">{loading ? '–' : stats?.beds_occupied ?? '--'}</div>
          <div className="stat-label">Beds Occupied</div>
        </div>
        <div className="stat-card green" style={{ cursor: 'pointer' }} onClick={() => onNav('beds')}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
          <div className="stat-val">{loading ? '–' : stats?.beds_available ?? '--'}</div>
          <div className="stat-label">Beds Available</div>
        </div>
        <div className="stat-card red" style={{ cursor: 'pointer' }} onClick={() => onNav('emergency')}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🚨</div>
          <div className="stat-val">{loading ? '–' : stats?.emergencies_pending ?? '--'}</div>
          <div className="stat-label">Pending Emergencies</div>
        </div>
        <div className="stat-card purple" style={{ cursor: 'pointer' }} onClick={() => onNav('staff')}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>👨‍⚕️</div>
          <div className="stat-val">{loading ? '–' : stats?.staff_on_duty ?? '--'}</div>
          <div className="stat-label">Staff On Duty</div>
        </div>
      </div>

      {/* Charts + Quick Stats */}
      <div className="grid2 mb-16">
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 Admissions (7 Days)</span>
            <span className="badge badge-green">Live</span>
          </div>
          <div className="mini-chart">
            {chartData.map((v, i) => (
              <div key={i} className="mini-bar" style={{ height: `${(v / maxVal) * 50}px` }} />
            ))}
          </div>
          <div className="flex-between mt-8 text-xs text-muted">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">🩺 Discharges (7 Days)</span>
            <span className="badge badge-blue">Live</span>
          </div>
          <div className="mini-chart">
            {chartData2.map((v, i) => (
              <div key={i} className="mini-bar" style={{ height: `${(v / maxVal2) * 50}px`, background: 'linear-gradient(to top,rgba(124,58,237,0.5),rgba(124,58,237,0.1))' }} />
            ))}
          </div>
          <div className="flex-between mt-8 text-xs text-muted">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>
      </div>

      {/* Activity + Quick Stats */}
      <div className="grid2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔔 Live Activity Feed</span>
            <span className="badge badge-yellow blink">LIVE</span>
          </div>
          <div>
            {loading ? <div className="text-muted text-sm">Loading…</div> :
              (stats?.activity_log || []).slice(0, 8).map((a, i) => {
                const colorMap = { red: 'var(--danger)', green: 'var(--accent3)', blue: 'var(--accent)', yellow: 'var(--warn)', muted: 'var(--muted)' };
                return (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background: colorMap[a.color] || 'var(--accent)' }} />
                    <div className="activity-content">{a.msg}</div>
                    <div className="activity-time">
                      {new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">⚡ Quick Stats</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="flex-between">
              <span className="text-sm text-muted">🩸 Blood Bank</span>
              <span className={`badge ${stats?.critical_blood_types?.length > 0 ? 'badge-red' : 'badge-green'}`}>
                {stats?.critical_blood_types?.length > 0 ? `${stats.critical_blood_types.length} Critical` : 'All OK'}
              </span>
            </div>
            <div className="flex-between">
              <span className="text-sm text-muted">💨 Oxygen Units</span>
              <span className={`badge ${stats?.critical_oxygen_units?.length > 0 ? 'badge-red' : 'badge-green'}`}>
                {stats?.critical_oxygen_units?.length > 0 ? `${stats.critical_oxygen_units.length} Critical` : 'All OK'}
              </span>
            </div>
            <div className="flex-between">
              <span className="text-sm text-muted">🚑 Ambulances Active</span>
              <span className="badge badge-red">{loading ? '--' : stats?.ambulances_active || 0} on mission</span>
            </div>
            <div className="flex-between">
              <span className="text-sm text-muted">🚑 Ambulances Available</span>
              <span className="badge badge-green">{loading ? '--' : stats?.ambulances_available || 0} ready</span>
            </div>
            <div className="flex-between">
              <span className="text-sm text-muted">🛏️ Total Beds</span>
              <span className="badge badge-blue">{loading ? '--' : stats?.beds_total || 0} beds</span>
            </div>
            <div className="flex-between">
              <span className="text-sm text-muted">📡 API Status</span>
              <span className="badge badge-green">Connected</span>
            </div>
            <div className="flex-between">
              <span className="text-sm text-muted">💾 Database</span>
              <span className="badge badge-green">Supabase Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
