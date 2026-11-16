/* Social and past-content import. Links are stored. The platforms are not connected. */
(function(root){'use strict';
const LABEL='Instagram and Pinterest are not connected. Links stay on this device. Importing posts would need each platform’s permission.';
function normalizeLink(entry){
 const network=String(entry?.network||'link').toLowerCase();
 const url=String(entry?.url||'').trim();
 if(!url) return null;
 if(!/^https?:\/\//i.test(url)) return {network,url:'https://'+url.replace(/^\/+/,''),storedOnly:true};
 return {network,url,storedOnly:true};
}
async function importPicked({links=[],photos=[]}={}){
 const saved=(Array.isArray(links)?links:[]).map(normalizeLink).filter(Boolean).slice(0,12);
 const photoCount=Array.isArray(photos)?photos.length:0;
 return {connected:false,mode:'stub',provider:null,fetched:0,photos:photoCount,links:saved,label:LABEL};
}
const api={importPicked,LABEL};
if(typeof module!=='undefined') module.exports=api;
root.StyleProImport=api;
})(typeof window!=='undefined'?window:globalThis);
