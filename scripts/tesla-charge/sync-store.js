import {validate} from './core.js';
import {planSync,same} from './sync.js';

export const SYNC_KEY='tesla-charge-sync-v1';
export const SYNC_LOCK='tesla-charge-sync';

// One durable envelope contains the visible snapshot, its acknowledged base and
// the stable retry IDs. All tabs must hold the same Web Lock before modifying it.
export class SyncStore {
 constructor({storage,transport,spreadsheetId,uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString()}){
  this.storage=storage;this.transport=transport;this.spreadsheetId=spreadsheetId;this.uuid=uuid;this.now=now;
 }
 load(){
  const text=this.storage.getItem(SYNC_KEY);if(!text)return null;
  const record=JSON.parse(text);
  if(record.schema!==1||record.spreadsheetId!==this.spreadsheetId||!Array.isArray(record.pending))throw Error('Cache de synchronisation incompatible.');
  validate(record.local);if(record.base)validate(record.base);
  return record;
 }
 save(record){this.storage.setItem(SYNC_KEY,JSON.stringify(record));return record;}
 enable(local){
  const old=this.load();if(old)return old;
  validate(local);
  return this.save({schema:1,spreadsheetId:this.spreadsheetId,local:structuredClone(local),base:null,pending:[],lastSync:'',revision:0});
 }
 edit(previous,next){
  const record=this.load();if(!record)throw Error('Connectez Google Sheets avant de saisir.');
  if(!same(validate(record.local),validate(previous)))throw Error('Carnet actualisé depuis un autre onglet. Vérifiez votre saisie puis réessayez.');
  const valid=validate(next),ids=new Set(valid.sessions.map(r=>r.id));
  if(record.local.sessions.some(r=>!ids.has(r.id)))throw Error('Aucune recharge supprimée. Exportez le carnet avant de demander un archivage.');
  return this.save({...record,local:valid,revision:record.revision+1});
 }
 async run(){
  let record=this.load();if(!record)throw Error('Connexion Google requise.');
  let remote=await this.transport.read({allowConflicts:true});
  if(record.resolutionPending?.length){
   if(!record.resolutionPending.every(([id])=>remote.seen.has(id)))remote=await this.transport.append(record.resolutionPending,{allowConflicts:true});
   record=this.save({...record,resolutionPending:[]});
  }
  if(remote.conflicts?.length){const error=Error('Modifications concurrentes : choisissez la version à utiliser. Toutes les versions sont conservées.');error.conflicts=remote.conflicts;throw error;}
  if(record.pending.length){
   if(!record.pending.every(([id])=>remote.seen.has(id)))remote=await this.transport.append(record.pending);
   // Retain the old base until local differences have been fully reconciled.
   record=this.save({...record,base:record.pendingState,pending:[],pendingState:null});
  }
  const pending=planSync(record.base,record.local,remote,this.uuid);
  if(pending.length){
   const staged=structuredClone(remote.raw);
   for(const [,entity,,json] of pending){const value=JSON.parse(json);if(entity==='settings')Object.assign(staged,value);else {const index=staged.sessions.findIndex(r=>r.id===value.id);if(index<0)staged.sessions.push(value);else staged.sessions[index]=value;}}
   record=this.save({...record,local:staged,pending,pendingState:staged}); // Persist BEFORE attempting the request.
   remote=await this.transport.append(pending);
  }
  return this.save({...record,local:structuredClone(remote.raw),base:structuredClone(remote.raw),pending:[],lastSync:this.now(),revision:record.revision+1});
 }
 adoptCentral(remote){
  if(remote.conflicts?.length)throw Error('Résolvez d’abord les versions concurrentes.');
  const record=this.load();if(!record||record.pending.length)throw Error('Des écritures sont en attente. Elles doivent être vérifiées avant de choisir le carnet central.');
  // Keep a permanent, timestamped archive; never erase the old phone snapshot.
  const archive='tesla-charge-archive-'+this.uuid();
  this.storage.setItem(archive,JSON.stringify(record));
  return this.save({...record,local:structuredClone(remote.raw),base:structuredClone(remote.raw),lastSync:this.now(),revision:record.revision+1,archive});
 }
}
