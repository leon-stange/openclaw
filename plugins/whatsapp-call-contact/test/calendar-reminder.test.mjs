import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
registerHooks({ resolve(spec, ctx, next) {
  if (spec === 'openclaw/plugin-sdk/channel-outbound') return {
    url: 'data:text/javascript,export const sendDurableMessageBatch=(p)=>globalThis.calendarTestSend(p)', shortCircuit: true,
  };
  return next(spec, ctx);
} });
const { planCalendarReminders } = await import('../dist/calendar-reminder.js');
const { default: entry } = await import('../dist/index.js');
const id='aaabbbbb-1111-2222-3333-444444444444';
const now=Date.parse('2026-10-09T08:30:00Z');
const empty=()=>({version:1,attempts:[]});
const event=(id='one',start='2026-10-09T10:00:00Z')=>({id,start,subject:'Besprechung',isAllDay:false,isCancelled:false,declined:false});

test('two-hour boundary, flags, Berlin date and offset normalization',()=>{
  const events=[event(),event('past','2026-10-09T08:30:00Z'),event('edge','2026-10-09T10:30:00Z'),
    event('later','2026-10-09T10:30:01Z'),{...event('day'),isAllDay:true},
    {...event('cancel'),isCancelled:true},{...event('decline'),declined:true}];
  const plan=planCalendarReminders(events,empty(),now);
  assert.equal(plan.pending.length,2);assert.match(plan.text,/12:00 Uhr: Besprechung/);
  assert.equal(planCalendarReminders([event('one','2026-10-09T12:00:00+02:00')],plan.state,now).pending.length,0);
  assert.throws(()=>planCalendarReminders([event('bad','2026-10-09T10:00:00')],empty(),now));
  assert.throws(()=>planCalendarReminders([event('bad','not-a-dateZ')],empty(),now));
  assert.throws(()=>planCalendarReminders([], {version:1,attempts:[{key:'wrong',expiresAt:now}]}));
});
test('overlapping polls, recurring occurrences and rescheduling',()=>{
  const first=planCalendarReminders([event(),event()],empty(),now);
  assert.equal(first.pending.length,1);
  assert.equal(planCalendarReminders([event()],first.state,now+3600000).pending.length,0);
  assert.equal(planCalendarReminders([event('one','2026-10-09T10:15:00Z')],first.state,now).pending.length,1);
  assert.equal(planCalendarReminders([event('one','2026-10-10T10:00:00Z')],first.state,now+86400000).pending.length,1);
  assert.equal(planCalendarReminders([],first.state,now+9*86400000).state.attempts.length,0);
});
test('bound tool: Leon text only, dry-run, CAS conflict, restart and uncertain send suppression',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'calendar-reminder-test-'));
  const saved={home:process.env.HOME,path:process.env.PATH};
  process.env.HOME=root;process.env.PATH=root+path.delimiter+saved.path;
  try{
    await writeFile(path.join(root,'openclaw'),`#!${process.execPath}\n`+`
      const fs=require('node:fs'),a=process.argv.slice(2),r=process.env.HOME,f=r+'/scratch.json';
      if(a[2]!=='${id}')process.exit(2);
      let s=fs.existsSync(f)?JSON.parse(fs.readFileSync(f)):{currentRevision:0};
      if(a.includes('--set')){
        if(fs.existsSync(r+'/conflict')||Number(a[a.indexOf('--expected-revision')+1])!==s.currentRevision)process.exit(1);
        s={ok:true,currentRevision:s.currentRevision+1,scratch:{content:a[a.indexOf('--set')+1]}};fs.writeFileSync(f,JSON.stringify(s));
      }console.log(JSON.stringify(s));
    `,{mode:0o700});
    const factories=[],cfg={authorizedCaller:'+491234567890',contacts:[{name:'Annka',phone:'+491234567891'}],voiceId:'fixture',calendarReminder:{automationId:id,dryRun:true}};
    entry.register({config:{},pluginConfig:cfg,registerTool:f=>factories.push(f)});
    const ctx={agentId:'main',sessionKey:`agent:main:cron:${id}`,assertInvocationCurrent(){}};
    const get=c=>factories.flatMap(f=>f(c)??[]).find(t=>t.name==='whatsapp_upcoming_calendar_reminder');
    assert.equal(get({...ctx,sessionKey:ctx.sessionKey+'-wrong'}),undefined);
    assert.equal(get({...ctx,agentId:'other'}),undefined);
    let sends=0,fail=false;
    globalThis.calendarTestSend=async p=>{
      sends++;assert.equal(p.to,cfg.authorizedCaller);assert.equal(p.channel,'whatsapp');
      assert.equal(p.payloads.length,1);assert.deepEqual(Object.keys(p.payloads[0]),['text']);
      assert.match(p.deliveryIntentId,/^calendar-reminder:/);
      if(fail)throw new Error('uncertain handoff');
      return {status:'sent',receipt:{primaryPlatformMessageId:'fixture'}};
    };
    const soon=()=>event('actual',new Date(Date.now()+5400000).toISOString());
    const e=soon();
    await get(ctx).execute('preview',{events:[e]});assert.equal(sends,0);
    cfg.calendarReminder.dryRun=false;
    await writeFile(path.join(root,'conflict'),'');
    await assert.rejects(get(ctx).execute('conflict',{events:[e]}),/Scratch/);assert.equal(sends,0);
    await rm(path.join(root,'conflict'));
    await get(ctx).execute('send',{events:[e]});assert.equal(sends,1);
    await get(ctx).execute('restart',{events:[e]});assert.equal(sends,1);
    fail=true;const other={...e,id:'other'};
    await assert.rejects(get(ctx).execute('unknown',{events:[other]}),/uncertain/);
    await get(ctx).execute('no-repeat',{events:[other]});assert.equal(sends,2);
    assert.doesNotMatch(await readFile(path.join(root,'scratch.json'),'utf8'),/Besprechung/);
  }finally{
    if(saved.home===undefined)delete process.env.HOME;else process.env.HOME=saved.home;
    process.env.PATH=saved.path;delete globalThis.calendarTestSend;await rm(root,{recursive:true,force:true});
  }
});
