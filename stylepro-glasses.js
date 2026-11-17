/* Glasses features. Phone capture works now. The glasses camera does not. */
(()=>{
'use strict';
const Core=window.StyleProPhoneCore;
function status(name){return Core.glassesFeature(name);}
function panel(name){
 const row=status(name);
 return `<section class="sp-glasses" data-glasses="${name}"><p class="sp-kicker">Glasses</p><h2>${name.replaceAll('-',' ')}</h2><p>${row.note}</p><p class="sp-note">${row.worksOnGlasses?'Glasses path is connected.':'Glasses path is not connected.'} ${row.worksOnPhone?'The phone path can run.':'Nothing runs on the glasses yet.'}</p><ul>${row.needs.map(item=>`<li>${item}</li>`).join('')}</ul></section>`;
}
async function phoneFile(){
 const input=document.createElement('input');
 input.type='file'; input.accept='image/*'; input.capture='environment';
 const file=await new Promise(resolve=>{input.onchange=()=>resolve(input.files&&input.files[0]); input.click();});
 return file||null;
}
async function cutoutFile(file){
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{const el=new Image(); el.onload=()=>resolve(el); el.onerror=()=>reject(Error('That photo could not be opened.')); el.src=url;});
  const canvas=document.createElement('canvas');
  const max=1200, scale=Math.min(1, max/Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width=Math.round(img.naturalWidth*scale); canvas.height=Math.round(img.naturalHeight*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
  const cut=StyleProSeeOnMe.removeBackground(frame.data, canvas.width, canvas.height);
  ctx.putImageData(new ImageData(cut.rgba, canvas.width, canvas.height),0,0);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  return new File([blob],'closet-scan.png',{type:'image/png'});
 }finally{URL.revokeObjectURL(url);}
}
function openScan(){
 const dialog=document.getElementById('sp-glasses-dialog')||document.body.appendChild(Object.assign(document.createElement('dialog'),{id:'sp-glasses-dialog'}));
 dialog.innerHTML=`<div class="sp-see-body">${panel('scan-to-closet')}<div class="sp-actions"><button type="button" class="sp-btn primary" data-scan-phone>Use my phone camera</button><button type="button" class="sp-btn" data-glasses-close>Not now</button></div><button type="button" class="sp-btn" data-glasses-shop>Shopping second opinion</button><button type="button" class="sp-btn" data-glasses-mirror>Mirror check</button></div>`;
 if(!dialog.open) dialog.showModal();
 dialog.querySelector('[data-glasses-close]').onclick=()=>dialog.close();
 dialog.querySelector('[data-scan-phone]').onclick=()=>{dialog.close(); scanToCloset('');};
 dialog.querySelector('[data-glasses-shop]').onclick=()=>{dialog.innerHTML=`<div class="sp-see-body">${panel('shopping-second-opinion')}<button type="button" class="sp-btn" data-glasses-close>Close</button></div>`; dialog.querySelector('[data-glasses-close]').onclick=()=>dialog.close();};
 dialog.querySelector('[data-glasses-mirror]').onclick=()=>{dialog.innerHTML=`<div class="sp-see-body">${panel('mirror-check')}<button type="button" class="sp-btn" data-glasses-close>Close</button></div>`; dialog.querySelector('[data-glasses-close]').onclick=()=>dialog.close();};
}
async function scanToCloset(transcript){
 const glasses=status('scan-to-closet');
 const hint=Core.suggestTags(transcript||'');
 sessionStorage.setItem('stylepro-scan-hint', JSON.stringify({...hint, camera:'phone', glasses:false}));
 if(typeof switchView==='function') switchView('capture');
 const file=await phoneFile();
 if(!file) return {...glasses, started:false};
 const cut=await cutoutFile(file);
 const input=document.getElementById('sc-camera-input');
 if(input&&typeof DataTransfer!=='undefined'){
  const list=new DataTransfer(); list.items.add(cut); input.files=list.files; input.dispatchEvent(new Event('change'));
 }
 return {...glasses, started:true, camera:'phone'};
}
function shoppingSecondOpinion(){return status('shopping-second-opinion');}
function mirrorCheck(){return status('mirror-check');}
function morningBriefEar(look){
 const row=status('morning-brief-ear');
 return window.StyleProPhone.morningBrief(look).then(spoken=>({...row, ...spoken}));
}
function heyMeta(text){return window.StyleProCompanion?StyleProCompanion.ask(text):(window.StyleProVanity?StyleProVanity.ask(text):{matches:[], ask:'Vanity is not loaded'});}
window.StyleProGlasses={status, panel, openScan, scanToCloset, shoppingSecondOpinion, mirrorCheck, morningBriefEar, heyMeta};
})();
