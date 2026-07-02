import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Navigation2, Phone, MapPin, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamic SVG icon based on gender
const getMarkerIcon = (gender) => {
  let color = '#8b5cf6'; // Default (Any) - Purple
  if (gender === 'girls') color = '#ec4899'; // Pink
  else if (gender === 'boys') color = '#3b82f6'; // Blue

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: ${color}; color: white; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
};

function MapPopupCard({ boarding, onViewDetails, handleDirections, handleWhatsApp }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = boarding.images || [];

  const nextImg = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (images.length > 0) {
      setImgIdx((prev) => (prev + 1) % images.length);
    }
  };

  const prevImg = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (images.length > 0) {
      setImgIdx((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="flex flex-col font-sans">
      {/* Image Gallery */}
      <div className="relative h-36 bg-input overflow-hidden rounded-t-xl">
        {images.length > 0 ? (
          <>
            <img
              src={images[imgIdx]}
              alt={boarding.title}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border-none cursor-pointer flex items-center justify-center z-[1000] transition-opacity"
                  style={{ width: 22, height: 22 }}
                >
                  <ChevronLeft size={14} strokeWidth={3} />
                </button>
                <button 
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border-none cursor-pointer flex items-center justify-center z-[1000] transition-opacity"
                  style={{ width: 22, height: 22 }}
                >
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
                <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm z-[1000]">
                  {imgIdx + 1}/{images.length}
                </span>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/5">
            No Image
          </div>
        )}
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-bold text-black shadow-sm z-[1000]">
          {boarding.city}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 text-foreground">
        <h4 className="font-bold text-base leading-tight mb-1 truncate text-[color:var(--foreground)]" style={{ margin: '0 0 4px 0' }}>
          {boarding.title}
        </h4>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3 truncate">
          <MapPin size={12} />
          <span className="truncate">{boarding.address}</span>
        </div>
        
        <div className="font-bold text-primary text-sm mb-4">
          LKR {Number(boarding.price).toLocaleString()} <span className="text-muted-foreground text-xs font-normal">/mo</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleDirections(boarding.latitude, boarding.longitude)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors py-2 rounded-xl text-xs font-bold border-none cursor-pointer"
            >
              <Navigation2 size={14} />
              Directions
            </button>
            <button
              onClick={() => handleWhatsApp(boarding.contact)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-colors py-2 rounded-xl text-xs font-bold border-none cursor-pointer"
            >
              <Phone size={14} />
              WhatsApp
            </button>
          </div>
          <button
            onClick={() => onViewDetails(boarding)}
            className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white transition-colors py-2.5 rounded-xl text-xs font-extrabold border-none cursor-pointer shadow-md shadow-primary/15"
          >
            <Eye size={14} />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MapMode({ boardings, onViewDetails }) {
  // Filter boardings that have valid coordinates
  const validBoardings = boardings.filter(b => b.latitude && b.longitude);

  // Default center (Sri Lanka center roughly)
  const defaultCenter = [7.8731, 80.7718];
  const center = defaultCenter;

  const handleWhatsApp = (contact) => {
    // Format contact to remove non-numeric chars
    const numericContact = contact.replace(/\D/g, '');
    window.open(`https://wa.me/${numericContact}`, '_blank');
  };

  const handleDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const SRI_LANKA_BOUNDS = [
    [5.8, 79.5], // South-West
    [9.9, 82.0]  // North-East
  ];

  return (
    <div className="w-full max-w-4xl h-[600px] rounded-[2rem] overflow-hidden border-2 border-border shadow-2xl relative z-0" style={{ margin: '2rem auto 0', display: 'block' }}>
      <style>{`
        /* Custom Popup Styling */
        .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 16px;
          background: var(--card);
          border: 1px solid var(--border);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .leaflet-popup-content {
          margin: 0;
          width: 240px !important;
        }
        .leaflet-popup-tip-container {
          overflow: visible;
        }
        .leaflet-popup-tip {
          background: var(--card);
          border: 1px solid var(--border);
        }
        .dark .leaflet-popup-content-wrapper,
        .dark .leaflet-popup-tip {
          background: #1e2128;
          border-color: rgba(255,255,255,0.1);
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={8}
        minZoom={7}
        maxBounds={SRI_LANKA_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validBoardings.map(boarding => (
          <Marker
            key={boarding.id}
            position={[boarding.latitude, boarding.longitude]}
            icon={getMarkerIcon(boarding.gender)}
          >
            <Popup>
              <MapPopupCard 
                boarding={boarding}
                onViewDetails={onViewDetails}
                handleDirections={handleDirections}
                handleWhatsApp={handleWhatsApp}
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
