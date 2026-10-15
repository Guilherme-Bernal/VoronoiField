import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Legend } from "../Legend";
import { LEGEND_ITEMS } from "../legendItems";

describe("Legend", () => {
  it("explica cada elemento da analise", () => {
    render(<Legend defaultOpen />);
    expect(screen.getByText("Como ler esta tela")).toBeTruthy();
    LEGEND_ITEMS.forEach((item) => {
      expect(screen.getByText(item.title)).toBeTruthy();
    });
    expect(screen.getByText(/domínio de espaço/)).toBeTruthy();
    expect(screen.getByText(/não considera velocidade/)).toBeTruthy();
  });

  it("comeca fechada por padrao e abre quando pedido", () => {
    const { container, rerender } = render(<Legend />);
    expect(container.querySelector("details")!.open).toBe(false);
    rerender(<Legend defaultOpen />);
    expect(container.querySelector("details")!.open).toBe(true);
  });
});
