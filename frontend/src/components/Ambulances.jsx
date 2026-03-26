import { useState, useEffect } from 'react';
import { getAmbulances, getAmbulanceStats, addAmbulance, dispatchAmbulance, recallAmbulance, clearAmbulance, refuelAmbulance, deleteAmbulance } from '../api';
import { toast } from '../toast';
import LiveMap from './LiveMap';

export default function Ambulances() {
  const [ambs, setAmbs] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ reg: '', driver: '', contact: '', type: 'BLS' });
  const [dispatching, setDispatching] = useState(null);
  const [destination, setDestination] = useState('');

  const load = async () => {
    try {
      const [a, s] = await Promise.all([getAmbulances(filter !== 'all' ? filter : undefined), getAmbulanceStats()]);
      setAmbs(a.data); setStats(s.data);
    } catch { toast('Failed to load ambulances', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const handleAdd = async () => {
    if (!form.reg || !form.driver) { toast('Registration and driver required', 'error'); return; }
    try {
      await addAmbulance(form);
      toast(`Ambulance added to fleet`, 'success');
      setShowAdd(false); setForm({ reg: '', driver: '', contact: '', type: 'BLS' }); load();
    } catch (e) { toast(e.response?.data?.detail || 'Failed to add ambulance', 'error'); }
  };

  const handleDispatch = async () => {
    try {
      await dispatchAmbulance(dispatching, destination || 'Unknown location');
      toast(`${dispatching} dispatched`, 'success');
      setDispatching(null); setDestination(''); load();
    } catch { toast('Failed to dispatch', 'error'); }
  };

  const icons = { ALS: '🚑', BLS: '🚐', NICU: '👶' };
  const sc = { active: 'badge-red', available: 'badge-green', maintenance: 'badge-yellow' };

  return (
    <div>
      <div className="section-title">🚑 Ambulance Management</div>
      <div className="section-sub">Fleet tracking, dispatch and maintenance management</div>

      <div className="grid4 mb-16">
        <div className="stat-card blue"><div className="stat-val">{stats.total ?? '--'}</div><div className="stat-label">Total Fleet</div></div>
        <div className="stat-card red"><div className="stat-val">{stats.active ?? '--'}</div><div className="stat-label">On Mission</div></div>
        <div className="stat-card green"><div className="stat-val">{stats.available ?? '--'}</div><div className="stat-label">Available</div></div>
        <div className="stat-card yellow"><div className="stat-val">{stats.maintenance ?? '--'}</div><div className="stat-label">Maintenance</div></div>
      </div>

      <div className="flex-between mb-16">
        <select className="form-control" style={{ width: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Units</option>
          <option value="active">On Mission</option>
          <option value="available">Available</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Ambulance</button>
      </div>

      <div className="mb-16">
        <LiveMap
          title="Ambulance Live Locations"
          markers={ambs.map((a) => ({
            latitude: Number(a.latitude),
            longitude: Number(a.longitude),
            title: `${a.id} • ${a.status}`,
          }))}
        />
      </div>

      {loading ? <div className="loading">Loading…</div> :
        <div className="grid3">
          {ambs.map(a => (
            <div key={a.id} className="amb-card">
              <div className="flex-between">
                <div>
                  <div className="amb-id">{a.id} {icons[a.type] || '🚑'}</div>
                  <div className="text-xs text-muted">{a.reg} · {a.type}</div>
                </div>
                <span className={`badge ${sc[a.status]}`}>{a.status}</span>
              </div>
              <div className="amb-info">
                <div><div className="amb-info-label">Driver</div><div className="amb-info-val">{a.driver}</div></div>
                <div><div className="amb-info-label">Contact</div><div className="amb-info-val">{a.contact}</div></div>
                <div><div className="amb-info-label">Location</div><div className="amb-info-val">📍 {a.location}</div></div>
                <div><div className="amb-info-label">ETA</div><div className="amb-info-val">⏱ {a.eta}</div></div>
                {a.patient && a.patient !== '-' && (
                  <div style={{ gridColumn: '1/-1' }}><div className="amb-info-label">Patient</div><div className="amb-info-val">{a.patient}</div></div>
                )}
              </div>
              <div className="flex-between mt-8 text-xs text-muted">
                <span>⛽ Fuel: {a.fuel}%</span>
                <span>🔧 Service: {a.last_service}</span>
              </div>
              <div className="progress-bar mt-8">
                <div className={`progress-fill ${a.fuel > 60 ? 'green' : a.fuel > 30 ? 'yellow' : 'red'}`} style={{ width: `${a.fuel}%` }} />
              </div>
              <div className="flex-gap mt-12" style={{ flexWrap: 'wrap' }}>
                {a.status === 'available' && <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => setDispatching(a.id)}>🚑 Dispatch</button>}
                {a.status === 'active' && <button className="btn btn-sm btn-warn" style={{ flex: 1 }} onClick={async () => { await recallAmbulance(a.id); toast(`${a.id} recalled`, 'info'); load(); }}>📡 Recall</button>}
                {a.status === 'maintenance' && <button className="btn btn-sm btn-success" style={{ flex: 1 }} onClick={async () => { await clearAmbulance(a.id); toast(`${a.id} cleared`, 'success'); load(); }}>✅ Clear</button>}
                <button className="btn btn-sm btn-ghost" onClick={async () => { await refuelAmbulance(a.id); toast(`${a.id} refuelled`, 'success'); load(); }}>⛽</button>
                <button className="btn btn-sm btn-danger" onClick={async () => { if(confirm(`Delete ${a.id}?`)) { await deleteAmbulance(a.id); toast(`${a.id} removed`, 'warn'); load(); } }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      }

      {/* Dispatch Modal */}
      {dispatching && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setDispatching(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setDispatching(null)}>✕</button>
            <div className="modal-title">🚑 Dispatch {dispatching}</div>
            <div className="form-group"><label className="form-label">Destination / Location</label>
              <input className="form-control" value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Rajiv Chowk Metro, Sector 9…" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDispatching(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDispatch}>🚑 Dispatch</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ambulance Modal */}
      {showAdd && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            <div className="modal-title">🚑 Add Ambulance</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Registration No. *</label>
                <input className="form-control" value={form.reg} onChange={e => setForm(f => ({ ...f, reg: e.target.value }))} placeholder="DL-XX-EA-XXXX" />
              </div>
              <div className="form-group"><label className="form-label">Type</label>
                <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option>ALS</option><option>BLS</option><option>NICU</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Driver Name *</label>
                <input className="form-control" value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} placeholder="Driver full name" />
              </div>
              <div className="form-group"><label className="form-label">Contact</label>
                <input className="form-control" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="98XXXXXXXX" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>+ Add to Fleet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
