/* Milestone 1 of docs/specs/stylepro-accessible-mode-spec.md. Short answer, then more. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const PLAIN={navy:'deep navy',burgundy:'deep burgundy',pink:'soft blush pink',black:'black',white:'white',blue:'blue',brown:'brown',cream:'cream',gold:'gold',green:'green',gray:'gray',red:'red'};
function plainColor(item){
 const blob=`${item?.name||''} ${item?.description||''}`.toLowerCase();
 const hit=Object.keys(PLAIN).find(name=>blob.includes(name));
 return hit?PLAIN[hit]:'a color that is not named on the record';
}
function bits(item){
 const blob=`${item?.name||''} ${item?.description||''} ${item?.styleTags||''}`.toLowerCase();
 const pattern=(/plaid|stripe|floral|leopard|quilt|paisley/.exec(blob)||['not recorded'])[0];
 const material=(/leather|denim|silk|cotton|knit|wool|satin|linen|suede/.exec(blob)||['not recorded'])[0];
 return {pattern, material};
}
function describe(item, voiceTag){
 const extra=bits(item);
 const fit=item?.description?` Fit note from the record: ${item.description}`:' A fit note is not recorded.';
 const tag=voiceTag?` Voice tag: ${voiceTag}.`:'';
 return `${item?.category||'Piece'}: ${item?.name||'unnamed'}. Color: ${plainColor(item)}. Pattern: ${extra.pattern}. Material: ${extra.material}. Brand: ${item?.brand||'not recorded'}. Size: ${item?.size||'not recorded'}.${fit}${tag} A hanger location is not recorded yet.`;
}
function find(query, items, tags){
 const words=String(query||'').toLowerCase().replace(/.*find my/,'').trim().split(/\s+/).filter(Boolean);
 const owned=(items||[]).filter(C.owned);
 const hit=owned.find(item=>words.every(word=>`${item.name} ${item.description||''} ${item.category||''} ${(tags&&tags[item.id])||''}`.toLowerCase().includes(word)));
 if(!hit) return {short:`No owned piece matches ${words.join(' ')||'that'}.`, more:'', item:null, match:false};
 return {short:`${hit.name}. A hanger location is not recorded yet.`, more:describe(hit, tags&&tags[hit.id]), item:hit, match:true};
}
function dressMe(occasion, items, looks){
 const word=String(occasion||'today').toLowerCase();
 const byId=new Map((items||[]).map(item=>[item.id, item]));
 const look=(looks||[]).find(row=>((row.occasions||[]).join(' ')+' '+(row.title||'')).toLowerCase().includes(word)&& (row.pieces||[]).every(id=>byId.get(id)&&C.owned(byId.get(id))));
 if(!look) return {short:`No saved look is marked for ${word}.`, more:'', match:false};
 const pieces=(look.pieces||[]).map(id=>byId.get(id)).filter(Boolean);
 return {short:`Wear ${look.title}.`, more:pieces.map(item=>describe(item)).join(' '), look, match:true};
}
function whatIsThis(words, items, looks){
 const q=String(words||'').toLowerCase();
 const owned=(items||[]).filter(C.owned);
 const hit=owned.find(item=>q.includes(item.name.toLowerCase())||item.name.toLowerCase().split(' ').filter(word=>word.length>3).every(word=>q.includes(word)));
 if(!hit) return {short:'Nothing already owned matches those words.', more:'Point the phone camera only after you ask. The glasses camera is not connected.', match:false};
 const byId=new Map(owned.map(item=>[item.id, item]));
 const look=(looks||[]).find(row=>(row.pieces||[]).includes(hit.id));
 const partners=(look?.pieces||[]).map(id=>byId.get(id)).filter(item=>item&&item.id!==hit.id).slice(0,2).map(item=>item.name);
 return {short:`This is close to your ${hit.name}.`, more:`${describe(hit)} ${partners.length?`It is already paired with ${partners.join(' and ')}.`:hit.styling||'No pairing is recorded.'}`, item:hit, match:true};
}
function scanDraft(words){
 const name=String(words||'').replace(/scan( a)? piece:?/i,'').trim();
 if(!name) return {short:'Say what the piece is, then I will read it back.', more:'', pending:null};
 const draft={name, spoken:`I heard ${name}. Nothing is saved until you say yes, save it.`};
 return {short:draft.spoken, more:'Confirm to keep this scan on this phone. It does not enter My Closet until you confirm it there too.', pending:draft};
}
const api={plainColor, describe, find, dressMe, whatIsThis, scanDraft};
if(typeof module!=='undefined') module.exports=api;
root.StyleProAccessCore=api;
})(typeof window!=='undefined'?window:globalThis);
