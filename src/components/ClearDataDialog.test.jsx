import React from 'react';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it,vi} from 'vitest';
import ExtraScreens from '../ExtraScreens';

it('leva o foco à confirmação de limpeza e o devolve ao cancelar pelo Escape', async () => {
  const user=userEvent.setup();
  render(<ExtraScreens view="profile" prefs={{}} setPrefs={vi.fn()} profile="" go={vi.fn()}/>);
  const trigger=screen.getByRole('button',{name:'Apagar dados locais'});
  await user.click(trigger);
  const dialog=screen.getByRole('alertdialog');
  expect(dialog).toContainElement(document.activeElement);
  expect(screen.getByRole('button',{name:'Cancelar'})).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button',{name:'Confirmar exclusão'})).toHaveFocus();
  await user.tab({shift:true});
  expect(screen.getByRole('button',{name:'Cancelar'})).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
