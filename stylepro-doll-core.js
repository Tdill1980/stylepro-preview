/* Saved doll regions. The same map is reused for every look. */
(function(root){
'use strict';
const KEY='stylepro-doll-base-v2';
const PROFILE={height:68,bust:33,waist:26,hip:33,weight:125};
function layout(measurements, width, height){
 const m=measurements||{};
 const heightIn=m.height||PROFILE.height;
 const bust=m.bust||PROFILE.bust;
 const waist=m.waist||PROFILE.waist;
 const hip=m.hip||PROFILE.hip;
 const bodyH=height*0.88;
 const top=height*0.05;
  const px=bodyH/heightIn;
  const flat=inches=>inches/Math.PI*px;
  const cx=width/2;
  const y=frac=>Math.round(top+bodyH*frac);
  return {
  width, height, cx, pxPerIn:px,
  shoulders:{y:y(0.16), w:flat(bust)},
  bust:{y:y(0.26), w:flat(bust)},
  waist:{y:y(0.40), w:flat(waist)},
  hips:{y:y(0.50), w:flat(hip)},
  knees:{y:y(0.72), w:flat(hip)*0.62},
  ankles:{y:y(0.94), w:flat(hip)*0.36},
  leftWrist:{x:cx-bust*px*0.78, y:y(0.50)},
  rightWrist:{x:cx+bust*px*0.62, y:y(0.36)},
  leftHand:{x:cx-bust*px*0.8, y:y(0.58)},
  rightHand:{x:cx+bust*px*0.66, y:y(0.32)}
 };
}
function widthAt(region, y){
 const span=Math.max(1, region.bottom-region.top);
 const t=Math.max(0, Math.min(1, (y-region.top)/span));
 return region.w0+(region.w1-region.w0)*t;
}
function hem(map, role, length){
 const px=map.pxPerIn||1;
 if(role==='bottom'||role==='dress'){
  if(length==='above-knee') return Math.max(map.waist.y+px*6, map.knees.y-4*px);
  if(length==='knee') return map.knees.y;
  return map.ankles.y;
 }
 if(length==='cropped') return map.bust.y+(map.waist.y-map.bust.y)*0.55;
 return map.hips.y;
}
function garmentRegion(map, role, length){
 const box=(top,bottom,w0,w1)=>({top, bottom, w0, w1, cx:map.cx});
 const end=hem(map, role, length);
 if(role==='dress') return box(map.shoulders.y, end, map.shoulders.w, map.ankles.w);
 if(role==='bottom'){
  return box(map.waist.y, end, map.hips.w, map.ankles.w*(end>=map.ankles.y-1?1:1.15));
 }
 if(role==='top'||role==='layer'){
  const w=role==='layer'?map.shoulders.w*1.08:map.shoulders.w;
  return box(map.shoulders.y, end, w, map.waist.w*(role==='layer'?1.08:1));
 }
 return null;
}
const api={KEY, PROFILE, layout, widthAt, hem, garmentRegion};
if(typeof module!=='undefined') module.exports=api;
root.StyleProDollCore=api;
})(typeof window!=='undefined'?window:globalThis);
