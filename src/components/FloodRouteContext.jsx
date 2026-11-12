import React from 'react';

const typeName = type => type === 'INUNDACAO' ? 'Inundação' : 'Alagamento';
export default function FloodRouteContext({context}) {
  if(!context) return <p>Contexto histórico não disponível para esta consulta.</p>;
  const {history,areas}=context;
  return <section className="real-evidence" aria-label="Contexto de inundações da rota">
    <h2>Histórico e manchas na rota</h2>
    <p>Registros a até 100 m do trajeto (distância experimental). São dados históricos, não alertas atuais.</p>
    {history.status==='unavailable' && <p>Histórico indisponível.</p>}
    {history.status==='partial' && <p>Histórico incompleto: uma fonte falhou ou limitou os resultados.</p>}
    {history.status==='available' && history.events.length===0 && <p>Nenhum registro encontrado nesse limite; a cobertura pode ser incompleta.</p>}
    {history.events.length>0 && <ul>{history.events.map((e,i)=><li key={`${e.id}-${i}`}>{typeName(e.type)} · {Math.round(e.distanceMeters)} m da rota · trecho {e.segmentIndex+1} · ocorrência: {e.date || 'data não informada'} · carga: {e.loadedAt || 'não informada'} · Defesa Civil / GeoSampa</li>)}</ul>}
    <ul>{[5].map(period=>{const entry=areas[period];return <li key={period}>Cenário de retorno de {period} anos: {entry.status==='unavailable'?'indisponível':`${entry.segmentIndexes.length} trecho(s) ${entry.status==='partial'?'(resultado parcial)':'identificado(s)'}`}</li>;})}</ul>
    <p>O cenário mostra inundação potencial para um período de retorno de 5 anos; não é um histórico dos últimos 5 anos nem uma previsão atual. Trechos são segmentos da geometria da rota; podem ser maiores que a área cruzada. As manchas são informativas e não alteram a pontuação; os registros históricos entram na comparação quando as fontes estão completas.</p>
  </section>;
}
