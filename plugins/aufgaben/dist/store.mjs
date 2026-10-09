import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { randomUUID,createHash } from 'node:crypto';

export class TaskStore {
  constructor(dir){if(!path.isAbsolute(dir))throw new Error('Absoluter privater Aufgabenpfad erforderlich.');this.dir=dir;this.file=path.join(dir,'tasks.json');this.lock=path.join(dir,'tasks.lock');}
  async init(){await fsp.mkdir(this.dir,{recursive:true,mode:0o700});await fsp.chmod(this.dir,0o700);}
  read(){
    if(!fs.existsSync(this.file))return {version:1,tasks:[],ledger:{}};
    const st=fs.lstatSync(this.file);
    if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||st.size>4194304)throw new Error('Unsichere oder zu grosse Aufgabendatei.');
    const s=JSON.parse(fs.readFileSync(this.file,'utf8'));
    if(s.version!==1||!Array.isArray(s.tasks)||!s.ledger||typeof s.ledger!=='object'||s.tasks.length>2000||Object.keys(s.ledger).length>10000)throw new Error('Ungueltiger Aufgabenbestand.');
    for(const t of s.tasks)if(!t||typeof t.id!=='string'||!Array.isArray(t.members)||!['open','completed','deleted'].includes(t.status)||!Number.isInteger(t.revision)||!Array.isArray(t.deliveries))throw new Error('Ungueltige Aufgabe; keine Aktion.');
    return s;
  }
  async transaction(fn,guard=()=>{}){
    await this.init();let handle;
    const deadline=Date.now()+5000;
    while(!handle){
      try{handle=await fsp.open(this.lock,'wx',0o600);await handle.writeFile(JSON.stringify({pid:process.pid}));}
      catch(e){
        if(e.code!=='EEXIST')throw e;
        // Only reclaim a crashed process's lock, never a live long-running transaction.
        try{const x=JSON.parse(await fsp.readFile(this.lock,'utf8'));try{process.kill(x.pid,0);}catch(err){if(err.code==='ESRCH'){await fsp.unlink(this.lock);continue;}}}catch{}
        if(Date.now()>deadline)throw new Error('Aufgabenbestand wird gerade bearbeitet; kein Schreibzugriff.');
        await new Promise(r=>setTimeout(r,30));
      }
    }
    try{
      guard();const state=this.read();const result=fn(state);
      const temp=path.join(this.dir,`tasks-${randomUUID()}.tmp`);let h;
      try{h=await fsp.open(temp,'wx',0o600);await h.writeFile(JSON.stringify(state));await h.sync();await h.close();h=null;guard();await fsp.rename(temp,this.file);}
      finally{await h?.close();await fsp.rm(temp,{force:true});}
      return result;
    }finally{await handle.close();await fsp.unlink(this.lock);}
  }
  async mutate(callId,member,fn,guard){
    if(typeof callId!=='string'||!callId)throw new Error('Stabile Tool-Aufruf-ID fehlt.');
    const key=createHash('sha256').update(JSON.stringify([member,callId])).digest('hex');
    return this.transaction(s=>{
      if(Object.hasOwn(s.ledger,key))return s.ledger[key];
      if(Object.keys(s.ledger).length>=10000)throw new Error('Aufgabenprotokoll voll; Bereinigung durch Betreiber erforderlich.');
      const result=fn(s);s.ledger[key]=result;return result;
    },guard);
  }
}

export function visible(task, member){return task.status!=='deleted'&&task.members.includes(member);}
export function publicTask(t){return {id:t.id,title:t.title,status:t.status,shared:t.members.length>1,assignees:t.members,reminderAt:t.reminderAt,reminderLocal:t.reminderAt?new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',dateStyle:'full',timeStyle:'short'}).format(new Date(t.reminderAt)):null,reminderTimeZone:'Europe/Berlin',deliveries:t.deliveries.map(({member,status,at})=>({member,status,at}))};}
export function selected(s,id,member){const task=s.tasks.find(t=>t.id===id&&visible(t,member));if(!task)throw new Error('Aufgabe nicht vorhanden oder nicht fuer dich zugaenglich.');return task;}
