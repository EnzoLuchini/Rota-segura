self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json() || {};}catch{}
  const url=typeof data.url==='string' && data.url.startsWith('/?alert=') ? data.url : '/';
  event.waitUntil(self.registration.showNotification(data.title || 'Rota Segura',{body:data.body || 'Há um aviso meteorológico disponível.',icon:'/icon-192.png',data:{url}}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
