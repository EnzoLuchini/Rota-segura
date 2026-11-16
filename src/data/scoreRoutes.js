const factors=[['exposureMeters',0.5],['historyCount',0.3],['rainMm',0.2]];

export function scoreRoutes(items) {
  if(!items.length)return {scores:[],recommended:-1,reason:'no_routes',sourcesUsed:[]};
  const used=factors.filter(([key])=>items.every(item=>Number.isFinite(item[key]) && item[key]>=0));
  const sourcesUsed=used.map(([key])=>key);
  if(!used.length)return {scores:items.map(()=>null),recommended:-1,reason:'sources_incomplete',sourcesUsed};
  if(items.length===1)return {scores:[0],recommended:0,reason:'single_route',sourcesUsed};
  const total=used.reduce((sum,[,weight])=>sum+weight,0);
  const bounds=used.map(([key])=>[Math.min(...items.map(item=>item[key])),Math.max(...items.map(item=>item[key]))]);
  const scores=items.map(item=>100*used.reduce((sum,[key,weight],i)=>sum+(weight/total)*(bounds[i][1]===bounds[i][0]?0:(item[key]-bounds[i][0])/(bounds[i][1]-bounds[i][0])),0));
  const order=scores.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value);
  const tied=order.filter(item=>item.value-order[0].value<1);
  if(tied.length>1){
    if(tied.every(item=>Number.isFinite(items[item.index].duration) && items[item.index].duration>=0)){
      tied.sort((a,b)=>items[a.index].duration-items[b.index].duration || a.index-b.index);
      return {scores,recommended:tied[0].index,reason:items[tied[0].index].duration===items[tied[1].index].duration?'equal_tie':'fastest_tie',sourcesUsed};
    }
    return {scores,recommended:-1,reason:'score_tie',sourcesUsed};
  }
  return {scores,recommended:order[0].index,reason:'lowest_combined_score',sourcesUsed};
}
