/* Platform-first planning: deterministic preview, no model calls or external sync. */
(function(root){'use strict';
const K=typeof module!=='undefined'?require('./stylepro-calendar-core.js'):root.StyleProCalendarCore;
const V=typeof module!=='undefined'?require('./stylepro-valuation-core.js'):root.StyleProValuation;
const DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
const dayRE='(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)';
const monRE='(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const add=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const stamp=(y,m,d)=>{const s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return K.validDate(s)?s:'';};
function bounds(base,scope){const d=new Date(base+'T12:00:00Z'),y=d.getUTCFullYear(),m=d.getUTCMonth()+1,week=add(base,-((d.getUTCDay()+6)%7));
 if(scope==='next-week')return {start:add(week,7),end:add(week,13)};
 if(scope==='this-month'||scope==='next-month'){const x=new Date(Date.UTC(y,m-1+(scope==='next-month'?1:0),1,12));return {start:x.toISOString().slice(0,10),end:new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0,12)).toISOString().slice(0,10)};}
 return {start:base,end:add(base,13)};
}
function normalize(s){return String(s||'').replace(/\b([ap])\.m\./gi,'$1m').replace(/[“”]/g,'"').replace(/\b(at\s+)(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s+(thirty|fifteen|forty[- ]five))?\b/gi,(_,a,n,m)=>a+(['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'].indexOf(n.toLowerCase())+1)+(m?':'+({thirty:'30',fifteen:'15','forty five':'45','forty-five':'45'})[m.toLowerCase()]:''));}
function extract(raw,{baseDate,scope='coming-up',timeZone='America/Phoenix'}={}){
 if(!K.validDate(baseDate))throw Error('A valid local starting date is required.');
 let horizon=scope;const text=normalize(raw).slice(0,12000);
 const warnings=[],entries=[];
 const boundary='(?=(?:(?:on|this|next)\\s+)?'+dayRE+'\\b|today\\b|tomorrow\\b|tonight\\b|'+monRE+'\\s+\\d|I (?:have|am|will)\\b|I\'m\\b)';
 const chunks=text.replace(new RegExp('\\s+(?:and|then|also)\\s+'+boundary,'gi'),'\n').replace(new RegExp(',\\s*'+boundary,'gi'),'\n').split(/[\n;.!?]+/).map(x=>x.trim()).filter(Boolean);
 for(let index=0;index<chunks.length;index++){
  let line=chunks[index],date='',endDate='',dateText='',dateNote='';
  if(/\bnext month\b/i.test(line))horizon='next-month';else if(/\bthis month\b/i.test(line))horizon='this-month';else if(/\bnext week\b/i.test(line))horizon='next-week';
  const window=bounds(baseDate,horizon);
  if(/^(?:(?:this|next) (?:week|month)|for (?:the )?(?:week|month))$/i.test(line))continue;
  if(/\b(?:cancel|reschedule|move my|not going|don't add)\b/i.test(line)){warnings.push('Change request kept for review: '+line+'. Edit the existing plan in your calendar.');continue;}
  const iso=line.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  const explicit=line.match(new RegExp('\\b('+monRE+')\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*(?:through|to|–|-)\\s*(?:('+monRE+')\\s+)?(\\d{1,2})(?:st|nd|rd|th)?)?(?:,?\\s+(20\\d{2}))?','i'));
  const relative=line.match(/\b(day after tomorrow|tomorrow|today|tonight)\b/i);
  const weekday=line.match(new RegExp('\\b(?:(next|this|every)\\s+)?('+dayRE+')(?:\\s*(?:through|to|–|-)\\s*('+dayRE+'))?\\b','i'));
  const ordinal=line.match(/\b(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)\b/i);
  if(iso){date=K.validDate(iso[1])?iso[1]:'';dateText=iso[0];}
  else if(explicit){const m=MONTHS.findIndex(x=>x.startsWith(explicit[1].slice(0,3).toLowerCase()))+1;let y=explicit[5]?+explicit[5]:+baseDate.slice(0,4);if(!explicit[5]&&m<+baseDate.slice(5,7))y++;
   date=stamp(y,m,+explicit[2]);const em=explicit[3]?MONTHS.findIndex(x=>x.startsWith(explicit[3].slice(0,3).toLowerCase()))+1:m;endDate=explicit[4]?stamp(y+(em<m?1:0),em,+explicit[4]):date;dateText=explicit[0];}
  else if(relative){date=add(baseDate,/day after/i.test(relative[0])?2:/tomorrow/i.test(relative[0])?1:0);dateText=relative[0];}
  else if(ordinal){date=stamp(+window.start.slice(0,4),+window.start.slice(5,7),+ordinal[1]);dateText=ordinal[0];dateNote='Month resolved from '+horizon.replaceAll('-',' ')+'.';}
  else if(weekday){const n=DAYS.indexOf(weekday[2].toLowerCase());let start=window.start;
   if(weekday[1]?.toLowerCase()==='next'&&horizon!=='next-week')start=bounds(baseDate,'next-week').start;
   date=add(start,(n-new Date(start+'T12:00:00Z').getUTCDay()+7)%7);
   if(/month/.test(horizon)&&weekday[1]?.toLowerCase()!=='every'){date='';dateNote='Which '+weekday[2]+' in that month?';}
   if(weekday[3]&&date)endDate=add(date,(DAYS.indexOf(weekday[3].toLowerCase())-n+7)%7);dateText=weekday[0];}
  let title=line.replace(dateText,'').replace(/\b(?:next|this) (?:week|month)\b/gi,'').replace(/^\s*(?:(?:on|and|then|also|so)\s+)*(?:I(?:'m| am| have| will|’m)|we(?:'re| are| have|’re))?\s*/i,'').replace(/^going to\s+/i,'').replace(/\b(?:on|at)\s*$/i,'').trim();
  let startTime='',timeQuestion='';const tm=title.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)||title.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if(tm){const hour=+tm[1],minute=+(tm[2]||0);if(hour>=1&&hour<=12&&minute<60&&tm[3])startTime=String(hour%12+(/pm/i.test(tm[3])?12:0)).padStart(2,'0')+':'+String(minute).padStart(2,'0');else timeQuestion='You said '+tm[0]+'. What time, including AM or PM?';title=title.replace(tm[0],'').trim();}
  const allDay=/\ball[- ]day\b/i.test(title);title=title.replace(/\ball[- ]day\b/gi,'').replace(/\b(?:on|at)\s*$/i,'').replace(/^[,:\s-]+|[,:\s-]+$/g,'').replace(/\s+/g,' ');
  if(!title){warnings.push('Tell me what is happening '+(dateText||'on that date')+'.');continue;}
  const ev={draftId:'draft-'+index,title:title[0].toUpperCase()+title.slice(1),date,endDate:endDate||date,startTime,endTime:'',allDay,kind:/^work$|\boffice\b|\bmeeting\b/i.test(title)?'work':K.classify(title),timeZone,status:/maybe|tentative|might/i.test(line)?'tentative':'planned',source:'stylist-conversation',sourceText:line,include:true,dateNote,timeQuestion};
  if(ev.date&&ev.endDate<ev.date){ev.date='';ev.endDate='';ev.dateNote='The end date is before the start. Which dates did you mean?';}
  if(weekday?.[1]?.toLowerCase()==='every'&&date){for(let d=date,n=0;d<=window.end&&n<10;d=add(d,7),n++)entries.push({...ev,date:d,endDate:d,draftId:ev.draftId+'-'+n,dateNote:'Repeats only within '+window.start+'–'+window.end+'.'});}else entries.push(ev);
 }
 return {entries:[...new Map(entries.map(ev=>[(ev.date||ev.draftId)+'|'+ev.title+'|'+ev.startTime,ev])).values()],warnings,scope:horizon,window:bounds(baseDate,horizon)};
}
const nodes=[{id:'conversation',deps:[]},{id:'event-drafts',deps:['conversation']},{id:'clarifications',deps:['event-drafts']},{id:'review',deps:['clarifications']}];
function run(raw,options){return V.execute(nodes,{raw,options},{conversation:i=>({text:String(i.raw),source:'voice-or-text'}),'event-drafts':i=>extract(i.raw,i.options),clarifications:(_,o)=>o['event-drafts'].entries.flatMap(e=>[...(!e.date?[{id:e.draftId,field:'date',question:e.dateNote||'What day is '+e.title+'?'}]:[]),...(e.timeQuestion?[{id:e.draftId,field:'time',question:e.timeQuestion}]:[])]),review:(_,o)=>({...o['event-drafts'],questions:o.clarifications,requiresConfirmation:true,modelCalls:0})});}
function validate(entries){if(!entries.length)throw Error('Choose at least one plan.');for(const e of entries){if(!K.validDate(e.date)||!K.validDate(e.endDate||e.date)||(e.endDate||e.date)<e.date)throw Error('Choose valid dates for '+e.title+'.');if(e.timeQuestion&&!e.startTime)throw Error('Confirm AM or PM for '+e.title+', or choose time not decided.');if(e.startTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.startTime))throw Error('Choose a valid time for '+e.title+'.');if(!String(e.title).trim())throw Error('Every plan needs a title.');}return entries;}
const esc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
function toICS(entries,{now='2026-01-01T00:00:00Z'}={}){const selected=entries.filter(e=>K.validDate(e.date)&&(e.allDay||e.startTime));const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Stylepro//Personal Stylist//EN','CALSCALE:GREGORIAN'];for(const e of selected){const compact=d=>d.replaceAll('-',''),zone=/^[A-Za-z_]+\/[A-Za-z_]+$/.test(e.timeZone||'')?e.timeZone:'America/Phoenix';let h=0;for(const c of K.key(e))h=(Math.imul(31,h)+c.charCodeAt(0))>>>0;
 lines.push('BEGIN:VEVENT','UID:stylepro-'+h+'@stylepro.local','DTSTAMP:'+new Date(now).toISOString().replace(/[-:]|\.\d{3}/g,''),'SUMMARY:'+esc(e.title));
 if(e.allDay)lines.push('DTSTART;VALUE=DATE:'+compact(e.date),'DTEND;VALUE=DATE:'+compact(add(e.endDate||e.date,1)));else{lines.push('DTSTART;TZID='+zone+':'+compact(e.date)+'T'+e.startTime.replace(':','')+'00');if(e.endTime)lines.push('DTEND;TZID='+zone+':'+compact(e.endDate||e.date)+'T'+e.endTime.replace(':','')+'00');}
 lines.push('STATUS:'+(e.status==='tentative'?'TENTATIVE':'CONFIRMED'),'END:VEVENT');}lines.push('END:VCALENDAR');return {text:lines.join('\r\n')+'\r\n',count:selected.length,skipped:entries.length-selected.length};}
const api={run,extract,validate,toICS,bounds,nodes};if(typeof module!=='undefined')module.exports=api;root.StyleProConversation=api;
})(typeof window!=='undefined'?window:globalThis);
