import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import RealCityPanel from './RealCityPanel';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('distingue chuva, avisos e consulta direta de ocorrências atuais',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({status:'available',checkedAt:new Date().toISOString(),alerts:[]})}));
 render(<RealCityPanel mode="now" onBack={()=>{}} onModeChange={()=>{}} rain={{status:'unavailable',stations:[]}} history={{}}/>);
 expect(screen.getByText(/chuva observada indisponível/i)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:/CGE/i})).toHaveAttribute('href','https://www.cgesp.org/v3/alagamentos.jsp');
 expect(await screen.findByText(/nenhum aviso vigente/i)).toBeInTheDocument();
});
it('identifica falha de uma fonte histórica sem afirmar ausência de risco',()=>{
 render(<RealCityPanel mode="history" onBack={()=>{}} onModeChange={()=>{}} rain={{}} history={{features:[],sourceStates:{alagamento:'available',inundacao:'unavailable'}}}/>);
 expect(screen.getByText(/inundação: indisponível/i)).toBeInTheDocument();
 expect(screen.getByText(/não representa alagamento atual/i)).toBeInTheDocument();
});

it('mostra dados atuais e históricos sem seletor de período',()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({status:'available',checkedAt:new Date().toISOString(),alerts:[]})}));
 render(<RealCityPanel onBack={()=>{}} rain={{status:'unavailable'}} history={{features:[],sourceStates:{alagamento:'available',inundacao:'unavailable'}}}/>);
 expect(screen.getByText(/chuva observada indisponível/i)).toBeInTheDocument();
 expect(screen.getByText(/não representa alagamento atual/i)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Agora'})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Histórico'})).not.toBeInTheDocument();
});
