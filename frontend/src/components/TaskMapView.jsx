import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, ExternalLink, Lock } from 'lucide-react';

const housePinIcon = L.divIcon({
  className: 'custom-map-pin-house',
  html: `<div style="background:#dc2626;width:44px;height:44px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 6px 18px rgba(220,38,38,0.45);display:flex;align-items:center;justify-content:center;font-size:22px;">🏡</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

export default function TaskMapView({ 
  mode = 'masked', // 'masked' (pre-claim) or 'unlocked' (post-claim)
  lat = 40.7128, 
  lng = -74.0060, 
  fullAddress = '', 
  approxArea = 'Neighborhood Area',
  radiusMiles = 0.5
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: mode === 'masked' ? 14 : 16,
        zoomControl: true,
        scrollWheelZoom: false
      });

      // Free OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      if (mode === 'masked') {
        // Privacy Masked Mode: Shaded Proximity Circle
        const radiusMeters = radiusMiles * 1609.34;
        L.circle([lat, lng], {
          color: '#1d4ed8',
          fillColor: '#3b82f6',
          fillOpacity: 0.25,
          radius: radiusMeters
        }).addTo(map);

        L.popup()
          .setLatLng([lat, lng])
          .setContent(`<div style="font-weight:bold;font-size:13px;text-align:center;">🔒 Privacy Masked Area<br/><span style="font-weight:normal;color:#475569;">${approxArea}</span></div>`)
          .openOn(map);

      } else {
        // Unlocked Mode: Precise Senior House Pin Marker
        const marker = L.marker([lat, lng], { icon: housePinIcon }).addTo(map);
        marker.bindPopup(`<div style="font-weight:bold;font-size:14px;color:#0f172a;">Senior Residence<br/><span style="font-weight:600;color:#1e40af;">${fullAddress || 'Exact Address'}</span></div>`).openPopup();
      }

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, mode]);

  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
      
      {/* Map Box */}
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: mode === 'masked' ? '220px' : '260px', 
          borderRadius: '16px', 
          border: mode === 'masked' ? '2px dashed var(--accent-primary)' : '3px solid #16a34a',
          zIndex: 1,
          boxShadow: 'var(--shadow-sm)'
        }} 
      />

      {/* Mode Specific Info Card */}
      {mode === 'masked' ? (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1e40af' }}>
          <Lock style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            Approximate Area: <strong>{approxArea}</strong> (Exact street address & house pin unlocked upon claim)
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', background: '#f0fdf4', border: '2px solid #16a34a', padding: '0.85rem 1.1rem', borderRadius: '14px', color: '#166534' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#15803d' }}>
              Unlocked Precise Residence:
            </span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.15rem 0 0', color: '#0f172a' }}>
              {fullAddress}
            </p>
          </div>

          <a 
            href={mapsDirectionsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-success"
            style={{ padding: '0.45rem 1.1rem', fontSize: '0.95rem', minHeight: '42px', textDecoration: 'none' }}
          >
            <Navigation style={{ width: 18, height: 18 }} /> Get GPS Directions <ExternalLink style={{ width: 14, height: 14 }} />
          </a>
        </div>
      )}

    </div>
  );
}
