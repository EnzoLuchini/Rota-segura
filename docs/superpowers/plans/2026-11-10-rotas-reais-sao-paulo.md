# Rotas reais em São Paulo — plano de implementação

> Execução nesta sessão, preservando as alterações existentes no projeto.

**Objetivo:** consultar alternativas de carro, apresentar evidências geográficas reais e manter o protótipo em `/simulacao`.

**Arquitetura:** API Node.js com adaptadores isolados para geocodificação/rotas e GeoSampa; interface React separada para a experiência real. Geometrias e cobertura são verificadas antes de qualquer recomendação. Hidrografia é contexto visual.

**Tecnologias:** Node.js, React, Vite, Leaflet, GeoJSON e fontes públicas; chave do provedor apenas no servidor.

**Design:** `docs/superpowers/specs/2026-11-10-rotas-reais-sao-paulo-design.md`.

## Etapas

- [ ] Validar dados e serviços: camadas, esquema, limites, condições de uso, projeção e resultados reais de amostra; incluir drenagem como contexto e registrar limitações.
- [ ] Criar testes de comparação espacial para limites, sobreposição e indisponibilidade; implementar adaptadores e API com validação, timeout e respostas explícitas para falhas.
- [ ] Separar o protótipo em `/simulacao` e criar experiência real com busca, rotas, evidências e hidrografia; cobrir ausência de chave e estados de erro sem usar dados fictícios.
- [ ] Documentar configuração, atribuições, custos e limitações; executar testes, build e testes manuais possíveis, informando dependências externas não verificadas.

Revisão: coordenadas fora do município, rota que sai e retorna, geometrias incompletas, polígonos sobrepostos e camadas externas indisponíveis nunca podem produzir uma recomendação enganosa.
