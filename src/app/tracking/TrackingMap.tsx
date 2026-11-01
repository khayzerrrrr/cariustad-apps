"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export interface TrailPoint {
  lat: number;
  lng: number;
  time: string;
}

interface TrackingMapProps {
  origin: { lat: number; lng: number };
  dest: { lat: number; lng: number };
  currentPos: { lat: number; lng: number };
  trail: TrailPoint[];
  ustadzName: string;
  destLabel: string;
  tracking: boolean;
}

export default function TrackingMap({
  origin,
  dest,
  currentPos,
  trail,
  ustadzName,
  destLabel,
  tracking,
}: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const movingMarker = useRef<L.Marker | null>(null);
  const accuracyCircle = useRef<L.Circle | null>(null);
  const trailLayer = useRef<L.Polyline | null>(null);
  const trailDots = useRef<L.LayerGroup | null>(null);

  // init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    // Icons
    const startIcon = L.divIcon({
      className: "",
      html: `<div style="background:#10b981;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const destIcon = L.divIcon({
      className: "",
      html: `<div style="background:#ef4444;width:28px;height:28px;border-radius:6px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">&#128731;</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const movingIcon = L.divIcon({
      className: "",
      html: `<div style="position:relative;">
        <div style="background:#3b82f6;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 ${tracking ? "8px" : "4px"} rgba(59,130,246,${tracking ? ".3" : ".15"});${tracking ? "animation:pulse 2s infinite;" : ""}"></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Start marker
    L.marker([origin.lat, origin.lng], { icon: startIcon })
      .addTo(map)
      .bindPopup(`Lokasi asal: ${ustadzName}`);

    // Destination marker
    L.marker([dest.lat, dest.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`Tujuan: ${destLabel}`);

    // Planned route (dashed)
    L.polyline(
      [
        [origin.lat, origin.lng],
        [dest.lat, dest.lng],
      ],
      { color: "#10b981", weight: 2, dashArray: "6 8", opacity: 0.4 }
    ).addTo(map);

    // Trail layer (actual path traveled)
    trailLayer.current = L.polyline([], {
      color: "#3b82f6",
      weight: 3,
      opacity: 0.8,
    }).addTo(map);

    trailDots.current = L.layerGroup().addTo(map);

    // Accuracy circle
    accuracyCircle.current = L.circle([currentPos.lat, currentPos.lng], {
      radius: 150,
      color: "#3b82f6",
      fillColor: "#3b82f6",
      fillOpacity: 0.08,
      weight: 1,
    }).addTo(map);

    // Moving marker (ustadz)
    movingMarker.current = L.marker([currentPos.lat, currentPos.lng], {
      icon: movingIcon,
    })
      .addTo(map)
      .bindPopup(`${ustadzName} (dalam perjalanan)`);

    // Fit bounds
    const bounds = L.latLngBounds([
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    mapInstance.current = map;

    // Add pulse animation CSS
    if (!document.getElementById("leaflet-pulse-style")) {
      const style = document.createElement("style");
      style.id = "leaflet-pulse-style";
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,.4); }
          70% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update moving marker + accuracy circle when currentPos changes
  useEffect(() => {
    if (!mapInstance.current || !movingMarker.current || !accuracyCircle.current) return;

    movingMarker.current.setLatLng([currentPos.lat, currentPos.lng]);
    accuracyCircle.current.setLatLng([currentPos.lat, currentPos.lng]);

    // Pan to follow
    mapInstance.current.panTo([currentPos.lat, currentPos.lng], {
      animate: true,
      duration: 1,
    });
  }, [currentPos]);

  // Update trail when trail changes
  useEffect(() => {
    if (!trailLayer.current || !trailDots.current) return;

    const latlngs = trail.map((p) => [p.lat, p.lng] as [number, number]);
    trailLayer.current.setLatLngs(latlngs);

    // Clear old dots and add new ones
    trailDots.current.clearLayers();
    trail.forEach((p, i) => {
      if (i === 0) return; // skip origin (already has green marker)
      const dotIcon = L.divIcon({
        className: "",
        html: `<div style="background:#3b82f6;width:6px;height:6px;border-radius:50%;border:1px solid white;opacity:.6;"></div>`,
        iconSize: [6, 6],
        iconAnchor: [3, 3],
      });
      L.marker([p.lat, p.lng], { icon: dotIcon })
        .bindPopup(`Update ${i}: ${p.time}`)
        .addTo(trailDots.current!);
    });
  }, [trail]);

  return <div ref={mapRef} className="h-full w-full rounded-2xl" />;
}
