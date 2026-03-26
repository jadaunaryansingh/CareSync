import { useState, useEffect, useCallback } from 'react';
import { getRegistrations, approveRegistration, rejectRegistration } from '../api';
import { toast } from '../toast';

export default function AdminRegistrations() {
  const [regs, setRegs] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getRegistrations(filter !== 'all' ? filter : undefined);
      setRegs(data);
    } catch (e) {
      toast('Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id, name) => {
    if (!confirm(`Approve hospital "${name}"? They will be able to login.`)) return;
    try {
      await approveRegistration(id);
      toast(`${name} approved!`, 'success');
      load();
    } catch {
      toast('Failed to approve', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await rejectRegistration(rejectId, rejectReason);
      toast('Registration rejected', 'warn');
      setRejectId(null);
      setRejectReason('');
      load();
    } catch {
      toast('Failed to reject', 'error');
    }
  };

  const statusBadge = (s) => {
    if (s === 'approved') return <span className="badge badge-green">Approved</span>;
    if (s === 'rejected') return <span className="badge badge-red">Rejected</span>;
    return <span className="badge badge-yellow blink">Pending</span>;
  };

  return (
    <div>
      <div className="flex-between mb-8">
        <div>
          <div className="section-title">📋 Hospital Registrations</div>
          <div className="section-sub">Review and approve hospital registration requests</div>
        </div>
      </div>

      <div className="card mb-16">
        <div className="card-header">
          <span className="card-title">Filter</span>
          <div className="pill-filters">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button key={s} className={`pill ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <div className="loading">Loading registrations…</div> :
        regs.length === 0 ? <div className="empty">No {filter} registrations found.</div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {regs.map(r => (
            <div key={r.id} className="card" style={{ borderLeft: `3px solid ${r.status === 'pending' ? 'var(--warn)' : r.status === 'approved' ? 'var(--accent3)' : 'var(--danger)'}` }}>
              <div className="flex-between mb-8">
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{r.hospital_name}</div>
                  <div className="text-muted text-xs">{r.email}</div>
                </div>
                {statusBadge(r.status)}
              </div>
              <div className="form-row mb-12">
                <div>
                  <div className="form-label">Medical License No.</div>
                  <strong style={{ color: 'var(--accent)', fontFamily: 'Orbitron, monospace', fontSize: 13 }}>{r.medical_license_no}</strong>
                </div>
                <div>
                  <div className="form-label">Phone</div>
                  <strong>{r.phone || '—'}</strong>
                </div>
              </div>
              <div className="form-row mb-12">
                <div>
                  <div className="form-label">Address</div>
                  <span className="text-sm">{r.address || '—'}</span>
                </div>
                <div>
                  <div className="form-label">Applied On</div>
                  <span className="text-sm">{new Date(r.created_at).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {r.status === 'rejected' && r.rejection_reason && (
                <div className="alert alert-danger mb-12">
                  <span>❌</span> Rejection reason: {r.rejection_reason}
                </div>
              )}

              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => { setRejectId(r.id); setRejectReason(''); }}>
                    ✕ Reject
                  </button>
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id, r.hospital_name)}>
                    ✓ Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      }

      {/* Reject modal */}
      {rejectId && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setRejectId(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setRejectId(null)}>✕</button>
            <div className="modal-title">Reject Registration</div>
            <div className="form-group">
              <label className="form-label">Reason for Rejection</label>
              <input className="form-control" placeholder="e.g. Invalid license number"
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
