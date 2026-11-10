import React, {useState} from 'react';
import {ChevronDown, MapPinned} from 'lucide-react';

export default function MapContextBar({origin, destination, onAnnounce}) {
  const [expanded, setExpanded] = useState(false);
  const pointsId = 'map-important-points';

  return <div className={'map-context '+(expanded?'is-expanded':'')}>
    <div className="map-legend" aria-label="Legenda do mapa">
      <span><i className="line safe"/> Menor exposição</span>
      <span><i className="line other"/> Outra rota</span>
      <span><i className="square"/> Área de risco</span>
    </div>
    <button
      className="map-points-toggle"
      type="button"
      aria-expanded={expanded}
      aria-controls={pointsId}
      onClick={()=>setExpanded(current=>!current)}
    >
      <MapPinned size={18} aria-hidden="true"/>
      <span>Pontos do mapa</span>
      <ChevronDown className={expanded?'rotated':''} size={17} aria-hidden="true"/>
    </button>
    {expanded&&<div className="map-points" id={pointsId} role="region" aria-label="Pontos importantes do mapa">
      <button type="button" onClick={()=>onAnnounce('Área de risco R3 ilustrativa, cruzada pela rota mais rápida.')}>Área R3</button>
      <button type="button" onClick={()=>onAnnounce('Alagamento demonstrativo em Pinheiros, há 6 min.')}>Ocorrência</button>
      <button type="button" onClick={()=>onAnnounce(`Origem demonstrativa: ${origin}.`)}>Origem</button>
      <button type="button" onClick={()=>onAnnounce(`Destino demonstrativo: ${destination}.`)}>Destino</button>
    </div>}
  </div>;
}
