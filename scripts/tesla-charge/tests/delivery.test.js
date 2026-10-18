import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate,deliverConfirmedNight14,cumulativeCost,session} from '../core.js';
test('a phone without the charge receives it once and totals 11.57',()=>{
 const before=validate(seed()),snapshot=structuredClone(before),after=deliverConfirmedNight14(before);
 assert.deepEqual(before,snapshot);assert.deepEqual(after.sessions.slice(0,3),before.sessions);assert.deepEqual(after.checkpoint,before.checkpoint);
 const r=after.sessions.at(-1);assert.equal(r.kwh,14);assert.equal(r.cost,1.96);assert.equal(r.lossCoefficient,1.03);assert.equal(r.location,'home');assert.equal(r.costKind,'estimate');assert.equal(r.startTime,'');assert.equal(r.endTime,'');
 assert.equal(cumulativeCost(after.sessions).totalCents,1157);
 const persisted=validate(JSON.parse(JSON.stringify(after)));assert.equal(deliverConfirmedNight14(persisted),persisted);
});
test('a phone with the same charge keeps it unchanged without any duplicate',()=>{
 for(const start of ['', '2026-10-17','2026-10-18']){
 const r=session({id:'existing-local-id',start,end:start,kwh:14,cost:1.95,costKind:'reported',energyKind:'tesla',timingMode:'all-hc',location:'other'}),s={...validate(seed()),sessions:[...validate(seed()).sessions,r]},after=deliverConfirmedNight14(s);
 assert.equal(after.sessions.length,s.sessions.length);assert.deepEqual(after.sessions,s.sessions);assert.equal(after.confirmedNight14Applied,true);
 }
});
test('two independent devices receive the same stable identifier',()=>{
 const a=deliverConfirmedNight14(validate(seed())),b=deliverConfirmedNight14(validate(seed()));assert.equal(a.sessions.at(-1).id,b.sessions.at(-1).id);
});
test('an older different 14 kWh charge does not block delivery',()=>{
 const older=session({id:'older',start:'2026-10-01',kwh:14,cost:2,costKind:'reported',energyKind:'tesla'}),s={...validate(seed()),sessions:[older]};assert.equal(deliverConfirmedNight14(s).sessions.length,2);
});
test('a deliberate later deletion stays deleted across subsequent launches',()=>{
 const s=deliverConfirmedNight14(validate(seed())),deleted=validate({...s,sessions:s.sessions.slice(0,3)});assert.equal(deliverConfirmedNight14(deleted),deleted);
});
