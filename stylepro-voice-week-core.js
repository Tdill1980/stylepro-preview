/* Voice planning: one sentence can hold several events, including several times on one day. */
(function(root){'use strict';
const DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const add=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
function weekdayDate(name,modifier,baseDate){
 const n=DAYS.indexOf(String(name||'').toLowerCase());
 if(n<0) return '';
 const base=new Date(baseDate+'T12:00:00Z');
 let start=baseDate;
 if(String(modifier||'').toLowerCase()==='next') start=add(baseDate,-((base.getUTCDay()+6)%7)+7);
 const dow=new Date(start+'T12:00:00Z').getUTCDay();
 return add(start,(n-dow+7)%7);
}
function inferEnergy(title){
 const t=title.toLowerCase();
 if(/danze|dance class|workout/.test(t)) return {id:'active',name:'Active'};
 if(/toastmasters|speaking/.test(t)) return {id:'speaking',name:'Polished speaking'};
 if(/pumpkin|play\s*date|\bpark\b|playground/.test(t)) return {id:'play-date',name:'Play date'};
 if(/wrap\s*tv|wraptv/.test(t)) return {id:'wraptvworld',name:'Wraptvworld'};
 if(/\bgallery\b/.test(t)) return {id:'gallery',name:'Gallery'};
 if(/designpro|founder|\bdemo\b|filming|on camera|networking|board meeting|\bpta\b/.test(t)) return {id:'founder',name:'Founder Energy'};
 if(/drink|dinner|hubby|husband|date night|restaurant/.test(t)) return {id:'gallery',name:'Gallery'};
 if(/\bclient\b|\bmeeting\b|\boffice\b|\bwork\b/.test(t)) return {id:'founder',name:'Founder Energy'};
 return {id:null,name:''};
}
function parseClock(clause){
 const words={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12};
 const numeric=clause.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
 const verbal=clause.match(/\bat\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s+(thirty|fifteen))?\s*(a\.?m\.?|p\.?m\.?)?/i);
 const m=numeric||verbal;
 if(!m) return null;
 const hour=numeric?Number(m[1]):words[m[1].toLowerCase()];
 const minute=numeric&&m[2]?Number(m[2]):verbal&&m[2]==='thirty'?30:verbal&&m[2]==='fifteen'?15:0;
 if(hour<1||hour>23||minute>59) return null;
 const token=m[3]||'';
 const ap=token?/p/i.test(token)?'pm':'am':'';
 return {hour,minute,ap,inferred:''};
}
function splitDays(text){
 const re=/\b((?:next|this)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|tonight)\b/gi;
 const hits=[...text.matchAll(re)];
 if(!hits.length) return [{modifier:'',dayWord:'',text}];
 return hits.map((hit,i)=>({modifier:(hit[1]||'').trim(),dayWord:hit[2],text:text.slice(hit.index,hits[i+1]?hits[i+1].index:text.length).trim()}));
}
function isEvent(part){return /\bat\s+\d|\bat\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b|\b(meeting|networking|drinks|dinner|demo|gallery|park|pta|play date|wrap|coffee|webinar|call|filming)\b/i.test(part);}
function splitClauses(segment){
 let body=segment.replace(/^(?:(?:next|this)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|tonight)\b[,:\s-]*/i,'');
 body=body.replace(/^(?:i\s+have|i've\s+got|i've|i'm|i am)\s+/i,'');
 const parts=body.split(/\s*,\s*|\s+\b(?:and|then|also)\b\s+/i).map(s=>s.trim()).filter(Boolean);
 const events=[];
 for(const part of parts){if(isEvent(part)||!events.length) events.push(part); else events[events.length-1]+=', '+part;}
 return events.filter(isEvent);
}
function cleanTitle(clause){
 const title=clause.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?/ig,'').replace(/\bat\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s+(?:thirty|fifteen))?\s*(?:a\.?m\.?|p\.?m\.?)?/ig,'').replace(/^(?:a|an|the)\s+/i,'').replace(/^[,:\s-]+|[,:\s-]+$/g,'').replace(/\s+/g,' ').trim();
 return title?title[0].toUpperCase()+title.slice(1):'';
}
function clock(hour,minute,ap){
 let h=hour;
 if(ap==='pm'&&h<12) h+=12;
 if(ap==='am'&&h===12) h=0;
 if(!ap&&h<=12) return '';
 return String(h).padStart(2,'0')+':'+String(minute).padStart(2,'0');
}
function prettyTime(start){
 if(!start) return 'Time open';
 let [h,m]=start.split(':').map(Number);
 const ap=h>=12?'pm':'am';
 h=h%12||12;
 return m?h+':'+String(m).padStart(2,'0')+ap:h+ap;
}
function prettyDay(date,word){
 if(date){const d=new Date(date+'T12:00:00Z');const name=DAYS[d.getUTCDay()];return name[0].toUpperCase()+name.slice(1);}
 if(word) return word[0].toUpperCase()+word.slice(1).toLowerCase();
 return 'Day open';
}
function assignMeridiem(rows){
 const open=rows.filter(r=>r.time&&!r.time.ap&&r.time.hour<=12);
 const hours=open.map(r=>r.time.hour);
 const ascending=hours.every((h,i)=>i===0||h>hours[i-1]);
 if(ascending&&hours.length>=2&&hours[0]<=7&&hours.at(-1)>=5){open.forEach(r=>{r.time.ap='pm';r.time.inferred='pm-sequence';});return;}
 for(const r of open){
  const blob=(r.title+' '+r.clause).toLowerCase();
  if(/drink|dinner|tonight|evening|hubby|husband|pta|networking|board/.test(blob)&&r.time.hour<=7){r.time.ap='pm';r.time.inferred='evening-word';}
  else if(/\bmorning\b|breakfast|brunch/.test(blob)){r.time.ap='am';r.time.inferred='morning-word';}
  else r.needsMeridiem=true;
 }
}
function dressingLine(entries){
 const groups=new Map();
 for(const e of entries){const key=e.date||e.breadcrumb.day;if(!groups.has(key)) groups.set(key,[]);groups.get(key).push(e);}
 const bits=[];
 for(const list of groups.values()){
  if(list.length<2){bits.push(list[0].title+' gets its own look.');continue;}
  if(list.every(e=>e.energyId&&e.energyId===list[0].energyId)) bits.push(list.map(e=>e.title).join(' and ')+' can share one look that transitions.');
  else bits.push(list.slice(0,-1).map(e=>e.title).join(' and ')+' can transition. '+list.at(-1).title+' needs a change.');
 }
 return bits.join(' ');
}
function reflection(entries){
 const bits=entries.map(e=>`${e.energyName||'Your energy'} ${e.breadcrumb.day} — ${e.title}`);
 return `Your week. ${bits.join('. ')}. That's a real week, and it looks like you.`;
}
function turnsFor(user,entries,questions){
 const turns=[{role:'user',text:user}];
 if(!entries.length){turns.push({role:'stylist',text:'Tell me the day and what’s happening. I’ll dress it.'});return turns;}
 turns.push({role:'stylist',text:new Set(entries.map(e=>e.date||e.breadcrumb.day)).size>1?'I’m laying out those days and dressing each one.':entries[0].breadcrumb.day+', '+(entries.length===1?'one plan':'a few beats')+'. I’ll dress each one.'});
 turns.push({role:'crumbs',crumbs:entries.map(e=>e.breadcrumb)});
 if(questions[0]) turns.push({role:'stylist',text:questions[0].question,choices:questions[0].choices,ask:questions[0].field});
 else turns.push({role:'stylist',text:dressingLine(entries)});
 return turns;
}
function entryFrom(row,index){
 const startTime=row.needsMeridiem?'':row.time?clock(row.time.hour,row.time.minute,row.time.ap):'';
 const crumb={day:prettyDay(row.date,row.dayWord),event:row.title,time:row.needsMeridiem?'Time?':prettyTime(startTime),energy:row.energy.name||'Energy?'};
 return {id:'plan-'+index,title:row.title,date:row.date,startTime,endTime:'',allDay:!row.time,energyId:row.energy.id,energyName:row.energy.name,sourceText:row.clause,rawHour:row.time?.hour??null,rawMinute:row.time?.minute??0,needsMeridiem:!!row.needsMeridiem,breadcrumb:crumb};
}
function questionsFor(entries){
 const pending=entries.filter(e=>e.needsMeridiem);
 const questions=[];
 if(pending.length>1) questions.push({id:'time-day',field:'time',question:'Should those times be in the morning or the evening?',choices:['Morning','Evening']});
 else if(pending.length===1) questions.push({id:pending[0].id,field:'time',question:'Is “'+pending[0].title+'” at '+pending[0].rawHour+' in the morning or the evening?',choices:['Morning','Evening']});
 for(const e of entries) if(!e.energyId) questions.push({id:e.id,field:'energy',question:'Which energy fits “'+e.title+'”?',choices:['Founder Energy','Wraptvworld','Play date','Gallery']});
 return questions;
}
function parse(raw,{baseDate}={}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(baseDate||'')) throw Error('A valid local starting date is required.');
 const text=String(raw||'').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
 const rows=[];
 for(const seg of splitDays(text)){
  let date='';
  const word=seg.dayWord.toLowerCase();
  if(/today|tonight/.test(word)) date=baseDate;
  else if(/tomorrow/.test(word)) date=add(baseDate,1);
  else if(word) date=weekdayDate(word,seg.modifier,baseDate);
  for(const clause of splitClauses(seg.text)){
   const title=cleanTitle(clause);
   if(!title) continue;
   rows.push({clause,title,date,dayWord:word,time:parseClock(clause),energy:inferEnergy(title+' '+clause),needsMeridiem:false});
  }
 }
 assignMeridiem(rows);
 const entries=rows.map(entryFrom);
 const questions=questionsFor(entries);
 return {entries,questions,turns:turnsFor(text,entries,questions),reflection:entries.length?reflection(entries):'',modelCalls:0};
}
const ENERGY_CHOICE={'founder energy':'founder',wraptvworld:'wraptvworld','play date':'play-date',gallery:'gallery'};
function applyChoice(result,choice){
 const picked=String(choice||'').toLowerCase();
 const entries=result.entries.map(e=>({...e,breadcrumb:{...e.breadcrumb}}));
 if(picked==='morning'||picked==='evening'){
  const ap=picked==='morning'?'am':'pm';
  for(const e of entries) if(e.needsMeridiem&&e.rawHour){e.needsMeridiem=false;e.startTime=clock(e.rawHour,e.rawMinute||0,ap);e.breadcrumb.time=prettyTime(e.startTime);}
 }
 if(ENERGY_CHOICE[picked]){
  const name=Object.keys(ENERGY_CHOICE).find(k=>k===picked).replace(/\b\w/g,c=>c.toUpperCase());
  for(const e of entries) if(!e.energyId){e.energyId=ENERGY_CHOICE[picked];e.energyName=name==='Wraptvworld'?'Wraptvworld':name;e.breadcrumb.energy=e.energyName;}
 }
 const questions=questionsFor(entries);
 const user=result.turns.find(t=>t.role==='user')?.text||'';
 return {entries,questions,turns:turnsFor(user,entries,questions),reflection:entries.length?reflection(entries):'',modelCalls:0};
}
const api={parse,applyChoice,reflection,inferEnergy};
if(typeof module!=='undefined') module.exports=api;
root.StyleProVoiceWeek=api;
})(typeof window!=='undefined'?window:globalThis);
