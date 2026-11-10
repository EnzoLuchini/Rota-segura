import React, {useEffect, useState} from 'react';
import {getCityEvents} from '../data/cityMap';
import CityModeTabs from './CityModeTabs';

export default function CityMapPanel({mode, onModeChange, onBack, dataState = 'available', onDataStateChange, onLocate, reports = []}) {
  const [selected, setSelected] = useState(null);
  const visible = dataState === 'available' || dataState === 'stale';
  useEffect(() => { setSelected(null); }, [mode]);
  return <>
    <button className="back" onClick={onBack}>← Voltar para rotas</button>
    <span className="overline">Explore a cidade</span>
    <h1>Situação da cidade</h1>
    <p className="intro">Consulte acontecimentos no mapa sem precisar montar uma rota.</p>
    <p className="city-disclaimer">Dados fictícios e geometrias ilustrativas para demonstração. Não representam a situação real da cidade.</p>
    <p className="footnote">Os córregos são ilustrativos e não indicam risco por si só.</p>
    <div className="city-tabs-desktop"><CityModeTabs mode={mode} onModeChange={onModeChange} /></div>
    <p className="city-explanation">{mode === 'now' ? 'Ocorrências recentes simuladas. Os horários são fictícios e não indicam atualização em tempo real.' : 'Registros anteriores: histórico não significa que há alagamento agora. A cobertura é ilustrativa.'}</p>
    {onDataStateChange && <details className="city-simulation"><summary>Opções de simulação</summary><label className="form-field">Condição dos dados (simulação)
      <select value={dataState} onChange={e => { setSelected(null); onDataStateChange(e.target.value); }}>
        <option value="available">Dados disponíveis</option><option value="stale">Dados desatualizados</option><option value="loading">Carregando</option><option value="unavailable">Dados indisponíveis</option><option value="empty">Sem registros</option>
      </select>
    </label></details>}
    <div role="status" className="city-status">
      {dataState === 'stale' && 'Dados desatualizados: podem não refletir a situação atual.'}
      {dataState === 'loading' && 'Carregando informações simuladas…'}
      {dataState === 'unavailable' && 'Dados indisponíveis. Não é possível avaliar a situação.'}
      {dataState === 'empty' && 'Nenhum registro neste cenário. Isso não garante ausência de riscos.'}
    </div>
    {visible && <div className="city-list"><h2>{mode === 'now' ? 'Ocorrências recentes' : 'Registros históricos'}</h2>
      {getCityEvents(mode, reports).map(event => <div className="city-event" key={event.id}>
        <button aria-expanded={selected === event.id} onClick={() => setSelected(selected === event.id ? null : event.id)}>{event.title}<span aria-hidden="true"> ›</span></button>
        {selected === event.id && <div><p>{event.detail}</p><small>{event.source}</small>{onLocate && <button className="city-locate" onClick={() => onLocate(event)}>Ver {event.title} no mapa</button>}</div>}
      </div>)}
    </div>}
    <button className="secondary" onClick={onBack}>Montar uma rota</button>
  </>;
}
