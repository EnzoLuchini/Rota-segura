import React from 'react';
import {Ban, Droplets, TreeDeciduous, Waves} from 'lucide-react';

export default function MapContextBar({cityMode = null}) {
  return <div className="map-context">
    <div className="map-legend" aria-label="Legenda do mapa">
      {cityMode ? <>
        <span><i className="city-legend-icon"><Droplets size={13} /></i> {cityMode === 'now' ? 'Alagamento recente' : 'Alagamento histórico'}</span>
        <span><i className={'city-legend-area' + (cityMode === 'now' ? ' city-legend-area-current' : '')}/> {cityMode === 'history' ? 'Área de inundação histórica' : 'Área de inundação recente'}</span>
        {cityMode === 'now' && <><span><i className="city-legend-closure"><Ban size={15} /></i> Via interditada</span><span><i className="city-legend-tree"><TreeDeciduous size={15} /></i> Queda de árvore</span></>}
        <span><i className="city-legend-stream"><Waves size={15} /></i> Córrego ilustrativo</span>
      </> : <>
      <span><i className="line safe"/> Menor exposição</span>
      <span><i className="line other"/> Outra rota</span>
      <span><i className="square"/> Área de risco</span>
      <span><i className="city-legend-icon"><Droplets size={13} /></i> Avisos simulados no mapa</span>
      </>}
    </div>
  </div>;
}
