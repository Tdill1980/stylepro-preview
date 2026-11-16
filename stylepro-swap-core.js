/* Prototype swap matching. Taste fit times taste fit. No cash, no engagement score. */
(function(root){'use strict';
const SAMPLE_MEMBERS=[{
 id:'sarah',name:'Sarah',prototype:true,city:'Phoenix',sizeRange:'not recorded',blocked:false,
 want:{label:'a neutral mini skirt',attributes:{category:'Bottoms',color_family:'beige',silhouette:'mini'}},
 offer:{label:'a black blazer',attributes:{category:'Jackets & layers',color_family:'black',silhouette:'blazer'}},
 weights:{'category:Jackets & layers':2,'color_family:black':2,'silhouette:blazer':1,'category:Bottoms':1,'color_family:beige':1,'silhouette:mini':1},
 engagement:999
},{
 id:'maya',name:'Maya',prototype:true,city:'Tucson',sizeRange:'not recorded',blocked:false,
 want:{label:'a pink jacket',attributes:{category:'Jackets & layers',color_family:'pink'}},
 offer:{label:'a cream knit',attributes:{category:'Knitwear',color_family:'cream'}},
 weights:{'color_family:pink':2},engagement:50
}];
function tasteFit(weights,attributes){
 const pairs=Object.entries(attributes||{}).filter(([,v])=>v);
 if(!pairs.length) return 0;
 const total=pairs.reduce((sum,[key,value])=>sum+(Number(weights?.[key+':'+value])||0),0);
 return Math.max(0,Math.min(1,(total/pairs.length+2)/4));
}
function matchScore(a,b){return a*b;}
function sizeFits(ownerSize,range){
 if(!ownerSize||!range||range==='not recorded') return true;
 return String(range).toLowerCase().includes(String(ownerSize).toLowerCase());
}
function matches({owner,members=SAMPLE_MEMBERS,city='',size=''}={}){
 const weights=owner?.weights||{};
 return members.filter(m=>m&&!m.blocked).filter(m=>{
  if(city&&m.city&&city.toLowerCase()!==String(m.city).toLowerCase()) return false;
  if(size&&!sizeFits(size,m.sizeRange)) return false;
  return true;
 }).map(m=>({
  memberId:m.id,memberName:m.name,prototype:true,
  want:m.want.label,offer:m.offer.label,
  score:matchScore(tasteFit(weights,m.want.attributes),tasteFit(m.weights,m.offer.attributes))
 })).sort((a,b)=>b.score-a.score||a.memberId.localeCompare(b.memberId));
}
function gentlePrompts(ratings,items,{shown=[]}={}){
 const counts=new Map();
 for(const r of ratings||[]) if(r.type==='item'&&r.stars===1&&r.id) counts.set(r.id,(counts.get(r.id)||0)+1);
 return [...counts].filter(([id,n])=>n>=3&&!shown.includes(id)).map(([id])=>{
  const item=(items||[]).find(i=>i.id===id);
  return {itemId:id,once:true,text:'You\u2019ve scored the '+(item?.name||'piece')+' low three times. Want to see if someone\u2019s looking for it?'};
 });
}
function completeSwap(item,member,date){
 if(!item?.id||!member?.name) throw Error('A swap needs your piece and a member.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')) throw Error('A swap date is required.');
 const d=new Date(date+'T12:00:00Z');
 const month=d.toLocaleString('en-US',{month:'long',timeZone:'UTC'});
 return {itemId:item.id,status:'swapped',provenance:'Swapped with '+member.name+', '+month+' '+d.getUTCFullYear(),sent:false,prototype:true};
}
const api={SAMPLE_MEMBERS,tasteFit,matchScore,matches,gentlePrompts,completeSwap};
if(typeof module!=='undefined') module.exports=api;
root.StyleProSwap=api;
})(typeof window!=='undefined'?window:globalThis);
