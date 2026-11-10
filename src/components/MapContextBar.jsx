import React from 'react';

export default function MapContextBar() {
  return <div className="map-context">
    <div className="map-legend" aria-label="Legenda do mapa">
      <span><i className="line safe"/> Menor exposição</span>
      <span><i className="line other"/> Outra rota</span>
      <span><i className="square"/> Área de risco</span>
    </div>
  </div>;
}
