const SHELL='stylepro-shell-v1';
const FILES=['./','./index.html','./wardrobe.json','./manifest.webmanifest','./assets/doll/trish-base.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./stylepro-core.js','./stylepro-doll.js','./stylepro-doll-core.js','./stylepro-phone.js','./stylepro-phone-core.js','./stylepro-glasses.js','./stylepro-dress.css','./stylepro.css'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==SHELL&&key!=='stylepro-doll-renders-v1').map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==location.origin) return;
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
  if(response.ok&&(url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('.json')||url.pathname.endsWith('.png')||url.pathname.endsWith('.woff'))){
   const copy=response.clone(); caches.open(SHELL).then(cache=>cache.put(event.request, copy));
  }
  return response;
 }).catch(()=>caches.match('./index.html'))));
});
