"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface LocationPickerMapProps {
  initialPos?: { lat: number; lng: number };
  selectedPos: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({
  initialPos,
  selectedPos,
  onPick,
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  // init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center: L.LatLngExpression = initialPos
      ? [initialPos.lat, initialPos.lng]
      : [-6.2088, 106.8456]; // Jakarta default

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(center, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    // Click to pick location
    map.on("click", (e: L.LeafletMouseEvent) => {
      onPick(e.latlng.lat, e.latlng.lng);
    });

    // Add hint overlay
    if (mapRef.current) {
      const hint = document.createElement("div");
      hint.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        pointer-events: none;
        background: rgba(255,255,255,0.95);
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        color: #047857;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        white-space: nowrap;
        transition: opacity 0.3s;
      `;
      hint.textContent = "Klik di peta untuk set lokasi";
      mapRef.current.appendChild(hint);
      hintRef.current = hint;
    }

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      hintRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update marker when selectedPos changes
  useEffect(() => {
    if (!mapInstance.current || !selectedPos) return;

    // Hide hint when a location is selected
    if (hintRef.current) {
      hintRef.current.style.opacity = "0";
    }

    const icon = L.divIcon({
      className: "",
      html: `<div style="position:relative;">
        <div style="background:#ef4444;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);"></div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([selectedPos.lat, selectedPos.lng]);
    } else {
      markerRef.current = L.marker([selectedPos.lat, selectedPos.lng], {
        icon,
      })
        .addTo(mapInstance.current)
        .bindPopup("Lokasi acara");
    }

    // Smooth fly-to animation
    mapInstance.current.flyTo([selectedPos.lat, selectedPos.lng], 16, {
      duration: 1.2,
    });
  }, [selectedPos]);

  return <div ref={mapRef} className="h-full w-full" />;
}
