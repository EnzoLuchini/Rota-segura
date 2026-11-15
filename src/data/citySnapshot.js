export function visibleHistory(features, bounds) {
  if (!Array.isArray(bounds) || bounds.length!==4) return [];
  return features.filter(feature=>{
    const p=feature.geometry?.coordinates;
    return feature.geometry?.type==='Point' && Array.isArray(p) && p.length>=2 && p.every(Number.isFinite) && p[0]>=bounds[0] && p[0]<=bounds[2] && p[1]>=bounds[1] && p[1]<=bounds[3];
  });
}
