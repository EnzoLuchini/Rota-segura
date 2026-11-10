# Consulta real e simulação

O projeto oferece a consulta real em `/` e o protótipo fictício em `/simulacao`. A primeira versão atende trajetos de carro dentro do município de São Paulo. A simulação continua guardando seus dados apenas no navegador.

## Executar localmente

Use Node.js 24 ou mais recente e instale as dependências com `npm install`. Crie uma chave de API no [HeiGIT](https://account.heigit.org/) e habilite os serviços necessários de geocodificação e rotas, conforme o painel do fornecedor. Crie um arquivo `.env` na raiz, que não deve ser enviado ao repositório:

```text
HEIGIT_API_KEY=sua_chave_aqui
```

Em um terminal execute `npm run api`; em outro, `npm run dev`. Abra o endereço informado pelo Vite. Sem a chave, a camada pública de drenagem ainda pode ser consultada, mas a busca e as rotas não funcionam. Serviços externos estão sujeitos a disponibilidade, termos e cotas. Os endereços de busca e as coordenadas da rota são enviados ao HeiGIT para consulta; a chave fica no servidor.

O proxy `/api` é configurado para o servidor de desenvolvimento Vite. Para publicar, hospede o backend e configure um proxy de mesma origem para `/api`, além de servir `index.html` para `/simulacao`; essa configuração de produção ainda não foi implementada. O servidor local escuta somente em `127.0.0.1`.

## Fontes e limites

- O GeoSampa fornece a rede `drenagem`: linhas sólidas mostram trechos cadastrados, tracejadas identificam os registrados como subterrâneos. É uma representação cartográfica, não medição de nível de água. O mapa consulta apenas a área visível e informa quando o resultado é truncado.
- O GeoSampa fornece `risco_hidrologico`: polígonos de risco em assentamentos precários, com datas de vistoria quando disponíveis. Sua cobertura é limitada e não representa ocorrências atuais ou classificação oficial da via. A extensão da rota dentro dos polígonos é experimental, não é probabilidade de alagamento nem garantia de segurança. Sobreposições de polígonos não são contadas duas vezes.
- O limite municipal vem da camada `municipios_sp` da SP Águas. O provedor de rotas usa dados do OpenStreetMap. A atribuição cartográfica está no mapa e na página.
- Não há medição de chuva ao vivo, notificações reais ou cálculo para pedestres nesta versão. Falha na camada de risco resulta em exposição indisponível, não zero. A rota sugerida só compara a extensão na camada disponível, sem considerar riscos fora dela.

## Verificação

Execute `npm test`, `npm run test:ui` e `npm run build`. Para conferir ponta a ponta, configure sua chave e pesquise dois pontos dentro do município. Verifique as alternativas recebidas e suas evidências; um serviço pode retornar uma única rota ou não retornar alternativas. O funcionamento com uma chave depende do acesso à conta, cota e disponibilidade do fornecedor.
