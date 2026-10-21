// Private Google Sheets transport. No token is written to localStorage or the URL.
import {validate} from './core.js';

export const SYNC_TAB='TeslaChargeSync';
export const HEADER=['operation_id','entity_id','parent_operation','json_original'];
const canonical=v=>JSON.stringify(sort(v));
function sort(v){if(Array.isArray(v))return v.map(sort);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])]));return v;}
export const same=(a,b)=>canonical(a)===canonical(b);

// Append-only revisions preserve all older values. A repeated HTTP request cannot
// count a charge twice. Concurrent edits of the same record stop with a conflict.
export function replay(rows,{allowConflicts=false}={}){
 const seen=new Map(),entities=new Map(),heads=new Map(),revisions=new Map(),tips=new Map();
 for(const row of rows){
  if(!row.some(v=>v!==''))continue;
  const [operation,entity,parent='',json]=row;
  if(!operation||!entity||typeof json!=='string'||(!entity.startsWith('session:')&&entity!=='settings'))throw Error('Journal central invalide.');
  const signature=canonical([entity,parent,json]);
  if(seen.has(operation)){if(seen.get(operation)!==signature)throw Error('Identifiant d’opération réutilisé.');continue;}
  const value=JSON.parse(json);
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Donnée centrale invalide.');
  if(entity.startsWith('session:')&&entity!=='session:'+value.id)throw Error('Identifiant de recharge incohérent.');
  const parents=parent.startsWith('[')?JSON.parse(parent):parent?[parent]:[];
  if(!Array.isArray(parents)||parents.some(p=>typeof p!=='string'||revisions.get(p)?.entity!==entity)||new Set(parents).size!==parents.length)throw Error('Historique central incohérent.');
  const frontier=tips.get(entity)||new Set();
  for(const p of parents)frontier.delete(p);
  frontier.add(operation);tips.set(entity,frontier);
  revisions.set(operation,{entity,value,parents});
  seen.set(operation,signature);heads.set(entity,operation);entities.set(entity,value);
 }
 const settings=entities.get('settings');
 if(!settings)throw Error('Réglages centraux absents.');
 const raw={...settings,sessions:[...entities].filter(([id])=>id.startsWith('session:')).map(([,v])=>structuredClone(v))};
 validate(raw); // Check compatibility without changing any original field.
 const conflicts=[...tips].filter(([,ids])=>ids.size>1).map(([entity,ids])=>({entity,versions:[...ids].map(operation=>({operation,value:revisions.get(operation).value}))}));
 if(conflicts.length&&!allowConflicts){const e=Error('Conflit de synchronisation : toutes les versions sont conservées dans Google Sheets.');e.conflicts=conflicts;throw e;}
 return {raw,heads,seen,conflicts};
}

export function resolveConflict(conflict,operation,uuid=()=>crypto.randomUUID()){
 const selected=conflict.versions.find(v=>v.operation===operation);if(!selected)throw Error('Version à conserver inconnue.');
 return [uuid(),conflict.entity,JSON.stringify(conflict.versions.map(v=>v.operation).sort()),JSON.stringify(selected.value)];
}

function entities(state){const {sessions,...settings}=validate(state);return new Map([['settings',settings],...sessions.map(r=>['session:'+r.id,r])]);}

// Use the last acknowledged state as the base. Never replace the whole Sheet
// with a stale phone snapshot, and never infer deletions from missing records.
export function planSync(base,local,remote,uuid=()=>crypto.randomUUID()){
 const before=base?entities(base):new Map(),here=entities(local),there=entities(remote.raw),rows=[];
 for(const [id,previous] of before){if(!here.has(id))throw Error('Suppression refusée : '+id+'. Exportez et vérifiez les données.');}
 for(const [id,value] of here){
  if(!base&&id==='settings')continue; // Initial connection adopts central settings.
  const old=before.get(id),central=there.get(id);
  if(same(value,central)||same(value,old))continue;
  if(!same(central,old))throw Error('Valeurs différentes sur les appareils : '+id+'. Aucune valeur remplacée.');
  if(!base&&!central&&id.startsWith('session:')&&remote.raw.sessions.some(r=>r.id!==value.id&&r.kwh===value.kwh&&r.start===value.start))throw Error('Doublon possible : même date et même énergie avec un autre identifiant. Vérifiez les deux recharges.');
  rows.push([uuid(),id,remote.heads.get(id)||'',JSON.stringify(value)]);
 }
 return rows;
}

export class SheetsLog {
 constructor({spreadsheetId,accessToken,fetcher=fetch}){
  if(!/^[\w-]+$/.test(spreadsheetId))throw Error('Identifiant Google Sheets invalide.');
  this.root='https://sheets.googleapis.com/v4/spreadsheets/'+spreadsheetId;
  this.accessToken=accessToken;this.fetcher=fetcher.bind(globalThis);
 }
 async request(path,options={}){
  const token=this.accessToken();if(!token)throw Error('Connexion Google requise.');
  const response=await this.fetcher(this.root+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(response.status===401?'Connexion Google expirée.':response.status===403||response.status===404?'Accès Google Sheets refusé ou fichier non sélectionné. Choisissez votre classeur avec le bouton « Choisir mon classeur », ou vérifiez le compte Google.':'Synchronisation indisponible ('+response.status+').');
  return response.json();
 }
 async read(options){
  const range=encodeURIComponent("'"+SYNC_TAB+"'!A:D"),result=await this.request('/values/'+range+'?valueRenderOption=UNFORMATTED_VALUE');
  const [header,...rows]=result.values||[];
  if(!same(header,HEADER))throw Error('En-tête du journal central invalide.');
  return replay(rows,options);
 }
 async append(rows,options){
  if(!rows.length)return;
  // Callers persist these stable operation IDs before sending, and retain them
  // on timeout. Retrying the SAME rows is safe; regenerating IDs is not.
  if(this.sheetId===undefined){
   const metadata=await this.request('?fields=sheets(properties(sheetId,title))');
   const sheet=metadata.sheets?.find(s=>s.properties.title===SYNC_TAB);
   if(!sheet)throw Error('Onglet du journal central absent.');
   this.sheetId=sheet.properties.sheetId;
  }
  // appendCells targets the actual worksheet and is atomic. values.append uses
  // table inference, which can insert before a header when columns are hidden.
  await this.request(':batchUpdate',{method:'POST',body:JSON.stringify({requests:[{appendCells:{sheetId:this.sheetId,rows:rows.map(row=>({values:row.map(value=>({userEnteredValue:{stringValue:value}}))})),fields:'userEnteredValue'}}]})});
  const verified=await this.read(options);
  for(const [id] of rows)if(!verified.seen.has(id))throw Error('Écriture non confirmée : conserver la file d’attente.');
  return verified;
 }
}
