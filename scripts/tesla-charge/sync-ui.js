import {getState,replaceSyncedState,message} from './app.js';
import {googleConfig} from './google-config.js';
import {GoogleSession} from './google-auth.js';
import {SheetsLog,resolveConflict,same} from './sync.js';
import {SyncStore,SYNC_KEY,SYNC_LOCK} from './sync-store.js';
import {validate} from './core.js';
const $=s=>document.querySelector(s),status=$('#sync-status'),session=new GoogleSession(googleConfig);
const transport=new SheetsLog({spreadsheetId:googleConfig.spreadsheetId,accessToken:session.accessToken});
const store=new SyncStore({storage:localStorage,transport,spreadsheetId:googleConfig.spreadsheetId});
let busy=false,timer,ready=false,problem='';
const lock=fn=>navigator.locks?navigator.locks.request(SYNC_LOCK,fn):Promise.reject(Error('Mettez à jour Chrome ou Samsung Internet avant de synchroniser.'));
function text(){
 let record;try{record=store.load();}catch(e){status.textContent=e.message;return;}
 const waiting=record&&(!record.base||!same(validate(record.local),validate(record.base))||record.pending.length);
 status.textContent=problem||(busy?'Synchronisation en cours…':!record?'Connectez Google Sheets pour retrouver le même carnet sur vos appareils.':(record.lastSync?'Dernière synchronisation confirmée : '+new Date(record.lastSync).toLocaleString('fr-FR')+'. ':'Première connexion à terminer. ')+(waiting?'Des données attendent leur envoi. ':'Carnet central conservé en cache sur cet appareil. ')+(!session.accessToken()?'Reconnectez Google pour actualiser.':''));
 $('#network').textContent=!record?'Connexion Google à établir':!navigator.onLine?'Hors connexion · en attente':busy?'Synchronisation…':waiting?'En attente de synchronisation':session.accessToken()?'Google Sheets · synchronisé':'Cache Google Sheets · reconnecter';
 $('#sync-connect').disabled=busy||!ready;
 $('#sync-now').disabled=busy||!session.accessToken();
 $('#sync-pick').disabled=busy||!session.accessToken();
 $('#sync-disconnect').disabled=!session.accessToken();
}
function conflictUI(error){
 const area=$('#sync-conflicts');area.replaceChildren();$('#sync-adopt').hidden=true;
 if(error.conflicts?.length){
  for(const conflict of error.conflicts){
   const title=document.createElement('h4');title.textContent='Versions de '+conflict.entity;area.append(title);
   for(const version of conflict.versions){
    const card=document.createElement('div');card.className='sync-version';const details=document.createElement('pre');details.textContent=JSON.stringify(version.value,null,2);
    const button=document.createElement('button');button.textContent='Utiliser cette version (historique conservé)';button.onclick=async()=>{
     if(busy)return;busy=true;text();try{await lock(()=>{const record=store.load();if(!record)throw Error('Connexion initiale à terminer.');if(record.resolutionPending?.length)throw Error('Une résolution attend sa confirmation. Actualisez la synchronisation.');store.save({...record,resolutionPending:[resolveConflict(conflict,version.operation)]});});}catch(e){problem=e.message;}finally{busy=false;}await synchronize();
    };card.append(details,button);area.append(card);
   }
  }
 }else if(/différentes|Doublon possible|Suppression/.test(error.message))$('#sync-adopt').hidden=false;
}
async function synchronize(){
 if(busy)return;if(!navigator.onLine){problem='Hors connexion. Les saisies restent en attente sur cet appareil.';text();return;}
 if(!session.accessToken()){problem='Reconnectez Google pour envoyer ou recevoir les recharges.';text();return;}
 busy=true;problem='';text();
 try{
  const result=await lock(async()=>{
   if(!store.load()){
    const original=localStorage.getItem('tesla-charge-v1');
    if(original&&!localStorage.getItem('tesla-charge-before-sync'))localStorage.setItem('tesla-charge-before-sync',original);
    store.enable(getState());
   }
   return store.run();
  });
  replaceSyncedState(result.local);$('#sync-conflicts').replaceChildren();$('#sync-adopt').hidden=true;
 }catch(e){problem=e.message;conflictUI(e);}
 finally{busy=false;text();}
}
$('#sync-connect').onclick=async()=>{try{await session.connect();problem='';await synchronize();}catch(e){problem=e.message;}text();};
$('#sync-pick').onclick=async()=>{try{await session.pick();problem='';await synchronize();}catch(e){problem=e.message;}text();};
$('#sync-now').onclick=synchronize;
$('#sync-disconnect').onclick=()=>{session.disconnect();problem='Connexion Google fermée. Le cache et les données en attente sont conservés.';text();};
$('#sync-adopt').onclick=async()=>{
 if(busy)return;
 if(!confirm('Afficher le carnet central ? Le carnet actuel sera conservé intégralement dans une archive locale exportable. Aucune donnée centrale ne sera remplacée.'))return;
 busy=true;problem='';text();
 try{const result=await lock(async()=>store.adoptCentral(await transport.read()));replaceSyncedState(result.local);$('#sync-conflicts').replaceChildren();$('#sync-adopt').hidden=true;message('Carnet central affiché. Votre ancienne version reste disponible via « Exporter les archives locales ».');}
 catch(e){problem=e.message;}finally{busy=false;text();}
};
$('#sync-archives').onclick=()=>{
 const records={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(/^tesla-charge-(archive-|before-|ancien-onglet-)/.test(key))records[key]=localStorage.getItem(key);}
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(records,null,2)],{type:'application/json'}));a.href=url;a.download='tesla-charge-archives-locales.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
};
window.addEventListener('tesla-commit',()=>{problem='';clearTimeout(timer);timer=setTimeout(()=>{if(session.accessToken())synchronize();else text();},500);});
window.addEventListener('storage',e=>{if(e.key===SYNC_KEY)text();});
window.addEventListener('online',()=>{problem='';synchronize();});window.addEventListener('offline',text);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&session.accessToken())synchronize();});
setInterval(()=>{if(!document.hidden&&session.accessToken())synchronize();else text();},60000);
text();session.prepare().then(()=>{ready=true;problem='';text();}).catch(e=>{problem=e.message;text();});
