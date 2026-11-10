import React from 'react';

export default function CityModeTabs({mode, onModeChange}) {
  return <div className="city-tabs" role="group" aria-label="Período do mapa">
    <button aria-pressed={mode === 'now'} onClick={() => onModeChange('now')}>Agora</button>
    <button aria-pressed={mode === 'history'} onClick={() => onModeChange('history')}>Histórico</button>
  </div>;
}
