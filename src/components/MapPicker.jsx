import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

function LocationMarker({ setPosition }) {
  const [markerPos, setMarkerPos] = useState(null);

  useMapEvents({
    click(e) {
      setMarkerPos(e.latlng);
      setPosition(e.latlng);
    },
  });

  return markerPos === null ? null : (
    <Marker position={markerPos} />
  );
}

export default function MapPicker({ onPositionSelect }) {
  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border shadow-inner relative z-0">
      <MapContainer 
        center={[6.9271, 79.8612]} 
        zoom={13} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker setPosition={onPositionSelect} />
      </MapContainer>
      <div className="absolute top-2 right-2 z-[1000] bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm pointer-events-none text-black">
        Click to set location
      </div>
    </div>
  );
}
