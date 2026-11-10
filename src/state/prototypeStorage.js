export const PROTOTYPE_STORAGE_KEYS = {
  savedRoutes: 'rota-salvas',
  reports: 'rota-relatos',
  preferences: 'rota-preferencias',
  profile: 'rota-perfil',
  readAlert: 'rota-alerta-lido',
};

export function createInitialPreferences() {
  return {
    alerts: true,
    rain: true,
    incidents: true,
    location: false,
    severity: 'Todas',
    quiet: '22:00',
  };
}

export function clearPrototypeStorage(storage) {
  Object.values(PROTOTYPE_STORAGE_KEYS).forEach(key => storage.removeItem(key));
}

export function shouldShowScenarioAlert(preferences, localOverride) {
  const acceptsHighSeverity = !preferences.severity || preferences.severity === 'Todas' || preferences.severity === 'Alta';
  return preferences.alerts !== false && preferences.incidents !== false && acceptsHighSeverity && localOverride;
}
