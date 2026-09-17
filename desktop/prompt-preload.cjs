const {ipcRenderer}=require('electron');
window.addEventListener('DOMContentLoaded',()=>{
 ipcRenderer.on('gym:prompt-content',(_e,data)=>{document.querySelector('label').textContent=data.message;const input=document.querySelector('input');input.value=data.value;input.focus();input.select();});
 document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();ipcRenderer.send('gym:prompt-result',document.querySelector('input').value);});
 document.querySelector('#cancel').addEventListener('click',()=>ipcRenderer.send('gym:prompt-result',null));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')ipcRenderer.send('gym:prompt-result',null);});
});
