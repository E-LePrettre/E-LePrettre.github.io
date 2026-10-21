import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate} from '../core.js';
import {replay,planSync,resolveConflict} from '../sync.js';
import {SyncStore,SYNC_KEY} from '../sync-store.js';
const memory=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const initial=s=>{const {sessions,...settings}=s;return [['settings','settings','',JSON.stringify(settings)],...sessions.map(r=>['initial-'+r.id,'session:'+r.id,'',JSON.stringify(r)])];};
function backend(s){const rows=initial(s);return {rows,read:async()=>replay(rows),append:async added=>{rows.push(...added);return replay(rows);}};}
const edit=(s,n)=>({...s,sessions:s.sessions.map((r,i)=>i?r:{...r,cost:n})});
test('timeout AFTER remote append, restart, offline further edit: no duplicate and latest edit survives',async()=>{
 const s=validate(seed()),transport=backend(s),storage=memory();let id=0;
 let client=new SyncStore({storage,transport,spreadsheetId:'test',uuid:()=> 'op-'+ ++id});client.enable(s);await client.run();
 client.edit(s,edit(s,4));const original=transport.append;
 transport.append=async rows=>{await original(rows);throw Error('network lost after write');};
 await assert.rejects(client.run(),/network lost/);assert.equal(client.load().pending.length,1);
 client.edit(client.load().local,edit(client.load().local,5));
 transport.append=original;client=new SyncStore({storage,transport,spreadsheetId:'test',uuid:()=> 'op-'+ ++id});
 const done=await client.run();assert.equal(done.local.sessions[0].cost,5);assert.equal(done.pending.length,0);assert.equal(transport.rows.filter(r=>r[1]==='session:initial-1').length,3);
});
test('storage failure prevents any remote write',async()=>{
 const s=validate(seed()),transport=backend(s),storage=memory();const client=new SyncStore({storage,transport,spreadsheetId:'test'});
 client.enable(s);await client.run();client.edit(s,edit(s,4));const count=transport.rows.length;
 storage.setItem=()=>{throw Error('disk full');};await assert.rejects(client.run(),/disk full/);assert.equal(transport.rows.length,count);
});
test('two independent phone caches merge different changes and refresh both',async()=>{
 const s=validate(seed()),transport=backend(s),a=new SyncStore({storage:memory(),transport,spreadsheetId:'test'}),b=new SyncStore({storage:memory(),transport,spreadsheetId:'test'});
 a.enable(s);b.enable(s);await a.run();await b.run();
 a.edit(s,edit(s,4));b.edit(s,{...s,sessions:s.sessions.map((r,i)=>i===1?{...r,cost:7}:r)});
 await a.run();await b.run();await a.run();assert.deepEqual(a.load().local,b.load().local);assert.equal(a.load().local.sessions[0].cost,4);assert.equal(a.load().local.sessions[1].cost,7);
});
test('concurrent central revisions remain archived and explicit resolution restores a usable log',()=>{
 const s=validate(seed()),rows=initial(s),remote=replay(rows),a=planSync(s,edit(s,4),remote,()=> 'a'),b=planSync(s,edit(s,5),remote,()=> 'b');rows.push(...a,...b);
 assert.throws(()=>replay(rows),/Conflit/);const conflicted=replay(rows,{allowConflicts:true});assert.equal(conflicted.conflicts.length,1);
 rows.push(resolveConflict(conflicted.conflicts[0],'a',()=> 'resolve'));const resolved=replay(rows);assert.equal(resolved.raw.sessions[0].cost,4);assert.equal(resolved.conflicts.length,0);assert.ok(rows.some(r=>r[0]==='b'));
});
test('adopting central makes an archive before changing visible data; no deletion or stale tab edit',async()=>{
 const s=validate(seed()),storage=memory(),transport=backend(s),client=new SyncStore({storage,transport,spreadsheetId:'test',uuid:()=> 'archive-id'});
 client.enable(edit(s,99));const record=client.adoptCentral(await transport.read());assert.deepEqual(JSON.parse(storage.getItem(record.archive)).local,edit(s,99));assert.deepEqual(record.local,s);
 assert.throws(()=>client.edit(edit(s,99),s),/onglet/);assert.throws(()=>client.edit(s,{...s,sessions:s.sessions.slice(1)}),/supprimée/);
 assert.equal(JSON.parse(storage.getItem(SYNC_KEY)).local.sessions.length,s.sessions.length);
});
