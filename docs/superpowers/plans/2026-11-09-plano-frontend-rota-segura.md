# Plano de implementação — frontend do Rota Segura

**Objetivo:** construir um protótipo web em React, navegável e responsivo, que demonstre a jornada completa do Rota Segura com dados fictícios, antes da implementação do backend.

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
- Construir os fluxos em React primeiro. Não iniciar autenticação, API, banco ou integrações reais nesta fase.
- Verificar cada entrega em celular e desktop, com navegação por teclado, mensagens claras e `npm run build`.

## Situação atual

**Atualização de execução:** telas simuladas de abertura, acesso, trechos, alertas, relatos, rotas frequentes, preferências e fontes estão implementadas. No navegador foram conferidos comparação com origem e destino invertidos, abertura da explicação e detalhes por trecho, cadastro de relato, salvamento de rota, persistência após recarregar, pausa e edição de rota, além do estado de dados indisponíveis. O build e os três testes do cenário passaram. Os estados de carregamento e dados desatualizados foram implementados, mas não foram testados no navegador; exclusão, preferências, acessibilidade e responsividade em diferentes tamanhos também precisam de revisão específica. O backend segue fora do escopo.

**Atualização de 10/11/2026:** o cenário, os fatores e os trechos passaram a compartilhar identificadores estáveis; a persistência local foi isolada e a limpeza ganhou escopo explícito. A revisão cobriu 360 px e 1280 px, foco entre telas, menu móvel, alvos de toque, preferências de categoria/severidade, estados de carregamento e dados antigos, rota frequente persistida, alerta relacionado, relato e detalhes equivalentes do mapa acessíveis por teclado. A comparação agora bloqueia endereços fora do cenário e dados indisponíveis inclusive quando aberta por um alerta. Há 10 testes automatizados e o build passa. Permanecem como polimento a sincronização do controle temporário “Mostrar alerta de exemplo” com o contador global e a inversão visual dos trechos quando origem e destino são trocados. O backend continua fora do escopo.

- [x] Repositório Git iniciado em `C:\projects\gsAgua`, sem commit inicial.
- [x] Aplicação React/Vite criada e compilando.
- [x] Mapa interativo com camada cartográfica, rotas, área de risco e ponto de ocorrência ilustrativos.
- [x] Início com campos de origem/destino e botão para comparar.
- [x] Primeira versão da comparação, explicação da recomendação e detalhe de alerta.
- [x] Comparação ajustada para dar destaque à rota recomendada e à maior exposição da alternativa rápida.
- [ ] Os campos ainda não fazem busca real; a navegação e os dados são simulados.
- [ ] Todas as funcionalidades abaixo devem ser consideradas pendentes até verificadas no fluxo completo.

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

- [ ] Separar os dados de exemplo da interface: origem, destino, rotas, trechos, riscos, fontes, relatos e alertas relacionados.
- [ ] Definir identificadores estáveis para relacionar rota, trecho, ocorrência e alerta. Registrar claramente que horários e localizações são fictícios.
- [ ] Extrair componentes compartilhados necessários sem mudar a aparência aprovada.
- [ ] Definir como voltar entre telas e preservar a seleção durante a navegação.
- [ ] Manter dois cenários coerentes: menor exposição em 24 min e alternativa mais rápida em 18 min, com maior exposição.

**Pronto quando:** o fluxo atual continua funcionando após a organização, a mesma ocorrência aparece de forma coerente nas telas relacionadas e o build passa.

## Etapa 2 — Abertura e acesso

**O que é:** primeira apresentação do produto e escolha de como entrar. A tela deve explicar rapidamente seu propósito e deixar o usuário chegar ao mapa sem criar conta.

**Implementação:**

- [ ] Criar tela de boas-vindas com identidade visual e uma frase curta sobre comparar trajetos durante a chuva.
- [ ] Oferecer “Continuar sem conta” e acesso aos fluxos simulados de entrada e cadastro.
- [ ] Criar formulários visuais de entrada e cadastro com validações simples de preenchimento; informar que o acesso é simulado.
- [ ] Prever saída e retorno ao início. Não coletar senhas reais nem enviar dados a serviços externos.
- [ ] Decidir durante a revisão visual se a abertura aparece em toda visita ou apenas na primeira; não presumir uma regra definitiva.

**Pronto quando:** uma pessoa consegue iniciar sem conta ou percorrer o acesso simulado e voltar ao mapa, sem qualquer pedido de permissão real.

## Etapa 3 — Início, mapa e busca simulada

**O que é:** ponto central para entender a região e iniciar uma consulta. O mapa deve continuar interativo e legível, com legenda para rota recomendada, alternativa e área de risco.

**Implementação:**

- [ ] Refinar o mapa para celular e desktop, mantendo atribuições das fontes cartográficas visíveis.
- [ ] Permitir informar origem e destino, trocar os campos e escolher entre sugestões **pré-definidas** para o cenário mockado.
- [ ] Explicar quando um endereço digitado não pertence ao cenário disponível, em vez de sugerir que houve geocodificação real.
- [ ] Fazer o botão de centralização voltar ao enquadramento do cenário; não solicitar localização real nesta etapa.
- [ ] Exibir legenda, ocorrência e área de risco com detalhes acessíveis ao toque e ao teclado.
- [ ] Manter entrada para alertas e rotas frequentes, inclusive no menu de celular.

**Pronto quando:** o usuário escolhe origem e destino disponíveis, encontra os dois pontos no mapa e chega à comparação; uma entrada sem correspondência recebe orientação clara.

## Etapa 4 — Comparação e escolha de rotas

**O que é:** mostrar o compromisso entre tempo e exposição. Esta é uma parte central da demonstração e já possui uma primeira versão.

**Implementação:**

- [ ] Apresentar as alternativas no mapa e em cartões, associando claramente a cor da linha ao cartão correspondente.
- [ ] Manter a rota de menor exposição conhecida como recomendada no cenário fornecido, com tempo e justificativa destacados.
- [ ] Mostrar que a alternativa mais rápida cruza área R3 e ocorrência reportada; sinalizar “maior exposição” em texto e visualmente.
- [ ] Permitir selecionar qualquer alternativa e evidenciar a escolha no cartão e no mapa, com indicação acessível de seleção.
- [ ] Ao selecionar a alternativa de maior exposição, manter o alerta visível e o texto do botão coerente com a escolha.
- [ ] Acessar “Por que recomendamos esta rota?” e salvar o trajeto escolhido como rota frequente.
- [ ] Simular o uso da rota com uma confirmação visual clara, sem afirmar que a navegação GPS foi iniciada.

**Pronto quando:** o usuário consegue explicar por que a rota de 24 minutos é recomendada e identificar o risco adicional da rota de 18 minutos antes de escolhê-la.

## Etapa 5 — Explicação da rota

**O que é:** apresentar, em linguagem simples, os fatores que sustentam a recomendação, sem transformar contexto geográfico em evidência automática de perigo.

**Implementação:**

- [ ] Exibir resumo de tempo, diferença em relação à outra alternativa e fatores considerados.
- [ ] Apresentar área oficial, histórico de ocorrências, chuva, relatos e cursos d’água próximos quando existentes no cenário.
- [ ] Explicar que proximidade de rio ou córrego, isoladamente, não comprova risco.
- [ ] Permitir expandir cada fator para ver fonte, horário ou período e como ele se relaciona à rota, sem sugerir que os números foram consultados em tempo real.
- [ ] Diferenciar “não há informação disponível” de “nenhum risco foi identificado”.
- [ ] Acessar a tela de detalhes por trecho e voltar à comparação preservando a escolha.

**Pronto quando:** cada justificativa está ligada aos dados fictícios do cenário, tem origem identificada e a pessoa consegue retornar sem perder a rota selecionada.

## Etapa 6 — Detalhes por trecho

**O que é:** aprofundar a explicação em pontos específicos, com destaque no mapa e informações resumidas por segmento.

**Implementação:**

- [ ] Criar uma lista ou linha de percurso com trechos selecionáveis e indicação textual da exposição conhecida.
- [ ] Ao selecionar um trecho, destacá-lo no mapa e mostrar nome ou referência do local, fatores, fonte e horário fictícios.
- [ ] Mostrar por que o fator importa e se se refere à rota recomendada ou à alternativa.
- [ ] Permitir trocar de trecho e voltar à explicação geral.
- [ ] Prever trecho sem observação suficiente, com mensagem de cobertura insuficiente.

**Pronto quando:** a seleção altera o trecho e o painel em conjunto, e cada detalhe corresponde ao mesmo cenário mostrado na comparação.

## Etapa 7 — Central e detalhe de alertas

**O que é:** reunir avisos e permitir entender seu impacto na rota frequente. O frontend simulará eventos, sem envio de notificações reais.

**Implementação:**

- [ ] Criar uma central com alertas fictícios, severidade, local, horário e estado lido/não lido.
- [ ] Exibir estado vazio e permitir abrir e voltar ao detalhe de um alerta.
- [ ] No detalhe, destacar no mapa o trecho afetado e apresentar descrição, fonte, atualização e validade simuladas.
- [ ] Oferecer comparação de alternativa e retorno ao mapa.
- [ ] Simular ativação e desativação de alertas na interface, sem solicitar permissão de push.

**Pronto quando:** abrir um alerta mostra o mesmo evento e local listados na central, e a alternativa leva ao fluxo de comparação correspondente.

## Etapa 8 — Relatos comunitários

**O que é:** simular o cadastro de uma observação do usuário sobre as condições de uma via.

**Implementação:**

- [ ] Criar formulário para tipo de ocorrência, localização no cenário, gravidade percebida, situação da via e descrição opcional.
- [ ] Oferecer foto como parte do desenho do fluxo; se houver seleção local, informar que não será enviada e não inventar persistência.
- [ ] Validar campos necessários e permitir cancelar ou revisar antes de confirmar.
- [ ] Ao confirmar, mostrar sucesso e inserir o relato no cenário local com indicação de que é simulado.
- [ ] Exibir origem comunitária e estado do relato; não apresentá-lo como confirmação oficial.
- [ ] Quando não houver conta simulada, explicar a necessidade prevista de identificação antes de registrar o relato na versão real.

**Pronto quando:** o relato preenchido aparece no mapa ou na lista local com os mesmos dados, e cancelar não cria ocorrência.

## Etapa 9 — Rotas frequentes

**O que é:** guardar um trajeto escolhido para demonstrar uma rotina e o vínculo com alertas.

**Implementação:**

- [ ] Criar lista de rotas salvas e estado vazio com ação para comparar uma rota.
- [ ] Permitir salvar uma alternativa, dar nome, escolher modal disponível no cenário, dias, horário de ida/volta e antecedência.
- [ ] Permitir consultar, editar, pausar alertas e excluir a rota local.
- [ ] Simular preferências de notificação e explicar que os avisos reais ainda não são enviados.
- [ ] Persistir localmente apenas o necessário para manter a demonstração após recarregar; não armazenar histórico de deslocamento.
- [ ] Relacionar o alerta de exemplo à rota salva quando o cenário for compatível.

**Pronto quando:** salvar, editar, pausar e excluir produzem resultados coerentes na lista e continuam corretos após recarregar, se a persistência local estiver ativada.

## Etapa 10 — Perfil e preferências

**O que é:** reunir as escolhas de privacidade e notificação, demonstrando como o usuário controlará essas funções.

**Implementação:**

- [ ] Criar tela de perfil com estado visitante ou conta simulada.
- [ ] Permitir simular preferências de alertas, categorias, severidade e horário silencioso.
- [ ] Explicar o uso futuro da localização e permitir alterar a preferência sem pedir permissão real nesta fase.
- [ ] Oferecer saída da conta simulada e opção de apagar os dados locais do protótipo, com confirmação e escopo explícito.
- [ ] Manter acesso às funções de consulta para visitantes.

**Pronto quando:** as preferências escolhidas são refletidas na interface e o usuário entende o que é salvo apenas no navegador.

## Etapa 11 — Fontes, metodologia e limites

**O que é:** uma página acessível a partir do app para explicar dados e limitações sem sobrecarregar a tela principal.

**Implementação:**

- [ ] Explicar o papel previsto de GeoSampa, SIBH e OpenStreetMap, deixando claro o que ainda é fictício.
- [ ] Diferenciar observação, histórico, área mapeada e relato comunitário.
- [ ] Explicar que a comparação usa uma proposta experimental e que dados ausentes ou antigos limitam a análise.
- [ ] Manter atribuição do mapa e dos provedores efetivamente utilizados.
- [ ] Não apresentar pesos, limites ou classificação como validados ou oficiais quando forem hipóteses do projeto.

**Pronto quando:** a tela informa a origem e o significado dos dados sem prometer previsão de alagamentos ou segurança garantida.

## Etapa 12 — Estados, acessibilidade e revisão final

**O que é:** assegurar que o protótipo conte a história completa, inclusive quando faltarem informações.

**Implementação:**

- [ ] Criar estados de carregamento simulado, lista vazia, erro e dados antigos ou indisponíveis.
- [ ] Verificar textos, ordem de foco, rótulos, alvos de toque e contraste; não usar somente cor para transmitir risco.
- [ ] Testar celular e desktop, rolagem, navegação entre telas e comportamento do mapa.
- [ ] Conferir que recarregar, voltar e limpar dados locais não deixam a interface inconsistente.
- [ ] Percorrer o roteiro: escolher destino → comparar → explicar → detalhes por trecho → salvar rota → abrir alerta → comparar alternativa → criar relato simulado.
- [ ] Corrigir inconsistências encontradas e executar `npm run build`.

**Pronto quando:** a jornada pode ser apresentada do início ao fim, sem ações que aparentem fazer uma integração real inexistente.

## Backend — visão resumida para depois

1. Definir contratos da API e modelos de dados a partir dos fluxos do frontend aprovado.
2. Criar API em Node.js e escolher hospedagem e banco conforme as necessidades reais, incluindo dados geográficos.
3. Validar disponibilidade, autorização e condições de uso das fontes; preparar ingestão, atualização e indicação de dados antigos.
4. Integrar mapa, busca e cálculo de alternativas, depois implementar a comparação de exposição explicável.
5. Conectar contas, relatos, rotas frequentes e alertas, com privacidade e controles adequados.
6. Substituir os mocks gradualmente e testar os fluxos completos; calibrar a metodologia com dados e especialistas antes de uso operacional.

**Ainda em aberto:** provedor de rotas e busca, banco geográfico, infraestrutura, custos, forma de autenticação, entrega de notificações e parâmetros do cálculo. A intenção de hospedar na Vercel ou em outro lugar será avaliada quando houver requisitos de backend e operação.

## Ordem de execução e decisões pendentes

Executar as etapas 1 a 12 em ordem, podendo revisar o visual de cada tela antes de implementá-la. Cada etapa entrega um fluxo verificável; não é necessário esperar todas as telas para revisar o resultado.

Decisões que ainda precisam ser discutidas ao chegar em cada fluxo: identidade final da abertura, conjunto inicial de modais, regra da conta para relatos, necessidade de foto no primeiro protótipo e níveis de detalhe técnico apresentados à banca. Essas questões não bloqueiam a organização inicial nem o refinamento do fluxo já existente.
