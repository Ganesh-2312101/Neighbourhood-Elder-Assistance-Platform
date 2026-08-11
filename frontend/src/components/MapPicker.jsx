import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass } from 'lucide-react';

const seniorPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="background:#1d4ed8;width:42px;height:42px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 6px 16px rgba(29,78,216,0.4);display:flex;align-items:center;justify-content:center;font-size:22px;">📍</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

export default function MapPicker({ initialLat = 40.7128, initialLng = -74.0060, onLocationSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [addressText, setAddressText] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Reverse Geocoding with OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lng) => {
    setGeocodingLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        const fullAddr = data.display_name;
        const approxArea = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || 'Neighborhood Area';
        setAddressText(fullAddr);
        if (onLocationSelect) {
          onLocationSelect({
            lat,
            lng,
            full_address: fullAddr,
            approximate_area_text: approxArea
          });
        }
      }
    } catch (err) {
      console.warn('Geocoding fallback:', err);
      setAddressText('Unknown location (network issue)');
      if (onLocationSelect) {
        onLocationSelect({
          lat,
          lng,
          full_address: 'Unknown location (network issue)',
          approximate_area_text: 'Unknown Area'
        });
      }
    } finally {
      setGeocodingLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map centered on initial coordinates
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: true
      });

      // OpenStreetMap Free Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Draggable Marker
      const marker = L.marker([coords.lat, coords.lng], {
        icon: seniorPinIcon,
        draggable: true
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
      }, (err) => {
        alert('Could not detect GPS location: ' + err.message);
      });
    }
  };

  return (
    <div className="map-picker">
      <div className="map-picker-toolbar">
        <span className="map-picker-instruction">
          <MapPin />
          Move the pin to your exact address
        </span>

        <button 
          type="button" 
          onClick={handleUseCurrentLocation} 
          className="btn btn-secondary map-picker-location"
        >
          <Compass /> Detect my location
        </button>
      </div>

      {/* Leaflet Map Box Container */}
      <div 
        ref={mapContainerRef} 
        className="map-picker-canvas"
      />

      {/* Selected Address Display Card */}
      <div className="map-picker-address">
        <span>
          {geocodingLoading ? 'Finding your address...' : 'Selected location'}
        </span>
        <p>
          {addressText || 'Choose a point on the map to confirm your address.'}
        </p>
      </div>
    </div>
  );
}
