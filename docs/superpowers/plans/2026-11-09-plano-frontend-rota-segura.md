# Rota Segura — estado do projeto e próximas etapas

Atualizado em 15/11/2026 com base nos arquivos locais e nos registros anteriores. Este plano organiza as pendências; implementação identificada não equivale a validação operacional. Detalhes de execução, contratos e fontes estão em [Consulta real e simulação](../../rotas-reais.md).

## Estado atual

- A consulta real em `/` busca endereços e compara trajetos de carro dentro do município de São Paulo. A chave HeiGIT fica no servidor. A experiência fictícia permanece em `/simulacao`, com dados e armazenamento separados.
- A comparação usa uma pontuação experimental relativa às alternativas: áreas de risco mapeadas (50%), registros históricos próximos (30%) e chuva observada por estação (20%). Fontes incompletas ou cobertura técnica insuficiente impedem a recomendação. Os pesos e limites não são validados cientificamente; a pontuação não é previsão nem garantia de segurança.
- O mapa oferece drenagem, áreas de risco, registros históricos, mancha modelada de retorno de 5 anos e chuva observada. A mancha é contexto, não histórico dos últimos cinco anos ou previsão, e não altera a pontuação. A situação real da cidade mostra chuva, avisos INMET e link ao CGE; não há integração automática das ocorrências atuais do CGE.
- A alternativa escolhida tem explicação e detalhes por trechos aproximados, com evidências e destaque no mapa. A pontuação é da rota inteira. A central real apresenta avisos meteorológicos, não confirmação de alagamento na via.
- Rotas frequentes reais são armazenadas no navegador e podem ser editadas, excluídas e reutilizadas. Não há sincronização entre dispositivos, associação automática de avisos nem notificações reais. Relatos e preferências da simulação continuam fictícios e locais.
- Cadastro, entrada, saída e recuperação de senha por e-mail com Supabase Auth estão implementados localmente; visitantes continuam com acesso à consulta. A sessão não sincroniza as rotas frequentes. A recuperação ainda precisa ser verificada com e-mail real. A tela real de fontes e metodologia também está implementada localmente.
- O projeto possui API Node e configuração para Vercel. Em 12/11 foi registrada uma consulta bem-sucedida no domínio publicado e o commit `f929171` publicado. As alterações posteriores, incluindo cidade, trechos, autenticação e fontes, ainda não tiveram sua publicação e jornada verificadas no site público.

## Próximas etapas

### 1. Validar a jornada real e as alterações locais

- [ ] Com a API e a chave válidas, percorrer busca, localização atual autorizada, comparação, seleção, explicação, trechos, situação da cidade, avisos e salvamento, edição, exclusão e reutilização de rotas frequentes. Conferir retorno e persistência após recarga.
- [ ] Exercitar falhas e dados parciais ou antigos das fontes, inclusive ausência de cobertura de chuva, e confirmar que não aparecem como risco ou chuva zero. Conferir alternativas, evidências, limites municipais e atribuições.
- [ ] Repetir `npm test`, `npm run test:ui` e `npm run build` após novas alterações. Verificar disponibilidade, cotas e condições dos serviços no momento da consulta.
- [ ] Antes de qualquer publicação, revisar as alterações locais e os resultados. Quando houver autorização para publicar, configurar as variáveis necessárias e conferir novamente API, `/simulacao` e jornada real no ambiente publicado.

### 2. Revisar usabilidade e acessibilidade

- [ ] Revisar mapa, camadas, painéis, rolagem e navegação em celular e desktop, incluindo aparelho físico quando possível. Conferir que as atribuições permaneçam visíveis.
- [ ] Avaliar sistematicamente teclado, ordem e retorno de foco, rótulos, alvos de toque, contraste e leitores de tela; a informação de risco não deve depender apenas de cor.
- [ ] Decidir se a abertura da simulação aparece a cada visita ou somente na primeira. Preservar o acesso como visitante.

### 3. Confirmar fontes e metodologia

- [ ] Confirmar disponibilidade, cobertura, estabilidade e condições de uso das fontes. Em especial, verificar as condições da API atual de medições do SIBH e a completude e condições de reprodução do feed INMET.
- [ ] Revalidar pesos, cobertura e hipóteses espaciais com dados e especialistas antes de uso operacional. As amostras de chuva a cada até 250 m, associação a estações em até 3 km, validade de 90 minutos e histórico a até 100 m são parâmetros experimentais.
- [ ] Avaliar provedor de rotas, custos, cotas e infraestrutura de longo prazo. Decidir se há necessidade de banco geográfico ou persistência no servidor.

### 4. Definir integrações futuras

- [ ] Definir requisitos e privacidade para sincronização de rotas e preferências, associação de avisos a rotas frequentes e eventual entrega de notificações. A central INMET não envia notificações.
- [ ] Avaliar fontes e requisitos antes de ampliar modais, chuva ou outros indicadores; ausência de informação não é ausência de risco.
- [ ] Deixar relatos comunitários reais por último, conforme a prioridade já definida. Antes de implementá-los, decidir identificação, moderação, localização, fotos, armazenamento e privacidade.

### 5. Etapa final: autenticação e entrega

- [ ] Configurar SMTP transacional para envio a usuários externos e verificar Site URL e Redirect URLs nos ambientes necessários. O usuário informou ter configurado os redirecionamentos, mas eles não foram verificados na consulta de leitura anterior.
- [ ] Testar com uma conta real o ciclo de cadastro, recebimento e confirmação do e-mail, entrada, sessão, saída e recuperação de senha. Uma tentativa anterior não encontrou conta para o e-mail de teste, sem causa confirmada. Manter a confirmação de e-mail habilitada.
- [ ] Revisar documentação, variáveis públicas e limitações de conta e armazenamento; repetir as verificações relevantes antes da entrega.

## Evidências e limites das verificações anteriores

- Em 15/11, passaram 61 testes de lógica/API, 101 testes de interface e o build. O Vite informou um bundle maior que 500 kB; não houve nova validação da jornada no navegador nessa verificação.
- Em 12/11, uma consulta local Vila Matilde → Vila Mariana retornou três alternativas e abriu detalhes por trecho; a chuva parcial impediu recomendação. Cidade e trechos receberam inspeção visual pontual em desktop e viewport de 390 × 844. Foram registrados 61 testes de lógica/API, 93 de interface e build aprovados naquela etapa.
- Na publicação conferida em 12/11, uma busca e comparação retornaram três alternativas, a chuva retornou estações e os avisos responderam com estado parcial. Isso não comprova disponibilidade contínua ou cobertura. O diagnóstico de cobertura em uma consulta Vila Matilde → Vila Mariana identificou amostras sem estação válida a até 3 km.
- A jornada simulada foi revisada em navegador, incluindo rota salva, relato, preferências e limpeza local; houve inspeções em larguras móveis e desktop. Testes pontuais não substituem auditoria completa de acessibilidade nem teste em aparelho físico.
- O projeto Supabase havia respondido com cadastro e provedor de e-mail ativos e confirmação habilitada, mas o ciclo completo não foi concluído. A verificação registrada é histórica e não comprova a configuração atual.

Os planos de implementação anteriores foram consolidados aqui. Seus detalhes de projeto permanecem nas especificações em `docs/superpowers/specs/` e no histórico Git; informações operacionais atuais devem ser mantidas em [Consulta real e simulação](../../rotas-reais.md).
