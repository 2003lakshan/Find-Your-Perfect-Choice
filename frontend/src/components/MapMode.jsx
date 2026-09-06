import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Navigation2, Phone, MapPin, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamic SVG icon based on gender
const getMarkerIcon = (item) => {
  let color = '#8b5cf6'; // Default (Any Boarding) - Purple
  if (item.category === 'boarding') {
    if (item.gender === 'girls') color = '#ec4899'; // Pink
    else if (item.gender === 'boys') color = '#3b82f6'; // Blue
  } else if (item.category === 'vehicle') {
    color = '#f59e0b'; // Orange
  } else if (item.category === 'land') {
    color = '#10b981'; // Green
  }

  let svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>`;

  if (item.category === 'land') {
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  } else if (item.category === 'vehicle') {
    const type = item.vehicle_type?.toLowerCase() || '';
    if (type.includes('bike') || type.includes('motorcycle') || type.includes('scooter') || type.includes('bicycle')) {
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>`;
    } else if (type.includes('lorry') || type.includes('truck')) {
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><rect x="16" y="8" width="7" height="8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
    } else if (type.includes('bus') || type.includes('van')) {
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M6 17v4"/><path d="M18 17v4"/><path d="M8 7h8"/><circle cx="6" cy="13" r="1"/><circle cx="18" cy="13" r="1"/></svg>`;
    } else {
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
    }
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: ${color}; color: white; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        ${svgIcon}
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
        <h4 className="font-bold text-base leading-tight mb-1 truncate text-foreground" style={{ margin: '0 0 4px 0' }}>
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
          background: var(--color-card, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          color: var(--color-foreground, #0f172a) !important;
        }
        .leaflet-popup-content {
          margin: 0;
          width: 240px !important;
          color: var(--color-foreground, #0f172a) !important;
        }
        .leaflet-popup-tip-container {
          overflow: visible;
        }
        .leaflet-popup-tip {
          background: var(--color-card, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
        }
        .dark .leaflet-popup-content-wrapper,
        .dark .leaflet-popup-tip {
          background: var(--color-card, #0f172a);
          border-color: var(--color-border, #1e293b);
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
            key={boarding.category + '-' + boarding.id}
            position={[boarding.latitude, boarding.longitude]}
            icon={getMarkerIcon(boarding)}
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
