/* Search closet and vanity records by the words she used. */
(function(root){
'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function blob(row){
 return norm([row.brand,row.line,row.name,row.shadeName,row.shadeNumber,row.finish,row.place,row.city,row.country,row.notes,row.purchased,row.kind,row.category].filter(Boolean).join(' '));
}
function monthName(iso){
 const n=Number(String(iso||'').slice(5,7));
 return ['','january','february','march','april','may','june','july','august','september','october','november','december'][n]||'';
}
function search(query, records){
 const text=norm(query);
 const tokens=text.split(/[^a-z0-9]+/).filter(word=>word&&!['what','do','i','have','the','one','got','in','a','my'].includes(word));
 const rows=(records||[]).map(row=>({row, text:blob(row)+' '+monthName(row.purchased)}));
 const hits=rows.filter(item=>tokens.every(word=>item.text.includes(word)||(word==='france'&&item.text.includes('versailles'))||(word==='june'&&item.text.includes('june'))));
 if(!hits.length) return {matches:[], ask:''};
 if(hits.length===1) return {matches:hits.map(item=>item.row), ask:''};
 const places=[...new Set(hits.map(item=>item.row.city).filter(Boolean))];
 return {matches:hits.map(item=>item.row), ask:places.length>1?'Which place: '+places.join(' or ')+'?':'Which one: '+hits.map(item=>item.row.shadeName||item.row.name).join(', or ')+'?'};
}
const api={search};
if(typeof module!=='undefined') module.exports=api;
root.StyleProAskCore=api;
})(typeof window!=='undefined'?window:globalThis);
