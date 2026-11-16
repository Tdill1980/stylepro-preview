/* Trish's real week, Nov 16–22 2026, Phoenix. Spoken into the stylist; venues stay off the outfit card. */
(function(root){'use strict';
const F=typeof module!=='undefined'?require('./stylepro-formula-core.js'):root.StyleProFormula;
const START='2026-11-16';
const SPOKEN='This week, Monday through Sunday. Monday I have numbers review at 8am, educate and the flywheel message at 9, a text to Carley at 11, and writing demo scripts at 1, that one is tentative. Tuesday is Danze Jam at 9:30 at Life Time Happy Valley, then filming DesignPro at 10:30, tentative, a WrapTV work session at noon, tentative, and Toastmasters at 5:15 at Platinum Toastmasters. Wednesday is DesignPro proof day at 9 and a campaign decision at 11. Thursday is the WOTW anchor at 9, a Meta decision at 11, and filming DesignPro day two at 11:30, tentative. Friday is open. Saturday is Pumpkins and Planks at 11 in Mesa. Sunday I stage next week at 4.';
const RAW=[
 {date:'2026-11-16',title:'Numbers Review',start:'08:00',end:'08:30',energyId:'founder',mode:'change'},
 {date:'2026-11-16',title:'Monday Educate + Flywheel Message',start:'09:00',end:'10:30',energyId:'founder',mode:'transition'},
 {date:'2026-11-16',title:'Text Carley about Danze Jam',start:'11:00',end:'11:15',kind:'reminder'},
 {date:'2026-11-16',title:'Write demo scripts',start:'13:00',end:'14:30',energyId:'founder',mode:'transition',tentative:true},
 {date:'2026-11-17',title:'Danze Jam',start:'09:30',end:'10:15',energyId:'active',mode:'change',venue:'Life Time Happy Valley-Peoria'},
 {date:'2026-11-17',title:'Filming, DesignPro demos day 1',start:'10:30',end:'12:00',energyId:'founder',mode:'change',tentative:true,onCamera:true},
 {date:'2026-11-17',title:'Work session, WrapTVWorld + DesignProAI',start:'12:00',end:'14:00',energyId:'wraptvworld',mode:'transition',tentative:true},
 {date:'2026-11-17',title:'Toastmasters first visit',start:'17:15',end:'18:15',energyId:'speaking',mode:'change',venue:'Platinum Toastmasters, Fairchild Freight, Phoenix',note:'Arrive 5:00'},
 {date:'2026-11-18',title:'DesignPro Proof Day',start:'09:00',end:'10:30',energyId:'founder',mode:'change',onCamera:true},
 {date:'2026-11-18',title:'Decision: fix campaign keep or kill',start:'11:00',end:'11:30',kind:'reminder'},
 {date:'2026-11-19',title:'WOTW Anchor',start:'09:00',end:'10:30',energyId:'founder',mode:'change',onCamera:true},
 {date:'2026-11-19',title:'Decide Meta Skyler return',start:'11:00',end:'11:30',kind:'reminder'},
 {date:'2026-11-19',title:'Filming, DesignPro demos day 2',start:'11:30',end:'14:30',energyId:'founder',mode:'transition',tentative:true,onCamera:true},
 {date:'2026-11-20',title:'',kind:'suggested',energyId:'play-date',mode:'suggested'},
 {date:'2026-11-21',title:'Pumpkins And Planks',start:'11:00',end:'14:00',energyId:'play-date',mode:'change',venue:'Mesa'},
 {date:'2026-11-22',title:'Stage Next Week',start:'16:00',end:'16:30',energyId:'founder',mode:'change'}
];
function clockLabel(t){if(!t)return '';let [h,m]=t.split(':').map(Number);const ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+String(m).padStart(2,'0')+' '+ap;}
function when(ev){return ev.start?(clockLabel(ev.start)+(ev.end?'–'+clockLabel(ev.end):'')):'';}
function events(){return RAW.map((ev,i)=>({...ev,id:'week-'+i,kind:ev.kind||'outfit',tentative:!!ev.tentative,venue:ev.venue||''}));}
function dress(items,looks){
 const formulas=F.seedFormulas(items||[]);
 const hero=(looks||[]).find(l=>l.id==='131');
 let carried=null;
 return events().map(ev=>{
  if(ev.kind==='reminder') return {...ev,outfit:null};
  if(ev.kind==='suggested'){
   const outfit=F.composeOutfits(items,{energyId:ev.energyId})[0]||{id:'suggested',title:'Suggested look',pieces:[],source:'composed'};
   return {...ev,title:'Suggested look',outfit,mode:'suggested'};
  }
  if(ev.mode==='transition'&&carried) return {...ev,outfit:carried,mode:'transition'};
  if(ev.date==='2026-11-16'&&ev.energyId==='founder'&&hero){
   carried={id:hero.id,title:hero.title,pieces:hero.pieces.slice(),source:'portrait'};
   return {...ev,outfit:carried,mode:ev.mode};
  }
  const formula=formulas.find(f=>f.energy_id===ev.energyId)||formulas[0];
  const applied=F.applyFormula(formula,{items,energyId:ev.energyId,onCamera:!!ev.onCamera});
  carried=applied.outfit;
  return {...ev,outfit:applied.outfit,mode:ev.mode};
 });
}
function cards(dressed){
 const days=[];
 for(const ev of dressed){
  let day=days.find(d=>d.date===ev.date);
  if(!day){day={date:ev.date,events:[],looks:[]};days.push(day);}
  if(ev.kind!=='suggested') day.events.push({time:when(ev),name:ev.title,venue:ev.venue,tentative:ev.tentative,reminder:ev.kind==='reminder',note:ev.note||''});
  if(ev.outfit&&!day.looks.some(l=>l.id===ev.outfit.id&&l.forEvent===ev.title)){
   day.looks.push({id:ev.outfit.id,title:ev.outfit.title,pieces:ev.outfit.pieces,energyId:ev.energyId,mode:ev.mode,forEvent:ev.title,tentative:ev.tentative});
  }
 }
 return days;
}
const api={START,SPOKEN,events,dress,cards,clockLabel};
if(typeof module!=='undefined') module.exports=api;
root.StyleProWeek=api;
})(typeof window!=='undefined'?window:globalThis);
