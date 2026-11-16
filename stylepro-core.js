/* Style Pro: pure, inspectable recommendation and wear-history helpers. */
(function(root){
'use strict';
const role=i=>i.category==='Dresses'?'dress':/Bottoms|Pants|Skirts|skirts/.test(i.category)?'bottom':i.category==='Jackets & layers'?'layer':i.category==='Handbags'?'bag':i.category==='Jewelry'?'jewelry':i.category==='Accessories'?'accessory':i.category==='Shoes'?'shoe':'top';
const signature=ids=>[...new Set(ids)].sort().join('|');
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const context=q=>/black tie|gala|wedding|gym|workout/i.test(q)?'unsupported':/camera|film|sema|video/i.test(q)?'camera':/dinner|date|party|evening|restaurant/i.test(q)?'dinner':/client|work|office|meeting|business|interview/i.test(q)?'work':/travel|weekend|trip|flight/i.test(q)?'weekend':/errand|coffee|casual|everyday/i.test(q)?'everyday':'';
const daysBetween=(a,b)=>Math.round((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);
const owned=i=>i&&!/unconfirmed|considered|skipped|archived|sold|for_sale|storage/i.test(i.status||'');
function history(look,items,wears,date){
 const sig=signature(look.pieces),core=signature(look.pieces.filter(id=>['top','bottom','dress','layer'].includes(role(items.find(i=>i.id===id)||{}))));
 const prior=wears.filter(w=>w.date<=date),exact=prior.filter(w=>w.signature===sig).sort((a,b)=>b.date.localeCompare(a.date)),similar=prior.filter(w=>w.core===core&&w.signature!==sig).sort((a,b)=>b.date.localeCompare(a.date));
 return {count:exact.length,last:exact[0]?.date||null,days:exact.length?daysBetween(date,exact[0].date):null,similar:similar[0]?.date||null,core,signature:sig};
}
function facts(look,items,wears,date){
 const pieces=look.pieces.map(id=>items.find(i=>i.id===id)).filter(Boolean),h=history(look,items,wears,date);
 return {id:look.id,name:look.title,items:pieces.map(i=>({id:i.id,name:i.name,category:i.category})),reason:look.description,footwear:look.footwear||'Choose and confirm your shoes.',hasShoes:pieces.some(i=>role(i)==='shoe'),history:h,visual:look.realPhoto?'Your original photo':look.type==='tryon'?'Generated preview · approximate':'Closet collage · styling preview'};
}
function voice(f,p){const starts={easy:'A little help getting dressed. ',straight:'The edit: ',funny:'Your closet has plans. ',carrie:'Today’s wardrobe story: ',minimal:''};return (starts[p]??'')+f.reason;}
function run({items,looks,wears=[],feedback={},date,q='',direction='',anchor='',avoidRepeats=true,seed=0,limit=3,preferences={}}){
 const ctx=context(q),trace=[{node:'request',context:ctx||'open',date,anchor},{node:'closet',records:items.length}];
 let pool=looks.filter(l=>!l.neural&&l.type==='assembly'&&l.pieces.every(id=>owned(items.find(i=>i.id===id))));
 pool=pool.filter(l=>{const roles=l.pieces.map(id=>role(items.find(i=>i.id===id)));return roles.includes('dress')||(roles.includes('top')&&roles.includes('bottom'));});
 if(ctx==='unsupported')pool=[];else if(ctx)pool=pool.filter(l=>l.occasions.includes(ctx));
 const brand=/\bwpw\b|we\s*print\s*wraps/i.test(q)?/\bwpw\b|we\s*print\s*wraps/i:/wrap\s*tv/i.test(q)?/wrap\s*tv/i:/ink\s*(?:&|and)\s*edge/i.test(q)?/ink\s*(?:&|and)\s*edge/i:null;
 if(/designpro/i.test(q))pool=pool.filter(l=>!l.pieces.some(id=>/wpw|we\s*print\s*wraps|print my ride|wrap\s*tv|ink\s*(?:&|and)\s*edge/i.test((items.find(i=>i.id===id)?.name)||'')));
 if(brand)pool=pool.filter(l=>brand.test(l.title)||l.pieces.some(id=>{const i=items.find(i=>i.id===id);return brand.test(i.name+' '+(i.brand||''));}));
 if(direction)pool=pool.filter(l=>(l.personas||[]).includes(direction));
 if(anchor)pool=pool.filter(l=>l.pieces.includes(anchor));
 if(/comfortable shoes|flats only|sneakers only/i.test(q))pool=pool.filter(l=>l.pieces.some(id=>role(items.find(i=>i.id===id))==='shoe'));
 if(preferences.avoidHeels)pool=pool.filter(l=>!l.pieces.some(id=>{const i=items.find(i=>i.id===id);return role(i)==='shoe'&&/heel|stiletto|pump/i.test(i.name);}));
 if(preferences.excludedItemIds?.length)pool=pool.filter(l=>!l.pieces.some(id=>preferences.excludedItemIds.includes(id)));
 if(preferences.excludedSignatures?.length)pool=pool.filter(l=>!preferences.excludedSignatures.includes(signature(l.pieces)));
 trace.push({node:'preferences',directions:preferences.directions||[],avoidHeels:!!preferences.avoidHeels},{node:'constraints',eligible:pool.length});
 const ranked=pool.map(l=>{const h=history(l,items,wears,date),rating=feedback[l.id]?.value;let score=hash(date+'|'+seed+'|'+l.id)%1000/1000;
 const preferred=preferences.directions?.length?preferences.directions:['Boho'];
 if((l.personas||[]).some(p=>preferred.includes(p)))score += preferences.directions?.length ? 1.25 : .35;
 score+=Math.min(3,l.pieces.filter(id=>['bag','jewelry','accessory'].includes(role(items.find(i=>i.id===id)))).length)*.4;
 if(l.pieces.some(id=>role(items.find(i=>i.id===id))==='shoe'))score+=.3;
 if(rating==='love')score+=.4;if(rating==='pass')score-=.8;
 if(l.pieces.some(id=>{const i=items.find(x=>x.id===id);const n=(i?.name||'').toLowerCase();return n.includes('beige mini skirt')||n.includes('khaki')||(/wrinkl/.test((i?.name||'')+' '+(i?.description||'').toLowerCase())&&n.includes('skirt'));}))score-=4;
 if((preferences.boostItemIds||[]).some(id=>l.pieces.includes(id)))score+=2;
 if(h.days!==null&&h.days<14)score-=3;if(h.similar&&daysBetween(date,h.similar)<14)score-=1;
 return {look:l,history:h,score};}).filter(x=>!avoidRepeats||x.history.days===null||x.history.days>=14).sort((a,b)=>b.score-a.score||a.look.id.localeCompare(b.look.id));
 trace.push({node:'ranking',candidates:ranked.length});
 const selected=[],cores=new Set(),sigs=new Set();
 for(const x of ranked){if(cores.has(x.history.core)||sigs.has(x.history.signature))continue;selected.push(x.look);cores.add(x.history.core);sigs.add(x.history.signature);if(selected.length>=limit)break;}
 trace.push({node:'diversity',selected:selected.map(l=>l.id)},{node:'facts',itemIds:selected.flatMap(l=>l.pieces)});
 return {looks:selected,facts:selected.map(l=>facts(l,items,wears,date)),trace,context:ctx};
}
function logWear(wears,look,items,date,event=''){
 const h=history(look,items,wears,date);if(wears.some(w=>w.date===date&&w.signature===h.signature))return {wears,added:false};
 return {added:true,wears:[...wears,{id:date+'-'+hash(h.signature),lookId:look.id,date,event,signature:h.signature,core:h.core,itemIds:[...look.pieces],outcome:''}]};
}
const api={role,signature,hash,context,daysBetween,owned,history,facts,voice,run,logWear};if(typeof module!=='undefined')module.exports=api;root.StyleProCore=api;
})(typeof window!=='undefined'?window:globalThis);
