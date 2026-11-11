import React, {useEffect, useRef} from 'react';
import {Layers} from 'lucide-react';

export default function MapLayerControls({water,onWaterChange,risk,onRiskChange,riskAvailable,hasRoutes=false,history=false,onHistoryChange,floodPeriod=0,onFloodPeriodChange,rain=false,onRainChange}) {
  const control=useRef(null);
  useEffect(()=>{
    function closeOutside(event){if(control.current?.open && !control.current.contains(event.target))control.current.open=false;}
    function closeOnEscape(event){if(event.key==='Escape' && control.current?.open){control.current.open=false;control.current.querySelector('summary')?.focus();}}
    document.addEventListener('pointerdown',closeOutside);
    document.addEventListener('keydown',closeOnEscape);
    return ()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeOnEscape);};
  },[]);
  return <details className="map-layer-controls" ref={control}>
    <summary><Layers size={17} aria-hidden="true"/> Camadas do mapa</summary>
    <div className="map-layer-menu">
      <label><input type="checkbox" checked={water} onChange={event=>onWaterChange(event.target.checked)}/> Rios e córregos</label>
      <label><input type="checkbox" checked={rain} onChange={event=>onRainChange?.(event.target.checked)}/> Chuva observada nas estações</label>
      {rain && <small>A medição é pontual, tem cobertura limitada e não indica alagamento na via.</small>}
      <label><input type="checkbox" checked={risk} disabled={!riskAvailable} onChange={event=>onRiskChange(event.target.checked)}/> Áreas de risco mapeadas</label>
      <label><input type="checkbox" checked={history} onChange={event=>onHistoryChange?.(event.target.checked)}/> Registros históricos de alagamento e inundação</label>
      {history && <small>Registros da Defesa Civil atualizados periodicamente; não indicam alagamentos atuais nem cobertura completa.</small>}
      <label><input type="checkbox" checked={floodPeriod===5} onChange={event=>onFloodPeriodChange?.(event.target.checked?5:0)}/> Manchas de inundação potencial</label>
      {floodPeriod>0 && <small>Cenário modelado de retorno de 5 anos. Não representa ocorrências dos últimos 5 anos nem uma inundação atual.</small>}
      {!riskAvailable && <small>{hasRoutes?'Dados de áreas de risco indisponíveis nesta consulta.':'Áreas de risco disponíveis após consultar rotas.'}</small>}
      <small>Ocultar as áreas no mapa não altera a comparação das rotas.</small>
      <p id="water-status" role="status"/>
      <p id="rain-status" role="status"/>
      <p id="history-status" role="status"/>
    </div>
  </details>;
}
