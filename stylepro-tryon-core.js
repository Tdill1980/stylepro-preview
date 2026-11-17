/* FASHN fallback adapter. Primary try-on is OpenAI image edits in proxy/worker.js.
   Secrets stay on the proxy: OPENAI_API_KEY, then optional FASHN_API_KEY. No image is invented here. */
(function(root){
'use strict';
const SECRET='FASHN_API_KEY';
const ORDER={top:1, layer:2, bottom:3, dress:3, shoe:4, jewelry:5, bag:6};
function steps(fits){
 const rows=(fits||[]).filter(step=>step&&ORDER[step.role]);
 const dress=rows.some(step=>step.role==='dress');
 return rows.filter(step=>!(dress&&(step.role==='top'||step.role==='bottom'))).sort((a,b)=>ORDER[a.role]-ORDER[b.role]||String(a.id).localeCompare(String(b.id)));
}
function requestBody(step, modelImage){
 if(step.category==='tops'||step.category==='bottoms'||step.category==='one-pieces'){
  return {model_name:'tryon-v1.6', inputs:{
   model_image:modelImage, garment_image:step.garmentImage, category:step.category,
   garment_photo_type:'flat-lay', segmentation_free:false, mode:'balanced', output_format:'jpeg', num_samples:1
  }};
 }
 return {model_name:'tryon-max', inputs:{
  model_image:modelImage, product_image:step.garmentImage, prompt:step.prompt,
  generation_mode:'fast', resolution:'1k', num_images:1, output_format:'jpeg'
 }};
}
async function runStep(step, modelImage, options){
 const key=options&&options.key;
 if(!key) return {ok:false, code:'missing-key', secret:SECRET, tried:false, draped:false};
 const fetchImpl=options.fetch;
 if(typeof fetchImpl!=='function') throw Error('Try-on needs a fetch implementation.');
 const started=await fetchImpl('https://api.fashn.ai/v1/run', {
  method:'POST', headers:{Authorization:'Bearer '+key, 'Content-Type':'application/json'},
  body:JSON.stringify(requestBody(step, modelImage))
 });
 const first=await started.json();
 if(!started.ok||!first.id) return {ok:false, code:'provider', secret:SECRET, tried:true, draped:false, message:first.message||first.error||'Try-on was refused.'};
 for(let n=0;n<40;n++){
  const polled=await fetchImpl('https://api.fashn.ai/v1/status/'+first.id, {headers:{Authorization:'Bearer '+key}});
  const body=await polled.json();
  if(body.status==='completed'&&body.output&&body.output[0]) return {ok:true, image:body.output[0], model:requestBody(step, modelImage).model_name, draped:true, tried:true};
  if(body.status==='failed') return {ok:false, code:'provider', tried:true, draped:false, message:body.error&&body.error.message||'Try-on failed.'};
  await new Promise(resolve=>setTimeout(resolve, options.wait||800));
 }
 return {ok:false, code:'timeout', tried:true, draped:false, message:'Try-on timed out.'};
}
const api={SECRET, steps, requestBody, runStep};
if(typeof module!=='undefined') module.exports=api;
root.StyleProTryOn=api;
})(typeof window!=='undefined'?window:globalThis);
