import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Upload from './pages/Upload';
import AdminDashboard from './pages/AdminDashboard';
import MyListings from './pages/MyListings';
import MapMode from './components/MapMode';
import { MapPin, Phone, Eye, LayoutGrid, Map, ChevronLeft, ChevronRight, X, Navigation2 } from 'lucide-react';
import { api } from './api';

function BoardingDetailModal({ boarding, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = boarding.images || [];

  const handleWhatsApp = () => {
    const numericContact = boarding.contact.replace(/\D/g, '');
    window.open(`https://wa.me/${numericContact}`, '_blank');
  };

  const handleDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${boarding.latitude},${boarding.longitude}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-none overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh] md:h-[500px]">
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
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                  {boarding.gender === 'girls' ? 'Girls Only' : boarding.gender === 'boys' ? 'Boys Only' : 'Any Gender'}
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
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [boardings, setBoardings] = useState([]);
  const [filters, setFilters] = useState({ searchTerm: '', city: '' });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedBoarding, setSelectedBoarding] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    api.getMe().then(u => { if (u) setUser(u); });
  }, []);

  // Fetch boardings from backend
  useEffect(() => {
    setLoading(true);
    api.getBoardings(filters.city, filters.searchTerm)
      .then(data => setBoardings(data))
      .catch(() => setBoardings([]))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }, []);

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
    <div className="min-h-screen">
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        setUser={(u) => { if (!u) handleLogout(); else setUser(u); }}
      />

      <main className="w-full">
        {currentPage === 'home' && (
          <>
            <Home setFilters={setFilters} boardings={boardings} />
            <section className="max-w-[1400px] mx-auto w-full px-6 pb-20 mt-12">
              <div className="flex flex-col items-center justify-center mb-12">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold">Featured Boardings</h3>
                  <div className="text-sm font-semibold text-primary mt-2">{boardings.length} results found</div>
                </div>
                
                {/* Side-by-side Buttons */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-bold shadow-md cursor-pointer border-none transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-[#007bff] text-white hover:bg-[#0069d9]' 
                        : 'bg-[#6c757d] text-white hover:bg-[#5a6268]'
                    }`}
                  >
                    <LayoutGrid size={18} strokeWidth={2.5} />
                    <span>List View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-bold shadow-md cursor-pointer border-none transition-colors ${
                      viewMode === 'map' 
                        ? 'bg-[#007bff] text-white hover:bg-[#0069d9]' 
                        : 'bg-[#6c757d] text-white hover:bg-[#5a6268]'
                    }`}
                  >
                    <Map size={18} strokeWidth={2.5} />
                    <span>Map Mode</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-foreground/40 font-semibold">Loading boardings...</p>
                </div>
              ) : viewMode === 'map' ? (
                <MapMode boardings={boardings} onViewDetails={setSelectedBoarding} />
              ) : (
                <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-10">
                  {boardings.map(boarding => (
                    <div key={boarding.id} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-22px)] max-w-[420px] bg-card rounded-2xl overflow-hidden border border-border shadow-lg hover:shadow-2xl transition-all group animate-fade-in flex-grow-0">
                      <div className="relative h-64 overflow-hidden bg-input">
                        {boarding.images && boarding.images.length > 0 ? (
                          <img
                            src={boarding.images[0]}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            alt={boarding.title}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/20">
                            <span className="text-lg font-semibold">No Image</span>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm text-black">
                          {boarding.city}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-2xl font-bold shadow-lg">
                          LKR {Number(boarding.price).toLocaleString()}
                        </div>
                      </div>

                      <div className="p-6">
                        <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{boarding.title}</h4>
                        <div className="flex items-center gap-2 text-foreground/60 text-sm mb-4">
                          <MapPin size={16} />
                          <span className="truncate">{boarding.address}</span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-foreground/80 font-semibold">
                            <Phone size={16} className="text-primary" />
                            <span>{boarding.contact}</span>
                          </div>
                          <button 
                            onClick={() => setSelectedBoarding(boarding)}
                            className="bg-input p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                          >
                            <Eye size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && boardings.length === 0 && (
                <div className="text-center py-20 bg-input rounded-[3rem] border-2 border-dashed border-border">
                  <p className="text-foreground/40 font-semibold">No boardings found. Be the first to upload one!</p>
                </div>
              )}
            </section>
          </>
        )}

        {currentPage === 'my-listings' && (
          <MyListings user={user} />
        )}

        {currentPage === 'auth' && (
          <Auth onLogin={(u) => { setUser(u); setCurrentPage('home'); }} />
        )}

        {currentPage === 'upload' && user && (
          <Upload onUpload={handleUpload} />
        )}

        {currentPage === 'admin' && (
          <AdminDashboard user={user} />
        )}
      </main>

      {/* Detailed View Modal */}
      {selectedBoarding && (
        <BoardingDetailModal 
          boarding={selectedBoarding} 
          onClose={() => setSelectedBoarding(null)} 
        />
      )}
    </div>
  );
}
