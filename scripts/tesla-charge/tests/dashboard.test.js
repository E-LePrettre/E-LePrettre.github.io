import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate,correctOctober18Checkpoint,costBreakdown} from '../core.js';
test('obsolete 71 checkpoint becomes confirmed 85/9.61 once, without editing sessions',()=>{
 const s=validate({...seed(),checkpoint:{date:'2026-10-17',kwh:71,cost:9.61,note:'ancien'}}),before=structuredClone(s);
 const next=correctOctober18Checkpoint(s);
 assert.deepEqual(s,before);assert.deepEqual(next.sessions,s.sessions);
 assert.equal(next.checkpoint.kwh,85);assert.equal(next.checkpoint.cost,9.61);
 assert.deepEqual(next.checkpointHistory,[s.checkpoint]);
 const persisted=validate(JSON.parse(JSON.stringify(next)));
 assert.deepEqual(persisted.checkpointHistory,[s.checkpoint]);assert.equal(correctOctober18Checkpoint(persisted),persisted);
});
test('newer or independently edited checkpoints stay untouched',()=>{
 for(const c of [{date:'2026-10-19',kwh:100,cost:12},{date:'2026-10-17',kwh:72,cost:9.61},{date:'2026-10-17',kwh:71,cost:10}]){
 const s=validate({...seed(),checkpoint:c});assert.equal(correctOctober18Checkpoint(s),s);
 }
});
test('reported 9.61 and estimated 1.90 stay separate',()=>{
 const rows=[...validate(seed()).sessions,{cost:1.90,costKind:'estimate'},{cost:null,costKind:'unknown'}];
 const costs=costBreakdown(rows);assert.ok(Math.abs(costs.reported-9.61)<1e-9);assert.equal(costs.estimated,1.9);assert.equal(costs.unknown,1);
});
