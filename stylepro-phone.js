/* Installable-phone helpers: haptics, voice, offline doll cache, week pre-render. */
(()=>{
'use strict';
const Core=window.StyleProPhoneCore;
const CACHE='stylepro-doll-renders-v1';
function reduced(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
function native(){return !!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());}
async function haptic(kind){
 if(reduced()) return {ok:false, reason:'reduced-motion'};
 const H=window.Capacitor?.Plugins?.Haptics;
 if(H){
  try{await H.impact({style:kind==='save'||kind==='rate'?'MEDIUM':'LIGHT'}); return {ok:true, via:'capacitor'};}catch{}
 }
 if(navigator.vibrate){navigator.vibrate(kind==='rate'?[12,30,12]:12); return {ok:true, via:'vibrate'};}
 return {ok:false, reason:'unsupported', note:'This browser has no vibration. The iOS and Android app uses Capacitor Haptics.'};
}
async function storeRender(id, dataUrl){
 if(!id||!dataUrl||!('caches' in window)) return false;
 try{
  const cache=await caches.open(CACHE);
  await cache.put(new Request('./doll-render/'+encodeURIComponent(id)), new Response(dataUrl,{headers:{'content-type':'text/plain'}}));
  return true;
 }catch{return false;}
}
async function cachedRender(id){
 if(!id||!('caches' in window)) return '';
 try{
  const cache=await caches.open(CACHE);
  const hit=await cache.match('./doll-render/'+encodeURIComponent(id));
  return hit?await hit.text():'';
 }catch{return '';}
}
function prewarmWeek(looks){
 const slice=Core.weekSlice(looks);
 const run=()=>window.StyleProDoll?.prewarm?.(slice.week);
 if('requestIdleCallback' in window) requestIdleCallback(()=>run(),{timeout:4000});
 else setTimeout(run,600);
 return slice;
}
function bindVoice(form){
 if(!form||form.querySelector('[data-voice-stylist]')) return;
 const input=form.elements.message; if(!input) return;
 const button=document.createElement('button');
 button.type='button'; button.className='sp-voice-btn'; button.dataset.voiceStylist='true';
 button.textContent='Speak'; button.setAttribute('aria-label','Speak to your stylist');
 form.insertBefore(button, form.querySelector('button[type="submit"]')||null);
 let active=null;
 button.onclick=()=>{
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){input.focus(); input.placeholder='Type to your stylist. Voice input is not available in this browser.'; return;}
  if(active){active.stop(); return;}
  const rec=new Speech(); active=rec; rec.lang='en-US'; rec.interimResults=true;
  button.setAttribute('aria-pressed','true');
  rec.onresult=ev=>{input.value=Array.from(ev.results).map(row=>row[0].transcript).join(' ');};
  const stop=()=>{active=null; button.setAttribute('aria-pressed','false');};
  rec.onerror=stop; rec.onend=stop; rec.start();
 };
}
async function morningBrief(look){
 const title=look?.title||'No look is ready for tomorrow yet';
 const text=look?`Tomorrow: ${title}. It is already on your doll.`:'Tomorrow’s look is not ready yet.';
 if(window.speechSynthesis){window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));}
 return {text, heard:!!window.speechSynthesis, push:false, note:'Read on this phone. A push to the lock screen needs the native app, Apple push or Firebase, and a sender you control.'};
}
async function enablePush(){
 const Push=window.Capacitor?.Plugins?.PushNotifications;
 if(!native()||!Push) return {ok:false, reason:'not-native', note:'Push for the morning brief is only available in the installed iOS or Android app, after Apple push and Firebase are configured.'};
 const perm=await Push.requestPermissions();
 if(perm.receive!=='granted') return {ok:false, reason:'denied'};
 await Push.register();
 return {ok:true, note:'The device token stays on this phone until a brief sender is connected. No notification has been sent.'};
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('button'); if(!b) return;
 if(b.hasAttribute('data-sp-save')) haptic('save');
 else if(b.hasAttribute('data-sp-feedback')||b.hasAttribute('data-fit-stars')||b.hasAttribute('data-verdict')) haptic('rate');
});
document.addEventListener('pointerup',ev=>{
 if(ev.pointerType==='touch'&&ev.target.closest('.sp-grid,.sp-week-strip,.sp-runway')) haptic('swipe');
});
window.StyleProPhone={haptic, storeRender, cachedRender, prewarmWeek, bindVoice, morningBrief, enablePush, native};
})();
