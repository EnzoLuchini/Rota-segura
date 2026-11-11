import {useEffect} from 'react';
import {useMap} from 'react-leaflet';

export default function MapResizeObserver(){
  const map=useMap();
  useEffect(()=>{
    if(typeof ResizeObserver==='undefined')return;
    let frame;
    const observer=new ResizeObserver(()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>map.invalidateSize({animate:false,pan:false}));
    });
    observer.observe(map.getContainer());
    return()=>{observer.disconnect();cancelAnimationFrame(frame);};
  },[map]);
  return null;
}
