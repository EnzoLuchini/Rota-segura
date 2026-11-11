import React, {useState} from 'react';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it} from 'vitest';
import MapLayerControls from './MapLayerControls';

it('permite mostrar e esconder cada camada independentemente',async()=>{
  const user=userEvent.setup();
  function Example(){const [water,setWater]=useState(true),[risk,setRisk]=useState(true);return <><MapLayerControls water={water} onWaterChange={setWater} risk={risk} onRiskChange={setRisk} riskAvailable/><output>{`${water}/${risk}`}</output></>;}
  render(<Example/>);
  await user.click(screen.getByText('Camadas do mapa'));
  await user.click(screen.getByRole('checkbox',{name:'Rios e córregos'}));
  expect(screen.getByText('false/true')).toBeInTheDocument();
  await user.click(screen.getByRole('checkbox',{name:'Áreas de risco mapeadas'}));
  expect(screen.getByText('false/false')).toBeInTheDocument();
  expect(screen.getByText(/ocultar.*não altera a comparação/i)).toBeInTheDocument();
});

it('informa que áreas de risco aparecem somente depois da consulta',async()=>{
  const user=userEvent.setup();
  render(<MapLayerControls water onWaterChange={()=>{}} risk onRiskChange={()=>{}} riskAvailable={false}/>);
  await user.click(screen.getByText('Camadas do mapa'));
  expect(screen.getByRole('checkbox',{name:'Áreas de risco mapeadas'})).toBeDisabled();
  expect(screen.getByText(/disponíveis após consultar rotas/i)).toBeInTheDocument();
});

it('permite ativar registros históricos e explica que não são avisos atuais',async()=>{
  const user=userEvent.setup();
  function Example(){const [history,setHistory]=useState(false);return <><MapLayerControls history={history} onHistoryChange={setHistory}/><output>{String(history)}</output></>;}
  render(<Example/>);
  await user.click(screen.getByText('Camadas do mapa'));
  await user.click(screen.getByRole('checkbox',{name:'Registros históricos de alagamento e inundação'}));
  expect(screen.getByText('true')).toBeInTheDocument();
  expect(screen.getByText(/não indicam alagamentos atuais/i)).toBeInTheDocument();
});

it('oferece apenas mostrar ou ocultar a mancha modelada de retorno de 5 anos',async()=>{
  const user=userEvent.setup();
  function Example(){const [enabled,setEnabled]=useState(false);return <><MapLayerControls floodPeriod={enabled ? 5 : 0} onFloodPeriodChange={value=>setEnabled(value===5)}/><output>{String(enabled)}</output></>;}
  render(<Example/>);
  await user.click(screen.getByText('Camadas do mapa'));
  await user.click(screen.getByRole('checkbox',{name:/manchas de inundação potencial/i}));
  expect(screen.getByText('true')).toBeInTheDocument();
  expect(screen.getByText(/cenário modelado de retorno de 5 anos/i)).toBeInTheDocument();
  expect(screen.queryByRole('combobox',{name:/manchas/i})).not.toBeInTheDocument();
});
