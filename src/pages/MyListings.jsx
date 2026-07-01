import React, { useState, useEffect } from 'react';
import { Home, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Image, PlusCircle, Edit3, X, Save } from 'lucide-react';
import { api } from '../api';

const SRI_LANKA_CITIES = [
  'Colombo','Kandy','Galle','Matara','Jaffna',
  'Negombo','Kurunegala','Anuradhapura','Ratnapura','Badulla',
];

export default function MyListings({ user }) {
  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingBoarding, setEditingBoarding] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const data = await api.getMyListings();
      setBoardings(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    try {
      await api.deleteBoarding(id);
      setBoardings(boardings.filter(b => b.id !== id));
    } catch (err) {
      alert('Failed to delete boarding: ' + err.message);
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

  const handleEditSave = async () => {
    try {
      setSaving(true);
      await api.updateBoarding(editingBoarding.id, editForm);
      setBoardings(boardings.map(b => b.id === editingBoarding.id ? { ...b, ...editForm, status: 'pending' } : b)); // editing resets status to pending for re-approval
      setEditingBoarding(null);
    } catch (err) {
      alert('Failed to update boarding: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-card border border-border rounded-2xl max-w-sm">
          <AlertCircle size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Login Required</h2>
          <p className="text-sm text-muted-foreground mb-4">Please log in to view your listings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

        .mylistings-root {
          padding: 40px 24px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'DM Sans', sans-serif;
        }

        .mylistings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .mylistings-title-box {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mylistings-icon-box {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: 0 8px 32px rgba(99,102,241,0.3);
        }

        .mylistings-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem; font-weight: 800;
          line-height: 1.1; letter-spacing: -0.02em;
        }

        .mylistings-sub {
          color: var(--muted-foreground);
          font-size: 0.95rem; margin-top: 4px;
        }

        .mylistings-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }

        .mylistings-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mylistings-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 800px; /* Ensures table columns don't squish excessively */
        }

        .mylistings-table th {
          padding: 18px 24px;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--color-border);
          color: var(--muted-foreground);
        }

        .mylistings-table td {
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }

        .mylistings-table tr:last-child td {
          border-bottom: none;
        }

        .boarding-info {
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 320px;
        }

        .boarding-thumb {
          width: 64px;
          height: 64px;
          border-radius: 14px;
          object-fit: cover;
          background: var(--color-input);
          flex-shrink: 0;
        }

        .boarding-thumb-placeholder {
          width: 64px;
          height: 64px;
          border-radius: 14px;
          background: var(--color-input);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted-foreground);
          flex-shrink: 0;
        }

        .boarding-name {
          font-weight: 700;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .boarding-meta {
          font-size: 0.85rem;
          color: var(--muted-foreground);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .price-tag {
          font-weight: 700;
          color: var(--color-primary);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        .status-approved {
          background: rgba(16,185,129,0.1);
          color: #10b981;
        }

        .status-pending {
          background: rgba(245,158,11,0.1);
          color: #f59e0b;
        }

        .status-rejected {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
        }

        .action-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          background: var(--color-card);
          color: var(--color-foreground);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border-color: rgba(239,68,68,0.2);
        }

        .empty-state {
          text-align: center;
          padding: 80px 24px;
        }

        .empty-state-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: rgba(99,102,241,0.1);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .btn-create {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--color-primary);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(99,102,241,0.3);
          transition: all 0.2s;
        }

        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.4);
        }

        /* Edit Modal Overlay */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(2,6,23,0.85);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 24px;
          animation: fadeIn 0.25s ease;
        }

        .modal-content {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          width: 100%; max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: space-between;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-grid {
          display: grid;
          grid-template-cols: 1fr;
          gap: 16px;
        }
        @media(min-width: 640px) {
          .modal-grid { grid-template-cols: 1fr 1fr; }
          .modal-grid-span { grid-column: span 2; }
        }

        .modal-label {
          display: block;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--muted-foreground);
          margin-bottom: 6px;
        }

        .modal-input, .modal-textarea, .modal-select {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: white;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }

        .modal-input:focus, .modal-textarea:focus, .modal-select:focus {
          border-color: var(--color-primary);
          background: rgba(255,255,255,0.05);
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; justify-content: flex-end; gap: 12px;
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-cancel:hover {
          background: rgba(255,255,255,0.05);
        }

        .btn-save {
          background: var(--color-primary);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-save:hover {
          background: var(--color-primary-hover);
        }

        .action-btn.edit-btn:hover {
          background: rgba(99,102,241,0.1) !important;
          color: var(--color-primary) !important;
          border-color: rgba(99,102,241,0.2) !important;
        }
      `}</style>

      <div className="mylistings-root">
        <div className="mylistings-header">
          <div className="mylistings-title-box">
            <div className="mylistings-icon-box">
              <Home size={24} />
            </div>
            <div>
              <h2 className="mylistings-title">My Boardings</h2>
              <div className="mylistings-sub">Manage and view status of your uploaded listings</div>
            </div>
          </div>
        </div>

        <div className="mylistings-card">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Loading your listings...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2">
              <AlertCircle size={32} />
              <p>{error}</p>
            </div>
          ) : boardings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Home size={28} /></div>
              <h3 className="text-xl font-bold mb-2">No Listings Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">You haven't uploaded any boarding places yet.</p>
              <button 
                onClick={() => window.location.hash = 'upload'} 
                className="btn-create"
              >
                <PlusCircle size={18} />
                Upload Your First Boarding
              </button>
            </div>
          ) : (
            <div className="mylistings-table-wrapper">
              <table className="mylistings-table">
                <thead>
                  <tr>
                    <th>Boarding</th>
                    <th>City</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {boardings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div className="boarding-info">
                          {b.images && b.images.length > 0 ? (
                            <img src={b.images[0]} alt="" className="boarding-thumb" />
                          ) : (
                            <div className="boarding-thumb-placeholder"><Image size={18} /></div>
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="boarding-name">{b.title}</div>
                            <div className="boarding-meta">{b.address}</div>
                          </div>
                        </div>
                      </td>
                      <td>{b.city}</td>
                      <td><span className="price-tag">LKR {Number(b.price).toLocaleString()}</span></td>
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => openEdit(b)}
                            title="Edit Listing"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleDelete(b.id, b.title)}
                            title="Delete Listing"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal Overlay */}
        {editingBoarding && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Edit3 size={20} className="text-primary" /> Edit Boarding
                </h3>
                <button 
                  onClick={() => setEditingBoarding(null)} 
                  style={{ background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-grid">
                  <div className="modal-grid-span">
                    <label className="modal-label">Title</label>
                    <input 
                      type="text" 
                      className="modal-input"
                      value={editForm.title || ''}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="modal-label">Price (LKR)</label>
                    <input 
                      type="number" 
                      className="modal-input"
                      value={editForm.price || ''}
                      onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="modal-label">Contact Number</label>
                    <input 
                      type="text" 
                      className="modal-input"
                      value={editForm.contact || ''}
                      onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="modal-label">City</label>
                    <select 
                      className="modal-select"
                      value={editForm.city || ''}
                      onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    >
                      {SRI_LANKA_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="modal-label">Suitable For (Gender)</label>
                    <select 
                      className="modal-select"
                      value={editForm.gender || 'any'}
                      onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                    >
                      <option value="any">Any (Boys or Girls)</option>
                      <option value="boys">Boys Only</option>
                      <option value="girls">Girls Only</option>
                    </select>
                  </div>

                  <div className="modal-grid-span">
                    <label className="modal-label">Address</label>
                    <input 
                      type="text" 
                      className="modal-input"
                      value={editForm.address || ''}
                      onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>

                  <div className="modal-grid-span">
                    <label className="modal-label">Description</label>
                    <textarea 
                      rows={4} 
                      className="modal-textarea"
                      value={editForm.description || ''}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setEditingBoarding(null)}>Cancel</button>
                <button className="btn-save" onClick={handleEditSave} disabled={saving}>
                  {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={16} />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
