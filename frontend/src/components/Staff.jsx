import { useState, useEffect } from 'react';
import { getStaff, getStaffStats, addStaff, updateStaff, deleteStaff } from '../api';
import { toast } from '../toast';

const COLORS = ['#00d4ff','#7c3aed','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6'];
const sc = { 'on-duty': 'badge-green', 'off-duty': 'badge-blue', 'on-leave': 'badge-yellow' };

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', dept: 'ICU', shift: 'Morning', phone: '' });

  const load = async () => {
    try {
      const [s, st] = await Promise.all([getStaff(filter !== 'all' ? filter : undefined, search || undefined), getStaffStats()]);
      setStaff(s.data); setStats(st.data);
    } catch { toast('Failed to load staff', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter, search]);

  const handleAdd = async () => {
    if (!form.name || !form.role || !form.dept) { toast('Fill required fields', 'error'); return; }
    try {
      await addStaff({ ...form, status: 'on-duty' });
      toast(`${form.name} added to staff`, 'success');
      setShowAdd(false); setForm({ name: '', role: '', dept: 'ICU', shift: 'Morning', phone: '' }); load();
    } catch (e) { toast(e.response?.data?.detail || 'Failed to add staff', 'error'); }
  };

  const handleStatusChange = async (s, newStatus) => {
    try {
      await updateStaff(s.id, { status: newStatus });
      toast(`${s.name} → ${newStatus}`, 'success'); load();
    } catch { toast('Failed to update', 'error'); }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Remove ${s.name} from staff?`)) return;
    try {
      await deleteStaff(s.id);
      toast(`${s.name} removed`, 'error'); load();
    } catch { toast('Failed to delete', 'error'); }
  };

  return (
    <div>
      <div className="section-title">👨‍⚕️ Doctor & Staff Management</div>
      <div className="section-sub">Manage hospital staff — fully synced with Supabase</div>

      <div className="grid4 mb-16">
        <div className="stat-card blue"><div className="stat-val">{stats.total ?? '--'}</div><div className="stat-label">Total Staff</div></div>
        <div className="stat-card green"><div className="stat-val">{stats.on_duty ?? '--'}</div><div className="stat-label">On Duty</div></div>
        <div className="stat-card purple"><div className="stat-val">{stats.doctors ?? '--'}</div><div className="stat-label">Doctors</div></div>
        <div className="stat-card yellow"><div className="stat-val">{stats.nurses ?? '--'}</div><div className="stat-label">Nurses</div></div>
      </div>

      <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="pill-filters">
          {[['all','All'],['on-duty','On Duty'],['off-duty','Off Duty'],['on-leave','On Leave']].map(([v,l]) => (
            <button key={v} className={`pill ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <div className="flex-gap">
          <div className="search-bar">
            <span>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…" />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Staff</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading…</div> :
        staff.length === 0 ? <div className="empty">No staff found.</div> :
        <div className="grid2">
          {staff.map((s, i) => {
            const bg = COLORS[i % COLORS.length];
            const initials = s.name.split(' ').map(w => w[0]).slice(0, 2).join('');
            return (
              <div key={s.id} className="staff-card">
                <div className="staff-avatar" style={{ background: `${bg}22`, color: bg }}>{initials}</div>
                <div className="staff-info">
                  <div className="staff-name">{s.name}</div>
                  <div className="staff-role">{s.role} · {s.dept}</div>
                  <div className="flex-gap mt-8">
                    <span className={`badge ${sc[s.status]}`}>{s.status}</span>
                    <span className="text-xs text-muted">Shift: {s.shift}</span>
                    {s.phone && <span className="text-xs text-muted">📞 {s.phone}</span>}
                  </div>
                  <div className="flex-gap mt-8" style={{ flexWrap: 'wrap' }}>
                    {s.status !== 'on-duty'  && <button className="btn btn-xs btn-success" onClick={() => handleStatusChange(s, 'on-duty')}>→ On Duty</button>}
                    {s.status !== 'off-duty' && <button className="btn btn-xs btn-ghost"   onClick={() => handleStatusChange(s, 'off-duty')}>→ Off Duty</button>}
                    {s.status !== 'on-leave' && <button className="btn btn-xs btn-warn"    onClick={() => handleStatusChange(s, 'on-leave')}>→ On Leave</button>}
                  </div>
                </div>
                <div className="staff-actions">
                  <button className="btn btn-xs btn-danger" onClick={() => handleDelete(s)} title="Remove">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      }

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            <div className="modal-title">👨‍⚕️ Add Staff Member</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. / Mr. / Ms." />
              </div>
              <div className="form-group"><label className="form-label">Role / Designation *</label>
                <input className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Cardiologist, Head Nurse…" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Department *</label>
                <select className="form-control" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}>
                  {['ICU','Emergency','Cardiology','Surgery','Neurology','Pediatrics','Maternity','Radiology','Pathology','Orthopedics','General Ward'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Shift</label>
                <select className="form-control" value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}>
                  {['Morning','Evening','Night','Rotational'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="98XXXXXXXX" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>✅ Add Staff</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
