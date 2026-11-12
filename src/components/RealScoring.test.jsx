import React from 'react';
import {act,render,screen,within} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {RealComparison} from './RealRoutes';

const rain={status:'available',maxMm:7,queriedAt:'2026-11-12T15:00:00Z',validUntil:'2026-11-12T15:01:00Z',stations:[{id:'1',name:'Estação Centro',value:7,start:'2026-11-12T14:00:00Z',end:'2026-11-12T14:45:00Z',maxDistanceMeters:1000}]};
function data(){return {routes:[{summary:{duration:600,distance:1000},exposureMeters:10,historyCount:2,score:20,recommended:true,rain},{summary:{duration:700,distance:1200},exposureMeters:25,historyCount:0,score:80,recommended:false,rain}],selected:0,riskAvailable:true,origin:{label:'Origem'},destination:{label:'Destino'},recommendationReason:'lowest_combined_score',sources:{rain:{status:'available'}},setSelected:()=>{}};}
it('explica pontuação e mostra evidências e período das estações',()=>{
 render(<RealComparison data={data()} onBack={()=>{}} onSave={()=>{}}/>);
 const first=screen.getByRole('button',{name:/trajeto 1/i});
 expect(within(first).getByText(/20,0 pontos/i)).toBeInTheDocument();
 expect(within(first).getByText(/2 registros históricos/i)).toBeInTheDocument();
 expect(within(first).getByText(/7.*mm/i)).toBeInTheDocument();
 expect(screen.getByText(/50%.*30%.*20%/i)).toBeInTheDocument();
 expect(screen.getAllByText(/Estação Centro/i).length).toBeGreaterThan(0);
});
it('explica quando fontes incompletas impedem a recomendação',()=>{
 const d=data();d.recommendationReason='sources_incomplete';d.routes.forEach(r=>{r.score=null;r.recommended=false;r.rain={status:'unavailable',maxMm:null,stations:[]};});
 render(<RealComparison data={d} onBack={()=>{}} onSave={()=>{}}/>);
 expect(screen.getByText(/não é possível recomendar.*fontes/i)).toBeInTheDocument();
 expect(screen.getAllByText(/chuva indisponível/i).length).toBeGreaterThan(0);
});

it('retira recomendação e pontuação quando as medições de chuva envelhecem',async()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-12T15:00:00Z'));
  try {
    const d=data();d.routes.forEach(route=>route.rain={...route.rain,readingsValidUntil:'2026-11-12T15:00:01Z'});
    render(<RealComparison data={d} onBack={()=>{}} onSave={()=>{}}/>);
    expect(screen.getByText(/menor pontuação relativa nesta consulta/i)).toBeInTheDocument();
    await act(async()=>{vi.advanceTimersByTime(1000);});
    expect(screen.queryByText(/menor pontuação relativa nesta consulta/i)).not.toBeInTheDocument();
    expect(screen.getByText(/medições de chuva venceram/i)).toBeInTheDocument();
    expect(screen.getAllByText(/pontuação indisponível/i)).toHaveLength(2);
  } finally {vi.useRealTimers();}
});

it('mostra diferenças dos valores reais que afetam a pontuação',()=>{
 const d=data();d.routes[0].exposureMeters=0.1;d.routes[1].exposureMeters=0.4;
 d.routes[0].rain={...rain,maxMm:0.11};d.routes[1].rain={...rain,maxMm:0.14};
 render(<RealComparison data={d} onBack={()=>{}} onSave={()=>{}}/>);
 expect(screen.getByText(/0,1 m do trajeto/i)).toBeInTheDocument();expect(screen.getByText(/0,4 m do trajeto/i)).toBeInTheDocument();
 expect(screen.getByText(/0,11 mm/i)).toBeInTheDocument();expect(screen.getByText(/0,14 mm/i)).toBeInTheDocument();
});

it('indica quais fontes estão indisponíveis ou parciais',()=>{
 const d=data(); d.recommendationReason='sources_incomplete';
 d.sources={risk:{status:'available'},history:{alagamento:'partial',inundacao:'unavailable'},rain:{status:'partial'}};
 d.routes.forEach((r,i)=>{r.score=null;r.recommended=false;r.rain={status:i===0?'partial':'available',maxMm:1,stations:[],uncoveredSamples:i===0?3:0,totalSamples:10};});
 render(<RealComparison data={d} onBack={()=>{}} onSave={()=>{}}/>);
 expect(screen.getByText(/histórico de alagamentos.*parcial/i)).toBeInTheDocument();
 expect(screen.getByText(/histórico de inundações.*indisponível/i)).toBeInTheDocument();
 expect(screen.getByText(/chuva.*parcial/i,{selector:'li'})).toBeInTheDocument();
 expect(screen.getByText(/trajeto 1.*3 de 10 amostras/i)).toBeInTheDocument();
});

it('apresenta medições sem ruído de precisão numérica',()=>{
 const d=data();d.routes[0].rain={...rain,maxMm:0.7999999999999998};
 render(<RealComparison data={d} onBack={()=>{}} onSave={()=>{}}/>);
 expect(screen.getByText(/chuva: 0,8 mm/i)).toBeInTheDocument();
 expect(screen.queryByText(/0,7999999999999998/)).not.toBeInTheDocument();
});

it('mantém diferenças significativas quando valores aproximados coincidiriam',()=>{
 const d=data();d.routes[0].rain={...rain,maxMm:0.8};d.routes[1].rain={...rain,maxMm:0.8000000000000002};
 render(<RealComparison data={d} onBack={()=>{}} onSave={()=>{}}/>);
 expect(screen.getByText(/chuva: 0,8 mm/i)).toBeInTheDocument();
 expect(screen.getByText(/chuva: 0,8000000000000002 mm/i)).toBeInTheDocument();
});
