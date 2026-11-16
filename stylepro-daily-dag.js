/* Calendar → real closet → designer rules → daily edit. Pure, offline DAG. */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const K=typeof module!=='undefined'?require('./stylepro-calendar-core.js'):root.StyleProCalendarCore;
const V=typeof module!=='undefined'?require('./stylepro-valuation-core.js'):root.StyleProValuation;
const nodes=[
 {id:'calendar-intake',deps:[]}, {id:'owned-closet',deps:[]},
 {id:'occasion-briefs',deps:['calendar-intake']},
 {id:'designer-brain',deps:['occasion-briefs','owned-closet']},
 {id:'facts-and-value',deps:['designer-brain','owned-closet']},
 {id:'daily-cards',deps:['calendar-intake','facts-and-value']}
];
function localParts(value,timeZone){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
function outlookEvents(events,timeZone='America/Phoenix'){
 return events.filter(e=>!e.isCancelled&&!e.cancelled).map(e=>{
  const convert=t=>{if(!t?.dateTime)return null;const zone=t.timeZone||'UTC';if(zone!=='UTC'&&!/[Z]|[+-]\d\d:\d\d$/.test(t.dateTime))throw Error('Normalize the provider timezone to UTC before importing.');return localParts(t.dateTime.replace(/\.\d{4,}/,'.000')+(/Z|[+-]\d\d:\d\d$/.test(t.dateTime)?'':'Z'),timeZone);};
  const a=convert(e.start),b=convert(e.end);if(!a||!b)return null;
  const title=String(e.subject||e.title||'Untitled event');
  return {id:e.id||K.key({date:a.date,startTime:a.time,title}),title,date:a.date,endDate:b.date,startTime:a.time,endTime:b.time,timeZone,kind:K.classify(title),status:/tentative/i.test(title)||e.showAs==='tentative'?'tentative':'planned',source:'outlook-snapshot'};
 }).filter(Boolean);
}
function run({items,looks,events=[],date,days=3,wears=[],feedback={},values={},query='',avoidRepeats=true,seed=0,preferences={}}){
 if(!K.validDate(date))throw Error('The daily pipeline requires an explicit local date.');
 const result=V.execute(nodes,{items,looks,events,date,days,wears,feedback,values,query,avoidRepeats,seed,preferences},{
  'calendar-intake':i=>[...new Map(i.events.filter(e=>!e.cancelled&&!e.isCancelled&&K.validDate(e.date)).map(e=>[K.key(e),{...e,kind:e.kind||K.classify(e.title)}])).values()].sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime||'').localeCompare(b.startTime||'')),
  'owned-closet':i=>[...new Map(i.items.filter(C.owned).map(x=>[x.id,x])).values()],
  'occasion-briefs':(i,o)=>Array.from({length:Math.max(1,Math.min(7,i.days))},(_,offset)=>{
   const d=new Date(i.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);const day=d.toISOString().slice(0,10);
   const es=o['calendar-intake'].filter(e=>e.date<=day&&(e.endDate||e.date)>=day),occasions=es.filter(e=>e.kind!=='reminder');
   return {date:day,events:es,briefs:occasions.map(e=>({event:e,query:K.stylingQuery(e)+(e.kind==='camera'?' '+e.title:'')}))};
  }),
  'designer-brain':(i,o)=>o['occasion-briefs'].map(day=>({...day,edits:day.briefs.map(b=>{
   const ranked=C.run({items:o['owned-closet'],looks:i.looks,date:day.date,q:b.query,wears:i.wears,feedback:i.feedback,preferences:i.preferences,avoidRepeats:i.avoidRepeats,seed:i.seed,limit:3});
   const assigned=i.looks.find(l=>l.id===b.event.lookId);
   if(assigned&&C.run({items:o['owned-closet'],looks:[assigned],date:day.date,q:b.query,preferences:i.preferences,avoidRepeats:false}).looks.length){const core=C.history(assigned,o['owned-closet'],i.wears,day.date).core;ranked.looks=[assigned,...ranked.looks.filter(l=>C.history(l,o['owned-closet'],i.wears,day.date).core!==core)].slice(0,3);}
   return {...b,looks:ranked.looks,reasoning:ranked.trace,gap:ranked.looks.length?null:{reason:b.event.kind==='workout'?'No verified activewear combination in your curated closet yet.':'No eligible curated combination for this occasion yet.'}};
  }),fallback:day.briefs.length?null:C.run({items:o['owned-closet'],looks:i.looks,date:day.date,q:i.query||'Everyday',wears:i.wears,feedback:i.feedback,preferences:i.preferences,avoidRepeats:i.avoidRepeats,seed:i.seed,limit:3})})),
  'facts-and-value':(i,o)=>o['designer-brain'].map(day=>({...day,edits:day.edits.map(edit=>({...edit,cards:edit.looks.map(l=>{
   const ids=[...new Set(l.pieces)],known=ids.filter(id=>Number.isSafeInteger(i.values[id]?.amountCents)&&i.values[id].amountCents>=0&&i.values[id].mode==='estimate'&&i.values[id].currency==='USD');
   return {look:l,facts:C.facts(l,o['owned-closet'],i.wears,day.date),value:{amountCents:known.reduce((sum,id)=>sum+i.values[id].amountCents,0),valued:known.length,pending:ids.length-known.length,status:known.length===ids.length?'complete':'partial'}};
  })}))})),
  'daily-cards':(i,o)=>o['facts-and-value'].map(day=>{
   // Keep every occasion and its gap; use a dressable occasion as the thumbnail.
   const primary=day.edits.find(e=>e.looks.length)||day.edits[0]||null;
   return {...day,primary,looks:primary?.looks||day.fallback?.looks||[],gaps:day.edits.filter(e=>e.gap).map(e=>({eventId:e.event.id,title:e.event.title,...e.gap})),weather:'not-connected'};
  })
 });
 result.trace=result.trace.map(t=>({...t,status:['designer-brain','facts-and-value','daily-cards'].includes(t.node)&&result.outputs['daily-cards'].some(d=>d.gaps.length)?'partial':t.status}));
 return {...result,days:result.outputs['daily-cards'],externalRequests:0,modelCalls:0};
}
const api={nodes,run,outlookEvents};if(typeof module!=='undefined')module.exports=api;root.StyleProDailyDag=api;
})(typeof window!=='undefined'?window:globalThis);
