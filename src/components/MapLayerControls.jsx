import React from 'react';
import {Layers} from 'lucide-react';

export default function MapLayerControls({water,onWaterChange,risk,onRiskChange,riskAvailable,hasRoutes=false}) {
  return <details className="map-layer-controls">
    <summary><Layers size={17} aria-hidden="true"/> Camadas do mapa</summary>
    <div className="map-layer-menu">
      <label><input type="checkbox" checked={water} onChange={event=>onWaterChange(event.target.checked)}/> Rios e córregos</label>
      <label><input type="checkbox" checked={risk} disabled={!riskAvailable} onChange={event=>onRiskChange(event.target.checked)}/> Áreas de risco mapeadas</label>
      {!riskAvailable && <small>{hasRoutes?'Dados de áreas de risco indisponíveis nesta consulta.':'Áreas de risco disponíveis após consultar rotas.'}</small>}
      <small>Ocultar as áreas no mapa não altera a comparação das rotas.</small>
      <p id="water-status" role="status"/>
    </div>
  </details>;
}
