/* Did my stylist nail it? Stored locally and turned into stylist preferences. */
(function(root){
'use strict';
const KEY='stylepro-stylist-verdicts-v1';
const VERDICTS={nailed:'Nailed it', close:'Close', miss:'Miss'};
const OFF=[['color','Color'],['fit','Fit'],['vibe','Vibe'],['too-young','Too young'],['too-formal','Too formal']];
function blank(){return {version:1, records:[]};}
function save(store, input){
 const verdict=input&&input.verdict;
 if(!VERDICTS[verdict]) throw Error('Choose Nailed it, Close, or Miss.');
 const stars=input.stars==null||input.stars===''?null:Number(input.stars);
 if(stars!=null&&(!Number.isInteger(stars)||stars<1||stars>5)) throw Error('Stars are 1 to 5.');
 const off=verdict==='nailed'?[]:[...new Set(input.off||[])].filter(id=>OFF.some(row=>row[0]===id));
 const row={lookId:String(input.lookId||''), signature:String(input.signature||''), title:String(input.title||'').slice(0,120), pieces:[...new Set(input.pieces||[])], verdict, stars, off, at:input.at||''};
 if(!row.lookId) throw Error('A look is required.');
 const records=(store&&store.records||[]).filter(item=>item.lookId!==row.lookId);
 records.push(row);
 return {version:1, records};
}
function preferences(store){
 const records=store&&store.records||[];
 const excludedSignatures=[], boostItemIds=[], avoidColors=[];
 let lessFormal=false, lessYoung=false, fitNoted=false;
 for(const row of records){
  if(row.verdict==='miss'&&row.signature) excludedSignatures.push(row.signature);
  if(row.verdict==='nailed') row.pieces.forEach(id=>boostItemIds.push(id));
  if(row.off.includes('color')) avoidColors.push(row.lookId);
  if(row.off.includes('too-formal')) lessFormal=true;
  if(row.off.includes('too-young')) lessYoung=true;
  if(row.off.includes('fit')) fitNoted=true;
 }
 return {excludedSignatures, boostItemIds, lessFormal, lessYoung, fitNoted, colorMisses:avoidColors.length};
}
function promptAddendum(store){
 const records=store&&store.records||[];
 if(!records.length) return '';
 const lines=['She reviewed looks on her doll. Use this on the next edit. Do not comment on her body.'];
 const missed=records.filter(row=>row.verdict==='miss').map(row=>row.title).filter(Boolean);
 const nailed=records.filter(row=>row.verdict==='nailed').map(row=>row.title).filter(Boolean);
 if(nailed.length) lines.push('She marked nailed: '+nailed.join('; ')+'.');
 if(missed.length) lines.push('Do not repeat: '+missed.join('; ')+'.');
 if(records.some(row=>row.off.includes('color'))) lines.push('Color was off. Choose a different palette.');
 if(records.some(row=>row.off.includes('fit'))) lines.push('Fit was off. Adjust length and ease of the clothes. Do not comment on her body.');
 if(records.some(row=>row.off.includes('vibe'))) lines.push('The vibe was off. Change the direction.');
 if(records.some(row=>row.off.includes('too-young'))) lines.push('The edit felt too young. Choose a more adult edit. Do not comment on age.');
 if(records.some(row=>row.off.includes('too-formal'))) lines.push('Too formal. Keep it polished and less dressy.');
 return lines.join(' ');
}
function learning(store){return !!(store&&store.records&&store.records.length);}
const api={KEY, VERDICTS, OFF, blank, save, preferences, promptAddendum, learning};
if(typeof module!=='undefined') module.exports=api;
root.StyleProVerdictCore=api;
})(typeof window!=='undefined'?window:globalThis);
