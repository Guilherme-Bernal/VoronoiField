export type TourContext = "sim" | "ar";

export interface TourStep {
  id: string;
  title: string;
  text: string;
  /** Itens curtos listados abaixo do texto. */
  points?: string[];
  /** Valor de data-tour do elemento a destacar na tela (opcional). */
  target?: string;
  /** Mini-campo para praticar dentro do passo. */
  demo?: "practice";
  link?: { to: string; label: string };
  /** Último passo: mostra o botão do questionário SUS quando configurado. */
  survey?: boolean;
}

const SIM_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao VoronoiField",
    text:
      "Este é um campo de futebol visto de cima, com o time azul contra o vermelho. " +
      "Em cerca de 2 minutos você aprende a usar. Dá para fechar este guia a qualquer momento " +
      "e abri-lo de novo no botão Como usar.",
  },
  {
    id: "move",
    title: "Mexa nos jogadores",
    text:
      "Toque num jogador e arraste para outro lugar. Tudo se recalcula na hora. " +
      "Toque num jogador sem arrastar para dar a bola a ele.",
    target: "board",
  },
  {
    id: "practice",
    title: "Experimente aqui",
    text:
      "Arraste o jogador azul com anel amarelo (ou use as setas do teclado) e veja o percentual de campo mudar.",
    demo: "practice",
  },
  {
    id: "control",
    title: "Quem controla mais campo",
    text:
      "A barra mostra que fatia do campo está mais perto dos jogadores de cada time. " +
      "É uma medida de proximidade, não de posse de bola.",
    target: "control",
  },
  {
    id: "layers",
    title: "Camadas",
    text: "Ligue e desligue o que quiser ver sobre o campo.",
    points: [
      "Zonas: colorem o campo por time.",
      "Passes: linhas amarelas estão livres e cinzas estão bloqueadas.",
      "Impedimento: mostra a linha e quem está à frente dela.",
    ],
    target: "layers",
  },
  {
    id: "scenarios",
    title: "Cenários prontos",
    text:
      "Escolha uma situação, como o Contra-ataque do azul, e depois mexa nos jogadores para ver o que muda.",
    target: "scenarios",
  },
  {
    id: "result",
    title: "Resultado da jogada",
    text:
      "Compara a posição inicial com a atual e explica a mudança em uma frase.",
    target: "result",
  },
  {
    id: "ar",
    title: "Realidade aumentada",
    text:
      "No celular, toque em Abrir em AR, permita a câmera e aponte para o campo impresso " +
      "ou para o marcador aberto em outra tela.",
    link: { to: "/marcador", label: "Abrir o marcador" },
  },
  {
    id: "done",
    title: "Pronto! Agora dê sua opinião",
    text:
      "Explore à vontade. Quando terminar, responda ao questionário de usabilidade (SUS), " +
      "com 10 perguntas rápidas sobre a sua experiência.",
    survey: true,
  },
];

const AR_STEPS: TourStep[] = [
  {
    id: "camera",
    title: "Permita a câmera",
    text:
      "O navegador vai pedir acesso à câmera: toque em Permitir. A câmera só funciona em endereço seguro (https). " +
      "O vídeo é processado no seu aparelho e não é enviado a lugar nenhum.",
  },
  {
    id: "marker",
    title: "Aponte para o marcador",
    text:
      "Abra o marcador em outra tela ou imprima em A4. Aponte a câmera a cerca de 25 a 60 cm, com boa iluminação.",
    link: { to: "/marcador", label: "Abrir o marcador" },
  },
  {
    id: "found",
    title: "Espere o campo aparecer",
    text:
      "Quando o campo for detectado, jogadores e zonas surgem sobre ele. Se sumirem, volte a apontar " +
      "para o marcador e evite deixar o celular muito inclinado.",
  },
  {
    id: "move",
    title: "Mexa nos jogadores",
    text:
      "Toque num jogador para dar a bola e arraste para mover. O placar e as zonas se atualizam na hora.",
  },
  {
    id: "menus",
    title: "Menus",
    text:
      "Aqui ficam o Modo (4 x 4 ou 11 x 11), os Cenários, o Resultado, Minhas jogadas e Como ler esta tela. " +
      "Abra um de cada vez.",
    target: "ar-panels",
  },
  {
    id: "which-camera",
    title: "Imagem da câmera errada?",
    text:
      "Se a imagem vier da câmera frontal, escolha a câmera traseira no seletor de câmera, no canto da tela.",
  },
  {
    id: "done",
    title: "Pronto! Agora dê sua opinião",
    text:
      "Quando terminar de explorar, responda ao questionário de usabilidade (SUS), " +
      "com 10 perguntas rápidas sobre a sua experiência.",
    survey: true,
  },
];

export const TOUR_STEPS: Record<TourContext, TourStep[]> = {
  sim: SIM_STEPS,
  ar: AR_STEPS,
};