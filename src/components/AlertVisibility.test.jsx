import React, {useState} from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect, it} from 'vitest';
import ExtraScreens from '../ExtraScreens';
import {createInitialPreferences, shouldShowScenarioAlert} from '../state/prototypeStorage';

function AlertScreen() {
  const [showAlert, setShowAlert] = useState(true);
  const prefs = createInitialPreferences();
  return <><output>Contador: {shouldShowScenarioAlert(prefs, showAlert) ? 1 : 0}</output><ExtraScreens view="alerts" prefs={prefs} showAlert={showAlert} setShowAlert={setShowAlert} savedRoutes={[]} go={() => {}} readAlerts={false}/></>;
}

it('atualiza a central e o contador ao ocultar o alerta de exemplo', async () => {
  const user = userEvent.setup();
  render(<AlertScreen />);
  expect(screen.getByText('Contador: 1')).toBeInTheDocument();
  await user.click(screen.getByRole('checkbox', {name: /mostrar alerta de exemplo/i}));
  expect(screen.getByText('Contador: 0')).toBeInTheDocument();
  expect(screen.getByText(/nenhum alerta para exibir/i)).toBeInTheDocument();
});
