import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WorkerUser, ServiceCategory } from '../types';
import { api } from '../services/api';
import { SERVICE_CATEGORIES } from '../data/categories';

interface NearbyMapViewProps {
  onBookWorker: (worker: WorkerUser) => void;
}

// Haversine formula to compute geodesic distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const CITY_PRESETS: { name: string; lat: number; lng: number }[] = [
  { name: 'Mumbai (Andheri/Bandra)', lat: 19.1197, lng: 72.8464 },
  { name: 'Delhi NCR (Connaught Pl)', lat: 28.6304, lng: 77.2177 },
  { name: 'Bengaluru (Koramangala)', lat: 12.9352, lng: 77.6245 },
  { name: 'Pune (Shivaji Nagar)', lat: 18.5314, lng: 73.8446 },
  { name: 'Hyderabad (Hitec City)', lat: 17.4435, lng: 78.3772 },
  { name: 'Chennai (T. Nagar)', lat: 13.0418, lng: 80.2341 },
];

export const NearbyMapView: React.FC<NearbyMapViewProps> = ({ onBookWorker }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeWorkerOnMap, setActiveWorkerOnMap] = useState<WorkerUser | null>(null);

  // GPS State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 19.1197,
    lng: 72.8464,
  });
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    'idle' | 'acquiring' | 'locked' | 'live_tracking' | 'denied' | 'unavailable'
  >('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  // Fetch workers from DB
  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkers({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      });
      setWorkers(res.workers);
    } catch (err) {
      console.error('Failed to load workers for map:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [selectedCategory]);

  // Update user position on the map
  const updateUserPositionOnMap = useCallback((lat: number, lng: number, acc?: number) => {
    if (!mapInstanceRef.current) return;

    setUserLocation({ lat, lng });
    if (acc) setAccuracy(Math.round(acc));
    setLastUpdatedTime(new Date().toLocaleTimeString());

    // Update or create user marker
    const userIcon = L.divIcon({
      className: 'custom-gps-user-marker',
      html: `
        <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:100%; height:100%; background-color:#3b82f6; opacity:0.4; border-radius:50%; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width:14px; height:14px; background-color:#2563eb; border:3px solid #ffffff; border-radius:50%; box-shadow:0 0 10px rgba(37,99,235,0.8); z-index:2;"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
        .bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;color:#0f172a;">
            <strong>Your GPS Location</strong><br/>
            <span>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</span>
          </div>`
        )
        .addTo(mapInstanceRef.current);
    }

    // Update accuracy circle
    if (acc && acc > 0) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([lat, lng]);
        accuracyCircleRef.current.setRadius(acc);
      } else {
        accuracyCircleRef.current = L.circle([lat, lng], {
          radius: acc,
          color: '#3b82f6',
          fillColor: '#93c5fd',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(mapInstanceRef.current);
      }
    }
  }, []);

  // Locate single fix with fallback
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('acquiring');
    setGpsMessage('Requesting GPS coordinates from your device...');

    // Attempt 1: High Accuracy
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        updateUserPositionOnMap(latitude, longitude, acc);
        setGpsStatus('locked');
        setGpsMessage(`GPS Locked! Accuracy ±${Math.round(acc)}m`);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 14);
        }
      },
      (err) => {
        // If high accuracy failed (e.g. timeout on desktop without GPS chip), fallback to standard accuracy
        console.warn('High accuracy GPS error:', err.message, 'Trying standard IP/network accuracy...');
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsMessage('Location permission was denied. Click the lock/settings icon in your browser address bar to allow location, or choose a city below.');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy: acc } = pos.coords;
            updateUserPositionOnMap(latitude, longitude, acc);
            setGpsStatus('locked');
            setGpsMessage(`Network Location Locked (Accuracy ±${Math.round(acc)}m)`);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([latitude, longitude], 13);
            }
          },
          (fallbackErr) => {
            console.error('GPS Fallback Error:', fallbackErr);
            setGpsStatus('unavailable');
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              setGpsMessage('Location permission denied in browser settings.');
            } else {
              setGpsMessage('Could not retrieve device GPS. Click on the map or pick a city to set your location.');
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [updateUserPositionOnMap]);

  // Start continuous Live Tracking
  const handleStartLiveTracking = () => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsMessage('Geolocation not supported.');
      return;
    }

    if (watchIdRef.current !== null) {
      // Already running -> Stop it
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setGpsStatus('locked');
      setGpsMessage('Live tracking stopped. Current location retained.');
      return;
    }

    setGpsStatus('acquiring');
    setGpsMessage('Starting continuous live GPS tracking...');

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        updateUserPositionOnMap(latitude, longitude, acc);
        setGpsStatus('live_tracking');
        setGpsMessage(`Live GPS Active! Tracking position (Accuracy ±${Math.round(acc)}m)`);
      },
      (err) => {
        console.warn('WatchPosition error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsMessage('Location permission denied by browser.');
        } else {
          setGpsStatus('unavailable');
          setGpsMessage(`Tracking error: ${err.message}`);
        }
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );

    watchIdRef.current = id;
  };

  // Jump to Preset City
  const handleSelectCityPreset = (city: typeof CITY_PRESETS[0]) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    updateUserPositionOnMap(city.lat, city.lng, 150);
    setGpsStatus('locked');
    setGpsMessage(`Location set to ${city.name}`);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([city.lat, city.lng], 13);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Allow user to click anywhere on map to manually reposition location
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      updateUserPositionOnMap(lat, lng, 50);
      setGpsStatus('locked');
      setGpsMessage(`Location pin placed manually at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    });

    // Place initial user marker
    updateUserPositionOnMap(userLocation.lat, userLocation.lng, 250);

    // Auto-attempt geolocation on load
    handleLocateMe();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Worker Markers whenever workers or userLocation change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    workers.forEach((w) => {
      const distance = calculateDistanceKm(userLocation.lat, userLocation.lng, w.lat, w.lng);
      const isOnline = w.isAvailable;

      const workerIcon = L.divIcon({
        className: 'custom-worker-marker',
        html: `
          <div style="background-color:${isOnline ? '#059669' : '#475569'}; color:#ffffff; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:700; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.4); display:flex; align-items:center; gap:4px; white-space:nowrap; cursor:pointer;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${isOnline ? '#34d399' : '#94a3b8'};"></span>
            <span>${w.fullName.split(' ')[0]} (${w.serviceCategory.split(' ')[0]})</span>
            <span style="opacity:0.85; font-size:10px;">${distance}km</span>
          </div>
        `,
        iconSize: [120, 28],
        iconAnchor: [60, 14],
      });

      const marker = L.marker([w.lat, w.lng], { icon: workerIcon }).addTo(markersLayerRef.current!);
      marker.on('click', () => {
        setActiveWorkerOnMap(w);
      });
    });
  }, [workers, userLocation]);

  return (
    <div className="space-y-4">
      {/* GPS Status & Control Console */}
      <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Live GPS & Nearby Technicians Radar
              </h2>
              {/* Dynamic Status Badge */}
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1.5 ${
                  gpsStatus === 'live_tracking'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : gpsStatus === 'locked'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : gpsStatus === 'acquiring'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : gpsStatus === 'denied'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    gpsStatus === 'live_tracking'
                      ? 'bg-emerald-400 animate-pulse'
                      : gpsStatus === 'locked'
                      ? 'bg-blue-400'
                      : gpsStatus === 'acquiring'
                      ? 'bg-amber-400 animate-ping'
                      : gpsStatus === 'denied'
                      ? 'bg-rose-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span>
                  {gpsStatus === 'live_tracking'
                    ? 'Live Tracking'
                    : gpsStatus === 'locked'
                    ? 'GPS Locked'
                    : gpsStatus === 'acquiring'
                    ? 'Acquiring GPS...'
                    : gpsStatus === 'denied'
                    ? 'Permission Denied'
                    : 'GPS Idle'}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Calculates real geodesic distances to verified local workers using browser coordinates and OpenStreetMap.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLocateMe}
              disabled={gpsStatus === 'acquiring'}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm flex items-center space-x-1.5 disabled:bg-slate-800 disabled:text-slate-500"
            >
              <span>{gpsStatus === 'acquiring' ? 'Detecting...' : 'Locate Me Now'}</span>
            </button>

            <button
              onClick={handleStartLiveTracking}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition border flex items-center space-x-1.5 ${
                watchIdRef.current !== null
                  ? 'bg-rose-600/20 text-rose-400 border-rose-500/40 hover:bg-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${watchIdRef.current !== null ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span>{watchIdRef.current !== null ? 'Stop Live Tracking' : 'Start Continuous Tracking'}</span>
            </button>
          </div>
        </div>

        {/* Live Coordinate Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Latitude</span>
            <span className="font-mono font-bold text-white">{userLocation.lat.toFixed(5)}°</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Longitude</span>
            <span className="font-mono font-bold text-white">{userLocation.lng.toFixed(5)}°</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">GPS Accuracy</span>
            <span className="font-mono font-bold text-emerald-400">
              {accuracy ? `± ${accuracy} meters` : 'Standard Network'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Last Updated</span>
            <span className="font-mono text-slate-300">{lastUpdatedTime || 'Initialized'}</span>
          </div>
        </div>

        {/* Status / Error Message */}
        {gpsMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between ${
              gpsStatus === 'denied'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                : gpsStatus === 'acquiring'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-slate-950 border border-slate-800 text-slate-300'
            }`}
          >
            <span>{gpsMessage}</span>
            {gpsStatus === 'denied' && (
              <button
                onClick={handleLocateMe}
                className="ml-3 px-2.5 py-1 rounded bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-500 shrink-0"
              >
                Retry GPS
              </button>
            )}
          </div>
        )}

        {/* Quick City Presets Bar & Map Pin Tip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 mr-1">Quick City Jump:</span>
            {CITY_PRESETS.map((city) => (
              <button
                key={city.name}
                onClick={() => handleSelectCityPreset(city)}
                className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px]"
              >
                {city.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400">
            Tip: Click anywhere directly on the map to place your custom pin.
          </span>
        </div>
      </div>

      {/* Map Filter Strip */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Filter Radar Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none"
          >
            <option value="All">All Categories ({workers.length})</option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-400">
          Showing {workers.length} active service providers in directory
        </span>
      </div>

      {/* Leaflet Interactive Map View */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 h-[520px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Selected Worker Card */}
        {activeWorkerOnMap && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    activeWorkerOnMap.photoUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      activeWorkerOnMap.fullName
                    )}`
                  }
                  alt={activeWorkerOnMap.fullName}
                  className="w-12 h-12 rounded-xl bg-slate-800 object-cover border border-slate-700"
                />
                <div>
                  <h3 className="font-bold text-white text-sm">{activeWorkerOnMap.fullName}</h3>
                  <p className="text-xs text-blue-400 font-medium">{activeWorkerOnMap.serviceCategory}</p>
                  <p className="text-[11px] text-slate-400">
                    {calculateDistanceKm(
                      userLocation.lat,
                      userLocation.lng,
                      activeWorkerOnMap.lat,
                      activeWorkerOnMap.lng
                    )}{' '}
                    km away • {activeWorkerOnMap.city}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveWorkerOnMap(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 py-2 px-3 rounded-lg bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold">
                ★ {activeWorkerOnMap.rating.toFixed(1)} ({activeWorkerOnMap.reviewCount})
              </span>
              <span className="text-white font-bold">₹{activeWorkerOnMap.serviceCharge} / visit</span>
              <span
                className={activeWorkerOnMap.isAvailable ? 'text-emerald-400 font-semibold' : 'text-slate-400'}
              >
                {activeWorkerOnMap.isAvailable ? 'Available Now' : 'Offline'}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onBookWorker(activeWorkerOnMap)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Book This Provider
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Proximity Sorted Provider Cards */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Closest Verified Technicians by Geodesic Proximity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {workers
            .map((w) => ({
              ...w,
              dist: calculateDistanceKm(userLocation.lat, userLocation.lng, w.lat, w.lng),
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 4)
            .map((w) => (
              <div
                key={w.id}
                onClick={() => {
                  setActiveWorkerOnMap(w);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([w.lat, w.lng], 14);
                  }
                }}
                className="p-3 bg-slate-950 hover:bg-slate-850 rounded-lg border border-slate-800/80 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{w.fullName}</p>
                  <p className="text-slate-400">{w.serviceCategory}</p>
                  <p className="text-blue-400 font-medium mt-0.5">{w.dist} km from you</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-400">★ {w.rating.toFixed(1)}</p>
                  <p className="text-slate-400">₹{w.serviceCharge}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
