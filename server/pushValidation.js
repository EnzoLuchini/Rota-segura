export function validSubscription(value){
  try {
    const url=new URL(value.endpoint), host=url.hostname;
    const trusted=host==='fcm.googleapis.com' || host==='updates.push.services.mozilla.com' || host==='web.push.apple.com' || host.endsWith('.push.apple.com');
    return url.protocol==='https:' && trusted && !url.username && !url.password && !url.port && value.endpoint.length<=2048 && /^[A-Za-z0-9_-]{87}$/.test(value.keys?.p256dh || '') && /^[A-Za-z0-9_-]{22}$/.test(value.keys?.auth || '');
  } catch {return false;}
}
