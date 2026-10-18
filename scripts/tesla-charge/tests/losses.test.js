import {test} from 'node:test';
import assert from 'node:assert/strict';
import {session,seed,validate} from '../core.js';
globalThis.localStorage={getItem:()=>null};
const {costForSession}=await import('../tempo.js');
test('14 kWh at the verified example rate with 3 percent gives 1.96 rounded',async()=>{
 const r=session({id:'example',kwh:14,energyKind:'tesla',costKind:'unknown',color:'blue',location:'home',timingMode:'all-hc',lossCoefficient:1.03});
 const before=structuredClone(r);
 const result=await costForSession(r,{tariffs:{blue_HC:0.1356},tariffSource:'Example fixture',tariffDate:'2026-08-01'});
 assert.equal(result.cost.toFixed(2),'1.96');assert.equal(result.coefficient,1.03);assert.deepEqual(r,before);
});
test('a reported final Tesla price is stored unchanged for HC, HP and mixed',()=>{
 for(const period of ['HC','HP','unknown']){
 const r=session({id:period,start:'2026-10-18',kwh:14,cost:1.96,energyKind:'tesla',costKind:'reported',period,lossCoefficient:1.03});
 assert.equal(r.cost,1.96);assert.equal(r.kwh,14);assert.equal(r.costKind,'reported');
 }
});
test('partial or complete cost coverage survives saving without changing records',()=>{
 for(const costCoverage of ['complete','partial','unknown']){
 const original=validate(seed()),out=validate({...original,checkpoint:{...original.checkpoint,costCoverage}});
 assert.equal(out.checkpoint.costCoverage,costCoverage);assert.deepEqual(out.sessions,original.sessions);
 }
});
