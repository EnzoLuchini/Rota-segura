# Sincronização de rotas frequentes

**Objetivo:** salvar, editar e excluir rotas da conta no Supabase, mantendo rotas de visitante locais e separadas.

**Arquitetura:** cada rota pertence a um usuário do Supabase Auth; RLS restringe todas as operações ao titular. O cliente aguarda confirmação do servidor antes de informar sucesso. Rotas locais não são importadas automaticamente.

- [x] Testar isolamento da interface por conta, falhas de carregamento e gravação, e preservação dos dados de visitante.
- [x] Criar migração com tabela, permissões e políticas por proprietário.
- [x] Integrar operações assíncronas às telas e indicar onde cada rota é armazenada.
- [x] Verificar testes, build e acesso ao projeto remoto; aplicar migração após verificar o destino e o resultado.

Em 17/11/2026, a tabela e as políticas foram verificadas em produção com uma transação revertida. Uma conta temporária foi criada para testar entrada e leitura em dois clientes e removida após o teste. A versão foi publicada na Vercel; não houve teste visual entre dispositivos físicos.
