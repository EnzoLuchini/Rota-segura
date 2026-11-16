# Web Push para rotas frequentes — implementação

**Objetivo:** avisar em dispositivos Android e iOS sobre avisos INMET que intersectem a rota frequente, sem login.

**Arquitetura:** inscrição Web Push por dispositivo com permissão explícita, service worker, API protegida por credencial aleatória do dispositivo e armazenamento no servidor. Um trabalho agendado consulta o INMET, cruza geometrias e envia notificações; nenhuma chave privilegiada é exposta no frontend. Autenticação e associação futura à conta ficam fora desta etapa.

**Execução:** preservar alterações locais existentes. Não afirmar funcionamento em produção sem configurar agendador e credenciais e verificar em dispositivos reais.

- [x] Preservar geometrias CAP válidas e identificar avisos vigentes sem confundir cobertura ausente com ausência de risco; associação espacial e horário possuem testes iniciais.
- [ ] Salvar a geometria da alternativa selecionada e associar preferências, dias e horários; tratar rotas antigas sem geometria.
- [ ] Implementar armazenamento e API com isolamento por dispositivo, validação e exclusão; proteger inscrições e dados de rotas.
- [ ] Criar manifest, service worker, inscrição e controles de ativação/pausa/desativação, incluindo instruções para iOS.
- [ ] Implementar verificação periódica, interseção geográfica, deduplicação, tratamento de cancelamento, falhas e expiração de inscrições.
- [ ] Configurar e documentar segredos e agendador apropriado; testar lógica, interface, build, integração e dispositivos.
