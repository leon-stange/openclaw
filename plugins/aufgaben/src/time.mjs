const parts = date => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',
}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
export function clock(now = Date.now()) {
  const p=parts(now),today=`${p.year}-${p.month}-${p.day}`;
  const next=new Date(today+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
  return {now:new Date(now).toISOString(),today,tomorrow:next.toISOString().slice(0,10),localTime:`${p.hour}:${p.minute}`,timeZone:'Europe/Berlin',defaultTime:'15:00'};
}
export function resolveReminder(p, now = Date.now(), required = false) {
  const modes=[p.date!==undefined,p.at!==undefined,p.afterMinutes!==undefined].filter(Boolean).length;
  if(modes>1 || p.time!==undefined && p.date===undefined) throw new Error('Genau eine Zeitangabe: Datum mit optionaler Uhrzeit, absolute Zeit oder Minuten.');
  if(!modes){if(required)throw new Error('Neue Erinnerungszeit erforderlich.');return null;}
  let ms;
  if(p.afterMinutes!==undefined){
    if(!Number.isInteger(p.afterMinutes)||p.afterMinutes<1||p.afterMinutes>525600)throw new Error('Ungueltige Minutenangabe.');
    ms=now+p.afterMinutes*60000;
  }else if(p.at!==undefined){
    if(typeof p.at!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(p.at))throw new Error('Absolute Zeit mit Zeitzone erforderlich.');
    ms=Date.parse(p.at);
  }else{
    const time=p.time??'15:00';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Datum YYYY-MM-DD und Uhrzeit HH:mm erforderlich.');
    const wall=Date.parse(`${p.date}T${time}:00Z`), candidates=[];
    for(const offset of [60,120]){
      const candidate=wall-offset*60000,q=parts(candidate);
      if(`${q.year}-${q.month}-${q.day}`===p.date&&`${q.hour}:${q.minute}`===time)candidates.push(candidate);
    }
    if(candidates.length!==1)throw new Error('Diese Berliner Uhrzeit existiert nicht oder ist bei Zeitumstellung mehrdeutig. Bitte andere Zeit nennen.');
    ms=candidates[0];
  }
  if(!Number.isFinite(ms)||ms<=now||ms>now+366*86400000)throw new Error('Erinnerung muss in der Zukunft und innerhalb eines Jahres liegen. Bitte Zeitpunkt klaeren.');
  return new Date(ms).toISOString();
}
