export const routes = {
  safe: { id: 'safe', minutes: 24, title: 'Menor exposição conhecida', summary:'Evita 1 área R3 e 1 alagamento recente.', points: [[-23.579,-46.697],[-23.578,-46.691],[-23.576,-46.686],[-23.574,-46.681],[-23.571,-46.677],[-23.568,-46.673],[-23.561,-46.671],[-23.557,-46.669]] },
  fast: { id: 'fast', minutes: 18, title: 'Mais rápida · maior exposição', summary:'Atenção: cruza uma área R3 e um alagamento reportado.', occurrenceId: 'alagamento-1', points: [[-23.579,-46.697],[-23.575,-46.695],[-23.571,-46.691],[-23.567,-46.688],[-23.566,-46.682],[-23.562,-46.677],[-23.559,-46.674],[-23.557,-46.669]] }
};
export const occurrences = [{ id:'alagamento-1', type:'Alagamento', location:'Pinheiros · trecho ilustrativo', position:[-23.567,-46.686], description:'Via reportada como intransitável', time:'há 6 min', severity:'Alta', source:'Relatos de usuários · dados fictícios', validity:'expira em 30 min', reportCount:3, shortLocation:'Pinheiros' }];
export const zone = [[-23.572,-46.691],[-23.568,-46.693],[-23.564,-46.688],[-23.563,-46.681],[-23.566,-46.678],[-23.570,-46.682]];
export const places = ['Minha localização','Hospital das Clínicas'];
export const historicalExample = {count:2, period:'2023 a 2025'};
export const routeFactors = [
  {id:'area-r3', icon:'risk', title:'Área de risco evitada', description:'Esta rota evita uma área classificada como R3.', source:'GeoSampa · dado demonstrativo', tone:'amber', routeId:'fast', period:'Período da área não informado no cenário fictício.', relation:'A alternativa mais rápida cruza a área; a recomendada a evita.'},
  {id:'historico', icon:'history', title:'Histórico de alagamentos', description:`${historicalExample.count} registros próximos à outra rota.`, source:'GeoSampa · dados demonstrativos', tone:'blue', routeId:'fast', occurrenceId:'alagamento-1', period:`${historicalExample.period} · período fictício.`, relation:'Os registros estão próximos à alternativa mais rápida; são históricos e não indicam ocorrência atual.'},
  {id:'chuva', icon:'rain', title:'Chuva observada', description:'Chuva moderada observada na região há 8 min.', source:'SIBH · dado demonstrativo', tone:'blue', routeId:'safe', period:'Há 8 min · horário fictício.', relation:'A chuva é contexto para a região da rota recomendada, não uma medição ao vivo.'},
  {id:'corrego', icon:'water', title:'Córrego próximo', description:'Proximidade é contexto e não indica perigo por si só.', source:'Hidrografia · dado demonstrativo', tone:'blue', routeId:'safe', period:'Período não disponível no cenário fictício.', relation:'O córrego fica próximo à rota recomendada; a proximidade isolada não comprova risco.'},
];
export const segments = [
  {id:'origem-e-acesso', name:'Origem e acesso', description:'Informação insuficiente para classificar a exposição.', source:'Cobertura indisponível no cenário.', routeId:'safe', period:'Período não disponível no cenário fictício.', relation:'A falta de observações não significa ausência de risco.', points:routes.safe.points.slice(0, 3)},
  {id:'risco-e-ocorrencia', name:'Área de risco e ocorrência', description:'A alternativa mais rápida cruza a área R3 e o alagamento reportado.', source:'GeoSampa e relatos · dados fictícios', routeId:'fast', occurrenceId:'alagamento-1', period:`Ocorrência: ${occurrences[0].time} · horário fictício; período da área não informado.`, relation:'A alternativa mais rápida cruza a área e o ponto reportado; a rota recomendada evita esse trecho.', points:routes.fast.points.slice(2, 5)},
  {id:'chegada', name:'Chegada ao destino', description:'A rota recomendada evita o trecho de maior exposição identificado.', source:'Comparação ilustrativa · dados fictícios', routeId:'safe', period:'Período não disponível no cenário fictício.', relation:'A rota recomendada evita a área e a ocorrência identificadas na alternativa mais rápida.', points:routes.safe.points.slice(5)},
];
export function getOrderedSegments(reversed) {
  if (!reversed) return segments;
  return [
    {...segments[2], name: 'Origem e acesso', description: 'Início da viagem invertida no trecho antes da chegada original.'},
    segments[1],
    {...segments[0], name: 'Chegada ao destino', description: 'Informação insuficiente para classificar a exposição neste trecho.'},
  ];
}
export function validateTrip(origin, destination) {
  return places.includes(origin) && places.includes(destination) && origin !== destination;
}
export function canCompareTrip(origin, destination, dataState) {
  return dataState !== 'loading' && dataState !== 'unavailable' && validateTrip(origin, destination);
}
export function saveRoute(saved, route) {
  return [...saved.filter(item => item.id !== route.id), route];
}

export const scenarioAlert = {title:'Alagamento na rota de volta', detailTitle:'Alagamento na sua rota de volta', source:'Relatos e chuva SIBH · dados demonstrativos'};
export const reportLocation = {label: occurrences[0].location, shortLabel: occurrences[0].shortLocation};
