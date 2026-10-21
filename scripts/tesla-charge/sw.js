const CACHE='tesla-charge-v28-20261021f';
const ASSETS=['./','./index.html','./style.css','./core.js','./app.js','./extras.js','./tempo.js','./sync.js','./sync-store.js','./sync-ui.js','./google-auth.js','./google-config.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('message',event=>{if(event.data==='version'&&event.ports[0])event.ports[0].postMessage(CACHE);});
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const path of ASSETS){const canonical=new URL(path,self.registration.scope),fresh=new URL(canonical);fresh.searchParams.set('build',CACHE);const response=await fetch(fresh,{cache:'reload'});if(!response.ok)throw Error('Missing PWA asset: '+path);await cache.put(canonical,response);}await self.skipWaiting();})());});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tesla-charge-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin||!event.request.url.startsWith(self.registration.scope))return;event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request)).then(hit=>hit||fetch(event.request)));});

