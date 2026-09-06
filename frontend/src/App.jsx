import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Upload from './pages/Upload';
import AdminDashboard from './pages/AdminDashboard';
import MyListings from './pages/MyListings';
import ResetPassword from './pages/ResetPassword';
import MapMode from './components/MapMode';
import CityPicker from './components/CityPicker';
import { MapPin, Phone, Eye, LayoutGrid, Map, ChevronLeft, ChevronRight, X, Navigation2, SlidersHorizontal, ChevronDown, Star, Edit2, Check, MessageSquare } from 'lucide-react';
import { api } from './api';
import { VEHICLE_TYPE_LIST } from './data/sriLankaData';
import { NotificationProvider } from './context/NotificationContext';

function BoardingDetailModal({ boarding, onClose, user }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = boarding.images || [];

  // Review states
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingComment, setEditingComment] = useState('');

  useEffect(() => {
    api.getReviews(boarding.category, boarding.id)
      .then(data => setReviews(data))
      .catch(err => console.error("Failed to load reviews", err));
  }, [boarding.category, boarding.id]);

  const handleWhatsApp = () => {
    const numericContact = boarding.contact.replace(/\D/g, '');
    window.open(`https://wa.me/${numericContact}`, '_blank');
  };

  const handleDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${boarding.latitude},${boarding.longitude}`, '_blank');
  };

  const handleAddReview = async () => {
    if (!comment.trim()) return;
    try {
      await api.addReview({
        listing_id: boarding.id,
        listing_type: boarding.category,
        rating,
        comment
      });
      setComment('');
      const data = await api.getReviews(boarding.category, boarding.id);
      setReviews(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditReview = async (id) => {
    try {
      await api.editReviewByAdmin(id, editingComment);
      setEditingReviewId(null);
      const data = await api.getReviews(boarding.category, boarding.id);
      setReviews(data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[2000] flex items-center justify-center p-4 detail-modal-overlay">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-[600px] detail-modal-card">
        {/* Left Side: Image Gallery */}
        <div className="w-full md:w-1/2 relative bg-black/40 h-[220px] md:h-full flex flex-col justify-between flex-shrink-0">
          <div className="absolute inset-0">
            {images.length > 0 ? (
              <img 
                src={images[imgIdx]} 
                alt="" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-950">
                No Image Available
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button 
            onClick={onClose} 
            className="md:hidden absolute top-4 right-4 bg-black/60 text-white p-2.5 rounded-full z-10 hover:bg-black/80"
          >
            <X size={20} />
          </button>

          {images.length > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-10">
              <button 
                onClick={() => setImgIdx(prev => (prev - 1 + images.length) % images.length)}
                className="bg-black/65 hover:bg-black/80 text-white p-2 rounded-full border-none cursor-pointer flex items-center justify-center"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => setImgIdx(prev => (prev + 1) % images.length)}
                className="bg-black/65 hover:bg-black/80 text-white p-2 rounded-full border-none cursor-pointer flex items-center justify-center"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/75 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg z-10 flex gap-2">
              {imgIdx + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Right Side: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between h-[calc(100%-220px)] md:h-full bg-slate-900">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0 flex-1 pr-2">
                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {boarding.category === 'boarding' 
                    ? (boarding.gender === 'girls' ? 'Girls Only' : boarding.gender === 'boys' ? 'Boys Only' : 'Any Gender')
                    : boarding.category === 'vehicle' 
                      ? boarding.vehicle_type 
                      : 'Land'}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white mt-3 leading-tight break-words">{boarding.title}</h2>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-2 break-words">
                  <MapPin size={14} className="text-primary flex-shrink-0" />
                  <span>{boarding.address}, {boarding.city}</span>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="hidden md:flex bg-white/5 hover:bg-white/10 text-white p-2 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-t border-white/5 pt-4 mb-4">
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Monthly Rent</div>
              <div className="text-2xl font-black text-primary">
                LKR {Number(boarding.price).toLocaleString()}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mb-4">
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Description</div>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                {boarding.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs md:text-sm">
              <Phone size={14} className="text-primary" />
              <span>{boarding.contact}</span>
            </div>
            
            <div className="flex gap-2">
              {boarding.latitude && boarding.longitude && (
                <button
                  onClick={handleDirections}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white transition-all py-2.5 rounded-xl text-xs font-extrabold cursor-pointer border-none shadow-md shadow-primary/20"
                >
                  <Navigation2 size={14} />
                  Directions
                </button>
              )}
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white transition-all py-2.5 rounded-xl text-xs font-extrabold cursor-pointer border-none shadow-md shadow-green-500/20"
              >
                <Phone size={14} />
                WhatsApp
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-white/5 pt-6 mt-6 flex-shrink-0">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" /> 
              Reviews ({reviews.length})
            </h3>
            
            {user && (
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 mb-6" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3">Your Rating</div>
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      size={22}
                      className={`review-star ${rating >= star ? 'text-yellow-400 fill-yellow-400 active' : 'text-slate-600 hover:text-slate-400'}`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                  <span className="text-slate-500 text-xs ml-2 font-medium">{rating}/5</span>
                </div>
                <textarea 
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience with this listing..."
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_16px_rgba(212,168,50,0.10)] resize-none h-24 mb-4 transition-all"
                />
                <button 
                  onClick={handleAddReview}
                  disabled={!comment.trim()}
                  className="bg-gradient-to-r from-primary to-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 py-2.5 px-5 rounded-xl text-xs font-extrabold transition-all hover:shadow-[0_4px_20px_rgba(212,168,50,0.35)] hover:translate-y-[-1px]"
                >
                  ✨ Submit Review
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {reviews.map((review, rIdx) => (
                <div key={review.id} className="review-card" style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${rIdx * 0.08}s forwards`, opacity: 0 }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white text-sm font-bold">{review.user_name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'} />
                        ))}
                        <span className="text-slate-500 text-[10px] ml-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          setEditingReviewId(review.id);
                          setEditingComment(review.comment);
                        }}
                        className="text-slate-400 hover:text-primary transition-colors p-1"
                        title="Edit Review (Admin)"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>

                  {editingReviewId === review.id ? (
                    <div className="mt-3">
                      <textarea 
                        value={editingComment}
                        onChange={e => setEditingComment(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-primary resize-none mb-2"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditReview(review.id)}
                          className="bg-primary text-white py-1 px-3 rounded text-xs font-bold flex items-center gap-1"
                        >
                          <Check size={12} /> Save
                        </button>
                        <button 
                          onClick={() => setEditingReviewId(null)}
                          className="bg-white/10 text-white py-1 px-3 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 text-sm mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="text-center text-slate-500 py-6 text-sm">
                  No reviews yet. Be the first to leave one!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.pathname === '/reset-password') return 'reset-password';
    return 'home';
  });
  const [user, setUser] = useState(null);
  const [boardings, setBoardings] = useState([]); // This will hold all items
  const [filters, setFilters] = useState({ searchTerm: '', city: '' });
  const [categoryFilter, setCategoryFilter] = useState({ boarding: true, vehicle: true, land: true });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  // Advanced filters
  const [advFilters, setAdvFilters] = useState({
    priceMin: '', priceMax: '',
    vehicleType: '',
    filterCity: '',
  });
  const [showAdvFilters, setShowAdvFilters] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    api.getMe().then(u => { if (u) setUser(u); });
  }, []);

  // Fetch all items from backend
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getBoardings(filters.city, filters.searchTerm).catch(() => []),
      api.getVehicles(filters.city, filters.searchTerm).catch(() => []),
      api.getLands(filters.city, filters.searchTerm).catch(() => [])
    ]).then(([b, v, l]) => {
      const mappedB = b.map(x => ({ ...x, category: 'boarding' }));
      const mappedV = v.map(x => ({ ...x, category: 'vehicle' }));
      const mappedL = l.map(x => ({ ...x, category: 'land' }));
      setBoardings([...mappedB, ...mappedV, ...mappedL]);
    }).finally(() => setLoading(false));
  }, [filters]);

  const filteredBoardings = boardings.filter(b => {
    if (!categoryFilter[b.category]) return false;
    // Price filter
    const price = Number(b.price);
    if (advFilters.priceMin && price < Number(advFilters.priceMin)) return false;
    if (advFilters.priceMax && price > Number(advFilters.priceMax)) return false;
    // Vehicle type filter (only applies to vehicles)
    if (advFilters.vehicleType && b.category === 'vehicle' && b.vehicle_type !== advFilters.vehicleType) return false;
    // City filter (from advanced panel, overrides search bar city)
    if (advFilters.filterCity && b.city?.toLowerCase() !== advFilters.filterCity.toLowerCase()) return false;
    return true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const handleUpload = () => {
    // Refresh boardings after upload
    api.getBoardings().then(data => setBoardings(data)).catch(() => {});
  };

  return (
    <NotificationProvider user={user}>
      <div className="min-h-screen">
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        setUser={(u) => { if (!u) handleLogout(); else setUser(u); }}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="w-full">
        {currentPage === 'home' && (
          <>
            <Home setFilters={setFilters} boardings={boardings} setCategoryFilter={setCategoryFilter} categoryFilter={categoryFilter}>
              <div id="listings" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)', width:'100%', paddingTop:'80px', paddingBottom:'80px' }}>
              <section style={{ maxWidth:'1400px', margin:'0 auto', width:'100%', padding:'0 24px' }}>

                {/* Section Header */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'48px' }}>
                  <div style={{ textAlign:'center', marginBottom:'8px' }}>
                    <h3 style={{ fontSize:'2rem', fontWeight:800, color:'var(--color-foreground)', letterSpacing:'-0.02em' }}>
                      Explore All <span style={{ color:'#D4A832' }}>Listings</span>
                    </h3>
                    <p style={{ fontSize:'0.9rem', color:'var(--color-muted-foreground)', marginTop:'6px' }}>
                      {filteredBoardings.length} listings found
                    </p>
                  </div>

                  {/* Category Filter Pills */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginTop:'20px', marginBottom:'16px' }}>
                    {[
                      { key:'boarding', label:'🏠 Boardings', color:'#6366f1' },
                      { key:'vehicle',  label:'🚗 Vehicles',  color:'#f59e0b' },
                      { key:'land',     label:'🌿 Land',      color:'#10b981' },
                    ].map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setCategoryFilter(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                        style={{
                          display:'flex', alignItems:'center', gap:'6px',
                          padding:'8px 18px', borderRadius:'999px',
                          border:`1.5px solid ${categoryFilter[cat.key] ? cat.color : 'rgba(240,244,255,0.10)'}`,
                          background: categoryFilter[cat.key] ? `${cat.color}18` : 'transparent',
                          color: categoryFilter[cat.key] ? cat.color : 'var(--color-muted-foreground)',
                          fontSize:'13px', fontWeight:700, cursor:'pointer',
                          transition:'all 0.2s',
                          boxShadow: categoryFilter[cat.key] ? `0 0 16px ${cat.color}30` : 'none',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}

                    {/* Advanced filter toggle */}
                    <button
                      onClick={() => setShowAdvFilters(v => !v)}
                      style={{
                        display:'flex', alignItems:'center', gap:'6px',
                        padding:'8px 18px', borderRadius:'999px',
                        border: showAdvFilters ? '1.5px solid rgba(212,168,50,0.60)' : '1.5px solid rgba(240,244,255,0.10)',
                        background: showAdvFilters ? 'rgba(212,168,50,0.12)' : 'transparent',
                        color: showAdvFilters ? '#D4A832' : 'var(--color-muted-foreground)',
                        fontSize:'13px', fontWeight:700, cursor:'pointer', transition:'all 0.2s',
                      }}
                    >
                      <SlidersHorizontal size={14} />
                      Filters
                      <ChevronDown size={12} style={{ transition:'transform 0.2s', transform: showAdvFilters ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  </div>

                  {/* ── Advanced Filter Panel ── */}
                  {showAdvFilters && (
                    <div style={{
                      width:'100%', maxWidth:'900px', marginBottom:'20px',
                      background:'rgba(240,244,255,0.04)', border:'1px solid rgba(240,244,255,0.08)',
                      borderRadius:'18px', padding:'24px',
                      display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px',
                      animation:'fadeIn 0.25s ease',
                    }}>
                      {/* Price Min */}
                      <div>
                        <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#D4A832', marginBottom:'8px' }}>
                          Min Price (LKR)
                        </label>
                        <input
                          type="number"
                          value={advFilters.priceMin}
                          onChange={e => setAdvFilters(p => ({ ...p, priceMin: e.target.value }))}
                          placeholder="e.g. 5,000"
                          style={{
                            width:'100%', background:'rgba(240,244,255,0.06)',
                            border:'1.5px solid rgba(240,244,255,0.10)', borderRadius:'10px',
                            padding:'10px 14px', color:'var(--color-foreground)',
                            fontSize:'0.88rem', outline:'none', fontFamily:'inherit',
                          }}
                          onFocus={e => e.target.style.borderColor='rgba(212,168,50,0.50)'}
                          onBlur={e => e.target.style.borderColor='rgba(240,244,255,0.10)'}
                        />
                      </div>

                      {/* Price Max */}
                      <div>
                        <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#D4A832', marginBottom:'8px' }}>
                          Max Price (LKR)
                        </label>
                        <input
                          type="number"
                          value={advFilters.priceMax}
                          onChange={e => setAdvFilters(p => ({ ...p, priceMax: e.target.value }))}
                          placeholder="e.g. 200,000"
                          style={{
                            width:'100%', background:'rgba(240,244,255,0.06)',
                            border:'1.5px solid rgba(240,244,255,0.10)', borderRadius:'10px',
                            padding:'10px 14px', color:'var(--color-foreground)',
                            fontSize:'0.88rem', outline:'none', fontFamily:'inherit',
                          }}
                          onFocus={e => e.target.style.borderColor='rgba(212,168,50,0.50)'}
                          onBlur={e => e.target.style.borderColor='rgba(240,244,255,0.10)'}
                        />
                      </div>

                      {/* Vehicle Type (only visible when Vehicles is enabled) */}
                      {categoryFilter.vehicle && (
                        <div>
                          <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#D4A832', marginBottom:'8px' }}>
                            Vehicle Type
                          </label>
                          <div style={{ position:'relative' }}>
                            <select
                              value={advFilters.vehicleType}
                              onChange={e => setAdvFilters(p => ({ ...p, vehicleType: e.target.value }))}
                              style={{
                                width:'100%', background:'rgba(240,244,255,0.06)',
                                border:'1.5px solid rgba(240,244,255,0.10)', borderRadius:'10px',
                                padding:'10px 36px 10px 14px', color: advFilters.vehicleType ? 'var(--color-foreground)' : 'rgba(240,244,255,0.35)',
                                fontSize:'0.88rem', outline:'none', fontFamily:'inherit',
                                appearance:'none', cursor:'pointer',
                              }}
                            >
                              <option value="">All Vehicle Types</option>
                              {VEHICLE_TYPE_LIST.map(t => (
                                <option key={t} value={t} style={{ background:'#0d1b35', color:'#F0F4FF' }}>{t}</option>
                              ))}
                            </select>
                            <ChevronDown size={13} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'rgba(240,244,255,0.35)', pointerEvents:'none' }} />
                          </div>
                        </div>
                      )}

                      {/* City filter */}
                      <div>
                        <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#D4A832', marginBottom:'8px' }}>
                          Location / City
                        </label>
                        <CityPicker
                          value={advFilters.filterCity}
                          onChange={city => setAdvFilters(p => ({ ...p, filterCity: city }))}
                          placeholder="Type to search city…"
                        />
                      </div>

                      {/* Reset */}
                      <div style={{ display:'flex', alignItems:'flex-end' }}>
                        <button
                          onClick={() => setAdvFilters({ priceMin:'', priceMax:'', vehicleType:'', filterCity:'' })}
                          style={{
                            width:'100%', padding:'10px 14px', borderRadius:'10px',
                            border:'1.5px solid rgba(240,244,255,0.15)',
                            background:'transparent', color:'var(--color-muted-foreground)',
                            fontSize:'0.88rem', fontWeight:600, cursor:'pointer', transition:'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(240,244,255,0.06)'; e.currentTarget.style.color='var(--color-foreground)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--color-muted-foreground)'; }}
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>
                  )}

                  {/* View Mode Toggle */}
                  <style>{`
                    .vt-track { position:relative; display:flex; align-items:center; gap:4px; padding:5px; border-radius:14px;
                      background:rgba(240,244,255,0.05); border:1px solid rgba(240,244,255,0.08);
                      box-shadow:0 4px 24px rgba(0,0,0,0.12); }
                    .vt-track::before { content:''; position:absolute; top:5px; bottom:5px; width:calc(50% - 7px);
                      border-radius:10px; background:linear-gradient(135deg,#D4A832,#A07820);
                      box-shadow:0 4px 14px rgba(212,168,50,0.35); transition:transform 0.32s cubic-bezier(0.4,0,0.2,1); z-index:0; }
                    .vt-track.mode-list::before { transform:translateX(0); left:5px; }
                    .vt-track.mode-map::before  { transform:translateX(calc(100% + 4px)); left:5px; }
                    .vt-btn { position:relative; z-index:1; display:flex; align-items:center; gap:8px; padding:9px 22px;
                      border-radius:10px; border:none; background:transparent; cursor:pointer;
                      font-size:0.84rem; font-weight:700; letter-spacing:0.01em; white-space:nowrap;
                      color:rgba(240,244,255,0.50); transition:color 0.25s; }
                    .vt-btn.active { color:#050D1A; }
                    .vt-btn:not(.active):hover { color:rgba(240,244,255,0.80); }
                    .vt-ico { display:flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:7px; }
                    .vt-dot { width:6px; height:6px; border-radius:50%; background:#050D1A; opacity:0.7; animation:vdot 2s ease-in-out infinite; display:none; }
                    .vt-btn.active .vt-dot { display:block; }
                    @keyframes vdot { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.6)} }
                  `}</style>
                  <div className={`vt-track mode-${viewMode}`}>
                    <button onClick={() => setViewMode('list')} className={`vt-btn${viewMode==='list'?' active':''}`}>
                      <span className="vt-ico"><LayoutGrid size={15} strokeWidth={2.2} /></span>
                      <span>List View</span>
                      <span className="vt-dot" />
                    </button>
                    <button onClick={() => setViewMode('map')} className={`vt-btn${viewMode==='map'?' active':''}`}>
                      <span className="vt-ico"><Map size={15} strokeWidth={2.2} /></span>
                      <span>Map Mode</span>
                      <span className="vt-dot" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                {loading ? (
                  <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'24px' }}>
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} style={{ width:'100%', maxWidth:'380px', flexBasis:'calc(33.333% - 18px)', minWidth:'280px', borderRadius:'20px', overflow:'hidden', border:'1px solid rgba(240,244,255,0.05)', background:'var(--color-card)' }}>
                        <div className="shimmer" style={{ height:'220px', borderRadius:0 }} />
                        <div style={{ padding:'20px' }}>
                          <div className="shimmer" style={{ height:'18px', width:'75%', marginBottom:'12px' }} />
                          <div className="shimmer" style={{ height:'14px', width:'55%', marginBottom:'20px' }} />
                          <div style={{ borderTop:'1px solid rgba(240,244,255,0.07)', paddingTop:'14px', display:'flex', justifyContent:'space-between' }}>
                            <div className="shimmer" style={{ height:'14px', width:'35%' }} />
                            <div className="shimmer" style={{ height:'32px', width:'70px', borderRadius:'10px' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : viewMode === 'map' ? (
                  <MapMode
                    boardings={filteredBoardings}
                    onViewDetails={setSelectedBoarding}
                    onDirection={(b) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`, '_blank')}
                    onWhatsApp={(b) => {
                      const numericContact = b.contact.replace(/\D/g, '');
                      window.open(`https://wa.me/${numericContact}`, '_blank');
                    }}
                  />
                ) : filteredBoardings.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'80px 24px', background:'rgba(240,244,255,0.03)', borderRadius:'24px', border:'1px solid rgba(240,244,255,0.07)' }}>
                    <div style={{ fontSize:'48px', marginBottom:'12px' }}>🔍</div>
                    <p style={{ fontSize:'1.2rem', fontWeight:700, color:'var(--color-foreground)' }}>No listings found</p>
                    <p style={{ fontSize:'0.9rem', color:'var(--color-muted-foreground)', marginTop:'8px' }}>Try adjusting your search or enabling more categories above.</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'24px' }}>
                    {filteredBoardings.map(item => {
                      const catColor = item.category === 'vehicle' ? '#f59e0b' : item.category === 'land' ? '#10b981' : '#6366f1';
                      const catLabel = item.category === 'vehicle' ? '🚗 Vehicle' : item.category === 'land' ? '🌿 Land' : '🏠 Boarding';
                      return (
                        <div
                          key={item.category + '-' + item.id}
                          onClick={() => setSelectedBoarding(item)}
                          className="listing-card"
                          style={{
                            width:'100%', maxWidth:'380px', flexShrink:0,
                            flexBasis:'calc(33.333% - 18px)',
                            minWidth:'280px',
                          }}
                        >
                          {/* Image */}
                          <div className="listing-card__img">
                            {item.images && item.images.length > 0 ? (
                              <img src={item.images[0]} alt={item.title} />
                            ) : (
                              <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-muted-foreground)', fontSize:'13px' }}>No Image</div>
                            )}
                            {/* Category badge */}
                            <span style={{ position:'absolute', top:'12px', left:'12px', background:`${catColor}22`, border:`1px solid ${catColor}55`, color:catColor, padding:'5px 14px', borderRadius:'999px', fontSize:'11px', fontWeight:700, backdropFilter:'blur(12px)', zIndex:2, letterSpacing:'0.02em' }}>
                              {catLabel}
                            </span>
                            {/* Price badge */}
                            <span style={{ position:'absolute', bottom:'12px', right:'12px', background:'linear-gradient(135deg,#D4A832,#A07820)', color:'#050D1A', padding:'7px 16px', borderRadius:'12px', fontSize:'13px', fontWeight:800, boxShadow:'0 4px 20px rgba(212,168,50,0.40)', zIndex:2, letterSpacing:'-0.01em' }}>
                              LKR {Number(item.price).toLocaleString()}
                            </span>
                            {/* City */}
                            <span style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(5,13,26,0.80)', color:'rgba(240,244,255,0.90)', padding:'5px 12px', borderRadius:'10px', fontSize:'11px', fontWeight:600, backdropFilter:'blur(12px)', zIndex:2 }}>
                              {item.city}
                            </span>
                            {/* Image count badge */}
                            {item.images && item.images.length > 1 && (
                              <span style={{ position:'absolute', bottom:'12px', left:'12px', background:'rgba(5,13,26,0.80)', color:'rgba(240,244,255,0.85)', padding:'4px 10px', borderRadius:'8px', fontSize:'10px', fontWeight:700, backdropFilter:'blur(8px)', zIndex:2, display:'flex', alignItems:'center', gap:'4px' }}>
                                📷 {item.images.length}
                              </span>
                            )}
                          </div>

                          {/* Body */}
                          <div style={{ padding:'20px' }}>
                            <h4 style={{ fontSize:'1.02rem', fontWeight:700, color:'var(--color-foreground)', marginBottom:'8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                              {item.title}
                            </h4>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--color-muted-foreground)', fontSize:'13px', marginBottom:'16px' }}>
                              <MapPin size={13} style={{ color:'#D4A832', flexShrink:0 }} />
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.address}</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'14px', borderTop:'1px solid rgba(240,244,255,0.07)' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--color-muted-foreground)', fontSize:'13px', fontWeight:600 }}>
                                <Phone size={14} style={{ color:'#D4A832' }} />
                                <span>{item.contact}</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedBoarding(item); }}
                                className="listing-card__view-btn"
                                style={{ background:'rgba(212,168,50,0.10)', border:'1px solid rgba(212,168,50,0.20)', color:'#D4A832', padding:'7px 16px', borderRadius:'10px', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.25s' }}
                              >
                                <Eye size={13} /> View
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
              </div>
            </Home>
          </>
        )}

        {currentPage === 'my-listings' && (
          <div className="page-enter">
            <MyListings user={user} />
          </div>
        )}

        {currentPage === 'auth' && (
          <div className="page-enter">
            <Auth onLogin={(u) => { setUser(u); setCurrentPage('home'); }} />
          </div>
        )}

        {currentPage === 'reset-password' && (
          <div className="page-enter">
            <ResetPassword />
          </div>
        )}

        {currentPage === 'upload' && user && (
          <div className="page-enter">
            <Upload onUpload={handleUpload} />
          </div>
        )}

        {currentPage === 'admin' && (
          <div className="page-enter">
            <AdminDashboard user={user} />
          </div>
        )}
      </main>

      {/* Detailed View Modal */}
      {selectedBoarding && (
        <BoardingDetailModal 
          boarding={selectedBoarding} 
          onClose={() => setSelectedBoarding(null)} 
          user={user}
        />
      )}
    </div>
    </NotificationProvider>
  );
}
