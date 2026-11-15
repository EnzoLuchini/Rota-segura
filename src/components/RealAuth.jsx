import React,{useEffect,useState} from 'react';

export default function RealAuth({view,auth,go}) {
  const [email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{setError('');setMessage('');setPassword('');},[view]);
  const submit=async event=>{
    event.preventDefault();setError('');setMessage('');setBusy(true);
    try {
      const result=view==='signup'?await auth.signUp(email.trim(),password):await auth.signIn(email.trim(),password);
      setPassword('');
      if(view==='signup' && !result.session)setMessage('Confira seu e-mail para confirmar o cadastro. Se já tiver conta, entre normalmente.');
      else go('profile');
    } catch {setError(view==='signup'?'Não foi possível criar a conta. Confira os dados e tente novamente.':'Não foi possível entrar. Confira o e-mail, a senha e a confirmação do cadastro.');}
    finally {setBusy(false);}
  };
  const signOut=async()=>{
    setError('');setBusy(true);
    try {await auth.signOut();} catch {setError('Não foi possível sair. Tente novamente.');} finally {setBusy(false);}
  };
  if(view==='profile')return <>
    <button className="back" onClick={()=>go('home')}>← Voltar</button>
    <span className="overline">Sua conta</span>
    <h1>{auth.loading?'Carregando conta…':auth.user?'Conta conectada':'Visitante'}</h1>
    {auth.user && <p>{auth.user.email}</p>}
    <p className="intro">As rotas frequentes continuam salvas apenas neste navegador e não são sincronizadas com a conta.</p>
    {!auth.configured && <p role="status">Acesso à conta indisponível no momento. Você pode continuar como visitante.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {!auth.loading && auth.configured && (auth.user?<button className="secondary" disabled={busy} onClick={signOut}>Sair da conta</button>:<button className="primary" onClick={()=>go('login')}>Entrar ou criar conta</button>)}
  </>;
  return <>
    <button className="back" onClick={()=>go('profile')}>← Voltar</button>
    <span className="overline">Sua conta</span><h1>{view==='signup'?'Criar conta':'Entrar'}</h1>
    <p className="intro">Você também pode usar o mapa sem conta.</p>
    {!auth.configured?<p role="status">Acesso à conta indisponível no momento.</p>:<form onSubmit={submit}>
      <label className="form-field">E-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label className="form-field">Senha<input type="password" autoComplete={view==='signup'?'new-password':'current-password'} required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button className="primary" disabled={busy}>{busy?'Aguarde…':view==='signup'?'Criar conta':'Entrar'}</button>
    </form>}
    <button className="secondary" onClick={()=>go(view==='signup'?'login':'signup')}>{view==='signup'?'Já tenho conta':'Criar conta'}</button>
  </>;
}
