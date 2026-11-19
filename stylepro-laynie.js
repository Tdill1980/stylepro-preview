/* Laynie, the closet stylist. The key stays on the proxy. */
(()=>{
'use strict';
const Core=window.StyleProLaynieCore;
const KEY='stylepro-laynie-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let itemOverride=null, recording=null, recognition=null, browserVoice=false, busy=false;
const dialog=document.createElement('dialog');
dialog.id='sp-laynie';
dialog.setAttribute('aria-labelledby','sp-laynie-title');
document.body.append(dialog);
function read(){
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&saved.version===1)return saved;}catch{}
 return {version:1,messages:[],currentLook:null};
}
function write(state){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function proxyBase(){try{return localStorage.getItem('stylepro-proxy-base')||location.origin;}catch{return '';}}
function today(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
function calendarEvents(){
 const events=[...(window.StyleProWeek?.events?.()||[])];
 const bag=window.wardrobeStylist?.events;
 if(bag&&typeof bag==='object'){
  for(const [date,rows] of Object.entries(bag)){
   for(const row of rows||[]) events.push({...row,date,title:row.title||row.name||''});
  }
 }
 return events;
}
function context(){
 const saved=window.stylePro?.getState?.()||{wears:[]};
 const investor=window.styleProInvestor?.getState?.()||{};
 let profile={};
 try{profile=JSON.parse(localStorage.getItem('stylepro-stylist-profile-v1')||'null')||{};}catch{}
 let measurements=null;
 try{measurements=window.StyleProSeeOnMe?.readMeasurements?.(localStorage)||null;}catch{}
 return {
  today:today(),
  dna:{name:investor.name||'',baseline:investor.baseline||{stores:[],vibes:[],fits:[],avoids:[],occasions:[],custom:''},loves:profile.loves||'',dislikes:profile.dislikes||'',directions:profile.directions||[]},
  measurements,events:calendarEvents(),
  items:itemOverride||(typeof wardrobe!=='undefined'&&wardrobe&&wardrobe.items)||[],
  wears:saved.wears||[]
 };
}
function publish(looks){
 if(typeof wardrobe==='undefined'||!wardrobe||!Array.isArray(wardrobe.looks)) return;
 for(const look of looks||[]){
  const at=wardrobe.looks.findIndex(row=>row.id===look.id);
  if(at>=0) wardrobe.looks[at]=look; else wardrobe.looks.push(look);
 }
}
function lookCard(look){
 const visual=typeof lookVisual==='function'?lookVisual(look):'';
 const notes=(look.pieceNotes||[]).map(note=>{
  const item=typeof itemById==='function'?itemById(note.id):null;
  return `<li><strong>${esc(item?.name||note.id)}.</strong> ${esc(note.because)}</li>`;
 }).join('');
 return `<article class="sp-laynie-look" aria-label="Look, ${esc(look.title)}"><h3>${esc(look.title)}</h3><div class="sp-laynie-collage">${visual}</div><p>${esc(look.reasoning||look.description||'')}</p>${notes?`<ul>${notes}</ul>`:''}<button type="button" class="sp-btn primary" data-see-on-me="${esc(look.id)}" aria-label="See ${esc(look.title)} on me">See on me</button></article>`;
}
function paint(notice){
 const state=read();
 const thread=state.messages.map(row=>{
  if(row.role==='user') return `<li class="sp-laynie-you"><span class="sr-only">You said</span><p>${esc(row.content)}</p></li>`;
  const cards=(row.looks||[]).map(lookCard).join('');
  return `<li class="sp-laynie-her"><span class="sr-only">Laynie said</span><p>${esc(row.say||row.content||'')}</p>${row.why&&row.why!==row.say?`<p class="sp-laynie-why">${esc(row.why)}</p>`:''}${cards}${row.say&&row.say!==Core.NOT_CONNECTED?`<button type="button" class="sp-btn" data-laynie-replay="${esc(row.say)}">Hear reply</button>`:''}</li>`;
 }).join('');
 const disconnected=notice===Core.NOT_CONNECTED;
 dialog.innerHTML=`<div class="sp-laynie-shell"><header class="sp-laynie-bar"><div><p class="sp-kicker">Your stylist</p><h2 id="sp-laynie-title">Laynie</h2></div><button type="button" data-laynie-close aria-label="Close Laynie">×</button></header><p class="sp-laynie-status${disconnected?' is-off':''}" role="status">${esc(notice||'Laynie edits only the closet you own.')}</p><ol class="sp-laynie-thread" aria-label="Conversation with Laynie">${thread}</ol><div id="sp-laynie-live" class="sr-only" aria-live="polite"></div><form id="sp-laynie-form" class="sp-laynie-composer"><label class="sr-only" for="sp-laynie-input">Message Laynie</label><input id="sp-laynie-input" name="q" maxlength="800" autocomplete="off" placeholder="Ask Laynie"><button type="button" data-laynie-mic aria-pressed="false" aria-label="Speak to Laynie">Mic</button><button type="submit" aria-label="Send message to Laynie">Send</button></form></div>`;
 for(const button of dialog.querySelectorAll('[data-laynie-replay]')) button.onclick=()=>speak(button.dataset.laynieReplay);
 dialog.querySelector('[data-laynie-close]').onclick=()=>dialog.close();
 dialog.querySelector('#sp-laynie-form').onsubmit=ev=>{ev.preventDefault();const input=dialog.querySelector('#sp-laynie-input');const text=input.value;input.value='';submit(text);};
 dialog.querySelector('[data-laynie-mic]').onclick=()=>toggleMic();
 const live=dialog.querySelector('#sp-laynie-live');
 const last=[...state.messages].reverse().find(row=>row.role==='assistant');
 if(live&&last) live.textContent=last.say||last.content||'';
 const scroller=dialog.querySelector('.sp-laynie-thread');
 if(scroller) scroller.scrollTop=scroller.scrollHeight;
}
function setStatus(text){
 const node=dialog.querySelector('.sp-laynie-status');
 if(node){node.textContent=text;node.classList.toggle('is-off',text===Core.NOT_CONNECTED);}
 const live=dialog.querySelector('#sp-laynie-live');
 if(live) live.textContent=text;
}
async function probe(){
 const base=proxyBase();
 if(!base) return false;
 try{
  const response=await fetch(base.replace(/\/$/,'')+'/laynie',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ping:true})});
  const data=await response.json();
  return !!(data.ok&&data.connected);
 }catch{return false;}
}
function assistantText(accepted){
 const looks=(accepted.looks||[]).map(look=>look.title+': '+look.itemIds.join(', ')+'. '+look.reasoning).join(' ');
 return [accepted.say,accepted.why,looks].filter(Boolean).join(' ');
}
const speaker = new Audio();
let audioUrl = '', spokenText = '', generation = 0;
function stopReply(){
 generation++;
 speaker.pause();
 speaker.removeAttribute('src');
 if(audioUrl) URL.revokeObjectURL(audioUrl);
 audioUrl = '';
 spokenText = '';
}
dialog.addEventListener('close', stopReply);
async function speak(text){
 if(!text || text===Core.NOT_CONNECTED || !dialog.open) return;
 const reuse = audioUrl && spokenText===text;
 if(!reuse) stopReply();
 const request = ++generation;
 try {
  if(!reuse){
   const endpoint = proxyBase().replace(/\/$/,'')+'/laynie/speak';
   const response = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
   if(!response.ok || !(response.headers.get('content-type')||'').startsWith('audio/')) throw Error('voice');
   const blob = await response.blob();
   if(request!==generation) return;
   audioUrl = URL.createObjectURL(blob);
   spokenText = text;
   speaker.src = audioUrl;
  }
  speaker.currentTime = 0;
  await speaker.play();
 } catch(error){
  if(request!==generation) return;
  setStatus(error.name==='NotAllowedError'?'Tap Hear reply to play Laynie’s voice.':'Laynie’s voice is unavailable. Tap Hear reply to retry.');
 }
}
async function submit(text){
 const trimmed=String(text||'').trim();
 if(!trimmed||busy) return;
 busy=true;
 stopReply();
 const state=read();
 const turn=Core.buildTurn({...context(),text:trimmed,memory:state});
 state.messages.push({role:'user',content:trimmed,at:new Date().toISOString()});
 write(state);
 paint('Laynie is editing your closet.');
 const base=proxyBase();
 let data=null;
 if(!base) data={ok:false,code:'missing-key'};
 else{
  try{
   const response=await fetch(base.replace(/\/$/,'')+'/laynie',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:turn.system,messages:turn.messages,allowedIds:turn.allowedIds,locks:turn.locks,mustDiffer:turn.mustDiffer,previousIds:turn.previousIds,items:turn.items,pairing:turn.pairing,question:turn.question,events:(turn.events||[]).map(ev=>({title:ev.title||''}))})});
   data=await response.json();
  }catch{data={ok:false,message:'Laynie could not answer just now.'};}
 }
 const disconnected=!data.ok&&(data.code==='missing-key'||!base);
 const accepted=disconnected?{say:Core.NOT_CONNECTED,why:'',looks:[]}:Core.acceptModel(data,{items:turn.items,allowedIds:turn.allowedIds,locks:turn.locks,mustDiffer:turn.mustDiffer,previousIds:turn.previousIds,pairing:turn.pairing,question:turn.question,events:turn.events});
 if(!disconnected&&!accepted.say) accepted.say=data.message||'Laynie could not answer just now.';
 if(accepted.looks[0]) state.currentLook={id:accepted.looks[0].id,title:accepted.looks[0].title,itemIds:accepted.looks[0].itemIds.slice()};
 publish(accepted.looks);
 state.messages.push({role:'assistant',content:assistantText(accepted),say:accepted.say,why:accepted.why,looks:accepted.looks,at:new Date().toISOString()});
 state.messages=state.messages.slice(-40);
 write(state);
 busy=false;
 paint(disconnected?Core.NOT_CONNECTED:'Laynie edits only the closet you own.');
 if(!disconnected) speak(accepted.say);
 return {...accepted,connected:!disconnected,model:data.model||''};
}
function blobBase64(blob){
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=reject;reader.readAsDataURL(blob);});
}
function resetMic(button){
 button?.setAttribute('aria-pressed','false');
 button?.setAttribute('aria-label','Speak to Laynie');
 if(button) button.textContent='Mic';
}
function listenLocal(){
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 const button=dialog.querySelector('[data-laynie-mic]');
 const input=dialog.querySelector('#sp-laynie-input');
 if(!Speech){setStatus('The microphone is unavailable. Type to Laynie, or use the keyboard dictation.');input?.focus();return;}
 const rec=new Speech();
 recognition=rec;
 rec.lang='en-US';
 button?.setAttribute('aria-pressed','true');
 button?.setAttribute('aria-label','Stop listening');
 if(button) button.textContent='Stop';
 setStatus('Laynie is listening on this phone.');
 rec.onresult=ev=>{
  const transcript=ev.results&&ev.results[0]&&ev.results[0][0]&&ev.results[0][0].transcript;
  recognition=null;
  resetMic(button);
  if(!transcript) return;
  if(input) input.value=transcript;
  submit(transcript);
 };
 rec.onerror=()=>{recognition=null;resetMic(dialog.querySelector('[data-laynie-mic]'));setStatus('Laynie could not hear that. Type, or tap Mic again.');};
 try{rec.start();}catch{recognition=null;resetMic(button);setStatus('The microphone is unavailable. Type to Laynie, or use the keyboard dictation.');}
}
async function toggleMic(){
 const button=dialog.querySelector('[data-laynie-mic]');
 const input=dialog.querySelector('#sp-laynie-input');
 stopReply();
 if(recording){recording.stop();return;}
 if(recognition){try{recognition.stop();}catch{} recognition=null; resetMic(button); return;}
 if(browserVoice||!proxyBase()){listenLocal();return;}
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){listenLocal();return;}
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
 catch{listenLocal();return;}
 const rec=new MediaRecorder(stream);
 const chunks=[];
 recording=rec;
 button?.setAttribute('aria-pressed','true');
 button?.setAttribute('aria-label','Stop listening');
 if(button) button.textContent='Stop';
 setStatus('Laynie is listening.');
 rec.ondataavailable=ev=>{if(ev.data&&ev.data.size) chunks.push(ev.data);};
 rec.onstop=async()=>{
  recording=null;
  stream.getTracks().forEach(track=>track.stop());
  resetMic(button);
  const blob=new Blob(chunks,{type:rec.mimeType||'audio/webm'});
  if(!blob.size){setStatus('Laynie did not hear anything. Try again, or type.');return;}
  setStatus('Laynie is hearing you.');
  try{
   const audioBase64=await blobBase64(blob);
   const response=await fetch(proxyBase().replace(/\/$/,'')+'/laynie/hear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audioBase64,mime:blob.type||'audio/webm'})});
   const data=await response.json();
   if(!data.ok||!data.transcript){
    if(data.code==='missing-key'){setStatus(Core.NOT_CONNECTED);return;}
    if(data.code==='speech-unavailable') browserVoice=true;
    setStatus('Laynie is using this phone’s voice.');
    listenLocal();
    return;
   }
   if(input) input.value=data.transcript;
   await submit(data.transcript);
  }catch{browserVoice=true;setStatus('Laynie is using this phone’s voice.');listenLocal();}
 };
 rec.start();
}
async function open(text){
 if(!dialog.open){
  document.querySelectorAll('dialog[open]').forEach(node=>{if(node!==dialog) node.close();});
  dialog.showModal();
 }
 const connected=await probe();
 paint(connected?'Laynie edits only the closet you own.':Core.NOT_CONNECTED);
 dialog.querySelector('#sp-laynie-input')?.focus();
 if(text) await submit(text);
}
function mount(root){
 if(!root||document.getElementById('sp-laynie-card')) return;
 root.insertAdjacentHTML('afterbegin','<section id="sp-laynie-card" class="sp-laynie-card" aria-label="Laynie, your stylist"><p class="sp-kicker">Your stylist</p><h2>Laynie</h2><p>Polished, adult edits from the closet you own. She remembers the wear log, the week, and what you like.</p><button type="button" class="sp-btn primary" data-open-laynie>Talk to Laynie</button></section>');
}
document.addEventListener('click',ev=>{
 const opener=ev.target.closest?.('[data-open-laynie]');
 if(!opener) return;
 ev.preventDefault();
 open();
});
document.addEventListener('submit',ev=>{
 const form=ev.target?.id==='sp-message-stylist'?ev.target:null;
 if(!form) return;
 ev.preventDefault();
 ev.stopImmediatePropagation();
 const text=new FormData(form).get('message');
 form.reset();
 open(text);
},true);
function route(){if(location.hash==='#laynie') open();}
window.addEventListener('hashchange',route);
document.addEventListener('wardrobe-ready',route);
window.StyleProLaynie={open,ask:submit,mount,useItems(items){itemOverride=items;},read,NOT_CONNECTED:Core.NOT_CONNECTED};
})();
