"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

type Props = {
  latitude: number | null;
  longitude: number | null;
  focus?: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
};

export default function MapPicker({ latitude, longitude, focus, onChange }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const changeHandler = useRef(onChange);
  changeHandler.current = onChange;

  useEffect(() => {
    let disposed = false;
    async function initialize() {
      const L = await import("leaflet");
      if (disposed || !element.current || map.current) return;
      const instance = L.map(element.current, { zoomControl: false, attributionControl: true }).setView(
        latitude && longitude ? [latitude, longitude] : [-6.284, 106.724],
        latitude && longitude ? 15 : 12
      );
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(instance);
      instance.on("click", (event) => changeHandler.current(event.latlng.lat, event.latlng.lng));
      map.current = instance;
      window.setTimeout(() => instance.invalidateSize(), 100);
    }
    initialize();
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (focus && map.current) map.current.setView([focus.lat, focus.lng], 15, { animate: true });
  }, [focus]);

  useEffect(() => {
    if (latitude === null || longitude === null || !map.current) return;
    const lat = latitude;
    const lng = longitude;
    async function updateMarker() {
      const L = await import("leaflet");
      if (!map.current) return;
      if (!marker.current) {
        marker.current = L.marker([lat, lng], {
          draggable: true,
          icon: L.divIcon({ className: "map-pin-wrap", html: '<div class="map-pin destination-pin"><span></span></div>', iconSize: [38, 48], iconAnchor: [19, 44] }),
        }).addTo(map.current);
        marker.current.on("dragend", () => {
          const position = marker.current?.getLatLng();
          if (position) changeHandler.current(position.lat, position.lng);
        });
      } else {
        marker.current.setLatLng([lat, lng]);
      }
      map.current.panTo([lat, lng], { animate: true });
    }
    updateMarker();
  }, [latitude, longitude]);

  return <div ref={element} className="map-canvas" aria-label="Peta untuk memilih tujuan. Ketuk peta untuk menentukan tujuan." />;
}
