import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ShoppingClient } from '../src/client.mjs';
import entry, { mealPlanSummary, isWeeklyReadContext } from '../src/index.js';
const dish = { id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name:'Lasagne', weekday:'Freitag', information:'Mit Salat', bulletPoints:['Ofen vorheizen'], cookedAt:null, archivedAt:null };
const response = (body, status=200, cookie=false) => ({ok:status===200,status,json:async()=>body,headers:{getSetCookie:()=>cookie?['bhd_session=fixture; HttpOnly']:[]}});
test('meal read uses Jarvis group session, GET only, expired auth retries once and malformed responses fail',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'meal-test-'));const passwordFile=path.join(root,'password');
  await writeFile(passwordFile,'fixture',{mode:0o600});
  try{
    let logins=0,expire=false,body={meals:[dish]};const calls=[];
    const c=new ShoppingClient({passwordFile,stateDir:path.join(root,'state'),fetchImpl:async(url,opts)=>{
      calls.push({url,opts});
      if(url.endsWith('/auth/login')){logins++;return response({user:{username:'Jarvis',role:'USER',groupId:'group'},csrfToken:'fixture'},200,true);}
      assert.equal(url,'https://app.stangeleon.de/api/meals');assert.equal(opts.method,'GET');assert.equal(opts.headers.cookie,'bhd_session=fixture');
      if(expire){expire=false;return response({},401);}return response(body);
    }});
    const meals=await c.meals();assert.equal(meals[0].name,'Lasagne');assert.equal(meals[0].archivedAt,undefined);
    expire=true;await c.meals();assert.equal(logins,2);
    for(const invalid of [{meals:null},{meals:[{...dish,archivedAt:'2026-10-01'}]},{meals:[{...dish,weekday:'Blabla'}]},{meals:[{...dish,bulletPoints:'text'}]}]){
      body=invalid;await assert.rejects(c.meals(),/Essensplan-Antwort/);
    }
    const count=calls.length;await assert.rejects(c.meals(AbortSignal.abort()));assert.equal(calls.length,count);
    assert.equal(calls.filter(x=>x.opts.method!=='GET'&&!x.url.endsWith('/auth/login')).length,0);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('Berlin remaining weekdays are hints, undated preserved, sorted, no fabricated calendar date',()=>{
  const summary=mealPlanSummary([{...dish,weekday:null},{...dish,weekday:'Montag'},dish,{...dish,weekday:'Sonntag'}],new Date('2026-10-09T12:00:00Z'));
  assert.equal(summary.todayWeekday,'Freitag');assert.equal(summary.calendarDatesAvailable,false);
  assert.deepEqual(summary.meals.map(x=>x.weekdayOnOrAfterToday),[false,true,true,null]);
  assert.equal(mealPlanSummary([],new Date('2026-10-11T22:30:00Z')).todayWeekday,'Montag');
  assert.equal(mealPlanSummary(Array(201).fill(dish)).truncated,true);
});
test('meal tool visible only to WhatsApp owners; weekly shopping automation gains no meal access',()=>{
  const factories=[];entry.register({config:{},pluginConfig:{passwordFile:'/fixture/password',stateDir:'/fixture/state',shoppingReminder:{automationId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}},registerTool:f=>factories.push(f)});
  const tool=c=>factories.flatMap(f=>f(c)??[]).find(t=>t.name==='einkauf_essensplan_lesen');
  assert.ok(tool({messageChannel:'whatsapp',senderIsOwner:true}));
  assert.equal(tool({messageChannel:'whatsapp',senderIsOwner:false}),undefined);
  assert.equal(tool({messageChannel:'webchat',senderIsOwner:true}),undefined);
  const ctx={agentId:'main',sessionKey:'agent:main:cron:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'};
  assert.equal(tool(ctx),undefined);assert.equal(isWeeklyReadContext('einkauf_essensplan_lesen',ctx,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),false);
});
