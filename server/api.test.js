import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from './api.js';

test('a central distingue avisos consultados de fonte indisponível',async()=>{
  for(const [alerts,status] of [[async()=>({status:'partial',coverage:'unknown',checkedAt:'2026-11-11T18:30:00Z',alerts:[]}),200],[async()=>{throw Error('offline');},502]]){
    const server=createServer({alerts});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/alerts`);const data=await response.json();assert.equal(response.status,status);if(status===200){assert.equal(data.status,'partial');assert.equal(data.coverage,'unknown');}else assert.ok(data.error);}
    finally{server.close();}
  }
});

test('a API explica quando a fonte de risco está indisponível ou há somente uma rota',async()=>{
  const city={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.8,-23.7],[-46.5,-23.7],[-46.5,-23.4],[-46.8,-23.4],[-46.8,-23.7]]]}};
  const route={type:'Feature',properties:{summary:{distance:1000,duration:100}},geometry:{type:'LineString',coordinates:[[-46.7,-23.5],[-46.69,-23.5]]}};
  const dataset={type:'FeatureCollection',features:[],truncated:false};
  for(const [riskAreas,reason,status] of [[async()=>{throw Error();},'risk_unavailable','unavailable'],[async()=>[],'single_route','available']]) {
    const server=createServer({key:'test',cityBoundary:async()=>city,riskAreas,drivingRoutes:async()=>[route],historicalOccurrences:async()=>dataset,floodAreasAlongRoute:async()=>dataset});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try {
      const response=await fetch(`http://127.0.0.1:${server.address().port}/api/routes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:[-46.7,-23.5],destination:[-46.69,-23.5]})});
      const data=await response.json();
      assert.equal(response.status,200);
      assert.equal(data.recommendationReason,reason);
      assert.equal(data.sources.risk.status,status);
      assert.equal(data.routes[0].recommended,false);
    } finally {server.close();}
  }
});

test('a API informa ausência de recomendação quando as alternativas têm mesma exposição',async()=>{
  const city={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.8,-23.7],[-46.5,-23.7],[-46.5,-23.4],[-46.8,-23.4],[-46.8,-23.7]]]}};
  const route=(lat)=>({type:'Feature',properties:{summary:{distance:1000,duration:100}},geometry:{type:'LineString',coordinates:[[-46.7,lat],[-46.69,lat]]}});
  const dataset={type:'FeatureCollection',features:[],truncated:false};
  const server=createServer({key:'test',cityBoundary:async()=>city,riskAreas:async()=>[],drivingRoutes:async()=>[route(-23.5),route(-23.51)],historicalOccurrences:async()=>dataset,floodAreasAlongRoute:async()=>dataset});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/routes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:[-46.7,-23.5],destination:[-46.69,-23.5]})});
    const data=await response.json();
    assert.equal(data.recommendationReason,'no_observed_difference');
    assert.ok(data.routes.every(route=>!route.recommended));
  } finally {server.close();}
});

test('a API distingue menor exposição isolada, empate e ausência de trajetos',async()=>{
  const city={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.8,-23.7],[-46.5,-23.7],[-46.5,-23.4],[-46.8,-23.4],[-46.8,-23.7]]]}};
  const area={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.7,-23.515],[-46.69,-23.515],[-46.69,-23.505],[-46.7,-23.505],[-46.7,-23.515]]]}};
  const route=lat=>({type:'Feature',properties:{summary:{distance:1000,duration:100}},geometry:{type:'LineString',coordinates:[[-46.7,lat],[-46.69,lat]]}});
  const dataset={type:'FeatureCollection',features:[],truncated:false};
  for(const [routes,reason,recommended,status] of [[[route(-23.5),route(-23.51)],'lowest_exposure',[true,false],'available'],[[route(-23.5),route(-23.5),route(-23.51)],'lowest_exposure_tie',[false,false,false],'available'],[[],'no_routes',[],'not_queried']]){
    const server=createServer({key:'test',cityBoundary:async()=>city,riskAreas:async()=>[area],drivingRoutes:async()=>routes,historicalOccurrences:async()=>dataset,floodAreasAlongRoute:async()=>dataset});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{
      const response=await fetch(`http://127.0.0.1:${server.address().port}/api/routes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:[-46.7,-23.5],destination:[-46.69,-23.5]})});
      const data=await response.json();
      assert.equal(data.recommendationReason,reason);
      assert.equal(data.sources.risk.status,status);
      if(reason==='no_routes') assert.deepEqual(data.sources.history,{alagamento:'not_queried',inundacao:'not_queried'});
      assert.deepEqual(data.routes.map(r=>r.recommended),recommended);
    }finally{server.close();}
  }
});

test('chuva é consultada por padrão sem exigir configuração', async () => {
  const server=createServer({rain:async()=>({stations:[],queriedAt:'2026-11-11T18:30:00Z'})});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/rain`);
    assert.equal(response.status,200);
    assert.deepEqual((await response.json()).stations,[]);
  } finally {server.close();}
});

test('consulta de chuva informa indisponibilidade quando desativada e falhas da fonte', async () => {
  for (const [options,status] of [[{rainEnabled:false},503],[{rainEnabled:true,rain:async()=>{throw Error('falha');}},502],[{rainEnabled:true,rain:async()=>({stations:[],queriedAt:'2026-11-11T18:30:00Z'})},200]]) {
    const server=createServer(options);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try {
      const response=await fetch(`http://127.0.0.1:${server.address().port}/api/rain`);
      assert.equal(response.status,status);
      const data=await response.json();
      if(status===200) assert.deepEqual(data.stations,[]); else assert.ok(data.error);
    } finally {server.close();}
  }
});

test('rotas rejeitam corpo JSON nulo como pedido inválido', async () => {
  const server = createServer({key:'test'});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/routes`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:'null'
    });
    assert.equal(response.status, 400);
  } finally { server.close(); }
});

test('busca sem chave informa indisponibilidade em vez de retornar dados simulados', async () => {
  const server = createServer({key:''});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/places?q=Paulista`);
    assert.equal(response.status,503);
    assert.match((await response.json()).error,/chave/i);
  } finally { server.close(); }
});

test('limita consulta de drenagem a uma área geográfica válida', async () => {
  const server = createServer({key:''});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/streams?bbox=0,0,180,80`);
    assert.equal(response.status,400);
  } finally { server.close(); }
});

test('ocorrências históricas rejeitam área inválida e preservam dados da fonte', async () => {
  const dataset = {type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[-46.6,-23.5]},properties:{dt_ocorrencia:'2026-04-01Z'}}],truncated:false};
  const server = createServer({key:'', historicalOccurrences: async () => dataset});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/occurrences`;
    assert.equal((await fetch(`${base}?bbox=0,0,180,80`)).status,400);
    const response = await fetch(`${base}?bbox=-46.7,-23.6,-46.5,-23.4`);
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),dataset);
  } finally { server.close(); }
});

test('manchas validam período e área antes de consultar a fonte', async () => {
  const server=createServer({floodAreas:async (bbox,period)=>({type:'FeatureCollection',features:[],truncated:false,period})});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}/api/flood-areas`;
    assert.equal((await fetch(`${base}?bbox=-46.7,-23.6,-46.5,-23.4&period=7`)).status,400);
    const response=await fetch(`${base}?bbox=-46.7,-23.6,-46.5,-23.4&period=25`);
    assert.equal(response.status,200);
    assert.equal((await response.json()).period,25);
  } finally {server.close();}
});

test('rotas recebem contexto histórico mesmo com falha de uma camada, sem alterar recomendação',async()=>{
  const city={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.8,-23.7],[-46.5,-23.7],[-46.5,-23.4],[-46.8,-23.4],[-46.8,-23.7]]]}};
  const route={type:'Feature',properties:{summary:{distance:1000,duration:100}},geometry:{type:'LineString',coordinates:[[-46.7,-23.5],[-46.69,-23.5]]}};
  const dataset={type:'FeatureCollection',features:[],truncated:false};
  const periods=[];
  const server=createServer({key:'test',cityBoundary:async()=>city,riskAreas:async()=>[],drivingRoutes:async()=>[route],historicalOccurrences:async (_box,kind)=>{if(kind==='inundacao')throw Error();return {...dataset,truncated:true};},floodAreasAlongRoute:async (_coordinates,period)=>{periods.push(period);return dataset;}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/routes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:[-46.7,-23.5],destination:[-46.69,-23.5]})});
    assert.equal(response.status,200);
    const result=await response.json();
    assert.equal(result.routes[0].recommended,false);
    assert.equal(result.routes[0].floodContext.history.status,'partial');
    assert.equal(result.sources.history.alagamento,'partial');
    assert.equal(result.sources.history.inundacao,'unavailable');
    assert.equal(result.routes[0].floodContext.areas[5].status,'available');
    assert.deepEqual(periods,[5]);
    assert.deepEqual(Object.keys(result.routes[0].floodContext.areas),['5']);
  } finally {server.close();}
});

test('valida a localização no limite municipal sem exigir chave de rotas',async()=>{
  const city={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.8,-23.7],[-46.5,-23.7],[-46.5,-23.4],[-46.8,-23.4],[-46.8,-23.7]]]}};
  const server=createServer({key:'',cityBoundary:async()=>city});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const url=`http://127.0.0.1:${server.address().port}/api/location`;
    const post=coordinates=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({coordinates})});
    assert.equal((await post([-46.7,-23.5])).status,200);
    assert.equal((await post([-46.9,-23.5])).status,400);
    assert.equal((await post(['x',-23.5])).status,400);
  } finally {server.close();}
});
