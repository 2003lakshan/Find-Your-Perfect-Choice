import React, { useState, useEffect } from 'react';
import { Users, Trash2, Shield, AlertCircle, Home, CheckCircle, XCircle, Clock, Edit3, X, Save, Eye, Image, FileText } from 'lucide-react';
import { api } from '../api';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('boardings');
  const [users, setUsers] = useState([]);
  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBoarding, setEditingBoarding] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'users') fetchUsers();
      else fetchBoardings();
    }
  }, [user, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardings = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminBoardings();
      setBoardings(data);
    } catch (err) {
      setError('Failed to load boardings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === user.id) { alert("You cannot delete yourself."); return; }
    if (!window.confirm(`Are you sure you want to delete user ${name}?`)) return;
    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleDeleteBoarding = async (id, title) => {
    if (!window.confirm(`Delete boarding "${title}"? This cannot be undone.`)) return;
    try {
      await api.deleteBoarding(id);
      setBoardings(boardings.filter(b => b.id !== id));
    } catch (err) {
      alert('Failed to delete boarding: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateBoardingStatus(id, newStatus);
      setBoardings(boardings.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleEditSave = async () => {
    try {
      await api.updateBoarding(editingBoarding.id, editForm);
      setBoardings(boardings.map(b => b.id === editingBoarding.id ? { ...b, ...editForm } : b));
      setEditingBoarding(null);
    } catch (err) {
      alert('Failed to update boarding: ' + err.message);
    }
  };

  const openEdit = (boarding) => {
    setEditingBoarding(boarding);
    setEditForm({
      title: boarding.title,
      description: boarding.description || '',
      address: boarding.address,
      city: boarding.city,
      price: boarding.price,
      contact: boarding.contact,
      gender: boarding.gender || 'any',
    });
  };

  const filteredBoardings = statusFilter === 'all'
    ? boardings
    : boardings.filter(b => b.status === statusFilter);

  const counts = {
    all: boardings.length,
    pending: boardings.filter(b => b.status === 'pending').length,
    approved: boardings.filter(b => b.status === 'approved').length,
    rejected: boardings.filter(b => b.status === 'rejected').length,
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You must be an administrator to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');

        .admin-root {
          padding: 40px 24px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'DM Sans', sans-serif;
        }

        .admin-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .admin-icon-box {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: 0 8px 32px rgba(99,102,241,0.3);
        }

        .admin-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem; font-weight: 800;
          line-height: 1.1; letter-spacing: -0.02em;
        }

        .admin-sub {
          color: var(--muted-foreground);
          font-size: 0.95rem; margin-top: 4px;
        }

        /* Tabs */
        .admin-tabs {
          display: flex; gap: 4px;
          background: var(--input); border: 1px solid var(--border);
          border-radius: 16px; padding: 4px; margin-bottom: 24px;
          width: fit-content;
        }

        .admin-tab {
          padding: 10px 24px; border-radius: 12px; border: none;
          background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 600;
          color: var(--muted-foreground); transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
        }

        .admin-tab.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }

        .admin-tab:not(.active):hover {
          color: var(--foreground);
          background: rgba(0,0,0,0.03);
        }

        .tab-count {
          background: rgba(255,255,255,0.2);
          padding: 2px 8px; border-radius: 99px;
          font-size: 0.75rem; font-weight: 700;
        }

        .admin-tab:not(.active) .tab-count {
          background: var(--border);
        }

        /* Status Filters */
        .status-filters {
          display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
        }

        .status-chip {
          padding: 6px 16px; border-radius: 99px; border: 1.5px solid var(--border);
          background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600;
          color: var(--muted-foreground); transition: all 0.2s;
          display: flex; align-items: center; gap: 6px;
        }

        .status-chip.active {
          border-color: var(--primary);
          background: rgba(99,102,241,0.08);
          color: var(--primary);
        }

        .status-chip .chip-count {
          background: var(--border); padding: 1px 7px; border-radius: 99px;
          font-size: 0.72rem;
        }

        .status-chip.active .chip-count {
          background: rgba(99,102,241,0.15);
        }

        /* Card */
        .admin-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.02);
        }

        .admin-table-wrap { width: 100%; overflow-x: auto; }

        .admin-table {
          width: 100%; border-collapse: collapse; text-align: left;
        }

        .admin-table th {
          background: rgba(0,0,0,0.02);
          padding: 14px 20px; font-size: 0.72rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          font-weight: 700; color: var(--muted-foreground);
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }

        .admin-table td {
          padding: 16px 20px; border-bottom: 1px solid var(--border);
          vertical-align: middle; font-size: 0.9rem;
        }

        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tr:hover td { background: rgba(0,0,0,0.01); }

        /* Status Badges */
        .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 99px;
          font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.04em;
        }

        .status-pending {
          background: rgba(251,188,4,0.12); color: #d97706;
          border: 1px solid rgba(251,188,4,0.25);
        }

        .status-approved {
          background: rgba(34,197,94,0.12); color: #16a34a;
          border: 1px solid rgba(34,197,94,0.25);
        }

        .status-rejected {
          background: rgba(239,68,68,0.12); color: #dc2626;
          border: 1px solid rgba(239,68,68,0.25);
        }

        .role-badge {
          display: inline-flex; align-items: center;
          padding: 4px 10px; border-radius: 99px;
          font-size: 0.7rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .role-admin {
          background: rgba(139, 92, 246, 0.1); color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .role-user {
          background: rgba(59, 130, 246, 0.1); color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        /* Action Buttons */
        .action-btn {
          background: none; border: none; cursor: pointer;
          padding: 7px; border-radius: 8px; transition: all 0.2s;
          display: inline-flex; align-items: center; justify-content: center;
        }

        .action-btn.approve {
          color: var(--muted-foreground);
        }
        .action-btn.approve:hover {
          background: rgba(34,197,94,0.12); color: #16a34a;
        }

        .action-btn.reject {
          color: var(--muted-foreground);
        }
        .action-btn.reject:hover {
          background: rgba(239,68,68,0.1); color: #ef4444;
        }

        .action-btn.edit {
          color: var(--muted-foreground);
        }
        .action-btn.edit:hover {
          background: rgba(59,130,246,0.1); color: #3b82f6;
        }

        .action-btn.delete {
          color: var(--muted-foreground);
        }
        .action-btn.delete:hover {
          background: rgba(239,68,68,0.1); color: #ef4444;
        }

        .actions-cell {
          display: flex; gap: 2px; justify-content: flex-end;
        }

        /* Boarding thumbnail */
        .boarding-thumb {
          width: 52px; height: 52px; border-radius: 12px;
          object-fit: cover; border: 1px solid var(--border);
        }

        .boarding-thumb-placeholder {
          width: 52px; height: 52px; border-radius: 12px;
          background: var(--input); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--muted-foreground);
        }

        .boarding-info {
          display: flex; align-items: center; gap: 14px;
        }

        .boarding-name {
          font-weight: 600; font-size: 0.92rem;
        }

        .boarding-meta {
          font-size: 0.78rem; color: var(--muted-foreground); margin-top: 2px;
        }

        /* Stats row */
        .stats-row {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px; margin-bottom: 24px;
        }

        .stat-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px 24px;
          display: flex; align-items: center; gap: 14px;
        }

        .stat-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }

        .stat-icon.total { background: rgba(99,102,241,0.1); color: #6366f1; }
        .stat-icon.pending { background: rgba(251,188,4,0.12); color: #d97706; }
        .stat-icon.approved { background: rgba(34,197,94,0.12); color: #16a34a; }
        .stat-icon.rejected { background: rgba(239,68,68,0.12); color: #dc2626; }

        .stat-value {
          font-size: 1.6rem; font-weight: 800;
          font-family: 'Syne', sans-serif; line-height: 1;
        }

        .stat-label {
          font-size: 0.78rem; color: var(--muted-foreground);
          font-weight: 500; margin-top: 2px;
        }

        /* Edit Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 24px;
        }

        .modal-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 24px; padding: 32px;
          width: 100%; max-width: 540px; max-height: 90vh;
          overflow-y: auto; position: relative;
          box-shadow: 0 24px 80px rgba(0,0,0,0.25);
        }

        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.4rem; font-weight: 800;
          margin-bottom: 24px;
        }

        .modal-field {
          margin-bottom: 16px;
        }

        .modal-label {
          font-size: 0.78rem; font-weight: 600;
          color: var(--muted-foreground); text-transform: uppercase;
          letter-spacing: 0.06em; margin-bottom: 6px; display: block;
        }

        .modal-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid var(--border); border-radius: 12px;
          background: var(--input); font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; color: var(--foreground);
          outline: none; transition: border-color 0.2s;
        }

        .modal-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .modal-textarea {
          min-height: 80px; resize: vertical;
        }

        .modal-actions {
          display: flex; gap: 12px; margin-top: 24px;
          justify-content: flex-end;
        }

        .modal-btn {
          padding: 10px 24px; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          font-size: 0.9rem; cursor: pointer; border: none;
          display: flex; align-items: center; gap: 8px;
          transition: all 0.2s;
        }

        .modal-btn.primary {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }

        .modal-btn.primary:hover { transform: translateY(-1px); }

        .modal-btn.secondary {
          background: var(--input); border: 1px solid var(--border);
          color: var(--foreground);
        }

        .modal-btn.secondary:hover { background: var(--border); }

        .modal-close {
          position: absolute; top: 16px; right: 16px;
          background: none; border: none; cursor: pointer;
          color: var(--muted-foreground); padding: 6px;
          border-radius: 8px; transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(0,0,0,0.05); color: var(--foreground);
        }

        /* Price column */
        .price-tag {
          font-weight: 700; color: var(--primary);
          font-size: 0.92rem;
        }

        /* Empty state */
        .empty-state {
          text-align: center; padding: 60px 24px;
          color: var(--muted-foreground);
        }

        .empty-state-icon {
          width: 56px; height: 56px; margin: 0 auto 16px;
          background: var(--input); border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: var(--muted-foreground);
        }

        /* Dark mode overrides */
        .dark .admin-table th { background: rgba(255,255,255,0.02); }
        .dark .admin-table tr:hover td { background: rgba(255,255,255,0.02); }
        .dark .admin-tab:not(.active):hover { background: rgba(255,255,255,0.05); }
      `}</style>

      <div className="admin-root">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-icon-box">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-sub">Manage boardings, approvals & users</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab${activeTab === 'boardings' ? ' active' : ''}`}
            onClick={() => { setActiveTab('boardings'); setError(''); }}
          >
            <Home size={18} />
            Boardings
            <span className="tab-count">{counts.all}</span>
          </button>
          <button
            className={`admin-tab${activeTab === 'users' ? ' active' : ''}`}
            onClick={() => { setActiveTab('users'); setError(''); }}
          >
            <Users size={18} />
            Users
          </button>
        </div>

        {/* ============ BOARDINGS TAB ============ */}
        {activeTab === 'boardings' && (
          <>
            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon total"><Home size={22} /></div>
                <div>
                  <div className="stat-value">{counts.all}</div>
                  <div className="stat-label">Total Boardings</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pending"><Clock size={22} /></div>
                <div>
                  <div className="stat-value">{counts.pending}</div>
                  <div className="stat-label">Pending Approval</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon approved"><CheckCircle size={22} /></div>
                <div>
                  <div className="stat-value">{counts.approved}</div>
                  <div className="stat-label">Approved</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon rejected"><XCircle size={22} /></div>
                <div>
                  <div className="stat-value">{counts.rejected}</div>
                  <div className="stat-label">Rejected</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="status-filters">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s}
                  className={`status-chip${statusFilter === s ? ' active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' && 'All'}
                  {s === 'pending' && <><Clock size={14} /> Pending</>}
                  {s === 'approved' && <><CheckCircle size={14} /> Approved</>}
                  {s === 'rejected' && <><XCircle size={14} /> Rejected</>}
                  <span className="chip-count">{counts[s]}</span>
                </button>
              ))}
            </div>

            {/* Boardings Table */}
            <div className="admin-card">
              <div className="admin-table-wrap">
                {loading ? (
                  <div className="p-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    Loading boardings...
                  </div>
                ) : filteredBoardings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Home size={24} /></div>
                    <p style={{ fontWeight: 600 }}>No {statusFilter !== 'all' ? statusFilter : ''} boardings found</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Boardings will appear here when users upload them.</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Boarding</th>
                        <th>City</th>
                        <th>Price</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBoardings.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div className="boarding-info">
                              {b.images && b.images.length > 0 ? (
                                <img src={b.images[0]} alt="" className="boarding-thumb" />
                              ) : (
                                <div className="boarding-thumb-placeholder"><Image size={18} /></div>
                              )}
                              <div>
                                <div className="boarding-name">{b.title}</div>
                                <div className="boarding-meta">{b.address}</div>
                              </div>
                            </div>
                          </td>
                          <td>{b.city}</td>
                          <td><span className="price-tag">LKR {Number(b.price).toLocaleString()}</span></td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{b.owner_name}</div>
                            <div className="boarding-meta">{b.owner_email}</div>
                          </td>
                          <td>
                            <span className={`status-badge status-${b.status || 'pending'}`}>
                              {b.status === 'approved' && <CheckCircle size={12} />}
                              {b.status === 'pending' && <Clock size={12} />}
                              {b.status === 'rejected' && <XCircle size={12} />}
                              {b.status || 'pending'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                              {new Date(b.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <div className="actions-cell">
                              {b.status !== 'approved' && (
                                <button
                                  className="action-btn approve"
                                  onClick={() => handleStatusChange(b.id, 'approved')}
                                  title="Approve"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              {b.status !== 'rejected' && (
                                <button
                                  className="action-btn reject"
                                  onClick={() => handleStatusChange(b.id, 'rejected')}
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                              )}
                              {b.payment_receipt ? (
                                <a
                                  href={b.payment_receipt}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="action-btn flex items-center justify-center"
                                  title="View Receipt"
                                  style={{
                                    color: 'var(--color-primary)',
                                    background: 'rgba(99,102,241,0.15)',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    width: '32px',
                                    height: '32px'
                                  }}
                                >
                                  <FileText size={18} />
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground/60 italic self-center px-1">No Receipt</span>
                              )}
                              <button
                                className="action-btn edit"
                                onClick={() => openEdit(b)}
                                title="Edit"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => handleDeleteBoarding(b.id, b.title)}
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ============ USERS TAB ============ */}
        {activeTab === 'users' && (
          <div className="admin-card">
            <div className="admin-table-wrap">
              {loading ? (
                <div className="p-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  Loading users...
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div className="boarding-meta">{u.phone || 'No phone'}</div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {u.id !== user.id && (
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              title="Delete user"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ EDIT MODAL ============ */}
      {editingBoarding && (
        <div className="modal-overlay" onClick={() => setEditingBoarding(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingBoarding(null)}>
              <X size={20} />
            </button>
            <h2 className="modal-title">Edit Boarding</h2>

            <div className="modal-field">
              <label className="modal-label">Title</label>
              <input
                className="modal-input"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Description</label>
              <textarea
                className="modal-input modal-textarea"
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Address</label>
              <input
                className="modal-input"
                value={editForm.address}
                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="modal-field">
                <label className="modal-label">City</label>
                <input
                  className="modal-input"
                  value={editForm.city}
                  onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Price (LKR)</label>
                <input
                  className="modal-input"
                  type="number"
                  value={editForm.price}
                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="modal-field">
                <label className="modal-label">Contact</label>
                <input
                  className="modal-input"
                  value={editForm.contact}
                  onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Gender</label>
                <select
                  className="modal-input"
                  value={editForm.gender || 'any'}
                  onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                >
                  <option value="any">Any</option>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setEditingBoarding(null)}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={handleEditSave}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
