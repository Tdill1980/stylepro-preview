/* See on Me asks the try-on proxy to drape clothes. It does not paste cutouts. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dialog=document.createElement('dialog');
dialog.id='sp-see-dialog';
dialog.setAttribute('aria-labelledby','sp-see-title');
document.body.append(dialog);
let last=null, busy=false;
try{StyleProSeeOnMe.seedMeasurements(localStorage);}catch{}
const POSE=[['leftShoulder','rightShoulder'],['leftShoulder','leftElbow'],['leftElbow','leftWrist'],['rightShoulder','rightElbow'],['rightElbow','rightWrist'],['leftShoulder','leftHip'],['rightShoulder','rightHip'],['leftHip','rightHip'],['leftHip','leftKnee'],['leftKnee','leftAnkle'],['rightHip','rightKnee'],['rightKnee','rightAnkle']];
function measurements(){try{return StyleProSeeOnMe.readMeasurements(localStorage);}catch{return {height:0};}}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(Error('That photo could not be read.')); img.src=src;});}
async function personFrame(){
 const saved=localStorage.getItem('stylepro-see-photo-v1');
 const img=await loadImage(saved||'assets/trish-photo-cutout.png');
 const max=720, scale=Math.min(1, max/Math.max(img.naturalWidth||1, img.naturalHeight||1));
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1, Math.round((img.naturalWidth||1)*scale));
 canvas.height=Math.max(1, Math.round((img.naturalHeight||1)*scale));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(img,0,0,canvas.width,canvas.height);
 return {canvas, image:ctx.getImageData(0,0,canvas.width,canvas.height), photo:canvas.toDataURL('image/png')};
}
function drawPose(canvas, pose){
 const ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle='#6e4458'; ctx.lineWidth=2; ctx.lineCap='round';
 for(const [a,b] of POSE){
  if(!pose[a]||!pose[b]) continue;
  ctx.beginPath(); ctx.moveTo(pose[a].x, pose[a].y); ctx.lineTo(pose[b].x, pose[b].y); ctx.stroke();
 }
 ctx.fillStyle='#f4e7ea';
 for(const point of Object.values(pose)){ctx.beginPath(); ctx.arc(point.x, point.y, 3.5, 0, Math.PI*2); ctx.fill();}
}
async function garmentImage(item){
 const src=item.cutout?.image||item.image; if(!src) return '';
 const img=await loadImage(src);
 const canvas=document.createElement('canvas');
 if(!item.cutout){canvas.width=img.naturalWidth; canvas.height=img.naturalHeight; canvas.getContext('2d').drawImage(img,0,0); return canvas.toDataURL('image/png');}
 const sw=img.naturalWidth/3, sh=img.naturalHeight/4;
 const sx=(item.cutout.index%3)*sw, sy=Math.floor(item.cutout.index/3)*sh;
 canvas.width=Math.max(1, Math.round(sw)); canvas.height=Math.max(1, Math.round(sh));
 canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
 return canvas.toDataURL('image/png');
}
function proxyBase(){return localStorage.getItem('stylepro-proxy-base')||'';}
async function open(id){
 if(busy||typeof lookById!=='function') return;
 const look=lookById(id); if(!look) return;
 if(window.StyleProDoll) return window.StyleProDoll.open(look);
 const measured=measurements();
 document.querySelectorAll('dialog[open]').forEach(node=>{if(node!==dialog) node.close();});
 dialog.innerHTML=`<div class="sp-see-bar"><div><p class="sp-kicker">See on me</p><h2 id="sp-see-title">${esc(look.title)}</h2></div><button type="button" data-see-close aria-label="Close">×</button></div><div class="sp-see-body"><p class="sp-note" id="sp-see-status" role="status">Dressing you…</p>${measured.height?'':'<p class="sp-note">Add your height once so the scan can set length.</p>'}<label class="sp-field">Your photo<input id="sp-see-file" type="file" accept="image/*"></label><div class="sp-see-stage" hidden><img class="sp-see-person" alt=""><canvas class="sp-see-pose" aria-hidden="true"></canvas></div><p class="sp-note" id="sp-see-honest"></p></div>`;
 if(!dialog.open) dialog.showModal();
 dialog.querySelector('[data-see-close]').onclick=()=>dialog.close();
 dialog.querySelector('#sp-see-file').onchange=async ev=>{
  const file=ev.target.files?.[0]; if(!file) return;
  const img=await loadImage(URL.createObjectURL(file));
  const max=720, scale=Math.min(1, max/Math.max(img.naturalWidth, img.naturalHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.round(img.naturalWidth*scale); canvas.height=Math.round(img.naturalHeight*scale);
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  try{localStorage.setItem('stylepro-see-photo-v1', canvas.toDataURL('image/jpeg',0.85));}catch{}
  paint(look);
 };
 if(measured.height) paint(look);
 else dialog.querySelector('#sp-see-status').textContent='Height is needed before a try-on.';
}
async function paint(look){
 if(busy) return;
 busy=true;
 const status=dialog.querySelector('#sp-see-status');
 const honest=dialog.querySelector('#sp-see-honest');
 const stage=dialog.querySelector('.sp-see-stage');
 status.textContent='Dressing you…';
 honest.textContent='';
 try{
  const frame=await personFrame();
  const body=StyleProBodyScan.scan(frame.image.data, frame.canvas.width, frame.canvas.height, measurements());
  const fits=[];
  for(const id of look.pieces){
   const item=itemById(id); if(!item) continue;
   const fit=StyleProBodyScan.fitGarment(body, {id, role:StyleProCore.role(item), name:item.name, description:item.description, styleTags:item.styleTags});
   if(!fit) continue;
   fit.garmentImage=await garmentImage(item);
   fits.push(fit);
  }
  const plan=StyleProTryOn.steps(fits);
  stage.hidden=false;
  stage.style.setProperty('--ratio', frame.canvas.width+' / '+frame.canvas.height);
  const photo=stage.querySelector('.sp-see-person');
  photo.src=frame.photo;
  photo.alt='Trish, body scan only. Clothes have not been draped.';
  const overlay=stage.querySelector('.sp-see-pose');
  overlay.width=frame.canvas.width; overlay.height=frame.canvas.height;
  drawPose(overlay, body.pose);
  stage.dataset.scanSource=body.source;
  stage.dataset.dressed='false';
  stage.dataset.tryon='unavailable';
  const base=proxyBase();
  if(!base){
   status.textContent='AI fitting not connected yet';
   honest.textContent='AI fitting not connected yet';
   last={lookId:look.id, draped:false, scan:body.source, steps:plan.map(step=>({id:step.id, category:step.category, length:step.length, anchor:step.anchor})), secret:StyleProTryOn.SECRET};
   return;
  }
  let modelImage=frame.photo, draped=null;
  for(const step of plan){
   status.textContent='Dressing you… '+step.category;
   const response=await fetch(base.replace(/\/$/,'')+'/tryon', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({step, modelImage})});
   const result=await response.json();
   if(!result.ok){
    status.textContent='Try-on did not run.';
    honest.textContent=result.code==='missing-key'?`${result.secret} is not set. The body scan is ready. No clothes were pasted on this photo.`:(result.message||'The try-on model did not return a photo.');
    last={lookId:look.id, draped:false, scan:body.source, steps:plan.map(s=>({id:s.id, category:s.category, length:s.length, anchor:s.anchor})), secret:result.secret||StyleProTryOn.SECRET};
    return;
   }
   modelImage=result.image; draped=result;
  }
  photo.src=modelImage;
  photo.alt='Trish wearing the try-on result.';
  overlay.hidden=true;
  stage.dataset.dressed='true';
  stage.dataset.tryon='fashn';
  try{
   const key='stylepro-tryon-days-v1';
   const saved=JSON.parse(localStorage.getItem(key)||'{}');
   const today=new Date(); today.setMinutes(today.getMinutes()-today.getTimezoneOffset());
   saved[today.toISOString().slice(0,10)]=modelImage;
   localStorage.setItem(key, JSON.stringify(saved));
  }catch{}
  status.textContent='Dressed.';
  last={lookId:look.id, draped:true, scan:body.source, image:modelImage, provider:draped&&draped.model};
 }catch(err){
  status.textContent='Try-on did not run.';
  honest.textContent=err.message;
 }finally{busy=false;}
}
window.StyleProSeeOnMeUI={open, last:()=>last};
})();
