import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, AlertCircle } from 'lucide-react';

// Custom Map Component to handle focusing
function MapController({ focusedLocation, reports }) {
  const map = useMap();
  
  // Track if we've done the initial bounds fit
  const [initialFitComplete, setInitialFitComplete] = useState(false);

  // Initial bounds fit
  useEffect(() => {
    if (!initialFitComplete && reports?.length > 0) {
      const markers = reports.filter(r => r.latitude && r.longitude).map(r => L.latLng(r.latitude, r.longitude));
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        setInitialFitComplete(true);
      }
    }
  }, [reports, map, initialFitComplete]);

  // Smooth fly to focused location
  useEffect(() => {
    if (focusedLocation) {
      map.flyTo([focusedLocation.latitude, focusedLocation.longitude], map.getZoom(), {
        animate: true,
        duration: 1.2
      });
    }
  }, [focusedLocation, map]);
  
  return null;
}

const getMarkerColor = (severity) => {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return '#ef4444'; // red-500
    case 'MEDIUM':
      return '#f97316'; // orange-500
    case 'LOW':
      return '#10b981'; // emerald-500
    default:
      return '#6b7280'; // gray-500
  }
};

const createCustomIcon = (severity, isFocused = false) => {
  const color = getMarkerColor(severity);
  const boxShadow = isFocused 
    ? `0 0 0 6px ${color}40, 0 0 10px rgba(0,0,0,0.8)`
    : '0 0 4px rgba(0,0,0,0.5)';
  const border = isFocused ? '3px solid white' : '2px solid white';
  const size = isFocused ? 20 : 14;
  const wrapperSize = isFocused ? 24 : 18;
  const anchor = isFocused ? 12 : 9;

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${border}; box-shadow: ${boxShadow}; transition: all 0.3s ease;"></div>
    `,
    iconSize: [wrapperSize, wrapperSize],
    iconAnchor: [anchor, anchor]
  });
};

const CurrentLocationIcon = L.divIcon({
  className: 'current-location-icon',
  html: `
    <div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);"></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export default function CommunityMap({ reports, focusedLocation }) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        }
      );
    }
  }, []);

  // Default center: City center, or some default location.
  // We'll use the user location if available, otherwise fallback.
  // Actually, we can compute the center of all reports if we have them.
  const center = useMemo(() => {
    if (focusedLocation) return [focusedLocation.latitude, focusedLocation.longitude];
    if (userLocation) return [userLocation.latitude, userLocation.longitude];
    if (reports.length > 0) {
      const withCoords = reports.filter(r => r.latitude && r.longitude);
      if (withCoords.length > 0) {
        return [withCoords[0].latitude, withCoords[0].longitude];
      }
    }
    return [40.7128, -74.0060]; // NYC as default
  }, [userLocation, reports, focusedLocation]);

  return (
    <div className="w-full h-full bg-neutral-900 rounded-2xl overflow-hidden z-0 relative">
      <MapContainer 
        center={center} 
        zoom={13} 
        className="w-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px]"
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        <MapController focusedLocation={focusedLocation} reports={reports} />

        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]}
            icon={CurrentLocationIcon}
          >
            <Popup className="custom-popup">
              <div className="text-sm font-medium">Your Location</div>
            </Popup>
          </Marker>
        )}

        {reports.map((report) => {
          if (!report.latitude || !report.longitude) return null;
          
          const isFocused = focusedLocation && 
                            focusedLocation.latitude === report.latitude && 
                            focusedLocation.longitude === report.longitude;
          
          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createCustomIcon(report.severity, isFocused)}
              zIndexOffset={isFocused ? 1000 : 0}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <h3 className="font-bold text-gray-900 text-base mb-1">{report.title?.replace(/^Demo:\s*/, '')}</h3>
                  <p className="text-xs text-neutral-600 mb-2 line-clamp-2">{report.description || 'No description provided.'}</p>
                  <div className="flex gap-2 text-xs mb-2">
                    <span className="px-1.5 py-0.5 bg-neutral-100 rounded border font-medium text-neutral-600">
                      {report.category}
                    </span>
                    <span className="px-1.5 py-0.5 bg-neutral-100 rounded border font-medium text-neutral-600">
                      {report.status || "PENDING"}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mb-2">
                    Severity: <strong>{report.severity}</strong>
                  </div>
                  <div className="text-xs text-neutral-500 flex justify-between items-center border-t pt-2">
                    <span>Verified: {report.verificationCount || 0}</span>
                    <span>
                      {report.createdAt?.toDate() 
                        ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(report.createdAt.toDate())
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
