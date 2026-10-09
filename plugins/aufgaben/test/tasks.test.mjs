import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {TaskStore,selected,visible} from '../dist/store.mjs';
import {clock,resolveReminder} from '../dist/time.mjs';
import entry,{senderMember,boundJob,dispatchDue} from '../dist/index.js';

const now=Date.parse('2026-10-09T07:00:00Z');
test('Berlin default 15:00, explicit time, relative minutes, DST and past rejection',()=>{
  assert.equal(clock(now).tomorrow,'2026-10-10');
  assert.equal(resolveReminder({date:'2026-10-10'},now),'2026-10-10T13:00:00.000Z');
  assert.equal(resolveReminder({date:'2026-10-30'},now),'2026-10-30T14:00:00.000Z');
  assert.equal(resolveReminder({date:'2026-10-10',time:'10:30'},now),'2026-10-10T08:30:00.000Z');
  assert.equal(resolveReminder({afterMinutes:120},now),'2026-10-09T09:00:00.000Z');
  for(const p of [{date:'2026-10-25',time:'02:30'},{date:'2027-03-28',time:'02:30'},{date:'2026-02-30'},{date:'2026-10-08'},{time:'15:00'},{date:'2026-10-10',at:'2026-10-10T00:00:00Z'}])assert.throws(()=>resolveReminder(p,now));
  assert.equal(resolveReminder({},now),null);
});
const members=[{id:'leon',name:'Leon',phone:'+491234567890',senderIds:['+491234567890','123@lid']},{id:'annka',name:'Annka',phone:'+491234567891',senderIds:['+491234567891','456@lid']}];
const job='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const ctx={agentId:'main',messageChannel:'whatsapp',senderIsOwner:true,requesterSenderId:'123@lid',assertInvocationCurrent(){}};
test('trusted sender and exact cron binding; labels/tool args cannot impersonate',()=>{
  assert.equal(senderMember(ctx,members).id,'leon');
  assert.equal(senderMember({...ctx,requesterSenderId:'456@lid'},members).id,'annka');
  for(const c of [{...ctx,senderIsOwner:false},{...ctx,requesterSenderId:'unknown'},{...ctx,messageChannel:'webchat'}])assert.equal(senderMember(c,members),null);
  assert.equal(boundJob({agentId:'main',sessionKey:`agent:main:cron:${job}`},job),true);
  assert.equal(boundJob({agentId:'main',sessionKey:`agent:main:cron:${job}:trigger`},job),true);
  assert.equal(boundJob({agentId:'main',sessionKey:`agent:main:cron:${job}:trigger-wrong`},job),false);
  assert.equal(boundJob({agentId:'main',sessionKey:`agent:main:cron:${job}-wrong`},job),false);
});
test('CRUD, private/shared scope, persistent replay and rescheduling cancels old delivery',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'jarvis-tasks-'));
  try{
    const factories=[],cfg={stateDir:dir,members,automationId:job,callModule:'/fixture.js'};
    entry.register({config:{},pluginConfig:cfg,registerTool:f=>factories.push(f)});
    const tool=(name,c=ctx)=>factories.flatMap(f=>f(c)??[]).find(t=>t.name===name);
    const params={title:'Werkstatttermin buchen',afterMinutes:120};
    const t=(await tool('aufgaben_anlegen').execute('create',params)).details;
    assert.equal((await tool('aufgaben_anlegen').execute('create',params)).details.id,t.id);
    assert.equal((await tool('aufgaben_lesen',{...ctx,requesterSenderId:'456@lid'}).execute('read',{})).details.tasks.length,0);
    await assert.rejects(tool('aufgaben_erledigen',{...ctx,requesterSenderId:'456@lid'}).execute('denied',{taskId:t.id}),/zugaenglich/);
    const shared=(await tool('aufgaben_anlegen').execute('shared',{title:'Balkon',shared:true})).details;
    assert.equal((await tool('aufgaben_lesen',{...ctx,requesterSenderId:'456@lid'}).execute('read2',{})).details.tasks[0].id,shared.id);
    await tool('aufgaben_erinnerung_verschieben').execute('move',{taskId:t.id,afterMinutes:180});
    await tool('aufgaben_erledigen').execute('done',{taskId:t.id});
    const store=new TaskStore(dir),saved=store.read().tasks.find(x=>x.id===t.id);
    assert.equal(saved.status,'completed');assert.equal(saved.deliveries[0].status,'cancelled');
    await tool('aufgaben_loeschen').execute('delete',{taskId:shared.id});
    assert.equal((await tool('aufgaben_lesen').execute('final',{})).details.tasks.length,0);
    assert.equal(new TaskStore(dir).read().tasks.length,2);
    assert.equal((await (await import('node:fs/promises')).stat(store.file)).mode&0o077,0);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('due dispatcher claims before effects, fixed owners, voice fallback outcome, no retry and completion suppression',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'jarvis-due-'));
  try{
    const store=new TaskStore(dir);let count=0;
    await store.transaction(s=>s.tasks.push({id:'one',title:'Werkstatt',members:['leon','annka'],status:'open',revision:1,reminderAt:new Date(Date.now()-1000).toISOString(),deliveries:members.map(m=>({member:m.id,status:'pending'}))}));
    const cfg={members,dryRun:true};
    assert.equal((await dispatchDue(store,cfg,{},null,{},()=>{})).due,1);assert.equal(store.read().tasks[0].deliveries[0].status,'pending');cfg.dryRun=false;
    await dispatchDue(store,cfg,{},async p=>{
      count++;assert.equal(p.fallbackOnCallError,true);assert.equal(p.target,members[count-1].phone);
      assert.equal(store.read().tasks[0].deliveries[count-1].status,'attempted');
      return count===1?{called:false}:{called:true};
    },{},()=>{});
    assert.equal(count,2);assert.deepEqual(store.read().tasks[0].deliveries.map(d=>d.status),['voice-sent','called']);
    await dispatchDue(new TaskStore(dir),cfg,{},async()=>{count++;}, {},()=>{});assert.equal(count,2);
    await store.transaction(s=>{const t=s.tasks[0];t.deliveries=[{member:'leon',status:'pending'}];});
    await dispatchDue(store,cfg,{},async()=>{count++;throw new Error('unknown call outcome');},{},()=>{});
    await dispatchDue(store,cfg,{},async()=>{count++;},{},()=>{});assert.equal(count,3);
    await store.transaction(s=>{s.tasks[0].status='completed';s.tasks[0].deliveries=[{member:'leon',status:'pending'}];});
    await dispatchDue(store,cfg,{},async()=>{count++;},{},()=>{});assert.equal(count,3);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('simultaneous writes persist all tasks; retired invocation cannot commit',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'jarvis-lock-'));
  try{
    const s=new TaskStore(dir);
    await Promise.all(Array.from({length:12},(_,i)=>s.transaction(x=>x.tasks.push({id:String(i),members:['leon'],status:'open',revision:1,deliveries:[]}))));
    assert.equal(s.read().tasks.length,12);
    await assert.rejects(s.transaction(x=>x.tasks.push({}),()=>{throw new Error('retired');}),/retired/);
    assert.equal(s.read().tasks.length,12);
  }finally{await rm(dir,{recursive:true,force:true});}
});
