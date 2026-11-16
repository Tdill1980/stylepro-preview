/* Deterministic valuation DAG. Evidence is a reviewed snapshot, not live search. */
(function(root){'use strict';
const nodes=[{id:'identify',deps:[]},{id:'evidence',deps:['identify']},{id:'screen',deps:['evidence']},{id:'resale',deps:['screen']},{id:'retail',deps:['screen']},{id:'curation-card',deps:['identify','resale','retail']}];
function execute(graph,input,handlers){const outputs={},trace=[],pending=[...graph];while(pending.length){const ix=pending.findIndex(n=>n.deps.every(d=>Object.hasOwn(outputs,d)));if(ix<0)throw Error('DAG has a cycle or missing dependency');const [node]=pending.splice(ix,1);outputs[node.id]=handlers[node.id](input,outputs);trace.push({node:node.id,dependsOn:node.deps,status:outputs[node.id]===null?'needs-evidence':'complete'});}return {outputs,trace};}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const median=a=>{a=[...a].sort((x,y)=>x-y);const n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;};
function run(item,research,asOf){return execute(nodes,{item,research,asOf},{
 identify:({item})=>({id:item.id,brand:item.brand,category:item.category,size:item.size}),
 evidence:({research})=>research?.listings||[],
 screen:({item,asOf},o)=>o.evidence.filter(c=>{if(!c||typeof c!=='object')return false;const age=(Date.parse(asOf)-Date.parse(c.checkedAt))/86400000;return c.eligible===true&&c.currency==='USD'&&Number.isSafeInteger(c.priceCents)&&c.priceCents>0&&c.priceCents<=100000000&&c.url?.startsWith('https://')&&norm(c.brand)===norm(item.brand)&&c.category===item.category&&Number.isFinite(age)&&age>=0&&age<=90;}).filter((c,i,a)=>a.findIndex(x=>x.url===c.url&&x.priceKind===c.priceKind)===i),
 resale:({item,research,asOf},o)=>{if(item.category==='Jewelry'&&research?.identityConfirmed!==true)return null;const used=o.screen.filter(c=>['asking','closed-listing'].includes(c.priceKind));if(!used.length)return null;const values=used.map(c=>c.priceCents);return {mode:'estimate',source:'researched-comps',amountCents:Math.round(median(values)/100)*100,lowCents:Math.max(100,Math.floor(Math.min(...values)*.65/500)*500),highCents:Math.ceil(Math.max(...values)*1.25/500)*500,currency:'USD',asOf,confidence:'low',provisional:true,compUrls:used.map(x=>x.url),note:research.note,method:'Median displayed comparable price; low = minimum × 0.65, high = maximum × 1.25, rounded outward to $5. Broad planning range, not a statistical confidence interval or sale guarantee.'};},
 retail:(_,o)=>{const list=o.screen.filter(c=>c.priceKind==='retail');return list.length?{amountCents:Math.round(median(list.map(c=>c.priceCents))),label:'Comparable retail · model match needs confirmation',urls:list.map(c=>c.url)}:null;},
 'curation-card':(_,o)=>({item:o.identify,resale:o.resale,retail:o.retail,comps:o.screen})
 });}
function batch(items,research,asOf){return Object.fromEntries(items.map(i=>[i.id,run(i,research[i.id],asOf)]));}
const api={nodes,execute,run,batch};if(typeof module!=='undefined')module.exports=api;root.StyleProValuation=api;
})(typeof window!=='undefined'?window:globalThis);
