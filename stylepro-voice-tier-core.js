/* Voice-tier picker. List prices only. No billing, no provider keys, no audio. */
(function(root){'use strict';
const TIERS=[
 {id:'free',name:'Free',priceCents:0,priceLabel:'$0',line:'Agenda, closet, Style DNA, and a text stylist. Optional voice typing, no spoken reply.',cap:'30 text turns a day, then slower replies.',spokenMinutes:0},
 {id:'plus',name:'Plus',priceCents:1200,priceLabel:'$12/mo',line:'The stylist talks back.',cap:'120 spoken minutes a month.',spokenMinutes:120},
 {id:'premium',name:'Premium',priceCents:2400,priceLabel:'$24/mo',line:'A live talking stylist, including the agenda.',cap:'300 live minutes a month.',spokenMinutes:300,recommended:true,trialDays:7,trialMinutes:30}
];
const PRIVACY='The microphone is asked for only when a live session starts. This preview does not open it. Audio is not stored, and nothing leaves this device.';
function tierById(id){return TIERS.find(t=>t.id===id)||null;}
function choice(id,mode,now){
 const tier=tierById(id);
 if(!tier) return null;
 const trial=id==='premium'&&mode==='trial';
 return {
  id:tier.id,
  name:tier.name,
  mode:trial?'trial':'chosen',
  priceCents:tier.priceCents,
  spokenMinutes:tier.spokenMinutes,
  trialDays:trial?tier.trialDays:null,
  trialMinutes:trial?tier.trialMinutes:null,
  billing:'not-connected',
  chosenAt:now||null,
  showBadge:tier.id==='premium'
 };
}
function choose(id,now){return choice(id,'chosen',now);}
function startTrial(now){return choice('premium','trial',now);}
function demo(){
 return {
  connected:false,
  opensMicrophone:false,
  privacy:PRIVACY,
  lines:[
   {role:'you',text:'Tuesday: Danze Jam, then filming, then Toastmasters.'},
   {role:'stylist',text:'Danze Jam stays active. Filming DesignPro moves to Founder, on camera. Toastmasters is polished speaking, so the look changes again.'}
  ]
 };
}
const api={TIERS,PRIVACY,tierById,choose,startTrial,demo};
if(typeof module!=='undefined') module.exports=api;
root.StyleProVoiceTier=api;
})(typeof window!=='undefined'?window:globalThis);
