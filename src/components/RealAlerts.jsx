import React,{useEffect,useState} from 'react';
import {ArrowLeft,ShieldAlert} from 'lucide-react';

const date=value=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value));
const severity=value=>({Extreme:'Extrema',Severe:'Severa',Moderate:'Moderada',Minor:'Baixa',Unknown:'Não informada'})[value] || value;

export default function RealAlerts({onBack}){
  const [data,setData]=useState(null),[error,setError]=useState(''),[selected,setSelected]=useState(null),[clock,setClock]=useState(Date.now()),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true,controller;
    async function load(){
      controller=new AbortController();
      try{const response=await fetch('/api/alerts',{signal:controller.signal});if(!response.ok)throw Error();const value=await response.json();if(!Array.isArray(value.alerts) || !['available','partial'].includes(value.status))throw Error();if(active){setData(value);setError('');setClock(Date.now());}}
      catch(e){if(active && e.name!=='AbortError'){setData(null);setSelected(null);setError('Avisos oficiais indisponíveis no momento. Tente novamente.');}}
    }
    setError('');load();const refresh=setInterval(load,120000),tick=setInterval(()=>setClock(Date.now()),30000);
    return()=>{active=false;clearInterval(refresh);clearInterval(tick);controller?.abort();};
  },[attempt]);
  const current=(data?.alerts || []).filter(item=>Date.parse(item.start)<=clock && clock<Date.parse(item.end));
  const detail=current.find(item=>item.id===selected);
  return <>
    <button className="back" onClick={detail?()=>setSelected(null):onBack}><ArrowLeft size={18}/> {detail?'Voltar aos avisos':'Voltar'}</button>
    <span className="overline">Informações oficiais</span><h1>{detail?'Detalhes do aviso':'Avisos meteorológicos'}</h1>
    <p className="intro">Avisos do INMET para áreas que intersectam o município de São Paulo. Não confirmam alagamento em uma via.</p>
    {error && <p role="alert" className="selection-warning">{error}</p>}
    {error && <button className="secondary" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button>}
    {!data && !error && <p role="status">Consultando avisos oficiais…</p>}
    {data && <>
      <p className="footnote">Consulta em {date(data.checkedAt)} (horário de Brasília). A cobertura do feed não foi confirmada; consulte também o INMET.</p>
      {data.status==='partial' && <p className="selection-warning" role="status">Consulta parcial: alguns avisos não puderam ser verificados ou faltam versões anteriores.</p>}
      {detail ? <article className="local-card"><strong>{detail.headline}</strong><p>Severidade: {severity(detail.severity)}</p><p>Início: {date(detail.start)} · Fim: {date(detail.end)} (horário de Brasília)</p><p>{detail.description}</p><p>Fonte: INMET</p><a href={detail.url} target="_blank" rel="noopener noreferrer">Abrir aviso oficial</a></article> : <>
        {current.length===0 ? <div className="empty-state">Nenhum aviso vigente encontrado entre os itens consultados. Isso não significa ausência de risco ou de outros avisos.</div> : current.map((item,i)=><button className="alert-card" key={`${item.id}-${i}`} onClick={()=>setSelected(item.id)}><span className="alert-icon"><ShieldAlert size={20}/></span><span><strong>{item.headline}</strong><small>INMET · {severity(item.severity)} · até {date(item.end)}</small></span></button>)}
      </>}
      <p className="footnote">Os avisos são meteorológicos, podem abranger uma região maior e não substituem orientações da Defesa Civil. Não há notificações automáticas.</p>
    </>}
  </>;
}
