import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate,session,cumulativeCost,applyConfirmedLossesToLast14,reclassifyHome} from '../core.js';
const last=()=>session({id:'last14',start:'2026-10-18',end:'2026-10-18',location:'home',kwh:14,cost:1.90,costKind:'estimate',energyKind:'tesla',color:'blue',timingMode:'all-hc',lossCoefficient:1,tempoEstimate:{coefficient:1,cost:1.8984,details:[{day:'2026-10-18',color:'blue',period:'HC',kwh:14,rate:0.1356}],source:'fixture',effective:'2026-08-01'}});
test('9.61 recorded plus 1.96 estimated displays 11.57, without adding Tesla checkpoint',()=>{
 const s={...validate(seed()),sessions:[...validate(seed()).sessions,last()]},before=structuredClone(s),adjusted=applyConfirmedLossesToLast14(s);
 assert.deepEqual(s,before);assert.deepEqual(adjusted.sessions.slice(0,3),s.sessions.slice(0,3));assert.deepEqual(adjusted.checkpoint,s.checkpoint);
 assert.equal(adjusted.sessions.length,4);assert.equal(adjusted.sessions.at(-1).cost,1.96);assert.equal(adjusted.sessions.at(-1).lossCoefficient,1.03);
 assert.deepEqual(cumulativeCost(adjusted.sessions),{totalCents:1157,reportedCents:961,estimatedCents:196,estimatedCount:1,missing:0});
 const persisted=validate(JSON.parse(JSON.stringify(adjusted)));assert.equal(applyConfirmedLossesToLast14(persisted),persisted);
});
test('real cost replaces the estimate in the same record',()=>{
 const s=applyConfirmedLossesToLast14({...validate(seed()),sessions:[...validate(seed()).sessions,last()]});
 const actual=s.sessions.map(r=>r.id==='last14'?{...r,cost:1.95,costKind:'reported'}:r),total=cumulativeCost(actual);
 assert.equal(total.totalCents,1156);assert.equal(total.estimatedCents,0);assert.equal(actual.length,4);
});
test('reclassification never changes the aggregate cost',()=>{
 const s={...validate(seed()),sessions:[{...last(),location:'other'}]};assert.deepEqual(cumulativeCost(s.sessions),cumulativeCost(reclassifyHome(s,'last14').sessions));
});
test('never adjust real prices, unrelated charges, different coefficients or ambiguous duplicate candidates',()=>{
 for(const changes of [{costKind:'reported'},{kwh:15},{start:'2026-10-19'},{lossCoefficient:1.1}]){
 const s={...validate(seed()),sessions:[{...last(),...changes}]};assert.equal(applyConfirmedLossesToLast14(s),s);
 }
 const s={...validate(seed()),sessions:[last(),{...last(),id:'ambiguous'}]};assert.equal(applyConfirmedLossesToLast14(s),s);
});
test('missing prices are marked partial and each rounded price is summed in cents',()=>{
 assert.deepEqual(cumulativeCost([{cost:0.1,costKind:'reported'},{cost:0.2,costKind:'estimate'},{cost:null,costKind:'unknown'}]),{totalCents:30,reportedCents:10,estimatedCents:20,estimatedCount:1,missing:1});
});
