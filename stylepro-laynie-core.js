/* Laynie's brief and look checks. No network, no key. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const NOT_CONNECTED='Laynie not connected yet';
const STORES={
 whbm:'White House Black Market','ralph-lauren':'Ralph Lauren',alo:'Alo',lululemon:'Lululemon',
 'free-people':'Free People',anthropologie:'Anthropologie','calvin-klein':'Calvin Klein',
 'princess-polly':'Princess Polly','the-limited':'The Limited',reformation:'Reformation',zara:'Zara',
 madewell:'Madewell',jcrew:'J.Crew',nordstrom:'Nordstrom',revolve:'Revolve',aritzia:'Aritzia',chanel:'Chanel',prada:'Prada'
};
const DAYS={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
const ROLE_WORDS=[[/earring|jewelry|necklace|bracelet|ring|hoop/,'jewelry'],[/jacket|blazer|coat|layer/,'layer'],[/jean|pant|trouser|skirt|bottom/,'bottom'],[/shoe|sneaker|boot|heel|flat/,'shoe'],[/bag|purse|tote|clutch/,'bag'],[/dress/,'dress'],[/top|blouse|shirt|sweater|knit/,'top']];
function shift(iso,days){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function lastWeekday(today,name){
 const target=DAYS[String(name||'').toLowerCase()];
 if(target===undefined) return null;
 const current=new Date(today+'T12:00:00Z').getUTCDay();
 let delta=(current-target+7)%7;
 if(delta===0) delta=7;
 return shift(today,-delta);
}
function askedDate(text,today){
 const q=String(text||'').toLowerCase();
 const named=/last\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/.exec(q);
 if(named) return lastWeekday(today,named[1]);
 if(/\byesterday\b/.test(q)) return shift(today,-1);
 if(/\btoday\b/.test(q)&&/\bwore\b/.test(q)) return today;
 return null;
}
function clean(value,max){return String(value||'').replace(/\s+/g,' ').trim().slice(0,max);}
function storeNames(baseline){
 const ids=baseline&&baseline.stores||[];
 const named=ids.map(id=>STORES[id]||clean(id,40)).filter(Boolean);
 const custom=clean(baseline&&baseline.custom,80);
 return custom?[...named,custom]:named;
}
function avoided(item,terms){
 const blob=((item.name||'')+' '+(item.description||'')+' '+(item.category||'')).toLowerCase();
 return (terms||[]).some(term=>{
  const word=String(term||'').toLowerCase().trim();
  return word&&blob.includes(word);
 });
}
function compact(item){
 return {id:item.id,name:item.name,category:item.category,brand:item.brand||'',status:item.status||''};
}
function allowedItems(items,dna){
 const terms=[...((dna&&dna.baseline&&dna.baseline.avoids)||[])];
 if((dna&&dna.baseline&&dna.baseline.avoids||[]).includes('khaki')||(dna&&dna.dislikes||'').toLowerCase().includes('khaki')) terms.push('khaki','beige mini');
 const rows=(items||[]).filter(item=>C.owned(item)&&item.id!=='171'&&!avoided(item,terms));
 return rows.slice(0,220).map(compact);
}
function line(item){
 return [item.id,item.name,item.category,C.role(item),item.brand||'brand pending'].join(' | ');
}
function wearLines(wears,items){
 const byId=new Map((items||[]).map(item=>[item.id,item]));
 return (wears||[]).slice(-16).map(wear=>{
  const names=(wear.itemIds||[]).map(id=>{const item=byId.get(id);return item?item.name+' ('+id+')':id;});
  return wear.date+(wear.event?' · '+wear.event:'')+': '+(names.join(', ')||wear.title||'pieces pending')+'. Confirmed wear.';
 });
}
function eventLines(events){
 return (events||[]).filter(ev=>ev&&ev.title&&ev.kind!=='reminder').slice(0,24).map(ev=>[ev.date,ev.start||ev.startTime||'',ev.title,ev.venue||'',ev.tentative?'tentative':''].filter(Boolean).join(' · '));
}
function focusWear(text,today,wears){
 const date=askedDate(text,today);
 if(!date) return null;
 const rows=(wears||[]).filter(wear=>wear.date===date);
 return {date,wears:rows,empty:!rows.length};
}
function currentIds(memory){
 const look=memory&&memory.currentLook;
 return look&&Array.isArray(look.itemIds)?look.itemIds.slice():[];
}
function locksFrom(text,ids,items){
 const q=String(text||'').toLowerCase();
 if(!/\b(keep|hold|leave|same)\b/.test(q)) return [];
 const byId=new Map((items||[]).map(item=>[item.id,item]));
 const current=ids.map(id=>byId.get(id)).filter(Boolean);
 const locked=[];
 for(const [re,role] of ROLE_WORDS){
  if(!re.test(q)) continue;
  for(const item of current) if(C.role(item)===role) locked.push(item.id);
 }
 for(const item of current){
  if(q.includes(String(item.name||'').toLowerCase())) locked.push(item.id);
 }
 return [...new Set(locked)];
}
function mustDiffer(text){
 const q=String(text||'').toLowerCase();
 return /another option|something else|different|swap the|instead/.test(q)||(/\bkeep\b/.test(q)&&/option|another|else|different/.test(q));
}
function measurementLine(measurements){
 const m=measurements||{};
 const bits=[];
 for(const [key,label] of [['height','height'],['bust','bust'],['waist','waist'],['hip','hip'],['inseam','inseam']]){
  if(m[key]) bits.push(label+' '+m[key]+' in');
 }
 return bits.length?bits.join(', ')+'. Use these for proportion only. Do not comment on her body.':'Measurements: pending.';
}
function systemPrompt(input,items){
 const dna=input.dna||{};
 const baseline=dna.baseline||{};
 const stores=storeNames(baseline);
 const loves=[dna.loves, ...(dna.directions||[])].filter(Boolean).join('; ');
 const focus=focusWear(input.text,input.today,input.wears);
 const focusText=focus?focus.empty?'Nothing is logged for '+focus.date+'. A plan is not a wear. Say that plainly.':wearLines(focus.wears,input.items).join(' '):'No wear date was named in this question.';
 return [
  'You are Laynie, Stylepro’s personal stylist.',
  'At base you are a knowledgeable professional stylist who understands the latest trends and classic style. The people you dress could be in Vogue or at an everyday mall. You understand every style, and you make this client look her best while abiding by what she likes.',
  'Her onboarding answers, her closet, and her wear log are how you know what she likes. Taste stays polished, adult, and editorial. Never propose a random teen-looking combination.',
  'Never comment on her body, her spending, or a streak. Never invent a garment, a wear, a store, a measurement, or an event. If something was not recorded, call it pending. A saved look or a plan is not a wear.',
  'Choose only item ids from the closet list. A look is a dress, or a top and a bottom, plus the finish (layer, earrings, bag, shoes) when she owns them. One statement piece. A cohesive palette. Explain the choice in language a screen reader can read aloud.',
  'When she asks what goes with a logged wear, start from those exact pieces and add only owned pieces. Title and describe that pairing. Do not switch the answer to a different day or a calendar event she did not name. When nothing is logged that day, say so.',
  'When she asks why you chose a piece, name that piece and the occasion she asked about, using the current look.',
  'When she says to keep a piece, every look must include that item id and change at least one other piece.',
  'Use the calendar only when she names that plan. A question about a logged wear is not a request to dress today\'s event.',
  'When she does ask about Toastmasters or another speaking time, keep it polished and adult, and include one pair of earrings she owns unless she asked to leave jewelry off.',
  'Client: '+(dna.name||'the client')+'.',
  'Favorite stores: '+(stores.join(', ')||'pending')+'.',
  'Vibes: '+((baseline.vibes||[]).join(', ')||'pending')+'. Fits: '+((baseline.fits||[]).join(', ')||'pending')+'.',
  'Hard no’s: '+((baseline.avoids||[]).join(', ')||'none recorded')+'.',
  'Occasions from onboarding: '+((baseline.occasions||[]).join(', ')||'pending')+'.',
  'What she loves: '+(loves||'pending')+'.',
  'What she dislikes: '+(dna.dislikes||'pending')+'.',
  measurementLine(input.measurements),
  'Closet she owns, one piece per line, as id | name | category | role | brand:',
  items.map(line).join('\n')||'Closet: pending.',
  'Wear log:',
  wearLines(input.wears,input.items).join('\n')||'No confirmed wears yet.',
  'Named wear for this question: '+focusText,
  'Calendar already in the app, used only if she names one of these plans:',
  eventLines(input.events).join('\n')||'No events recorded.',
  'Reply as JSON with say, why, and looks. say is the spoken answer. why explains the choice. looks are item ids she owns plus a short reasoning.'
 ].join('\n');
}
function historyMessages(memory){
 return ((memory&&memory.messages)||[]).slice(-10).map(row=>({role:row.role==='assistant'?'assistant':'user',content:clean(row.content,1200)})).filter(row=>row.content);
}
function buildTurn(input){
 const source=input||{};
 const today=source.today||'';
 const items=allowedItems(source.items,source.dna);
 const byId=new Map(items.map(item=>[item.id,item]));
 const previous=currentIds(source.memory).filter(id=>byId.has(id));
 const focus=focusWear(source.text,today,source.wears);
 let locks=locksFrom(source.text,previous,items);
 if(focus&&!focus.empty&&/go with|goes with|with it|pair/.test(String(source.text||'').toLowerCase())){
  locks=[...new Set([...locks,...focus.wears.flatMap(wear=>wear.itemIds||[])])].filter(id=>byId.has(id));
 }
 const differ=mustDiffer(source.text);
 const pairing=!!(focus&&!focus.empty&&/go with|goes with|with it|pair/.test(String(source.text||'').toLowerCase()));
 const context=[
  'Today is '+today+'.',
  focus?focus.empty?'Nothing is logged for '+focus.date+'.':'Logged for '+focus.date+': '+wearLines(focus.wears,source.items).join(' '):'',
  previous.length?'Current look ids: '+previous.join(', ')+'.':'No current look yet.',
  locks.length?'Locked ids that must stay in every look: '+locks.join(', ')+'.':'',
  differ?'Change at least one piece that is not locked.':'',
  pairing?'Answer only what she asked. This is about the logged wear, not a calendar event she did not name. The look title names the pairing.':'',
  'She said: '+clean(source.text,800)
 ].filter(Boolean).join('\n');
 const messages=historyMessages(source.memory);
 messages.push({role:'user',content:context});
 return {
  system:systemPrompt(source,items),
  messages,
  allowedIds:items.map(item=>item.id),
  locks,
  mustDiffer:differ,
  previousIds:previous,
  items,
  focus,
  pairing,
  question:String(source.text||''),
  events:source.events||[]
 };
}
function eventWord(title){
 return String(title||'').toLowerCase().split(/\s+/).find(part=>part.length>3)||'';
}
function mentionsUnaskedEvent(blob,question,events){
 const q=String(question||'').toLowerCase();
 const hay=String(blob||'').toLowerCase();
 return (events||[]).some(ev=>{
  const word=eventWord(ev.title);
  return word&&hay.includes(word)&&!q.includes(word);
 });
}
function parsePayload(payload){
 if(payload&&typeof payload==='object') return payload;
 const raw=String(payload||'').trim();
 const fenced=raw.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
 const start=fenced.indexOf('{'), end=fenced.lastIndexOf('}');
 if(start<0||end<=start) return {say:clean(raw,500),why:'',looks:[]};
 return JSON.parse(fenced.slice(start,end+1));
}
function repair(ids,constraints){
 const items=constraints.items||[];
 const byId=new Map(items.map(item=>[item.id,item]));
 const allowed=new Set(constraints.allowedIds||items.map(item=>item.id));
 const locks=[...new Set(constraints.locks||[])].filter(id=>allowed.has(id)&&byId.has(id)&&C.owned(byId.get(id)));
 let next=[...new Set(ids||[])].filter(id=>allowed.has(id)&&byId.has(id)&&C.owned(byId.get(id)));
 for(const id of locks) if(!next.includes(id)) next.push(id);
 const ordered=[...locks.filter(id=>next.includes(id)),...next.filter(id=>!locks.includes(id))];
 const kept=[];
 const single=new Set(['top','bottom','dress','layer','shoe','bag']);
 for(const id of ordered){
  const role=C.role(byId.get(id));
  const roles=kept.map(have=>C.role(byId.get(have)));
  if(single.has(role)&&roles.includes(role)) continue;
  if(role==='dress'&&(roles.includes('top')||roles.includes('bottom'))) continue;
  if((role==='top'||role==='bottom')&&roles.includes('dress')) continue;
  if(role==='jewelry'&&roles.filter(name=>name==='jewelry').length>=2) continue;
  kept.push(id);
 }
 const roles=kept.map(id=>C.role(byId.get(id)));
 const complete=roles.includes('dress')||(roles.includes('top')&&roles.includes('bottom'));
 return {ids:kept,complete};
}
function sameSet(a,b){return C.signature(a||[])===C.signature(b||[]);}
function acceptModel(payload,constraints){
 const data=parsePayload(payload);
 const say=clean(data.say||data.reply||'',500);
 const why=clean(data.why||'',500);
 const looks=[];
 for(const row of data.looks||[]){
  const fixed=repair(row.itemIds||row.pieces||[],constraints||{});
  if(!fixed.complete) continue;
  if(constraints&&constraints.mustDiffer&&sameSet(fixed.ids,constraints.previousIds)) continue;
  const notes=(row.pieceNotes||[]).filter(note=>note&&fixed.ids.includes(note.id)).map(note=>({id:note.id,because:clean(note.because,180)})).slice(0,8);
  const reasoning=clean(row.reasoning||why,400);
  let title=clean(row.title,60)||'Laynie edit';
  if(constraints&&constraints.pairing&&mentionsUnaskedEvent(title,constraints.question,constraints.events)) title='With what you wore';
  looks.push({
   id:'laynie-'+C.signature(fixed.ids).replace(/\|/g,'-'),
   title,
   pieces:fixed.ids,
   itemIds:fixed.ids,
   description:reasoning,
   reasoning,
   pieceNotes:notes,
   type:'assembly',
   occasions:[],
   styleTags:['Laynie'],
   stylistSource:'laynie'
  });
  if(looks.length===2) break;
 }
 return {say:say||why,why,looks};
}
const api={NOT_CONNECTED,STORES,shift,lastWeekday,askedDate,allowedItems,focusWear,locksFrom,mustDiffer,mentionsUnaskedEvent,buildTurn,acceptModel,repair,parsePayload};
if(typeof module!=='undefined') module.exports=api;
root.StyleProLaynieCore=api;
})(typeof window!=='undefined'?window:globalThis);
