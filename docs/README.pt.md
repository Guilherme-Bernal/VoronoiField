# VoronoiField (PT-BR)

> AR de Analise Tatica em Tempo Real (futebol)

## A ideia

Aplicacao em Realidade Aumentada que, ao apontar o celular/tablet para
um campo desenhado ou uma maquete sobre a mesa, sobrepoe formacao
tatica, linhas de passe e zonas de pressao - ao vivo e interativo,
com o usuario movendo os jogadores.

## Stack

- React + Vite + TypeScript
- React Three Fiber (R3F) + drei - renderizacao 3D
- MindAR - tracking de imagem (marcador AR)
- d3-delaunay - calculo do diagrama de Voronoi (zonas de pressao)
- Vitest + Testing Library - testes automatizados
- ESLint (com react-hooks) - qualidade de codigo

## Estrutura

VoronoiField/
├── src/
│   ├── tactics/
│   │   ├── engine.ts          # calculo puro (Voronoi + linhas de passe), testado
│   │   └── __tests__/
│   └── components/
│       ├── ar/                # integracao MindAR + R3F
│       └── common/            # UI generica
├── markers/                    # instrucoes + targets.mind (gerado)
└── docs/                       # este README em PT/EN/ES

## Como rodar

npm install
npm run dev

Abre http://localhost:5173

## Testes

npm run test        # roda uma vez
npm run test:watch  # modo watch
npm run test:ui     # interface visual do Vitest

## Marcador AR

O modo AR precisa de um marcador compilado - veja markers/README.md.

## Licenca

AGPL-3.0 - ver LICENSE na raiz do repositorio. Isso significa que, se
alguem modificar este projeto e disponibiliza-lo via rede/servidor
(inclusive uma versao web publica), e obrigado a disponibilizar o
codigo-fonte modificado tambem.
