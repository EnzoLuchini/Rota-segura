import React,{useEffect,useState} from 'react';

export default function RealAuth({view,auth,go}) {
  const [email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{setError('');setMessage('');setPassword('');setConfirmation('');},[view]);
  const submit=async event=>{
    event.preventDefault();setError('');setMessage('');setBusy(true);
    try {
      if(view==='forgot'){
        await auth.resetPassword(email.trim());
        setMessage('Se existir uma conta para este e-mail, você receberá um link para redefinir a senha.');
        return;
      }
      if(view==='reset'){
        if(password!==confirmation){setError('As senhas não coincidem.');return;}
        await auth.updatePassword(password);
        setPassword('');setConfirmation('');setMessage('Senha atualizada. Você já pode acessar sua conta.');
        return;
      }
      const result=view==='signup'?await auth.signUp(email.trim(),password):await auth.signIn(email.trim(),password);
      setPassword('');
      if(view==='signup' && !result.session)setMessage('Confira seu e-mail para confirmar o cadastro. Se já tiver conta, entre normalmente.');
      else go('profile');
    } catch {setError(view==='signup'?'Não foi possível criar a conta. Confira os dados e tente novamente.':view==='forgot'?'Não foi possível enviar o link. Tente novamente mais tarde.':view==='reset'?'Não foi possível atualizar a senha. Solicite um novo link e tente novamente.':'Não foi possível entrar. Confira o e-mail, a senha e a confirmação do cadastro.');}
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
    <span className="overline">Sua conta</span><h1>{view==='signup'?'Criar conta':view==='forgot'?'Recuperar senha':view==='reset'?'Definir nova senha':'Entrar'}</h1>
    <p className="intro">Você também pode usar o mapa sem conta.</p>
    {!auth.configured?<p role="status">Acesso à conta indisponível no momento.</p>:<form onSubmit={submit}>
      {view!=='reset' && <label className="form-field">E-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}
      {view!=='forgot' && <label className="form-field">{view==='reset'?'Nova senha':'Senha'}<input type="password" autoComplete={view==='signup'||view==='reset'?'new-password':'current-password'} required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
      {view==='reset' && <label className="form-field">Confirme a nova senha<input type="password" autoComplete="new-password" required minLength={6} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button className="primary" disabled={busy || (view==='reset' && !!message)}>{busy?'Aguarde…':view==='signup'?'Criar conta':view==='forgot'?'Enviar link':view==='reset'?'Salvar nova senha':'Entrar'}</button>
    </form>}
    {view==='login' && <button className="secondary" onClick={()=>go('forgot')}>Esqueci minha senha</button>}
    <button className="secondary" onClick={()=>go(view==='signup'||view==='forgot'?'login':view==='reset'?'profile':'signup')}>{view==='signup'||view==='forgot'?'Já tenho conta':view==='reset'?'Ir para minha conta':'Criar conta'}</button>
  </>;
}
