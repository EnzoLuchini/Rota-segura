# Plano de implementação — frontend do Rota Segura

**Objetivo:** manter o protótipo navegável e responsivo com dados fictícios e acompanhar a evolução da consulta real de rotas em São Paulo. O plano original de frontend foi ampliado para registrar o estado atual da aplicação e as verificações pendentes.

**Contexto:** projeto acadêmico FIAP Global Solution 2026.2, inicialmente voltado a São Paulo. O produto compara trajetos e explica a exposição conhecida a riscos associados à chuva. Apoia decisões; não garante a segurança de uma rota.

**Base técnica:** React, Vite, Leaflet e mapa de ruas. A aplicação atual está em `src/main.jsx` e `src/style.css`. Este documento é um roteiro de produto e implementação, não uma especificação definitiva de APIs ou cálculos.

**Referências de produto:** README da pesquisa anterior, mockups visuais apresentados na conversa e decisões registradas neste documento. A pesquisa e os exemplos precisam ser revalidados antes do uso operacional.

## Princípios para todas as etapas

- Priorizar celular, sem deixar de atender telas maiores e teclado.
- Preservar a identidade azul e a gota com trajeto; o mapa deve lembrar o mock aprovado, com ruas reais legíveis e riscos destacados.
- Apresentar a rota recomendada como **menor exposição conhecida**, nunca como caminho garantidamente seguro.
- Explicar a diferença entre alternativas com palavras, ícones e contraste, sem depender apenas de cor. A mais rápida deve sinalizar claramente sua maior exposição quando esse for o caso.
- Identificar informações fictícias nos pontos em que poderiam ser confundidas com condições reais. Não exibir o selo genérico “Projeto demonstrativo” no cabeçalho.
- Usar dados simulados de forma consistente entre mapa, rotas, detalhes, relatos e alertas. Distâncias, endereços, horário e geometrias do cenário são ilustrativos.
- Permitir navegação sem conta no fluxo principal; funcionalidades pessoais podem simular uma conta e serão revisadas antes da integração real.
- Na simulação, manter os fluxos fictícios e os dados pessoais apenas no navegador. A consulta real já possui API e integrações próprias; autenticação e banco de dados continuam fora do escopo implementado.
- Verificar cada entrega em celular e desktop, com navegação por teclado, mensagens claras e `npm run build`.

## Histórico das entregas anteriores

**Atualização de execução:** telas simuladas de abertura, acesso, trechos, alertas, relatos, rotas frequentes, preferências e fontes estão implementadas. No navegador foram conferidos comparação com origem e destino invertidos, abertura da explicação e detalhes por trecho, cadastro de relato, salvamento de rota, persistência após recarregar, pausa e edição de rota, além do estado de dados indisponíveis. O build e os três testes do cenário passaram. Os estados de carregamento e dados desatualizados foram implementados, mas não foram testados no navegador; exclusão, preferências, acessibilidade e responsividade em diferentes tamanhos também precisam de revisão específica. Naquele momento, o backend seguia fora do escopo.

**Atualização de 10/11/2026:** o cenário, os fatores e os trechos passaram a compartilhar identificadores estáveis; a persistência local foi isolada e a limpeza ganhou escopo explícito. A revisão cobriu 360 px e 1280 px, foco entre telas, menu móvel, alvos de toque, preferências de categoria/severidade, estados de carregamento e dados antigos, rota frequente persistida, alerta relacionado, relato e detalhes equivalentes do mapa acessíveis por teclado. A comparação agora bloqueia endereços fora do cenário e dados indisponíveis inclusive quando aberta por um alerta. Há 10 testes automatizados e o build passa. Permanecem como polimento a sincronização do controle temporário “Mostrar alerta de exemplo” com o contador global e a inversão visual dos trechos quando origem e destino são trocados. Naquele momento, o backend continuava fora do escopo.

**Revisão posterior do mock:** o controle do alerta e o contador compartilham estado; a ordem e o destaque dos trechos acompanham a viagem invertida. Os avisos atuais fictícios e relatos locais também aparecem no mapa de rotas, além do mapa da cidade; a seleção de um item da lista permite localizá-lo no mapa. O cálculo da comparação continua limitado ao cenário fixo e não é recalculado pelos demais avisos ou relatos. Relatos locais são identificados como comunitários e suas posições são ilustrativas.

Em navegador com armazenamento isolado foram conferidos comparação invertida, explicação, trechos, salvar/editar/pausar rota e persistência após recarga, contador da central, criação de relato e localização no mapa, além da persistência de preferência. A confirmação de exclusão foi verificada em teste automatizado isolado; ainda não foi exercitada no navegador. As revisões anteriores de responsividade não substituem uma nova matriz visual completa após as alterações do mapa.

- [x] Repositório Git iniciado em `C:\projects\gsAgua`, sem commit inicial.
- [x] Aplicação React/Vite criada e compilando.
- [x] Mapa interativo com camada cartográfica, rotas, área de risco e ponto de ocorrência ilustrativos.
- [x] Início com campos de origem/destino e botão para comparar.
- [x] Primeira versão da comparação, explicação da recomendação e detalhe de alerta.
- [x] Comparação ajustada para dar destaque à rota recomendada e à maior exposição da alternativa rápida.
- [x] A simulação usa locais pré-definidos; a consulta real oferece busca de endereços por serviço externo.
- [ ] Validar o fluxo completo e as integrações reais; implementação e testes automatizados não substituem a conferência no navegador e com fornecedores disponíveis.

## Atualização de 11/11/2026 — leitura do código e verificação

**Como ler as caixas:** `[x]` indica implementação identificada no código, não aprovação final ou teste ponta a ponta. `[ ]` indica trabalho ainda incompleto, decisão aberta ou verificação necessária. Os critérios “Pronto quando” continuam dependentes da revisão da jornada completa. Os registros anteriores foram mantidos como histórico.

- [x] A aplicação abre a consulta real em `/` e mantém a experiência fictícia em `/simulacao`. A navegação da consulta real para alertas, relatos, rotas frequentes, perfil e fontes abre a simulação; essas funções não estão integradas à rota real.
- [x] Simulação: telas de acesso, comparação, explicação, trechos, alertas, relatos, rotas frequentes, perfil e fontes estão implementadas; rotas, relatos e preferências são persistidos localmente.
- [x] Avisos e relatos locais aparecem nos mapas simulados, mas não recalculam a comparação fixa. Posições e horários do cenário são ilustrativos.
- [x] Em 11/11, `npm test` passou com 26 testes, `npm run test:ui` com 53 testes e `npm run build` foi concluído. Esses testes não comprovam disponibilidade das fontes nem uma consulta externa ponta a ponta.
- [x] Conferir no navegador a jornada simulada, incluindo exclusão de rota, limpeza de dados locais, preferências, recarga e retorno entre telas.
- [ ] Complementar a revisão de acessibilidade com avaliação sistemática de contraste, leitores de tela e navegação por teclado em todas as telas; foram conferidos foco e teclado nos fluxos descritos abaixo.
- [x] Fatores e trechos exibem fonte, período fictício ou indicação de indisponibilidade e relação com as rotas; a seleção do trecho usa a mesma geometria do cenário.

### Complemento de 11/11/2026 — detalhes da simulação

Os dados compartilhados de rotas, ocorrência, alerta, local do relato e trechos foram centralizados em `src/data/scenario.js` e reutilizados nas telas e no mapa. A explicação e a seleção de trecho foram conferidas no navegador em desktop; a revisão responsiva e da jornada completa continua pendente. Após as alterações, passaram 26 testes de lógica/API, 55 testes de interface e o build.

### Revisão responsiva e jornada simulada — 11/11/2026

- A jornada em desktop incluiu entrada como visitante, comparação com seleção da rota mais rápida, explicação e detalhes, retorno com seleção preservada, salvar e editar rota, pausar e reativar alertas, recarregar, abrir o alerta e comparar alternativas. O relato foi revisado, confirmado e apareceu na lista e no mapa.
- Em janela de 360 px foram conferidos comparação com origem e destino invertidos, detalhes dos trechos, menu móvel, preferências e persistência; a situação histórica da cidade foi aberta e um registro foi localizado no mapa usando Tab e Enter. Também houve inspeção visual do mapa histórico em 320 px e 768 px e da confirmação de limpeza em 360 px e 1280 px. As conferências são pontuais, não uma auditoria completa em todos os dispositivos.
- A rota criada para teste foi excluída e a limpeza dos dados foi conferida em armazenamento local isolado. O navegador interrompeu a interação com a confirmação nativa, mas a lista posteriormente ficou vazia; o cancelamento e a confirmação de exclusão também são cobertos por teste automatizado.
- Corrigido o diálogo de apagar dados: abre sobre a interface, inicia o foco em Cancelar, mantém Tab entre os botões, fecha com Escape e devolve o foco ao controle de origem. Há teste automatizado para esse comportamento.
- Após a correção passaram `npm test` (26 testes), `npm run test:ui` (56 testes) e `npm run build`. Não foi feita auditoria completa de contraste nem teste com leitores de tela; permanecem como revisão adicional.

### Painel móvel recolhível — 11/11/2026

A consulta real e a simulação usam uma aba inferior no celular, com controle para abrir/recolher e gesto vertical na alça. O mapa ocupa a área disponível; a legenda fica dentro da aba e a atribuição acompanha sua posição. Ao localizar uma ocorrência da cidade, a aba recolhe para mostrar o mapa. Foi ajustado também o cabeçalho estreito para manter o menu visível. A experiência foi inspecionada em 320 px e 390 px e no desktop; o gesto foi exercitado em teste automatizado, mas não em um aparelho físico. O agrupamento dos registros históricos e dos avisos simulados foi revisto posteriormente.

### Agrupamento de registros históricos — 11/11/2026

Os registros históricos reais, incluindo os relacionados à rota selecionada, agora são agrupados conforme a proximidade em pixels, sem depender da divisão em quadrículas. A mesma ocorrência não é duplicada entre camadas; a lista do grupo preserva detalhes e distância à rota quando disponível. A aproximação recalcula os grupos e registros com coordenadas idênticas continuam consultáveis na lista. No navegador, um grupo real foi aberto no celular e, no enquadramento inspecionado, não havia colisões entre os retângulos dos ícones históricos. Os avisos fictícios da simulação também usam agrupamento visual, com os detalhes de cada item no grupo.

## Consulta real — implementado e pendente

A implementação atual e sua configuração estão detalhadas em [Consulta real e simulação](../../rotas-reais.md), no [plano de rotas reais](2026-11-10-rotas-reais-sao-paulo.md) e no [plano de contexto de inundação](2026-11-10-contexto-inundacao-rotas.md). As caixas ainda abertas nesses planos não são automaticamente evidência de ausência de código; precisam ser reconciliadas com o estado atual e sua validação.

### Implementado no código

- [x] API Node.js local e integração de busca e trajetos de carro com HeiGIT; origem, destino e trajetos são limitados ao município de São Paulo. A chave `HEIGIT_API_KEY` permanece no servidor.
- [x] Busca por endereço e opção de localização atual como origem, mediante ação e permissão do usuário. A consulta de localização é pontual; as coordenadas são enviadas ao servidor e, ao comparar, ao provedor de rotas.
- [x] Alternativas recebidas são mostradas no mapa e em cartões selecionáveis. A exposição compara a extensão dos trajetos na camada de risco hidrológico do GeoSampa; polígonos sobrepostos não são contados duas vezes. A recomendação depende de dados disponíveis e de diferença suficiente entre alternativas.
- [x] Camadas reais de drenagem, áreas de risco, ocorrências históricas de alagamento e inundação e mancha modelada com período de retorno de 5 anos; há mensagens para falhas ou resultados parciais quando aplicável.
- [x] Contexto da rota com registros históricos a até 100 m e segmentos que cruzam a mancha de 5 anos. Essas evidências são informativas e não alteram a recomendação; período de retorno não é previsão atual nem histórico dos últimos cinco anos.
- [x] Há tratamento para dados de risco indisponíveis sem classificá-los como exposição zero, validação dos limites municipais e reaproveitamento temporário de consultas em memória.
- [x] A documentação local descreve execução, chave, fontes, limites, privacidade da localização e testes.

### Ainda falta validar ou decidir

- [ ] Executar consulta real de ponta a ponta com chave válida, origem e destino dentro de São Paulo; conferir alternativas, evidências, localização, erros e comportamento quando as fontes retornam dados parciais ou indisponíveis. Disponibilidade, cotas e condições de uso devem ser verificadas no momento da execução.
- [ ] Revisar no navegador a apresentação das camadas reais, atribuições e acessibilidade em telas móveis e desktop; testes automatizados não substituem essa inspeção.
- [ ] Definir e implementar hospedagem de produção: backend, proxy de mesma origem para `/api`, configuração segura da chave e atendimento da rota `/simulacao`. A configuração de produção ainda não está implementada.
- [ ] Avaliar integração real de alertas, relatos, rotas frequentes e preferências com as rotas consultadas, após definir requisitos, privacidade, persistência e fontes. Hoje esses fluxos são simulados.
- [ ] Avaliar fontes e requisitos antes de adicionar chuva ao vivo, notificações reais, outros modais ou cálculo mais abrangente. A ausência dessas funções não equivale a ausência de risco.
- [ ] Revalidar metodologia, cobertura e hipóteses espaciais com dados e especialistas antes de uso operacional; não apresentar a comparação atual como previsão de alagamentos ou garantia de segurança.

## Organização sugerida do código

A estrutura atual concentra interface e estado em `src/main.jsx`. Antes de ampliar os fluxos, separar gradualmente, preservando o comportamento existente:

```text
src/
  main.jsx                 entrada React
  App.jsx                  navegação e composição principal
  components/              mapa, cabeçalho, botões e elementos compartilhados
  screens/                 telas e fluxos do produto
  data/                    cenários, trajetos, fatores, relatos e alertas fictícios
  state/                   estado do protótipo e persistência local, quando necessária
  style.css                estilos globais; separar estilos conforme a necessidade
```

Essa organização é proposta, não exige criar arquivos vazios antecipadamente. Componentes devem ser extraídos conforme forem utilizados; evitar antecipar uma arquitetura de backend. O estado persistido no navegador deve ser identificado como local e poder ser apagado durante a demonstração.


## Etapa 1 — Preparação e cenário de demonstração

**O que é:** estabelecer um conjunto único de dados fictícios e uma navegação compreensível entre telas. Isso evita, por exemplo, uma ocorrência aparecer em uma rota e desaparecer do alerta relacionado.

**Implementação:**

- [x] Separar os dados de exemplo da interface: origem, destino, rotas, trechos, riscos, fontes, relatos e alertas relacionados.
- [x] Definir identificadores estáveis para relacionar rota, trecho, ocorrência e alerta. Registrar claramente que horários e localizações são fictícios.
- [x] Extrair componentes compartilhados necessários sem mudar a aparência aprovada.
- [x] Definir como voltar entre telas e preservar a seleção durante a navegação.
- [x] Manter dois cenários coerentes: menor exposição em 24 min e alternativa mais rápida em 18 min, com maior exposição.

**Pronto quando:** o fluxo atual continua funcionando após a organização, a mesma ocorrência aparece de forma coerente nas telas relacionadas e o build passa.

## Etapa 2 — Abertura e acesso

**O que é:** primeira apresentação do produto e escolha de como entrar. A tela deve explicar rapidamente seu propósito e deixar o usuário chegar ao mapa sem criar conta.

**Implementação:**

- [x] Criar tela de boas-vindas com identidade visual e uma frase curta sobre comparar trajetos durante a chuva.
- [x] Oferecer “Continuar sem conta” e acesso aos fluxos simulados de entrada e cadastro.
- [x] Criar formulários visuais de entrada e cadastro com validações simples de preenchimento; informar que o acesso é simulado.
- [x] Prever saída e retorno ao início. Não coletar senhas reais nem enviar dados a serviços externos.
- [ ] Decidir durante a revisão visual se a abertura aparece em toda visita ou apenas na primeira; não presumir uma regra definitiva.

**Pronto quando:** uma pessoa consegue iniciar sem conta ou percorrer o acesso simulado e voltar ao mapa, sem qualquer pedido de permissão real.

## Etapa 3 — Início, mapa e busca simulada

**O que é:** ponto central para entender a região e iniciar uma consulta. O mapa deve continuar interativo e legível, com legenda para rota recomendada, alternativa e área de risco.

**Implementação:**

- [ ] Refinar o mapa para celular e desktop, mantendo atribuições das fontes cartográficas visíveis.
- [x] Permitir informar origem e destino, trocar os campos e escolher entre sugestões **pré-definidas** para o cenário mockado.
- [x] Explicar quando um endereço digitado não pertence ao cenário disponível, em vez de sugerir que houve geocodificação real.
- [x] Fazer o botão de centralização voltar ao enquadramento do cenário; não solicitar localização real nesta etapa.
- [x] Exibir legenda, ocorrência e área de risco com detalhes acessíveis ao toque e ao teclado.
- [x] Manter entrada para alertas e rotas frequentes, inclusive no menu de celular.

**Pronto quando:** o usuário escolhe origem e destino disponíveis, encontra os dois pontos no mapa e chega à comparação; uma entrada sem correspondência recebe orientação clara.

## Etapa 3A — Mapa da situação da cidade

**O que é:** permitir que a pessoa explore os acontecimentos na cidade sem precisar informar origem e destino ou montar uma rota. A montagem e comparação de trajetos continuam disponíveis.

O mesmo mapa terá uma alternância entre dois modos:

- **Agora:** mostrar ocorrências recentes, como alagamentos e inundações, com horário e origem da informação quando disponíveis. A interface deve indicar quando os dados foram atualizados e distinguir dados desatualizados ou indisponíveis de ausência de ocorrências. Não prometer atualização em tempo real sem uma fonte que a sustente.
- **Histórico:** apresentar registros anteriores e evidenciar regiões onde acontecimentos se repetem, identificando o período e a fonte disponíveis. Um registro ou concentração histórica não significa que exista uma ocorrência naquele momento nem garante cobertura completa da cidade.

**Implementação:**

- [x] Oferecer acesso à consulta da cidade sem exigir rota, conta ou localização real.
- [x] Permitir alternar entre “Agora” e “Histórico” no mesmo mapa, identificando claramente o modo selecionado.
- [x] Mostrar ocorrências e áreas históricas fictícias de maneira coerente com o cenário, com identificação visível de que os dados são simulados.
- [x] Permitir consultar detalhes por toque e teclado, incluindo tipo, local, fonte e horário ou período fictícios quando disponíveis.
- [x] Prever legenda textual e estados de carregamento, vazio, dados antigos e indisponibilidade para cada modo; não depender apenas de cor.
- [ ] Preservar a atribuição cartográfica, a acessibilidade e a responsividade, além do acesso aos fluxos de rotas existentes.
- [x] Deixar tipos adicionais de acontecimentos, filtros, período histórico e forma de representar concentrações para definição posterior.

**Pronto quando:** uma pessoa consegue abrir o mapa sem montar uma rota, alternar os modos, consultar detalhes de exemplos e compreender a diferença entre uma ocorrência recente e um registro histórico. Nesta fase, ambos os modos são demonstrativos e não representam a situação real da cidade.

**Integração futura:** avaliar fontes, cobertura, frequência de atualização, período histórico e condições de uso antes de substituir os dados fictícios; dados antigos ou lacunas de cobertura devem continuar explícitos.

**Implementação do mock em 10/11/2026:** modos e estados simulados implementados, com detalhes em painel acessível e marcadores no mapa. Testes automatizados, build e navegação dos dois modos no navegador passaram. A revisão visual em diferentes tamanhos e a integração com dados reais permanecem pendentes.


## Etapa 4 — Comparação e escolha de rotas

**O que é:** mostrar o compromisso entre tempo e exposição. Esta é uma parte central da demonstração e já possui uma primeira versão.

**Implementação:**

- [x] Apresentar as alternativas no mapa e em cartões, associando claramente a cor da linha ao cartão correspondente.
- [x] Manter a rota de menor exposição conhecida como recomendada no cenário fornecido, com tempo e justificativa destacados.
- [x] Mostrar que a alternativa mais rápida cruza área R3 e ocorrência reportada; sinalizar “maior exposição” em texto e visualmente.
- [x] Permitir selecionar qualquer alternativa e evidenciar a escolha no cartão e no mapa, com indicação acessível de seleção.
- [x] Ao selecionar a alternativa de maior exposição, manter o alerta visível e o texto do botão coerente com a escolha.
- [x] Acessar “Por que recomendamos esta rota?” e salvar o trajeto escolhido como rota frequente.
- [x] Simular o uso da rota com uma confirmação visual clara, sem afirmar que a navegação GPS foi iniciada.

**Pronto quando:** o usuário consegue explicar por que a rota de 24 minutos é recomendada e identificar o risco adicional da rota de 18 minutos antes de escolhê-la.

## Etapa 5 — Explicação da rota

**O que é:** apresentar, em linguagem simples, os fatores que sustentam a recomendação, sem transformar contexto geográfico em evidência automática de perigo.

**Implementação:**

- [x] Exibir resumo de tempo, diferença em relação à outra alternativa e fatores considerados.
- [x] Apresentar área oficial, histórico de ocorrências, chuva, relatos e cursos d’água próximos quando existentes no cenário.
- [x] Explicar que proximidade de rio ou córrego, isoladamente, não comprova risco.
- [x] Permitir expandir cada fator para ver fonte, horário ou período e como ele se relaciona à rota, sem sugerir que os números foram consultados em tempo real.
- [x] Diferenciar “não há informação disponível” de “nenhum risco foi identificado”.
- [x] Acessar a tela de detalhes por trecho e voltar à comparação preservando a escolha.

**Pronto quando:** cada justificativa está ligada aos dados fictícios do cenário, tem origem identificada e a pessoa consegue retornar sem perder a rota selecionada.

## Etapa 6 — Detalhes por trecho

**O que é:** aprofundar a explicação em pontos específicos, com destaque no mapa e informações resumidas por segmento.

**Implementação:**

- [x] Criar uma lista ou linha de percurso com trechos selecionáveis e indicação textual da exposição conhecida.
- [x] Ao selecionar um trecho, destacá-lo no mapa e mostrar nome ou referência do local, fatores, fonte e horário fictícios.
- [x] Mostrar por que o fator importa e se se refere à rota recomendada ou à alternativa.
- [x] Permitir trocar de trecho e voltar à explicação geral.
- [x] Prever trecho sem observação suficiente, com mensagem de cobertura insuficiente.

**Pronto quando:** a seleção altera o trecho e o painel em conjunto, e cada detalhe corresponde ao mesmo cenário mostrado na comparação.

## Etapa 7 — Central e detalhe de alertas

**O que é:** reunir avisos e permitir entender seu impacto na rota frequente. O frontend simulará eventos, sem envio de notificações reais.

**Implementação:**

- [x] Criar uma central com alertas fictícios, severidade, local, horário e estado lido/não lido.
- [x] Exibir estado vazio e permitir abrir e voltar ao detalhe de um alerta.
- [x] No detalhe, destacar no mapa o trecho afetado e apresentar descrição, fonte, atualização e validade simuladas.
- [x] Oferecer comparação de alternativa e retorno ao mapa.
- [x] Simular ativação e desativação de alertas na interface, sem solicitar permissão de push.

**Pronto quando:** abrir um alerta mostra o mesmo evento e local listados na central, e a alternativa leva ao fluxo de comparação correspondente.

## Etapa 8 — Relatos comunitários

**O que é:** simular o cadastro de uma observação do usuário sobre as condições de uma via.

**Implementação:**

- [x] Criar formulário para tipo de ocorrência, localização no cenário, gravidade percebida, situação da via e descrição opcional.
- [x] Oferecer foto como parte do desenho do fluxo; se houver seleção local, informar que não será enviada e não inventar persistência.
- [x] Validar campos necessários e permitir cancelar ou revisar antes de confirmar.
- [x] Ao confirmar, mostrar sucesso e inserir o relato no cenário local com indicação de que é simulado.
- [x] Exibir origem comunitária e estado do relato; não apresentá-lo como confirmação oficial.
- [x] Quando não houver conta simulada, explicar a necessidade prevista de identificação antes de registrar o relato na versão real.

**Pronto quando:** o relato preenchido aparece no mapa ou na lista local com os mesmos dados, e cancelar não cria ocorrência.

## Etapa 9 — Rotas frequentes

**O que é:** guardar um trajeto escolhido para demonstrar uma rotina e o vínculo com alertas.

**Implementação:**

- [x] Criar lista de rotas salvas e estado vazio com ação para comparar uma rota.
- [x] Permitir salvar uma alternativa, dar nome, escolher modal disponível no cenário, dias, horário de ida/volta e antecedência.
- [x] Permitir consultar, editar, pausar alertas e excluir a rota local.
- [x] Simular preferências de notificação e explicar que os avisos reais ainda não são enviados.
- [x] Persistir localmente apenas o necessário para manter a demonstração após recarregar; não armazenar histórico de deslocamento.
- [x] Relacionar o alerta de exemplo à rota salva quando o cenário for compatível.

**Pronto quando:** salvar, editar, pausar e excluir produzem resultados coerentes na lista e continuam corretos após recarregar, se a persistência local estiver ativada.

## Etapa 10 — Perfil e preferências

**O que é:** reunir as escolhas de privacidade e notificação, demonstrando como o usuário controlará essas funções.

**Implementação:**

- [x] Criar tela de perfil com estado visitante ou conta simulada.
- [x] Permitir simular preferências de alertas, categorias, severidade e horário silencioso.
- [x] Explicar o uso futuro da localização e permitir alterar a preferência sem pedir permissão real nesta fase.
- [x] Oferecer saída da conta simulada e opção de apagar os dados locais do protótipo, com confirmação e escopo explícito.
- [x] Manter acesso às funções de consulta para visitantes.

**Pronto quando:** as preferências escolhidas são refletidas na interface e o usuário entende o que é salvo apenas no navegador.

## Etapa 11 — Fontes, metodologia e limites

**O que é:** uma página acessível a partir do app para explicar dados e limitações sem sobrecarregar a tela principal.

**Implementação:**

- [x] Explicar o papel previsto de GeoSampa, SIBH e OpenStreetMap, deixando claro o que ainda é fictício.
- [x] Diferenciar observação, histórico, área mapeada e relato comunitário.
- [x] Explicar que a comparação usa uma proposta experimental e que dados ausentes ou antigos limitam a análise.
- [x] Manter atribuição do mapa e dos provedores efetivamente utilizados.
- [x] Não apresentar pesos, limites ou classificação como validados ou oficiais quando forem hipóteses do projeto.

**Pronto quando:** a tela informa a origem e o significado dos dados sem prometer previsão de alagamentos ou segurança garantida.

## Etapa 12 — Estados, acessibilidade e revisão final

**O que é:** assegurar que o protótipo conte a história completa, inclusive quando faltarem informações.

**Implementação:**

- [x] Criar estados de carregamento simulado, lista vazia, erro e dados antigos ou indisponíveis.
- [ ] Verificar textos, ordem de foco, rótulos, alvos de toque e contraste; não usar somente cor para transmitir risco.
- [ ] Testar celular e desktop, rolagem, navegação entre telas e comportamento do mapa.
- [x] Conferir que recarregar, voltar e limpar dados locais não deixam a interface inconsistente nos fluxos testados.
- [x] Percorrer o roteiro: escolher destino → comparar → explicar → detalhes por trecho → salvar rota → abrir alerta → comparar alternativa → criar relato simulado.
- [x] Corrigir a inconsistência de foco encontrada na confirmação de limpeza e executar `npm run build`.

**Pronto quando:** a jornada pode ser apresentada do início ao fim, sem ações que aparentem fazer uma integração real inexistente.

## Backend — evolução futura

A API local para consulta de rotas e fontes geográficas já existe. Os próximos pontos dizem respeito à sua evolução e às funcionalidades ainda simuladas.

**Decisão de 11/11/2026:** usar por enquanto a integração experimental de chuva observada do SIBH/SP Águas como informação complementar no mapa. O teste local retornou medições de estações e permitiu consultar seus detalhes; isso não comprova estabilidade contínua. As condições específicas de reutilização da API de medições atuais ainda precisam ser confirmadas. A cobertura é limitada, a fonte pode falhar e as medições não entram no cálculo da recomendação. A integração está disponível por padrão na API, mas a camada precisa ser ativada no mapa; detalhes e opção para desativá-la estão em `docs/rotas-reais.md`.

**Prioridade definida em 11/11/2026:** implementar rotas frequentes reais antes dos relatos; deixar os relatos por último. Nesta etapa as rotas reais ficam no armazenamento local do navegador, sem login, conforme pedido do usuário; reutilizam o fluxo visual do mock e não são sincronizadas entre dispositivos. Alertas reais e eventual armazenamento no backend permanecem para definição posterior.

1. Revisar e ampliar os contratos da API e modelos de dados a partir dos fluxos aprovados.
2. Definir hospedagem e, se necessário, banco conforme as necessidades reais, incluindo dados geográficos.
3. Validar disponibilidade, autorização e condições de uso das fontes; preparar ingestão, atualização e indicação de dados antigos.
4. Validar e evoluir a integração já existente de mapa, busca, alternativas e comparação de exposição explicável.
5. Conectar contas, relatos, rotas frequentes e alertas, com privacidade e controles adequados.
6. Substituir os mocks gradualmente e testar os fluxos completos; calibrar a metodologia com dados e especialistas antes de uso operacional.

**Ainda em aberto:** validação operacional e eventual escolha definitiva do provedor de rotas e busca, banco geográfico, infraestrutura, custos, forma de autenticação, entrega de notificações e parâmetros do cálculo. A intenção de hospedar na Vercel ou em outro lugar será avaliada quando houver requisitos de backend e operação.

## Ordem de execução e decisões pendentes

Priorizar as pendências abertas acima e a revisão final da jornada. As etapas 1 a 12 preservam o roteiro original e podem ser concluídas por fluxo; não é necessário refazer itens já implementados.

Decisões que ainda precisam ser discutidas ao chegar em cada fluxo: identidade final da abertura, conjunto inicial de modais, regra da conta para relatos, necessidade de foto no primeiro protótipo e níveis de detalhe técnico apresentados à banca. Essas questões não bloqueiam a organização inicial nem o refinamento do fluxo já existente.
