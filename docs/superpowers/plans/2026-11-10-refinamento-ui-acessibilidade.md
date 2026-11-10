# Refinamento de UI e acessibilidade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** aplicar a direção visual aprovada, removendo sobreposições do mapa no mobile e refinando acessibilidade e hierarquia em mobile e desktop.

**Architecture:** extrair a legenda do mapa para um componente `MapContextBar`, posicionado no fluxo no mobile e como dock no desktop. Manter os dados e a navegação atuais, adicionando apenas comportamento de apresentação, foco e menu. Usar Vitest + Testing Library para cobrir a interface sem depender da cartografia externa.

**Tech Stack:** React 19, Vite 6, Leaflet/react-leaflet, CSS responsivo, Vitest, jsdom e Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-10-ui-acessibilidade-design.md`

## Global Constraints

- Preservar todos os fluxos e dados fictícios atuais.
- Não adicionar backend, geocodificação, autenticação ou localização real.
- Deixar apenas chuva e centralização sobre o mapa no mobile.
- Manter atribuição cartográfica visível.
- Garantir alvos críticos de pelo menos 44 × 44 px no mobile e campos editáveis de pelo menos 16 px.
- Respeitar `prefers-reduced-motion`.
- Não depender apenas de cor para comunicar rota ou risco.

## Review Focus

- Viewport de 320 px: barra, legenda e conteúdo devem caber sem rolagem horizontal.
- Legenda: deve permanecer legível sem cobrir a cartografia no mobile nem escapar da viewport.
- Menu móvel: `Escape`, foco inicial e retorno do foco precisam funcionar em sequência.
- Desktop de 1024 px: painel lateral e mapa precisam permanecer utilizáveis sem esmagamento.
- Atribuição e textos secundários: devem permanecer visíveis e legíveis em todos os breakpoints.

---

### Task 1: Infraestrutura de testes de interface

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `vitest.config.js`
- Create: `src/test/setup.js`

**Interfaces:**
- Produces: ambiente Vitest `jsdom` com matchers de `@testing-library/jest-dom`, limitado a `src/components/**/*.test.jsx`.

- [ ] **Step 1: instalar dependências de teste**

Run: `npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`

- [ ] **Step 2: configurar o script e ambiente**

Adicionar `test:ui` com `vitest run`; criar `vitest.config.js` com `environment: 'jsdom'`, `setupFiles: ['src/test/setup.js']` e `include: ['src/components/**/*.test.jsx']`; importar `@testing-library/jest-dom/vitest` no setup. Ignorar `.superpowers/brainstorm/` no Git.

- [ ] **Step 3: verificar a infraestrutura**

Run: `npm run test:ui -- --passWithNoTests`

Expected: exit 0 sem testes encontrados.

- [ ] **Step 4: commit**

```bash
git add .gitignore package.json package-lock.json vitest.config.js src/test/setup.js
git commit -m "test: preparar testes de interface"
```

### Task 2: Barra contextual do mapa

**Files:**
- Create: `src/components/MapContextBar.jsx`
- Create: `src/components/MapContextBar.test.jsx`
- Modify: `src/main.jsx`
- Modify: `src/style.css`

**Interfaces:**
- Produces: `MapContextBar()`, com legenda textual das rotas e da área de risco.

- [ ] **Step 1: escrever testes RED**

Cobrir: legenda textual sempre presente e ausência do dropdown removido de pontos do mapa.

- [ ] **Step 2: executar e observar falha**

Run: `npm run test:ui -- src/components/MapContextBar.test.jsx`

Expected: FAIL porque o componente não existe.

- [ ] **Step 3: implementar o componente e integrar a estrutura**

Extrair legenda e controles de `main.jsx`. Envolver o Leaflet e seus overlays em `.map-surface`; renderizar `MapContextBar` como irmão da superfície dentro de `.map-area`.

- [ ] **Step 4: aplicar layout aprovado**

No mobile, `.map-context` fica no fluxo e `.map-surface` usa `height: clamp(260px, 38svh, 330px)`. No desktop, `.map-context` vira dock na base da superfície. Remover controles e estilos antigos de detalhes do mapa.

- [ ] **Step 5: verificar GREEN**

Run: `npm run test:ui -- src/components/MapContextBar.test.jsx`

Expected: todos os testes passam.

- [ ] **Step 6: commit**

```bash
git add src/components/MapContextBar.jsx src/components/MapContextBar.test.jsx src/main.jsx src/style.css
git commit -m "feat: reorganizar controles do mapa"
```

### Task 3: Navegação e foco acessíveis

**Files:**
- Create: `src/components/MobileNavigation.jsx`
- Create: `src/components/MobileNavigation.test.jsx`
- Modify: `src/main.jsx`
- Modify: `src/style.css`

**Interfaces:**
- Produces: `MobileNavigation({ open, onClose, onNavigate, alertCount, triggerRef })`.
- Consumes: `go(next)`, contagem do alerta e referência do botão do menu.

- [ ] **Step 1: escrever testes RED**

Cobrir: menu fechado não renderiza navegação; ao abrir, primeira ação recebe foco; `Escape` chama `onClose`; navegação chama `onNavigate('home')` e `onClose` mesmo quando a tela atual já é `home`; fechamento por `Escape`/botão devolve foco ao gatilho; navegação termina com foco no título da nova tela.

- [ ] **Step 2: executar e observar falha**

Run: `npm run test:ui -- src/components/MobileNavigation.test.jsx`

Expected: FAIL porque o componente não existe.

- [ ] **Step 3: implementar e integrar**

Extrair o menu móvel, adicionar `ref` ao gatilho e incluir link `.skip-link` para `#main-content`. O destino será o início focável do painel principal, antes dos controles Leaflet. Manter foco programático no título, removendo apenas o contorno visual desse título não tabulável. Retornar foco ao gatilho somente ao fechar sem navegar; em navegação, o título da nova tela recebe foco.

- [ ] **Step 4: verificar GREEN**

Run: `npm run test:ui -- src/components/MobileNavigation.test.jsx`

Expected: todos os testes passam.

- [ ] **Step 5: commit**

```bash
git add src/components/MobileNavigation.jsx src/components/MobileNavigation.test.jsx src/main.jsx src/style.css
git commit -m "feat: aprimorar navegação por teclado"
```

### Task 4: Hierarquia, contraste e responsividade

**Files:**
- Modify: `src/ExtraScreens.jsx`
- Modify: `src/main.jsx`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: estrutura produzida nas Tasks 2 e 3.
- Produces: tokens visuais finais e breakpoints aprovados.

- [ ] **Step 1: atualizar cópia estrutural**

Converter rótulos de seção de caixa alta para sentence case, sem mudar significado ou fluxo.

- [ ] **Step 2: aplicar tokens e tipografia**

Usar a paleta da spec, escurecer textos secundários, manter Manrope/DM Sans e garantir inputs de 16 px no mobile.

- [ ] **Step 3: refinar layout**

Remover a sobreposição negativa do painel no mobile, ajustar painel desktop entre 430 e 500 px, alinhar espaçamentos e manter controles críticos com 44 px em ponteiro impreciso.

- [ ] **Step 4: verificar build e suites**

Run: `npm test && npm run test:ui && npm run build`

Expected: todas as suites e build passam.

- [ ] **Step 5: commit**

```bash
git add src/ExtraScreens.jsx src/style.css
git commit -m "style: refinar hierarquia responsiva"
```

### Task 5: Revisão visual e acessível

**Files:**
- Modify: `docs/superpowers/plans/2026-11-10-refinamento-ui-acessibilidade.md`

**Interfaces:**
- Consumes: aplicação completa das Tasks 1–4.
- Produces: evidência de verificação para entrega.

- [ ] **Step 1: verificar matriz responsiva**

No navegador, inspecionar 320×700, 360×800, 390×844, 768×900, 1024×768 e 1440×900; registrar rolagem horizontal, medidas do mapa e da barra de legenda, visibilidade da atribuição e conteúdo longo. Cobrir chuva disponível, desatualizada, carregando e indisponível.

- [ ] **Step 2: verificar teclado**

Percorrer link de pulo, menu, barra do mapa, rotas e formulários com teclado; confirmar `Escape`, foco visível e retorno do foco. Medir estilos computados de contraste dos textos críticos, alvos de 44 px (incluindo área clicável dos toggles), inputs de 16 px, atribuição e regra de `prefers-reduced-motion`.

- [ ] **Step 3: verificar fluxos principais**

Executar abertura → mapa → comparação → explicação → trechos → salvar/editar/pausar/excluir rota → alertas → revisar/confirmar relato → preferências → recarregar e conferir persistência, mantendo console sem erros.

- [ ] **Step 4: executar verificação final**

Run: `npm test && npm run test:ui && npm run build && git diff --check`

Expected: exit 0 em todos os comandos.

- [ ] **Step 5: commit**

```bash
git add docs/superpowers/plans/2026-11-10-refinamento-ui-acessibilidade.md
git commit -m "docs: registrar verificação de ui"
```

## Evidência de verificação — 2026-11-10

### Matriz responsiva

| Viewport | Mapa | Barra original | Overflow horizontal | Atribuição |
| --- | ---: | ---: | ---: | --- |
| 320×700 | 266 px | 90 px | 0 px | visível |
| 360×800 | 304 px | 90 px | 0 px | visível |
| 390×844 | 321 px | 91 px | 0 px | visível |
| 768×900 | 330 px | 91 px | 0 px | visível |
| 1024×768 | 696 px | 64 px | 0 px | visível |
| 1440×900 | 828 px | 64 px | 0 px | visível |

- O dropdown de pontos do mapa foi removido posteriormente por decisão do produto; a barra final contém somente a legenda.
- Estados disponível, desatualizado, carregando e indisponível foram exercitados em 390 px; mensagens, bloqueio do botão e rótulo de chuva corresponderam ao estado, sem overflow horizontal.
- Em 1024 px o painel mediu 430 px e o mapa continuou utilizável; em 1440 px o painel permaneceu dentro do limite de 500 px.
- Revisão adicional do intervalo desktop/tablet: 801, 820, 850, 900 e 1000 px apresentaram 0 px² de interseção entre legenda e botão, e 0 px de overflow horizontal; o dock usa uma coluna nesse intervalo.

### Acessibilidade

- Menu: foco inicial em “Mapa”, fechamento por `Escape`, retorno ao gatilho e foco no título mesmo ao navegar para a tela atual.
- O item focado no menu permanece estável quando callbacks do App mudam; `Escape` continua usando o callback mais recente.
- Link de salto: ativação por teclado focou `#main-content`.
- A seleção de rota foi ativada por teclado; foco visível medido com contorno sólido de 3 px.
- Controles críticos medidos em 44 px; campos editáveis no mobile medidos em 16 px.
- Contrastes medidos: texto secundário 5,47:1; eyebrow 4,64:1; botão primário 5,25:1.
- Regra `prefers-reduced-motion` confirmada na folha de estilos.

### Fluxos e persistência

- Abertura → mapa → comparação → explicação → trechos: aprovado.
- Salvar → editar → pausar rota → recarregar → conferir persistência: aprovado.
- Alertas → detalhe do alerta: aprovado.
- Criar relato → revisar → confirmar → listar: aprovado.
- Preferências: chuva desativada e severidade alta persistiram após recarregar.
- Exclusão de rota: o controle e sua confirmação foram revisados, mas a confirmação destrutiva não foi acionada para preservar os dados locais do navegador.
- Console do navegador: nenhum erro registrado durante os fluxos.
