import React, {useEffect, useRef} from 'react';

const navigationItems = [
  ['home', 'Mapa'],
  ['alerts', 'Alertas'],
  ['saved', 'Minhas rotas'],
  ['report', 'Criar relato'],
  ['reports', 'Relatos'],
  ['profile', 'Perfil e preferências'],
  ['sources', 'Fontes e metodologia'],
];

function focusMainHeading() {
  requestAnimationFrame(() => {
    const heading = document.querySelector('#main-content h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
    }
  });
}

export default function MobileNavigation({open, onClose, onNavigate, alertCount, triggerRef}) {
  const firstActionRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    firstActionRef.current?.focus();
    const handleKeyDown = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCloseRef.current();
      requestAnimationFrame(() => triggerRef.current?.focus());
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, triggerRef]);

  if (!open) return null;

  const navigate = target => {
    onNavigate(target);
    onClose();
    focusMainHeading();
  };

  return (
    <nav className="mobile-nav" id="mobile-navigation" aria-label="Navegação móvel">
      {navigationItems.map(([target, label], index) => (
        <button
          key={target}
          ref={index === 0 ? firstActionRef : undefined}
          type="button"
          onClick={() => navigate(target)}
        >
          {target === 'alerts' ? `${label} (${alertCount})` : label}
        </button>
      ))}
    </nav>
  );
}
