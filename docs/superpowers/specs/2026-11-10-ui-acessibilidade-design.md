# Refinamento de UI e acessibilidade — design aprovado

## Intenção

Refinar o mock do Rota Segura para que o mapa permaneça legível e útil em telas pequenas, enquanto mobile e desktop compartilham uma hierarquia visual consistente. O refinamento preserva os fluxos e a identidade já implementados; não adiciona backend, geocodificação, autenticação ou dados reais.

## Direção aprovada

O usuário aprovou a direção **Barra contextual** no mockup visual de 10/11/2026 e, em seguida, aprovou a proposta completa para mobile e desktop.

### Mobile

- Apenas o indicador de chuva e o botão de centralização permanecem como controles sobre o mapa; a atribuição obrigatória e os próprios elementos cartográficos continuam visíveis.
- A legenda fica em uma barra contextual imediatamente abaixo da cartografia, sem controles adicionais.
- O mapa mantém altura útil entre 260 e 330 px conforme a viewport.
- O painel de conteúdo começa depois da barra contextual, sem sobreposição negativa.

### Desktop

- O painel lateral continua à esquerda e o mapa ocupa o restante da viewport.
- A legenda forma um dock discreto na base do mapa.
- O painel lateral ganha proporção e ritmo mais equilibrados, sem alterar a jornada funcional.

## Sistema visual

- Azul de rota: `#1763E9`.
- Azul profundo: `#102F62`.
- Verde informativo: `#3E967F`.
- Âmbar de risco: `#EF991A`.
- Vermelho de ocorrência: `#E55361`.
- Superfície suave: `#F4F8FD`.
- Manrope permanece nos títulos; DM Sans permanece em texto, campos e controles.
- Rótulos de seção passam a sentence case. Caixa alta deixa de ser recurso recorrente.
- A ênfase visual permanece nas rotas e nos riscos; controles auxiliares ficam discretos.

## Acessibilidade

- Alvos interativos críticos têm pelo menos 44 × 44 px em ponteiros imprecisos.
- Campos editáveis têm pelo menos 16 px no mobile para evitar zoom involuntário.
- Textos secundários e atribuição do mapa recebem contraste e tamanho legíveis.
- A navegação oferece link para pular ao conteúdo principal, cujo destino recebe foco antes dos controles Leaflet.
- O menu móvel fecha com `Escape`, move o foco para sua primeira ação ao abrir e devolve o foco ao botão ao fechar.
- A mudança de tela continua movendo o foco sem exibir contorno visual permanente no título programaticamente focado.
- A legenda textual comunica as categorias sem depender apenas das cores do mapa.
- Mensagens dinâmicas continuam anunciadas por regiões de status.
- `prefers-reduced-motion` continua respeitado.

## Responsividade


- Verificar 320, 360 e 390 px no mobile.
- Verificar 768 px na transição.
- Verificar 1024 e 1440 px no desktop.
- Nenhuma largura pode produzir rolagem horizontal no documento.
- A atribuição cartográfica deve permanecer visível em todas as larguras.

## Não objetivos

- Não redesenhar a marca nem trocar as fontes.
- Não substituir Leaflet, Esri ou OpenStreetMap.
- Não alterar regras de cenário, rotas, alertas, relatos ou persistência.
- Não criar uma navegação GPS real.
