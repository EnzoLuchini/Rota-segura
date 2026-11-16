# Web Push para rotas frequentes

Implementação em desenvolvimento: não está validada ponta a ponta nem configurada para produção. A consulta usa o polígono dos avisos vigentes do INMET e a geometria salva da rota; o aviso é meteorológico para a área, não confirmação de alagamento na via. A cobertura do feed não é garantida.

## Banco

O projeto contém uma migração em `supabase/migrations/` que cria `push_devices` (credencial do dispositivo em hash, inscrição e rotas monitoradas) e `push_deliveries` (deduplicação por dispositivo, rota, aviso e viagem). As tabelas têm RLS habilitada, nenhum acesso concedido aos papéis públicos e acesso reservado ao servidor. A migração ainda precisa ser aplicada e validada em ambiente adequado; não criar políticas públicas para essas tabelas.

Para desenvolvimento, iniciar Docker Desktop, usar `npx supabase start` e aplicar as migrações localmente conforme a versão instalada do CLI. Para o projeto remoto, autenticar com `npx supabase login`, vincular o projeto e revisar o resultado de `npx supabase db push --remote --dry-run` antes de aplicar. A conexão e o projeto de destino devem ser verificados antes de qualquer alteração remota.

## Variáveis somente no servidor

- `SUPABASE_URL` e `SUPABASE_SECRET_KEY`: endereço do projeto e chave secreta para acesso pelo backend. Nunca usar prefixo `VITE_` na chave secreta.
- `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`: par estável de chaves Web Push; a pública é fornecida ao navegador pela API. Trocar o par exige renovar as inscrições.
- `VAPID_SUBJECT`: contato válido do administrador, como `mailto:contato@exemplo.com`.
- `CRON_SECRET`: valor aleatório forte usado pelo agendador no cabeçalho `Authorization: Bearer ...`; nunca incluir no código ou no navegador.

Sem as variáveis, a interface informa indisponibilidade. É necessário proteger o endpoint de cadastro contra abuso com controles adequados na infraestrutura antes da ativação pública.

## Agendamento e regras

Um agendador externo deve chamar `GET /api/push/run` com `Authorization: Bearer <CRON_SECRET>` ao menos a cada 15 minutos, em HTTPS. Não há agendamento configurado automaticamente neste repositório. O cron do plano Hobby da Vercel não tem frequência suficiente; confirme plano, custos e limites antes de escolher o agendador. O processamento considera a antecedência escolhida, dia e horário de Brasília, e tenta evitar envios repetidos por viagem e aviso. A ida e a volta usam a geometria salva da ida; o retorno pode seguir outro trajeto. Falhas temporárias podem ser reprocessadas; uma interrupção após a reserva e antes do envio ainda exige tratamento adicional. Inscrições sem sincronização por 90 dias são removidas quando o processador é executado; registros de envio são removidos após 30 dias.

É necessário validar a execução concorrente, duração e escala, retenção, falhas parciais, renovação das inscrições e uso de recursos antes de depender dos alertas. Notificações não substituem fontes oficiais e não têm garantia de entrega.

## Dispositivos

No iPhone/iPad, adicionar o site à Tela de Início e abri-lo pelo ícone antes de ativar alertas. No Android, usar navegador compatível e permitir notificações. Cada instalação é independente e a autenticação não é necessária. Rotas antigas sem geometria devem ser consultadas e salvas novamente.

Para verificar, usar HTTPS, configurar banco, chaves e agendador em ambiente de teste, permitir notificações, salvar e ativar uma rota dentro de uma área com aviso válido e testar envio com aplicativo fechado. Repetir em Android e iOS físicos, incluindo permissão negada, pausa, exclusão, indisponibilidade da fonte e falhas de rede. Sem essa verificação, testes automatizados não comprovam entrega de push.
