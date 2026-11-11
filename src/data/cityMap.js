import {occurrences, reportLocation, historicalExample} from './scenario';

export const cityEvents = {
  now: [
    {...occurrences[0], title: 'Alagamento em Pinheiros', detail: `${occurrences[0].description} · ${occurrences[0].time} (simulado)`, source: 'Relatos de usuários · dados fictícios'},
    {id: 'now-vila-mariana', kind: 'inundation', title: 'Inundação na Vila Mariana', position: [-23.59, -46.638], detail: 'Via parcialmente interditada · há 12 min (simulado)', source: 'Aviso demonstrativo · dados fictícios'},
    {id: 'now-lapa', title: 'Alagamento na Lapa', position: [-23.536, -46.697], detail: 'Água acumulada na via · há 18 min (simulado)', source: 'Relato comunitário demonstrativo · dados fictícios'},
    {id: 'now-mooca', kind: 'inundation', title: 'Inundação na Mooca', position: [-23.557, -46.605], detail: 'Trecho com trânsito interrompido · há 25 min (simulado)', source: 'Aviso demonstrativo · dados fictícios'},
    {id: 'now-centro', title: 'Alagamento no Centro', position: [-23.549, -46.637], detail: 'Pista com acúmulo de água · há 30 min (simulado)', source: 'Relato comunitário demonstrativo · dados fictícios'},
    {id: 'now-tree', kind: 'tree', title: 'Queda de árvore em Perdizes', position: [-23.55, -46.675], detail: 'Galhos bloqueiam uma faixa · há 20 min (simulado)', source: 'Relato comunitário demonstrativo · dados fictícios'},
    {id: 'now-closure', kind: 'closure', title: 'Via interditada na Bela Vista', position: [-23.565, -46.646], detail: 'Bloqueio preventivo por acúmulo de água · há 15 min (simulado)', source: 'Aviso demonstrativo · dados fictícios'},
  ],
  history: [
    {id: 'history-pinheiros', title: `${reportLocation.shortLabel} · ${historicalExample.count} registros`, position: occurrences[0].position, detail: `${historicalExample.count} registros de alagamento no período fictício de ${historicalExample.period}.`, source: 'Histórico demonstrativo · dados fictícios'},
    {id: 'history-lapa', title: 'Lapa · 5 registros', position: [-23.536, -46.697], detail: '5 registros de alagamento no período fictício de 2022 a 2025.', source: 'Histórico demonstrativo · dados fictícios'},
    {id: 'history-centro', title: 'Centro · 4 registros', position: [-23.549, -46.637], detail: '4 registros de alagamento no período fictício de 2021 a 2025.', source: 'Histórico demonstrativo · dados fictícios'},
    {id: 'history-vila-mariana', kind: 'inundation', title: 'Vila Mariana · 3 registros', position: [-23.59, -46.638], detail: '3 registros de inundação no período fictício de 2022 a 2025.', source: 'Histórico demonstrativo · dados fictícios'},
    {id: 'history-mooca', title: 'Mooca · 6 registros', position: [-23.557, -46.605], detail: '6 registros de alagamento no período fictício de 2020 a 2025.', source: 'Histórico demonstrativo · dados fictícios'},
    {id: 'history-itaim', kind: 'inundation', title: 'Itaim Bibi · 2 registros', position: [-23.585, -46.682], detail: '2 registros de inundação no período fictício de 2023 a 2025.', source: 'Histórico demonstrativo · dados fictícios'},
  ],
};

export function getCityEvents(mode, reports = []) {
  if (mode !== 'now') return cityEvents.history;
  return [...cityEvents.now, ...reports.map((report, i) => ({
    id: `report-${report.id}`,
    kind: report.type === 'Árvore caída' ? 'tree' : report.type === 'Alagamento' ? 'flood' : 'report',
    title: `${report.type} · relato local`,
    position: [-23.569 - (i % 4) * 0.001, -46.689 - (i % 4) * 0.001],
    detail: `${reportLocation.shortLabel} · gravidade ${report.severity} · via transitável: ${report.passable}${report.description ? ` · ${report.description}` : ''}`,
    source: 'Relato comunitário simulado · não é confirmação oficial · localização ilustrativa',
  }))];
}

// Geometrias inventadas apenas para demonstrar a linguagem visual do mapa.
export const illustrativeStreams = [
  [[-23.526, -46.681], [-23.541, -46.677], [-23.552, -46.681], [-23.565, -46.675], [-23.579, -46.679], [-23.592, -46.673]],
  [[-23.55, -46.618], [-23.56, -46.623], [-23.57, -46.619], [-23.584, -46.626], [-23.594, -46.623]],
];

export function illustrativeFloodArea([lat, lng], scale = 1) {
  return [[-0.004, -0.008], [-0.006, -0.002], [-0.004, 0.006], [0.001, 0.008], [0.005, 0.003], [0.004, -0.005]].map(([dy, dx]) => [lat + dy * scale, lng + dx * scale]);
}
