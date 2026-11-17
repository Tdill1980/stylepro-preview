/* Professional stylist brain. Live calls need STYLIST_API_KEY on the proxy. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const B=typeof module!=='undefined'?require('./stylepro-outfit-builder.js'):root.StyleProOutfitBuilder;
const T=typeof module!=='undefined'?require('./stylepro-taste-core.js'):root.StyleProTaste;
const SECRET='STYLIST_API_KEY';
const STORES=['Free People','Anthropologie','Calvin Klein','Princess Polly','The Limited','White House Black Market','Ralph Lauren','Alo','Lululemon'];
const SYSTEM=`You are a professional stylist dressing an adult woman. The result should feel polished and editorial, the way a good stylist at ${STORES.join(', ')} would edit a closet for a real day. Use color theory, one statement piece, a cohesive palette, and accessories that finish the look. Balance silhouette using the measurements you are given. Do not comment on her body. Never choose khaki or the beige mini skirt unless she explicitly included that piece. Use only item ids from the closet list. Return JSON: {"looks":[{"itemIds":["id"],"rationale":"one short sentence"}]}.`;
function meta(item){
 const attrs=T.attributesOf(item);
 return {id:item.id, name:item.name, category:item.category, color:attrs.color_family||'', material:attrs.material||'', brand:item.brand||'', formality:attrs.formality||''};
}
function brief(input){
 const items=(input.items||[]).filter(C.owned).slice(0,180).map(meta);
 return {mode:input.mode||'surprise', occasion:input.q||'', measurements:input.measurements||null, rules:input.preferences||{}, anchors:input.anchors||[], learning:input.learning||input.preferences&&input.preferences.verdictNote||'', closet:items};
}
function sentence(look, items){
 const pieces=(look.pieces||[]).map(id=>items.find(item=>item.id===id)).filter(Boolean);
 const top=pieces.find(item=>C.role(item)==='top'||C.role(item)==='dress');
 const bottom=pieces.find(item=>C.role(item)==='bottom');
 const statement=pieces.find(item=>C.role(item)==='layer'||C.role(item)==='bag')||top;
 const colors=[...new Set(pieces.map(item=>T.attributesOf(item).color_family).filter(Boolean))].slice(0,3);
 const base=top&&bottom?`${top.name} with ${bottom.name}`:(top?top.name:'This edit');
 const color=colors.length?` Palette: ${colors.join(', ')}.`:'';
 return `${base}. One statement: ${statement?statement.name:'the cloth'}.${color}`;
}
function decorate(look, items, source){
 return {...look, pieces:look.pieces.slice(), rationale:sentence(look, items), stylistSource:source};
}
function fallback(input){
 const items=input.items||[], looks=input.looks||[];
 const preferences=input.preferences||{};
 const source='offline-fallback';
 if(input.mode==='style-this'&&root.StyleProStyleThis){
  const built=root.StyleProStyleThis.styleAround(items, looks, input.anchors||[], preferences);
  return {source, secret:SECRET, looks:built.slice(0, input.limit||5).map(look=>decorate(look, items, source))};
 }
 if(input.mode==='style-this'&&typeof module!=='undefined'){
  const ST=require('./stylepro-style-this-core.js');
  const built=ST.styleAround(items, looks, input.anchors||[], preferences);
  return {source, secret:SECRET, looks:built.slice(0, input.limit||5).map(look=>decorate(look, items, source))};
 }
 if(input.mode==='surprise'){
  const pack=B.surprise({items, looks, wears:input.wears||[], feedback:input.feedback||{}, preferences, date:input.date, seed:input.seed||1, previousMains:input.previousMains||[], limit:input.limit||5, avoidRepeats:input.avoidRepeats!==false});
  return {source, secret:SECRET, seed:pack.seed, mains:pack.mains, looks:pack.looks.map(look=>decorate(look, items, source))};
 }
 const pack=B.build({items, looks, wears:input.wears||[], feedback:input.feedback||{}, preferences, date:input.date, q:input.q||'', seed:input.seed||0, limit:input.limit||3, avoidRepeats:input.avoidRepeats!==false});
 return {source, secret:SECRET, looks:pack.looks.map(look=>decorate(look, items, source))};
}
function parseReply(text, items, preferences){
 const raw=String(text||'');
 const start=raw.indexOf('{'), end=raw.lastIndexOf('}');
 if(start<0||end<=start) throw Error('The stylist reply was not usable.');
 const data=JSON.parse(raw.slice(start, end+1));
 const byId=new Map((items||[]).map(item=>[item.id, item]));
 const never=!!(preferences&&(preferences.neverKhaki||(preferences.avoidTerms||[]).some(term=>/khaki/i.test(String(term)))));
 const looks=[];
 for(const row of data.looks||[]){
  const ids=[...new Set(row.itemIds||row.pieces||[])].filter(id=>byId.has(id)&&C.owned(byId.get(id)));
  if(never&&ids.some(id=>T.dislikedCasual(byId.get(id)))) continue;
  const pieces=ids.map(id=>byId.get(id));
  const roles=pieces.map(C.role);
  if(!(roles.includes('dress')||(roles.includes('top')&&roles.includes('bottom')))) continue;
  const rationale=String(row.rationale||'').replace(/\s+/g,' ').trim().slice(0,180);
  looks.push({id:'llm:'+C.signature(ids), title:'Stylist edit', pieces:ids, rationale, stylistSource:'llm', type:'assembly'});
 }
 return {source:'llm', looks};
}
async function chooseLive(input, complete){
 if(typeof complete==='function'){
  try{
   const reply=await complete(brief(input), SYSTEM+(input.learning?'\n'+input.learning:''));
   const parsed=parseReply(typeof reply==='string'?reply:reply&&reply.reply, input.items, input.preferences);
   if(parsed.looks.length) return parsed;
  }catch{/* offline fallback */ }
 }
 return fallback(input);
}
const api={SECRET, STORES, SYSTEM, meta, brief, sentence, fallback, parseReply, chooseLive};
if(typeof module!=='undefined') module.exports=api;
root.StyleProStylistBrain=api;
})(typeof window!=='undefined'?window:globalThis);
