/* Always-with-me stylist. One persona, one wear log, follow-up turns. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const DAYS={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
function shift(iso,days){
 const d=new Date(iso+'T12:00:00Z');
 d.setUTCDate(d.getUTCDate()+days);
 return d.toISOString().slice(0,10);
}
function lastWeekday(today,name){
 const target=DAYS[String(name||'').toLowerCase()];
 if(target===undefined) return null;
 const current=new Date(today+'T12:00:00Z').getUTCDay();
 let delta=(current-target+7)%7;
 if(delta===0) delta=7;
 return shift(today,-delta);
}
function when(text,today){
 const q=String(text||'').toLowerCase();
 const named=/last\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/.exec(q);
 if(named) return lastWeekday(today,named[1]);
 if(/\byesterday\b/.test(q)) return shift(today,-1);
 if(/\btoday\b/.test(q)) return today;
 return null;
}
function personaOf(persona){
 if(persona&&persona.name) return persona;
 return {name:'Lane',initial:'L',line:'Polished and precise. She edits before she adds.',tone:'polished'};
}
function ownedLooks(items,looks){
 const byId=new Map((items||[]).map(item=>[item.id,item]));
 return (looks||[]).filter(look=>!look.neural&&(look.pieces||[]).length&&(look.pieces||[]).every(id=>{
  const item=byId.get(id);
  return item&&C.owned(item)&&item.id!=='171';
 }));
}
function lookNamed(text,items,looks){
 const q=String(text||'').toLowerCase();
 return ownedLooks(items,looks).find(look=>q.includes(String(look.title||'').toLowerCase()))||null;
}
function pieceNames(ids,items){
 const byId=new Map((items||[]).map(item=>[item.id,item]));
 return ids.map(id=>byId.get(id)?.name).filter(Boolean);
}
function extras(wornIds,items,looks,roleName){
 const worn=new Set(wornIds||[]);
 const byId=new Map((items||[]).map(item=>[item.id,item]));
 const rank={shoe:0,layer:1,bag:2,jewelry:3,accessory:4,top:5,bottom:6,dress:7};
 const rows=[];
 for(const look of ownedLooks(items,looks)){
  if(!(look.pieces||[]).some(id=>worn.has(id))) continue;
  for(const id of look.pieces){
   if(worn.has(id)) continue;
   const item=byId.get(id);
   if(!item) continue;
   const role=C.role(item);
   if(roleName&&role!==roleName) continue;
   rows.push({item,look,role});
  }
 }
 rows.sort((a,b)=>(rank[a.role]??9)-(rank[b.role]??9)||a.item.id.localeCompare(b.item.id)||a.look.id.localeCompare(b.look.id));
 const seen=new Set();
 return rows.filter(row=>seen.has(row.item.id)?false:seen.add(row.item.id));
}
function quietNudge(wears,items,today){
 const start=shift(today,-6);
 const counts=new Map();
 for(const wear of wears||[]){
  if(wear.date<start||wear.date>today) continue;
  for(const id of wear.itemIds||[]) counts.set(id,(counts.get(id)||0)+1);
 }
 const hit=[...counts.entries()].filter(([,count])=>count>=3).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
 if(!hit) return '';
 const item=(items||[]).find(row=>row.id===hit[0]);
 if(!item) return '';
 return `You wore the ${item.name} ${hit[1]} times this week. Want to switch it up?`;
}
function describeWear(wear,items){
 const names=pieceNames(wear.itemIds||[],items);
 const event=wear.event?'Event: '+wear.event+'.':'No event is recorded.';
 const photo=wear.photo?'A photo is saved with this wear.':'No photo is saved with this wear.';
 return `${names.join(', ')||'No pieces recorded'}. ${event} ${photo}`;
}
function recall(text,input,memory){
 const name=personaOf(input.persona).name;
 const date=when(text,input.today)||memory.focus?.date;
 if(!date) return null;
 const dayWears=(input.wears||[]).filter(wear=>wear.date===date);
 if(!dayWears.length){
  return {match:false,short:`${name}: Nothing is logged for ${date}.`,more:'A plan or a saved look is not a wear. Say you are wearing a look today and I will log that one.',focus:null};
 }
 let wear=dayWears.length===1?dayWears[0]:dayWears.find(row=>String(text||'').toLowerCase().includes(String(row.lookId))||pieceNames([row.lookId],[]).length);
 if(dayWears.length>1&&!memory.focus){
  const titles=dayWears.map(row=>row.title||row.lookId).join(', ');
  return {match:true,short:`${name}: ${date} has ${dayWears.length} logged wears: ${titles}. Which one?`,more:'',focus:null,choices:dayWears.map(row=>row.lookId)};
 }
 wear=wear||memory.focus&&dayWears.find(row=>row.lookId===memory.focus.lookId)||dayWears[0];
 const role=/shoe/.test(text)?'shoe':/bag/.test(text)?'bag':/warm|layer|jacket/.test(text)?'layer':null;
 const extra=extras(wear.itemIds,input.items,input.looks,role)[0];
 const title=wear.title||(input.looks||[]).find(look=>look.id===wear.lookId)?.title||'that logged look';
 const short=extra?`${name}: ${date} you wore ${title}. It can go with your ${extra.item.name}.`:`${name}: ${date} you wore ${title}. No other owned piece is saved with it.`;
 const more=`${describeWear(wear,input.items)} ${extra?`From ${extra.look.title}.`:''}`.trim();
 return {match:true,short,more,focus:{date,lookId:wear.lookId,title,itemIds:wear.itemIds||[]}};
}
function turn(input){
 const text=String(input.text||'');
 const q=text.toLowerCase();
 const memory=input.memory||{};
 const who=personaOf(input.persona);
 if(/tell me more/.test(q)){
  return {match:true,short:memory.more||'There is no longer answer yet.',more:memory.more||'',memory,log:null};
 }
 if(/undo that wear/.test(q)&&memory.lastLogId){
  return {match:true,short:`${who.name}: I removed that wear.`,more:'',undo:memory.lastLogId,memory:{...memory,lastLogId:null,more:''},log:null};
 }
 if(/i(?:'| a)?m wearing|i am wearing/.test(q)){
  const look=lookNamed(q,input.items,input.looks)||input.contextLook;
  if(!look) return {match:false,short:`${who.name}: Say which look. Nothing was logged.`,more:'',memory,log:null};
  const date=when(q,input.today)||input.today;
  const names=pieceNames(look.pieces||[],input.items);
  const more=`${names.join(', ')}. No photo is saved with this wear. No event is recorded.`;
  return {match:true,short:`${who.name}: Logged ${look.title} for ${date}.`,more,log:{lookId:look.id,date,event:'',source:'voice',title:look.title,itemIds:look.pieces||[]},memory:{...memory,more,focus:{date,lookId:look.id,title:look.title,itemIds:look.pieces||[]}}};
 }
 const asked=/wore|go with|what about|last\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|yesterday/.test(q);
 if(asked||(memory.focus&&/shoe|bag|warm|layer|jacket/.test(q))){
  const result=recall(text,input,memory);
  if(result) return {match:result.match,short:result.short,more:result.more,log:null,memory:{...memory,more:result.more,focus:result.focus||memory.focus}};
 }
 if(input.vanity&&root.StyleProAskCore&&/france|lipstick|perfume|shade|guerlain/.test(q)){
  const found=root.StyleProAskCore.search(text,input.vanity);
  const hit=found.matches&&found.matches[0];
  if(hit) return {match:true,short:`${who.name}: ${hit.brand||''} ${hit.shadeName||hit.name}.`.replace(/\s+/g,' ').trim(),more:hit.notes||'',memory:{...memory,more:hit.notes||''},log:null};
 }
 const nudge=quietNudge(input.wears,input.items,input.today);
 return {match:false,short:`${who.name}: Ask what you wore, or tell me you are wearing a look.${nudge?' '+nudge:''}`,more:nudge,memory,log:null};
}
const api={shift,lastWeekday,when,personaOf,extras,quietNudge,turn};
if(typeof module!=='undefined') module.exports=api;
root.StyleProCompanionCore=api;
})(typeof window!=='undefined'?window:globalThis);
