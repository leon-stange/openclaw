import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ShoppingClient } from '../src/client.mjs';
import entry, { monthlyReceiptSummary } from '../src/index.js';
const receipt=(n,date,amount)=>({id:`aaaaaaaa-aaaa-aaaa-aaaa-${String(n).padStart(12,'0')}`,purchaseDate:date,totalAmount:amount});
test('month totals use purchase date, exact cents, Berlin month boundary and optional past month',()=>{
  const data=[receipt(1,'2026-10-01',100),receipt(2,'2026-10-09',38.8),receipt(3,'2026-09-30',20)];
  const summary=monthlyReceiptSummary(data,undefined,new Date('2026-09-30T22:30:00Z'));
  assert.equal(summary.month,'2026-10');assert.equal(summary.totalCents,13880);assert.match(summary.formattedTotal,/138,80/);assert.equal(summary.receiptCount,2);
  assert.equal(monthlyReceiptSummary(data,'2026-09').totalAmount,20);
  assert.equal(monthlyReceiptSummary([receipt(1,'2026-10-01',0.1),receipt(2,'2026-10-02',0.2)],'2026-10').totalCents,30);
  assert.equal(monthlyReceiptSummary([],'2026-10').totalCents,0);
  for(const data of [[receipt(1,'2026-02-30',1)],[receipt(1,'2026-10-01',-1)],[receipt(1,'2026-10-01',0.001)],[receipt(1,'2026-10-01',NaN)],[receipt(1,'2026-10-01',1),receipt(1,'2026-10-01',1)]])assert.throws(()=>monthlyReceiptSummary(data,'2026-10'));
  assert.throws(()=>monthlyReceiptSummary([],'2026-13'));
});
test('receipts read only fixed group API, strip details/files, refresh expired session and propagate errors',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'receipt-test-'));const passwordFile=path.join(root,'password');await writeFile(passwordFile,'fixture',{mode:0o600});
  const response=(body,status=200,cookie=false)=>({ok:status===200,status,json:async()=>body,headers:{getSetCookie:()=>cookie?['bhd_session=fixture; HttpOnly']:[]}});
  try{
    let logins=0,expire=false,status=200;const calls=[];
    const c=new ShoppingClient({passwordFile,stateDir:path.join(root,'state'),fetchImpl:async(url,opts)=>{
      calls.push(url);if(url.endsWith('/auth/login')){logins++;return response({user:{username:'Jarvis',role:'USER',groupId:'group'},csrfToken:'fixture'},200,true);}
      assert.equal(url,'https://app.stangeleon.de/api/receipts');assert.equal(opts.method,'GET');assert.equal(opts.headers.cookie,'bhd_session=fixture');
      if(expire){expire=false;return response({},401);}return response({receipts:[{...receipt(1,'2026-10-01',138.8),note:'private',hasPhoto:true}]},status);
    }});
    assert.deepEqual(Object.keys((await c.receipts())[0]),['id','purchaseDate','totalAmount']);
    expire=true;await c.receipts();assert.equal(logins,2);
    status=500;await assert.rejects(c.receipts(),/HTTP 500/);
    const before=calls.length;await assert.rejects(c.receipts(AbortSignal.abort()));assert.equal(calls.length,before);
    c.fetch=async()=>response({});await assert.rejects(c.receipts(),/Kassenbon-Antwort/);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('monthly total tool restricted to WhatsApp owners, unavailable to weekly shopping job',()=>{
  const factories=[];entry.register({config:{},pluginConfig:{passwordFile:'/fixture/password',stateDir:'/fixture/state',shoppingReminder:{automationId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}},registerTool:f=>factories.push(f)});
  const tool=c=>factories.flatMap(f=>f(c)??[]).find(t=>t.name==='einkauf_monatsausgaben_lesen');
  assert.ok(tool({messageChannel:'whatsapp',senderIsOwner:true}));
  assert.equal(tool({messageChannel:'whatsapp',senderIsOwner:false}),undefined);
  assert.equal(tool({messageChannel:'webchat',senderIsOwner:true}),undefined);
  assert.equal(tool({agentId:'main',sessionKey:'agent:main:cron:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}),undefined);
});
