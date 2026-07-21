import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, onPositionSelect }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPositionSelect(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

function CurrentLocationControl({ setPosition, onPositionSelect }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleLocate = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(latlng);
        onPositionSelect(latlng);
        map.flyTo(latlng, 15);
        setLoading(false);
      },
      (err) => {
        alert("Could not get your location. Please ensure location access is enabled in your browser.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      className="absolute bottom-4 left-4 z-[1000] bg-white px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-[#8B643C] font-semibold text-sm border border-[#8B643C]/20 transition-all active:scale-95"
      title="Use Current Location"
      disabled={loading}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-[#8B643C] border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <circle cx="12" cy="12" r="7"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      )}
      <span>Use My Location</span>
    </button>
  );
}

export default function MapPicker({ onPositionSelect, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || null);

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border shadow-inner relative z-0">
      <MapContainer 
        center={initialPosition ? [initialPosition.lat, initialPosition.lng] : [6.9271, 79.8612]} 
        zoom={13} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onPositionSelect={onPositionSelect} />
        <CurrentLocationControl setPosition={setPosition} onPositionSelect={onPositionSelect} />
      </MapContainer>
      <div className="absolute top-2 right-2 z-[1000] bg-white/90 px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-sm pointer-events-none text-[#8B643C] border border-[#8B643C]/20">
        Click on map or use location button
      </div>
    </div>
  );
}
