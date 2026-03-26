import { useState, useEffect } from 'react';
import { getBlood, updateBlood } from '../api';
import { toast } from '../toast';

export default function Blood() {
  const [blood, setBlood] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'A+', units: '', operation: 'add' });

  const load = async () => {
    try { const r = await getBlood(); setBlood(r.data); } catch { toast('Failed to load blood bank', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleUpdate = async (operation) => {
    const units = parseInt(form.units);
    if (!units || units <= 0) { toast('Enter valid units', 'error'); return; }
    try {
      await updateBlood({ type: form.type, units, operation });
      toast(`${form.type}: ${operation === 'add' ? '+' : '-'}${units} units`, operation === 'add' ? 'success' : 'warn');
      setShowModal(false);
      setForm(f => ({ ...f, units: '' }));
      load();
    } catch (e) { toast(e.response?.data?.detail || 'Error updating blood', 'error'); }
  };

  const alerts = blood.filter(b => b.pct < 30);

  return (
    <div>
      <div className="section-title">🩸 Blood Bank Management</div>
      <div className="section-sub">Inventory and transfusion management — live from Supabase</div>

      {loading ? <div className="loading">Loading…</div> : <>
        {alerts.length > 0 && alerts.map(b => (
          <div key={b.type} className="alert alert-danger">
            <span>🚨</span>
            <span>Blood type <strong>{b.type}</strong> critically low: {b.units} units ({b.pct}%)</span>
          </div>
        ))}
        {alerts.length === 0 && <div className="alert alert-success"><span>✅</span><span>All blood types at acceptable levels.</span></div>}

        <div className="flex-between mb-16">
          <div />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Update Stock</button>
        </div>

        <div className="blood-grid">
          {blood.map(b => (
            <div key={b.type} className="blood-card">
              <div className="blood-type">{b.type}</div>
              <div className="blood-units">{b.units}</div>
              <div className="blood-label">units / {b.capacity}</div>
              <div className="blood-bar">
                <div className={`blood-fill ${b.level === 'ok' ? 'ok' : b.level === 'low' ? 'med' : 'low'}`} style={{ width: `${b.pct}%` }} />
              </div>
              <div className="flex-between mt-8">
                <span className={`badge ${b.pct < 30 ? 'badge-red' : b.pct < 60 ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: 10 }}>{b.pct}%</span>
                <button className="btn btn-xs btn-ghost" onClick={() => { setForm({ type: b.type, units: '', operation: 'deduct' }); setShowModal(true); }}>Request</button>
              </div>
            </div>
          ))}
        </div>
      </>}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <div className="modal-title">🩸 Update Blood Stock</div>
            <div className="form-group"><label className="form-label">Blood Type</label>
              <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Units</label>
              <input className="form-control" type="number" value={form.units} onChange={e => setForm(f => ({ ...f, units: e.target.value }))} placeholder="Number of units" min="1" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleUpdate('deduct')}>− Use Units</button>
              <button className="btn btn-success" onClick={() => handleUpdate('add')}>+ Add Units</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
