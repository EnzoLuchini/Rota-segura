import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import userEvent from '@testing-library/user-event';
import RealRouteDetails from './RealRouteDetails';

afterEach(cleanup);
it('mostra evidências da alternativa selecionada sem atribuir pontuação ao trecho',()=>{
 const route={geometry:{type:'LineString',coordinates:[[-46.65,-23.55],[-46.64,-23.55]]},rain:{status:'partial',stations:[],samples:[{distanceKm:0,stationId:null}],readingsValidUntil:new Date(Date.now()+60000).toISOString()},floodContext:{history:{status:'available',events:[]},areas:{5:{status:'available',segmentIndexes:[0]}}}};
 render(<RealRouteDetails route={route} riskAreas={[]} riskAvailable selectedSegment={0} setSelectedSegment={()=>{}} onBack={()=>{}}/>);
 expect(screen.getByText(/amostra sem cobertura/i)).toBeInTheDocument();
 expect(screen.getByText(/pontuação.*viagem inteira/i)).toBeInTheDocument();
 expect(screen.getByText(/localização exata por trecho/i)).toBeInTheDocument();
});
it('permite escolher outro trecho e não apresenta chuva vencida como atual',async()=>{
 const user=userEvent.setup();
 const choose=vi.fn();
 const route={geometry:{type:'LineString',coordinates:[[-46.65,-23.55],[-46.64,-23.55]]},rain:{status:'available',stations:[],samples:[],readingsValidUntil:'2020-01-01T00:00:00Z'},floodContext:{history:{status:'unavailable',events:[]},areas:{5:{status:'unavailable',segmentIndexes:[]}}}};
 render(<RealRouteDetails route={route} riskAreas={[]} riskAvailable selectedSegment={0} setSelectedSegment={choose} onBack={()=>{}}/>);
 expect(screen.getByText(/medição antiga ou indisponível/i)).toBeInTheDocument();
 await user.selectOptions(screen.getByLabelText(/selecionar trecho/i),'1');
 expect(choose).toHaveBeenCalledWith(1);
});
