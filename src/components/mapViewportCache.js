export function containsBox(outer, inner) {
  return outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3];
}

export function bufferBox(box) {
  const [west, south, east, north] = box;
  const dx = Math.max(0, Math.min((east - west) * 0.35, (0.29998 - (east - west)) / 2));
  const dy = Math.max(0, Math.min((north - south) * 0.35, (0.29998 - (north - south)) / 2));
  return [Math.max(-46.95, Math.floor((west-dx)*1e5)/1e5), Math.max(-24.1, Math.floor((south-dy)*1e5)/1e5), Math.min(-46.30, Math.ceil((east+dx)*1e5)/1e5), Math.min(-23.3, Math.ceil((north+dy)*1e5)/1e5)];
}

export function findCoverage(entries, box, zoom, now, ttl=60000) {
  return entries.find(entry => now - entry.time < ttl && (zoom == null || zoom === entry.zoom) && containsBox(entry.box, box));
}
