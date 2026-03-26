import { useState, useEffect } from 'react';
import { getOxygen, oxygenAction } from '../api';
import { toast } from '../toast';

export default function Oxygen() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const r = await getOxygen(); setUnits(r.data); } catch { toast('Failed to load oxygen', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      await oxygenAction(id, action);
      toast(`${id} ${action === 'refill' ? 'refilled' : 'replaced'} successfully`, 'success');
      load();
    } catch { toast('Failed to update oxygen unit', 'error'); }
  };

  const ok    = units.filter(u => u.pct > 60).length;
  const low   = units.filter(u => u.pct >= 30 && u.pct <= 60).length;
  const crit  = units.filter(u => u.pct < 30).length;

  return (
    <div>
      <div className="section-title">💨 Oxygen Management</div>
      <div className="section-sub">Monitor and manage all oxygen supplies across the hospital</div>

      {units.filter(u => u.pct < 30).map(u => (
        <div key={u.id} className="alert alert-danger">
          <span>⚠️</span>
          <span><strong>ALERT:</strong> {u.name} ({u.location}) at {u.pct}% — Immediate refill required!</span>
        </div>
      ))}

      {loading ? <div className="loading">Loading…</div> : <>
        <div className="grid4 mb-16">
          <div className="stat-card green"><div className="stat-val">{ok}</div><div className="stat-label">Units OK (&gt;60%)</div></div>
          <div className="stat-card yellow"><div className="stat-val">{low}</div><div className="stat-label">Units Low (30-60%)</div></div>
          <div className="stat-card red"><div className="stat-val">{crit}</div><div className="stat-label">Units Critical (&lt;30%)</div></div>
          <div className="stat-card blue"><div className="stat-val">{units.length}</div><div className="stat-label">Total Units</div></div>
        </div>

        <div className="grid3">
          {units.map(o => {
            const cls = o.pct > 60 ? 'full' : o.pct > 35 ? 'med' : 'low';
            const badge = o.pct > 60 ? 'badge-green' : o.pct > 35 ? 'badge-yellow' : 'badge-red';
            const color = o.pct > 60 ? 'var(--accent3)' : o.pct > 35 ? 'var(--warn)' : 'var(--danger)';
            return (
              <div key={o.id} className="card">
                <div className="card-header">
                  <span className="fw-600 text-accent font-mono">{o.id}</span>
                  <span className={`badge ${badge}`}>{o.pct > 60 ? 'OK' : o.pct > 35 ? 'LOW' : 'CRITICAL'}</span>
                </div>
                <div className="oxy-gauge">
                  <div className={`oxy-ring ${cls}`}>
                    <div className="oxy-inner">
                      <div className="oxy-pct" style={{ color }}>{o.pct}%</div>
                      <div className="oxy-lbl">O₂</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div className="flex-between text-sm mb-8"><span className="text-muted">{o.name}</span></div>
                  <div className="flex-between text-xs">
                    <span className="text-muted">📍 {o.location}</span>
                    <span className="text-muted">🔵 {o.type}</span>
                  </div>
                  <div className="text-xs text-muted mt-8">
                    {o.kpa ? `Pressure: ${o.kpa} kPa | Flow: ${o.flow_rate}` : `Central Supply | ${o.flow_rate}`}
                  </div>
                </div>
                <div className="flex-gap mt-12">
                  <button className="btn btn-xs btn-ghost" style={{ flex: 1 }} onClick={() => handleAction(o.id, 'refill')}>🔄 Refill</button>
                  <button className="btn btn-xs btn-ghost" style={{ flex: 1 }} onClick={() => handleAction(o.id, 'replace')}>🔃 Replace</button>
                </div>
              </div>
            );
          })}
        </div>
      </>}
    </div>
  );
}
