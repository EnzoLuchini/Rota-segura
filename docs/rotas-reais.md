# Consulta real e simulação

O projeto oferece a consulta real em `/` e o protótipo fictício em `/simulacao`. A primeira versão atende trajetos de carro dentro do município de São Paulo. A simulação continua guardando seus dados apenas no navegador.

## Executar localmente

Use Node.js 24 ou mais recente e instale as dependências com `npm install`. Crie uma chave de API no [HeiGIT](https://account.heigit.org/) e habilite os serviços necessários de geocodificação e rotas, conforme o painel do fornecedor. Crie um arquivo `.env` na raiz, que não deve ser enviado ao repositório:

```text
HEIGIT_API_KEY=sua_chave_aqui
```

Em um terminal execute `npm run api`; em outro, `npm run dev`. Abra o endereço informado pelo Vite. Sem a chave, a camada pública de drenagem ainda pode ser consultada, mas a busca e as rotas não funcionam. Serviços externos estão sujeitos a disponibilidade, termos e cotas. Os endereços de busca e as coordenadas da rota são enviados ao HeiGIT para consulta; a chave fica no servidor.

O proxy `/api` é configurado para o servidor de desenvolvimento Vite. Para publicar, hospede o backend e configure um proxy de mesma origem para `/api`, além de servir `index.html` para `/simulacao`; essa configuração de produção ainda não foi implementada. O servidor local escuta somente em `127.0.0.1`.

Na consulta real, a pessoa pode optar por usar a localização atual como origem. A permissão é solicitada pelo navegador somente ao acionar o botão; é feita uma leitura pontual, sem rastreamento contínuo. As coordenadas são enviadas ao backend para verificar o limite de São Paulo e ao HeiGIT ao comparar rotas. O recurso exige suporte e permissão do navegador e contexto seguro (HTTPS ou localhost); se não estiver disponível, é possível informar um endereço.

Para reduzir consultas repetidas, consultas de drenagem e ocorrências na mesma área podem ser reutilizadas em memória por um minuto. Uma comparação com todas as fontes disponíveis pode ser reutilizada em memória por até dois minutos para a mesma origem e destino; a interface informa quando isso ocorre. Respostas com fontes indisponíveis ou parciais não são guardadas no cache de rotas. Os caches não são gravados no armazenamento do navegador e não eliminam a espera da primeira consulta ou das atualizações de áreas ainda não consultadas.

## Fontes e limites

- O GeoSampa fornece a rede `drenagem`: linhas sólidas mostram trechos cadastrados, tracejadas identificam os registrados como subterrâneos. É uma representação cartográfica, não medição de nível de água. O mapa consulta apenas a área visível e informa quando o resultado é truncado.
- O GeoSampa fornece `risco_hidrologico`: polígonos de risco em assentamentos precários, com datas de vistoria quando disponíveis. Sua cobertura é limitada e não representa ocorrências atuais ou classificação oficial da via. A extensão da rota dentro dos polígonos é experimental, não é probabilidade de alagamento nem garantia de segurança. Sobreposições de polígonos não são contadas duas vezes.
- A camada opcional de registros históricos usa `risco_ocorrencia_alagamento` e `risco_ocorrencia_inundacao`, com ocorrências da Defesa Civil disponibilizadas pelo GeoSampa. Os catálogos descrevem a camada do ano corrente; dados de anos anteriores são oferecidos separadamente para download. As datas da ocorrência e da carga aparecem no mapa quando disponíveis. Na rota são relacionados os registros a até 100 m da linha: essa distância é uma hipótese experimental, não a precisão comprovada dos dados. Os pontos não indicam uma ocorrência atual nem comprovam cobertura completa. [Alagamentos](https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/srv/api/records/432c06b1-03a1-4b1f-9210-423e1b58e869) · [inundações](https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/intranet/api/records/9d08d20d-f6c7-463d-a349-c28c47babff2).
- O mapa mostra, quando ativado, o cenário de mancha de inundação potencial com período de retorno de 5 anos. Isso **não** significa ocorrências dos últimos 5 anos e não é uma previsão atual. A visualização usa uma imagem WMS da área visível do GeoSampa; ela depende da disponibilidade e da escala atendida pelo serviço. A análise consulta a geometria de cada rota em blocos e destaca segmentos que cruzam essa mancha; o trecho destacado pode ser maior que a parte efetivamente dentro dela. Limites e falhas são informados. Os círculos ao abrir registros históricos representam apenas um raio de referência de 100 m, não os limites reais de uma inundação. Essas evidências são informativas e não mudam a recomendação existente. [Metadados das manchas](https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/srv/api/records/3a7a16b1-369f-49e5-82e9-ecdcc3341535).
- O limite municipal vem da camada `municipios_sp` da SP Águas. O provedor de rotas usa dados do OpenStreetMap. A atribuição cartográfica está no mapa e na página.
- Não há medição de chuva ao vivo, notificações reais ou cálculo para pedestres nesta versão. Falha na camada de risco resulta em exposição indisponível, não zero. A rota sugerida só compara a extensão na camada disponível, sem considerar riscos fora dela.

## Verificação

Execute `npm test`, `npm run test:ui` e `npm run build`. Para conferir ponta a ponta, configure sua chave e pesquise dois pontos dentro do município. Verifique as alternativas recebidas e suas evidências; um serviço pode retornar uma única rota ou não retornar alternativas. O funcionamento com uma chave depende do acesso à conta, cota e disponibilidade do fornecedor.
