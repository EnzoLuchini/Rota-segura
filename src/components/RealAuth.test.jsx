import React from 'react';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it,vi} from 'vitest';
import RealAuth from './RealAuth';

it('informa confirmação de e-mail após cadastro sem sessão',async()=>{
 const user=userEvent.setup();
 const auth={configured:true,signUp:vi.fn().mockResolvedValue({session:null})};
 render(<RealAuth view="signup" auth={auth} go={vi.fn()}/>);
 await user.type(screen.getByLabelText('E-mail'),'pessoa@example.com');
 await user.type(screen.getByLabelText('Senha'),'senha-segura');
 await user.click(screen.getByRole('button',{name:'Criar conta'}));
 expect(auth.signUp).toHaveBeenCalledWith('pessoa@example.com','senha-segura');
 expect(await screen.findByText(/confira seu e-mail/i)).toBeInTheDocument();
});

it('apresenta erro de entrada sem sair da tela',async()=>{
 const user=userEvent.setup();
 const go=vi.fn();
 const auth={configured:true,signIn:vi.fn().mockRejectedValue(new Error('invalid'))};
 render(<RealAuth view="login" auth={auth} go={go}/>);
 await user.type(screen.getByLabelText('E-mail'),'pessoa@example.com');
 await user.type(screen.getByLabelText('Senha'),'senha-segura');
 await user.click(screen.getByRole('button',{name:'Entrar'}));
 expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível entrar/i);
 expect(go).not.toHaveBeenCalled();
});

it('mostra o estado de visitante quando o serviço não está configurado',()=>{
 render(<RealAuth view="profile" auth={{configured:false,user:null}} go={vi.fn()}/>);
 expect(screen.getByText(/acesso à conta indisponível/i)).toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'Visitante'})).toBeInTheDocument();
});

it('abre o perfil após entrada e permite sair da conta',async()=>{
 const user=userEvent.setup(),go=vi.fn(),signOut=vi.fn().mockResolvedValue();
 const auth={configured:true,user:null,signIn:vi.fn().mockResolvedValue({session:{}}),signOut};
 const {rerender}=render(<RealAuth view="login" auth={auth} go={go}/>);
 await user.type(screen.getByLabelText('E-mail'),'pessoa@example.com');
 await user.type(screen.getByLabelText('Senha'),'senha-segura');
 await user.click(screen.getByRole('button',{name:'Entrar'}));
 expect(go).toHaveBeenCalledWith('profile');
 rerender(<RealAuth view="profile" auth={{...auth,user:{email:'pessoa@example.com'}}} go={go}/>);
 expect(screen.getByText('pessoa@example.com')).toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Sair da conta'}));
 expect(signOut).toHaveBeenCalledOnce();
});
