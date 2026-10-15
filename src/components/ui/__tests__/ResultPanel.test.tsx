import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTacticalStore } from "../../../state/tacticalStore";
import { ResultPanel } from "../ResultPanel";
import { ScenarioPicker } from "../ScenarioPicker";

describe("painel de resultado e cenarios", () => {
  beforeEach(() => {
    useTacticalStore.getState().loadMatch("4-4-2", "4-3-3");
  });

  it("comeca sem mudanca", () => {
    render(<ResultPanel defaultOpen />);
    expect(screen.getByText(/Ainda não há mudança/)).toBeTruthy();
  });

  it("escolher um cenario aplica as posicoes e compara com a posicao inicial", () => {
    render(
      <>
        <ScenarioPicker defaultOpen />
        <ResultPanel defaultOpen />
      </>
    );
    fireEvent.click(screen.getByText("Armadilha de impedimento"));
    const s = useTacticalStore.getState();
    expect(s.ballCarrierId).toBe("A8");
    expect(s.players.find((p) => p.id === "A10")!.x).toBeCloseTo(0.72, 5);
    // O ponto de partida e a posicao inicial padrao, nao o proprio cenario.
    expect(s.baseline?.players.find((p) => p.id === "A10")!.x).toBeCloseTo(0.44, 5);
    expect(screen.getByText(/O que observar/)).toBeTruthy();
    expect(screen.getByText(/Em relação ao ponto de partida/)).toBeTruthy();
    expect(screen.getByText(/2 jogadores azuis em impedimento \(A10, A11\)/)).toBeTruthy();
  });

  it("escolher a posicao inicial nao mostra mudanca", () => {
    render(
      <>
        <ScenarioPicker defaultOpen />
        <ResultPanel defaultOpen />
      </>
    );
    fireEvent.click(screen.getByText("Posição inicial"));
    expect(screen.getByText(/Ainda não há mudança/)).toBeTruthy();
  });

  it("botao de ponto de partida so habilita quando ha mudanca", () => {
    const { rerender } = render(<ResultPanel defaultOpen />);
    const button = screen.getByText("Usar posição atual como ponto de partida") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    useTacticalStore.getState().setBallCarrier("A8");
    rerender(<ResultPanel defaultOpen />);
    expect(
      (screen.getByText("Usar posição atual como ponto de partida") as HTMLButtonElement).disabled
    ).toBe(false);
  });
});
