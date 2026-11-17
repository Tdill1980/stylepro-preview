/* In-browser portrait dressing. Silhouette landmarks stand in for a pose model. Proportions stay uniform. */
(function(root){
'use strict';
const KEY='stylepro-measurements-v1';
function num(value){
 const n=Number(value);
 return Number.isFinite(n)?n:0;
}
function normalizeMeasurements(input){
 const src=input||{};
 const height=num(src.height);
 const optional=(name,min,max)=>{
  const n=num(src[name]);
  if(!n) return 0;
  if(n<min||n>max) throw Error(name+' is out of range.');
  return n;
 };
 if(height&&(height<48||height>84)) throw Error('Height is out of range.');
 return {
  height:height||0,
  bust:optional('bust',24,60),
  waist:optional('waist',20,55),
  hip:optional('hip',24,70),
  inseam:optional('inseam',20,45)
 };
}
function readMeasurements(storage){
 try{return normalizeMeasurements(JSON.parse((storage||{}).getItem?.(KEY)||'null'));}catch{return {height:0,bust:0,waist:0,hip:0,inseam:0};}
}
function saveMeasurements(input, storage){
 const value=normalizeMeasurements(input);
 if(!(value.height>0)) throw Error('Add your height once. Bust, waist, hip and inseam are optional.');
 storage.setItem(KEY, JSON.stringify(value));
 return value;
}
function removeBackground(rgba, width, height){
 const copy=new Uint8ClampedArray(rgba);
 const pixels=width*height;
 let clear=0;
 for(let i=3;i<copy.length;i+=4) if(copy[i]<16) clear++;
 if(clear>pixels*0.08) return {rgba:copy, removed:0, alreadyClear:true};
 const samples=[];
 const take=(x,y)=>{const o=(y*width+x)*4; samples.push([copy[o],copy[o+1],copy[o+2]]);};
 for(let x=0;x<width;x++){take(x,0); take(x,height-1);}
 for(let y=0;y<height;y++){take(0,y); take(width-1,y);}
 const avg=samples.reduce((a,c)=>[a[0]+c[0],a[1]+c[1],a[2]+c[2]],[0,0,0]).map(n=>n/samples.length);
 const bg=new Uint8Array(pixels);
 const stack=[];
 function tryPush(x,y){
  if(x<0||y<0||x>=width||y>=height) return;
  const i=y*width+x;
  if(bg[i]) return;
  const o=i*4;
  const d=Math.abs(copy[o]-avg[0])+Math.abs(copy[o+1]-avg[1])+Math.abs(copy[o+2]-avg[2]);
  if(d<78){bg[i]=1; stack.push(i);}
 }
 for(let x=0;x<width;x++){tryPush(x,0); tryPush(x,height-1);}
 for(let y=0;y<height;y++){tryPush(0,y); tryPush(width-1,y);}
 while(stack.length){
  const i=stack.pop(), x=i%width, y=(i/width)|0;
  tryPush(x+1,y); tryPush(x-1,y); tryPush(x,y+1); tryPush(x,y-1);
 }
 let removed=0;
 for(let i=0;i<pixels;i++) if(bg[i]){copy[i*4+3]=0; removed++;}
 return {rgba:copy, removed, alreadyClear:false};
}
function landmarks(rgba, width, height){
 let minX=width, minY=height, maxX=0, maxY=0, count=0;
 const rowMin=new Int32Array(height), rowMax=new Int32Array(height);
 rowMin.fill(width); rowMax.fill(-1);
 for(let y=0;y<height;y++){
  for(let x=0;x<width;x++){
   if(rgba[(y*width+x)*4+3]<24) continue;
   count++;
   if(x<minX) minX=x;
   if(x>maxX) maxX=x;
   if(y<minY) minY=y;
   if(y>maxY) maxY=y;
   if(x<rowMin[y]) rowMin[y]=x;
   if(x>rowMax[y]) rowMax[y]=x;
  }
 }
 if(!count) return null;
 const bodyH=Math.max(1, maxY-minY);
 function span(y){return rowMax[y]>=0?rowMax[y]-rowMin[y]:0;}
 function widest(a,b){
  const y0=minY+Math.floor(bodyH*a), y1=Math.min(maxY, minY+Math.floor(bodyH*b));
  let bestY=y0, bestW=0;
  for(let y=y0;y<=y1;y++){const w=span(y); if(w>bestW){bestW=w; bestY=y;}}
  return {y:bestY, x:bestW?(rowMin[bestY]+rowMax[bestY])/2:(minX+maxX)/2, width:Math.max(bestW,4)};
 }
 function narrowest(a,b){
  const y0=minY+Math.floor(bodyH*a), y1=Math.min(maxY, minY+Math.floor(bodyH*b));
  let bestY=y0, bestW=width;
  for(let y=y0;y<=y1;y++){const w=span(y); if(w>0&&w<bestW){bestW=w; bestY=y;}}
  if(bestW===width) return widest(a,b);
  return {y:bestY, x:(rowMin[bestY]+rowMax[bestY])/2, width:bestW};
 }
 const shoulders=widest(0.12,0.30);
 const waist=narrowest(0.36,0.52);
 const hips=widest(0.48,0.66);
 const knees=widest(0.68,0.82);
 const ankleY=maxY;
 return {
  head:{x:(minX+maxX)/2, y:minY},
  shoulders, waist, hips, knees,
  ankles:{y:ankleY, x:(minX+maxX)/2, width:Math.max(span(ankleY),8)},
  minX, minY, maxX, maxY,
  bodyHeight:bodyH,
  centerX:(minX+maxX)/2
 };
}
function fit(targetW, maxH, sourceW, sourceH){
 const aspect=sourceW/sourceH;
 let scale=targetW/sourceW;
 if(sourceH*scale>maxH) scale=maxH/sourceH;
 const w=sourceW*scale, h=sourceH*scale;
 return {w, h, scale, aspect};
}
function place(marks, measurements, garments){
 const m=normalizeMeasurements(measurements||{});
 const heightIn=m.height||66;
 const pxPerIn=marks.bodyHeight/heightIn;
 const bustIn=m.bust||marks.shoulders.width/pxPerIn;
 const hipIn=m.hip||marks.hips.width/pxPerIn;
 const inseamIn=m.inseam||heightIn*0.45;
 const topW=Math.max(8, Math.min(marks.shoulders.width*1.08, bustIn*pxPerIn));
 const hipW=Math.max(8, Math.min(marks.hips.width*1.12, hipIn*pxPerIn));
 const inseamPx=Math.max(12, inseamIn*pxPerIn);
 return (garments||[]).map(g=>{
  const role=g.role||'top';
  let targetW=topW, anchorY=marks.shoulders.y, maxH=Math.max(12,(marks.waist.y-marks.shoulders.y)*1.2), dx=0;
  if(role==='layer'){targetW=topW*1.12; maxH=Math.max(maxH, marks.bodyHeight*0.42);}
  else if(role==='bottom'){targetW=hipW; anchorY=marks.waist.y-(m.waist?2:0); maxH=inseamPx;}
  else if(role==='dress'){targetW=Math.max(topW, hipW); anchorY=marks.shoulders.y; maxH=Math.max(20, marks.knees.y-marks.shoulders.y);}
  else if(role==='shoe'){targetW=Math.max(10, marks.ankles.width*1.35); anchorY=marks.ankles.y-marks.bodyHeight*0.02; maxH=marks.bodyHeight*0.14;}
  else if(role==='bag'||role==='jewelry'||role==='accessory'){targetW=topW*0.34; anchorY=role==='bag'?marks.hips.y:marks.shoulders.y; maxH=marks.bodyHeight*0.2; dx=role==='bag'?hipW*0.62:-topW*0.42;}
  const box=fit(targetW, maxH, g.width, g.height);
  return {id:g.id, role, x:marks.centerX-box.w/2+dx, y:anchorY, w:box.w, h:box.h, scale:box.scale, aspect:box.aspect};
 });
}
function proportionsKept(placements){
 return placements.every(p=>p.scale>0&&p.w>0&&p.h>0&&Math.abs(p.w/p.h-p.aspect)<1e-6);
}
function dress(input){
 const cut=removeBackground(input.rgba, input.width, input.height);
 const marks=landmarks(cut.rgba, input.width, input.height);
 if(!marks) throw Error('No person was found in that photo.');
 const placements=place(marks, input.measurements, input.garments);
 return {rgba:cut.rgba, width:input.width, height:input.height, removed:cut.removed, alreadyClear:cut.alreadyClear, landmarks:marks, placements, proportionsKept:proportionsKept(placements)};
}
const api={KEY, normalizeMeasurements, readMeasurements, saveMeasurements, removeBackground, landmarks, place, dress, proportionsKept};
if(typeof module!=='undefined') module.exports=api;
root.StyleProSeeOnMe=api;
})(typeof window!=='undefined'?window:globalThis);
