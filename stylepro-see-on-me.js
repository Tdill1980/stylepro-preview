/* See on Me: one tap dresses the saved portrait, or a photo you upload. */
(()=>{
'use strict';
const S=window.StyleProSeeOnMe;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dialog=document.createElement('dialog');
dialog.id='sp-see-dialog';
dialog.setAttribute('aria-labelledby','sp-see-title');
document.body.append(dialog);
let photoUrl='', last=null, busy=false;
function measurements(){
 try{return S.readMeasurements(localStorage);}catch{return {height:0,bust:0,waist:0,hip:0,inseam:0};}
}
function field(name, label, value, required){
 return `<label class="sp-field">${label}<input name="${name}" inputmode="decimal" maxlength="5" value="${value?esc(value):''}" ${required?'required':''} placeholder="${required?'Inches':'Optional'}"></label>`;
}
function formHTML(m){
 return `<form id="sp-see-measures"><p class="sp-kicker">Your measurements</p><p class="sp-note">Entered once. Height calibrates placement. Bust, waist, hip and inseam are optional.</p><div class="sp-see-measures">${field('height','Height',m.height,true)}${field('bust','Bust',m.bust)}${field('waist','Waist',m.waist)}${field('hip','Hip',m.hip)}${field('inseam','Inseam',m.inseam)}</div><button class="sp-btn primary" type="submit">Save measurements</button></form>`;
}
function loadImage(src){
 return new Promise((resolve,reject)=>{
  const img=new Image();
  img.onload=()=>resolve(img);
  img.onerror=()=>reject(Error('That photo could not be read.'));
  img.src=src;
 });
}
async function sampleFrame(){
 const saved=localStorage.getItem('stylepro-see-photo-v1');
 const img=await loadImage(saved||'assets/trish-photo-cutout.png');
 const max=720, scale=Math.min(1, max/Math.max(img.naturalWidth||1, img.naturalHeight||1));
 const w=Math.max(1, Math.round((img.naturalWidth||1)*scale));
 const h=Math.max(1, Math.round((img.naturalHeight||1)*scale));
 const canvas=document.createElement('canvas');
 canvas.width=w; canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!saved){ctx.fillStyle='#6ea8ff'; ctx.fillRect(0,0,w,h);}
 ctx.drawImage(img,0,0,w,h);
 return {image:ctx.getImageData(0,0,w,h), width:w, height:h, sample:!saved};
}
async function garmentBox(item){
 const src=item.cutout?.image||item.image;
 if(!src) return {width:3, height:4};
 const img=await loadImage(src);
 if(!item.cutout) return {width:img.naturalWidth||1, height:img.naturalHeight||1, image:img, sx:0, sy:0, sw:img.naturalWidth, sh:img.naturalHeight};
 const sw=img.naturalWidth/3, sh=img.naturalHeight/4;
 const sx=(item.cutout.index%3)*sw, sy=Math.floor(item.cutout.index/3)*sh;
 const chip=document.createElement('canvas');
 chip.width=Math.max(1, Math.round(sw)); chip.height=Math.max(1, Math.round(sh));
 const ctx=chip.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(img, sx, sy, sw, sh, 0, 0, chip.width, chip.height);
 const data=ctx.getImageData(0,0,chip.width,chip.height).data;
 let minX=chip.width, minY=chip.height, maxX=0, maxY=0, seen=0;
 for(let y=0;y<chip.height;y++) for(let x=0;x<chip.width;x++){
  if(data[(y*chip.width+x)*4+3]<20) continue;
  seen++;
  if(x<minX) minX=x; if(x>maxX) maxX=x; if(y<minY) minY=y; if(y>maxY) maxY=y;
 }
 if(!seen) return {width:chip.width, height:chip.height, image:img, sx, sy, sw, sh};
 return {width:maxX-minX+1, height:maxY-minY+1, image:img, sx:sx+minX*(sw/chip.width), sy:sy+minY*(sh/chip.height), sw:(maxX-minX+1)*(sw/chip.width), sh:(maxY-minY+1)*(sh/chip.height)};
}
async function open(id){
 if(busy||typeof lookById!=='function') return;
 const look=lookById(id);
 if(!look) return;
 const measured=measurements();
 document.querySelectorAll('dialog[open]').forEach(node=>{if(node!==dialog) node.close();});
 dialog.innerHTML=`<div class="sp-see-bar"><div><p class="sp-kicker">See on me</p><h2 id="sp-see-title">${esc(look.title)}</h2></div><button type="button" data-see-close aria-label="Close">×</button></div><div class="sp-see-body">${measured.height?`<p class="sp-note" id="sp-see-status">Placing the full outfit…</p>`:formHTML(measured)+'<p class="sp-note">Save your height, then this look dresses the photo in one tap.</p>'}<label class="sp-field">Your photo<input id="sp-see-file" type="file" accept="image/*"></label><div class="sp-see-stage" hidden></div><p class="sp-note">Pieces keep their own proportions. This is your photo with the background removed, not a fit simulation.</p></div>`;
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
  if(measurements().height) paint(look);
 };
 dialog.querySelector('#sp-see-measures')?.addEventListener('submit',ev=>{
  ev.preventDefault();
  const fd=new FormData(ev.target);
  try{
   S.saveMeasurements(Object.fromEntries(fd.entries()), localStorage);
   open(id);
  }catch(err){toast(err.message);}
 });
 if(measured.height) paint(look);
}
async function paint(look){
 if(busy) return;
 busy=true;
 const status=dialog.querySelector('#sp-see-status');
 try{
  const frame=await sampleFrame();
  const garments=[];
  for(const id of look.pieces){
   const item=itemById(id);
   if(!item) continue;
   const box=await garmentBox(item);
   garments.push({id, role:StyleProCore.role(item), width:box.width, height:box.height, source:box});
  }
  const result=S.dress({rgba:frame.image.data, width:frame.width, height:frame.height, measurements:measurements(), garments});
  const canvas=document.createElement('canvas');
  canvas.width=frame.width; canvas.height=frame.height;
  const ctx=canvas.getContext('2d');
  const cut=new ImageData(result.rgba, frame.width, frame.height);
  ctx.putImageData(cut,0,0);
  for(const spot of result.placements){
   const g=garments.find(item=>item.id===spot.id);
   if(!g?.source?.image) continue;
   const src=g.source;
   ctx.drawImage(src.image, src.sx, src.sy, src.sw, src.sh, spot.x, spot.y, spot.w, spot.h);
  }
  if(photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl=canvas.toDataURL('image/png');
  const stage=dialog.querySelector('.sp-see-stage');
  stage.hidden=false;
  stage.style.setProperty('--ratio', frame.width+' / '+frame.height);
  stage.innerHTML=`<img class="sp-see-result" alt="Outfit placed on the photo with the background removed" src="${photoUrl}" data-proportions="${result.proportionsKept?'kept':'lost'}" data-removed="${result.removed}" data-pieces="${result.placements.length}">`;
  last={lookId:look.id, removed:result.removed, alreadyClear:result.alreadyClear, proportionsKept:result.proportionsKept, placements:result.placements, landmarks:result.landmarks, pieceCount:garments.length};
  if(status) status.textContent=result.proportionsKept?'Full outfit placed. Proportions kept.':'The outfit is placed.';
 }catch(err){
  if(status) status.textContent=err.message;
 }finally{busy=false;}
}
window.StyleProSeeOnMeUI={open, last:()=>last};
})();
