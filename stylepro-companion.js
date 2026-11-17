/* Phone thread for the one stylist. Glasses and accessible mode call ask(). */
(()=>{
'use strict';
const KEY='stylepro-companion-v1';
const Core=window.StyleProCompanionCore;
function read(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&saved.version===1)return saved;}catch{}return {version:1,messages:[],memory:{}};}
function write(state){localStorage.setItem(KEY,JSON.stringify(state));}
function persona(){return window.styleProInvestor?.persona?.()||Core.personaOf(null);}
function today(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
function contextLook(){
 const card=document.querySelector('#stylepro-today [data-sp-card]');
 const id=card&&card.getAttribute('data-sp-card');
 return (typeof wardrobe!=='undefined'&&wardrobe?.looks||[]).find(look=>look.id===id)||null;
}
function ask(text){
 const state=read();
 const closet=typeof wardrobe!=='undefined'&&wardrobe?wardrobe:{items:[],looks:[]};
 const saved=window.stylePro?.getState?.()||{wears:[],feedback:{}};
 const result=Core.turn({text,today:today(),wears:saved.wears||[],items:closet.items,looks:closet.looks,persona:persona(),memory:state.memory||{},feedback:saved.feedback||{},vanity:window.StyleProVanity?.all?.()||[],contextLook:contextLook()});
 state.memory=result.memory||{};
 if(result.log&&window.stylePro?.logChosen){
  const logged=window.stylePro.logChosen(result.log.lookId,result.log.date,result.log.event,result.log.source||'voice');
  const row=logged&&logged.added&&logged.wears&&logged.wears[logged.wears.length-1];
  if(row){row.title=result.log.title;state.memory.lastLogId=row.id;write(state);}
 }
 if(result.undo&&window.stylePro?.undoWear) window.stylePro.undoWear(result.undo);
 state.messages.push({role:'you',text:String(text||''),at:new Date().toISOString()});
 state.messages.push({role:'stylist',text:result.short,at:new Date().toISOString()});
 state.messages=state.messages.slice(-40);
 write(state);
 return result;
}
function speak(text){
 const live=document.getElementById('sp-companion-live');
 if(live) live.textContent=text;
 if(window.speechSynthesis){window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));}
}
function paint(panel){
 const state=read();
 const who=persona();
 const thread=state.messages.map(row=>`<li class="${row.role==='you'?'sp-companion-you':'sp-companion-stylist'}"><span class="sr-only">${row.role==='you'?'You':'Stylist'}</span> ${row.text}</li>`).join('');
 panel.innerHTML=`<p class="sp-kicker">Always with you</p><h2>${who.name}</h2><p>${who.line||''}</p><p class="sp-note">Same stylist on the phone, by voice, and later on the glasses. A plan is not a wear.</p><ol id="sp-companion-thread">${thread}</ol><form id="sp-companion-form"><label class="sp-field">Talk to ${who.name}<input name="q" placeholder="Last Tuesday I wore this, what would go with it?"></label><button class="sp-btn" type="button" data-companion-voice>Speak</button><button class="sp-btn primary" type="submit">Send</button></form><div id="sp-companion-live" class="sr-only" aria-live="polite"></div>`;
 const form=panel.querySelector('form');
 const run=value=>{const result=ask(value);paint(panel);speak(result.short);};
 form.onsubmit=ev=>{ev.preventDefault();run(new FormData(form).get('q'));};
 form.querySelector('[data-companion-voice]').onclick=()=>{
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){form.elements.q.focus();return;}
  const rec=new Speech(); rec.lang='en-US'; rec.onresult=ev=>{form.elements.q.value=ev.results[0][0].transcript;run(form.elements.q.value);}; rec.start();
 };
}
function mount(root){
 if(!root||document.getElementById('sp-companion')) return;
 const panel=document.createElement('section');
 panel.id='sp-companion'; panel.setAttribute('aria-label','Your stylist');
 root.prepend(panel); paint(panel);
}
window.StyleProCompanion={ask,mount,persona};
})();
