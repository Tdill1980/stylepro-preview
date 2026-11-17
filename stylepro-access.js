/* Accessible mode. Text and speech carry what the photos show. */
(()=>{
'use strict';
const KEY='stylepro-access-v1';
const SCANS='stylepro-access-scans-v1';
const Core=window.StyleProAccessCore;
let last={short:'', more:''}, pending=null;
function describe(item){return Core.describe(item);}
function describeLook(look){
 const pieces=(look.pieces||[]).map(id=>wardrobe.items.find(item=>item.id===id)).filter(Boolean);
 return `${look.title}. ${pieces.map(describe).join(' ')}`;
}
function buzz(kind){
 const pattern=kind==='saved'?[20,40,20,40,20]:kind==='match'?[15,40,15]:[80];
 if(window.StyleProPhone?.haptic) window.StyleProPhone.haptic(kind==='saved'?'save':kind==='match'?'rate':'swipe');
 if(navigator.vibrate) navigator.vibrate(pattern);
}
function speak(text){
 const live=document.getElementById('sp-access-live');
 if(live) live.textContent=text;
 if(window.speechSynthesis){window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));}
}
function command(text){
 const q=String(text||'').toLowerCase();
 if(/tell me more/.test(q)) return last.more||'There is no longer answer yet.';
 if(/yes,?\s+save/.test(q)&&pending){
  const rows=JSON.parse(localStorage.getItem(SCANS)||'[]');
  rows.push({...pending, confirmed:true, at:new Date().toISOString()});
  localStorage.setItem(SCANS, JSON.stringify(rows));
  pending=null; buzz('saved');
  return 'Saved on this phone. It is not in My Closet until you confirm it there too.';
 }
 if(window.StyleProCompanion&&/i'm wearing|i am wearing|\bwore\b|go with|what about|last\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|undo that wear/.test(q)){
  const result=StyleProCompanion.ask(text);
  last={short:result.short, more:result.more||''};
  buzz(result.log?'saved':result.match?'match':'nomatch');
  return result.short;
 }
 if(/should i buy/.test(q)){window.StyleProBuy?.open(); return 'Opening Should I Buy. The verdict will be read aloud.';}
 if(/what is this|what goes with/.test(q)){
  const result=Core.whatIsThis(q, wardrobe.items, wardrobe.looks);
  last=result; buzz(result.match?'match':'nomatch'); return result.short;
 }
 if(/what should i wear|dress me/.test(q)){
  const occasion=/dinner|work|weekend|party|today/.exec(q)?.[0]||'today';
  const result=Core.dressMe(occasion==='today'?'dinner':occasion, wardrobe.items, wardrobe.looks);
  last=result; buzz(result.match?'match':'nomatch'); return result.short;
 }
 if(/find my/.test(q)){
  const result=Core.find(q, wardrobe.items, {});
  last=result; buzz(result.match?'match':'nomatch'); return result.short;
 }
 if(/scan/.test(q)){
  const result=Core.scanDraft(q);
  pending=result.pending; last=result; return result.short;
 }
 if(/does this match/.test(q)) return 'Say what you are holding, or use Should I Buy. The phone camera opens only when you ask. The glasses camera is not connected.';
 return 'Try: what is this, dress me for dinner, find my burgundy jeans, or scan a piece.';
}
function apply(on){
 document.body.classList.toggle('sp-access', on);
 localStorage.setItem(KEY, on?'1':'0');
 const button=document.getElementById('sp-access-toggle');
 if(button) button.setAttribute('aria-pressed', String(on));
 const panel=document.getElementById('sp-access-panel');
 if(!panel) return;
 panel.hidden=!on;
 if(!on) return;
 const sample=wardrobe.items.filter(StyleProCore.owned).slice(0,3);
 const look=wardrobe.looks[0];
 panel.innerHTML=`<h2>Accessible mode</h2><p>Milestone 1 on this phone. A short answer comes first. Say tell me more for the rest. Nothing is saved until you say yes, save it.</p><form id="sp-access-command"><label class="sp-field">Command<input name="q" placeholder="what should I wear to dinner"></label><button class="sp-btn" type="button" data-access-voice>Speak</button><button class="sp-btn primary" type="submit">Go</button></form><div id="sp-access-answer" role="status" aria-live="polite"></div><h3>Pieces in words</h3><ul>${sample.map(item=>`<li>${describe(item)}</li>`).join('')}</ul><h3>A look in words</h3><p>${look?describeLook(look):''}</p>`;
 const form=panel.querySelector('form');
 const run=value=>{const text=command(value); panel.querySelector('#sp-access-answer').textContent=text; speak(text);};
 form.onsubmit=ev=>{ev.preventDefault(); run(new FormData(form).get('q'));};
 form.querySelector('[data-access-voice]').onclick=()=>{
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){form.elements.q.focus(); return;}
  const rec=new Speech(); rec.lang='en-US'; rec.onresult=ev=>{form.elements.q.value=ev.results[0][0].transcript; run(form.elements.q.value);}; rec.start();
 };
}
function mount(root){
 if(document.getElementById('sp-access-toggle')) return;
 const button=document.createElement('button');
 button.id='sp-access-toggle'; button.type='button'; button.className='sp-btn';
 button.textContent='Accessible mode';
 button.setAttribute('aria-pressed', localStorage.getItem(KEY)==='1'?'true':'false');
 button.setAttribute('aria-label','Accessible mode for blind and low-vision use');
 const live=document.createElement('div');
 live.id='sp-access-live'; live.className='sr-only'; live.setAttribute('aria-live','polite');
 const panel=document.createElement('section');
 panel.id='sp-access-panel'; panel.hidden=true; panel.setAttribute('aria-label','Accessible mode');
 button.onclick=()=>apply(button.getAttribute('aria-pressed')!=='true');
 root.prepend(panel); root.prepend(live); root.prepend(button);
 if(localStorage.getItem(KEY)==='1') apply(true);
}
window.StyleProAccess={describe, describeLook, command, mount, speak};
})();
