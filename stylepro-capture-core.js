/* Pure capture and curation rules. One physical piece, one value contribution. */
(function(root){'use strict';
const M=typeof module!=='undefined'?require('./stylepro-mvp-core.js'):root.StyleProMvpCore;
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
function rollup(records,values){const ids=[...new Set(records.filter(r=>r.confirmed).map(r=>r.itemId))];return {pieces:ids.length,valued:ids.filter(id=>M.validValue(values[id])).length,pending:ids.filter(id=>!M.validValue(values[id])&&values[id]?.mode!=='none').length,totalCents:ids.reduce((s,id)=>s+(M.validValue(values[id])?values[id].amountCents:0),0)};}
function contribution(oldValue,newValue){return (M.validValue(newValue)?newValue.amountCents:0)-(M.validValue(oldValue)?oldValue.amountCents:0);}
function stage(record,value){if(!record.confirmed)return 'review';if(M.validValue(value))return 'valued';if(value?.mode==='none')return 'opted_out';return 'valuation_pending';}
function candidates(items,ratings,availability,locks){return items.filter(i=>Number(ratings[i.id])>=1&&Number(ratings[i.id])<=2).map(i=>({item:i,availability:locks[i.id]?.length?'reserved':availability[i.id]||'keeping'}));}
function threeWays(itemId,looks,items){const owned=new Set(items.filter(C.owned).map(i=>i.id)),seen=new Set();return looks.filter(l=>{const key=[...new Set(l.pieces)].sort().join('|');if(!l.pieces.includes(itemId)||l.pieces.some(id=>!owned.has(id))||seen.has(key))return false;seen.add(key);return true}).slice(0,3);}
const api={rollup,contribution,stage,candidates,threeWays};if(typeof module!=='undefined')module.exports=api;root.StyleProCaptureCore=api;
})(typeof window!=='undefined'?window:globalThis);
