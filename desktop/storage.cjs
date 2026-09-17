const fs = require('node:fs');
const path = require('node:path');
const {randomUUID,createHash} = require('node:crypto');
const DATA_KEY='gymtracker_windows_data_v1';
const BACKUP_KEY='gymtracker_autobackups_v1';
function validate(data) {
  const bad=()=>{throw new Error('Nieprawidłowy format danych GymTracker. Oryginalne dane zachowano.');};
  const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const num=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
  const str=x=>typeof x==='string';
  if(!obj(data)||!obj(data.settings)||!Array.isArray(data.weeks)||!Array.isArray(data.bodyWeights))bad();
  const s=data.settings;
  if(!['kg','lbs'].includes(s.unit)||!['dark','light'].includes(s.theme)||typeof s.autoSave!=='boolean'||!str(s.athleteName))bad();
  if(s.maxBackupFiles!==undefined&&(!Number.isInteger(s.maxBackupFiles)||s.maxBackupFiles<1||s.maxBackupFiles>1000))bad();
  for(const w of data.weeks){
    if(!obj(w)||!str(w.id)||!str(w.name)||!num(w.number)||!Array.isArray(w.days))bad();
    for(const d of w.days){
      if(!obj(d)||!str(d.id)||!str(d.name)||typeof d.completed!=='boolean'||!Array.isArray(d.exercises))bad();
      for(const e of d.exercises){
        if(!obj(e)||!str(e.id)||!str(e.name)||!num(e.weight)||!num(e.sets)||!num(e.reps)||!num(e.rpe)||!str(e.notes)||!Array.isArray(e.history))bad();
        for(const h of e.history){if(!obj(h)||!str(h.date)||!num(h.weight)||!num(h.reps)||!num(h.sets))bad();}
        if(e.loggedSets!==undefined&&(!Array.isArray(e.loggedSets)||e.loggedSets.some(l=>!obj(l)||!num(l.weight)||!num(l.reps)||!num(l.setNumber)||typeof l.completed!=='boolean')))bad();
      }
    }
  }
  for(const b of data.bodyWeights)if(!obj(b)||!str(b.id)||!str(b.date)||!num(b.weight))bad();
  if(data.circumferences!==undefined){
    const parts=['klatka','talia','biodra','udo','łydka','ramię'];
    if(!Array.isArray(data.circumferences))bad();
    for(const c of data.circumferences){
      if(!obj(c)||!str(c.id)||!str(c.date)||!parts.includes(c.bodyPart)||!['left','right',null].includes(c.side)||!['standard','flexed','relaxed'].includes(c.variant)||!Number.isInteger(c.millimeters)||c.millimeters<=0||!str(c.notes))bad();
      if(['udo','łydka','ramię'].includes(c.bodyPart)!==Boolean(c.side))bad();
      if(c.bodyPart==='ramię'?!['flexed','relaxed'].includes(c.variant):c.variant!=='standard')bad();
    }
  }
  if(data.protocolEntries!==undefined){if(!Array.isArray(data.protocolEntries))bad();for(const p of data.protocolEntries)if(!obj(p)||!str(p.id)||!str(p.date)||!str(p.substance)||!num(p.dosage)||!['mg','IU','mcg','ml','tab'].includes(p.unit)||!['IM','SC','Oral'].includes(p.route))bad();}
  return data;
}
function atomic(file,value){
  const text=JSON.stringify(value,null,2);JSON.parse(text);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const tmp=file+'.'+randomUUID()+'.tmp';
  const fd=fs.openSync(tmp,'wx');
  try{fs.writeFileSync(fd,text,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.renameSync(tmp,file);}catch(e){fs.unlinkSync(tmp);throw e;}
  if(fs.readFileSync(file,'utf8')!==text)throw new Error('Weryfikacja zapisu nie powiodła się.');
}
class Store {
  constructor(root){this.root=root;this.file=path.join(root,'workout_data.json');this.backupDir=path.join(root,'backups');fs.mkdirSync(this.backupDir,{recursive:true});}
  load(){return fs.existsSync(this.file)?validate(JSON.parse(fs.readFileSync(this.file,'utf8'))):null;}
  backup(data,reason='manual'){
    validate(data);
    const name=`gymtracker_${Date.now()}_${randomUUID()}_${reason}.json`;
    atomic(path.join(this.backupDir,name),data);
    const owned=fs.readdirSync(this.backupDir).filter(f=>/^gymtracker_\d+_[a-f0-9-]+_[a-z]+\.json$/.test(f)).sort((a,b)=>fs.statSync(path.join(this.backupDir,b)).mtimeMs-fs.statSync(path.join(this.backupDir,a)).mtimeMs);
    for(const old of owned.slice(data.settings.maxBackupFiles||15))fs.unlinkSync(path.join(this.backupDir,old));
    return name;
  }
  save(data){validate(data);const old=this.load();if(old&&JSON.stringify(old)!==JSON.stringify(data))this.backup(old,'previous');atomic(this.file,data);return data;}
  migrate(raw){if(this.load())return this.load();const data=validate(JSON.parse(raw));this.backup(data,'migration');return this.save(data);}
  readBackups(){const f=path.join(this.root,'backup-index.json');if(!fs.existsSync(f))return [];const a=JSON.parse(fs.readFileSync(f,'utf8'));if(!Array.isArray(a))throw new Error('Uszkodzony indeks kopii zapasowych');for(const b of a)validate(b.data);return a;}
  syncBackups(entries){
    if(!Array.isArray(entries)||entries.length>1000)throw new Error('Nieprawidłowy indeks kopii');
    for(const b of entries){if(typeof b.fileName!=='string'||!/^workout_backup_[a-zA-Z0-9_-]+\.json$/.test(b.fileName)||typeof b.id!=='string')throw new Error('Nieprawidłowa nazwa kopii');validate(b.data);}
    const prior=this.readBackups();const ids=new Set(prior.map(b=>b.id));
    for(const b of entries)if(!ids.has(b.id))this.backup(b.data,'automatic');
    atomic(path.join(this.root,'backup-index.json'),entries);
  }
}
module.exports={Store,validate,atomic,DATA_KEY,BACKUP_KEY};
