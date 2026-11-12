import {describe, expect, it} from 'vitest';
import React from 'react';
import {render,screen} from '@testing-library/react';
import {HistoryCard, formatSourceDate, historyKind, groupHistoryFeatures, mergeHistoryFeatures} from './realMapPresentation';

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
  it('agrupa ícones que se encostam mesmo em lados diferentes da grade e separa ao aproximar',()=>{
    const features=[{id:'a',geometry:{coordinates:[47,0]}},{id:'b',geometry:{coordinates:[49,0]}},{id:'c',geometry:{coordinates:[100,0]}}];
    const overview=groupHistoryFeatures(features,([x,y])=>({x,y}),48);
    expect(overview.map(group=>group.features.map(item=>item.id))).toEqual([['a','b'],['c']]);
    const closeup=groupHistoryFeatures(features,([x,y])=>({x:x*30,y:y*30}),48);
    expect(closeup.map(group=>group.features.length)).toEqual([1,1,1]);
  });

  it('não exibe o mesmo registro duas vezes e preserva a distância da rota',()=>{
    const mapFeatures=[{id:'a',geometry:{coordinates:[10,20]},properties:{dc_tipo_ocorrencia:'ALAGAMENTO',nm_subprefeitura:'Centro'}}];
    const routeEvents=[{id:'a',coordinates:[10,20],type:'ALAGAMENTO',distanceMeters:12,date:'2026-01-01'}];
    const result=mergeHistoryFeatures(mapFeatures,routeEvents);
    expect(result).toHaveLength(1);
    expect(result[0].properties).toMatchObject({nm_subprefeitura:'Centro',distanceMeters:12,dc_tipo_ocorrencia:'ALAGAMENTO'});
  });

  it('evita que centros de grupos se sobreponham após sucessivas junções',()=>{
    const features=[0,45,80,120,170,210].map((x,i)=>({id:String(i),geometry:{coordinates:[x,0]}}));
    const groups=groupHistoryFeatures(features,([x,y])=>({x,y}),52);
    expect(groups.flatMap(group=>group.features)).toHaveLength(features.length);
    for(let i=0;i<groups.length;i++) for(let j=i+1;j<groups.length;j++) {
      expect(Math.abs(groups[i].x-groups[j].x)>=52 || Math.abs(groups[i].y-groups[j].y)>=52).toBe(true);
    }
  });

});

it('preserva ocorrências de camadas diferentes com o mesmo identificador',()=>{
 const map=[{id:'1',kind:'alagamento',geometry:{coordinates:[10,20]},properties:{dc_tipo_ocorrencia:'ALAGAMENTO'}},{id:'1',kind:'inundacao',geometry:{coordinates:[10,20]},properties:{dc_tipo_ocorrencia:'INUNDACAO'}}];
 const routes=[{id:'1',kind:'alagamento',type:'ALAGAMENTO',coordinates:[10,20],distanceMeters:10},{id:'1',kind:'inundacao',type:'INUNDACAO',coordinates:[10,20],distanceMeters:20}];
 const result=mergeHistoryFeatures(map,routes);
 expect(result).toHaveLength(2);expect(result.map(feature=>feature.properties.distanceMeters)).toEqual([10,20]);
});
