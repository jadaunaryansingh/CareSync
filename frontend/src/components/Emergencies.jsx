import { useState, useEffect } from 'react';
import { getEmergencies, getEmergencyStats, getEmergencyMap, createEmergency, approveEmergency, declineEmergency, resolveEmergency, reopenEmergency } from '../api';
import { toast } from '../toast';
import LiveMap from './LiveMap';

export default function Emergencies() {
  const [emgs, setEmgs] = useState([]);
  const [stats, setStats] = useState({});
  const [mapMarkers, setMapMarkers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: '', location: '', priority: 'critical', patient: '', caller: '', details: '' });

  const load = async () => {
    try {
      const [e, s] = await Promise.all([
        getEmergencies(filter !== 'all' ? filter : undefined),
        getEmergencyStats()
      ]);
      setEmgs(e.data); setStats(s.data);

      const mapRes = await getEmergencyMap();
      const nextMarkers = [];
      if (mapRes.data?.hospital) nextMarkers.push(mapRes.data.hospital);
      if (Array.isArray(mapRes.data?.emergencies)) nextMarkers.push(...mapRes.data.emergencies);
      setMapMarkers(nextMarkers);
    } catch { toast('Failed to load emergencies', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const handleCreate = async () => {
    if (!form.type || !form.location) { toast('Type and location are required', 'error'); return; }
    try {
      const r = await createEmergency({ ...form, requested_by: form.caller || 'Hospital Staff' });
      toast(`Emergency ${r.data.id} created`, 'warn');
      setShowCreate(false); setForm({ type: '', location: '', priority: 'critical', patient: '', caller: '', details: '' }); load();
    } catch (e) { toast(e.response?.data?.detail || 'Failed to create emergency', 'error'); }
  };

  const action = async (fn, id, msg, type = 'success') => {
    try { await fn(id); toast(msg, type); load(); } catch { toast('Action failed', 'error'); }
  };

  const priorityLabel = { critical: '🔴 CRITICAL', high: '🟠 HIGH PRIORITY', medium: '🟡 MEDIUM' };

  return (
    <div>
      <div className="section-title">🚨 Emergency Portal</div>
      <div className="section-sub">Manage incoming emergency requests — approve, decline or escalate</div>

      <div className="grid4 mb-16">
        <div className="stat-card yellow"><div className="stat-val">{stats.pending ?? '--'}</div><div className="stat-label">Pending</div></div>
        <div className="stat-card green"><div className="stat-val">{stats.approved ?? '--'}</div><div className="stat-label">Approved</div></div>
        <div className="stat-card red"><div className="stat-val">{stats.declined ?? '--'}</div><div className="stat-label">Declined</div></div>
        <div className="stat-card blue"><div className="stat-val">{stats.total ?? '--'}</div><div className="stat-label">Total</div></div>
      </div>

      <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="pill-filters">
          {[['all','All'],['pending','⏳ Pending'],['approved','✅ Approved'],['declined','❌ Declined'],['resolved','✔ Resolved']].map(([v,l]) => (
            <button key={v} className={`pill ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <button className="btn btn-danger" onClick={() => setShowCreate(true)}>🚨 Create Emergency</button>
      </div>

      <div className="mb-16">
        <LiveMap
          title="Emergency Incident Map"
          markers={mapMarkers.map((m) => ({
            latitude: Number(m.latitude),
            longitude: Number(m.longitude),
            title: m.title,
          }))}
        />
      </div>

      {loading ? <div className="loading">Loading…</div> :
        emgs.length === 0 ? <div className="empty">No emergencies found.</div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {emgs.map(e => (
            <div key={e.id} className={`emerg-card ${e.priority}`}>
              <div className="emerg-header">
                <div>
                  <div className="emerg-priority blink">{priorityLabel[e.priority]}</div>
                  <div className="emerg-title">{e.type}</div>
                  <div className="emerg-id">{e.id}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={`badge ${e.status === 'pending' ? 'badge-yellow' : e.status === 'approved' ? 'badge-green' : e.status === 'resolved' ? 'badge-blue' : 'badge-red'}`}>
                    {e.status}
                  </span>
                  <div className="text-xs text-muted mt-4">
                    {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="emerg-meta">
                <span>👤 {e.patient}</span>
                <span>📍 {e.location}</span>
                {e.caller && <span>📞 {e.caller}</span>}
                {e.requested_by && <span>🏥 By: {e.requested_by}</span>}
              </div>
              {e.details && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>{e.details}</div>}
              <div className="emerg-actions">
                {e.status === 'pending' && <>
                  <button className="btn btn-sm btn-success" onClick={() => action(approveEmergency, e.id, `${e.id} APPROVED — dispatching resources`)}>✅ Approve & Dispatch</button>
                  <button className="btn btn-sm btn-danger"  onClick={() => action(declineEmergency, e.id, `${e.id} declined`, 'error')}>❌ Decline</button>
                  <button className="btn btn-sm btn-ghost"   onClick={() => toast(`${e.id} escalated to medical director`, 'warn')}>⬆️ Escalate</button>
                </>}
                {e.status === 'approved' && <>
                  <button className="btn btn-sm btn-ghost"   onClick={() => action(resolveEmergency, e.id, `${e.id} marked resolved`)}>✔ Mark Resolved</button>
                  <button className="btn btn-sm btn-danger"  onClick={() => action(declineEmergency, e.id, `${e.id} cancelled`, 'error')}>Cancel</button>
                </>}
                {(e.status === 'declined' || e.status === 'resolved') &&
                  <button className="btn btn-sm btn-ghost" onClick={() => action(reopenEmergency, e.id, `${e.id} reopened`, 'info')}>🔄 Reopen</button>
                }
              </div>
            </div>
          ))}
        </div>
      }

      {/* Create Emergency Modal */}
      {showCreate && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            <div className="modal-title">🚨 Create Emergency Request</div>
            <div className="form-group"><label className="form-label">Emergency Type *</label>
              <input className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Cardiac Arrest, Road Accident…" />
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Location *</label>
                <input className="form-control" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Area, Landmark, Address" />
              </div>
              <div className="form-group"><label className="form-label">Priority *</label>
                <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Patient</label>
              <input className="form-control" value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))} placeholder="Patient name / description" />
            </div>
            <div className="form-group"><label className="form-label">Reported By / Caller</label>
              <input className="form-control" value={form.caller} onChange={e => setForm(f => ({ ...f, caller: e.target.value }))} placeholder="Police, Family, Public…" />
            </div>
            <div className="form-group"><label className="form-label">Details</label>
              <textarea className="form-control" rows={3} value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} placeholder="Describe the situation…" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleCreate}>🚨 Submit Emergency</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
