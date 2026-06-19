'use client';

import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface GeoCoords {
  latitude: number;
  longitude: number;
}

interface Responder {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string; // volunteer, hospital, police, fire_station
  skills?: string[];
  phone?: string;
  has_vehicle?: boolean;
}

interface RouteMapProps {
  disasterCoords: GeoCoords;
  volunteers: Responder[];
  facilities: Responder[];
  onSelectResponder: (
    responder: Responder | null,
    distanceKm: number | null,
    durationMins: number | null
  ) => void;
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

// Type mapping for icons
const TYPE_ICONS: Record<string, string> = {
  volunteer: '🙋‍♂️',
  hospital: '🏥',
  police: '🚔',
  fire_station: '🧯',
};

const TYPE_COLORS: Record<string, string> = {
  volunteer: '#EA580C', // Orange
  hospital: '#2563EB', // Blue
  police: '#1E3A8A', // Dark Blue
  fire_station: '#DC2626', // Red
};

export default function RouteMap({
  disasterCoords,
  volunteers = [],
  facilities = [],
  onSelectResponder,
}: RouteMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<Responder | null>(null);
  const [routeGeojson, setRouteGeojson] = useState<any>(null);
  
  const [viewState, setViewState] = useState({
    latitude: disasterCoords.latitude,
    longitude: disasterCoords.longitude,
    zoom: 12.5,
    pitch: 20,
    bearing: 0,
  });

  // Fit bounds to cover all markers initially
  useEffect(() => {
    if (mapRef.current) {
      const coords = [
        [disasterCoords.longitude, disasterCoords.latitude],
        ...volunteers.map(v => [v.longitude, v.latitude]),
        ...facilities.map(f => [f.longitude, f.latitude]),
      ];
      
      if (coords.length > 1) {
        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        mapRef.current.fitBounds(
          [
            [minLng - 0.005, minLat - 0.005], // Southwest
            [maxLng + 0.005, maxLat + 0.005], // Northeast
          ],
          { padding: 50, duration: 1000 }
        );
      }
    }
  }, [disasterCoords, volunteers, facilities]);

  // Handle responder selection and fetch OSRM shortest driving route
  const handleMarkerClick = async (responder: Responder) => {
    setSelected(responder);
    onSelectResponder(null, null, null); // Loading state in parent
    setRouteGeojson(null);

    // Zoom and pan to center between disaster and selected responder
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [
          (disasterCoords.longitude + responder.longitude) / 2,
          (disasterCoords.latitude + responder.latitude) / 2,
        ],
        zoom: Math.max(10, 13.5 - Math.hypot(disasterCoords.latitude - responder.latitude, disasterCoords.longitude - responder.longitude) * 15),
        duration: 800,
      });
    }

    // Call OSRM public route api
    const url = `https://router.project-osrm.org/route/v1/driving/${responder.longitude},${responder.latitude};${disasterCoords.longitude},${disasterCoords.latitude}?overview=full&geometries=geojson`;
    
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const route = data.routes?.[0];
        if (route) {
          const geojson = {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          };
          setRouteGeojson(geojson);

          // Calculate travel distance and duration
          const distanceKm = route.distance / 1000.0;
          const durationMins = route.duration / 60.0;
          
          onSelectResponder(responder, distanceKm, durationMins);
        }
      }
    } catch (e) {
      console.error('OSRM routing query failed:', e);
      // Fallback: Haversine straight line calculation if OSRM is unreachable
      const R = 6371; // Earth radius in km
      const dLat = ((disasterCoords.latitude - responder.latitude) * Math.PI) / 180;
      const dLon = ((disasterCoords.longitude - responder.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((responder.latitude * Math.PI) / 180) *
          Math.cos((disasterCoords.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;
      const durationMins = (distanceKm / 30) * 60; // Assuming 30 km/h avg speed in crisis zone
      
      const lineGeojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [responder.longitude, responder.latitude],
            [disasterCoords.longitude, disasterCoords.latitude],
          ],
        },
      };
      setRouteGeojson(lineGeojson);
      onSelectResponder(responder, distanceKm, durationMins);
    }
  };

  const allResponders = [...volunteers, ...facilities];

  return (
    <div style={{ width: '100%', height: '420px', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-left" />

        {/* Disaster Hotspot Marker (pulsing red beacon) */}
        <Marker longitude={disasterCoords.longitude} latitude={disasterCoords.latitude}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{
              position: 'absolute',
              width: '36px', height: '36px',
              background: 'rgba(239, 68, 68, 0.4)',
              borderRadius: '50%',
              animation: 'pulse 1.8s infinite ease-in-out'
            }} />
            <div style={{
              width: '20px', height: '20px',
              background: '#EF4444',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 4px 12px rgba(239,68,68,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'white', fontWeight: 'bold', zIndex: 1
            }}>
              🚨
            </div>
            <style>{`
              @keyframes pulse {
                0% { transform: scale(0.6); opacity: 1; }
                100% { transform: scale(1.8); opacity: 0; }
              }
            `}</style>
          </div>
        </Marker>

        {/* Responder Markers */}
        {allResponders.map(resp => {
          const isSelected = selected?.id === resp.id;
          const color = TYPE_COLORS[resp.type] || '#475569';
          return (
            <Marker
              key={resp.id}
              longitude={resp.longitude}
              latitude={resp.latitude}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(resp);
              }}
            >
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', transform: isSelected ? 'scale(1.2)' : 'scale(1.0)',
                transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{
                  background: isSelected ? color : 'white',
                  padding: '5px 7px',
                  borderRadius: '10px',
                  border: `1.5px solid ${color}`,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', gap: '3px',
                  fontSize: '13px'
                }}>
                  <span>{TYPE_ICONS[resp.type] || '📌'}</span>
                  {isSelected && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Active
                    </span>
                  )}
                </div>
                {/* Pointer tip */}
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `5px solid ${isSelected ? color : 'white'}`,
                  marginTop: '-1px'
                }} />
              </div>
            </Marker>
          );
        })}

        {/* Dynamic Route Polyline Layer */}
        {routeGeojson && (
          <Source id="route" type="geojson" data={routeGeojson}>
            <Layer
              id="route-line"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': selected ? TYPE_COLORS[selected.type] || '#3B82F6' : '#3B82F6',
                'line-width': 5.5,
                'line-opacity': 0.85,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
