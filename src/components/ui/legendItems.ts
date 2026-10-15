export type Swatch = "teamA" | "teamB" | "pass" | "blocked" | "best" | "ball" | "offside";

export const LEGEND_ITEMS: { swatch: Swatch[]; title: string; text: string }[] = [
  {
    swatch: ["teamA", "teamB"],
    title: "Zonas azul e vermelha",
    text: "Cada ponto do campo recebe a cor do time do jogador mais próximo. O percentual no placar é a fatia do campo de cada time, ou seja, domínio de espaço (não é posse de bola nem placar do jogo).",
  },
  {
    swatch: ["pass"],
    title: "Linha amarela",
    text: "Passe possível entre dois companheiros, sem adversário no caminho.",
  },
  {
    swatch: ["blocked"],
    title: "Linha cinza tracejada",
    text: "Passe bloqueado: um adversário está perto demais da linha.",
  },
  {
    swatch: ["best"],
    title: "Linha verde grossa",
    text: "Melhor passe de quem está com a bola. Pesa linha livre, espaço do receptor, quanto avança e distância curta. Quem está impedido não entra.",
  },
  {
    swatch: ["ball"],
    title: "Bolinha branca e anel verde",
    text: "Quem está com a bola. Toque em outro jogador (sem arrastar) para passar a bola a ele.",
  },
  {
    swatch: ["offside"],
    title: "Linha vermelha",
    text: "Linha de impedimento: o penúltimo defensor ou a bola, o que estiver mais avançado. Um anel vermelho marca quem passou dela no campo adversário.",
  },
];
