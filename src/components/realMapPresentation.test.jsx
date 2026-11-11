import {describe, expect, it} from 'vitest';
import React from 'react';
import {render,screen} from '@testing-library/react';
import {HistoryCard, formatSourceDate, historyKind, groupHistoryFeatures} from './realMapPresentation';

describe('apresentação de dados históricos no mapa real',()=>{
  it('identifica cada tipo e formata datas sem mudar o dia',()=>{
    expect(historyKind('INUNDACAO')).toBe('inundação');
    expect(historyKind('ALAGAMENTO')).toBe('alagamento');
    expect(formatSourceDate('2026-08-10Z')).toBe('10/08/2026');
    expect(formatSourceDate(null)).toBe('Não informada');
  });

  it('mostra fonte, período histórico e texto seguro no cartão',()=>{
    const {container}=render(<HistoryCard type="INUNDACAO" date="2026-08-10Z" loadedAt="2026-10-06Z" location="<img src=x>" distanceMeters={42}/>);
    expect(screen.getByText('Inundação registrada')).toBeInTheDocument();
    expect(container).toHaveTextContent('10/08/2026');
    expect(container).toHaveTextContent('Histórico');
    expect(container).toHaveTextContent('42 m da rota');
    expect(container).toHaveTextContent('<img src=x>');
    expect(container.querySelector('img')).toBeNull();
  });

  it('agrupa marcadores próximos preservando cada registro e sua posição',()=>{
    const features=[{id:'a',geometry:{coordinates:[10,10]}},{id:'b',geometry:{coordinates:[11,11]}},{id:'c',geometry:{coordinates:[200,200]}}];
    const groups=groupHistoryFeatures(features,([x,y])=>({x,y}),48);
    expect(groups.map(group=>group.features.map(item=>item.id))).toEqual([['a','b'],['c']]);
    expect(groups[0].features[1].geometry.coordinates).toEqual([11,11]);
  });
});
