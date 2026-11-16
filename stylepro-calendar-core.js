/* Local calendar import. Pure rules; no network, model, weather or implied sync. */
(function(root){'use strict';
const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const days=['sun','mon','tue','wed','thu','fri','sat'];
const clean=s=>String(s||'').replace(/\*\*/g,'').trim();
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
function dateOf(y,m,d){const s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return validDate(s)?s:'';}
function classify(title){
 if(/^(text |decision\b|decide\b|deadlines?\b|confirm .*flight|prep:|stage next week)/i.test(title))return 'reminder';
 if(/danze|dance|gym|workout|fitness/i.test(title))return 'workout';
 if(/dinner|restaurant|christmas date/i.test(title))return 'dinner';
 if(/write.*script|script planning/i.test(title))return 'work';
 if(/proof day|demo|camera|film/i.test(title))return 'camera';
 if(/toastmasters|speaking club|assembly|training|work session|educate|review|launch|anchor|conference|panel|leadership/i.test(title))return 'work';
 if(/flight|travel|thanksgiving|trip/i.test(title))return 'weekend';
 return 'everyday';
}
const stylingQuery=ev=>({work:'Client meeting',camera:'Filming',dinner:'Dinner',weekend:'Travel',everyday:'Everyday',workout:'Workout'})[ev.kind||classify(ev.title)]||'Everyday';
function clock(h,m,ap){h=Number(h);m=Number(m||0);if(h<1||h>12||m>59)return '';return String(h%12+(/p/i.test(ap)?12:0)).padStart(2,'0')+':'+String(m).padStart(2,'0');}
function timePart(text){
 const m=text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*(?:[–—-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM))?\s*/i);
 if(!m||(!m[3]&&!m[6]))return {title:text,startTime:'',endTime:''};
 return {title:text.slice(m[0].length).trim(),startTime:clock(m[1],m[2],m[3]||m[6]),endTime:m[4]?clock(m[4],m[5],m[6]):''};
}
function key(ev){return [ev.date,ev.startTime||'',clean(ev.title).toLowerCase().replace(/\s+/g,' ')].join('|');}
function parse(raw,{baseDate,timeZone='America/Phoenix'}={}){
 if(!validDate(baseDate))throw Error('Choose the starting date for this calendar paste.');
 const baseYear=Number(baseDate.slice(0,4)),baseMonth=Number(baseDate.slice(5,7));
 let month=baseMonth,year=baseYear,blocked=false;const entries=[],warnings=[];
 const yearFor=m=>baseYear+(m<baseMonth-6?1:0);
 for(const original of String(raw).split(/\n/)){
  let line=clean(original).replace(/^[-•]\s*/,'');if(!line)continue;
  if(/^not on the calendar/i.test(line)){blocked=true;warnings.push('The “not on the calendar yet” section was left out.');continue;}
  if(blocked)continue;
  const heading=line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{4}))?$/i);
  if(heading){month=months.indexOf(heading[1].slice(0,3).toLowerCase())+1;year=heading[2]?+heading[2]:yearFor(month);continue;}
  if(/^(this week|next week|here'?s everything)/i.test(line))continue;
  const dm=line.match(/^(?:(Sun\w*|Mon\w*|Tue\w*|Wed\w*|Thu\w*|Fri\w*|Sat\w*)\s+)?(Jan\w*|Feb\w*|Mar\w*|Apr\w*|May\w*|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*)\s*(\d{1,2})(?:\s*[–-]\s*(?:(?:Sun\w*|Mon\w*|Tue\w*|Wed\w*|Thu\w*|Fri\w*|Sat\w*)\s+)?(?:(Jan\w*|Feb\w*|Mar\w*|Apr\w*|May\w*|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*)\s*)?(\d{1,2}))?\s*(?:,?\s*(20\d{2}))?\s*[—:–-]\s*/i);
  if(!dm){warnings.push('Could not read a dated entry: '+line);continue;}
  month=months.indexOf(dm[2].slice(0,3).toLowerCase())+1;year=dm[6]?+dm[6]:yearFor(month);
  const date=dateOf(year,month,+dm[3]),endMonth=dm[4]?months.indexOf(dm[4].slice(0,3).toLowerCase())+1:month;
  const endDate=dm[5]?dateOf(year+(endMonth<month?1:0),endMonth,+dm[5]):date;
  if(!date||!endDate||endDate<date){warnings.push('Check the date: '+line);continue;}
  if(dm[1]&&new Date(date+'T12:00:00Z').getUTCDay()!==days.indexOf(dm[1].slice(0,3).toLowerCase()))warnings.push('Weekday/date mismatch: '+line);
  const parts=line.slice(dm[0].length).split(/\s+·\s+/);
  for(let part of parts){
   let itemDate=date,itemEnd=endDate;
   const inner=part.match(/^(Sun\w*|Mon\w*|Tue\w*|Wed\w*|Thu\w*|Fri\w*|Sat\w*)\s+(?:(Jan\w*|Feb\w*|Mar\w*|Apr\w*|May\w*|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*)\s*(\d{1,2})\s*)?/i);
   if(inner){
    if(inner[2]){const m=months.indexOf(inner[2].slice(0,3).toLowerCase())+1;itemDate=dateOf(yearFor(m),m,+inner[3]);}
    else {const t=new Date(date+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+(days.indexOf(inner[1].slice(0,3).toLowerCase())-t.getUTCDay()+7)%7);itemDate=t.toISOString().slice(0,10);}
    itemEnd=itemDate;part=part.slice(inner[0].length);
   }
   const t=timePart(part),allDay=/all[- ]day/i.test(part),status=/TBD|5th.vs.12th|date.*still|time.*TBD/i.test(part)?'needs-review':/tentative|flexible/i.test(part)?'tentative':'planned';
   if(!t.title||!itemDate){warnings.push('Check entry: '+part);continue;}
   entries.push({date:itemDate,endDate:itemEnd,title:t.title,startTime:t.startTime,endTime:t.endTime,allDay,status,kind:classify(t.title),timeZone,source:'paste',sourceText:original.trim(),include:true});
  }
 }
 const unique=[...new Map(entries.map(ev=>[key(ev),ev])).values()];return {entries:unique,warnings};
}
function merge(existing,incoming){
 const next=JSON.parse(JSON.stringify(existing)),known=new Set(Object.entries(next).flatMap(([date,list])=>list.map(ev=>key({...ev,date}))));let added=0,skipped=0;
 for(const ev of incoming){if(!validDate(ev.date)||!validDate(ev.endDate||ev.date)||(ev.endDate||ev.date)<ev.date||!clean(ev.title))throw Error('Each event needs a valid date, end date and title.');
  const k=key(ev);if(known.has(k)){skipped++;continue;}known.add(k);const {include,...entry}=ev;entry.id='paste:'+k;entry.lookId=null;(next[ev.date]??=[]).push(entry);added++;
 }
 return {events:next,added,skipped};
}
function onDate(events,date){return Object.entries(events).flatMap(([start,list])=>list.filter(ev=>start<=date&&(ev.endDate||start)>=date).map(ev=>({...ev,date:start}))).sort((a,b)=>(a.kind==='reminder')-(b.kind==='reminder')||(a.startTime||'').localeCompare(b.startTime||''));}
const api={parse,merge,classify,stylingQuery,key,onDate,validDate};if(typeof module!=='undefined')module.exports=api;root.StyleProCalendarCore=api;
})(typeof window!=='undefined'?window:globalThis);
