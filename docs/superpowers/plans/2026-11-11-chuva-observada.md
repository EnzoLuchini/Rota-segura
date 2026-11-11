# Chuva observada — plano de implementação

**Objetivo:** preparar consulta e camada informativa de estações de chuva do SIBH para São Paulo.

**Especificação:** `docs/superpowers/specs/2026-11-11-chuva-observada-design.md`.

1. Criar adaptador SIBH com validação de registros, município, horários e cache de um minuto; testar dados ausentes, antigos, resposta inválida e falhas. Os registros normalizados contêm `id`, `name`, `coordinates`, `value`, `start`, `end`, `owner` e `stale`.
2. Expor `GET /api/rain` com disponibilidade explícita. Após o teste local, decidiu-se usar a integração por padrão enquanto as condições de reutilização continuam pendentes de confirmação; manter opção de desativação. Testar a rota desativada, sucesso e falha.
3. Conectar camada opcional e legenda ao mapa real; testar carregamento, vazio, erro, observações antigas e remoção da camada.
4. Documentar fonte, limites, configuração experimental e validação pendente. Executar testes, build e consulta de verificação com configuração experimental.

Os dados não participam do cálculo de rotas. Não alterar fluxos existentes nem incluir credenciais. Preservar alterações existentes no diretório do usuário.
