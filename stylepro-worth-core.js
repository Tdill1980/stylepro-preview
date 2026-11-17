/* Closet total. Known prices and brand-category estimates stay separate. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const BEFORE={totalCents:636000, valued:5, eligible:197, label:'Five resale-comp medians labeled as closet net worth.'};
const TABLE={
 luxury:{bag:450000,jewelry:80000,shoe:95000,jacket:220000,knit:90000,dress:180000,bottom:70000,top:60000,accessory:40000},
 designer:{bag:28000,jewelry:8000,shoe:14000,jacket:18000,knit:9800,dress:16000,bottom:9000,top:7000,accessory:4500},
 high:{bag:3500,jewelry:1500,shoe:11000,jacket:5500,knit:2999,dress:3999,bottom:3999,top:1999,accessory:1299},
 unknown:{bag:15000,jewelry:2500,shoe:6000,jacket:4500,knit:2500,dress:3500,bottom:3000,top:2000,accessory:1500}
};
const TIER={
 chanel:'luxury',hermes:'luxury','saint laurent':'luxury',ysl:'luxury','louis vuitton':'luxury',prada:'luxury',gucci:'luxury',fendi:'luxury',
 'armani collezioni':'designer','ralph lauren':'designer','lauren ralph lauren':'designer',theory:'designer',aritzia:'designer','free people':'designer','intimately free people':'designer',reformation:'designer','lululemon logo':'designer',coach:'designer','michael kors':'designer','rachel zoe':'designer','whbm forme':'designer','dkny jeans':'designer',
 'h&m':'high','h&m divided':'high','calvin klein':'high',adidas:'high',express:'high','forever 21':'high','american eagle':'high',amazon:'high',shein:'high',loft:'high'
};
function money(cents){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((cents||0)/100);}
function quantity(item){
 const n=Number(item&&item.quantity);
 return Number.isInteger(n)&&n>0&&n<100?n:1;
}
function norm(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function slot(category){
 const c=norm(category);
 if(c.includes('handbag')) return 'bag';
 if(c.includes('jewel')) return 'jewelry';
 if(c.includes('shoe')) return 'shoe';
 if(c.includes('jacket')||c.includes('layer')) return 'jacket';
 if(c.includes('knit')) return 'knit';
 if(c.includes('dress')) return 'dress';
 if(c.includes('bottom')||c.includes('pant')||c.includes('skirt')) return 'bottom';
 if(c.includes('accessor')) return 'accessory';
 return 'top';
}
function tierOf(brand){return TIER[norm(brand)]||'unknown';}
function brandCategoryCents(item){
 const cents=TABLE[tierOf(item.brand)][slot(item.category)];
 return Number.isSafeInteger(cents)&&cents>0?cents:null;
}
function retailCents(item, evidence){
 if(item.category==='Jewelry'&&evidence&&evidence.identityConfirmed!==true) return null;
 const rows=((evidence&&evidence.listings)||[]).filter(row=>row&&row.priceKind==='retail'&&row.eligible===true&&row.currency==='USD'&&Number.isSafeInteger(row.priceCents)&&row.priceCents>0);
 if(!rows.length) return null;
 const prices=rows.map(row=>row.priceCents).sort((a,b)=>a-b);
 return prices[Math.floor((prices.length-1)/2)];
}
function line(item, evidence, edits){
 const qty=quantity(item);
 const base={id:item.id, name:item.name, brand:item.brand||'', category:item.category||'', image:item.image||'', qty};
 const edit=edits&&edits[item.id];
 if(edit&&edit.mode==='none') return {...base, kind:'excluded', cents:0, source:'owner', label:'Left out'};
 if(edit&&Number.isSafeInteger(edit.amountCents)&&edit.amountCents>0) return {...base, kind:'known', cents:edit.amountCents, source:'owner', label:'Known'};
 if(Number.isSafeInteger(item.purchasePriceCents)&&item.purchasePriceCents>0) return {...base, kind:'known', cents:item.purchasePriceCents, source:'purchase', label:'Known'};
 const retail=retailCents(item, evidence);
 if(retail) return {...base, kind:'estimated', cents:retail, source:'reviewed-retail', label:'Estimated'};
 const guess=brandCategoryCents(item);
 return {...base, kind:'estimated', cents:guess, source:'brand-category', label:'Estimated'};
}
function audit(items, evidence, edits){
 const owned=[];
 const seen=new Set();
 for(const item of items||[]){
  if(!C.owned(item)||seen.has(item.id)) continue;
  seen.add(item.id);
  owned.push(item);
 }
 const lines=owned.map(item=>line(item, evidence&&evidence[item.id], edits));
 const sum=(kind)=>lines.filter(row=>row.kind===kind).reduce((n,row)=>n+row.cents*row.qty,0);
 const count=(kind)=>lines.filter(row=>row.kind===kind).length;
 const knownCents=sum('known'), estimatedCents=sum('estimated');
 return {
  currency:'USD',
  eligible:owned.length,
  known:count('known'),
  estimated:count('estimated'),
  missing:count('missing'),
  excluded:count('excluded'),
  knownCents, estimatedCents,
  totalCents:knownCents+estimatedCents,
  lines,
  before:BEFORE,
  why:'The old $6,360 added five resale medians. This total prices every owned piece. A price you enter is known. Everything else is an estimate: a reviewed retail snapshot when one exists, otherwise a midpoint for that brand and category. A number in a piece name is not its price. Estimates are not receipts.'
 };
}
const api={BEFORE, TABLE, money, quantity, tierOf, slot, brandCategoryCents, retailCents, audit};
if(typeof module!=='undefined') module.exports=api;
root.StyleProWorthCore=api;
})(typeof window!=='undefined'?window:globalThis);
