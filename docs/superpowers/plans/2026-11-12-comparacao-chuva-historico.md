# Comparação experimental com chuva e histórico

**Objetivo:** aplicar a fórmula aprovada à comparação real, com dados rastreáveis e bloqueio de recomendação quando as fontes forem insuficientes.

**Projeto:** [Especificação aprovada](../specs/2026-11-12-comparacao-chuva-historico-design.md). Trabalhar na pasta atual e preservar alterações locais.

1. **Cálculo** — Criar testes que falhem para amostragem de 250 m, estações até 3 km, validade de 90 minutos, deduplicação e pontuação 50/30/20; implementar a análise pura e verificar fronteiras, empate e dados ausentes.
2. **API** — Testar integração das três fontes, falhas e desativação; consultar chuva e histórico em paralelo, preservar evidências e responder com motivo, pontuação e validade. Atualizar testes antigos que especificam a regra anterior.
3. **Interface e cache** — Testar os valores, estações, motivos e limites de validade; apresentar as informações e impedir reaproveitamento de respostas parciais ou com chuva vencida.
4. **Verificação** — Rodar testes de lógica/API, interface e build; validar trajetos e visualização em desktop e celular, registrar limites e atualizar documentação. A publicação não está incluída sem solicitação.

## Verificação de 12/11/2026

- Consulta local com dados reais; em desktop, alternativas empatadas sem recomendação. Em viewport de 390 × 844, fonte de chuva indisponível produziu mensagem e ausência de recomendação; controles e explicação foram inspecionados. Indicadores nos cartões foram separados visualmente após a revisão.
- Passaram `npm test` (58), `npm run test:ui` (85) e `npm run build`. Os pesos, raios e cobertura permanecem experimentais; a consulta não garante segurança.
