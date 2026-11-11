import React from 'react';
import {render,screen} from '@testing-library/react';
import {it,expect} from 'vitest';
import FloodRouteContext from './FloodRouteContext';

it('explica ocorrências próximas e o cenário fixo de retorno de cinco anos',()=>{
  const context={history:{status:'partial',events:[{id:'1',type:'INUNDACAO',date:'2026-02-01Z',distanceMeters:40,segmentIndex:1}]},areas:{5:{status:'partial',segmentIndexes:[1]}}};
  render(<FloodRouteContext context={context}/>);
  expect(screen.getByText(/inundação.*40 m/i)).toBeInTheDocument();
  expect(screen.getByText(/histórico incompleto/i)).toBeInTheDocument();
  expect(screen.getByText(/5 anos.*1 trecho.*parcial/i)).toBeInTheDocument();
  expect(screen.getByText(/não é um histórico dos últimos 5 anos/i)).toBeInTheDocument();
});
