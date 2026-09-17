const {contextBridge,ipcRenderer}=require('electron');
const call=(op,...args)=>{const result=ipcRenderer.sendSync('gym:storage',op,...args);if(!result?.ok)throw new Error(result?.error||'Brak odpowiedzi zapisu');return result.value;};
contextBridge.exposeInMainWorld('gymDesktop',{
  getItem:key=>call('get',key),
  setItem:(key,value)=>call('set',key,value),
  migrate:raw=>call('migrate',raw),
  validate:raw=>call('validate',raw),
  prompt:(message,value)=>{const r=ipcRenderer.sendSync('gym:prompt',String(message),String(value??''));return r;}
});
