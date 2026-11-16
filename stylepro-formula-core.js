/* Energies, formulas, and closet composition. Prepared recipes are the fallback, not the only source. */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const T=typeof module!=='undefined'?require('./stylepro-taste-core.js'):root.StyleProTaste;
const ENERGIES=[
 {id:'founder',name:'Founder Energy',color:'#1a1a1a',emoji:'🖤'},
 {id:'wraptvworld',name:'Wraptvworld',color:'#e85aad',emoji:'💗'},
 {id:'play-date',name:'Play date',color:'#7ec27e',emoji:'🌿'},
 {id:'gallery',name:'Gallery',color:'#c9a34a',emoji:'✦'},
 {id:'active',name:'Active',color:'#2f6f6a',emoji:'♫'},
 {id:'speaking',name:'Polished speaking',color:'#956b80',emoji:'◎'}
];
const energyById=id=>ENERGIES.find(e=>e.id===id)||null;
function seedFormulas(items){
 const owned=items.filter(C.owned);
 const find=pred=>owned.find(pred)||null;
 const ckJean=find(i=>/calvin klein/i.test(i.brand||'')&&/jean/i.test(i.name));
 const samba=find(i=>/samba/i.test(i.name));
 const wrapTop=find(i=>/wrap tv world/i.test(`${i.name} ${i.brand||''}`));
 const pink=find(i=>/pink/i.test(i.name)&&/jacket|hoodie|top|tank/i.test(i.name));
 const jean=find(i=>/jean/i.test(i.name)&&!T.dislikedCasual(i));
 const chanel=find(i=>/chanel/i.test(i.brand||'')&&/bag/i.test(i.name));
 const prada=find(i=>/^prada$/i.test(i.brand||'')||(/prada/i.test(i.brand||'')&&/bag/i.test(i.name)));
 const armani=find(i=>/armani/i.test(i.brand||'')&&/blazer|jacket/i.test(i.name));
 const champagne=find(i=>/champagne/i.test(i.name));
 const ids=list=>list.filter(Boolean).map(i=>i.id);
 return [
  {id:'founder-default',energy_id:'founder',name:'Founder Energy (default)',item_ids:[],references:[
    {slot:'top',label:'black Alo quarter zip',status:'reference',reason:'No Alo quarter zip in wardrobe.json'},
    {slot:'belt',label:'black leather belt',status:'reference',reason:'No black leather belt is recorded'},
    {slot:'bottom',label:'mid-wash Calvin Klein jeans',status:'reference',nearest:ckJean?.id||'',reason:'No Calvin Klein jean is recorded as mid-wash'},
    {slot:'shoe',label:'black Adidas Sambas',status:'reference',nearest:samba?.id||'',reason:'The recorded Samba Doe is tan-and-cream, not black'}
  ],notes:'The named founder uniform is a reference until those exact garments are in the closet.',season:'all'},
  {id:'wrap-default',energy_id:'wraptvworld',name:'Wraptvworld (fun, colorful)',item_ids:ids([wrapTop,pink,jean]),references:[],notes:'Built from closet records with the Wrap TV piece when it is present.',season:'all'},
  {id:'play-default',energy_id:'play-date',name:'Play date (default)',item_ids:ids([samba,jean]),references:[],notes:'Comfortable owned pieces. The beige mini skirt is not the default.',season:'all'},
  {id:'gallery-default',energy_id:'gallery',name:'Gallery (default)',item_ids:ids([champagne,armani,chanel||prada,jean]),references:[],notes:'Elevated owned pieces, including a recorded luxury bag when one exists.',season:'all'},
 {id:'active-default',energy_id:'active',name:'Active (default)',item_ids:ids([samba,jean]),references:[],notes:'Movement pieces already in the closet. Not a claim of dancewear that is not recorded.',season:'all'},
 {id:'speaking-default',energy_id:'speaking',name:'Polished speaking (default)',item_ids:ids([armani,champagne,chanel||prada,jean]),references:[],notes:'A polished speaking uniform from owned tailoring and a recorded bag.',season:'all'}
 ];
}
function luxury(item){return /chanel|prada|gucci|ysl|saint laurent|louis vuitton|herm[eè]s/i.test(`${item?.brand||''} ${item?.name||''}`);}
function scoreItem(item,energyId,taste){
 let score=0;
 if(T.dislikedCasual(item)) score-=12;
 if(taste?.excludedItemIds?.includes(item.id)) score-=50;
 if(taste?.boostItemIds?.includes(item.id)) score+=8;
 const attrs=T.attributesOf(item);
 for(const [key,value] of Object.entries(attrs)){if(value) score+=(taste?.weights?.[key+':'+value]||0);}
 if(energyId==='founder'&&/black/i.test(item.name)) score+=1.4;
 if(energyId==='wraptvworld'&&/pink|print|logo|color|wrap/i.test(`${item.name} ${item.description||''}`)) score+=1.6;
 if(energyId==='play-date'&&/sneaker|samba|jean|tee|knit/i.test(item.name)) score+=1.2;
 if(energyId==='gallery'&&/satin|blazer|silk|champagne|quilt/i.test(`${item.name} ${item.description||''}`)) score+=1.3;
 if((energyId==='founder'||energyId==='gallery')&&luxury(item)) score+=3;
 if(energyId==='play-date'&&/heel|stiletto|pump/i.test(item.name)) score-=6;
 if(energyId==='active'&&/sneaker|samba|jean|tee|tank|hoodie/i.test(item.name)) score+=2;
 if(energyId==='active'&&/heel|blazer|satin|cocktail/i.test(item.name)) score-=5;
 if(energyId==='speaking'&&/blazer|silk|satin|black/i.test(`${item.name} ${item.description||''}`)) score+=1.6;
 if(energyId==='speaking'&&luxury(item)) score+=2;
 const blob=`${item.name||''} ${item.brand||''} ${item.description||''} ${item.styleTags||''}`.toLowerCase();
 for(const tag of taste?.preferredTags||[]) if(tag&&blob.includes(String(tag).toLowerCase())) score+=1.1;
 for(const brand of taste?.preferredBrands||[]) if(brand&&blob.includes(String(brand).toLowerCase())) score+=2;
 for(const term of taste?.avoidTerms||[]) if(term&&blob.includes(String(term).toLowerCase())) score-=8;
 return score;
}
function best(pool,energyId,taste,roleName){
 const rows=pool.filter(i=>C.role(i)===roleName&&!taste?.excludedItemIds?.includes(i.id)&&!T.dislikedCasual(i));
 rows.sort((a,b)=>scoreItem(b,energyId,taste)-scoreItem(a,energyId,taste)||a.id.localeCompare(b.id));
 return rows[0]||null;
}
function composeOutfits(items,context={}){
 const taste=context.taste||{};
 const energyId=context.energyId||context.formula?.energy_id||'founder';
 const owned=[...new Map(items.filter(C.owned).map(i=>[i.id,i])).values()].filter(i=>!taste.excludedItemIds?.includes(i.id));
 const banned=new Set(taste.excludedSignatures||[]);
 const looks=[];
 const used=new Set();
 for(let n=0;n<3;n++){
  const pool=owned.filter(i=>!used.has(i.id));
  const dress=best(pool,energyId,taste,'dress');
  const top=dress?null:best(pool,energyId,taste,'top');
  const bottom=dress?null:best(pool.filter(i=>i!==top),energyId,taste,'bottom');
  if(!dress&&!(top&&bottom)) break;
  const layer=best(pool.filter(i=>i!==top&&i!==bottom),energyId,taste,'layer');
  const bag=best(pool,energyId,taste,'bag');
  const shoe=best(pool,energyId,taste,'shoe');
  const pieces=[dress,top,bottom,layer,bag,shoe].filter(Boolean);
  const ids=pieces.map(i=>i.id);
  const signature=C.signature(ids);
  if(banned.has(signature)) {pieces.forEach(i=>used.add(i.id)); continue;}
  pieces.forEach(i=>used.add(i.id));
  const energy=energyById(energyId);
  looks.push({id:'composed:'+energyId+':'+signature,title:(energy?.name||'Your')+' look',pieces:ids,description:pieces.map(i=>i.name).join(' · '),source:'composed',type:'assembly',neural:false,occasions:[],personas:[]});
 }
 return looks;
}
function applyFormula(formula,context={}){
 const items=context.items||[];
 const byId=new Map(items.map(i=>[i.id,i]));
 const unavailable=new Set(context.unavailableIds||[]);
 const excluded=new Set(context.taste?.excludedItemIds||[]);
 const notes=[];
 const pieces=[];
 for(const id of formula?.item_ids||[]){
  const item=byId.get(id);
  if(!item){notes.push(id+' is not in the closet.');continue;}
  if(!C.owned(item)){notes.push(item.name+' is not confirmed owned.');continue;}
  if(unavailable.has(id)){notes.push(item.name+' is unavailable, so it stays out of this look.');continue;}
  if(excluded.has(id)||T.dislikedCasual(item)){notes.push(item.name+' is set aside.');continue;}
  pieces.push(id);
 }
 for(const ref of formula?.references||[]) notes.push(ref.label+' — reference, not a confirmed closet match.');
 if(!context.weather) notes.push('Weather is not connected.');
 else if(context.weather==='hot'){const kept=pieces.filter(id=>C.role(byId.get(id))!=='layer');if(kept.length!==pieces.length){pieces.splice(0,pieces.length,...kept);notes.push('Warm weather: the layer stays off.');}}
 else if(context.weather==='cold'&&!pieces.some(id=>C.role(byId.get(id))==='layer')) notes.push('Cold weather was provided. A layer is still missing from this formula.');
 if(context.onCamera) notes.push('On camera: keep the setting simple. This step does not remove a background.');
 const roles=pieces.map(id=>C.role(byId.get(id)));
 const complete=roles.includes('dress')||(roles.includes('top')&&roles.includes('bottom'));
 if(!complete){
  const fallback=composeOutfits(items,{...context,formula,energyId:formula?.energy_id||context.energyId})[0];
  return {outfit:fallback||{id:'composed:empty',title:'Closet gap',pieces:[],description:'No complete owned combination is available.',source:'composed'},source:'compose-fallback',adaptations:notes,note:'Formula pieces could not make a complete look, so the closet composition is used.'};
 }
 const names=pieces.map(id=>byId.get(id).name).join(' · ');
 return {outfit:{id:'formula:'+formula.id,title:formula.name,pieces,description:names,source:'formula',type:'assembly',neural:false,occasions:[],personas:[]},source:'formula',adaptations:notes,note:''};
}
function dressDay(events,context={}){
 const formulas=context.formulas||seedFormulas(context.items||[]);
 const sorted=[...events].sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.startTime||'').localeCompare(b.startTime||'')||a.title.localeCompare(b.title));
 const out=[];
 for(const ev of sorted){
  const prev=out.filter(x=>x.date===ev.date).at(-1);
  const formula=(formulas.find(f=>f.energy_id===ev.energyId)||formulas[0]);
  if(prev&&prev.energyId&&prev.energyId===ev.energyId){
   out.push({...ev,outfit:prev.outfit,mode:'transition',shared:prev.outfit.pieces.slice(),note:'One look carries through this part of the day.'});
   continue;
  }
  const applied=applyFormula(formula,{...context,formulas,energyId:ev.energyId,event:ev,sameDayEvents:sorted.filter(x=>x.date===ev.date),onCamera:/camera|demo|film|gallery/i.test(ev.title+' '+(ev.energyId||''))});
  const shared=prev?prev.outfit.pieces.filter(id=>applied.outfit.pieces.includes(id)):[];
  const mode=!prev?'first':'change';
  out.push({...ev,outfit:applied.outfit,mode,shared,source:applied.source,adaptations:applied.adaptations,note:mode==='change'?(shared.length?'Change the finish. '+shared.length+' piece'+(shared.length===1?' stays.':'s stay.'):'Outfit change for this part of the day.'):applied.note});
 }
 return {events:out,modelCalls:0};
}
const api={ENERGIES,energyById,seedFormulas,composeOutfits,applyFormula,dressDay,luxury};
if(typeof module!=='undefined') module.exports=api;
root.StyleProFormula=api;
})(typeof window!=='undefined'?window:globalThis);
