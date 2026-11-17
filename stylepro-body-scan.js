/* Body scan for fit. Segmentation plus a pose estimate. This does not drape clothes. */
(function(root){
'use strict';
const S=typeof module!=='undefined'?require('./stylepro-see-on-me-core.js'):root.StyleProSeeOnMe;
function poseFrom(marks){
 if(!marks) return null;
 const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const shoulderY=marks.shoulders.y, hipY=marks.hips.y, kneeY=marks.knees.y, ankleY=marks.ankles.y;
 const halfS=Math.max(6, marks.shoulders.width/2), halfH=Math.max(6, marks.hips.width/2);
 const leftS={x:marks.shoulders.x-halfS,y:shoulderY}, rightS={x:marks.shoulders.x+halfS,y:shoulderY};
 const leftH={x:marks.hips.x-halfH,y:hipY}, rightH={x:marks.hips.x+halfH,y:hipY};
 const arm=marks.bodyHeight*0.16;
 return {
  nose:{x:marks.head.x,y:marks.head.y+marks.bodyHeight*0.06},
  leftShoulder:leftS, rightShoulder:rightS,
  leftElbow:{x:leftS.x-arm*0.35,y:shoulderY+arm}, rightElbow:{x:rightS.x+arm*0.35,y:shoulderY+arm},
  leftWrist:{x:leftS.x-arm*0.2,y:shoulderY+arm*1.7}, rightWrist:{x:rightS.x+arm*0.15,y:shoulderY+arm*1.7},
  leftHip:leftH, rightHip:rightH,
  leftKnee:{x:leftH.x,y:kneeY}, rightKnee:{x:rightH.x,y:kneeY},
  leftAnkle:{x:leftH.x,y:ankleY}, rightAnkle:{x:rightH.x,y:ankleY}
 };
}
function scan(rgba, width, height, measurements){
 const cut=S.removeBackground(rgba, width, height);
 const marks=S.landmarks(cut.rgba, width, height);
 if(!marks) throw Error('No person was found in that photo.');
 const measured=S.normalizeMeasurements(measurements||{});
 const pxPerIn=marks.bodyHeight/((measured.height||66));
 return {rgba:cut.rgba, width, height, removed:cut.removed, landmarks:marks, pose:poseFrom(marks), pxPerIn, measurements:measured, source:'silhouette-pose', draped:false};
}
function lengthFor(role, measurements, item){
 const blob=`${item?.name||''} ${item?.description||''} ${item?.styleTags||''}`.toLowerCase();
 if(role==='bottom'||role==='dress'){
  if(/\bmini\b/.test(blob)||(measurements.inseam&&measurements.inseam<28)) return 'above-knee';
  if(/\bknee\b|\bmidi\b/.test(blob)) return 'knee';
  if(/\b(maxi|floor|jean|jeans|pant|pants|trouser|flare|flared|bootcut)\b/.test(blob)||/\blong\b/.test(blob)||(measurements.inseam&&measurements.inseam>=30)) return 'full-length';
  if(role==='dress') return 'full-length';
  return 'knee';
 }
 if(/crop/.test(blob)) return 'cropped';
 return 'hip';
}
function fitGarment(body, garment){
 const role=garment.role;
 const category=role==='dress'?'one-pieces':role==='bottom'?'bottoms':(role==='top'||role==='layer')?'tops':role==='shoe'?'shoes':role==='jewelry'?'jewelry':role==='bag'?'bags':'skip';
 if(category==='skip') return null;
 const length=lengthFor(role, body.measurements, garment);
 const shoulderIn=body.landmarks.shoulders.width/body.pxPerIn;
 const hipIn=body.measurements.hip||body.landmarks.hips.width/body.pxPerIn;
 const scale=Math.max(0.7, Math.min(1.4, shoulderIn/16));
 const anchor=role==='bottom'?'hips':role==='shoe'?'ankles':role==='jewelry'?'wrist':role==='bag'?'hand':'shoulders';
 const prompt=`Replace the original ${category==='bottoms'?'bottom':category==='one-pieces'?'outfit':'top'} with this ${length} ${category} piece. Fit it to her pose: shoulders about ${shoulderIn.toFixed(1)} inches, hips about ${hipIn.toFixed(1)} inches. Follow the body. Do not float the garment.`;
 return {id:garment.id, role, category, length, scale, anchor, prompt};
}
const api={poseFrom, scan, lengthFor, fitGarment};
if(typeof module!=='undefined') module.exports=api;
root.StyleProBodyScan=api;
})(typeof window!=='undefined'?window:globalThis);
