import React, { useState } from 'react';
import { Home, PlusCircle, User, LogIn, Compass, Shield, LogOut, List, Menu, X } from 'lucide-react';

export default function Header({ currentPage, setCurrentPage, user, setUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between shadow-sm border-b border-border/50 relative">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setCurrentPage('home')}
      >
        <img 
          src="/logo.png" 
          alt="Bodim Logo" 
          className="h-11 w-11 rounded-lg object-cover group-hover:scale-105 transition-transform shadow-md border border-white/10" 
        />
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          Bodim
        </h1>
      </div>

      <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
        <button 
          onClick={() => setCurrentPage('home')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 transform active:scale-95 ${
            currentPage === 'home' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass size={16} strokeWidth={2.5} />
          <span>Discover</span>
        </button>
        {user && (
          <>
            <button 
              onClick={() => setCurrentPage('upload')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 transform active:scale-95 ${
                currentPage === 'upload' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlusCircle size={16} strokeWidth={2.5} />
              <span>Upload Boarding</span>
            </button>
            <button 
              onClick={() => setCurrentPage('my-listings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 transform active:scale-95 ${
                currentPage === 'my-listings' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <List size={16} strokeWidth={2.5} />
              <span>My Listings</span>
            </button>
          </>
        )}
        {user?.role === 'admin' && (
          <button 
            onClick={() => setCurrentPage('admin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 transform active:scale-95 ${
              currentPage === 'admin' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield size={16} strokeWidth={2.5} />
            <span>Admin</span>
          </button>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-2 bg-input/80 pl-4 pr-2 py-1.5 rounded-full border border-border backdrop-blur-md shadow-sm">
            <span className="text-sm font-bold text-foreground/90 mr-1">{user.name}</span>
            <div className="bg-primary/20 p-1.5 rounded-full text-primary">
              <User size={16} />
            </div>
            <div className="w-px h-5 bg-border mx-1"></div>
            <button 
              onClick={() => setUser(null)}
              className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setCurrentPage('auth')}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            <LogIn size={18} />
            Sign In
          </button>
        )}

        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground bg-input/50 rounded-xl border border-border/50"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-950/95 border-b border-border/80 p-4 lg:hidden flex flex-col gap-2.5 z-[100] shadow-xl backdrop-blur-xl animate-fade-in">
          <button 
            onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 p-3 rounded-xl font-semibold transition-all ${currentPage === 'home' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Compass size={18} /> Discover
          </button>
          {user && (
            <>
              <button 
                onClick={() => { setCurrentPage('upload'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 p-3 rounded-xl font-semibold transition-all ${currentPage === 'upload' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
              >
                <PlusCircle size={18} /> Upload Boarding
              </button>
              <button 
                onClick={() => { setCurrentPage('my-listings'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 p-3 rounded-xl font-semibold transition-all ${currentPage === 'my-listings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
              >
                <List size={18} /> My Listings
              </button>
            </>
          )}
          {user?.role === 'admin' && (
            <button 
              onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-xl font-semibold transition-all ${currentPage === 'admin' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <Shield size={18} /> Admin
            </button>
          )}
        </div>
      )}
    </header>
  );
}
