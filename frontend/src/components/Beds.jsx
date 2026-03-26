import { useState, useEffect, useCallback } from 'react';
import { getBeds, getBedStats, createBed, admitPatient, dischargePatient, updateBedStatus, deleteBed } from '../api';
import { toast } from '../toast';

function Modal({ id, open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

export default function Beds() {
  const [beds, setBeds] = useState([]);
  const [stats, setStats] = useState({});
  const [ward, setWard] = useState('All');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState(['ICU','General','Emergency','Pediatric','Maternity','Ortho','Cardiac']);

  // Modals
  const [detailBed, setDetailBed] = useState(null);
  const [showAddBed, setShowAddBed] = useState(false);
  const [showAdmit, setShowAdmit] = useState(false);

  // Add Bed form
  const [addForm, setAddForm] = useState({ ward: 'ICU', num: '', status: 'available' });

  // Admit form
  const [admitForm, setAdmitForm] = useState({ patient_name: '', patient_age: '', diagnosis: '', doctor: '' });

  const load = useCallback(async () => {
    try {
      const [bedsRes, statsRes] = await Promise.all([
        getBeds(ward !== 'All' ? ward : undefined, status !== 'all' ? status : undefined),
        getBedStats()
      ]);
      setBeds(bedsRes.data);
      setStats(statsRes.data);
      if (statsRes.data.wards?.length) setWards(['All', ...statsRes.data.wards]);
    } catch (e) {
      toast('Failed to load beds', 'error');
    } finally {
      setLoading(false);
    }
  }, [ward, status]);

  useEffect(() => { load(); }, [load]);

  const handleAddBed = async () => {
    if (!addForm.num) { toast('Enter bed number', 'error'); return; }
    try {
      await createBed({ ward: addForm.ward, num: parseInt(addForm.num), status: addForm.status });
      toast(`Bed ${addForm.ward.substring(0,3).toUpperCase()}-${String(addForm.num).padStart(2,'0')} added`, 'success');
      setShowAddBed(false);
      setAddForm({ ward: 'ICU', num: '', status: 'available' });
      load();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to add bed', 'error');
    }
  };

  const handleAdmit = async () => {
    if (!admitForm.patient_name) { toast('Enter patient name', 'error'); return; }
    try {
      await admitPatient(detailBed.id, {
        patient_name: admitForm.patient_name,
        patient_age: admitForm.patient_age ? parseInt(admitForm.patient_age) : null,
        diagnosis: admitForm.diagnosis,
        doctor: admitForm.doctor,
      });
      toast(`${admitForm.patient_name} admitted to Bed ${detailBed.id}`, 'success');
      setShowAdmit(false);
      setDetailBed(null);
      setAdmitForm({ patient_name: '', patient_age: '', diagnosis: '', doctor: '' });
      load();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to admit patient', 'error');
    }
  };

  const handleDischarge = async (bed) => {
    if (!confirm(`Discharge patient from Bed ${bed.id}?`)) return;
    try {
      await dischargePatient(bed.id);
      toast(`Patient discharged from Bed ${bed.id}`, 'success');
      setDetailBed(null);
      load();
    } catch {
      toast('Failed to discharge patient', 'error');
    }
  };

  const handleStatusChange = async (bed, newStatus) => {
    try {
      await updateBedStatus(bed.id, { status: newStatus });
      toast(`Bed ${bed.id} → ${newStatus}`, 'success');
      setDetailBed(null);
      load();
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  const handleDeleteBed = async (bed) => {
    if (!confirm(`Permanently delete Bed ${bed.id}? This cannot be undone.`)) return;
    try {
      await deleteBed(bed.id);
      toast(`Bed ${bed.id} deleted`, 'warn');
      setDetailBed(null);
      load();
    } catch {
      toast('Failed to delete bed', 'error');
    }
  };

  const wardList = wards.includes('All') ? wards : ['All', ...wards];

  return (
    <div>
      <div className="flex-between mb-8">
        <div>
          <div className="section-title">🛏️ Bed Management</div>
          <div className="section-sub">Real-time bed availability across all wards</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddBed(true)}>+ Add Bed</button>
      </div>

      {/* Stats */}
      <div className="grid4 mb-16">
        <div className="stat-card red"><div className="stat-val">{loading ? '–' : stats.occupied ?? '--'}</div><div className="stat-label">Occupied</div></div>
        <div className="stat-card green"><div className="stat-val">{loading ? '–' : stats.available ?? '--'}</div><div className="stat-label">Available</div></div>
        <div className="stat-card yellow"><div className="stat-val">{loading ? '–' : stats.total ?? '--'}</div><div className="stat-label">Total Beds</div></div>
        <div className="stat-card blue"><div className="stat-val">{loading ? '–' : stats.maintenance ?? '--'}</div><div className="stat-label">Maintenance</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title mb-8">Ward Filter</div>
            <div className="ward-selector">
              {wardList.map(w => (
                <button key={w} className={`ward-btn ${ward === w ? 'active' : ''}`} onClick={() => setWard(w)}>
                  {w === 'All' ? 'All Wards' : w}
                </button>
              ))}
            </div>
          </div>
          <select className="form-control" style={{ width: 140 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { s: 'available', c: 'rgba(16,185,129,0.3)', bc: 'rgba(16,185,129,0.6)' },
            { s: 'occupied',  c: 'rgba(239,68,68,0.3)',  bc: 'rgba(239,68,68,0.6)' },
            { s: 'reserved',  c: 'rgba(245,158,11,0.3)', bc: 'rgba(245,158,11,0.6)' },
            { s: 'maintenance',c:'rgba(100,116,139,0.2)',bc: 'rgba(100,116,139,0.4)' },
          ].map(l => (
            <span key={l.s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 12, height: 12, background: l.c, border: `1px solid ${l.bc}`, borderRadius: 3, display: 'inline-block' }} />
              {l.s.charAt(0).toUpperCase() + l.s.slice(1)}
            </span>
          ))}
        </div>

        {loading ? <div className="loading">Loading beds…</div> :
          beds.length === 0 ? <div className="empty">No beds match the filter.</div> :
          <div className="bed-grid">
            {beds.map(b => (
              <div key={b.id} className={`bed-item ${b.status}`} onClick={() => setDetailBed(b)}>
                <div>{b.status === 'occupied' ? '🛏️' : b.status === 'available' ? '✅' : b.status === 'reserved' ? '🔖' : '🔧'}</div>
                <div className="bed-num">{b.id}</div>
                <div className="bed-status">{b.status}</div>
              </div>
            ))}
          </div>
        }
      </div>

      {/* ---- Bed Detail Modal ---- */}
      <Modal open={!!detailBed} onClose={() => setDetailBed(null)} title={`🛏️ Bed ${detailBed?.id}`}>
        {detailBed && <>
          <div className="form-row mb-12">
            <div><div className="form-label">Ward</div><strong>{detailBed.ward}</strong></div>
            <div>
              <div className="form-label">Status</div>
              <span className={`badge ${detailBed.status === 'occupied' ? 'badge-red' : detailBed.status === 'available' ? 'badge-green' : detailBed.status === 'reserved' ? 'badge-yellow' : 'badge-blue'}`}>
                {detailBed.status}
              </span>
            </div>
          </div>

          {detailBed.status === 'occupied' && detailBed.patient_name && (
            <div className="card mb-12" style={{ background: 'var(--surface)' }}>
              <div className="card-title mb-8">🧑‍⚕️ Patient Information</div>
              <div className="form-row">
                <div><div className="form-label">Patient</div><strong>{detailBed.patient_name}</strong></div>
                <div><div className="form-label">Age</div><strong>{detailBed.patient_age || '–'}</strong></div>
              </div>
              <div className="form-row">
                <div><div className="form-label">Diagnosis</div><strong>{detailBed.diagnosis || '–'}</strong></div>
                <div><div className="form-label">Doctor</div><strong>{detailBed.doctor || '–'}</strong></div>
              </div>
              {detailBed.admitted_at && (
                <div><div className="form-label">Admitted At</div><strong>{new Date(detailBed.admitted_at).toLocaleString('en-IN')}</strong></div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="form-group">
            <div className="form-label">Change Status</div>
            <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
              {['available','reserved','maintenance'].filter(s => s !== detailBed.status).map(s => (
                <button key={s} className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(detailBed, s)}>
                  → {s}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            {detailBed.status !== 'occupied' && (
              <button className="btn btn-primary" onClick={() => setShowAdmit(true)}>+ Admit Patient</button>
            )}
            {detailBed.status === 'occupied' && (
              <button className="btn btn-warn" onClick={() => handleDischarge(detailBed)}>🏥 Discharge Patient</button>
            )}
            <button className="btn btn-danger" onClick={() => handleDeleteBed(detailBed)}>🗑️ Delete Bed</button>
            <button className="btn btn-ghost" onClick={() => setDetailBed(null)}>Close</button>
          </div>
        </>}
      </Modal>

      {/* ---- Admit Patient Modal ---- */}
      <Modal open={showAdmit} onClose={() => setShowAdmit(false)} title="+ Admit Patient">
        <div className="form-label mb-8" style={{ color: 'var(--accent)' }}>Admitting to Bed: {detailBed?.id} ({detailBed?.ward})</div>
        <div className="form-group"><label className="form-label">Patient Name *</label>
          <input className="form-control" value={admitForm.patient_name} onChange={e => setAdmitForm(f => ({ ...f, patient_name: e.target.value }))} placeholder="Full name" />
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Age</label>
            <input className="form-control" type="number" value={admitForm.patient_age} onChange={e => setAdmitForm(f => ({ ...f, patient_age: e.target.value }))} placeholder="Age" min="0" max="150" />
          </div>
          <div className="form-group"><label className="form-label">Doctor</label>
            <select className="form-control" value={admitForm.doctor} onChange={e => setAdmitForm(f => ({ ...f, doctor: e.target.value }))}>
              <option value="">Select doctor…</option>
              {['Dr. Mehta','Dr. Sharma','Dr. Nair','Dr. Rao','Dr. Khan'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Diagnosis / Condition</label>
          <input className="form-control" value={admitForm.diagnosis} onChange={e => setAdmitForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Cardiac Failure, Post-Op Recovery" />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setShowAdmit(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdmit}>✅ Admit Patient</button>
        </div>
      </Modal>

      {/* ---- Add Bed Modal ---- */}
      <Modal open={showAddBed} onClose={() => setShowAddBed(false)} title="🛏️ Add New Bed">
        <div className="form-row">
          <div className="form-group"><label className="form-label">Ward *</label>
            <select className="form-control" value={addForm.ward} onChange={e => setAddForm(f => ({ ...f, ward: e.target.value }))}>
              {['ICU','General','Emergency','Pediatric','Maternity','Ortho','Cardiac'].map(w => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Bed Number *</label>
            <input className="form-control" type="number" value={addForm.num} onChange={e => setAddForm(f => ({ ...f, num: e.target.value }))} placeholder="e.g. 25" min="1" />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Initial Status</label>
          <select className="form-control" value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Bed ID will be: <strong style={{ color: 'var(--accent)' }}>
            {addForm.ward ? `${addForm.ward.substring(0,3).toUpperCase()}-${String(addForm.num || '??').padStart(2,'0')}` : '–'}
          </strong>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setShowAddBed(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddBed}>+ Add Bed</button>
        </div>
      </Modal>
    </div>
  );
}
