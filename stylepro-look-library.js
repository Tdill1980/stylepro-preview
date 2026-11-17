/* Saved Barbie Box looks. Tags stay editable after the look is stored. */
(function(root){
'use strict';
const PRESETS=['Boho','Boss Style'];
const SOURCE='barbie-box';
function clean(value){return String(value||'').trim().slice(0,32);}
function normalizeTags(tags, custom){
 const extra=custom?String(custom).split(','):[];
 const all=[...(Array.isArray(tags)?tags:[]), ...extra].map(clean).filter(Boolean);
 const out=[];
 for(const tag of all){
  if(!out.some(have=>have.toLowerCase()===tag.toLowerCase())) out.push(tag);
 }
 return out.slice(0,8);
}
function blank(){return {title:'My look', pieces:[], tags:[], source:SOURCE, layout:[], remixedFrom:''};}
function remix(look){
 if(!look||!Array.isArray(look.pieces)||!look.pieces.length) throw Error('Choose a look to remix.');
 return {title:look.title||'Remix', pieces:look.pieces.slice(), tags:[], source:SOURCE, layout:[], remixedFrom:look.id||''};
}
function place(draft, id){
 const next={...draft, pieces:[...(draft.pieces||[])]};
 if(id&&!next.pieces.includes(id)) next.pieces.push(id);
 return next;
}
function reorder(draft, from, to){
 const pieces=[...(draft.pieces||[])];
 if(from<0||to<0||from>=pieces.length||to>=pieces.length) return {...draft, pieces};
 const [item]=pieces.splice(from,1);
 pieces.splice(to,0,item);
 return {...draft, pieces};
}
function rowFrom(draft){
 const pieces=[...(draft.pieces||[])];
 if(!pieces.length) throw Error('Add a piece before saving.');
 const id=draft.id||('box-'+Math.random().toString(36).slice(2,10));
 return {
  id, title:clean(draft.title)||'My look', pieces, tags:normalizeTags(draft.tags, draft.custom),
  source:SOURCE, layout:Array.isArray(draft.layout)?draft.layout:[], remixedFrom:draft.remixedFrom||'', at:draft.at||''
 };
}
function save(library, draft){
 const row=rowFrom(draft);
 const rows=Array.isArray(library)?library:[];
 return [row, ...rows.filter(item=>!(item.id===row.id&&item.source===SOURCE))];
}
function updateTags(library, id, tags, custom){
 let found=false;
 const next=(library||[]).map(item=>{
  if(item.id!==id||item.source!==SOURCE) return item;
  found=true;
  return {...item, tags:normalizeTags(tags, custom)};
 });
 if(!found) throw Error('That saved look is not in My Wardrobe.');
 return next;
}
const api={PRESETS, SOURCE, normalizeTags, blank, remix, place, reorder, save, updateTags};
if(typeof module!=='undefined') module.exports=api;
root.StyleProLookLibrary=api;
})(typeof window!=='undefined'?window:globalThis);
