/* Rules-based stylist persona. No model. Fresh mode never uses Trish's saved key. */
(function(root){'use strict';
const PEOPLE={
 founder:{name:'Lane',initial:'L',line:'Polished and precise. She edits before she adds.',tone:'polished'},
 wraptvworld:{name:'Nova',initial:'N',line:'Camera-ready, with color when the day calls for it.',tone:'playful'},
 'play-date':{name:'June',initial:'J',line:'Easy movement. Nothing fussy.',tone:'playful'},
 gallery:{name:'Cress',initial:'C',line:'Dressier, and careful with the gold pieces.',tone:'polished'}
};
function storageKey(search){
 return /(?:^|[?&])fresh=1(?:&|$)/.test(String(search||''))?'stylepro-style-dna-fresh-v1':'stylepro-style-dna-v1';
}
function propose(archetype){
 const base=PEOPLE[archetype]||PEOPLE.founder;
 return {name:base.name,initial:base.initial,line:base.line,tone:base.tone,archetype:archetype||'founder',rules:{neverKhaki:true,noHeelsWeekdays:false}};
}
function seedTrish(){
 return {onboarded:true,step:'done',name:'Trish',archetype:'founder',persona:propose('founder')};
}
function speak(persona,kind,fact){
 const p=persona&&persona.name?persona:propose('founder');
 const n=p.name;
 const tone=p.tone||'polished';
 fact=fact||{};
 if(kind==='greet'){
  const count=Number(fact.count)||0;
  if(!count){
   if(tone==='direct') return n+': No occasions yet. Tell me the week in one sentence.';
   if(tone==='playful') return n+' here. The calendar is open. Tell me what the week holds.';
   return n+': I am ready when you are. One sentence can fill the week.';
  }
  if(tone==='direct') return n+': '+count+' occasions this week. I will dress each one.';
  if(tone==='playful') return n+' here. '+count+' occasions on your week. I can dress the busy days first.';
  return n+': Your week is mapped. One look per occasion.';
 }
 if(kind==='nudge'&&fact.title){
  const when=fact.time?' at '+fact.time:'';
  const energy=fact.energy||'Founder Energy';
  if(tone==='direct') return n+': '+fact.title+when+'. Wear the '+energy+' look.';
  if(tone==='playful') return n+': '+fact.title+when+', want the '+energy+' look?';
  return n+': '+fact.title+when+'. Shall I use the '+energy+' look?';
 }
 if(kind==='style'){
  const count=Number(fact.count)||0;
  if(tone==='direct') return n+': '+count+' looks. All from your closet.';
  if(tone==='playful') return n+' found '+count+' ways to wear what you already own.';
  return n+': Here are '+count+' looks from your closet.';
 }
 return n+': '+(fact.text||'I am here.');
}
function rulePrefs(persona,weekday){
 const rules=persona?.rules||{};
 const excluded=[];
 if(rules.neverKhaki) excluded.push('171');
 return {excludedItemIds:excluded,avoidHeels:!!(rules.noHeelsWeekdays&&weekday)};
}
const STORES=[
 {id:'whbm',name:'White House Black Market',tags:['tailored','polished','work','black'],brand:'white house black market',featured:true},
 {id:'ralph-lauren',name:'Ralph Lauren',tags:['classic','polished','preppy','navy'],brand:'ralph lauren',featured:true},
 {id:'alo',name:'Alo',tags:['active','athletic','lounge','legging'],brand:'alo',featured:true},
 {id:'lululemon',name:'Lululemon',tags:['active','athletic','ease'],brand:'lululemon',featured:true},
 {id:'free-people',name:'Free People',tags:['boho','romantic','flow'],featured:true},
 {id:'anthropologie',name:'Anthropologie',tags:['romantic','print','boho'],featured:true},
 {id:'calvin-klein',name:'Calvin Klein',tags:['minimal','denim','tailored'],brand:'calvin klein',featured:true},
 {id:'princess-polly',name:'Princess Polly',tags:['playful','trend'],featured:true},
 {id:'the-limited',name:'The Limited',tags:['tailored','work'],featured:true},
 {id:'reformation',name:'Reformation',tags:['feminine','dress']},
 {id:'zara',name:'Zara',tags:['tailored','trend']},
 {id:'madewell',name:'Madewell',tags:['denim','everyday']},
 {id:'jcrew',name:'J.Crew',tags:['classic','preppy']},
 {id:'nordstrom',name:'Nordstrom',tags:['polished']},
 {id:'revolve',name:'Revolve',tags:['trend','evening']},
 {id:'aritzia',name:'Aritzia',tags:['minimal','polished']},
 {id:'chanel',name:'Chanel',tags:['luxury','tailored'],brand:'chanel'},
 {id:'prada',name:'Prada',tags:['luxury','tailored'],brand:'prada'}
];
const AVOID={khaki:['khaki','beige mini'],neon:['neon'],logos:['logo'],heels:['heel','stiletto','pump'],mini:['mini'],'animal-print':['leopard','snake','animal']};
function fromBaseline(baseline){
 const b=baseline||{};
 const picked=STORES.filter(s=>(b.stores||[]).includes(s.id));
 const tags=[...new Set(picked.flatMap(s=>s.tags).concat(b.vibes||[],b.fits||[]))];
 const brands=picked.map(s=>s.brand||s.name.toLowerCase());
 const avoidTerms=(b.avoids||[]).flatMap(id=>AVOID[id]||[]);
 const tone=(b.vibes||[]).includes('playful')?'playful':(b.vibes||[]).includes('direct')?'direct':'polished';
 return {tags,brands,avoidTerms,neverKhaki:(b.avoids||[]).includes('khaki'),avoidHeels:(b.avoids||[]).includes('heels'),tone};
}
const api={PEOPLE,storageKey,propose,seedTrish,speak,rulePrefs,STORES,fromBaseline};
if(typeof module!=='undefined') module.exports=api;
root.StyleProPersona=api;
})(typeof window!=='undefined'?window:globalThis);
