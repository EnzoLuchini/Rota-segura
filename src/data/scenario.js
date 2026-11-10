export const routes = {
  safe: { id: 'safe', minutes: 24, title: 'Menor exposição conhecida', points: [[-23.579,-46.697],[-23.578,-46.691],[-23.576,-46.686],[-23.574,-46.681],[-23.571,-46.677],[-23.568,-46.673],[-23.561,-46.671],[-23.557,-46.669]] },
  fast: { id: 'fast', minutes: 18, title: 'Mais rápida · maior exposição', occurrenceId: 'alagamento-1', points: [[-23.579,-46.697],[-23.575,-46.695],[-23.571,-46.691],[-23.567,-46.688],[-23.566,-46.682],[-23.562,-46.677],[-23.559,-46.674],[-23.557,-46.669]] }
};
export const occurrences = [{ id:'alagamento-1', type:'Alagamento', location:'Pinheiros · trecho ilustrativo', position:[-23.567,-46.686], description:'Via reportada como intransitável', time:'há 6 min', severity:'Alta', source:'Relatos de usuários · dados fictícios' }];
export const zone = [[-23.572,-46.691],[-23.568,-46.693],[-23.564,-46.688],[-23.563,-46.681],[-23.566,-46.678],[-23.570,-46.682]];
export const places = ['Minha localização','Hospital das Clínicas'];
export const routeFactors = [
  {id:'area-r3', icon:'risk', title:'Área de risco evitada', description:'Esta rota evita uma área classificada como R3.', source:'GeoSampa · dado demonstrativo', tone:'amber', routeId:'fast'},
  {id:'historico', icon:'history', title:'Histórico de alagamentos', description:'2 registros próximos à outra rota.', source:'GeoSampa · dados demonstrativos', tone:'blue', routeId:'fast', occurrenceId:'alagamento-1'},
  {id:'chuva', icon:'rain', title:'Chuva observada', description:'Chuva moderada observada na região há 8 min.', source:'SIBH · dado demonstrativo', tone:'blue', routeId:'safe'},
  {id:'corrego', icon:'water', title:'Córrego próximo', description:'Proximidade é contexto e não indica perigo por si só.', source:'Hidrografia · dado demonstrativo', tone:'blue', routeId:'safe'},
];
export const segments = [
  {id:'origem-e-acesso', name:'Origem e acesso', description:'Informação insuficiente para classificar a exposição.', source:'Cobertura indisponível no cenário.', routeId:'safe'},
  {id:'risco-e-ocorrencia', name:'Área de risco e ocorrência', description:'A alternativa mais rápida cruza a área R3 e o alagamento reportado.', source:'GeoSampa e relatos · dados fictícios', routeId:'fast', occurrenceId:'alagamento-1'},
  {id:'chegada', name:'Chegada ao destino', description:'A rota recomendada evita o trecho de maior exposição identificado.', source:'Comparação ilustrativa · dados fictícios', routeId:'safe'},
];
export function validateTrip(origin, destination) {
  return places.includes(origin) && places.includes(destination) && origin !== destination;
}
export function canCompareTrip(origin, destination, dataState) {
  return dataState !== 'loading' && dataState !== 'unavailable' && validateTrip(origin, destination);
}
export function saveRoute(saved, route) {
  return [...saved.filter(item => item.id !== route.id), route];
}
