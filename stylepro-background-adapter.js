/* Background preview adapter. Not a vision service, and it never names a brand from pixels. */
(function(root){'use strict';
const LABEL='In-browser preview only. A vision provider is not connected. The original photo is kept. No brand is read from the picture.';
function stub(extra){return {strippedUrl:'',extractedAttributes:{},mode:'stub',label:LABEL,originalKept:true,...extra};}
async function stripBackground(blob){
 if(typeof document==='undefined'||typeof Image==='undefined'||!blob) return stub();
 try{
  const url=typeof blob==='string'?blob:URL.createObjectURL(blob);
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('unreadable'));img.src=url;});
  const canvas=document.createElement('canvas');
  const max=480,scale=Math.min(1,max/Math.max(image.width||1,image.height||1));
  canvas.width=Math.max(1,Math.round((image.width||1)*scale));
  canvas.height=Math.max(1,Math.round((image.height||1)*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx) return stub({originalUrl:url});
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
  const corners=[0,canvas.width-1,(canvas.height-1)*canvas.width,(canvas.height-1)*canvas.width+canvas.width-1];
  const sample=corners.map(p=>[frame.data[p*4],frame.data[p*4+1],frame.data[p*4+2]]);
  const avg=sample.reduce((a,c)=>[a[0]+c[0],a[1]+c[1],a[2]+c[2]],[0,0,0]).map(n=>n/sample.length);
  const alike=sample.every(c=>Math.abs(c[0]-avg[0])<28&&Math.abs(c[1]-avg[1])<28&&Math.abs(c[2]-avg[2])<28);
  if(alike){
   for(let i=0;i<frame.data.length;i+=4){
    const d=Math.abs(frame.data[i]-avg[0])+Math.abs(frame.data[i+1]-avg[1])+Math.abs(frame.data[i+2]-avg[2]);
    if(d<72){frame.data[i]=250;frame.data[i+1]=245;frame.data[i+2]=242;}
   }
   ctx.putImageData(frame,0,0);
  }
  return {strippedUrl:canvas.toDataURL('image/png'),extractedAttributes:{},mode:'browser-preview',label:LABEL,originalKept:true,originalUrl:url};
 }catch{return stub();}
}
const api={stripBackground,LABEL};
if(typeof module!=='undefined') module.exports=api;
root.StyleProBackground=api;
})(typeof window!=='undefined'?window:globalThis);
