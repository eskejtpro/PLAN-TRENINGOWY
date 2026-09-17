const {app,BrowserWindow,ipcMain,dialog}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {Store,validate,DATA_KEY,BACKUP_KEY}=require('./storage.cjs');
const root=process.env.GYMTRACKER_DATA_DIR||path.join(process.env.LOCALAPPDATA||app.getPath('appData'),'GymTracker');
// The target PC records abrupt resets while Electron starts. Keep the desktop
// renderer off the GPU path until the machine-level cause is independently
// confirmed; GymTracker's UI works fully with Chromium software rendering.
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'chromium'));
app.setAppUserModelId('pl.pasik92.gymtrackerpro');
let win,store,pending;
const devURL=!app.isPackaged?process.env.GYMTRACKER_DEV_URL:undefined;
const indexURL=pathToFileURL(path.join(__dirname,'../dist/index.html')).href;
function trusted(e){return win&&!win.isDestroyed()&&e.sender===win.webContents&&e.senderFrame===win.webContents.mainFrame&&(e.senderFrame.url===indexURL||!!devURL&&e.senderFrame.url.startsWith(devURL+'/'));}
if(!app.requestSingleInstanceLock())app.quit();
else {
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
 app.whenReady().then(()=>{
  store=new Store(root);store.load();store.readBackups();
  ipcMain.on('gym:storage',(e,op,key,value)=>{
   try{
    if(!trusted(e))throw new Error('Niedozwolone źródło IPC');
    let result;
    if(op==='validate'){result=validate(JSON.parse(key));}
    else if(op==='migrate'){result=store.migrate(key);}
    else {
     if(![DATA_KEY,BACKUP_KEY].includes(key))throw new Error('Niedozwolony klucz danych');
     if(op==='get'){const v=key===DATA_KEY?store.load():store.readBackups();result=v===null?null:JSON.stringify(v);}
     else if(op==='set'){
      if(typeof value!=='string'||Buffer.byteLength(value)>32*1024*1024)throw new Error('Nieprawidłowy rozmiar danych');
      const parsed=JSON.parse(value);
      if(key===DATA_KEY){validate(parsed);pending=parsed;if(parsed.settings.autoSave!==false)store.save(parsed);}
      else store.syncBackups(parsed);
      result=true;
     }else throw new Error('Niedozwolona operacja');
    }
    e.returnValue={ok:true,value:result};
   }catch(error){e.returnValue={ok:false,error:error.message};}
  });
  ipcMain.on('gym:prompt',(e,message,value)=>{
   if(!trusted(e)){e.returnValue=null;return;}
   const child=new BrowserWindow({parent:win,modal:true,width:460,height:210,resizable:false,minimizable:false,maximizable:false,title:'GymTracker Pro',webPreferences:{preload:path.join(__dirname,'prompt-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
   child.setMenu(null);
   let answered=false;
   const finish=answer=>{if(answered)return;answered=true;e.returnValue=answer;ipcMain.removeListener('gym:prompt-result',receive);if(!child.isDestroyed())child.close();};
   const receive=(event,answer)=>{if(event.sender===child.webContents)finish(typeof answer==='string'?answer.slice(0,1000):null);};
   ipcMain.on('gym:prompt-result',receive);child.on('closed',()=>finish(null));
   child.webContents.once('did-finish-load',()=>child.webContents.send('gym:prompt-content',{message:String(message).slice(0,1000),value:String(value).slice(0,1000)}));
   child.loadFile(path.join(__dirname,'prompt.html'));
  });
  win=new BrowserWindow({width:1440,height:960,useContentSize:true,minWidth:800,minHeight:600,backgroundColor:'#020617',show:false,title:'GymTracker Pro',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:false}});
  win.setMenu(null);
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(e,url)=>{if(url!==indexURL&&!(devURL&&url.startsWith(devURL+'/')))e.preventDefault();});
  // Do not install a permission callback here. Electron 44 can emit a native
  // permission event with an undefined callback during startup on some Windows
  // profiles; invoking it causes the main-process conversion exception shown to
  // users. The app requests no permissions, so the default-deny behavior is
  // sufficient and avoids that crash path.
  win.webContents.session.on('will-download',(_e,item)=>{
   if(!item||typeof item.setSaveDialogOptions!=='function')return;
   item.setSaveDialogOptions({title:'Zapisz plik GymTracker',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename()||'download'))});
  });
  win.on('close',event=>{
   try{if(pending){store.save(pending);if(pending.settings.autoBackupEnabled!==false&&pending.settings.backupOnClose!==false)store.backup(pending,'close');}win.webContents.session.flushStorageData();}
   catch(error){event.preventDefault();dialog.showErrorBox('Błąd zapisu — okno pozostaje otwarte',error.message);}
  });
  win.once('ready-to-show',()=>win.show());
  if(devURL)win.loadURL(devURL+'/');else win.loadFile(path.join(__dirname,'../dist/index.html'));
 }).catch(error=>{dialog.showErrorBox('GymTracker Pro — nie można odczytać danych',`${error.message}\nDane zachowano: ${root}`);app.quit();});
 app.on('window-all-closed',()=>app.quit());
}
