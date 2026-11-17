/* One saved doll of Trish. Looks are dressed on that template, not on a new photo. */
(()=>{
'use strict';
const Core=window.StyleProDollCore;
const cache=new Map();
let base=null;
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(Error('Photo unreadable')); img.src=src;});}
function read(){try{return JSON.parse(localStorage.getItem(Core.KEY)||'null');}catch{return null;}}
function write(record){try{localStorage.setItem(Core.KEY, JSON.stringify(record));}catch{record.persisted=false;}}
async function cell(item){
 const src=item.cutout?.image||item.image; if(!src) return null;
 const img=await loadImage(src);
 const canvas=document.createElement('canvas');
 if(!item.cutout){canvas.width=img.naturalWidth; canvas.height=img.naturalHeight; canvas.getContext('2d').drawImage(img,0,0); return trim(knockOut(canvas));}
 const sw=img.naturalWidth/3, sh=img.naturalHeight/4;
 const sx=(item.cutout.index%3)*sw, sy=Math.floor(item.cutout.index/3)*sh;
 canvas.width=Math.max(1,Math.round(sw)); canvas.height=Math.max(1,Math.round(sh));
 canvas.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
 return trim(knockOut(canvas));
}
function knockOut(canvas){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const {width,height}=canvas;
 const img=ctx.getImageData(0,0,width,height);
 const d=img.data;
 const cr=d[0], cg=d[1], cb=d[2], ca=d[3];
 for(let i=0;i<d.length;i+=4){
  const max=Math.max(d[i],d[i+1],d[i+2]), min=Math.min(d[i],d[i+1],d[i+2]);
  if(d[i+3]<150&&max-min<42) d[i+3]=0;
 }
 const whiteBackdrop=ca>160&&cr>205&&cg>205&&cb>205;
 const match=i=>{
  if(d[i+3]<12) return true;
  if(!whiteBackdrop) return false;
  return Math.min(d[i],d[i+1],d[i+2])>198&&Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])<28;
 };
 const seen=new Uint8Array(width*height);
 const stack=[];
 for(let x=0;x<width;x++){stack.push(x); stack.push((height-1)*width+x);}
 for(let y=0;y<height;y++){stack.push(y*width); stack.push(y*width+width-1);}
 while(stack.length){
  const p=stack.pop();
  if(p<0||p>=seen.length||seen[p]) continue;
  seen[p]=1;
  if(!match(p*4)) continue;
  d[p*4+3]=0;
  const x=p%width;
  if(x>0) stack.push(p-1);
  if(x<width-1) stack.push(p+1);
  if(p>=width) stack.push(p-width);
  if(p<seen.length-width) stack.push(p+width);
 }
 ctx.putImageData(img,0,0);
 return canvas;
}
function trim(canvas){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const {width,height}=canvas;
 const data=ctx.getImageData(0,0,width,height).data;
 let minX=width, minY=height, maxX=0, maxY=0;
 for(let y=0;y<height;y+=2) for(let x=0;x<width;x+=2){
  if(data[(y*width+x)*4+3]>24){if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;}
 }
 if(maxX<=minX||maxY<=minY) return canvas;
 const next=document.createElement('canvas');
 next.width=maxX-minX+1; next.height=maxY-minY+1;
 next.getContext('2d').drawImage(canvas,minX,minY,next.width,next.height,0,0,next.width,next.height);
 return next;
}
function runsAt(data, width, y){
 const runs=[]; let start=null;
 const row=y*width;
 for(let x=0;x<width;x++){
  const on=data[(row+x)*4+3]>24;
  if(on&&start===null) start=x;
  if(!on&&start!==null){runs.push([start, x-1]); start=null;}
 }
 if(start!==null) runs.push([start, width-1]);
 return runs;
}
function silhouette(data, width, height, map){
 const hipY=Math.round(map.hips.y);
 const all=new Array(height);
 for(let y=0;y<height;y++) all[y]=runsAt(data, width, y);
 const samples=[];
 for(let y=Math.max(0, hipY-90); y<hipY; y++){
  const runs=all[y]; if(!runs.length) continue;
  const biggest=runs.reduce((a,b)=>b[1]-b[0]>a[1]-a[0]?b:a);
  samples.push({w:biggest[1]-biggest[0], c:(biggest[0]+biggest[1])/2});
 }
 samples.sort((a,b)=>a.w-b.w);
 const mid=samples[Math.floor(samples.length/2)]||{w:180,c:width/2};
 const torsoW=mid.w, cx=mid.c;
 const rows=new Array(height);
 for(let y=0;y<height;y++){
  const runs=all[y]; if(!runs.length){rows[y]=null; continue;}
  if(y>=hipY){
   const kept=runs.filter(run=>Math.abs((run[0]+run[1])/2-cx)<torsoW*0.9 && run[1]-run[0]>8);
   const use=kept.length?kept:[runs.reduce((a,b)=>b[1]-b[0]>a[1]-a[0]?b:a)];
   rows[y]=use.sort((a,b)=>a[0]-b[0]);
  }else{
   const biggest=runs.reduce((a,b)=>b[1]-b[0]>a[1]-a[0]?b:a);
   let l=biggest[0], r=biggest[1];
   const maxW=torsoW*0.98;
   if(r-l>maxW){l=Math.round(cx-maxW/2); r=Math.round(cx+maxW/2);}
   const clipped=runs.map(run=>[Math.max(run[0], l), Math.min(run[1], r)]).filter(run=>run[1]-run[0]>4);
   rows[y]=clipped.length?clipped:null;
  }
 }
 const arms={left:[], right:[]};
 const y0=Math.round(map.shoulders.y), y1=Math.min(height-1, hipY+40);
 for(let y=y0;y<=y1;y++){
  const body=rows[y]; if(!body) continue;
  const l=body[0][0], r=body[body.length-1][1];
  for(const run of all[y]){
   if(run[1]<l-6) arms.left.push({y,l:run[0],r:run[1]});
   else if(run[0]>r+6) arms.right.push({y,l:run[0],r:run[1]});
  }
 }
 return {rows, arms, torsoW, cx};
}
function paintParts(ctx, rows, arms, y0, y1){
 const {width,height}=ctx.canvas;
 const frame=ctx.getImageData(0,0,width,height);
 const data=frame.data;
 let sr=0, sg=0, sb=0, n=0;
 const sampleY=Math.max(0, y0-28);
 const sample=rows[Math.min(height-1, Math.max(0, y0))]||[[width/2-10, width/2+10]];
 const mid=(sample[0][0]+sample[0][1])/2;
 for(let x=Math.round(mid-12); x<=Math.round(mid+12); x++){
  const i=(sampleY*width+x)*4;
  if(data[i+3]>40){sr+=data[i]; sg+=data[i+1]; sb+=data[i+2]; n++;}
 }
 sr=n?sr/n:198; sg=n?sg/n:164; sb=n?sb/n:140;
 const fill=(y,l,r)=>{
  for(let x=l;x<=r;x++){
   const i=(y*width+x)*4;
   if(data[i+3]<24) continue;
   const shade=0.8+0.2*((data[i]+data[i+1]+data[i+2])/765);
   data[i]=Math.min(255, sr*shade); data[i+1]=Math.min(255, sg*shade); data[i+2]=Math.min(255, sb*shade);
  }
 };
 for(let y=y0;y<=y1;y++){const parts=rows[y]; if(parts) for(const part of parts) fill(y, part[0], part[1]);}
 for(const seg of [...arms.left, ...arms.right]) fill(seg.y, seg.l, seg.r);
 ctx.putImageData(frame,0,0);
}
function warpOnBody(ctx, src, region, rows, arms, role, withSleeves){
 const y0=Math.max(0, Math.round(region.top));
 const y1=Math.min(rows.length-1, Math.round(region.bottom));
 const span=Math.max(1, y1-y0);
 const sleeves=withSleeves!==false&&(role==='top'||role==='layer');
 const under=sampleColor(src, 0.3, 0.7);
 const {width,height}=ctx.canvas;
 const frame=ctx.getImageData(0,0,width,height);
 const data=frame.data;
 for(let y=y0;y<=y1;y++){
  const parts=rows[y]; if(!parts) continue;
  for(const part of parts){
   for(let x=part[0];x<=part[1];x++){
    const i=(y*width+x)*4;
    if(data[i+3]<24) continue;
    const shade=0.86+0.14*((data[i]+data[i+1]+data[i+2])/765);
    data[i]=Math.min(255, under.r*shade); data[i+1]=Math.min(255, under.g*shade); data[i+2]=Math.min(255, under.b*shade);
   }
  }
 }
 ctx.putImageData(frame,0,0);
 for(let y=y0;y<=y1;y+=2){
  const parts=rows[y]; if(!parts) continue;
  const sy=Math.min(src.height-1, Math.floor((y-y0)/span*src.height));
  const rowH=Math.min(2, y1-y);
  parts.forEach((part, index)=>{
   let sx=0, sw=src.width;
   if(parts.length>1){sx=index===0?0:src.width/2; sw=src.width/2;}
   else if(sleeves){sx=src.width*0.16; sw=src.width*0.68;}
   ctx.drawImage(src, sx, sy, sw, Math.max(1, src.height/span*rowH), part[0], y, part[1]-part[0], rowH);
  });
 }
 if(!sleeves||!arms) return;
 tintArms(ctx, src, arms, y0);
}
function sampleColor(src, x0, x1){
 const c=document.createElement('canvas'); c.width=8; c.height=8;
 const g=c.getContext('2d',{willReadFrequently:true});
 g.drawImage(src, src.width*x0, src.height*0.3, src.width*(x1-x0), src.height*0.4, 0, 0, 8, 8);
 const d=g.getImageData(0,0,8,8).data;
 let r=0,gch=0,b=0,n=0;
 for(let i=0;i<d.length;i+=4){if(d[i+3]<40) continue; r+=d[i]; gch+=d[i+1]; b+=d[i+2]; n++;}
 return n?{r:r/n,g:gch/n,b:b/n}:{r:80,g:80,b:80};
}
function tintArms(ctx, src, arms, y0){
 const left=sampleColor(src,0.04,0.22), right=sampleColor(src,0.78,0.96);
 const {width,height}=ctx.canvas;
 const frame=ctx.getImageData(0,0,width,height);
 const data=frame.data;
 const paint=(segments, color)=>{
  if(!segments.length) return;
  const minY=segments.reduce((m,s)=>Math.min(m,s.y), segments[0].y);
  for(const seg of segments){
   if(minY<y0-8 && seg.y<minY+70) continue;
   for(let x=seg.l;x<=seg.r;x++){
    const i=(seg.y*width+x)*4;
    if(data[i+3]<24) continue;
    const shade=0.75+0.35*((data[i]+data[i+1]+data[i+2])/765);
    data[i]=Math.min(255, color.r*shade); data[i+1]=Math.min(255, color.g*shade); data[i+2]=Math.min(255, color.b*shade);
   }
  }
 };
 paint(arms.left, left); paint(arms.right, right);
 ctx.putImageData(frame,0,0);
}
function anchorDraw(ctx, src, point, maxW, mode){
 const scale=Math.min(maxW/src.width, maxW/src.height);
 const w=src.width*scale, h=src.height*scale;
 if(mode==='wrist') ctx.drawImage(src, point.x-w/2, point.y-h/2, w, h);
 else ctx.drawImage(src, point.x-w*0.3, point.y-h*0.2, w, h);
}
const REPLICA='assets/doll/trish-base.png';
const TRYON_CACHE='stylepro-openai-tryon-v1';
async function readTryOn(id){
 if(!id||!('caches' in window)) return null;
 try{const cache=await caches.open(TRYON_CACHE); const hit=await cache.match('./tryon/'+encodeURIComponent(id)); return hit?hit.json():null;}catch{return null;}
}
async function writeTryOn(id, result){
 if(!id||!result||!result.draped||!result.image||!('caches' in window)) return;
 try{const cache=await caches.open(TRYON_CACHE); await cache.put('./tryon/'+encodeURIComponent(id), new Response(JSON.stringify({draped:true, image:result.image, provider:result.provider||'openai', model:result.model||''}),{headers:{'content-type':'application/json'}}));}catch{}
}
let baseCanvas=null;
function mapReplica(data, width, height, measurements){
 const heightIn=measurements.height||68, bustIn=measurements.bust||33, waistIn=measurements.waist||26, hipIn=measurements.hip||33;
 const runs=new Array(height);
 let minY=height, maxY=0;
 for(let y=0;y<height;y++){
  runs[y]=runsAt(data, width, y);
  if(runs[y].length){if(y<minY)minY=y; if(y>maxY)maxY=y;}
 }
 const bodyH=Math.max(1, maxY-minY);
 const px=bodyH/heightIn;
 const sampleY=Math.min(height-1, minY+Math.round(bodyH*0.2));
 const sample=runs[sampleY][0]||[0,width-1];
 const cx=(sample[0]+sample[1])/2;
 const cover=y=>(runs[y]||[]).find(part=>part[0]<=cx&&part[1]>=cx)||null;
 const headY=Math.min(height-1, minY+Math.round(bodyH*0.08));
 const headW=runs[headY][0]?runs[headY][0][1]-runs[headY][0][0]:100;
 let shoulderY=minY+Math.round(bodyH*0.22);
 for(let y=headY;y<minY+bodyH*0.36;y++){
  const part=cover(y);
  if(part&&part[1]-part[0]>headW*1.28){shoulderY=y; break;}
 }
 let hipY=minY+Math.round(bodyH*0.52);
 for(let y=minY+Math.round(bodyH*0.4);y<maxY;y++){if(!cover(y)){hipY=y; break;}}
 let waistY=minY+Math.round(bodyH*0.42), waistW=1e9;
 for(let y=minY+Math.round(bodyH*0.34);y<hipY;y++){
  const part=cover(y); if(!part) continue;
  const w=part[1]-part[0];
  if(w<waistW){waistW=w; waistY=y;}
 }
 let bustY=shoulderY, bustW=0;
 for(let y=shoulderY;y<waistY;y++){
  const part=cover(y); if(!part) continue;
  const w=part[1]-part[0];
  if(w>bustW){bustW=w; bustY=y;}
 }
 const ankleY=Math.max(waistY+px*8, maxY-Math.round(3.8*px));
 const kneeY=Math.round(hipY+(ankleY-hipY)*0.52);
 const rows=new Array(height);
 const arms={left:[], right:[]};
 for(let y=0;y<height;y++){
  const list=runs[y];
  if(!list.length||y<shoulderY||y>maxY){rows[y]=null; continue;}
  const part=cover(y);
  if(part&&y<hipY){
   rows[y]=[part];
   for(const run of list){
    if(run[1]<part[0]-4) arms.left.push({y,l:run[0],r:run[1]});
    else if(run[0]>part[1]+4) arms.right.push({y,l:run[0],r:run[1]});
   }
  }else if(!part){
   const left=list.filter(run=>(run[0]+run[1])/2<cx).sort((a,b)=>b[0]-a[0])[0];
   const right=list.filter(run=>(run[0]+run[1])/2>=cx).sort((a,b)=>a[0]-b[0])[0];
   const parts=[left,right].filter(Boolean);
   rows[y]=parts.length?parts:null;
  }else rows[y]=[part];
 }
 const feet=[];
 for(const side of [0,1]){
  let l=width, r=0;
  for(let y=Math.round(ankleY);y<=maxY;y++){
   const parts=rows[y]; if(!parts) continue;
   const piece=parts.length>1?parts[side]:(side===0?parts[0]:null);
   if(!piece) continue;
   l=Math.min(l, piece[0]); r=Math.max(r, piece[1]);
  }
  if(r>l) feet.push({l, r, top:Math.round(ankleY), bottom:maxY});
 }
 const hand=segments=>{
  if(!segments.length) return null;
  const low=segments.reduce((a,b)=>b.y>a.y?b:a);
  return {x:(low.l+low.r)/2, y:low.y};
 };
 const leftHand=hand(arms.left)||{x:cx-bustW*0.75, y:waistY};
 const rightHand=hand(arms.right)||{x:cx+bustW*0.75, y:waistY};
 const hipPart=cover(Math.max(0, hipY-6));
 const map={
  width, height, cx, pxPerIn:px,
  shoulders:{y:shoulderY, w:bustW||1},
  bust:{y:bustY, w:bustW||1},
  waist:{y:waistY, w:waistW===1e9?(bustW||1)*(waistIn/bustIn):waistW},
  hips:{y:hipY, w:hipPart?hipPart[1]-hipPart[0]:(bustW||1)*(hipIn/bustIn)},
  knees:{y:kneeY, w:(bustW||1)*(hipIn/bustIn)*0.62},
  ankles:{y:ankleY, w:(bustW||1)*0.36},
  leftWrist:{x:leftHand.x, y:Math.max(shoulderY, leftHand.y-Math.round(2.5*px))},
  rightWrist:{x:rightHand.x, y:Math.max(shoulderY, rightHand.y-Math.round(2.5*px))},
  leftHand, rightHand,
  measured:{height:heightIn, bust:bustIn, waist:waistIn, hip:hipIn, weight:measurements.weight||125}
 };
 return {map, rows, arms, feet};
}
async function fromReplica(measurements){
 const measured=measurements&&measurements.height?measurements:StyleProSeeOnMe.readMeasurements(localStorage);
 const img=await loadImage(REPLICA);
 const width=520, height=Math.round(width*img.naturalHeight/img.naturalWidth);
 const doll=document.createElement('canvas'); doll.width=width; doll.height=height;
 const ctx=doll.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(img,0,0,width,height);
 const fitted=ctx.getImageData(0,0,width,height).data;
 const body=mapReplica(fitted, width, height, measured);
 baseCanvas=doll;
 const record={id:'trish-doll', width, height, map:body.map, rows:body.rows, arms:body.arms, feet:body.feet, image:REPLICA, source:'replica', ai:false, secret:'FASHN_API_KEY', measurements:measured, asset:REPLICA, createdAt:new Date().toISOString()};
 write(record);
 base=record;
 return record;
}
async function maybeAi(record){
 const proxy=localStorage.getItem('stylepro-proxy-base');
 if(!proxy) return record;
 try{
  const response=await fetch(proxy.replace(/\/$/,'')+'/doll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:record.image, measurements:record.measurements})});
  const data=await response.json();
  if(data.ok&&data.image){record.image=data.image; record.source='ai'; record.ai=true; write(record); base=record;}
 }catch{}
 return record;
}
function sameBody(saved, measured){
 return saved&&saved.source==='replica'&&saved.asset===REPLICA&&saved.feet&&saved.rows&&saved.measurements
  &&saved.measurements.height===measured.height&&saved.measurements.bust===measured.bust
  &&saved.measurements.waist===measured.waist&&saved.measurements.hip===measured.hip;
}
async function ensure(measurements){
 const measured=measurements&&measurements.height?measurements:StyleProSeeOnMe.seedMeasurements(localStorage);
 if(base&&baseCanvas&&sameBody(base, measured)) return base;
 const saved=read();
 if(saved&&sameBody(saved, measured)&&baseCanvas){base=saved; return base;}
 const built=await fromReplica(measured);
 return maybeAi(built);
}
async function dress(look){
 const doll=await ensure();
 const key=(look.id||'')+'@'+doll.createdAt;
 if(cache.has(key)) return cache.get(key);
 if(!baseCanvas) await ensure();
 const canvas=document.createElement('canvas'); canvas.width=doll.width; canvas.height=doll.height;
 const ctx=canvas.getContext('2d');
 ctx.drawImage(baseCanvas,0,0);
 const order=['bottom','dress','top','layer','shoe','jewelry','bag'];
 const items=(look.pieces||[]).map(id=>typeof itemById==='function'?itemById(id):null).filter(Boolean);
 items.sort((a,b)=>order.indexOf(StyleProCore.role(a))-order.indexOf(StyleProCore.role(b)));
 for(const item of items){
  const role=StyleProCore.role(item);
  const src=await cell(item); if(!src) continue;
  const fit=StyleProBodyScan.fitGarment({landmarks:{shoulders:{width:doll.map.shoulders.w},hips:{width:doll.map.hips.w},bodyHeight:doll.height*0.88}, pxPerIn:doll.map.pxPerIn, measurements:doll.measurements}, {id:item.id, role, name:item.name, description:item.description, styleTags:item.styleTags});
  if(!fit) continue;
  const sleeveless=/tank|sleeveless|vest|cami|strapless/.test(`${item.name} ${item.description||''}`.toLowerCase());
  if(role==='jewelry'){anchorDraw(ctx, src, doll.map.leftWrist, Math.max(28, doll.map.shoulders.w*0.16), 'wrist'); continue;}
  if(role==='bag'){anchorDraw(ctx, src, doll.map.leftHand, Math.max(42, doll.map.hips.w*0.34), 'hand'); continue;}
  if(role==='shoe'&&doll.feet?.length){
   for(const foot of doll.feet) ctx.drawImage(src, foot.l, foot.top, Math.max(1, foot.r-foot.l), Math.max(1, foot.bottom-foot.top));
   continue;
  }
  const region=Core.garmentRegion(doll.map, role, fit.length);
  if(region&&doll.rows) warpOnBody(ctx, src, region, doll.rows, doll.arms, role, !sleeveless);
 }
 const image=canvas.toDataURL('image/png');
 const result={image, dollId:doll.id, source:doll.source, ai:doll.ai, createdAt:doll.createdAt};
 cache.set(key, result);
 return result;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function open(look){
 const dialog=document.getElementById('sp-see-dialog')||document.body.appendChild(Object.assign(document.createElement('dialog'),{id:'sp-see-dialog'}));
 const proxy=localStorage.getItem('stylepro-proxy-base')||'';
 dialog.innerHTML=`<div class="sp-see-bar"><div><p class="sp-kicker">See on me</p><h2 id="sp-see-title">${esc(look.title)}</h2></div><button type="button" data-see-close aria-label="Close">×</button></div><div class="sp-see-body"><p class="sp-note" id="sp-doll-status" role="status">Checking the try-on connection…</p><figure class="sp-doll-card" data-doll-base="true"><img src="${REPLICA}" alt="Trish's replica, not dressed"><figcaption>Doll base · her replica</figcaption></figure><div id="sp-doll-stage"></div></div>`;
 if(!dialog.open) dialog.showModal();
 dialog.querySelector('[data-see-close]').onclick=()=>dialog.close();
 const status=dialog.querySelector('#sp-doll-status');
 const stage=dialog.querySelector('#sp-doll-stage');
 const verdict=window.StyleProVerdict?.markup?.(look)||'';
 const cached=await readTryOn(look.id);
 if(cached&&cached.draped&&cached.image){
  status.textContent=cached.provider==='fashn'?'Dressed by the FASHN fallback. Cached for this look.':'Dressed by OpenAI. Cached for this look.';
  stage.innerHTML=`<figure class="sp-doll-card" data-doll-look="${esc(look.id)}" data-doll-id="trish-doll" data-tryon-provider="${esc(cached.provider||'openai')}"><img src="${cached.image}" alt="${esc(look.title)} from the try-on model"><figcaption>${esc(look.title)}</figcaption></figure>${verdict}`;
  window.StyleProVerdict?.bind?.(stage, look);
  return;
 }
 if(!proxy){
  status.textContent='AI fitting not connected yet';
  stage.innerHTML=`<p class="sp-note">AI fitting not connected yet. The replica stays undressed. The proxy needs FASHN_API_KEY. No clothes were pasted on.</p>${verdict}`;
  window.StyleProVerdict?.bind?.(stage, look);
  return;
 }
 status.textContent='Dressing you…';
 try{
  await ensure();
  const garments=[];
  for(const id of look.pieces||[]){
   const item=typeof itemById==='function'?itemById(id):null;
   if(!item) continue;
   const src=await cell(item);
   if(!src) continue;
   garments.push({id:item.id, name:item.name, role:window.StyleProCore?StyleProCore.role(item):'', image:src.toDataURL('image/png')});
  }
  const response=await fetch(proxy.replace(/\/$/,'')+'/tryon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lookId:look.id, pieces:look.pieces, modelImage:baseCanvas.toDataURL('image/png'), garments})});
  const result=await response.json();
  if(!result.ok||!result.draped||!result.image){
   status.textContent='AI fitting not connected yet';
   stage.innerHTML=`<p class="sp-note">AI fitting not connected yet. ${esc(result.secret||'FASHN_API_KEY')} is the secret the proxy needs. No clothes were pasted on the replica.</p>${verdict}`;
  }else{
   await writeTryOn(look.id, result);
   status.textContent=result.provider==='fashn'?'Dressed by the FASHN fallback.':'Dressed by OpenAI.';
   stage.innerHTML=`<figure class="sp-doll-card" data-doll-look="${esc(look.id)}" data-doll-id="trish-doll" data-tryon-provider="${esc(result.provider||'openai')}"><img src="${result.image}" alt="${esc(look.title)} from the try-on model"><figcaption>${esc(look.title)}</figcaption></figure>${verdict}`;
  }
 }catch{
  status.textContent='AI fitting not connected yet';
  stage.innerHTML=`<p class="sp-note">AI fitting not connected yet. The try-on proxy did not answer. No clothes were pasted on the replica.</p>${verdict}`;
 }
 window.StyleProVerdict?.bind?.(stage, look);
}
async function paintCards(){ /* Cutout warps are not a try-on. Cards keep their closet collage until a proxy image exists. */ }
async function prewarm(){ return []; }
window.StyleProDoll={ensure, dress, open, paintCards, prewarm, current:()=>base};
})();
