import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate,cumulativeCost,totals} from '../core.js';
import {replay,planSync,SheetsLog,HEADER} from '../sync.js';

const state=()=>validate({...seed(),sessions:[...seed().sessions,...[[14,1.96],[2,.28],[24,3.25]].map(([kwh,cost],i)=>({...seed().sessions[0],id:'extra-'+i,kwh,cost,costKind:'estimate'}))]});
function initial(s){const {sessions,...settings}=s;return [...sessions.map(r=>['import-'+r.id,'session:'+r.id,'',JSON.stringify(r)]),['import-settings','settings','',JSON.stringify(settings)]];}

test('six records total 109 kWh and 1510 cents; replay retains exact source values',()=>{
 const s=state(),before=structuredClone(s),result=replay(initial(s));assert.deepEqual(result.raw,s);assert.deepEqual(s,before);
 assert.equal(totals(result.raw.sessions).kwh,109);assert.equal(cumulativeCost(result.raw.sessions).totalCents,1510);
});
test('two phones adding different records and retrying requests retain both exactly once',()=>{
 const base=state(),log=initial(base),remote=replay(log);
 const add=id=>({...base,sessions:[...base.sessions,{...base.sessions[0],id}]});
 const a=planSync(base,add('phone-a'),remote,()=> 'operation-a');
 const b=planSync(base,add('phone-b'),remote,()=> 'operation-b');
 const next=replay([...log,...a,...b,...a,...b]);assert.equal(next.raw.sessions.length,8);
 assert.deepEqual(next.raw.sessions.find(r=>r.id==='phone-a'),add('phone-a').sessions.at(-1));
 assert.equal(planSync(base,base,next).length,0);
});
test('concurrent changes of the same recharge stop without silently choosing a value',()=>{
 const base=state(),log=initial(base),remote=replay(log);
 const edit=cost=>({...base,sessions:base.sessions.map((r,i)=>i? r:{...r,cost})});
 const a=planSync(base,edit(4),remote,()=> 'a'),b=planSync(base,edit(5),remote,()=> 'b');
 assert.throws(()=>replay([...log,...a,...b]),/Conflit/);
 assert.throws(()=>planSync(base,edit(5),replay([...log,...a])),/différentes/);
 assert.equal(base.sessions[0].cost,2.78);
});
test('first connection detects conflicting legacy records, skips duplicates and never deletes',()=>{
 const s=state(),r=replay(initial(s));assert.deepEqual(planSync(null,s,r),[]);
 assert.throws(()=>planSync(null,{...s,sessions:s.sessions.map((v,i)=>i?v:{...v,cost:99})},r),/différentes/);
 assert.throws(()=>planSync(s,{...s,sessions:s.sessions.slice(1)},r),/Suppression/);
 assert.throws(()=>replay([...initial(s),['import-settings','settings','','{}']]),/réutilisé/);
});
test('HTTP transport is authenticated, appends typed cells without table inference, and verifies readback',async()=>{
 const log=initial(state()),requests=[];
 const client=new SheetsLog({spreadsheetId:'test-sheet',accessToken:()=> 'test-token',fetcher:async(url,opts)=>{
  requests.push([url,opts]);if(opts.method==='POST'){log.push(...JSON.parse(opts.body).requests[0].appendCells.rows.map(r=>r.values.map(v=>v.userEnteredValue.stringValue)));return {ok:true,json:async()=>({})};}
  if(url.includes('?fields='))return {ok:true,json:async()=>({sheets:[{properties:{sheetId:123,title:'TeslaChargeSync'}}]})};
  return {ok:true,json:async()=>({values:[HEADER,...log]})};
 }});
 const base=state(),remote=await client.read(),local={...base,sessions:[...base.sessions,{...base.sessions[0],id:'new'}]};
 const rows=planSync(base,local,remote,()=> 'new-op');const verified=await client.append(rows);
 assert.equal(verified.raw.sessions.length,7);assert.ok(requests.every(([url,opts])=>!url.includes('test-token')&&opts.headers.Authorization==='Bearer test-token'));
 const [url,opts]=requests.find(([,o])=>o.method==='POST');assert.match(url,/:batchUpdate$/);const appended=JSON.parse(opts.body).requests[0].appendCells;assert.equal(appended.sheetId,123);assert.deepEqual(appended.rows.map(r=>r.values.map(v=>v.userEnteredValue.stringValue)),rows);
});
test('expired authorization and failed readback never report success',async()=>{
 const expired=new SheetsLog({spreadsheetId:'test',accessToken:()=>'',fetcher:()=>assert.fail()});await assert.rejects(expired.read(),/Connexion Google/);
 const denied=new SheetsLog({spreadsheetId:'test',accessToken:()=> 'token',fetcher:async()=>({ok:false,status:403})});await assert.rejects(denied.read(),/refusé/);
 const missing=new SheetsLog({spreadsheetId:'test',accessToken:()=> 'token',fetcher:async url=>({ok:true,json:async()=>url.includes('?fields=')?{sheets:[{properties:{sheetId:123,title:'TeslaChargeSync'}}]}:{values:[HEADER,...initial(state())]}})});
 await assert.rejects(missing.append([['missing','session:new','',JSON.stringify({...state().sessions[0],id:'new'})]]),/non confirmée/);
});
test('browser transport invokes fetch with its global receiver',async()=>{
 const client=new SheetsLog({spreadsheetId:'test',accessToken:()=> 'token',fetcher:async function(){assert.equal(this,globalThis);return {ok:true,json:async()=>({values:[HEADER,...initial(state())]})};}});
 assert.equal((await client.read()).raw.sessions.length,6);
});
