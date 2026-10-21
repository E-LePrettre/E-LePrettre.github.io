export const SCOPE='https://www.googleapis.com/auth/drive.file';
const scripts=new Map();
function script(url){
 if(scripts.has(url))return scripts.get(url);
 const loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.async=true;s.referrerPolicy='strict-origin-when-cross-origin';s.onload=resolve;s.onerror=()=>reject(Error('Connexion aux services Google indisponible.'));document.head.append(s);});
 scripts.set(url,loading);loading.catch(()=>scripts.delete(url));return loading;
}
export class GoogleSession {
 constructor(config){this.config=config;this.token='';this.expires=0;}
 accessToken=()=>Date.now()<this.expires?this.token:'';
 async prepare(){
  if(!this.config.clientId||!this.config.pickerKey)throw Error('Connexion Google en cours de configuration.');
  await Promise.all([script('https://accounts.google.com/gsi/client'),script('https://apis.google.com/js/api.js')]);
  await new Promise((resolve,reject)=>gapi.load('picker',{callback:resolve,onerror:()=>reject(Error('Sélecteur Google indisponible.')),timeout:15000,ontimeout:()=>reject(Error('Sélecteur Google indisponible.'))}));
  this.client=google.accounts.oauth2.initTokenClient({client_id:this.config.clientId,scope:SCOPE,include_granted_scopes:false,callback:()=>{},error_callback:()=>{}});
 }
 // Invoke directly from a click, after prepare(): mobile popup blockers require it.
 connect(){
  if(!this.client)return Promise.reject(Error('La connexion Google n’est pas prête. Réessayez en ligne.'));
  return new Promise((resolve,reject)=>{
   this.client.callback=response=>{
    if(response.error||!google.accounts.oauth2.hasGrantedAllScopes(response,SCOPE)){reject(Error('Autorisation Google non accordée.'));return;}
    this.token=response.access_token;this.expires=Date.now()+Math.max(0,Number(response.expires_in)-60)*1000;resolve();
   };
   this.client.error_callback=()=>reject(Error('Connexion Google fermée ou bloquée par le navigateur.'));
   this.client.requestAccessToken({prompt:'select_account'});
  });
 }
 disconnect(){this.token='';this.expires=0;}
 pick(){
  const token=this.accessToken();if(!token)return Promise.reject(Error('Reconnectez votre compte Google.'));
  return new Promise((resolve,reject)=>{
   const picker=new google.picker.PickerBuilder().addView(google.picker.ViewId.SPREADSHEETS).setAppId(this.config.projectNumber).setDeveloperKey(this.config.pickerKey).setOAuthToken(token).setOrigin(location.origin).setTitle('Choisir « Suivi des recharges Tesla »').setCallback(data=>{
    if(data.action===google.picker.Action.CANCEL){picker.dispose();reject(Error('Sélection annulée.'));}
    if(data.action===google.picker.Action.PICKED){const selected=data.docs?.[0];picker.dispose();if(selected?.id!==this.config.spreadsheetId)reject(Error('Choisissez le classeur « Suivi des recharges Tesla » préparé pour ce carnet.'));else resolve(selected);}
   }).build();picker.setVisible(true);
  });
 }
}
