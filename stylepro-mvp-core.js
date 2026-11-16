/* stylepro's three-pillar state loop. Pure functions; no network, clocks or storage. */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const dayNumber=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?Date.parse(s+'T12:00:00Z')/86400000:NaN;
function valuation(input,asOf){
 if(input.mode==='none')return {mode:'none',amountCents:null,currency:'USD',asOf,source:'owner',note:String(input.note||'').slice(0,240)};
 if(input.mode==='unvalued')return {mode:'unvalued',amountCents:null,currency:'USD',asOf,source:'owner',note:''};
 const amount=String(input.amount??'').trim();
 if(!/^\d{1,7}(\.\d{1,2})?$/.test(amount)||Number(amount)<=0)throw Error('Enter a positive dollar estimate with up to two decimals, or choose Assign none.');
 return {mode:'estimate',amountCents:Math.round(Number(amount)*100),currency:'USD',asOf,source:'owner',note:String(input.note||'').slice(0,240)};
}
function validValue(v){return v?.mode==='estimate'&&v.currency==='USD'&&Number.isSafeInteger(v.amountCents)&&v.amountCents>0;}
function currentValues(items,saved,runs){
 const values={};
 for(const i of items){
  if(!C.owned(i))continue;
  const researched=runs[i.id]?.outputs?.resale;
  if(i.category==='Jewelry'&&!validValue(researched))continue;
  if(Object.hasOwn(saved,i.id))values[i.id]=saved[i.id];
  else if(validValue(researched))values[i.id]=researched;
 }
 return values;
}
function total(items,values){
 const active=items.filter(C.owned),valued=active.filter(i=>validValue(values[i.id])),none=active.filter(i=>values[i.id]?.mode==='none');
 return {totalCents:valued.reduce((n,i)=>n+values[i.id].amountCents,0),valued:valued.length,none:none.length,unvalued:active.length-valued.length-none.length,eligible:active.length};
}
function calendarLocks(events,looks,today,horizon=14){
 const start=dayNumber(today),locks={};
 for(const ev of events){const first=dayNumber(ev.date),last=dayNumber(ev.endDate||ev.date);if(ev.cancelled||ev.status==='cancelled'||!Number.isFinite(first)||!Number.isFinite(last)||last<start||first>=start+horizon)continue;
 const ids=ev.itemIds||looks.find(l=>l.id===ev.lookId)?.pieces||[];
 for(const id of new Set(ids)){(locks[id]??=[]).push({eventId:ev.id||ev.date+'|'+ev.title,date:ev.date,endDate:ev.endDate||ev.date,title:ev.title||'Planned occasion'});}}
 return locks;
}
function parity(a,b){
 if(a?.mode==='none'||b?.mode==='none')return {eligible:false,kind:'open',reason:'Open-value exchange requires both members to agree.'};
 if(!validValue(a)||!validValue(b))return {eligible:false,kind:'unknown',reason:'Both pieces need a current estimate.'};
 // Symmetric band: the larger estimate may be at most 15% above the smaller.
 const eligible=Math.max(a.amountCents,b.amountCents)*100<=Math.min(a.amountCents,b.amountCents)*115;
 return {eligible,kind:eligible?'equal-band':'outside-band',reason:eligible?'Within the 15% estimate band.':'Outside the 15% estimate band.'};
}
function swapEligibility(item,locks,values,availability={}){
 if(!C.owned(item))return {allowed:false,reason:'This piece is not currently available in your wardrobe.'};
 if(locks[item.id]?.length)return {allowed:false,reason:'Protected for '+locks[item.id].map(x=>x.title+' · '+x.date).join('; ')};
 if((availability[item.id]||'keeping')!=='open')return {allowed:false,reason:availability[item.id]==='reserved'?'Reserved by you.':'Keeping this piece. Choose Open to swap before offering it.'};
 if(!validValue(values[item.id])&&values[item.id]?.mode!=='none')return {allowed:false,reason:'Add a resale estimate or explicitly choose Assign none first.'};
 return {allowed:true,reason:values[item.id]?.mode==='none'?'Open value · mutual agreement required':'Ready for an equal-value swap draft'};
}
function run({items,looks,events,values,today,swaps=[],availability={}}){
 const worth=total(items,values),locks=calendarLocks(events,looks,today),drafts=swaps.map(s=>({...s,guard:swapEligibility(items.find(i=>i.id===s.offeredItemId),locks,values,availability)}));
 return {worth,locks,drafts,trace:[{node:'confirmed-inventory',count:worth.eligible},{node:'valuation-rollup',valued:worth.valued},{node:'event-assignments',count:events.length},{node:'calendar-swap-lock',count:Object.keys(locks).length},{node:'swap-eligibility',ready:drafts.filter(d=>d.guard.allowed).length}]};
}
function retailValue(raw){const s=String(raw??'').trim();if(!s)return null;if(!/^\d{1,7}(\.\d{1,2})?$/.test(s)||Number(s)<=0)throw Error('Enter a positive approximate retail value, or leave it pending.');return Math.round(Number(s)*100);}
const api={retailValue,valuation,validValue,currentValues,total,calendarLocks,parity,swapEligibility,run};if(typeof module!=='undefined')module.exports=api;root.StyleProMvpCore=api;
})(typeof window!=='undefined'?window:globalThis);
