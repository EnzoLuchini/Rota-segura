import React from 'react';

export default function RealMapLegend({showRoutes, showWater, showRisk}) {
  return <section className="map-context real-map-legend" aria-label="Legenda do mapa">
    <strong>Legenda do mapa</strong>
    <div className="map-legend real-map-legend-items">
      {showRoutes && <>
        <span><i aria-hidden="true" className="real-legend-line real-legend-selected"/>Trajeto selecionado</span>
        <span><i aria-hidden="true" className="real-legend-line real-legend-other"/>Outras alternativas</span>
      </>}
      {showWater && <>
        <span><i aria-hidden="true" className="real-legend-line real-legend-water"/>Rio ou córrego mapeado</span>
        <span><i aria-hidden="true" className="real-legend-line real-legend-underground"/>Trecho subterrâneo</span>
      </>}
      {showRisk && <span><i aria-hidden="true" className="real-legend-area"/>Área de risco mapeada</span>}
      {!showRoutes && !showWater && !showRisk && <span>Nenhuma camada selecionada.</span>}
    </div>
    {showWater && <small>Rede de drenagem: GeoSampa / Prefeitura de São Paulo. Toque em uma linha para consultar os detalhes disponíveis.</small>}
  </section>;
}
