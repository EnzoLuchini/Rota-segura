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
