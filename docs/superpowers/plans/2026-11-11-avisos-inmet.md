# Avisos INMET — plano de implementação

**Objetivo:** consultar avisos oficiais vigentes para São Paulo dentro da central real, com fonte, horário e limitações visíveis.

**Especificação:** `docs/superpowers/specs/2026-11-11-avisos-inmet-design.md`.

1. Criar adaptador de RSS e CAP com parser XML seguro, limite de tamanho, destinos fixos, concorrência limitada, timeout e cache; validar vigência, região, versões e cancelamentos; sinalizar cobertura não confirmada e falhas parciais. Testar entradas válidas, inválidas, futuras, expiradas, fora da cidade, atualizações, cancelamentos e falhas.
2. Expor `GET /api/alerts` usando o limite municipal e testar sucesso e falhas sem mascarar indisponibilidade.
3. Criar central real acessível, com carregamento, erro, lista e detalhe seguro; conectar navegação desktop e mobile, mantendo simulação independente.
4. Documentar os limites e a fonte; executar testes, build e consulta real, além de verificar a central no navegador quando possível.
