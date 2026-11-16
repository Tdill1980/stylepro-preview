/* Show-me onboarding: archetype, this-or-that, and occasion slots. No quiz required. */
(function(root){'use strict';
const T=typeof module!=='undefined'?require('./stylepro-taste-core.js'):root.StyleProTaste;
const F=typeof module!=='undefined'?require('./stylepro-formula-core.js'):root.StyleProFormula;
const SLOTS=[
 {id:'founder-demo',name:'Founder demo (office)',energyId:'founder'},
 {id:'source-podcast',name:'Source podcast',energyId:'founder'},
 {id:'wraptv-filming',name:'WrapTV filming',energyId:'wraptvworld'}
];
const ARCHETYPES=[
 {id:'founder',name:'Founder Energy',proven:true,note:'The closest starting point for office, demo, and speaking days.'},
 {id:'wraptvworld',name:'Wraptvworld',proven:true,note:'Color and camera energy from the Wrap TV pieces on record.'},
 {id:'play-date',name:'Play date',proven:true,note:'Easier movement, without defaulting to the beige mini skirt.'},
 {id:'gallery',name:'Gallery',proven:true,note:'The dressier gold register, including recorded luxury bags.'}
];
function startingArchetype(){return ARCHETYPES[0];}
function deck(looks,limit=20){
 return (looks||[]).filter(l=>l&&!l.neural&&Array.isArray(l.pieces)&&l.pieces.length)
  .slice().sort((a,b)=>String(a.id).localeCompare(String(b.id),undefined,{numeric:true})).slice(0,limit);
}
function pairs(list){const out=[];for(let i=0;i+1<list.length;i+=2) out.push([list[i],list[i+1]]);return out;}
function piecesOf(look,items){const by=new Map((items||[]).map(i=>[i.id,i]));return (look?.pieces||[]).map(id=>by.get(id)).filter(Boolean);}
function learnChoice(profile,chosen,rejected,items,slot){
 const sig=look=>[...(look?.pieces||[])].sort().join('|');
 let next=T.rate(profile||T.blank(),{type:'look',items:piecesOf(chosen,items),stars:5,id:chosen?.id,signature:sig(chosen),slot});
 if(rejected) next=T.rate(next,{type:'look',items:piecesOf(rejected,items),stars:2,id:rejected.id,signature:sig(rejected),slot});
 return next;
}
function slotTaste(profile,slotId){return profile?.slots?.[slotId]||profile||T.blank();}
function recommend(slot,items,profile,locked){
 const taste=slotTaste(profile,slot.id);
 if(locked?.locked) return F.applyFormula(locked,{items,taste,energyId:slot.energyId});
 const formula=F.seedFormulas(items).find(f=>f.energy_id===slot.energyId);
 return F.applyFormula(formula,{items,taste,energyId:slot.energyId});
}
function lockFormula(slot,outfit){
 return {id:'locked:'+slot.id,energy_id:slot.energyId,name:slot.name,item_ids:[...(outfit?.pieces||[])],references:[],locked:true,notes:'Locked from an approved occasion slot. A later edit can replace it.',season:'all'};
}
function optionalQuestions(){
 return [
  {id:'climate',prompt:'Climate you dress in most',optional:true},
  {id:'size',prompt:'Size range, if you want swaps to respect it',optional:true},
  {id:'swap',prompt:'Open to prototype swaps',optional:true}
 ];
}
const api={SLOTS,ARCHETYPES,startingArchetype,deck,pairs,learnChoice,recommend,lockFormula,slotTaste,optionalQuestions};
if(typeof module!=='undefined') module.exports=api;
root.StyleProOnboarding=api;
})(typeof window!=='undefined'?window:globalThis);
