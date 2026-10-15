# VoronoiField

**Análise tática de futebol em Realidade Aumentada.** Projeto acadêmico (Facens, UPX).

[Português](README.md) · [English](docs/README.en.md) · [Español](docs/README.es.md)

**Demonstração online:** https://voronoi-field.vercel.app

## O problema

Uma prancheta tática mostra onde os jogadores estão, mas não mostra o que essa posição *significa*: quem controla qual parte do campo, quem está livre para receber um passe, quem está em impedimento. O VoronoiField transforma a prancheta numa ferramenta de pergunta e resposta: **"e se eu mover este jogador?"** e, na hora, o resultado aparece.

## O que o app faz

- **Zonas de domínio (Voronoi):** pinta cada ponto do campo com a cor do time cujo jogador está mais perto e calcula a porcentagem de campo de cada time.
- **Melhor passe:** para quem está com a bola, aponta o passe com melhor combinação de linha livre, espaço do receptor, ganho de campo e distância.
- **Impedimento:** desenha a linha (penúltimo defensor ou bola) e marca quem está à frente dela.
- **Resultado da jogada:** compara o antes e o depois e escreve a conclusão. Exemplo: "o domínio do azul subiu de 48% para 57%, a bola foi de A11 para A8 e 2 jogadores azuis ficaram em impedimento."
- **Cenários prontos:** posição inicial, linha alta, bloco baixo, contra-ataque e armadilha de impedimento, para alterar à mão.
- **Formações:** 4-4-2, 4-3-3 e 3-5-2, mais os modos 4 x 4 (leitura fácil) e 11 x 11 (campo completo).
- **Jogada animada, rastro e mapa de calor** do movimento dos jogadores.
- **Compartilhar por link:** a tática (e os passos da jogada) vai codificada na URL.

## Como usar

| Rota | Para que serve |
| --- | --- |
| `/sim` | Simulador 2D/3D no navegador, sem câmera. Melhor lugar para explorar. |
| `/ar` | Realidade Aumentada: aponte a câmera para o marcador e o campo aparece sobre ele. |
| `/marcador` | Mostra o marcador para imprimir ou abrir em outra tela. |

Roteiro curto de demonstração: escolha "Armadilha de impedimento" no simulador, leia o painel **Resultado**, arraste um jogador e veja a conclusão mudar. Depois repita no AR.

**AR no celular:** precisa de HTTPS e permissão de câmera (o link online já atende). O marcador está em `public/markers/campo-marcador.png`.

## Como funciona

As posições são normalizadas (0 a 1) no campo. O motor tático (`src/tactics`) calcula o diagrama de Voronoi com `d3-delaunay`, a pontuação dos passes e a linha de impedimento. A cena 3D (`src/lib/ar`, Three.js) desenha tudo sobre o marcador, que é rastreado pelo MindAR (biblioteca incluída em `src/vendor/mind-ar`).

## Limitações

- O modelo usa **só posições**, sem velocidade nem direção dos jogadores.
- "Domínio" é **controle de espaço**, não posse de bola.
- A "Jogada" automática é roteirizada e serve para ilustrar.
- Não foi validado com dados reais de partidas.

## Tecnologias

React 19, Vite, TypeScript, Zustand, React Router, Three.js, d3-delaunay, MindAR, Vitest.

## Rodando localmente

```bash
git clone https://github.com/Guilherme-Bernal/VoronoiField.git
cd VoronoiField
npm install
npm run dev
```

Abra http://localhost:5173. Outros comandos: `npm run build`, `npm run lint`, `npm run preview`.

## Testes

```bash
npm run test
```

## Publicação

O projeto roda como site estático (por exemplo na Vercel). O arquivo `vercel.json` reescreve todas as rotas para `index.html`, para `/sim`, `/ar` e `/marcador` funcionarem ao recarregar a página.

## Licença

AGPL-3.0. Veja [LICENSE](LICENSE).
