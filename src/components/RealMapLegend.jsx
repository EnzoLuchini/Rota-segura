import React from 'react';
import {Droplets, Waves} from 'lucide-react';

export default function RealMapLegend({showRoutes, showWater, showRisk,showHistory,showFlood,showRouteContext,showRain}) {
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
      {showRain && <span><i aria-hidden="true">☔</i> Estação de chuva observada</span>}
      {showHistory && <><span><i aria-hidden="true" className="real-legend-event real-legend-event--flood"><Droplets/></i>Alagamento histórico</span><span><i aria-hidden="true" className="real-legend-event real-legend-event--inundation"><Waves/></i>Inundação histórica</span></>}
      {showFlood && <span><i aria-hidden="true" className="real-legend-flood"/>Inundação potencial · cenário de retorno de 5 anos</span>}
      {showRouteContext && <span><i aria-hidden="true" className="real-legend-line real-legend-context"/>Trecho que cruza mancha</span>}
      {!showRoutes && !showWater && !showRisk && !showHistory && !showFlood && !showRouteContext && !showRain && <span>Nenhuma camada selecionada.</span>}
    </div>
    {showWater && <small>Rede de drenagem: GeoSampa / Prefeitura de São Paulo. Toque em uma linha para consultar os detalhes disponíveis.</small>}
    {showHistory && <small>H identifica registros históricos. Os círculos numerados agrupam pontos próximos; selecione para consultar os registros.</small>}
  </section>;
}
