declare global {
 interface Window {gymDesktop?:{getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;migrate:(raw:string)=>unknown;validate:(raw:string)=>unknown;prompt:(message:string,value:string)=>string|null};}
}
export const persistence={
 getItem(key:string){
  if(!window.gymDesktop)return localStorage.getItem(key);
  const saved=window.gymDesktop.getItem(key);
  if(saved!==null)return saved;
  const legacy=localStorage.getItem(key);
  if(legacy&&key==='gymtracker_windows_data_v1'){window.gymDesktop.migrate(legacy);return window.gymDesktop.getItem(key);}
  return legacy;
 },
 setItem(key:string,value:string){
  if(window.gymDesktop){window.gymDesktop.setItem(key,value);try{localStorage.setItem(key,value);}catch{/* Verified desktop file is authoritative. */}}
  else localStorage.setItem(key,value);
 }
};
if(window.gymDesktop)window.prompt=(message='',value='')=>window.gymDesktop!.prompt(message,value);
