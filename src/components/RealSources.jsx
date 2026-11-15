import React from 'react';

export default function RealSources({onBack}) {
  return <>
    <button className="back" onClick={onBack}>← Voltar para o mapa</button>
    <span className="overline">Transparência</span><h1>Fontes e metodologia</h1>
    <p className="intro">A comparação usa informações disponíveis para trajetos de carro no município de São Paulo. A cobertura é limitada e a ausência de registros não garante segurança.</p>
    <h2>Como a comparação funciona</h2>
    <p>A pontuação experimental combina áreas de risco mapeadas (50%), registros históricos próximos (30%) e chuva observada nas estações associadas (20%). Os indicadores são normalizados entre as alternativas da mesma consulta.</p>
    <p>O resultado não é uma previsão de alagamento nem uma probabilidade de risco. Fontes incompletas, medições antigas ou ausência de cobertura impedem uma recomendação; empates e diferenças pequenas também podem impedir a escolha.</p>
    <h2>Fontes consultadas</h2>
    <ul>
      <li>HeiGIT e OpenStreetMap: busca de endereços e trajetos.</li>
      <li>GeoSampa e Defesa Civil: áreas de risco, drenagem, registros históricos e mancha de inundação modelada. O histórico não descreve uma ocorrência atual.</li>
      <li>SP Águas / SIBH: chuva observada em estações; medições pontuais não descrevem necessariamente a condição de uma via.</li>
      <li>INMET: avisos meteorológicos para áreas; não confirmam alagamentos em ruas específicas.</li>
    </ul>
    <p>A mancha de inundação com período de retorno de 5 anos é um cenário modelado, não uma previsão atual nem o histórico dos últimos cinco anos; ela não altera a pontuação.</p>
    <p>Os pesos e limites são experimentais e precisam de validação com especialistas. Disponibilidade, atualização e condições de uso das fontes podem variar.</p>
    <a href="https://www.cgesp.org/v3/alagamentos.jsp" target="_blank" rel="noopener noreferrer">Consultar pontos de alagamento no CGE ↗</a>
  </>;
}
