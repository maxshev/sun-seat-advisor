import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapWithDraggableMarkers({ 
  center = [53.9, 27.5667], 
  markers = [], 
  route = [], 
  onMarkerDrag 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, 10);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
    }
  }, [center]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData, index) => {
      const marker = L.marker(markerData.position, { draggable: true })
        .addTo(mapInstanceRef.current)
        .bindPopup(markerData.label || `Point ${index + 1}`);

      // Handle drag event
      marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        if (onMarkerDrag) {
          onMarkerDrag(index, [newPos.lat, newPos.lng]);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (markers.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [markers, onMarkerDrag]);

  // Update route
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing route
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
    }

    // Add new route
    if (route.length > 0) {
      routeLayerRef.current = L.polyline(route, { 
        color: 'blue', 
        weight: 4,
        opacity: 0.7 
      }).addTo(mapInstanceRef.current);
    }
  }, [route]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#f0f0f0'
      }} 
    />
  );
} 