import {describe,expect,it,vi} from 'vitest';
import {createMapRequestCache} from './mapRequestCache';

describe('cache temporário das camadas',()=>{
  it('reutiliza uma consulta e solicita novamente após vencer',async()=>{
    let now=0;
    const cache=createMapRequestCache({now:()=>now,ttl:100});
    const load=vi.fn(async()=>({features:[1],truncated:false}));
    expect(await cache.get('/camada',load)).toEqual({features:[1],truncated:false});
    await cache.get('/camada',load);
    expect(load).toHaveBeenCalledTimes(1);
    now=101;
    await cache.get('/camada',load);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('compartilha chamadas simultâneas e não guarda falhas',async()=>{
    const cache=createMapRequestCache();
    let finish;
    const load=vi.fn(()=>new Promise(resolve=>{finish=resolve;}));
    const a=cache.get('x',load),b=cache.get('x',load);
    finish('ok');
    expect(await Promise.all([a,b])).toEqual(['ok','ok']);
    expect(load).toHaveBeenCalledTimes(1);
    const fail=vi.fn().mockRejectedValue(new Error('indisponível'));
    await expect(cache.get('erro',fail)).rejects.toThrow();
    await expect(cache.get('erro',fail)).rejects.toThrow();
    expect(fail).toHaveBeenCalledTimes(2);
  });
});
